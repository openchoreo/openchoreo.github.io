---
title: Resource Dependencies
description: Learn how a Component consumes a project-bound Resource by binding its outputs to environment variables and file mounts
---

# Resource Dependencies

Components in OpenChoreo consume managed infrastructure—databases, queues, caches, object stores—by declaring **resource dependencies** in their Workload. Each entry references a project-bound [Resource](../../concepts/developer-abstractions.md#resource) and wires the named outputs declared on the referenced ResourceType into the consuming container.

When a resource dependency is declared, the platform automatically:

- Resolves the active `ResourceReleaseBinding` for the consumer's environment and reads its `status.outputs`
- Gates the consumer's deployment until that binding reports `Ready`
- Injects the resolved outputs as container environment variables (`envBindings`) and file mounts (`fileBindings`)
- Keeps sensitive values on the data plane: only the underlying `{name, key}` reference to a Secret or ConfigMap transits the control plane

## Defining a Dependency

Resource dependencies are defined in the `spec.dependencies.resources` array of a Workload. Each entry references a Resource by name and picks which of its outputs to inject:

```yaml
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
      - ref: doclet-postgres
        envBindings:
          host: DB_HOST
          port: DB_PORT
          username: DB_USER
          password: DB_PASSWORD
          database: DB_NAME
```

In this example, the `doclet-document` Workload declares a dependency on the `doclet-postgres` Resource (a Postgres database provisioned from a `ClusterResourceType`). The platform resolves five outputs—`host`, `port`, `username`, `password`, `database`—and injects each as the corresponding environment variable. The credential is delivered through a `valueFrom.secretKeyRef`; the container reads the actual value from the data-plane Secret at pod-start.

## Dependency Fields

| Field          | Type              | Required | Description                                                                                                                                          |
| -------------- | ----------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`          | string            | Yes      | Name of the target Resource. Must live in the same project as the consuming Component                                                                |
| `envBindings`  | map[string]string | No       | Maps a ResourceType output name (key) to a container environment variable name (value)                                                               |
| `fileBindings` | map[string]string | No       | Maps a ResourceType output name (key) to a container mount path (value). The referenced output must be backed by `secretKeyRef` or `configMapKeyRef` |

An entry must specify `ref` and at least one of `envBindings` or `fileBindings`. Outputs the ResourceType declares but the Workload does not list are ignored—each Workload picks only the outputs it actually needs.

### Environment Bindings

The `envBindings` map binds each output to an environment variable on the consuming container. The shape of the resulting `env` entry depends on the ResourceType output's source kind:

| Output source kind | Resulting env var shape                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| `value`            | Literal value: `env: [{name: DB_HOST, value: "postgres.doclet.svc.cluster.local"}]`                   |
| `secretKeyRef`     | Secret reference: `env: [{name: DB_PASSWORD, valueFrom: {secretKeyRef: {name: ..., key: ...}}}]`      |
| `configMapKeyRef`  | ConfigMap reference: `env: [{name: APP_REGION, valueFrom: {configMapKeyRef: {name: ..., key: ...}}}]` |

Sensitive outputs are declared as `secretKeyRef` on the ResourceType. Only the `{name, key}` reference transits the control plane; the underlying credential is never serialized to the consumer's `ReleaseBinding.status` or to the rendered `Deployment` manifest.

### File Bindings

The `fileBindings` map mounts each output into the consuming container's filesystem. The referenced output must be backed by `secretKeyRef` or `configMapKeyRef`—`value`-kind outputs cannot be file-mounted because there is no data-plane object to mount.

```yaml
dependencies:
  resources:
    - ref: my-mtls-creds
      fileBindings:
        ca-bundle: /etc/ssl/certs/ca-bundle.pem
        client-cert: /etc/ssl/certs/client.crt
        client-key: /etc/ssl/private/client.key
```

The platform synthesizes one Volume per `(resource, output)` pair (deduplicated when the same output is referenced multiple times) and one VolumeMount per declared path. The container reads each file at the declared path; underlying Secret or ConfigMap updates propagate through the standard kubelet projection.

## Multiple Dependencies

A Workload can declare up to 50 resource dependencies. Each entry's `ref` must be unique within the Workload, and endpoint and resource dependencies can be declared together:

```yaml
dependencies:
  endpoints:
    - component: doclet-collab
      name: ws
      visibility: project
      envBindings:
        address: COLLAB_URL
  resources:
    - ref: doclet-postgres
      envBindings:
        host: DB_HOST
        port: DB_PORT
        username: DB_USER
        password: DB_PASSWORD
        database: DB_NAME
    - ref: doclet-nats
      envBindings:
        url: DOCLET_NATS_URL
```

The render gate waits for both endpoint and resource dependencies before proceeding.

## Complete Example

A full example: a `doclet-document` Component depending on a Postgres Resource for storage and a NATS Resource for pub/sub.

The Component, Workload, and matching Resources:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: doclet-document
  namespace: default
spec:
  owner:
    projectName: doclet
  autoDeploy: true
  componentType:
    kind: ClusterComponentType
    name: deployment/service
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
  endpoints:
    http:
      type: HTTP
      port: 8080
      visibility: [project]
  dependencies:
    resources:
      - ref: doclet-postgres
        envBindings:
          host: DB_HOST
          port: DB_PORT
          username: DB_USER
          password: DB_PASSWORD
          database: DB_NAME
      - ref: doclet-nats
        envBindings:
          url: DOCLET_NATS_URL
---
apiVersion: openchoreo.dev/v1alpha1
kind: Resource
metadata:
  name: doclet-postgres
  namespace: default
spec:
  owner:
    projectName: doclet
  type:
    kind: ClusterResourceType
    name: postgres
  parameters:
    database: doclet
---
apiVersion: openchoreo.dev/v1alpha1
kind: Resource
metadata:
  name: doclet-nats
  namespace: default
spec:
  owner:
    projectName: doclet
  type:
    kind: ClusterResourceType
    name: nats
```

And the `ResourceReleaseBinding` for the `development` environment (one per Resource per environment, authored by the platform engineer or GitOps tooling):

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ResourceReleaseBinding
metadata:
  name: doclet-postgres-development
  namespace: default
spec:
  owner:
    projectName: doclet
    resourceName: doclet-postgres
  environment: development
  resourceRelease: doclet-postgres-abc12345 # advanced via `occ resource promote`
```

After the bindings report `Ready` and the consuming Component is deployed, verify the injected variables from inside the pod:

```bash
kubectl exec -n <data-plane-namespace> <pod-name> -- env | grep -E 'DB_|NATS'
```

The output shows the resolved connection details, with the password loaded from a Secret reference:

```text
DB_HOST=postgres-doclet.openchoreo-dp-doclet-development.svc.cluster.local
DB_PORT=5432
DB_USER=doclet
DB_NAME=doclet
DB_PASSWORD=<value loaded from Secret at pod-start>
DOCLET_NATS_URL=nats://<token>@nats-doclet.openchoreo-dp-doclet-development.svc.cluster.local:4222
```

## Inspecting Outputs on the Binding

To inspect the resolved outputs without deploying a consumer, view the `ResourceReleaseBinding.status.outputs` directly:

```bash
kubectl get resourcereleasebinding doclet-postgres-development -o yaml
```

Each entry in `status.outputs[]` carries the output name and one of `value`, `secretKeyRef`, or `configMapKeyRef`. For credential outputs, only the Secret name and key are shown—the actual value never appears here, matching the shape that lands in the consuming pod.

## Related Resources

- [Workload](../workload/overview.md) - How to define Workloads
- [Endpoint Dependencies](./endpoints.md) - Consuming endpoints exposed by other components
- [Resource concept](../../concepts/developer-abstractions.md#resource) - Overview of the Resource abstraction
- [Workload API Reference](../../reference/api/application/workload.md) - Full Workload CRD specification
