---
title: Overview
description: Learn how to create ResourceTypes for OpenChoreo
---

# Authoring ResourceTypes

This guide covers how to create custom [ResourceTypes](../reference/api/platform/resourcetype.md) and [ClusterResourceTypes](../reference/api/platform/clusterresourcetype.md) in OpenChoreo. A ResourceType is the platform-engineer-defined template that governs how a managed-infrastructure resource (database, queue, cache, object store) is provisioned on the data plane and exposed to consumers.

## What is a ResourceType?

A ResourceType plays the same role for managed infrastructure that a ComponentType plays for code components: it captures the manifests the platform emits, the parameters developers can supply, the environment-specific overrides bindings can apply, and the named outputs consumers wire into their containers.

Platform engineers use ResourceTypes to:

- Publish reusable provisioning templates (Postgres, NATS, Valkey, S3 buckets, Crossplane claims)
- Define what developers can configure through a schema
- Define what consumers can wire into their workloads through declared outputs
- Set retention defaults so accidental deletes do not destroy stateful data

Developers reference a ResourceType from `Resource.spec.type` and supply parameter values. Each `ResourceReleaseBinding` then renders the template per environment, applies the rendered manifests to the data plane, and surfaces the resulting outputs back through `status.outputs`.

OpenChoreo ships example ClusterResourceTypes (`postgres`, `valkey`, `nats`) under `samples/getting-started/cluster-resource-types/` for local development and to demonstrate the pattern. These samples back stateful infrastructure with in-cluster StatefulSets and are not intended for production use; platform engineers should author their own templates targeting production-grade provisioners (Crossplane, ACK, native cloud operators).

### ClusterResourceType

A **ClusterResourceType** is the cluster-scoped variant of ResourceType. Use it for templates intended to be shared platform-wide; namespace-scoped ResourceTypes are available when a template should be available only within a specific namespace.

ClusterResourceTypes share the same spec structure as ResourceTypes; only scope differs.

**Key concepts:**

- `parameters` / `environmentConfigs` — Define what developers can configure on a Resource, and what bindings can override per environment
- `resources` — Kubernetes manifest templates the provisioner emits on the data plane (rendered through CEL)
- `outputs` — Named values that consuming workloads bind to environment variables and file mounts
- `retainPolicy` — Default deletion behavior (`Delete` or `Retain`) for bindings of this type

## ResourceType Example

The example below defines a simple Valkey (Redis-protocol) cache backed by a StatefulSet. It exposes three outputs—`host`, `port`, and `password`—that workloads can consume through `dependencies.resources[]`.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ResourceType
metadata:
  name: valkey-cache
  namespace: default
spec:
  # Developer-facing parameters; captured in the ResourceRelease snapshot.
  parameters:
    openAPIV3Schema:
      type: object
      properties:
        version:
          type: string
          enum: ["7", "8"]
          default: "8"

  # Per-environment overrides applied through ResourceReleaseBinding.
  environmentConfigs:
    openAPIV3Schema:
      type: object
      properties:
        memory:
          type: string
          default: "128Mi"

  # Default retention. Per-environment override available on bindings.
  retainPolicy: Delete

  # Named outputs that consuming workloads wire into containers.
  outputs:
    - name: host
      value: "${metadata.name}.${metadata.namespace}.svc.cluster.local"
    - name: port
      value: "6379"
    - name: password
      secretKeyRef:
        name: "${metadata.name}-creds"
        key: password

  # Kubernetes manifests rendered onto the data plane.
  resources:
    - id: password-secret
      template:
        apiVersion: v1
        kind: Secret
        metadata:
          name: ${metadata.name}-creds
          namespace: ${metadata.namespace}
          labels: ${metadata.labels}
        type: Opaque
        stringData:
          # Real templates generate this on the data plane (for example via
          # an ExternalSecret + Password generator) so the literal never
          # transits the control plane. See the example `valkey` sample for
          # the full pattern.
          password: "change-me"

    - id: service
      template:
        apiVersion: v1
        kind: Service
        metadata:
          name: ${metadata.name}
          namespace: ${metadata.namespace}
          labels: ${metadata.labels}
        spec:
          selector:
            app: ${metadata.name}
          ports:
            - name: valkey
              port: 6379
              targetPort: 6379

    - id: statefulset
      readyWhen: "${applied.statefulset.status.readyReplicas == applied.statefulset.status.replicas && applied.statefulset.status.replicas > 0}"
      template:
        apiVersion: apps/v1
        kind: StatefulSet
        metadata:
          name: ${metadata.name}
          namespace: ${metadata.namespace}
          labels: ${metadata.labels}
        spec:
          serviceName: ${metadata.name}
          replicas: 1
          selector:
            matchLabels:
              app: ${metadata.name}
          template:
            metadata:
              labels:
                app: ${metadata.name}
            spec:
              containers:
                - name: valkey
                  image: valkey/valkey:${parameters.version}-alpine
                  resources:
                    limits:
                      memory: ${environmentConfigs.memory}
                  env:
                    - name: VALKEY_PASSWORD
                      valueFrom:
                        secretKeyRef:
                          name: ${metadata.name}-creds
                          key: password
                  args:
                    - --requirepass
                    - $(VALKEY_PASSWORD)
                  ports:
                    - containerPort: 6379
                      name: valkey
