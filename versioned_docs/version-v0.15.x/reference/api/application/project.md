---
title: Project API Reference
---

# Project

A Project represents a cloud-native application composed of multiple components in OpenChoreo. It serves as the
fundamental unit of isolation and provides a logical boundary for organizing related components, services, and
resources.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

Projects are namespace-scoped resources.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Project
metadata:
  name: <project-name>
  namespace: <namespace>  # Namespace for grouping projects
```

### Spec Fields

| Field                   | Type                                    | Required | Default | Description                                                                                                                                                                     |
|-------------------------|-----------------------------------------|----------|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `deploymentPipelineRef` | string                                  | Yes      | -       | Reference to the DeploymentPipeline that defines the promotion paths between environments for this project. Must reference an existing DeploymentPipeline in the same namespace |
| `buildPlaneRef`         | [BuildPlaneRef](#buildplaneref)         | No       | -       | Reference to the BuildPlane or ClusterBuildPlane for building this project's components                                                                                        |

### BuildPlaneRef

Reference to a BuildPlane or ClusterBuildPlane for building this project's components.

| Field  | Type   | Required | Default      | Description                                                      |
|--------|--------|----------|--------------|------------------------------------------------------------------|
| `kind` | string | No       | `BuildPlane` | Kind of the build plane (`BuildPlane` or `ClusterBuildPlane`)    |
| `name` | string | Yes      | -            | Name of the build plane resource                                 |

:::note BuildPlane Resolution
If `buildPlaneRef` is not specified, the system resolves a BuildPlane using the following fallback order:
1. Default BuildPlane in the project's namespace
2. ClusterBuildPlane named "default"
3. First available BuildPlane or ClusterBuildPlane
:::

### Status Fields

| Field                | Type        | Default | Description                                               |
|----------------------|-------------|---------|-----------------------------------------------------------|
| `observedGeneration` | integer     | 0       | The generation observed by the controller                 |
| `conditions`         | []Condition | []      | Standard Kubernetes conditions tracking the project state |

#### Condition Types

Common condition types for Project resources:

- `Ready` - Indicates if the project is fully provisioned and ready
- `Reconciled` - Indicates if the controller has successfully reconciled the project
- `NamespaceProvisioned` - Indicates if project namespaces have been created in all environments

## Examples

### Basic Project

A simple project referencing the default deployment pipeline:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Project
metadata:
  name: internal-apps
  namespace: default
  annotations:
    openchoreo.dev/display-name: Internal Applications
    openchoreo.dev/description: This project contains components that are used by company's internal applications
spec:
  deploymentPipelineRef: default-deployment-pipeline
```

### Project with Explicit BuildPlaneRef

A project with an explicit reference to a BuildPlane:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Project
metadata:
  name: internal-apps
  namespace: default
  annotations:
    openchoreo.dev/display-name: Internal Applications
    openchoreo.dev/description: This project contains components built on a dedicated build plane
spec:
  deploymentPipelineRef: default-deployment-pipeline
  buildPlaneRef:
    kind: BuildPlane
    name: dedicated-buildplane
```

### Project with ClusterBuildPlane

A project referencing a cluster-scoped build plane:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Project
metadata:
  name: shared-apps
  namespace: default
spec:
  deploymentPipelineRef: default-deployment-pipeline
  buildPlaneRef:
    kind: ClusterBuildPlane
    name: shared-buildplane
```

## Annotations

Projects support the following annotations:

| Annotation                    | Description                         |
|-------------------------------|-------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display  |
| `openchoreo.dev/description`  | Detailed description of the project |

## Related Resources

- [Component](./component.md) - Deployable units within projects
- [DeploymentPipeline](../platform/deployment-pipeline.md) - Defines environment promotion paths
- [BuildPlane](../platform/buildplane.md) - Namespace-scoped build plane for CI/CD
- [ClusterBuildPlane](../platform/clusterbuildplane.md) - Cluster-scoped build plane for CI/CD
