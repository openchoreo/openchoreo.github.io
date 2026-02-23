---
title: WorkflowRun API Reference
---

# WorkflowRun

A WorkflowRun represents a single execution instance of a [Workflow](../platform/workflow.md) in OpenChoreo. While
Workflows define the template and parameter schema for what can be executed, WorkflowRuns represent actual executions
with specific parameter values. When created, the controller renders and executes the Argo Workflow in the build plane.

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
| `workflow` | [WorkflowConfig](#workflowconfig) | Yes      | -       | Workflow configuration referencing the Workflow CR and providing parameter values |

### WorkflowConfig

| Field        | Type   | Required | Default | Description                                                                       |
|--------------|--------|----------|---------|-----------------------------------------------------------------------------------|
| `name`       | string | Yes      | -       | Name of the Workflow CR to use for this execution (min length: 1)                 |
| `parameters` | object | No       | -       | Developer-provided values conforming to the parameter schema defined in the Workflow CR |

The `parameters` field contains nested configuration that matches the `schema.parameters` structure defined in the
referenced Workflow.

### Status Fields

| Field            | Type                                          | Default | Description                                                 |
|------------------|-----------------------------------------------|---------|-------------------------------------------------------------|
| `conditions`     | []Condition                                   | []      | Standard Kubernetes conditions tracking execution state     |
| `runReference`   | [WorkflowRunReference](#workflowrunreference) | -       | Reference to the workflow execution resource in build plane |

#### WorkflowRunReference

| Field       | Type   | Default | Description                                                    |
|-------------|--------|---------|----------------------------------------------------------------|
| `name`      | string | ""      | Name of the workflow run resource in the target cluster        |
| `namespace` | string | ""      | Namespace of the workflow run resource in the target cluster   |

#### Condition Types

Common condition types for WorkflowRun resources:

- `WorkflowCompleted` - Indicates if the workflow has completed (successfully or with failure)
- `WorkflowRunning` - Indicates if the workflow is currently executing in the build plane
- `WorkflowSucceeded` - Indicates if the workflow execution completed successfully
- `WorkflowFailed` - Indicates if the workflow execution failed or errored

## Examples

### Docker Build WorkflowRun

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: generic-workflow-run-docker-build-01
spec:
  workflow:
    name: generic-workflow-docker-build
    parameters:
      repository:
        url: "https://github.com/openchoreo/sample-workloads"
        revision:
          branch: "main"
        appPath: "/service-go-greeter"
      docker:
        context: "/service-go-greeter"
        filePath: "/service-go-greeter/Dockerfile"
```

### Docker Build with Specific Commit

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: generic-workflow-run-docker-build-02
spec:
  workflow:
    name: generic-workflow-docker-build
    parameters:
      repository:
        url: "https://github.com/openchoreo/sample-workloads"
        revision:
          branch: "main"
          commit: "a1b2c3d4"
        appPath: "/service-go-greeter"
      docker:
        context: "/service-go-greeter"
        filePath: "/service-go-greeter/Dockerfile"
```

### Integration Test WorkflowRun

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: integration-test-run-01
spec:
  workflow:
    name: integration-tests
    parameters:
      repository:
        url: "https://github.com/myorg/test-suite"
        branch: "main"
      testCommand: "npm run test:integration"
      environment: "staging"
```

### Minimal WorkflowRun Using Defaults

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: simple-workflow-run
spec:
  workflow:
    name: generic-workflow-docker-build
    parameters:
      repository:
        url: "https://github.com/myorg/hello-world"
    # Uses default values for other parameters from Workflow schema
```

## Status Example

After execution, a WorkflowRun status might look like:

```yaml
status:
  conditions:
    - type: WorkflowCompleted
      status: "True"
      lastTransitionTime: "2024-01-15T10:30:00Z"
      reason: WorkflowSucceeded
      message: Workflow has completed successfully
      observedGeneration: 1
    - type: WorkflowRunning
      status: "False"
      lastTransitionTime: "2024-01-15T10:29:30Z"
      reason: WorkflowRunning
      message: Argo Workflow running has completed
      observedGeneration: 1
    - type: WorkflowSucceeded
      status: "True"
      lastTransitionTime: "2024-01-15T10:30:00Z"
      reason: WorkflowSucceeded
      message: Workflow completed successfully
      observedGeneration: 1
  runReference:
    name: generic-workflow-run-docker-build-01
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
- [Generic Workflows Guide](../../../user-guide/ci/generic-workflows.md) - User guide for creating and using generic workflows
- [ComponentWorkflowRun](./componentworkflowrun.md) - Specialized workflow runs for building components
