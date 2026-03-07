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

:::warning Imperative Resource
WorkflowRun is an **imperative** resource — it triggers an action rather than declaring a desired state. Each time a
WorkflowRun is applied, it initiates a new execution. For this reason, do not include WorkflowRuns in GitOps
repositories. Instead, create them through Git webhooks, the UI, or direct `kubectl apply` commands.
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
  namespace: <namespace>
```

**WorkflowRuns** should have labels to link the run to a component and project if it is running for a component:

```yaml
metadata:
  labels:
    openchoreo.dev/component: <component-name>
    openchoreo.dev/project: <project-name>
```

These labels are accessible in the Workflow's CEL expressions as `${metadata.labels['openchoreo.dev/component']}` and `${metadata.labels['openchoreo.dev/project']}`.

### Spec Fields

| Field                | Type                              | Required | Default | Description                                                                    |
|----------------------|-----------------------------------|----------|---------|--------------------------------------------------------------------------------|
| `workflow`           | [WorkflowConfig](#workflowconfig) | Yes      | -       | Workflow configuration referencing the Workflow CR and providing parameter values |
| `ttlAfterCompletion` | string                           | No       | -       | Auto-delete duration after completion. Copied from the Workflow template. Pattern: `^(\d+d)?(\d+h)?(\d+m)?(\d+s)?$` |

### WorkflowConfig

| Field        | Type   | Required | Default    | Description                                                                       |
|--------------|--------|----------|------------|-----------------------------------------------------------------------------------|
| `kind`       | string | No       | `Workflow` | Kind of the referenced workflow: `Workflow` (namespace-scoped) or `ClusterWorkflow` (cluster-scoped) |
| `name`       | string | Yes      | -          | Name of the Workflow or ClusterWorkflow CR to use for this execution (min length: 1) |
| `parameters` | object | No       | -          | Developer-provided values conforming to the parameter schema defined in the Workflow or ClusterWorkflow CR |

The `parameters` field contains nested configuration that matches the `schema.parameters` structure defined in the
referenced Workflow.

### Status Fields

| Field            | Type                                        | Default | Description                                                 |
|------------------|---------------------------------------------|---------|-------------------------------------------------------------|
| `conditions`     | []Condition                                 | []      | Standard Kubernetes conditions tracking execution state     |
| `runReference`   | [ResourceReference](#resourcereference)     | -       | Reference to the workflow execution resource in build plane |
| `resources`      | [][ResourceReference](#resourcereference)   | -       | References to additional resources created in build plane (for cleanup) |
| `tasks`          | [][WorkflowTask](#workflowtask)             | -       | Vendor-neutral step status list ordered by execution sequence |
| `startedAt`      | Timestamp                                   | -       | When the workflow run started execution                     |
| `completedAt`    | Timestamp                                   | -       | When the workflow run finished execution (used with TTL for auto-delete) |

#### ResourceReference

| Field        | Type   | Default | Description                                                     |
|--------------|--------|---------|-----------------------------------------------------------------|
| `apiVersion` | string | ""      | API version of the resource (e.g., `v1`, `argoproj.io/v1alpha1`) |
| `kind`       | string | ""      | Kind of the resource (e.g., `Secret`, `Workflow`)               |
| `name`       | string | ""      | Name of the resource in the build plane cluster                 |
| `namespace`  | string | ""      | Namespace of the resource in the build plane cluster            |

#### WorkflowTask

Provides a vendor-neutral abstraction over workflow engine-specific steps (e.g., Argo Workflow nodes).

| Field         | Type      | Default | Description                                                    |
|---------------|-----------|---------|----------------------------------------------------------------|
| `name`        | string    | ""      | Name of the task/step                                          |
| `phase`       | string    | ""      | Execution phase: `Pending`, `Running`, `Succeeded`, `Failed`, `Skipped`, `Error` |
| `startedAt`   | Timestamp | -       | When the task started execution                                |
| `completedAt` | Timestamp | -       | When the task finished execution                               |
| `message`     | string    | ""      | Additional details, typically populated on failure or error     |

#### Condition Types

- `WorkflowCompleted` - Workflow has completed (successfully or with failure)
- `WorkflowRunning` - Workflow is currently executing in the build plane
- `WorkflowSucceeded` - Workflow execution completed successfully
- `WorkflowFailed` - Workflow execution failed or errored

## Examples

### Docker Build WorkflowRun

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: docker-build-run-01
spec:
  workflow:
    name: docker
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

### Component WorkflowRun (with labels)

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: greeter-build-01
  namespace: default
  labels:
    openchoreo.dev/component: greeter-service
    openchoreo.dev/project: default
spec:
  workflow:
    name: docker
    parameters:
      repository:
        url: "https://github.com/openchoreo/sample-workloads"
        secretRef: "github-credentials"
        revision:
          branch: "main"
          commit: "a1b2c3d4"
        appPath: "/service-go-greeter"
      docker:
        context: "/service-go-greeter"
        filePath: "/service-go-greeter/Dockerfile"
```

### Generic Automation WorkflowRun

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: github-stats-report-run-01
spec:
  workflow:
    name: github-stats-report
    parameters:
      source:
        org: "openchoreo"
        repo: "openchoreo"
      output:
        format: "table"
```

### WorkflowRun Referencing a ClusterWorkflow

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: docker-cluster-run-01
  namespace: default
spec:
  workflow:
    kind: ClusterWorkflow
    name: docker
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

### Minimal WorkflowRun Using Defaults

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: simple-run
spec:
  workflow:
    name: docker
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
    apiVersion: argoproj.io/v1alpha1
    kind: Workflow
    name: docker-build-run-01
    namespace: openchoreo-ci-default
  resources:
    - apiVersion: external-secrets.io/v1
      kind: ExternalSecret
      name: docker-build-run-01-git-secret
      namespace: openchoreo-ci-default
  tasks:
    - name: checkout-source
      phase: Succeeded
      startedAt: "2024-01-15T10:28:00Z"
      completedAt: "2024-01-15T10:28:30Z"
    - name: build-image
      phase: Succeeded
      startedAt: "2024-01-15T10:28:30Z"
      completedAt: "2024-01-15T10:29:45Z"
    - name: publish-image
      phase: Succeeded
      startedAt: "2024-01-15T10:29:45Z"
      completedAt: "2024-01-15T10:30:00Z"
  startedAt: "2024-01-15T10:28:00Z"
  completedAt: "2024-01-15T10:30:00Z"
```

## Annotations

| Annotation                    | Description                              |
|-------------------------------|------------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display       |
| `openchoreo.dev/description`  | Detailed description of the workflow run |

## Related Resources

- [Workflow](../platform/workflow.md) - Template definitions for workflow execution
- [ClusterWorkflow](../platform/clusterworkflow.md) - Cluster-scoped workflow template definitions
- [Workflows User Guide](../../../user-guide/workflows/overview.md) - Guide for creating and using workflows
