---
title: Local Development
description: Run your code on your machine against an environment's real upstreams by tunnelling a workload's dependencies to localhost with occ remote
---

# Local Development

`occ remote` gives you a fast inner loop. It resolves a workload's declared [endpoint](./dependencies/endpoints.md) and [resource](./dependencies/resources.md) dependencies for one environment, opens a local TCP listener for each **dialable address** they resolve to, and starts a subshell whose environment variables point at those listeners, so your code runs on your machine against the environment's **real upstreams** without deploying it first. Listeners are per address, not per dependency: a dependency that declares no dialable address opens none, and one that declares several opens several.

Nothing is checked about the component you are running. It does not need to exist in OpenChoreo, so you can tunnel dependencies before a component's first deploy, and try a new dependency before committing it.

:::note
`occ remote` is available from OpenChoreo **v1.3.0**. It is **already enabled** if your cluster was installed with the [k3d quick start](../getting-started/try-it-out/on-k3d-locally.mdx), whose values files turn it on. On any other install it is off until your platform team enables it on both planes. See [Prerequisites](#prerequisites).
:::

## How It Works

When you run `occ remote` against one or more local workload files:

1. `occ` reads each file from disk and sends the dependencies it declares, plus the target environment, to the control plane. The control plane resolves them against the providers' published state and returns a short-lived signed **capability**.
2. For each dialable address it may reach, `occ` opens a `127.0.0.1:<random-port>` listener and renders the workload's `envBindings` against it, so `DB_HOST`/`DB_PORT` or `BACKEND_URL` name the local listener instead of the in-cluster address. A dependency that declares no dialable address opens no listener, and one that declares several opens one listener per address.
3. Traffic to a local listener is tunnelled to a **remote-agent**, which dials the dependency for you. That agent runs in the data-plane namespace the dependency is dialed from: the provider's project and environment for an endpoint dependency, your own project's for a resource. The control plane signs the capability but is not on the byte path.
4. `occ` starts a subshell with those variables exported. Exiting the subshell closes every listener and tunnel, and deletes any files the session materialized.

The agent is provisioned on demand, shared by everyone working on the same project and environment, and reaped once idle. You do not manage it, and no key or certificate setup is required of you: each agent's TLS certificate is generated on first use and pinned by `occ`.

## Prerequisites

- **The feature is enabled on your cluster.** The k3d quick start enables it for you, with an entrypoint of `127.0.0.1:30443`. Elsewhere it is a platform-team setting: `openchoreoApi.config.remoteConnect.enabled` on the control plane (with an `entrypointAddress` your machine can reach) and `remoteAgentRouter.enabled` on each data plane. The two halves fail at different points: with `openchoreoApi.config.remoteConnect.enabled` false, `occ remote` fails during resolution; with `remoteAgentRouter.enabled` false on the target data plane, resolution succeeds and startup fails while dialing the router, after retrying for **30 seconds**. See [Enabling Local Development](../platform-engineer-guide/local-development-setup.mdx).
- **`occ` v1.3.0+**, with `occ login` completed and a context selected.
- **Your role grants the dependency.** See [Permissions](#permissions).
- **The dependencies are provisioned in the target environment.** Provider components must be deployed, and any resource dependency's `ResourceReleaseBinding` must report `Ready`.

## Usage

```bash
occ remote <workload.yaml> [<workload.yaml>...] --env <environment> [--namespace <ns>]
```

`--env` is required. The namespace comes from each file's `metadata.namespace`, falling back to `--namespace`.

### Endpoint Dependencies

Given a workload that declares an [endpoint dependency](./dependencies/endpoints.md):

```yaml
dependencies:
  endpoints:
    - project: greeter
      component: greeter-service
      name: http
      visibility: namespace
      envBindings:
        address: HTTP_SERVICE_URL
```

Run:

```bash
occ remote web-app/workload.yaml --namespace default --env development
```

```text
Connecting to default/web-app (development)...
  ep/greeter/greeter-service/http -> 127.0.0.1:53412  (endpoint)
```

The header names the workload's own **project and component** (`spec.owner`), not its namespace, and there is one per file you passed. Each dependency line below it is keyed `ep/<provider project>/<component>/<endpoint>`. The provider's project is part of the key because two projects may each own a component of the same name.

Inside the subshell, `HTTP_SERVICE_URL` is `http://127.0.0.1:53412`, tunnelled to the `greeter-service` endpoint in `development`. All four bindings render exactly as they would in the cluster: `address` keeps the endpoint's scheme and base path, and `host`, `port`, and `basePath` are set individually if you bound them. Cross-project dependencies work the same way, with only the provider's project changing.

:::note
Endpoint **visibility** does not restrict `occ remote`. Access is decided per dependency by your role, not by the endpoint's visibility level. What the declared `visibility` does decide is _which published address_ is tunnelled: `project` and `namespace` resolve to the provider's in-cluster Service URL, while `external` resolves to its gateway URL.
:::

### Resource Dependencies

Given a workload that declares a [resource dependency](./dependencies/resources.md):

```yaml
dependencies:
  resources:
    - ref: local-dev-postgres
      envBindings:
        host: DB_HOST
        port: DB_PORT
        username: DB_USER
        password: DB_PASSWORD
        database: DB_NAME
```

```bash
occ remote db-api/workload.yaml --namespace default --env development
```

```text
Connecting to default/db-api (development)...
  res/local-dev-postgres/client -> 127.0.0.1:53498  (resource/client)
  res/local-dev-postgres       DB_NAME resolved (value hidden)
  res/local-dev-postgres       DB_PASSWORD resolved (value hidden)
  res/local-dev-postgres       DB_USER resolved (value hidden)
```

`DB_HOST` and `DB_PORT` come from the tunnel. The other three are read in the data plane, because the `postgres` type publishes `database` and `username` through a ConfigMap and `password` through a Secret. See [Dependency Values](#dependency-values).

A resource is tunnelled once per **address its ResourceType declares** through the `openchoreo.dev/local-dev-addresses` annotation, which names the two outputs carrying an address's host and port. Each tunnel re-points only those two outputs, so a type declaring a client port and a monitoring port yields two listeners, each with its own bindings. Outputs the type publishes as plain values, such as a database name or a region, are set verbatim. A type may declare at most **10** addresses.

**Bind both halves of an address, or neither.** An address only follows the tunnel when your `envBindings` bind _both_ of the outputs it is made of. Binding one alone would point the app at `127.0.0.1:<in-cluster port>` or `<in-cluster host>:<local port>`, so `occ` refuses the half-rewrite and says which output is missing:

```text
  ! res/local-dev-postgres/client: workload binds the "host" output but not "port", so the address cannot follow the tunnel; bind both or neither
```

Both outputs are then left as published in-cluster, and the resource's other bindings are unaffected.

:::note
A resource dependency's Resource must live in the **same project** as the consuming component. A ResourceType that declares no addresses still contributes its configuration. It opens no tunnel, and `occ` says so:

```text
  res/my-bucket                (no address tunneled; 2 binding(s) resolved as published in-cluster)
```

:::

## Dependency Values

Outputs a ResourceType publishes through a Secret or ConfigMap, such as a password, a token, or a CA bundle, are **read in the data plane by the remote-agent and returned over the tunnel**, so they never pass through the control plane. `occ` places them in the subshell's environment and does not print them: the report names the variable and says `value hidden`. Only [`--print-env`](#using-it-without-a-subshell) can put a value on screen, and only when you ask it to.

```text
  res/local-dev-postgres       DB_PASSWORD resolved (value hidden)
```

Reading a **Secret**-backed value needs the `resource:read-secrets` action in addition to `resource:connect`. A ConfigMap-backed value is not secret, so it rides on the `resource:connect` grant that admitted the dependency. Your platform team can also switch value resolution off cluster-wide, independently of any role. Either way, a value that cannot be read is **named, not silently dropped**:

```text
  ! res/local-dev-postgres: DB_PASSWORD value not resolved (secret-backed, and your role does not grant resource:read-secrets)
```

Pass `--no-secrets` to skip these reads entirely, so no credential enters the local process. It skips Secret- **and** ConfigMap-backed dependency values, along with the [file bindings](#file-bindings) that carry them, and nothing more: it does not turn dependency resolution off, so outputs the resource publishes as plain values still resolve and the tunnels are unaffected. Each skipped binding is reported and left unset:

```text
  ! res/local-dev-postgres: DB_PASSWORD not resolved (--no-secrets)
  ! res/my-mtls-creds: /etc/ssl/certs/ca-bundle.pem not provisioned (--no-secrets)
```

Independently of any of that, a binding naming an output the resource does not publish (a typo, or a binding written against a different release) is reported with its reason:

```text
  ! res/local-dev-postgres: DB_SCHEMA value not resolved (resource publishes no output named "schema")
```

### File Bindings

A `fileBindings` entry names a container path the app reads a value from. `occ` fetches the content, writes it into a **session-scoped directory** created with owner-only permissions, and then repoints any environment variable whose value is exactly that in-cluster mount path at the local file:

```text
  res/my-mtls-creds             /etc/ssl/certs/ca-bundle.pem -> /var/folders/.../occ-local-3f7a/etc_ssl_certs_ca-bundle.pem
  CA_BUNDLE_PATH                -> /var/folders/.../occ-local-3f7a/etc_ssl_certs_ca-bundle.pem
```

The directory sits outside your working tree, so a credential cannot be committed by accident, and it is removed on every exit `occ` handles, including Ctrl-C. An unexpected crash could leave the directory behind with its contents still in it. It is an `occ-local-<id>` directory under your operating system's temporary directory, at the path printed on each file-binding line, so with no session running you can remove a leftover yourself:

```bash
rm -rf "${TMPDIR:-/tmp}"/occ-local-*
```

File contents are written through byte for byte with no rewriting, since a mounted value is as likely to be a certificate or keystore as a config file.

If no environment variable names the mount path, `occ` tells you where the file is and leaves pointing the app at it to you:

```text
  ! no env var names /etc/ssl/certs/ca-bundle.pem; point the app at /var/folders/.../etc_ssl_certs_ca-bundle.pem yourself
```

## Composed Values

A resource often publishes a whole connection string rather than separate host and port outputs. `occ` re-points the in-cluster address inside such a value at the tunnel, so the value works from your machine. This applies to plain values and to values read from a Secret or ConfigMap alike, and only ever substitutes **that same resource's own** declared addresses. One resource's tunnel is never written into another's binding.

Two shapes are handled, in this order:

| Shape                              | Example                                                  | Result                                                                              |
| ---------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Fused** (host and port adjacent) | `redis://cache.ns.svc.cluster.local:6379`                | The `host:port` pair is substituted as one string: `redis://127.0.0.1:<local port>` |
| **Split** (host and port apart)    | `host=db.ns.svc.cluster.local,port=5432,sslmode=require` | Host and port are substituted individually, and the rewrite is reported with `~`    |

The split rewrite is the weaker inference of the two, so it is attempted only when both of these hold:

- the fused pair is **absent** from the value, and
- the value carries the host **and** that address's port as a standalone token

That second condition is what keeps the rewrite safe. **A value naming the host on its own is never rewritten.** A TLS server name, or an admin URL on a different port, satisfies neither condition and is left exactly as resolved. "Standalone" means the port is not flanked by characters a hostname or a longer number could use, so the `6379` in `cache6379.ns` or in `63790` is not a match.

A value that still names a tunnelled host once both shapes have been tried is flagged, so a binding you expected to be a dialable address cannot quietly keep pointing into the cluster:

```text
  ! res/my-postgres: ADMIN_URL still points at db.ns.svc.cluster.local and was not re-pointed at a tunnel
```

The flag is an inferred routing concern, not a verdict: `occ` cannot tell which of your bindings the app actually dials, so weigh it only where the value is meant to be one. A TLS server name, or an admin URL on a different port, is flagged by the same rule and is deliberately left as resolved, since it is supposed to keep naming the in-cluster host.

File bindings are the exception: their contents are written through byte for byte with no substitution at all, since a mounted value is as likely to be a certificate or keystore as a config file.

## Running Several Components at Once

Pass more than one workload file to run several components locally in the same session. When one workload declares an endpoint dependency on **another component you passed a file for**, `occ` wires it straight to a local address instead of tunnelling it, so your two local processes talk to each other:

```bash
occ remote db-api/workload.yaml web-app/workload.yaml --namespace default --env development
```

```text
Connecting to default/web-app (development)...
  ep/default/db-api/http        -> 127.0.0.1:4000  (local)
```

A dependency is cross-linked only when another file you passed matches it on namespace, project **and** component, _and_ declares the named endpoint in its own `spec.endpoints`. Name a component you passed but an endpoint it does not declare, and the dependency falls through to normal remote resolution instead, where it is reported as unavailable.

The port defaults to that workload's own declared endpoint port. Override it with `--local`, repeatable per component:

```bash
occ remote db-api/workload.yaml web-app/workload.yaml \
  --local db-api=127.0.0.1:9000 --env development
```

If two workloads bind the same environment variable to different values, `occ` warns and keeps the last one.

## Output Notation

Every dependency, value and file binding produces a line, so none of them can resolve or fail unnoticed:

| Line                                                                   | Meaning                                                                                      |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `-> 127.0.0.1:<port>  (endpoint)`                                      | Endpoint dependency, tunnelled.                                                              |
| `-> 127.0.0.1:<port>  (resource/<address>)`                            | One address of a resource dependency, tunnelled.                                             |
| `-> <host>:<port>  (local)`                                            | Wired to another workload in this session, not tunnelled.                                    |
| `(no address tunneled; N binding(s) resolved as published in-cluster)` | The resource had nothing dialable. Its bindings still resolved, but to in-cluster addresses. |
| `<VAR> resolved (value hidden)`                                        | Value read in the data plane and set in the subshell.                                        |
| `<path> -> <local path>`                                               | File binding materialized.                                                                   |
| `<VAR> -> <local path>`                                                | An environment variable naming a mount path was repointed at the local file.                 |
| `! no env var names <path>; point the app at <local path> yourself`    | File binding materialized, but nothing in the environment pointed at it. See below.          |
| `~ ... had its host and port re-pointed separately`                    | A composed value had its host and port substituted individually.                             |
| `! ...`                                                                | Not resolved, with the reason. The rest of the session still works.                          |

A dependency you cannot reach is reported the same way whether the component is undeployed or your role has no access to it, and the remaining dependencies still tunnel.

The one `!` line that is **not** a failure is the unbound file binding. The file was fetched and written. `occ` found no environment variable whose value was exactly the container mount path, so there was nothing to repoint:

```text
  res/my-mtls-creds             /etc/ssl/certs/ca-bundle.pem -> /var/folders/.../occ-local-3f7a/etc_ssl_certs_ca-bundle.pem
  ! no env var names /etc/ssl/certs/ca-bundle.pem; point the app at /var/folders/.../etc_ssl_certs_ca-bundle.pem yourself
```

That is the normal case when the app has the path compiled in, reads it from a config file, or takes it as a command-line argument. The container mounted the file at a fixed path and never needed an environment variable for it. It also appears when a variable _mentions_ the path inside a longer value, since only an exact whole-value match is rewritten. Either way the file is on disk at the path on the first line: point the app at it with a flag, a config edit, or by exporting your own variable inside the subshell.

## Using It Without a Subshell

`--print-env` prints the resolved bindings and holds the tunnels open instead of spawning a subshell, which suits `direnv`, an IDE run configuration, or any other tooling:

```bash
occ remote db-api/workload.yaml --env development --print-env
```

Values read from the data plane are **redacted by default**, because this output lands in a terminal, in scrollback, and often in a pasted bug report. When stdin is a terminal, `occ` asks once whether to print them, listing exactly which bindings are affected:

```text
Read from a Secret or ConfigMap: DB_NAME, DB_PASSWORD, DB_USER
Print these values in full? They stay in this terminal's scrollback. [y/N]:
```

The prompt covers every value read from the data plane, including ConfigMap-backed ones, so `DB_NAME` is listed alongside the password. Answering no (the default: a bare Enter, or anything other than `y`/`yes`) keeps them hidden, and the binding still shows that it resolved:

```text
Environment bindings:
  export DB_HOST=127.0.0.1
  export DB_NAME=<hidden; pass --show-secrets to print it>
  export DB_PASSWORD=<hidden; pass --show-secrets to print it>
  export DB_PORT=59167
  export DB_USER=<hidden; pass --show-secrets to print it>

Tunnels open. Press Ctrl-C to disconnect.
```

Answering yes prints every binding in full, credentials included.

### Skipping the prompt

`--show-secrets` prints the values in full with no prompt at all, for when you already know you want them or when nothing can answer a prompt:

```bash
occ remote db-api/workload.yaml --env development --print-env --show-secrets
```

Two things to know about the flag:

- It only affects `--print-env`. In the default subshell mode the values are already exported into the subshell and nothing is printed, so `--show-secrets` changes nothing.
- It cannot be combined with `--no-secrets`, which fetches nothing in the first place. `occ` rejects the pair rather than picking a winner.

## Permissions

Access is decided per dependency, at resolve time, against the target environment:

| What you depend on                       | Action your role needs         | Bound to                                                                                   |
| ---------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------ |
| An endpoint of another component         | `component:connect`            | That **provider** component, or a scope above it (its project, namespace, or cluster-wide) |
| A Resource                               | `resource:connect`             | That Resource, or a scope above it                                                         |
| A Resource's **Secret**-backed values    | `resource:read-secrets`        | Same, and only checked for resources you may already connect to                            |
| A Resource's **ConfigMap**-backed values | none beyond `resource:connect` | Not applicable                                                                             |

The component you are running needs no grant of its own. `resource:connect` and `resource:read-secrets` are deliberately separate: an installation can hand you a tunnel to a database without handing you its password. On a stock install the built-in `developer` and `platform-engineer` roles carry all three.

## Session Lifetime

A session renews itself. `occ` re-resolves before the capability lapses and keeps the tunnels open, so the session runs until you exit it or it reaches the control plane's maximum session length, 12 hours by default.

Each renewal re-runs every permission check, so revoking a role takes effect within one capability lifetime (30 minutes by default, 10 minutes when the session also reads dependency values) rather than lasting until you reconnect:

## Troubleshooting

| Symptom                                                     | Cause                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolve fails immediately                                   | The feature is not enabled on the control plane, or `entrypointAddress` is unset. Ask your platform team.                                                                                                                                                                                   |
| `connect to remote-agent <addr> (<sni>): ...` at startup    | Resolution succeeded, but the router is not there: `remoteAgentRouter.enabled` is false on that data plane, or `entrypointAddress` is not reachable from your machine. `occ` dials the agents eagerly, retrying for **30 seconds**, so this fails startup rather than the first connection. |
| A dependency is reported unavailable                        | The provider is not deployed in that environment, its binding is not `Ready`, or your role does not grant it. The message is intentionally the same for all three.                                                                                                                          |
| `no address tunneled`                                       | The ResourceType declares no addresses, or the binding is pinned to a release cut before it did. The bindings you get are the in-cluster addresses as published.                                                                                                                            |
| `bind both or neither`                                      | Only one half of a declared address is bound in `envBindings`. Bind the address's host _and_ port outputs.                                                                                                                                                                                  |
| A value is `value is binary; bind it as a file instead`     | An environment variable can only carry text. Move that output to `fileBindings`.                                                                                                                                                                                                            |
| A value is `value too large`                                | A fetched value is over **1 MiB**.                                                                                                                                                                                                                                                          |
| A value is `read failed` or `this agent cannot read values` | The data-plane read did not succeed. The message is coarse by design, so ask your platform team to check the remote-agent's logs.                                                                                                                                                           |
| `already serving its maximum number of sessions` at startup | The agent for that project and environment is at its session cap, **64** by default. Wait for another session to end, or ask your platform team to raise `agentMaxSessions`. The agent answered rather than failing to respond, so this is reported at once instead of being retried.       |
| A connection is `too many requests to this remote-agent`    | Your app is opening new dependency connections faster than the agent may authorize them, **20 per second** by default. Pool or reuse connections, or ask your platform team to raise `agentAuthorizeRate`. The session itself stays up.                                                     |
| A connection is `too many concurrent streams`               | One tunnel is already carrying **256** dependency connections at once. Close idle connections, or pool them. The session itself stays up.                                                                                                                                                   |

:::tip
If the router's address is reachable only through a port-forward, set `OCC_REMOTE_AGENT_ENDPOINT=<host:port>` to dial that instead of the address resolve returned. The TLS pin still comes from the resolve response, so the agent's certificate is verified either way.
:::

## Limitations

- Tunnels are **TCP only**, and one tunnel carries at most **256** concurrent connections. A session holds one tunnel per data-plane namespace its dependencies resolve to.
- One remote-agent serves every session for a project and environment, and caps how many attach at once (**64** by default) and how fast it authorizes new connections (**20** per second). Your platform team configures both.
- Resource dependencies are **same-project only**.
- A ResourceType may declare at most **10** addresses, and a fetched value may be at most **1 MiB**.
- A declared address whose host or port output is Secret- or ConfigMap-backed has no address the control plane can resolve, so it is reported as unavailable rather than tunnelled. Its ResourceType must publish the host and port as plain `value` outputs to make it tunnellable.
- A dependency that first appears mid-session is reported, but gets no local port until you re-run `occ remote`.
- An environment variable is repointed at a materialized file only when its **whole value** is the mount path. One that buries the path in a longer value (a command line, a comma-separated list) keeps the in-cluster path and is reported instead.

## Try It

The [Local Development sample](https://github.com/openchoreo/openchoreo/tree/main/samples/local-development) is self-contained: it seeds an endpoint dependency, a resource dependency, and a second locally-run component, then walks through all three with one `occ remote` invocation.

## Related Resources

- [Endpoint Dependencies](./dependencies/endpoints.md) - Consuming endpoints exposed by other components
- [Resource Dependencies](./dependencies/resources.md) - Consuming project-bound Resources
- [`occ remote` CLI reference](../reference/cli-reference.md#remote) - Full command reference
- [Enabling Local Development](../platform-engineer-guide/local-development-setup.mdx) - Platform-team setup
