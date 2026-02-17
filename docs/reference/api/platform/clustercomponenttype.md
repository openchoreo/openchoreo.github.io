---
title: ClusterComponentType API Reference
---

# ClusterComponentType

A ClusterComponentType is a cluster-scoped variant of [ComponentType](./componenttype.md) that defines reusable
deployment templates available across all namespaces. This enables platform engineers to define shared component types
once and reference them from Components in any namespace, eliminating duplication.

ClusterComponentTypes share the same spec structure as ComponentTypes. The only difference is scope:
ClusterComponentTypes are cluster-scoped (no namespace), while ComponentTypes are namespace-scoped.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ClusterComponentTypes are cluster-scoped resources (no namespace).

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterComponentType
metadata:
  name: <clustercomponenttype-name>
```

### Spec Fields

| Field              | Type                                                                        | Required | Default | Description                                                                         |
|--------------------|-----------------------------------------------------------------------------|----------|---------|-------------------------------------------------------------------------------------|
| `workloadType`     | string                                                                      | Yes      | -       | Primary workload type: `deployment`, `statefulset`, `cronjob`, `job`, `proxy`       |
| `allowedWorkflows` | []string                                                                    | No       | []      | Names of Workflows that developers can use for building this component type         |
| `allowedTraits`    | [[TraitRef](./componenttype.md#traitref)]                                   | No       | []      | Traits that can be attached to components of this type                              |
| `schema`           | [ComponentTypeSchema](./componenttype.md#componenttypeschema)               | No       | -       | Configurable parameters for components of this type                                 |
| `resources`        | [[ResourceTemplate](./componenttype.md#resourcetemplate)]                   | Yes      | -       | Templates for generating Kubernetes resources                                       |

:::note
The `workloadType` field is immutable after creation and determines the primary resource type for components of this
type.
:::

The `schema` and `resources` fields follow the same structure as [ComponentType](./componenttype.md). Refer to the
ComponentType documentation for details on [ComponentTypeSchema](./componenttype.md#componenttypeschema),
[ResourceTemplate](./componenttype.md#resourcetemplate), and [CEL expression syntax](./componenttype.md#cel-expression-syntax).

## Examples

### Basic Deployment ClusterComponentType

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterComponentType
metadata:
  name: service
spec:
  workloadType: deployment

  schema:
    parameters:
      replicas: "integer | default=1"
      port: "integer | default=80"
      containerName: "string | default=main"

  resources:
    - id: deployment
      template:
        apiVersion: apps/v1
        kind: Deployment
        metadata:
          name: ${metadata.name}
          namespace: ${metadata.namespace}
        spec:
          replicas: ${parameters.replicas}
          selector:
            matchLabels: ${metadata.podSelectors}
          template:
            metadata:
              labels: ${metadata.podSelectors}
            spec:
              containers:
                - name: ${parameters.containerName}
                  image: ${workload.containers[parameters.containerName].image}
                  ports:
                    - containerPort: ${parameters.port}
```

## Related Resources

- [ComponentType](./componenttype.md) - Namespace-scoped variant of ClusterComponentType
- [Configuration Helpers](../../cel/configuration-helpers.md) - Configuration helper functions reference
- [Component](../application/component.md) - Uses ComponentTypes or ClusterComponentTypes for deployment
- [ReleaseBinding](releasebinding.md) - Binds a ComponentRelease to an environment with parameter overrides
- [Trait](trait.md) - Adds cross-cutting concerns to components
