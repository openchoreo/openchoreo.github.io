---
title: ClusterResourceType API Reference
description: Cluster-scoped resource provisioning template reusable across all namespaces
---

# ClusterResourceType

A ClusterResourceType is the cluster-scoped variant of [ResourceType](./resourcetype.md). Use it for templates intended to be shared platform-wide; namespace-scoped ResourceTypes are available when a template should be available only within a specific namespace.

ClusterResourceTypes currently share the same spec structure as ResourceTypes; only scope differs. The shapes may diverge in a future release if cluster-only fields are added.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ClusterResourceTypes are cluster-scoped resources (no namespace).

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterResourceType
metadata:
  name: <clusterresourcetype-name>
```

:::note
ClusterResourceType manifests must **not** include `metadata.namespace`. If you are copying from a namespace-scoped ResourceType example, remove the `namespace` field.
:::

**Short names:** `crt`, `crts`

### Spec Fields

The spec currently mirrors [ResourceType.spec](./resourcetype.md#spec-fields) and may diverge in a future release. Refer to that page for the full field reference. The CEL surface, output kinds, manifest `includeWhen` / `readyWhen` semantics, and `retainPolicy` behavior all match the namespace-scoped form.

| Field                | Type                                                             | Required | Default  | Description                                                             |
| -------------------- | ---------------------------------------------------------------- | -------- | -------- | ----------------------------------------------------------------------- |
| `parameters`         | [SchemaSection](./resourcetype.md#schemasection)                 | No       | -        | Schema for `Resource.spec.parameters` values                            |
| `environmentConfigs` | [SchemaSection](./resourcetype.md#schemasection)                 | No       | -        | Schema for `ResourceReleaseBinding.spec.resourceTypeEnvironmentConfigs` |
| `retainPolicy`       | string                                                           | No       | `Delete` | Default retention behavior for bindings of this type                    |
| `outputs`            | [[ResourceTypeOutput](./resourcetype.md#resourcetypeoutput)]     | No       | []       | Named outputs consumed by workloads                                     |
| `resources`          | [[ResourceTypeManifest](./resourcetype.md#resourcetypemanifest)] | Yes      | -        | Kubernetes manifest templates emitted on the data plane                 |

### Status Fields

ClusterResourceType currently has no status fields.

## Examples

### Cluster-Scoped Valkey Cache

A ClusterResourceType available to every namespace. Note the absence of `metadata.namespace`.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterResourceType
metadata:
  name: valkey
spec:
  environmentConfigs:
    openAPIV3Schema:
      type: object
      properties:
        memory:
          type: string
          default: "128Mi"

  retainPolicy: Delete

  outputs:
    - name: host
      value: "${metadata.name}.${metadata.namespace}.svc.cluster.local"
    - name: port
      value: "6379"
    - name: password
      secretKeyRef:
        name: "${metadata.name}-creds"
        key: password

  resources:
    # ... omitted for brevity; see the ResourceType reference for the full pattern ...
    - id: service
      template:
        apiVersion: v1
        kind: Service
        metadata:
          name: ${metadata.name}
          namespace: ${metadata.namespace}
        spec:
          selector:
            app: ${metadata.name}
          ports:
            - name: valkey
              port: 6379
              targetPort: 6379
    - id: statefulset
      template:
        # ... StatefulSet template ...
```

The example ClusterResourceTypes (`postgres`, `valkey`, `nats`) under `samples/getting-started/cluster-resource-types/` in the OpenChoreo repository demonstrate the full pattern—including ESO-backed credential generation and opt-in admin UIs. They use in-cluster StatefulSets for stateful infrastructure and are intended for local development and demonstration, not production use.

## Usage

A Resource references a ClusterResourceType by setting `spec.type.kind: ClusterResourceType`:

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
    kind: ClusterResourceType
    name: valkey
```

A Resource that omits `spec.type.kind` defaults to `ResourceType` (namespace-scoped) per the CRD default—set the kind explicitly when targeting the cluster-scoped form.

## Best Practices

1. **Use ClusterResourceTypes for shared infrastructure patterns** used across many namespaces (Postgres, Valkey, NATS). Reserve namespace-scoped ResourceTypes for templates that depend on namespace-local configuration.
2. **Document the kind explicitly** on consumer manifests so reviewers see whether a Resource is consuming a cluster-wide or namespace-local template.
3. **Apply the same retention defaults** as you would for ResourceTypes—stateful templates should ship with `retainPolicy: Retain`.

## Related Resources

- [ResourceType](./resourcetype.md) — Namespace-scoped variant
- [Resource](../application/resource.md) — Developer-facing CRD
- [ResourceRelease](../runtime/resourcerelease.md) — Immutable snapshot cut by the Resource controller
- [ResourceReleaseBinding](./resourcereleasebinding.md) — Per-environment binding
- [Authoring ResourceTypes (PE Guide)](../../../platform-engineer-guide/resource-types.md)
