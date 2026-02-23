---
title: Component Workflow Schema
description: Learn how to define and use parameters in ComponentWorkflows
sidebar_position: 2
---

# Component Workflow Schema

ComponentWorkflows use a flexible parameter system that separates platform engineer governance from developer configuration. Parameters can be configured at both the platform engineer (PE) level and the developer level.

## Parameter Categories

### System Parameters

System parameters have a **fixed structure** required for platform features like webhooks, UI integration, and build traceability. Platform engineers can customize defaults, enums, and descriptions, but must maintain the field structure.

**Fixed structure:**

```yaml
systemParameters:
  repository:
    url: string                    # Git repository URL
    secretRef: string              # Reference to SecretReference CR (optional)
    revision:
      branch: string               # Git branch to checkout
      commit: string               # Specific commit SHA (optional)
    appPath: string                # Path to application within repository
```

**Why this structure is fixed:**
- Enables webhooks to map Git events to components
- Powers UI actions like "build from latest commit"
- Provides build traceability and audit logs
- Supports monorepo workflows with `appPath`
- Enables secure private repository access via `secretRef`

#### Private Repository Access with secretRef

The `secretRef` field enables secure authentication for private Git repositories. It's **optional** and only required when accessing private repositories.

**How it works:**
- References a `SecretReference` CR in the same namespace
- SecretReference points to credentials in your external secret store (Vault, AWS Secrets Manager, etc.)
- During build execution, credentials are synced to the build plane via ExternalSecrets
- Argo Workflow uses the credentials for Git authentication

**Example:**
```yaml
systemParameters:
  repository:
    url: https://github.com/myorg/private-repo.git
    secretRef: github-credentials  # References SecretReference CR
    revision:
      branch: main
    appPath: /
```

### Developer Parameters

Developer parameters are **completely flexible** and defined by platform engineers based on the build strategy's requirements. These parameters appear in the UI when creating components and can include any build-specific configuration.

**Common use cases:**
- Docker build context and Dockerfile path
- Build resources (CPU, memory)
- Buildpack configuration

## Schema Definition

The `schema` section in ComponentWorkflow defines both system and developer parameters using OpenChoreo's schema shorthand syntax.

### Basic Parameter Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentWorkflow
metadata:
  name: docker
  namespace: default
spec:
  schema:
    systemParameters:
      repository:
        url: string | description="Git repository URL"
        secretRef: string | description="SecretReference name for private repo auth (optional)"
        revision:
          branch: string | default=main description="Git branch to checkout"
          commit: string | description="Git commit SHA or reference (optional)"
        appPath: string | default=. description="Path to application directory"

    parameters:
      docker:
        context: string | default=. description="Docker build context path"
        filePath: string | default=./Dockerfile description="Path to Dockerfile"
```

### Advanced Schema with Custom Types

Platform engineers can define reusable types for complex parameter structures:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentWorkflow
metadata:
  name: google-cloud-buildpacks-advanced
  namespace: default
spec:
  schema:
    # Define reusable types
    types:
      Endpoint:
        name: string
        port: integer
        type: string | enum=REST,HTTP,TCP,UDP
        schemaFile: string | description="Path to endpoint schema file"

      ResourceRequirements:
        requests: ResourceQuantity | default={}
        limits: ResourceQuantity | default={}

      ResourceQuantity:
        cpu: string | default=100m
        memory: string | default=256Mi

    systemParameters:
      repository:
        url: string | description="Git repository URL"
        secretRef: string | description="SecretReference for private repos (optional)"
        revision:
          branch: string | default=main description="Git branch"
          commit: string | description="Commit SHA (optional)"
        appPath: string | default=. description="Application path"

    # Use custom types in parameters
    parameters:
      endpoints: '[]Endpoint | default=[] description="Service endpoints"'
      resources: ResourceRequirements | default={}
```

## Template Variable Reference

ComponentWorkflow templates support the following variable categories for use in the `runTemplate` field:

| Variable Category | Syntax | Description | Example |
|-------------------|--------|-------------|---------|
| **Metadata** | `${metadata.*}` | System-provided workflow and component metadata | `${metadata.componentName}` |
| **System Parameters** | `${systemParameters.*}` | Repository and revision information | `${systemParameters.repository.url}` |
| **Developer Parameters** | `${parameters.*}` | Build-specific configuration from schema | `${parameters.docker.context}` |
| **Secret Reference** | `${secretRef.*}` | SecretReference data for conditional resources | `${secretRef.type}` |

