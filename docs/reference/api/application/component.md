---
title: Component API Reference
description: Deployable unit of an application, referencing a ComponentType within a Project
---

# Component

A Component represents a deployable unit of an application in OpenChoreo. It serves as the core abstraction that
references a platform-defined ComponentType (or ClusterComponentType) and optionally includes
workflow configuration when using OpenChoreo's CI system to build from source. Components are the primary building blocks
used to define applications within a Project.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

Components are namespace-scoped resources and belong to a Project through the owner field.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: <component-name>
  namespace: <namespace> # Namespace for grouping components
```

### Spec Fields

| Field           | Type                                                | Required | Default | Description                                                                                          |
| --------------- | --------------------------------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `owner`         | [ComponentOwner](#componentowner)                   | Yes      | -       | Ownership information linking the component to a project                                             |
| `componentType` | [ComponentTypeRef](#componenttyperef)               | Yes      | -       | Reference to a ComponentType or ClusterComponentType                                                 |
| `autoDeploy`    | boolean                                             | No       | `false` | Automatically deploy the component when created                                                      |
| `autoBuild`     | boolean                                             | No       | -       | Automatically trigger builds when code is pushed; requires webhook configuration in the Git provider |
| `parameters`    | object                                              | No       | -       | Parameter values merged from the ComponentType's parameter and environmentConfigs schema             |
| `traits`        | [[ComponentTrait](#componenttrait)]                 | No       | []      | Traits to compose into this component; each trait can be instantiated multiple times                 |
| `workflow`      | [ComponentWorkflowConfig](#componentworkflowconfig) | No       | -       | Workflow configuration for building the component; references a Workflow or ClusterWorkflow CR       |

### ComponentOwner

| Field         | Type   | Required | Default | Description                                           |
| ------------- | ------ | -------- | ------- | ----------------------------------------------------- |
| `projectName` | string | Yes      | -       | Name of the project that owns this component (min: 1) |

### ComponentTypeRef

| Field  | Type   | Required | Default         | Description                                                                                                    |
| ------ | ------ | -------- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| `kind` | string | No       | `ComponentType` | Kind of the referenced resource: `ComponentType` (namespace-scoped) or `ClusterComponentType` (cluster-scoped) |
| `name` | string | Yes      | -               | Name in `{workloadType}/{componentTypeName}` format (e.g., `deployment/service`)                               |

The `componentType` field references a platform-defined [ComponentType](../platform/componenttype.md) or [ClusterComponentType](../platform/clustercomponenttype.md)
using a structured object with `kind` and `name` fields. The `kind` defaults to `ComponentType` (namespace-scoped) but can be set
to `ClusterComponentType` for cluster-scoped types.

### ComponentWorkflowConfig

Defines the workflow used to build the component. The referenced Workflow must be listed in the `allowedWorkflows` of the ComponentType.

| Field        | Type   | Required | Default           | Description                                                                                        |
| ------------ | ------ | -------- | ----------------- | -------------------------------------------------------------------------------------------------- |
| `kind`       | string | No       | `ClusterWorkflow` | Kind of the workflow resource: `Workflow` (namespace-scoped) or `ClusterWorkflow` (cluster-scoped) |
| `name`       | string | Yes      | -                 | Name of the Workflow or ClusterWorkflow CR to use                                                  |
| `parameters` | object | No       | -                 | Developer-provided parameter values validated against the Workflow's schema                        |

### ComponentTrait

| Field          | Type   | Required | Default | Description                                                                               |
| -------------- | ------ | -------- | ------- | ----------------------------------------------------------------------------------------- |
| `kind`         | string | No       | `Trait` | Kind of the trait resource: `Trait` (namespace-scoped) or `ClusterTrait` (cluster-scoped) |
| `name`         | string | Yes      | -       | Name of the Trait resource to use (min: 1)                                                |
| `instanceName` | string | Yes      | -       | Unique identifier for this trait instance within the component (min: 1)                   |
| `parameters`   | object | No       | -       | Trait parameter values; schema is defined by the Trait resource                           |

### Status Fields

| Field                | Type          | Default | Description                                                              |
| -------------------- | ------------- | ------- | ------------------------------------------------------------------------ |
| `observedGeneration` | integer       | 0       | The generation observed by the controller                                |
| `conditions`         | []Condition   | []      | Standard Kubernetes conditions tracking component state                  |
| `latestRelease`      | LatestRelease | -       | Information about the latest ComponentRelease created for this component |

#### LatestRelease

| Field         | Type   | Description                                  |
| ------------- | ------ | -------------------------------------------- |
| `name`        | string | Name of the latest ComponentRelease resource |
| `releaseHash` | string | Hash of the ComponentRelease spec            |

#### Condition Types

Common condition types for Component resources:

- `Ready` - Indicates if the component is ready
- `Reconciled` - Indicates if the controller has successfully reconciled the component

## Examples

### Service Component with Workflow Build

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: customer-service
  namespace: default
spec:
  owner:
    projectName: my-project
  componentType:
    kind: ComponentType
    name: deployment/service
  workflow:
    name: docker
    parameters:
      dockerContext: .
      dockerfilePath: ./Dockerfile
```

### WebApplication Component with Auto Deploy

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: frontend-app
  namespace: default
spec:
  owner:
    projectName: my-project
  componentType:
    kind: ComponentType
    name: deployment/web-app
  autoDeploy: true
  autoBuild: true
  workflow:
    kind: ClusterWorkflow
    name: google-cloud-buildpacks
```

### Component with Traits

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: backend-service
  namespace: default
spec:
  owner:
    projectName: my-project
  componentType:
    kind: ClusterComponentType
    name: deployment/service
  traits:
    - kind: ClusterTrait
      name: oauth2-proxy
      instanceName: auth
      parameters:
        provider: github
```

## Annotations

Components support the following annotations:

| Annotation                    | Description                           |
| ----------------------------- | ------------------------------------- |
| `openchoreo.dev/display-name` | Human-readable name for UI display    |
| `openchoreo.dev/description`  | Detailed description of the component |

## Related Resources

- [Project](./project.md) - Contains components
- [Workload](./workload.md) - Workload definitions associated with components
- [ComponentType](../platform/componenttype.md) - Platform-defined templates referenced by components
- [ComponentRelease](../runtime/componentrelease.md) - Immutable release snapshots for deployment
