---
title: Resource API Reference
description: Developer-declared dependency on managed infrastructure provisioned through a ResourceType
---

# Resource

A Resource represents a developer-declared dependency on managed infrastructure (database, queue, cache, object store) provisioned through a [ResourceType](../platform/resourcetype.md) or [ClusterResourceType](../platform/clusterresourcetype.md) template. Resources are project-bound: each Resource belongs to exactly one Project, and components in that project consume its outputs through Workload `dependencies.resources[]`.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

Resources are namespace-scoped resources and belong to a Project through the owner field.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Resource
metadata:
  name: <resource-name>
  namespace: <namespace>
```

**Short names:** `res`

### Spec Fields

| Field        | Type                                | Required | Default | Description                                                                                                |
| ------------ | ----------------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| `owner`      | [ResourceOwner](#resourceowner)     | Yes      | -       | Ownership information linking the Resource to a project (immutable)                                        |
| `type`       | [ResourceTypeRef](#resourcetyperef) | Yes      | -       | Reference to a ResourceType or ClusterResourceType template (immutable)                                    |
| `parameters` | object                              | No       | -       | Parameter values validated against the ResourceType's `parameters` schema; failures surface via conditions |

:::note
Both `owner` and `type` are immutable after creation. To re-target a Resource to a different template, delete and recreate it.
:::

### ResourceOwner

| Field         | Type   | Required | Description                                          |
| ------------- | ------ | -------- | ---------------------------------------------------- |
| `projectName` | string | Yes      | Name of the project that owns this Resource (min: 1) |

### ResourceTypeRef

| Field  | Type   | Required | Default        | Description                                                                                                  |
| ------ | ------ | -------- | -------------- | ------------------------------------------------------------------------------------------------------------ |
| `kind` | string | No       | `ResourceType` | Kind of the referenced template: `ResourceType` (namespace-scoped) or `ClusterResourceType` (cluster-scoped) |
| `name` | string | Yes      | -              | Name of the ResourceType or ClusterResourceType (DNS-1123 label; min: 1)                                     |

Mirrors the [ComponentTypeRef](./component.md#componenttyperef) shape. The kind disambiguates a namespace-scoped ResourceType from a cluster-scoped ClusterResourceType with the same name.

### Status Fields

| Field                | Type                                            | Default | Description                                                       |
| -------------------- | ----------------------------------------------- | ------- | ----------------------------------------------------------------- |
| `observedGeneration` | integer                                         | 0       | The generation observed by the controller                         |
| `conditions`         | []Condition                                     | []      | Standard Kubernetes conditions tracking Resource state            |
| `latestRelease`      | [LatestResourceRelease](#latestresourcerelease) | -       | Pointer to the most recent ResourceRelease cut from this Resource |

#### LatestResourceRelease

| Field  | Type   | Description                                                                                |
| ------ | ------ | ------------------------------------------------------------------------------------------ |
| `name` | string | Name of the latest ResourceRelease resource (shape: `{resource}-{hash}`)                   |
| `hash` | string | Content hash covering `Resource.spec` + the referenced ResourceType's spec at release time |

#### Condition Types

Common condition types for Resource resources:

- `Ready` — Indicates the Resource is in a healthy state, the referenced ResourceType has been resolved, and the latest ResourceRelease has been reconciled
- `Finalizing` — Surfaced during deletion while the two-phase finalizer waits for ResourceReleaseBindings and owned ResourceReleases to be cleaned up

## Examples

### Postgres Resource

```yaml
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
```

### NATS Resource (no parameters)

```yaml
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

### Resource Referencing a Namespace-Scoped ResourceType

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Resource
metadata:
  name: order-cache
  namespace: default
spec:
  owner:
    projectName: order-service
  type:
    kind: ResourceType
    name: valkey-cache
  parameters:
    version: "8"
```

## Usage

A Resource is created by a developer (or by GitOps tooling on their behalf) and references a ResourceType that platform engineers have published. The Resource controller cuts a [ResourceRelease](../runtime/resourcerelease.md) when the hash of `Resource.spec` plus the referenced ResourceType's spec changes; release advance into environments happens through a [ResourceReleaseBinding](../platform/resourcereleasebinding.md) authored by a platform engineer or GitOps process.

```bash
# Create the Resource
kubectl apply -f doclet-postgres.yaml

# Inspect the cut release
kubectl get resource doclet-postgres -o jsonpath='{.status.latestRelease}'

# Inspect the rendered DP-side state once a binding is Ready
kubectl get rrb -l openchoreo.dev/resource=doclet-postgres
```

## Annotations

Resources support the following annotations:

| Annotation                    | Description                          |
| ----------------------------- | ------------------------------------ |
| `openchoreo.dev/display-name` | Human-readable name for UI display   |
| `openchoreo.dev/description`  | Detailed description of the Resource |

## Related Resources

- [Project](./project.md) — Owns Resources alongside Components
- [Workload](./workload.md) — Declares resource dependencies through `dependencies.resources[]`
- [ResourceType](../platform/resourcetype.md) — Platform-defined template referenced by a Resource
- [ClusterResourceType](../platform/clusterresourcetype.md) — Cluster-scoped variant of ResourceType
- [ResourceRelease](../runtime/resourcerelease.md) — Immutable snapshot cut by the Resource controller
- [ResourceReleaseBinding](../platform/resourcereleasebinding.md) — Per-environment binding that deploys a release
