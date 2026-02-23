---
title: ComponentWorkflowRun API Reference
---

# ComponentWorkflowRun

A ComponentWorkflowRun represents a runtime execution instance of a ComponentWorkflow - a specialized workflow type
designed specifically for building components. ComponentWorkflowRuns bridge the gap between developer intent and CI/CD
execution for component builds, providing ownership tracking, structured repository information, and flexible build
parameters.

:::note
ComponentWorkflowRuns currently support Argo Workflow-based workflows only.
:::

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ComponentWorkflowRuns are namespace-scoped resources.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentWorkflowRun
metadata:
  name: <componentworkflowrun-name>
  namespace: <namespace>  # Namespace for grouping component workflow runs
```

### Spec Fields

| Field      | Type                                                        | Required | Default | Description                                                                                 |
|------------|-------------------------------------------------------------|----------|---------|---------------------------------------------------------------------------------------------|
| `owner`    | [ComponentWorkflowOwner](#componentworkflowowner)           | Yes      | -       | Owner information identifying the Component and Project for this build                      |
| `workflow` | [ComponentWorkflowRunConfig](#componentworkflowrunconfig)   | Yes      | -       | Workflow configuration referencing the ComponentWorkflow and providing parameter values     |

### ComponentWorkflowOwner

Owner information links the build execution to a specific component and project, enabling traceability and build
history tracking.

| Field           | Type   | Required | Default | Description                           |
|-----------------|--------|----------|---------|---------------------------------------|
| `projectName`   | string | Yes      | -       | Name of the project (min length: 1)   |
| `componentName` | string | Yes      | -       | Name of the component (min length: 1) |

### ComponentWorkflowRunConfig

| Field              | Type   | Required | Default | Description                                                                                      |
|--------------------|--------|----------|---------|--------------------------------------------------------------------------------------------------|
| `name`             | string | Yes      | -       | Name of the ComponentWorkflow CR to use for this execution (min length: 1)                       |
| `systemParameters` | object | Yes      | -       | Repository information following the required structure (url, secretRef, revision.branch, revision.commit, appPath) |
| `parameters`       | object | No       | -       | Developer-provided values conforming to the flexible parameter schema defined in the ComponentWorkflow |

#### System Parameters Structure

System parameters must follow this required structure:

```yaml
systemParameters:
  repository:
    url: string                # Required: Git repository URL (must start with http:// or https://)
    secretRef: string          # Optional: Name of SecretReference CR for private repo authentication
    revision:
      branch: string           # Required: Git branch name
      commit: string           # Optional: Specific commit SHA (7-40 hex characters)
    appPath: string            # Required: Path to application code within repository
```

**Private Repository Access:**

The optional `secretRef` field enables authentication for private Git repositories:
- References a `SecretReference` CR in the same namespace
- Credentials are synced from external secret stores to the build plane during execution
- Only required for private repositories; omit for public repositories

#### Parameters

The `parameters` field contains flexible configuration that matches the developer parameters schema defined in the
referenced ComponentWorkflow. These values are validated against the ComponentWorkflow's parameter schema.

### Status Fields

| Field            | Type                                              | Default | Description                                                 |
|------------------|---------------------------------------------------|---------|-------------------------------------------------------------|
| `conditions`     | []Condition                                       | []      | Standard Kubernetes conditions tracking execution state     |
| `imageStatus`    | [ComponentWorkflowImage](#componentworkflowimage) | -       | Information about the built container image                 |
| `runReference`   | [ResourceReference](#resourcereference)           | -       | Reference to the workflow execution resource in build plane |
| `resources`      | [][ResourceReference](#resourcereference)         | -       | References to additional resources created in build plane (for cleanup) |

#### ComponentWorkflowImage

| Field   | Type   | Default | Description                                                           |
|---------|--------|---------|-----------------------------------------------------------------------|
| `image` | string | ""      | Fully qualified image name (e.g., registry.example.com/myapp:v1.0.0) |

#### ResourceReference

| Field        | Type   | Default | Description                                                     |
|--------------|--------|---------|-----------------------------------------------------------------|
| `apiVersion` | string | ""      | API version of the resource (e.g., "v1", "apps/v1")            |
| `kind`       | string | ""      | Kind of the resource (e.g., "Secret", "ConfigMap", "Workflow") |
| `name`       | string | ""      | Name of the resource in the build plane cluster                |
| `namespace`  | string | ""      | Namespace of the resource in the build plane cluster           |

#### Condition Types

ComponentWorkflowRun resources use the following condition types to track execution state:

- `WorkflowCompleted` - Indicates if the workflow has completed (successfully or with failure)
- `WorkflowRunning` - Indicates if the workflow is currently executing in the build plane
- `WorkflowSucceeded` - Indicates if the workflow execution completed successfully
- `WorkflowFailed` - Indicates if the workflow execution failed or errored
- `WorkloadUpdated` - Indicates if the Workload CR was successfully created/updated after workflow success

#### Condition Reasons

Common reasons used in ComponentWorkflowRun conditions:

- `WorkflowPending` - Workflow has not been initiated yet
- `WorkflowRunning` - Workflow is currently executing
- `WorkflowSucceeded` - Workflow completed successfully
- `WorkflowFailed` - Workflow execution failed
- `WorkloadUpdated` - Workload CR successfully created/updated
- `WorkloadUpdateFailed` - Failed to create/update Workload CR

## Examples

### Google Cloud Buildpacks ComponentWorkflowRun

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentWorkflowRun
metadata:
  name: reading-list-service-build-01
  namespace: default
spec:
  owner:
    projectName: "default"
    componentName: "reading-list-service"

  workflow:
    name: google-cloud-buildpacks

    systemParameters:
      repository:
        url: "https://github.com/openchoreo/sample-workloads"
        revision:
          branch: "main"
          commit: "a1b2c3d4e5f6"
        appPath: "/service-go-reading-list"

    parameters:
      version: 1
      testMode: "integration"
      command: ["npm", "run", "build"]
      args: ["--production", "--verbose"]
      resources:
        cpuCores: 2
        memoryGb: 4
      timeout: "45m"
      cache:
        enabled: true
        paths: ["/root/.npm", "/root/.cache"]
      limits:
        maxRetries: 5
        maxDurationMinutes: 90
```

