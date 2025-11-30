---
title: ComponentWorkflow API Reference
---

# ComponentWorkflow

A ComponentWorkflow is a platform engineer-defined template specifically designed for building components in OpenChoreo.
ComponentWorkflows enforce a structured schema for repository information while providing
flexibility for additional build configuration. This enables powerful build-specific platform features like auto-builds,
webhooks, build traceability, and monorepo support.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ComponentWorkflows are namespace-scoped resources that must be created within an Organization's namespace.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentWorkflow
metadata:
  name: <componentworkflow-name>
  namespace: <org-namespace>  # Organization namespace
```

### Spec Fields

| Field         | Type   | Required | Default | Description                                                                                  |
|---------------|--------|----------|---------|----------------------------------------------------------------------------------------------|
| `schema`      | object | Yes      | -       | Parameter schemas including required system parameters and flexible developer parameters     |
| `runTemplate` | object | Yes      | -       | Kubernetes resource template (typically Argo Workflow) with CEL expressions for runtime evaluation |

### Schema

The schema field defines two distinct parameter sections:

#### System Parameters Schema (Required)

System parameters follow a fixed structure required for build-specific platform features. Platform engineers can
customize defaults, enums, and descriptions, but must maintain the field structure.

**Required Structure:**

```yaml
schema:
  systemParameters:
    repository:
      url: 'string | description="Git repository URL"'
      revision:
        branch: 'string | default=main description="Git branch"'
        commit: 'string | description="Commit SHA (optional)"'
      appPath: 'string | default=. description="Application path"'
```

**Field Constraints:**
- Field names must match exactly: `url`, `revision.branch`, `revision.commit`, `appPath`
- All fields must be of type `string`
- Platform Engineers can customize: defaults, enums, descriptions, validation rules
- Platform Engineers cannot change: field names, nesting structure, or types

#### Developer Parameters Schema (Flexible)

Developer parameters provide complete freedom for platform engineers to define additional build configuration using
the same inline type definition syntax as ComponentType:

```
"type | default=value enum=val1,val2 minimum=N maximum=N"
```

Supported types: `string`, `integer`, `boolean`, `array<type>`, nested objects

**Example:**

```yaml
schema:
  parameters:
    version: integer | default=1 description="Build version"
    testMode: string | enum=unit,integration,none default=unit
    resources:
      cpuCores: integer | default=1 minimum=1 maximum=8
      memoryGb: integer | default=2 minimum=1 maximum=32
    cache:
      enabled: boolean | default=true
      paths: '[]string | default=["/root/.cache"]'
```

## CEL Variables in Run Templates

ComponentWorkflow run templates support CEL expressions with access to:

| Variable                            | Description                                                  |
|-------------------------------------|--------------------------------------------------------------|
| `${ctx.componentWorkflowRunName}`   | ComponentWorkflowRun CR name (the execution instance)        |
| `${ctx.componentName}`              | Component name                                               |
| `${ctx.projectName}`                | Project name                                                 |
| `${ctx.orgName}`                    | Organization name (namespace)                                |
| `${ctx.timestamp}`                  | Unix timestamp                                               |
| `${ctx.uuid}`                       | Short UUID (8 characters)                                    |
| `${systemParameters.*}`             | Repository information from system parameters                |
| `${parameters.*}`                   | Developer-provided values from the flexible parameter schema |

## Examples

### Google Cloud Buildpacks ComponentWorkflow

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentWorkflow
metadata:
  name: google-cloud-buildpacks
  namespace: default
  annotations:
    openchoreo.dev/description: "Google Cloud Buildpacks workflow for containerized builds"
spec:
  schema:
    # Required system parameters with fixed structure
    systemParameters:
      repository:
        url: 'string | description="Git repository URL for the component source code"'
        revision:
          branch: 'string | default=main description="Git branch to build from"'
          commit: 'string | description="Specific commit SHA to build (optional, defaults to latest)"'
        appPath: 'string | default=. description="Path to the application code within the repository"'

    # Flexible developer parameters
    parameters:
      version: integer | default=1 description="Build version number for image tagging"
      testMode: string | enum=unit,integration,none default=unit description="Test mode to execute"
      command: '[]string | default=[] description="Custom command to override the default entrypoint"'
      args: '[]string | default=[] description="Custom arguments to pass to the command"'
      resources:
        cpuCores: integer | default=1 minimum=1 maximum=8 description="Number of CPU cores"
        memoryGb: integer | default=2 minimum=1 maximum=32 description="Amount of memory in GB"
      timeout: string | default="30m" description="Build timeout duration (e.g., 30m, 1h)"
      cache:
        enabled: boolean | default=true description="Enable build cache"
        paths: '[]string | default=["/root/.cache"] description="Paths to cache between builds"'
      limits:
        maxRetries: integer | default=3 minimum=0 maximum=10 description="Maximum retry attempts"
        maxDurationMinutes: integer | default=60 minimum=5 maximum=240 description="Maximum duration"

  runTemplate:
    apiVersion: argoproj.io/v1alpha1
    kind: Workflow
    metadata:
      name: ${ctx.componentWorkflowRunName}
      namespace: openchoreo-ci-${ctx.orgName}
    spec:
      arguments:
        parameters:
          # Context variables
          - name: component-name
            value: ${ctx.componentName}
          - name: project-name
            value: ${ctx.projectName}
          # System parameters
          - name: git-repo
            value: ${systemParameters.repository.url}
          - name: branch
            value: ${systemParameters.repository.revision.branch}
          - name: commit
            value: ${systemParameters.repository.revision.commit}
          - name: app-path
            value: ${systemParameters.repository.appPath}
          # Developer parameters
          - name: version
            value: ${parameters.version}
          - name: test-mode
            value: ${parameters.testMode}
          - name: cpu-cores
            value: ${parameters.resources.cpuCores}
          - name: memory-gb
            value: ${parameters.resources.memoryGb}
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
            value: v${parameters.version}
      serviceAccountName: workflow-sa
      workflowTemplateRef:
        clusterScope: true
        name: google-cloud-buildpacks
```

