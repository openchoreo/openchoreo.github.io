---
title: Workflow API Reference
---

# Workflow

A Workflow is a platform engineer-defined template for running standalone automation tasks in OpenChoreo. Unlike
[ComponentWorkflows](./componentworkflow.md) which are designed specifically for building components, Workflows provide
a flexible mechanism to execute any type of automation — infrastructure provisioning, data pipelines, end-to-end testing,
package publishing, and more.

Workflows define a parameter schema and a run template that references a ClusterWorkflowTemplate, bridging the control
plane and build plane.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

Workflows are namespace-scoped resources.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workflow
metadata:
  name: <workflow-name>
  namespace: <namespace>  # Namespace for grouping workflows
```

### Spec Fields

| Field         | Type                           | Required | Default | Description                                                                                        |
|---------------|--------------------------------|----------|---------|----------------------------------------------------------------------------------------------------|
| `schema`      | [WorkflowSchema](#schema)      | No       | -       | Parameter schema defining developer-facing parameters that can be configured when triggering an execution |
| `runTemplate` | object                         | Yes      | -       | Kubernetes resource template (typically Argo Workflow) with template variables for runtime evaluation |

### Schema

The schema field defines the parameter interface for the Workflow:

| Field        | Type   | Required | Default | Description                                                           |
|--------------|--------|----------|---------|-----------------------------------------------------------------------|
| `parameters` | object | No       | -       | Developer-facing parameters that can be configured when creating a WorkflowRun |

#### Parameters

Parameters use the same inline type definition syntax as ComponentType:

```
"type | default=value enum=val1,val2 minimum=1 maximum=10"
```

Parameters are nested map structures where keys are field names and values are either nested maps or type definition strings.

Supported types: `string`, `integer`, `boolean`, `array<type>`, nested objects

**Example:**

```yaml
schema:
  parameters:
    repository:
      url: string | description="Git repository URL"
      revision:
        branch: string | default=main description="Git branch to checkout"
        commit: string | default="" description="Git commit SHA (optional)"
      appPath: string | default=. description="Path to the application directory"
    docker:
      context: string | default=. description="Docker build context path"
      filePath: string | default=./Dockerfile description="Path to the Dockerfile"
```

### Run Template

The `runTemplate` field defines a Kubernetes resource template (typically an Argo Workflow) that gets rendered for each
execution. It references a ClusterWorkflowTemplate and uses template variables to inject runtime values.

## Template Variables

Workflow run templates support the following template variables:

| Variable                      | Description                                          |
|-------------------------------|------------------------------------------------------|
| `${metadata.workflowRunName}` | WorkflowRun CR name (the execution instance)         |
| `${metadata.namespaceName}`   | Namespace name                                       |
| `${parameters.*}`             | Developer-provided values from the parameter schema  |

## Examples

### Docker Build Workflow

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workflow
metadata:
  name: generic-workflow-docker-build
  namespace: default
  annotations:
    openchoreo.dev/description: "Generic Docker workflow for containerized workflows using Dockerfile"
spec:
  schema:
    parameters:
      repository:
        url: string | description="Git repository URL"
        revision:
          branch: string | default=main description="Git branch to checkout"
          commit: string | default="" description="Git commit SHA or reference (optional, defaults to latest)"
        appPath: string | default=. description="Path to the application directory within the repository"
      docker:
        context: string | default=. description="Docker build context path relative to the repository root"
        filePath: string | default=./Dockerfile description="Path to the Dockerfile relative to the repository root"

  runTemplate:
    apiVersion: argoproj.io/v1alpha1
    kind: Workflow
    metadata:
      name: ${metadata.workflowRunName}
      namespace: openchoreo-ci-${metadata.namespaceName}
    spec:
      arguments:
        parameters:
          - name: git-repo
            value: ${parameters.repository.url}
          - name: branch
            value: ${parameters.repository.revision.branch}
          - name: commit
            value: ${parameters.repository.revision.commit}
          - name: app-path
            value: ${parameters.repository.appPath}
          - name: docker-context
            value: ${parameters.docker.context}
          - name: dockerfile-path
            value: ${parameters.docker.filePath}
          - name: image-name
            value: generic-workflow-image
          - name: image-tag
            value: v1
      serviceAccountName: workflow-sa
      workflowTemplateRef:
        clusterScope: true
        name: generic-workflow-docker-build
```

### Simple Test Workflow

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workflow
metadata:
  name: integration-tests
  namespace: default
  annotations:
    openchoreo.dev/description: "Run integration test suite"
spec:
  schema:
    parameters:
      repository:
        url: string | description="Git repository URL"
        branch: string | default=main description="Git branch"
      testCommand: string | default="npm test" description="Test command to execute"
      environment: string | enum=staging,production default=staging description="Target environment"

  runTemplate:
    apiVersion: argoproj.io/v1alpha1
    kind: Workflow
    metadata:
      name: ${metadata.workflowRunName}
      namespace: openchoreo-ci-${metadata.namespaceName}
    spec:
      entrypoint: run-tests
      arguments:
        parameters:
          - name: repo-url
            value: ${parameters.repository.url}
          - name: branch
            value: ${parameters.repository.branch}
          - name: test-command
            value: ${parameters.testCommand}
          - name: environment
            value: ${parameters.environment}
      serviceAccountName: workflow-sa
      workflowTemplateRef:
        clusterScope: true
        name: integration-tests
```

## Annotations

Workflows support the following annotations:

| Annotation                    | Description                          |
|-------------------------------|--------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display   |
| `openchoreo.dev/description`  | Detailed description of the Workflow |

## Related Resources

- [WorkflowRun](../application/workflowrun.md) - Runtime execution instances of Workflows
- [Generic Workflows Guide](../../../user-guide/ci/generic-workflows.md) - User guide for creating and using generic workflows
- [ComponentWorkflow](./componentworkflow.md) - Specialized workflow templates for building components
