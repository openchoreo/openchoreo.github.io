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
| `deploymentPipelineRef` | [DeploymentPipelineRef](#deploymentpipelineref) | Yes      | -       | Reference to the DeploymentPipeline that defines the promotion paths between environments for this project. Must reference an existing DeploymentPipeline in the same namespace |
| `workflowPlaneRef`         | [WorkflowPlaneRef](#workflowplaneref)         | No       | -       | Reference to the WorkflowPlane or ClusterWorkflowPlane for building this project's components                                                                                        |

### DeploymentPipelineRef

Reference to a DeploymentPipeline that defines the promotion paths between environments for this project.

| Field  | Type   | Required | Default              | Description                                     |
|--------|--------|----------|----------------------|-------------------------------------------------|
| `kind` | string | No       | `DeploymentPipeline` | Kind of the deployment pipeline resource        |
| `name` | string | Yes      | -                    | Name of the deployment pipeline resource        |

### WorkflowPlaneRef

Reference to a WorkflowPlane or ClusterWorkflowPlane for building this project's components.

| Field  | Type   | Required | Default      | Description                                                      |
|--------|--------|----------|--------------|------------------------------------------------------------------|
| `kind` | string | No       | `WorkflowPlane` | Kind of the workflow plane (`WorkflowPlane` or `ClusterWorkflowPlane`)    |
| `name` | string | Yes      | -            | Name of the workflow plane resource                                 |

:::note WorkflowPlane Resolution
If `workflowPlaneRef` is not specified, the system resolves a WorkflowPlane using the following fallback order:
1. Default WorkflowPlane in the project's namespace
2. ClusterWorkflowPlane named "default"
3. First available WorkflowPlane or ClusterWorkflowPlane
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
  deploymentPipelineRef:
    name: default-deployment-pipeline
```

### Project with Explicit WorkflowPlaneRef

A project with an explicit reference to a WorkflowPlane:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Project
metadata:
  name: internal-apps
  namespace: default
  annotations:
    openchoreo.dev/display-name: Internal Applications
    openchoreo.dev/description: This project contains components built on a dedicated workflow plane
spec:
  deploymentPipelineRef:
    name: default-deployment-pipeline
  workflowPlaneRef:
    kind: WorkflowPlane
    name: dedicated-workflowplane
```

### Project with ClusterWorkflowPlane

A project referencing a cluster-scoped workflow plane:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Project
metadata:
  name: shared-apps
  namespace: default
spec:
  deploymentPipelineRef:
    name: default-deployment-pipeline
  workflowPlaneRef:
    kind: ClusterWorkflowPlane
    name: shared-workflowplane
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
- [WorkflowPlane](../platform/workflowplane.md) - Namespace-scoped workflow plane for CI/CD
- [ClusterWorkflowPlane](../platform/clusterworkflowplane.md) - Cluster-scoped workflow plane for CI/CD
