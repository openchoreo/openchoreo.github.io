---
title: ClusterTrait API Reference
---

# ClusterTrait

A ClusterTrait is a cluster-scoped variant of [Trait](./trait.md) that defines reusable cross-cutting concerns
available across namespaces. This enables platform engineers to define shared traits once — such as persistent
storage, observability, or security policies — and allow Components in any namespace to reference them, eliminating
duplication.

ClusterTraits share the same spec structure as Traits. The only difference is scope: ClusterTraits are cluster-scoped
(no namespace), while Traits are namespace-scoped.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ClusterTraits are cluster-scoped resources (no namespace).

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterTrait
metadata:
  name: <clustertrait-name>
```

### Spec Fields

| Field     | Type                                       | Required | Default | Description                                       |
|-----------|--------------------------------------------|----------|---------|---------------------------------------------------|
| `schema`  | [TraitSchema](./trait.md#traitschema)      | No       | -       | Configurable parameters for this trait             |
| `creates` | [[TraitCreate](./trait.md#traitcreate)]    | No       | []      | New Kubernetes resources to create                 |
| `patches` | [[TraitPatch](./trait.md#traitpatch)]      | No       | []      | Modifications to existing ComponentType resources  |

The `schema`, `creates`, and `patches` fields follow the same structure as [Trait](./trait.md). Refer to the Trait
documentation for details on [TraitSchema](./trait.md#traitschema), [TraitCreate](./trait.md#traitcreate),
[TraitPatch](./trait.md#traitpatch), and [CEL expression context variables](./trait.md#traitcreate).

## Examples

### Persistent Volume ClusterTrait

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterTrait
metadata:
  name: persistent-volume
spec:
  schema:
    parameters:
      volumeName: "string | required=true"
      mountPath: "string | required=true"
      containerName: "string | default=app"

    envOverrides:
      size: "string | default=10Gi"
      storageClass: "string | default=standard"

  creates:
    - targetPlane: dataplane
      template:
        apiVersion: v1
        kind: PersistentVolumeClaim
        metadata:
          name: ${metadata.name}-${parameters.volumeName}
          namespace: ${metadata.namespace}
        spec:
          accessModes:
            - ReadWriteOnce
          resources:
            requests:
              storage: ${envOverrides.size}
          storageClassName: ${envOverrides.storageClass}

  patches:
    - target:
        group: apps
        version: v1
        kind: Deployment
      targetPlane: dataplane
      operations:
        - op: add
          path: /spec/template/spec/volumes/-
          value:
            name: ${parameters.volumeName}
            persistentVolumeClaim:
              claimName: ${metadata.name}-${parameters.volumeName}
        - op: add
          path: /spec/template/spec/containers/[?(@.name=='${parameters.containerName}')]/volumeMounts/-
          value:
            name: ${parameters.volumeName}
            mountPath: ${parameters.mountPath}
```

## Related Resources

- [Trait](./trait.md) - Namespace-scoped variant of ClusterTrait
- [ComponentType](./componenttype.md) - Defines the base deployment pattern that traits modify
- [ClusterComponentType](./clustercomponenttype.md) - Cluster-scoped variant of ComponentType
- [Component](../application/component.md) - Attaches traits to components
- [ReleaseBinding](releasebinding.md) - Binds a ComponentRelease to an environment with trait parameter overrides