### Docker Build ComponentWorkflow

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentWorkflow
metadata:
  name: docker
  namespace: default
  annotations:
    openchoreo.dev/description: "Docker build workflow using Dockerfile"
spec:
  schema:
    systemParameters:
      repository:
        url: 'string | description="Git repository URL"'
        revision:
          branch: 'string | default=main description="Git branch"'
          commit: 'string | description="Commit SHA (optional)"'
        appPath: 'string | default=. description="Application path"'

    parameters:
      docker:
        context: string | default=. description="Docker build context path"
        filePath: string | default=./Dockerfile description="Path to Dockerfile"
      buildArgs: '[]string | default=[] description="Docker build arguments"'

  runTemplate:
    apiVersion: argoproj.io/v1alpha1
    kind: Workflow
    metadata:
      name: ${ctx.componentWorkflowRunName}
      namespace: openchoreo-ci-${ctx.orgName}
    spec:
      arguments:
        parameters:
          - name: component-name
            value: ${ctx.componentName}
          - name: project-name
            value: ${ctx.projectName}
          - name: git-repo
            value: ${systemParameters.repository.url}
          - name: branch
            value: ${systemParameters.repository.revision.branch}
          - name: commit
            value: ${systemParameters.repository.revision.commit}
          - name: app-path
            value: ${systemParameters.repository.appPath}
          - name: docker-context
            value: ${parameters.docker.context}
          - name: dockerfile-path
            value: ${parameters.docker.filePath}
          - name: registry-url
            value: gcr.io/openchoreo-dev/images
          - name: image-name
            value: ${ctx.projectName}-${ctx.componentName}-image
      serviceAccountName: workflow-sa
      workflowTemplateRef:
        clusterScope: true
        name: docker
```

## ComponentType Integration

ComponentTypes can restrict which ComponentWorkflows developers can use through the `allowedWorkflows` field:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentType
metadata:
  name: service
spec:
  workloadType: deployment
  allowedWorkflows:
    - google-cloud-buildpacks
    - docker
```

## Component Integration

Components reference ComponentWorkflows in their workflow configuration:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: reading-list-service
spec:
  componentType: deployment/service

  workflow:
    name: google-cloud-buildpacks

    systemParameters:
      repository:
        url: "https://github.com/openchoreo/sample-workloads"
        revision:
          branch: "main"
          commit: ""
        appPath: "/service-go-reading-list"

    parameters:
      version: 1
      testMode: "integration"
      resources:
        cpuCores: 2
        memoryGb: 4
```

## Annotations

ComponentWorkflows support the following annotations:

| Annotation                    | Description                                  |
|-------------------------------|----------------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display           |
| `openchoreo.dev/description`  | Detailed description of the ComponentWorkflow |

## Related Resources

- [ComponentWorkflowRun](../application/componentworkflowrun.md) - Runtime execution instances of ComponentWorkflows
- [ComponentType](./componenttype.md) - Can restrict allowed component workflows via `allowedWorkflows`
- [Component](../application/component.md) - References ComponentWorkflows for building