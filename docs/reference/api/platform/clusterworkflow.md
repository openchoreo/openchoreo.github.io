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
| `workflowPlaneRef`   | [ClusterWorkflowPlaneRef](#clusterworkflowplaneref)     | No       | -       | Reference to the ClusterWorkflowPlane for this workflow's build operations                                |
| `schema`             | [WorkflowSchema](#schema)                               | No       | -       | Developer-facing parameter schema                                                                        |
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

### Schema

See [Workflow Schema](./workflow.md#schemasection) for the full schema documentation. ClusterWorkflows use the same schema
structure as Workflows.

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

### Docker Build ClusterWorkflow

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterWorkflow
metadata:
  name: docker
  annotations:
    openchoreo.dev/description: "Docker build workflow using Dockerfile"
    openchoreo.dev/component-workflow-parameters: |
      repoUrl: parameters.repository.url
      branch: parameters.repository.revision.branch
spec:
  ttlAfterCompletion: "7d"

  schema:
    parameters:
      repository:
        url: string | description="Git repository URL"
        secretRef: string | description="SecretReference name for private repo auth (optional)"
        revision:
          branch: string | default=main description="Git branch to checkout"
          commit: string | default="" description="Git commit SHA or reference (optional)"
        appPath: string | default=. description="Path to the application directory"
      docker:
        context: string | default=. description="Docker build context path"
        filePath: string | default=./Dockerfile description="Path to the Dockerfile"

  runTemplate:
    apiVersion: argoproj.io/v1alpha1
    kind: Workflow
    metadata:
      name: ${metadata.workflowRunName}
      namespace: workflows-${metadata.namespaceName}
    spec:
      serviceAccountName: workflow-sa
      entrypoint: build-workflow
      templates:
        - name: build-workflow
          steps:
            - - name: checkout-source
                templateRef:
                  name: checkout-source
                  template: checkout
                  clusterScope: true
            - - name: build-image
                templateRef:
                  name: docker
                  template: build-image
                  clusterScope: true
```

## Annotations

| Annotation                                           | Description                                                          |
|------------------------------------------------------|----------------------------------------------------------------------|
| `openchoreo.dev/display-name`                        | Human-readable name for UI display                                   |
| `openchoreo.dev/description`                         | Detailed description of the ClusterWorkflow                          |
| `openchoreo.dev/component-workflow-parameters`       | Maps parameter keys to dotted paths for auto-build and UI integration |

## Related Resources

- [Workflow](./workflow.md) - Namespace-scoped variant of ClusterWorkflow
- [WorkflowRun](../application/workflowrun.md) - Runtime execution instances that can reference ClusterWorkflows
- [ClusterComponentType](./clustercomponenttype.md) - Can restrict allowed ClusterWorkflows via `allowedWorkflows`
- [ClusterWorkflowPlane](./clusterworkflowplane.md) - Cluster-scoped workflow plane referenced by ClusterWorkflows
