---
title: Workflow API Reference
---

# Workflow

A Workflow is a platform engineer-defined template for running automation tasks in OpenChoreo. Workflows provide
a flexible mechanism to execute any type of automation — component builds, infrastructure provisioning, data pipelines,
end-to-end testing, package publishing, and more.

Workflows define a parameter schema, optional external references, and a run template that references a
ClusterWorkflowTemplate, bridging the control plane and build plane.

A Workflow becomes a **component workflow** when it carries the `openchoreo.dev/component-workflow-parameters` annotation
and is listed in a ComponentType's `allowedWorkflows`. See [Component Workflows](../../../user-guide/workflows/ci/component-workflows.md)
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

| Field                | Type                                                    | Required | Default | Description                                                                                              |
|----------------------|---------------------------------------------------------|----------|---------|----------------------------------------------------------------------------------------------------------|
| `buildPlaneRef`      | [BuildPlaneRef](#buildplaneref)                         | No       | -       | Reference to the BuildPlane or ClusterBuildPlane for this workflow's build operations                     |
| `schema`             | [WorkflowSchema](#schema)                               | No       | -       | Developer-facing parameter schema                                                                        |
| `runTemplate`        | object                                                  | Yes      | -       | Kubernetes resource template (typically Argo Workflow) with template variables for runtime evaluation     |
| `resources`          | [][WorkflowResource](#workflowresource)                 | No       | -       | Additional Kubernetes resources to create alongside the workflow run                                      |
| `externalRefs`       | [][ExternalRef](#externalref)                           | No       | -       | References to external CRs resolved at runtime and injected into the CEL context                         |
| `ttlAfterCompletion` | string                                                  | No       | -       | Auto-delete duration after workflow run completion (e.g., `90d`, `1h30m`). Pattern: `^(\d+d)?(\d+h)?(\d+m)?(\d+s)?$` |

### BuildPlaneRef

References the build plane where workflows execute.

| Field  | Type   | Required | Default | Description                                                     |
|--------|--------|----------|---------|-----------------------------------------------------------------|
| `kind` | string | Yes      | -       | `BuildPlane` (namespace-scoped) or `ClusterBuildPlane` (cluster-scoped) |
| `name` | string | Yes      | -       | Name of the BuildPlane or ClusterBuildPlane resource             |

If not specified, the controller resolves the build plane in order:
1. `BuildPlane` named `default` in the same namespace
2. `ClusterBuildPlane` named `default` (cluster-scoped fallback)

### Schema

| Field        | Type   | Required | Default | Description                                                              |
|--------------|--------|----------|---------|--------------------------------------------------------------------------|
| `types`      | object | No       | -       | Reusable type definitions that can be referenced in parameter fields     |
| `parameters` | object | No       | -       | Developer-facing parameters configurable when creating a WorkflowRun     |

#### Parameters

Parameters use the same inline type definition syntax as ComponentType:

```
"type | default=value enum=val1,val2 minimum=1 maximum=10 description=\"...\""
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
        commit: string | default=HEAD description="Git commit SHA or reference"
      appPath: string | default=. description="Path to the application directory"
    docker:
      context: string | default=. description="Docker build context path"
      filePath: string | default=./Dockerfile description="Path to the Dockerfile"
```

#### Types (Reusable Type Definitions)

The optional `types` field allows defining reusable types that can be referenced in the parameter schema:

```yaml
schema:
  types:
    Endpoint:
      name: string
      port: integer
      type: string | enum=REST,HTTP,TCP,UDP
    ResourceLimit:
      cpu: string | default=1000m
      memory: string | default=1Gi

  parameters:
    endpoints: '[]Endpoint | default=[]'
    limits: ResourceLimit
```

### WorkflowResource

Additional Kubernetes resources created alongside the workflow run (e.g., secrets, configmaps).

| Field         | Type   | Required | Default | Description                                                                      |
|---------------|--------|----------|---------|----------------------------------------------------------------------------------|
| `id`          | string | Yes      | -       | Unique identifier for this resource within the Workflow                           |
| `includeWhen` | string | No       | -       | CEL expression; if it evaluates to false, the resource is skipped                |
| `template`    | object | Yes      | -       | Kubernetes resource template with CEL expressions (same variables as runTemplate) |

**Resource Lifecycle:**
- Resources are rendered and created in the build plane before workflow execution begins
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
        namespace: openchoreo-ci-${metadata.namespaceName}
      spec:
        refreshInterval: 15s
        secretStoreRef:
          name: default
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

| Field        | Type   | Required | Default | Description                                                                         |
|--------------|--------|----------|---------|-------------------------------------------------------------------------------------|
| `id`         | string | Yes      | -       | CEL context key (2-63 chars, pattern: `^[a-z][a-z0-9-]*[a-z0-9]$`)                |
| `apiVersion` | string | Yes      | -       | API version of the referenced resource                                              |
| `kind`       | string | Yes      | -       | Kind of the referenced resource. Currently only `SecretReference` is supported      |
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

| Variable                                              | Description                                                  |
|-------------------------------------------------------|--------------------------------------------------------------|
| `${metadata.workflowRunName}`                         | WorkflowRun CR name (the execution instance)                 |
| `${metadata.namespaceName}`                           | Namespace name                                               |
| `${parameters.*}`                                     | Developer-provided values from the parameter schema          |
| `${externalRefs.<id>.spec.*}`                         | Resolved external reference spec fields                      |
| `${metadata.labels['openchoreo.dev/component']}`      | Component name (for component workflow runs)                 |
| `${metadata.labels['openchoreo.dev/project']}`        | Project name (for component workflow runs)                   |

## Examples

### Docker Build Workflow

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workflow
metadata:
  name: docker
  namespace: default
  annotations:
    openchoreo.dev/description: "Docker build workflow using Dockerfile"
    openchoreo.dev/component-workflow-parameters: |
      repoUrl: parameters.repository.url
      branch: parameters.repository.revision.branch
spec:
  ttlAfterCompletion: "7d"

  externalRefs:
    - id: repo-credentials
      apiVersion: openchoreo.dev/v1alpha1
      kind: SecretReference
      name: ${parameters.repository.secretRef}

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

  resources:
    - id: git-secret
      includeWhen: ${parameters.repository.secretRef != ""}
      template:
        apiVersion: external-secrets.io/v1
        kind: ExternalSecret
        metadata:
          name: ${metadata.workflowRunName}-git-secret
          namespace: openchoreo-ci-${metadata.namespaceName}
        spec:
          refreshInterval: 15s
          secretStoreRef:
            name: default
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
          - name: component-name
            value: ${metadata.labels['openchoreo.dev/component']}
          - name: project-name
            value: ${metadata.labels['openchoreo.dev/project']}
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
                  template: checkout
                  clusterScope: true
            - - name: build-image
                templateRef:
                  name: docker
                  template: build-image
                  clusterScope: true
                arguments:
                  parameters:
                    - name: git-revision
                      value: '{{steps.checkout-source.outputs.parameters.git-revision}}'
            - - name: publish-image
                templateRef:
                  name: publish-image
                  template: publish-image
                  clusterScope: true
                arguments:
                  parameters:
                    - name: git-revision
                      value: '{{steps.checkout-source.outputs.parameters.git-revision}}'
            - - name: generate-workload-cr
                templateRef:
                  name: generate-workload
                  template: generate-workload-cr
                  clusterScope: true
                arguments:
                  parameters:
                    - name: image
                      value: '{{steps.publish-image.outputs.parameters.image}}'
      volumeClaimTemplates:
        - metadata:
            name: workspace
          spec:
            accessModes: [ReadWriteOnce]
            resources:
              requests:
                storage: 2Gi
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

  schema:
    parameters:
      source:
        org: string | default="openchoreo" description="GitHub organization name"
        repo: string | default="openchoreo" description="GitHub repository name"
      output:
        format: string | default="table" enum=table,json description="Report output format"

  runTemplate:
    apiVersion: argoproj.io/v1alpha1
    kind: Workflow
    metadata:
      name: ${metadata.workflowRunName}
      namespace: openchoreo-ci-${metadata.namespaceName}
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
      entrypoint: main
      templates:
        - name: main
          steps:
            - - name: report
                templateRef:
                  name: github-stats-report
                  template: pipeline
                  clusterScope: true
```

## Annotations

| Annotation                                           | Description                                                          |
|------------------------------------------------------|----------------------------------------------------------------------|
| `openchoreo.dev/display-name`                        | Human-readable name for UI display                                   |
| `openchoreo.dev/description`                         | Detailed description of the Workflow                                 |
| `openchoreo.dev/component-workflow-parameters`       | Maps parameter keys to dotted paths for auto-build and UI integration. See [Component Workflows](../../../user-guide/workflows/ci/component-workflows.md) |

## Related Resources

- [WorkflowRun](../application/workflowrun.md) - Runtime execution instances of Workflows
- [ComponentType](./componenttype.md) - Can restrict allowed workflows via `allowedWorkflows`
- [Component](../application/component.md) - References Workflows for building
- [Workflows User Guide](../../../user-guide/workflows/overview.md) - Guide for creating and using workflows