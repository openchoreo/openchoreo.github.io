---
title: Component API Reference
---

# Component

A Component represents a deployable unit of an application in OpenChoreo. It serves as the core abstraction that
defines the component type (Service, WebApplication, ScheduledTask, etc.) and optionally includes build configuration
when using OpenChoreo's CI system to build from source. Components are the primary building blocks used to define
applications within a Project.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

Components are namespace-scoped resources that must be created within an Organization's namespace and belong to a
Project through the owner field.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: <component-name>
  namespace: <org-namespace>  # Organization namespace
```

### Spec Fields

| Field   | Type                                          | Required | Default | Description                                                                                            |
|---------|-----------------------------------------------|----------|---------|--------------------------------------------------------------------------------------------------------|
| `owner` | [ComponentOwner](#componentowner)             | Yes      | -       | Ownership information linking the component to a project                                               |
| `type`  | [ComponentType](#componenttype)               | Yes      | -       | Specifies the component type (Service, WebApplication, ScheduledTask, etc.)                            |
| `build` | [BuildSpecInComponent](#buildspecincomponent) | No       | -       | Optional build configuration when using OpenChoreo CI to build from source (omit for pre-built images) |

### ComponentOwner

| Field         | Type   | Required | Default | Description                                           |
|---------------|--------|----------|---------|-------------------------------------------------------|
| `projectName` | string | Yes      | -       | Name of the project that owns this component (min: 1) |

### ComponentType

The component type determines how the component will be deployed and what resources it can create.

| Value            | Description                         |
|------------------|-------------------------------------|
| `Service`        | Long-running service component      |
| `WebApplication` | Web application with HTTP endpoints |
| `ScheduledTask`  | Scheduled/cron job component        |

### BuildSpecInComponent

| Field         | Type                                | Required | Default | Description                                                           |
|---------------|-------------------------------------|----------|---------|-----------------------------------------------------------------------|
| `repository`  | [BuildRepository](#buildrepository) | Yes      | -       | Source repository configuration where the component code resides      |
| `templateRef` | [TemplateRef](#templateref)         | Yes      | -       | Build template reference (ClusterWorkflowTemplate in the build plane) |

### BuildRepository

| Field      | Type                            | Required | Default | Description                                                                 |
|------------|---------------------------------|----------|---------|-----------------------------------------------------------------------------|
| `url`      | string                          | Yes      | -       | Repository URL (e.g., https://github.com/org/repo)                          |
| `revision` | [BuildRevision](#buildrevision) | Yes      | -       | Default revision configuration for builds                                   |
| `appPath`  | string                          | Yes      | -       | Path to the application within the repository (relative to root, e.g., ".") |

### BuildRevision

| Field    | Type   | Required | Default | Description                                                   |
|----------|--------|----------|---------|---------------------------------------------------------------|
| `branch` | string | Yes      | -       | Default branch to build from when no specific commit provided |

### TemplateRef

| Field        | Type                      | Required | Default | Description                |
|--------------|---------------------------|----------|---------|----------------------------|
| `engine`     | string                    | No       | -       | Build engine to use        |
| `name`       | string                    | Yes      | -       | Name of the build template |
| `parameters` | [[Parameter](#parameter)] | No       | []      | Template parameters        |

### Parameter

| Field   | Type   | Required | Default | Description     |
|---------|--------|----------|---------|-----------------|
| `name`  | string | Yes      | -       | Parameter name  |
| `value` | string | Yes      | -       | Parameter value |

### Status Fields

| Field                | Type        | Default | Description                                             |
|----------------------|-------------|---------|---------------------------------------------------------|
| `observedGeneration` | integer     | 0       | The generation observed by the controller               |
| `conditions`         | []Condition | []      | Standard Kubernetes conditions tracking component state |

#### Condition Types

Common condition types for Component resources:

- `Ready` - Indicates if the component is ready
- `Reconciled` - Indicates if the controller has successfully reconciled the component

## Examples

### Service Component with Docker Build

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: customer-service
  namespace: default
spec:
  owner:
    projectName: my-project
  type: Service
  build:
    repository:
      url: https://github.com/myorg/customer-service
      revision:
        branch: main
      appPath: .
    templateRef:
      name: docker
      parameters:
        - name: docker-context
          value: .
        - name: dockerfile-path
          value: ./Dockerfile
```

### WebApplication Component with Buildpacks

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: frontend-app
  namespace: default
spec:
  owner:
    projectName: my-project
  type: WebApplication
  build:
    repository:
      url: https://github.com/myorg/frontend
      revision:
        branch: develop
      appPath: ./webapp
    templateRef:
      name: google-cloud-buildpacks
```

## Annotations

Components support the following annotations:

| Annotation                    | Description                           |
|-------------------------------|---------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display    |
| `openchoreo.dev/description`  | Detailed description of the component |

## Related Resources

- [Project](./project.md) - Contains components
- [Build](./build.md) - Build jobs triggered by components
- [Workload](./workload.md) - Workload definitions associated with components
- [Service](./service.md) - Service-type component resources
- [WebApplication](./webapplication.md) - WebApplication-type component resources
- [ScheduledTask](./scheduledtask.md) - ScheduledTask-type component resources
