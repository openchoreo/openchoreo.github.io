---
title: Build API Reference
---

# Build

:::warning Deprecated
The Build resource is deprecated as of OpenChoreo v0.4.0 and will be removed in a future release.
Use [WorkflowRun](workflowrun.md) in combination with [Workflow](../platform/workflow.md) for a more flexible and powerful workflow execution system.
:::

A Build represents a build job in OpenChoreo that transforms source code into a container image. It defines the
source repository, revision, and build template to use for creating workloads. Upon successful
completion, a Build creates a Workload resource containing the built container image.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

Builds are namespace-scoped resources and belong to a Component through the owner field.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Build
metadata:
  name: <build-name>
  namespace: <namespace>  # Namespace for grouping builds
```

### Spec Fields

| Field         | Type                        | Required | Default | Description                                                        |
|---------------|-----------------------------|----------|---------|--------------------------------------------------------------------|
| `owner`       | [BuildOwner](#buildowner)   | Yes      | -       | Ownership information linking the build to a project and component |
| `repository`  | [Repository](#repository)   | Yes      | -       | Source repository configuration                                    |
| `templateRef` | [TemplateRef](#templateref) | Yes      | -       | Build template reference and parameters                            |

### BuildOwner

| Field           | Type   | Required | Default | Description                                         |
|-----------------|--------|----------|---------|-----------------------------------------------------|
| `projectName`   | string | Yes      | -       | Name of the project that owns this build (min: 1)   |
| `componentName` | string | Yes      | -       | Name of the component that owns this build (min: 1) |

### Repository

| Field      | Type                  | Required | Default | Description                                                        |
|------------|-----------------------|----------|---------|--------------------------------------------------------------------|
| `url`      | string                | Yes      | -       | Repository URL (e.g., https://github.com/org/repo)                 |
| `revision` | [Revision](#revision) | Yes      | -       | Revision specification for the build                               |
| `appPath`  | string                | Yes      | -       | Path to the application within the repository (e.g., "." for root) |

### Revision

| Field    | Type   | Required | Default | Description                                                       |
|----------|--------|----------|---------|-------------------------------------------------------------------|
| `branch` | string | No       | ""      | Branch to build from                                              |
| `commit` | string | No       | ""      | Specific commit hash to build from (takes precedence over branch) |

### TemplateRef

| Field        | Type                      | Required | Default | Description                                          |
|--------------|---------------------------|----------|---------|------------------------------------------------------|
| `engine`     | string                    | No       | ""      | Build engine to use                                  |
| `name`       | string                    | Yes      | -       | Name of the build template (ClusterWorkflowTemplate) |
| `parameters` | [[Parameter](#parameter)] | No       | []      | Template parameters                                  |

### Parameter

| Field   | Type   | Required | Default | Description     |
|---------|--------|----------|---------|-----------------|
| `name`  | string | Yes      | -       | Parameter name  |
| `value` | string | Yes      | -       | Parameter value |

### Status Fields

| Field         | Type            | Default | Description                                             |
|---------------|-----------------|---------|---------------------------------------------------------|
| `conditions`  | []Condition     | []      | Standard Kubernetes conditions tracking the build state |
| `imageStatus` | [Image](#image) | {}      | Information about the built image                       |

### Image

| Field   | Type   | Default | Description                                               |
|---------|--------|---------|-----------------------------------------------------------|
| `image` | string | ""      | Full image reference including registry, name, and digest |

#### Condition Types

Common condition types for Build resources:

- `Ready` - Indicates if the build has completed successfully
- `Building` - Indicates if the build is currently in progress
- `Failed` - Indicates if the build has failed

## Examples

### Build with Docker Template

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Build
metadata:
  name: customer-service-build-abc123
  namespace: default
spec:
  owner:
    projectName: my-project
    componentName: customer-service
  repository:
    url: https://github.com/myorg/customer-service
    revision:
      branch: main
      commit: abc123def456
    appPath: .
  templateRef:
    name: docker
    parameters:
      - name: docker-context
        value: .
      - name: dockerfile-path
        value: ./Dockerfile
```

### Build with Buildpacks

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Build
metadata:
  name: frontend-build-xyz789
  namespace: default
spec:
  owner:
    projectName: my-project
    componentName: frontend-app
  repository:
    url: https://github.com/myorg/frontend
    revision:
      branch: develop
    appPath: ./webapp
  templateRef:
    name: google-cloud-buildpacks
```

## Annotations

Builds support the following annotations:

| Annotation                    | Description                        |
|-------------------------------|------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display |
| `openchoreo.dev/description`  | Detailed description of the build  |

## Related Resources

- [Component](./component.md) - Components that trigger builds
- [Workload](./workload.md) - Workloads created by successful builds
- [BuildPlane](../platform/buildplane.md) - Infrastructure where builds execute