```

Real-world templates also generate credentials on the data plane (for example through an ExternalSecret backed by a Password generator) so secret material never reaches the control plane. The example templates under `samples/getting-started/cluster-resource-types/` (`postgres`, `valkey`, `nats`) demonstrate the full pattern. They use in-cluster StatefulSets for the underlying infrastructure and are intended for local development; production templates typically target a managed-provisioner abstraction (Crossplane, ACK, native cloud operator) instead.

## Outputs

Outputs are the contract between the ResourceType and the workloads that consume it. Each output is identified by a unique `name` and picks exactly one of three source kinds:

| Source kind       | When to use                                                                                           | What transits to the control plane                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `value`           | Non-sensitive data (host, port, region, database name, composed connection URLs)                      | The resolved literal value. Stored on the binding's `status.outputs[].value`.                  |
| `secretKeyRef`    | Sensitive credentials (passwords, tokens, private keys)                                               | Only `{name, key}` of the data-plane Secret. The underlying value never leaves the data plane. |
| `configMapKeyRef` | Non-sensitive runtime configuration sourced from a data-plane ConfigMap (CA bundles, locale settings) | Only `{name, key}` of the data-plane ConfigMap.                                                |

`value`, `secretKeyRef.name`, `secretKeyRef.key`, `configMapKeyRef.name`, and `configMapKeyRef.key` all support `${...}` CEL templating. The CEL context includes `applied.<id>.status.*`—use this to surface fields populated by the provisioner (for example a Crossplane claim's `status.connectionDetails`).

Consumers reference outputs by name through `Workload.spec.dependencies.resources[].envBindings` and `fileBindings` (see the [Resource Dependencies developer guide](../developer-guide/dependencies/resources.md)). Outputs declared on the ResourceType but not requested by a consumer are simply unused; outputs requested by a consumer but missing on the ResourceType surface as a `ResourceDependenciesPending` reason on the consuming `ReleaseBinding`.

## How Developers Consume a ResourceType

Developers create a **Resource** that references the ResourceType, providing parameter values that conform to the declared schema. They then declare a dependency from a Workload to the Resource and bind the outputs they need:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Resource
metadata:
  name: doclet-cache
  namespace: default
spec:
  owner:
    projectName: doclet
  type:
    kind: ResourceType
    name: valkey-cache
  parameters:
    version: "8"
---
apiVersion: openchoreo.dev/v1alpha1
kind: Workload
metadata:
  name: doclet-document
  namespace: default
spec:
  owner:
    projectName: doclet
    componentName: doclet-document
  container:
    image: ghcr.io/openchoreo/samples/doclet-document:latest
  dependencies:
    resources:
      - ref: doclet-cache
        envBindings:
          host: REDIS_HOST
          port: REDIS_PORT
          password: REDIS_PASSWORD
```

To deploy the Resource into an environment, a platform engineer or GitOps process creates a `ResourceReleaseBinding`. The binding pins a specific `ResourceRelease`, targets an Environment, supplies per-environment overrides through `resourceTypeEnvironmentConfigs`, and optionally overrides the `retainPolicy`:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ResourceReleaseBinding
metadata:
  name: doclet-cache-production
  namespace: default
spec:
  owner:
    projectName: doclet
    resourceName: doclet-cache
  environment: production
  resourceRelease: doclet-cache-abc12345 # advanced via `occ resource promote`
  retainPolicy: Retain
  resourceTypeEnvironmentConfigs:
    memory: "2Gi"