### Docker Build ComponentWorkflowRun

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentWorkflowRun
metadata:
  name: customer-service-build-1
  namespace: default
spec:
  owner:
    projectName: my-project
    componentName: customer-service

  workflow:
    name: docker

    systemParameters:
      repository:
        url: "https://github.com/openchoreo/customer-service"
        revision:
          branch: "main"
          commit: "abc123def456"
        appPath: "."

    parameters:
      docker:
        context: "."
        filePath: "./Dockerfile"
      buildArgs: ["ENV=production", "VERSION=1.0.0"]
```

### ComponentWorkflowRun with Latest Commit

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentWorkflowRun
metadata:
  name: frontend-build-latest
  namespace: default
spec:
  owner:
    projectName: ecommerce
    componentName: frontend-app

  workflow:
    name: google-cloud-buildpacks

    systemParameters:
      repository:
        url: "https://github.com/myorg/frontend-app"
        revision:
          branch: "develop"
          # No commit specified - will use latest from branch
        appPath: "./webapp"

    parameters:
      version: 2
      testMode: "unit"
      resources:
        cpuCores: 4
        memoryGb: 8
```

### Minimal ComponentWorkflowRun Using Defaults

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentWorkflowRun
metadata:
  name: simple-build
  namespace: default
spec:
  owner:
    projectName: demo
    componentName: hello-world

  workflow:
    name: docker

    systemParameters:
      repository:
        url: "https://github.com/myorg/hello-world"
        revision:
          branch: "main"
        appPath: "."
    # Uses default values for parameters from ComponentWorkflow schema
```

### Private Repository Workflow with SecretRef

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentWorkflowRun
metadata:
  name: payment-service-build-1
  namespace: default
spec:
  owner:
    projectName: ecommerce
    componentName: payment-service

  workflow:
    name: docker

    systemParameters:
      repository:
        url: "https://github.com/myorg/private-payment-service"
        secretRef: "github-credentials"  # References SecretReference for auth
        revision:
          branch: "main"
          commit: "def456abc789"
        appPath: "."

    parameters:
      docker:
        context: "."
        filePath: "./Dockerfile"
```

## Status Example

After successful execution, a ComponentWorkflowRun status might look like:

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
    - type: WorkloadUpdated
      status: "True"
      lastTransitionTime: "2024-01-15T10:30:15Z"
      reason: WorkloadUpdated
      message: Workload CR created/updated successfully
      observedGeneration: 1
  imageStatus:
    image: gcr.io/openchoreo-dev/images/default-reading-list-service-image:v1-a1b2c3d4
  runReference:
    apiVersion: argoproj.io/v1alpha1
    kind: Workflow
    name: reading-list-service-build-01
    namespace: openchoreo-ci-default
  resources:
    - apiVersion: external-secrets.io/v1
      kind: ExternalSecret
      name: reading-list-service-build-01-git-secret
      namespace: openchoreo-ci-default
```

## Build-Specific Platform Features

The structured system parameters in ComponentWorkflowRun enable several build-specific platform features:

### Manual Build Actions
The UI can offer actions like "build from latest commit" or "build from specific commit" by reliably locating
repository URL, branch, and commit fields.

### Auto-Build / Webhook Integration
Automated builds triggered by Git push events use:
- `repository.url` and `repository.appPath` - To map webhook events to the correct component
- `repository.revision.commit` - To trigger builds with the correct commit SHA
- `repository.revision.branch` - To filter events by branch

### Build Traceability
Tracking which Git repository, branch, and commit produced each container image enables:
- Debugging production issues
- Compliance and audit trails
- Rollback to specific code versions

### Monorepo Support
The `repository.appPath` field identifies specific application paths within a repository, enabling multiple components
to be built from different paths in the same repository.

## Annotations

ComponentWorkflowRuns support the following annotations:

| Annotation                    | Description                                      |
|-------------------------------|--------------------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display               |
| `openchoreo.dev/description`  | Detailed description of the component workflow run |

## Related Resources

- [ComponentWorkflow](../platform/componentworkflow.md) - Template definitions for component workflow execution
- [Component](./component.md) - Components that reference ComponentWorkflows
- [ComponentType](../platform/componenttype.md) - Can restrict allowed component workflows
