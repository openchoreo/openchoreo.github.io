---
title: Workflow API Reference
---

# Workflow

A Workflow is a platform engineer-defined template for executing build, test, and automation tasks in OpenChoreo.
Workflows provide a schema-driven interface that separates developer-facing parameters from platform-controlled
configurations, integrating with Argo Workflows to provide Kubernetes-native CI/CD execution.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

Workflows are namespace-scoped resources that must be created within an Organization's namespace.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workflow
metadata:
  name: <workflow-name>
  namespace: <org-namespace>  # Organization namespace
```

### Spec Fields

| Field      | Type   | Required | Default | Description                                                                                        |
|------------|--------|----------|---------|----------------------------------------------------------------------------------------------------|
| `schema`   | object | No       | -       | Developer-facing parameters that can be configured when creating a WorkflowRun instance            |
| `resource` | object | Yes      | -       | Kubernetes resource (typically Argo Workflow) with CEL expressions in `${...}` for runtime evaluation |

### Schema

The schema field uses the same inline type definition syntax as ComponentType:

```
"type | default=value enum=val1,val2 minimum=1 maximum=10"
```

Schemas are nested map structures where keys are field names and values are either nested maps or type definition strings.

## CEL Variables in Resource Templates

Workflow resource templates support CEL expressions with access to:

| Variable                  | Description                                                         |
|---------------------------|---------------------------------------------------------------------|
| `${ctx.workflowRunName}`  | WorkflowRun CR name (the execution instance)                        |
| `${ctx.componentName}`    | Component name (only accessible for component-bound workflows)      |
| `${ctx.projectName}`      | Project name (only accessible for component-bound workflows)        |
| `${ctx.orgName}`          | Organization name (namespace)                                       |
| `${ctx.timestamp}`        | Unix timestamp                                                      |
| `${ctx.uuid}`             | Short UUID (8 characters)                                           |
| `${schema.*}`             | Developer-provided values from the schema                           |

## Examples

### Docker Build Workflow

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workflow
metadata:
  name: docker
  namespace: default
  annotations:
    openchoreo.dev/description: "Docker build workflow for containerized builds using Dockerfile"
spec:
  schema:
    repository:
      url: string
      revision:
        branch: string | default=main
        commit: string | default=""
      appPath: string | default=.
      secretRef: string
    docker:
      context: string | default=.
      filePath: string | default=./Dockerfile

  resource:
    apiVersion: argoproj.io/v1alpha1
    kind: Workflow
    metadata:
      name: ${ctx.workflowRunName}
      namespace: openchoreo-ci-${ctx.orgName}
    spec:
      arguments:
        parameters:
          - name: component-name
            value: ${ctx.componentName}
          - name: project-name
            value: ${ctx.projectName}
          - name: git-repo
            value: ${schema.repository.url}
          - name: branch
            value: ${schema.repository.revision.branch}
          - name: commit
            value: ${schema.repository.revision.commit}
          - name: app-path
            value: ${schema.repository.appPath}
          - name: docker-context
            value: ${schema.docker.context}
          - name: dockerfile-path
            value: ${schema.docker.filePath}
          # PE-controlled hardcoded parameters
          - name: registry-url
            value: gcr.io/openchoreo-dev/images
          - name: build-timeout
            value: "30m"
          - name: image-name
            value: ${ctx.projectName}-${ctx.componentName}-image
          - name: image-tag
            value: v1
      serviceAccountName: workflow-sa
      workflowTemplateRef:
        clusterScope: true
        name: docker
```

### Google Cloud Buildpacks Workflow

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workflow
metadata:
  name: google-cloud-buildpacks
  namespace: default
  annotations:
    openchoreo.dev/description: "Google Cloud Buildpacks workflow for containerized builds"
spec:
  schema:
    repository:
      url: string
      revision:
        branch: string | default=main
        commit: string | default=HEAD
      appPath: string | default=.
      secretRef: string | enum=["reading-list-repo-credentials-dev","payments-repo-credentials-dev"]
    version: integer | default=1
    testMode: string | enum=["unit", "integration", "none"] default=unit
    command: '[]string | default=[]'
    args: "[]string | default=[]"
    resources:
      cpuCores: integer | default=1 minimum=1 maximum=8
      memoryGb: integer | default=2 minimum=1 maximum=32
    timeout: string | default="30m"
    cache:
      enabled: boolean | default=true
      paths: '[]string | default=["/root/.cache"]'
    limits:
      maxRetries: integer | default=3 minimum=0 maximum=10
      maxDurationMinutes: integer | default=60 minimum=5 maximum=240

  secrets:
    - ${schema.repository.secretRef}

  resource:
    apiVersion: argoproj.io/v1alpha1
    kind: Workflow
    metadata:
      name: ${ctx.workflowRunName}
      namespace: openchoreo-ci-${ctx.orgName}
    spec:
      arguments:
        parameters:
          - name: component-name
            value: ${ctx.componentName}
          - name: project-name
            value: ${ctx.projectName}
          - name: git-repo
            value: ${schema.repository.url}
          - name: branch
            value: ${schema.repository.revision.branch}
          - name: version
            value: ${schema.version}
          - name: test-mode
            value: ${schema.testMode}
          - name: cpu-cores
            value: ${schema.resources.cpuCores}
          - name: memory-gb
            value: ${schema.resources.memoryGb}
          # PE-controlled hardcoded parameters
          - name: builder-image
            value: gcr.io/buildpacks/builder@sha256:5977b4bd47d3e9ff729eefe9eb99d321d4bba7aa3b14986323133f40b622aef1
          - name: registry-url
            value: gcr.io/openchoreo-dev/images
          - name: security-scan-enabled
            value: "true"
          - name: image-name
            value: ${ctx.projectName}-${ctx.componentName}-image
          - name: image-tag
            value: v${schema.version}
      serviceAccountName: workflow-sa
      workflowTemplateRef:
        clusterScope: true
        name: google-cloud-buildpacks
```

### Simple Test Workflow

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workflow
metadata:
  name: unit-tests
  namespace: default
spec:
  schema:
    repository:
      url: string | required=true
      branch: string | default=main
      secretRef: string
    testCommand: string | default="npm test"

  resource:
    apiVersion: argoproj.io/v1alpha1
    kind: Workflow
    metadata:
      name: ${ctx.workflowRunName}
      namespace: openchoreo-ci-${ctx.orgName}
    spec:
      entrypoint: run-tests
      arguments:
        parameters:
          - name: repo-url
            value: ${schema.repository.url}
          - name: branch
            value: ${schema.repository.branch}
          - name: test-command
            value: ${schema.testCommand}
      templates:
        - name: run-tests
          # ... test execution steps
```

## Annotations

Workflows support the following annotations:

| Annotation                    | Description                          |
|-------------------------------|--------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display   |
| `openchoreo.dev/description`  | Detailed description of the Workflow |

## Related Resources

- [WorkflowRun](../application/workflowrun.md) - Runtime execution instances of Workflows
- [ComponentType](./componenttype.md) - Can restrict allowed workflows via `allowedWorkflows`
- [Component](../application/component.md) - Can reference workflows for building
