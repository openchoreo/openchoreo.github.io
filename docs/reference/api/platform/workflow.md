---
title: Workflow API Reference
description: Platform engineer-defined automation template for builds, pipelines, and other tasks
---

# Workflow

A Workflow is a platform engineer-defined template for running automation tasks in OpenChoreo. Workflows provide
a flexible mechanism to execute any type of automation — component builds, infrastructure provisioning, data pipelines,
end-to-end testing, package publishing, and more.

Workflows define a parameter schema, optional external references, and a run template that references a
ClusterWorkflowTemplate, bridging the control plane and workflow plane.

A Workflow becomes a **component workflow** when it carries the `openchoreo.dev/workflow-type: "component"` label
and is listed in a ComponentType's `allowedWorkflows`. See [CI Governance](../../../platform-engineer-guide/workflows/ci-governance.md)
for details.

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
  namespace: <namespace>
```

### Spec Fields

| Field                | Type                                    | Required | Default                                           | Description                                                                                                          |
| -------------------- | --------------------------------------- | -------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `workflowPlaneRef`   | [WorkflowPlaneRef](#workflowplaneref)   | No       | `{kind: "ClusterWorkflowPlane", name: "default"}` | Reference to the WorkflowPlane or ClusterWorkflowPlane for this workflow's operations                                |
| `parameters`         | [SchemaSection](#schemasection)         | No       | -                                                 | Developer-facing parameter schema                                                                                    |
| `runTemplate`        | object                                  | Yes      | -                                                 | Kubernetes resource template (typically Argo Workflow) with template variables for runtime evaluation                |
| `resources`          | [][WorkflowResource](#workflowresource) | No       | -                                                 | Additional Kubernetes resources to create alongside the workflow run                                                 |
| `externalRefs`       | [][ExternalRef](#externalref)           | No       | -                                                 | References to external CRs resolved at runtime and injected into the CEL context                                     |
| `ttlAfterCompletion` | string                                  | No       | -                                                 | Auto-delete duration after workflow run completion (e.g., `90d`, `1h30m`). Pattern: `^(\d+d)?(\d+h)?(\d+m)?(\d+s)?$` |

### WorkflowPlaneRef

References the workflow plane where workflows execute. This field is **immutable** after creation.

| Field  | Type   | Required | Default | Description                                                                   |
| ------ | ------ | -------- | ------- | ----------------------------------------------------------------------------- |
| `kind` | string | Yes      | -       | `WorkflowPlane` (namespace-scoped) or `ClusterWorkflowPlane` (cluster-scoped) |
| `name` | string | Yes      | -       | Name of the WorkflowPlane or ClusterWorkflowPlane resource                    |

If not specified, the controller resolves the workflow plane in order:

1. `WorkflowPlane` named `default` in the same namespace
2. `ClusterWorkflowPlane` named `default` (cluster-scoped fallback)

### SchemaSection

The `SchemaSection` type holds a schema in standard OpenAPI v3 JSON Schema format.

| Field             | Type   | Required | Default | Description                            |
| ----------------- | ------ | -------- | ------- | -------------------------------------- |
| `openAPIV3Schema` | object | No       | -       | Standard OpenAPI v3 JSON Schema format |

**Example:**

```yaml
parameters:
  openAPIV3Schema:
    type: object
    required:
      - repository
    properties:
      repository:
        type: object
        description: "Git repository configuration"
        required:
          - url
        properties:
          url:
            type: string
            description: "Git repository URL"
          revision:
            type: object
            default: {}
            properties:
              branch:
                type: string
                default: main
                description: "Git branch to checkout"
              commit:
                type: string
                default: ""
                description: "Git commit SHA or reference (optional)"
          appPath:
            type: string
            default: "."
            description: "Path to the application directory"
      docker:
        type: object
        default: {}
        properties:
          context:
            type: string
            default: "."
            description: "Docker build context path"
          filePath:
            type: string
            default: "./Dockerfile"
            description: "Path to the Dockerfile"
```

### WorkflowResource

Additional Kubernetes resources created alongside the workflow run (e.g., secrets, configmaps).

| Field         | Type   | Required | Default | Description                                                                       |
| ------------- | ------ | -------- | ------- | --------------------------------------------------------------------------------- |
| `id`          | string | Yes      | -       | Unique identifier for this resource within the Workflow                           |
| `includeWhen` | string | No       | -       | CEL expression; if it evaluates to false, the resource is skipped                 |
| `template`    | object | Yes      | -       | Kubernetes resource template with CEL expressions (same variables as runTemplate) |

**Resource Lifecycle:**

- Resources are rendered and created in the workflow plane before workflow execution begins
- Resources with `includeWhen` are only created if the condition evaluates to true
- Resource references are tracked in WorkflowRun status for cleanup
- When a WorkflowRun is deleted, the controller automatically cleans up all associated resources

**Example with Conditional Creation:**

```yaml
resources:
  - id: git-secret
    includeWhen: ${parameters.repository.secretRef != ""}
    template:
      apiVersion: external-secrets.io/v1
      kind: ExternalSecret
      metadata:
        name: ${metadata.workflowRunName}-git-secret
        namespace: workflows-${metadata.namespaceName}
      spec:
        refreshInterval: 15s
        secretStoreRef:
          name: ${workflowplane.secretStore}
          kind: ClusterSecretStore
        target:
          name: ${metadata.workflowRunName}-git-secret
          creationPolicy: Owner
          template:
            type: ${externalRefs.repo-credentials.spec.template.type}
        data: |
          ${externalRefs.repo-credentials.spec.data.map(secret, {
            "secretKey": secret.secretKey,
            "remoteRef": {
              "key": secret.remoteRef.key,
              "property": has(secret.remoteRef.property) ? secret.remoteRef.property : oc_omit()
            }
          })}
