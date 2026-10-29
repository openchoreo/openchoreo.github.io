---
title: ResourceRelease API Reference
description: Immutable snapshot of a Resource and its ResourceType at a point in time
---

# ResourceRelease

A ResourceRelease is an immutable snapshot of a [Resource](../application/resource.md) and the referenced [ResourceType](../platform/resourcetype.md) or [ClusterResourceType](../platform/clusterresourcetype.md) at the moment it was cut. ResourceReleases ensure reproducibility and enable reliable rollback by preserving the exact state used to render the binding for each environment.

ResourceReleases are created exclusively by the Resource controller. When the hash of `Resource.spec` plus the referenced ResourceType's spec changes, a new ResourceRelease is cut with the name `{resource}-{hash}`. They are deleted by the Resource finalizer when the parent Resource is torn down.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ResourceReleases are namespace-scoped resources created in the same namespace as the Resource.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ResourceRelease
metadata:
  name: <resource-name>-<hash>
  namespace: <namespace>
```

The name shape mirrors the ComponentRelease pattern: a stable prefix derived from the Resource name plus a content-addressed hash discriminator. Two ResourceReleases for the same Resource can therefore coexist during a rolling promotion.

### Spec Fields

The entire spec is immutable after creation. Edits are rejected by a CEL validation rule on the CRD.

| Field          | Type                                                        | Required | Default | Description                                                           |
| -------------- | ----------------------------------------------------------- | -------- | ------- | --------------------------------------------------------------------- |
| `owner`        | [ResourceReleaseOwner](#resourcereleaseowner)               | Yes      | -       | Identifies the Resource and project this snapshot belongs to          |
| `resourceType` | [ResourceReleaseResourceType](#resourcereleaseresourcetype) | Yes      | -       | Frozen snapshot of the (Cluster)ResourceType resource at release time |
| `parameters`   | object                                                      | No       | -       | Frozen snapshot of `Resource.spec.parameters` at release time         |

### ResourceReleaseOwner

| Field          | Type   | Required | Description                                           |
| -------------- | ------ | -------- | ----------------------------------------------------- |
| `projectName`  | string | Yes      | Name of the project that owns this Resource (min: 1)  |
| `resourceName` | string | Yes      | Name of the Resource this release belongs to (min: 1) |

### ResourceReleaseResourceType

Captures both the identity (Kind + Name) and the full spec of the referenced (Cluster)ResourceType at release time, so a namespace-scoped ResourceType and a cluster-scoped ClusterResourceType with the same name can coexist in the snapshot history.

| Field  | Type                                                        | Required | Description                                                                        |
| ------ | ----------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------- |
| `kind` | string                                                      | Yes      | Either `ResourceType` (namespace-scoped) or `ClusterResourceType` (cluster-scoped) |
| `name` | string                                                      | Yes      | Name of the (Cluster)ResourceType resource (min: 1)                                |
| `spec` | [ResourceTypeSpec](../platform/resourcetype.md#spec-fields) | Yes      | Frozen specification of the (Cluster)ResourceType                                  |

ClusterResourceType snapshots currently share the namespaced ResourceType spec shape; if ClusterResourceType later gains cluster-only fields, snapshots taken from a ClusterResourceType source will not preserve them—mirrors the ComponentRelease precedent.

### Status Fields

ResourceRelease currently has no status fields. Observed deployment state (per-environment readiness, output resolution, finalization) lives on the [ResourceReleaseBinding](../platform/resourcereleasebinding.md) that pins this snapshot.

## Examples

### Basic ResourceRelease

A snapshot cut by the Resource controller after a developer creates a Resource referencing the `postgres` ClusterResourceType.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ResourceRelease
metadata:
  name: doclet-postgres-abc12345
  namespace: default
spec:
  owner:
    projectName: doclet
    resourceName: doclet-postgres
  resourceType:
    kind: ClusterResourceType
    name: postgres
    spec:
      parameters:
        openAPIV3Schema:
          type: object
          properties:
            database:
              type: string
              default: postgres
      environmentConfigs:
        openAPIV3Schema:
          type: object
          properties:
            storage:
              type: string
              default: "10Gi"
      retainPolicy: Retain
      outputs:
        - name: host
          value: "${metadata.name}.${metadata.namespace}.svc.cluster.local"
        - name: port
          value: "5432"
        - name: password
          secretKeyRef:
            name: "${metadata.name}-creds"
            key: password
      resources:
        - id: password-secret
          template:
            # ... ExternalSecret or Password generator manifest ...
        - id: statefulset
          readyWhen: "${applied.statefulset.status.readyReplicas == 1}"
          template:
            # ... Postgres StatefulSet ...
  parameters:
    database: doclet
```

### ResourceRelease From a Namespace-Scoped ResourceType

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ResourceRelease
metadata:
  name: order-cache-def67890
  namespace: default
spec:
  owner:
    projectName: order-service
    resourceName: order-cache
  resourceType:
    kind: ResourceType
    name: valkey-cache
    spec:
      # ... frozen ResourceType spec at release time ...
  parameters:
    version: "8"
```

## Immutability

ResourceRelease's spec is enforced immutable by a CEL validation rule (`self == oldSelf`). All fields—`owner`, `resourceType`, `parameters`—are part of the snapshot guarantee:

- Spec edits via `kubectl edit` or API PATCH are rejected.
- The Resource controller cuts a new ResourceRelease (new hash, new name) when either the Resource spec or the referenced (Cluster)ResourceType spec changes. The previous snapshot is left untouched until the Resource finalizer GC's it.

## Lifecycle

1. **Create.** Resource controller computes the hash of `Resource.spec + (Cluster)ResourceType.spec`. If no ResourceRelease with that hash exists, it creates one named `{resource}-{hash}` and updates `Resource.status.latestRelease`.
2. **Promote.** A platform engineer or GitOps process updates a `ResourceReleaseBinding.spec.resourceRelease` to point at this snapshot. The binding controller renders the snapshot's `resourceType.spec` with the snapshot's `parameters` and the binding's `resourceTypeEnvironmentConfigs`, then applies the resulting manifests to the data plane.
3. **Delete.** When the parent Resource is deleted, the Resource finalizer's second phase removes all owned ResourceReleases (matched by `spec.owner.resourceName`). Direct `kubectl delete resourcerelease ...` is not blocked by a finalizer but breaks the binding chain if any binding still references the snapshot.

## Related Resources

- [Resource](../application/resource.md) — Owns this snapshot through `spec.owner.{projectName, resourceName}`
- [ResourceType](../platform/resourcetype.md) — Source template captured in `spec.resourceType.spec`
- [ClusterResourceType](../platform/clusterresourcetype.md) — Cluster-scoped variant of the source template
- [ResourceReleaseBinding](../platform/resourcereleasebinding.md) — Pins this snapshot to a specific environment
- [RenderedRelease](./renderedrelease.md) — Final manifests produced by the binding controller
- [ComponentRelease](./componentrelease.md) — Component-side counterpart