### Available Metadata Variables

- `${metadata.workflowRunName}` - ComponentWorkflowRun CR name
- `${metadata.componentName}` - Component name
- `${metadata.projectName}` - Project name
- `${metadata.namespaceName}` - Namespace name

### Available Secret Reference Variables

When `systemParameters.repository.secretRef` is provided, these variables are available:

- `${secretRef.type}` - Secret type (e.g., `kubernetes.io/basic-auth`, `kubernetes.io/ssh-auth`)
- `${secretRef.data}` - Array of secret data mappings from SecretReference
- Used in conditional resources with `includeWhen: ${has(systemParameters.repository.secretRef)}`

**Example usage in resources:**
```yaml
resources:
  - id: git-secret
    includeWhen: ${has(systemParameters.repository.secretRef)}
    template:
      apiVersion: external-secrets.io/v1
      kind: ExternalSecret
      spec:
        target:
          template:
            type: ${secretRef.type}  # Dynamically set secret type
```

## Using Parameters in runTemplate

The `runTemplate` field defines the Argo Workflow that will be rendered and executed. Template variables are substituted with actual values from ComponentWorkflowRun.

### Example: Docker Workflow

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentWorkflow
metadata:
  name: docker
  namespace: default
spec:
  schema:
    systemParameters:
      repository:
        url: string | description="Git repository URL"
        secretRef: string | description="SecretReference for private repos (optional)"
        revision:
          branch: string | default=main description="Git branch"
          commit: string | description="Commit SHA (optional)"
        appPath: string | default=. description="Application path"

    parameters:
      docker:
        context: string | default=. description="Docker build context"
        filePath: string | default=./Dockerfile description="Dockerfile path"

  # Template that will be rendered for each ComponentWorkflowRun
  runTemplate:
    apiVersion: argoproj.io/v1alpha1
    kind: Workflow
    metadata:
      name: ${metadata.workflowRunName}
      namespace: openchoreo-ci-${metadata.orgName}
    spec:
      arguments:
        parameters:
          # System parameters
          - name: git-repo
            value: ${systemParameters.repository.url}
          - name: git-secret
            value: ${metadata.workflowRunName}-git-secret  # Generated secret name
          - name: branch
            value: ${systemParameters.repository.revision.branch}
          - name: commit
            value: ${systemParameters.repository.revision.commit}
          - name: app-path
            value: ${systemParameters.repository.appPath}

          # Developer parameters
          - name: docker-context
            value: ${parameters.docker.context}
          - name: dockerfile-path
            value: ${parameters.docker.filePath}

          # PE-controlled hardcoded parameters
          - name: component-name
            value: ${metadata.componentName}
          - name: project-name
            value: ${metadata.projectName}
          - name: build-timeout
            value: "30m"
          - name: image-name
            value: ${metadata.projectName}-${metadata.componentName}-image
          - name: image-tag
            value: v1

      serviceAccountName: workflow-sa
      workflowTemplateRef:
        clusterScope: true
        name: docker
```

## Parameter Flow

Understanding how parameters flow through the system:

```
1. Platform Engineer defines ComponentWorkflow
   └── Defines schema (systemParameters + parameters)
   └── Defines runTemplate with ${...} variables

2. Developer creates Component
   └── References ComponentWorkflow by name
   └── Provides values for systemParameters and parameters

3. ComponentWorkflowRun created
   └── Contains parameter values from Component
   └── Controller renders runTemplate by substituting variables

4. Argo Workflow executed in Build Plane
   └── Receives resolved parameter values
   └── Executes build steps with actual configuration
```

## Parameter Best Practices

1. **Use System Parameters for Repository Info**: Always use the fixed `systemParameters.repository` structure for Git repository configuration
2. **Define Clear Schemas**: Provide descriptions and defaults for all developer parameters
3. **Use Enums for Limited Choices**: Constrain values using `enum` to prevent invalid configurations
4. **Create Reusable Types**: Define common structures as types for consistency across parameters
5. **Hardcode Governance Values**: Use PE-controlled hardcoded parameters for security policies, registry endpoints, and build timeouts

## Validation and Defaults

The ComponentWorkflowRun controller automatically:
- Validates parameter values against schema constraints
- Applies default values for parameters not provided by developers
- Converts complex values (arrays, objects) to appropriate formats for Argo Workflows
- Reports validation errors through ComponentWorkflowRun conditions
