---
title: WorkflowRun API Reference
---

# WorkflowRun

:::warning Deprecated
The WorkflowRun resource is deprecated for component builds and will be removed in a future release. Use
[ComponentWorkflowRun](./componentworkflowrun.md) instead for building components. ComponentWorkflowRun provides
required ownership tracking and structured repository information needed for build-specific platform features like
auto-builds, webhooks, and build traceability.

Generic Workflow Run resources will still be used for non-component automation tasks (Terraform, ETL pipelines, database
migrations, etc.) in the future.
:::

A WorkflowRun represents a runtime execution instance of a Workflow in OpenChoreo. While Workflows define the template
and schema for what can be executed, WorkflowRuns represent actual executions with specific parameter values and
context. WorkflowRuns bridge the gap between developer intent and CI/CD execution, providing a simplified interface
for triggering builds, tests, and automation tasks.

:::note
WorkflowRuns currently support Argo Workflow-based workflows only.
:::

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

WorkflowRuns are namespace-scoped resources.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: <workflowrun-name>
  namespace: <namespace>  # Namespace for grouping workflow runs
```

### Spec Fields

| Field      | Type                              | Required | Default | Description                                                                    |
|------------|-----------------------------------|----------|---------|--------------------------------------------------------------------------------|
| `owner`    | [WorkflowOwner](#workflowowner)   | No       | -       | Optional owner information identifying the Component that triggered this run   |
| `workflow` | [WorkflowConfig](#workflowconfig) | Yes      | -       | Workflow configuration referencing the Workflow CR and providing schema values |

### WorkflowOwner

Owner information is optional and used for component-bound workflows to establish the relationship between builds
and components.

| Field           | Type   | Required | Default | Description                           |
|-----------------|--------|----------|---------|---------------------------------------|
| `projectName`   | string | Yes      | -       | Name of the project (min length: 1)   |
| `componentName` | string | Yes      | -       | Name of the component (min length: 1) |

### WorkflowConfig

| Field    | Type   | Required | Default | Description                                                                       |
|----------|--------|----------|---------|-----------------------------------------------------------------------------------|
| `name`   | string | Yes      | -       | Name of the Workflow CR to use for this execution (min length: 1)                 |
| `schema` | object | No       | -       | Developer-provided values conforming to the schema defined in the Workflow CR     |

The `schema` field contains nested configuration that matches the schema structure defined in the referenced Workflow.

### Status Fields

| Field            | Type                                        | Default | Description                                                 |
|------------------|---------------------------------------------|---------|-------------------------------------------------------------|
| `conditions`     | []Condition                                 | []      | Standard Kubernetes conditions tracking execution state     |
| `imageStatus`    | [WorkflowImage](#workflowimage)             | -       | Information about the built image (for build workflows)     |
| `runReference`   | [WorkflowRunReference](#workflowrunreference) | -     | Reference to the workflow execution resource in build plane |

#### WorkflowImage

| Field   | Type   | Default | Description                                                           |
|---------|--------|---------|-----------------------------------------------------------------------|
| `image` | string | ""      | Fully qualified image name (e.g., registry.example.com/myapp:v1.0.0) |

#### WorkflowRunReference

| Field       | Type   | Default | Description                                                    |
|-------------|--------|---------|----------------------------------------------------------------|
| `name`      | string | ""      | Name of the workflow run resource in the target cluster        |
| `namespace` | string | ""      | Namespace of the workflow run resource in the target cluster   |

#### Condition Types

Common condition types for WorkflowRun resources:

- `Ready` - Indicates if the workflow run has completed successfully
- `Running` - Indicates if the workflow is currently executing
- `Failed` - Indicates if the workflow execution failed

## Examples

### Docker Build WorkflowRun

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: customer-service-build-1
  namespace: default
spec:
  owner:
    projectName: my-project
    componentName: customer-service
  workflow:
    name: docker
    schema:
      repository:
        url: https://github.com/myorg/customer-service
        revision:
          branch: main
          commit: abc123
        appPath: .
        secretRef: github-credentials
      docker:
        context: .
        filePath: ./Dockerfile
```

### Google Cloud Buildpacks WorkflowRun

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: frontend-build-v2
  namespace: default
spec:
  owner:
    projectName: ecommerce
    componentName: frontend-app
  workflow:
    name: google-cloud-buildpacks
    schema:
      repository:
        url: https://github.com/myorg/frontend-app
        revision:
          branch: develop
          commit: def456
        appPath: ./webapp
        secretRef: reading-list-repo-credentials-dev
      version: 2
      testMode: unit
      resources:
        cpuCores: 2
        memoryGb: 4
      timeout: "45m"
      cache:
        enabled: true
        paths:
          - /root/.cache
          - /workspace/node_modules
      limits:
        maxRetries: 2
        maxDurationMinutes: 60
```

### Standalone WorkflowRun (No Component Owner)

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: integration-test-run
  namespace: default
spec:
  workflow:
    name: integration-tests
    schema:
      repository:
        url: https://github.com/myorg/test-suite
        branch: main
        secretRef: test-repo-credentials
      testSuite: smoke
      environment: staging
```

### WorkflowRun with Minimal Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: simple-build
  namespace: default
spec:
  owner:
    projectName: demo
    componentName: hello-world
  workflow:
    name: docker
    schema:
      repository:
        url: https://github.com/myorg/hello-world
        secretRef: github-token
      # Uses default values for other fields from Workflow schema
```

## Status Example

After execution, a WorkflowRun status might look like:

```yaml
status:
  conditions:
    - type: Ready
      status: "True"
      lastTransitionTime: "2024-01-15T10:30:00Z"
      reason: WorkflowSucceeded
      message: Workflow execution completed successfully
  imageStatus:
    image: gcr.io/openchoreo-dev/images/my-project-customer-service-image:v1
  runReference:
    name: customer-service-build-1-abc12
    namespace: openchoreo-ci-default
```

## Annotations

WorkflowRuns support the following annotations:

| Annotation                    | Description                              |
|-------------------------------|------------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display       |
| `openchoreo.dev/description`  | Detailed description of the workflow run |

## Related Resources

- [Workflow](../platform/workflow.md) - Template definitions for workflow execution
- [Component](./component.md) - Components that can trigger WorkflowRuns
- [ComponentType](../platform/componenttype.md) - Can restrict allowed workflows