```

### ExternalRef

Declares a reference to an external CR whose spec is resolved at runtime and injected into the CEL context.

| Field        | Type   | Required | Default | Description                                                                                            |
| ------------ | ------ | -------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `id`         | string | Yes      | -       | CEL context key (2-63 chars, pattern: `^[a-z][a-z0-9-]*[a-z0-9]$`)                                     |
| `apiVersion` | string | Yes      | -       | API version of the referenced resource                                                                 |
| `kind`       | string | Yes      | -       | Kind of the referenced resource. Currently only `SecretReference` is supported                         |
| `name`       | string | Yes      | -       | Name of the referenced resource. Supports CEL expressions (e.g., `${parameters.repository.secretRef}`) |

If the name evaluates to empty at runtime, the reference is silently skipped.

**Example:**

```yaml
externalRefs:
  - id: repo-credentials
    apiVersion: openchoreo.dev/v1alpha1
    kind: SecretReference
    name: ${parameters.repository.secretRef}
```

Once resolved, the external ref's spec is available in CEL expressions as `${externalRefs.repo-credentials.spec.*}`.

### Run Template

The `runTemplate` field defines a Kubernetes resource template (typically an Argo Workflow) that gets rendered for each
execution. It references a ClusterWorkflowTemplate and uses template variables to inject runtime values.

## Template Variables

Workflow run templates support the following template variables:

| Variable                                         | Description                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------ |
| `${metadata.workflowRunName}`                    | WorkflowRun CR name (the execution instance)                       |
| `${metadata.namespaceName}`                      | Namespace name of the WorkflowRun                                  |
| `${metadata.namespace}`                          | Enforced workflow plane namespace (e.g., `workflows-default`)      |
| `${metadata.labels['openchoreo.dev/component']}` | Component name (for component workflow runs)                       |
| `${metadata.labels['openchoreo.dev/project']}`   | Project name (for component workflow runs)                         |
| `${parameters.*}`                                | Developer-provided values from the parameter schema                |
| `${externalRefs.<id>.spec.*}`                    | Resolved external reference spec fields                            |
| `${workflowplane.secretStore}`                   | ClusterSecretStore name from the referenced WorkflowPlane          |

## Examples

### Docker Build Workflow

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workflow
metadata:
  name: dockerfile-builder
  namespace: default
  labels:
    openchoreo.dev/workflow-type: "component"
  annotations:
    openchoreo.dev/description: "Build with a provided Dockerfile/Containerfile/Podmanfile"
spec:
  ttlAfterCompletion: "1d"

  parameters:
    openAPIV3Schema:
      type: object
      required:
        - repository
      properties:
        repository:
          type: object
          description: "Git repository configuration"
          required:
            - url
          properties:
            url:
              type: string
              description: "Git repository URL"
              x-openchoreo-component-parameter-repository-url: true
            secretRef:
              type: string
              default: ""
              description: "Secret reference name for Git credentials"
              x-openchoreo-component-parameter-repository-secret-ref: true
            revision:
              type: object
              default: {}
              properties:
                branch:
                  type: string
                  default: main
                  description: "Git branch to checkout"
                  x-openchoreo-component-parameter-repository-branch: true
                commit:
                  type: string
                  default: ""
                  description: "Git commit SHA or reference (optional)"
                  x-openchoreo-component-parameter-repository-commit: true
            appPath:
              type: string
              default: "."
              description: "Path to the application directory within the repository"
              x-openchoreo-component-parameter-repository-app-path: true
        docker:
          type: object
          default: {}
          description: "Docker build configuration"
          properties:
            context:
              type: string
              default: "."
              description: "Docker build context path relative to the repository root"
            filePath:
              type: string
              default: "./Dockerfile"
              description: "Path to the Dockerfile relative to the repository root"

  externalRefs:
    - id: git-secret-reference
      apiVersion: openchoreo.dev/v1alpha1
      kind: SecretReference
      name: ${parameters.repository.secretRef}

  runTemplate:
    apiVersion: argoproj.io/v1alpha1
    kind: Workflow
    metadata:
      name: ${metadata.workflowRunName}
      namespace: ${metadata.namespace}
    spec:
      arguments:
        parameters:
          - name: component-name
            value: ${metadata.labels['openchoreo.dev/component']}
          - name: project-name
            value: ${metadata.labels['openchoreo.dev/project']}
          - name: workflowrun-name
            value: ${metadata.workflowRunName}
          - name: namespace-name
            value: ${metadata.namespaceName}
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
            value: ${metadata.namespaceName}-${metadata.labels['openchoreo.dev/project']}-${metadata.labels['openchoreo.dev/component']}
          - name: image-tag
            value: v1
          - name: git-secret
            value: ${metadata.workflowRunName}-git-secret
          - name: registry-push-secret
            value: ${metadata.workflowRunName}-registry-push-secret
      serviceAccountName: workflow-sa
      entrypoint: build-workflow
      templates:
        - name: build-workflow
          steps:
            - - name: checkout-source
                templateRef:
                  name: checkout-source
                  clusterScope: true
                  template: checkout
            - - name: build-image
                templateRef:
                  name: containerfile-build
                  clusterScope: true
                  template: build-image
                arguments:
                  parameters:
                    - name: git-revision
                      value: "{{steps.checkout-source.outputs.parameters.git-revision}}"
            - - name: publish-image
                templateRef:
                  name: publish-image
                  clusterScope: true
                  template: publish-image
                arguments:
                  parameters:
                    - name: git-revision
                      value: "{{steps.checkout-source.outputs.parameters.git-revision}}"
            - - name: generate-workload-cr
                templateRef:
                  name: generate-workload
                  clusterScope: true
                  template: generate-workload-cr
                arguments:
                  parameters:
                    - name: image
                      value: "{{steps.publish-image.outputs.parameters.image}}"
                    - name: run-name
                      value: "{{workflow.parameters.workflowrun-name}}"
      volumeClaimTemplates:
        - metadata:
            name: workspace
          spec:
            accessModes: [ReadWriteOnce]
            resources:
              requests:
                storage: 2Gi

  resources:
    - id: git-secret
      includeWhen: ${has(parameters.repository.secretRef) && parameters.repository.secretRef != ""}
      template:
        apiVersion: external-secrets.io/v1
        kind: ExternalSecret
        metadata:
          name: ${metadata.workflowRunName}-git-secret
          namespace: ${metadata.namespace}
        spec:
          refreshInterval: 15s
          secretStoreRef:
            kind: ClusterSecretStore
            name: ${workflowplane.secretStore}
          target:
            name: ${metadata.workflowRunName}-git-secret
            creationPolicy: Owner
            template:
              type: ${externalRefs['git-secret-reference'].spec.template.type}
          data: |
            ${externalRefs['git-secret-reference'].spec.data.map(secret, {
              "secretKey": secret.secretKey,
              "remoteRef": {
                "key": secret.remoteRef.key,
                "property": has(secret.remoteRef.property) && secret.remoteRef.property != "" ? secret.remoteRef.property : oc_omit()
              }
            })}
```

