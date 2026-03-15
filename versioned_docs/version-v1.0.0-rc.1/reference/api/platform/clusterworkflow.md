---
title: ClusterWorkflow API Reference
---

# ClusterWorkflow

A ClusterWorkflow is a cluster-scoped variant of [Workflow](./workflow.md) that defines reusable automation templates
available across all namespaces. This enables platform engineers to define shared workflow templates once and reference
them from WorkflowRuns or ClusterComponentTypes in any namespace, eliminating duplication.

ClusterWorkflows share the same spec structure as Workflows with one key constraint: because ClusterWorkflows are
cluster-scoped, they can only reference **ClusterWorkflowPlanes** (not namespace-scoped WorkflowPlanes) in their
`workflowPlaneRef` field.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ClusterWorkflows are cluster-scoped resources (no namespace).

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterWorkflow
metadata:
  name: <clusterworkflow-name>
```

:::note
ClusterWorkflow manifests must **not** include `metadata.namespace`. If you are copying from a namespace-scoped
Workflow example, remove the `namespace` field.
:::

**Short names:** `cwf`, `cwfs`

### Spec Fields

| Field                | Type                                                    | Required | Default | Description                                                                                              |
|----------------------|---------------------------------------------------------|----------|---------|----------------------------------------------------------------------------------------------------------|
| `workflowPlaneRef`   | [ClusterWorkflowPlaneRef](#clusterworkflowplaneref)     | No       | `{kind: "ClusterWorkflowPlane", name: "default"}` | Reference to the ClusterWorkflowPlane for this workflow's operations                                |
| `parameters`         | [SchemaSection](./workflow.md#schemasection)             | No       | -       | Developer-facing parameter schema                                                                        |
| `runTemplate`        | object                                                  | Yes      | -       | Kubernetes resource template (typically Argo Workflow) with template variables for runtime evaluation     |
| `resources`          | [][WorkflowResource](#workflowresource)                 | No       | -       | Additional Kubernetes resources to create alongside the workflow run                                      |
| `externalRefs`       | [][ExternalRef](#externalref)                           | No       | -       | References to external CRs resolved at runtime and injected into the CEL context                         |
| `ttlAfterCompletion` | string                                                  | No       | -       | Auto-delete duration after workflow run completion (e.g., `90d`, `1h30m`). Pattern: `^(\d+d)?(\d+h)?(\d+m)?(\d+s)?$` |

### ClusterWorkflowPlaneRef

References the cluster-scoped workflow plane where workflows execute.

| Field  | Type   | Required | Default | Description                                           |
|--------|--------|----------|---------|-------------------------------------------------------|
| `kind` | string | Yes      | -       | Must be `ClusterWorkflowPlane`                        |
| `name` | string | Yes      | -       | Name of the ClusterWorkflowPlane resource             |

If not specified, the controller resolves to the `ClusterWorkflowPlane` named `default`.

### Parameters (SchemaSection)

See [Workflow SchemaSection](./workflow.md#schemasection) for the full schema documentation. ClusterWorkflows use the same
`openAPIV3Schema` format as Workflows.

### WorkflowResource

See [Workflow WorkflowResource](./workflow.md#workflowresource) for the full documentation. ClusterWorkflows use the
same resource structure as Workflows.

### ExternalRef

See [Workflow ExternalRef](./workflow.md#externalref) for the full documentation. ClusterWorkflows use the same
external reference structure as Workflows.

### Status Fields

| Field        | Type        | Default | Description                                                |
|--------------|-------------|---------|------------------------------------------------------------|
| `conditions` | []Condition | []      | Standard Kubernetes conditions tracking the workflow state |

## Examples

### Dockerfile Builder ClusterWorkflow

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterWorkflow
metadata:
  name: dockerfile-builder
  labels:
    openchoreo.dev/workflow-type: "component"
  annotations:
    openchoreo.dev/description: "Build with a provided Dockerfile/Containerfile/Podmanfile"
spec:
  workflowPlaneRef:
    kind: ClusterWorkflowPlane
    name: default
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
              description: "Docker build context path"
            filePath:
              type: string
              default: "./Dockerfile"
              description: "Path to the Dockerfile"

  runTemplate:
    apiVersion: argoproj.io/v1alpha1
    kind: Workflow
    metadata:
      name: ${metadata.workflowRunName}
      namespace: ${metadata.namespace}
    spec:
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
```

## Labels

| Label                                                | Description                                                          |
|------------------------------------------------------|----------------------------------------------------------------------|
| `openchoreo.dev/workflow-type`                       | Set to `"component"` to mark this as a CI workflow for UI and CLI categorization |

## Annotations

| Annotation                                           | Description                                                          |
|------------------------------------------------------|----------------------------------------------------------------------|
| `openchoreo.dev/display-name`                        | Human-readable name for UI display                                   |
| `openchoreo.dev/description`                         | Detailed description of the ClusterWorkflow                          |

## Related Resources

- [Workflow](./workflow.md) - Namespace-scoped variant of ClusterWorkflow
- [WorkflowRun](../application/workflowrun.md) - Runtime execution instances that can reference ClusterWorkflows
- [ClusterComponentType](./clustercomponenttype.md) - Can restrict allowed ClusterWorkflows via `allowedWorkflows`
- [ClusterWorkflowPlane](./clusterworkflowplane.md) - Cluster-scoped workflow plane referenced by ClusterWorkflows