```

The binding controller renders the ResourceType template with the combined Resource parameters and environment overrides, produces a `RenderedRelease` applied to the data plane, and resolves declared outputs into `status.outputs` so consuming workloads can read them.

## CEL Surface for Resource Templates

Resource templates and output expressions have access to the following CEL context. The available bindings depend on which field is being evaluated:

| Context                | In resource `template` | In `includeWhen` | In `readyWhen` | In `outputs` | Description                                                                               |
| ---------------------- | :--------------------: | :--------------: | :------------: | :----------: | ----------------------------------------------------------------------------------------- |
| `metadata.*`           |          yes           |       yes        |      yes       |     yes      | Platform-injected naming, namespace, resource/project/env UIDs, labels, annotations       |
| `parameters.*`         |          yes           |       yes        |      yes       |     yes      | Values from `Resource.spec.parameters` after schema defaulting                            |
| `environmentConfigs.*` |          yes           |       yes        |      yes       |     yes      | Values from `ResourceReleaseBinding.spec.resourceTypeEnvironmentConfigs` after defaulting |
| `environment.*`        |          yes           |       yes        |      yes       |     yes      | Per-environment surface including the merged effective gateway for this environment       |
| `dataplane.*`          |          yes           |       yes        |      yes       |     yes      | Target DataPlane attributes (secret store, raw gateway, observability ref)                |
| `gateway.*`            |          yes           |       yes        |      yes       |     yes      | Effective gateway (Environment-level override merged onto DataPlane-level default)        |
| `applied.<id>.*`       |           no           |        no        |      yes       |     yes      | Status of resources that were applied to the data plane—reference by template `id`        |

`applied.<id>.*` is not available during rendering (the manifests have not been applied yet) but is available in `readyWhen` and `outputs` because both run after the data plane reports back. Use `applied.<id>.status.*` in outputs to surface provider-populated fields, such as a Crossplane claim's connection details or a StatefulSet's observed pod count.

The `${...}` wrapper is required on `includeWhen`, `readyWhen`, and `outputs[].value`. Inside resource templates, both `${...}` interpolation (which substitutes a value into a string) and `${...}` whole-field replacement (when the entire field value is a `${...}` expression) are supported—same shape as ComponentType templates.

## includeWhen and readyWhen

Each resource template entry supports two optional CEL fields that shape its lifecycle:

**`includeWhen`** is a boolean expression evaluated at render time. When it returns `false`, the entry is omitted from the rendered output and any previously-applied object is garbage-collected from the data plane. Common uses:

- `${parameters.tlsEnabled}` — conditionally emit a Certificate/Issuer for TLS
- `${environmentConfigs.adminEnabled && has(gateway.ingress.external)}` — only emit the admin UI when explicitly enabled and the environment has external ingress

**`readyWhen`** is a boolean expression evaluated after the rendered object has been applied. When it returns `true`, the entry contributes positively to the binding's `ResourcesReady` condition. When unset, the binding falls back to the per-Kind health heuristics in `RenderedRelease` (replica counts, condition probes). Use `readyWhen` when the default heuristic does not match your provisioner's signal:

- `${applied.claim.status.conditions.exists(c, c.type == 'Ready' && c.status == 'True')}` — a Crossplane claim's `Ready` condition
- `${applied.statefulset.status.readyReplicas == applied.statefulset.status.replicas && applied.statefulset.status.replicas > 0}` — explicit StatefulSet quorum

Both fields must evaluate to a boolean and must be wrapped in `${...}`.

## retainPolicy

`retainPolicy` on the ResourceType sets the default deletion behavior for bindings of that type. Two values:

- **`Delete`** (default) — When a `ResourceReleaseBinding` is deleted, the binding controller removes the emitted data-plane manifests as part of finalization.
- **`Retain`** — The binding's finalizer holds when deleted, preserving the underlying data-plane state until the policy is flipped back to `Delete`.

Per-environment bindings can override the type-level default through `ResourceReleaseBinding.spec.retainPolicy`. Production environments typically opt into `Retain` for non-recoverable infrastructure (databases, persistent volumes) while dev and staging keep the default `Delete`.

## Syntax Systems

ResourceTypes reuse the same syntax systems documented in the Component Types guide:

| Syntax                                               | Purpose                                        | Used In                                                                |
| ---------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| [Templating](./component-types/templating-syntax.md) | Dynamic value generation using CEL expressions | `resources[].template`, `includeWhen`, `readyWhen`, `outputs[]` fields |
| [Schema](./component-types/schema-syntax.md)         | Parameter validation and defaults              | `parameters.openAPIV3Schema` and `environmentConfigs.openAPIV3Schema`  |

Patching (Trait-only) and CEL-based validation rules do not apply to ResourceTypes.

## CEL Reference

- **[Context Variables](../reference/cel/context-variables.md)** — `metadata`, `parameters`, `environmentConfigs`, `dataplane`, `gateway`, `applied`
- **[Built-in Functions](../reference/cel/built-in-functions.md)** — `oc_omit()`, `oc_merge()`, `oc_generate_name()`, `oc_dns_label()`
- **[Configuration Helpers](../reference/cel/helper-functions.md)** — helpers for working with configs and secrets

## Next Steps

- **[Resource Dependencies (developer guide)](../developer-guide/dependencies/resources.md)** — How developers wire ResourceType outputs into containers

## Related Resources

- [ResourceType API Reference](../reference/api/platform/resourcetype.md) — Full CRD specification
- [ClusterResourceType API Reference](../reference/api/platform/clusterresourcetype.md) — Cluster-scoped variant
- [Resource API Reference](../reference/api/application/resource.md) — Developer-facing CRD
- [ResourceReleaseBinding API Reference](../reference/api/platform/resourcereleasebinding.md) — Per-environment binding