### Generic Automation Workflow

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workflow
metadata:
  name: github-stats-report
  namespace: default
  annotations:
    openchoreo.dev/description: "Fetch GitHub repo statistics and generate a report"
spec:
  ttlAfterCompletion: "1d"

  parameters:
    openAPIV3Schema:
      type: object
      properties:
        source:
          type: object
          default: {}
          properties:
            org:
              type: string
              default: "openchoreo"
              description: "GitHub organization name"
            repo:
              type: string
              default: "openchoreo"
              description: "GitHub repository name"
        output:
          type: object
          default: {}
          properties:
            format:
              type: string
              default: "table"
              enum:
                - table
                - json
              description: "Report output format"

  runTemplate:
    apiVersion: argoproj.io/v1alpha1
    kind: Workflow
    metadata:
      name: ${metadata.workflowRunName}
      namespace: ${metadata.namespace}
    spec:
      arguments:
        parameters:
          - name: org
            value: ${parameters.source.org}
          - name: repo
            value: ${parameters.source.repo}
          - name: output-format
            value: ${parameters.output.format}
      serviceAccountName: workflow-sa
      workflowTemplateRef:
        clusterScope: true
        name: github-stats-report
```

## Labels

| Label                          | Description                                                                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openchoreo.dev/workflow-type` | Set to `"component"` to mark this as a CI workflow for UI and CLI categorization. See [CI Governance](../../../platform-engineer-guide/workflows/ci-governance.md) |

## Annotations

| Annotation                    | Description                          |
| ----------------------------- | ------------------------------------ |
| `openchoreo.dev/display-name` | Human-readable name for UI display   |
| `openchoreo.dev/description`  | Detailed description of the Workflow |

## Related Resources

- [ClusterWorkflow](./clusterworkflow.md) - Cluster-scoped variant of Workflow
- [WorkflowRun](../application/workflowrun.md) - Runtime execution instances of Workflows
- [ComponentType](./componenttype.md) - Can restrict allowed workflows via `allowedWorkflows`
- [Component](../application/component.md) - References Workflows for building
- [Workflows Guide](../../../platform-engineer-guide/workflows/overview.md) - Guide for creating and using workflows
