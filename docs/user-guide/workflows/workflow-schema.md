---
title: Workflow Spec
description: Learn how to define and use parameters in Workflows
sidebar_position: 5
---

# Workflow Spec

A Workflow is a platform engineer-defined template for running automation tasks in OpenChoreo. Workflows define a flexible parameter schema that developers configure when creating a WorkflowRun.

## Schema Definition

The `schema` section in a Workflow defines developer-facing parameters using OpenChoreo's schema shorthand syntax. A schema consists of optional reusable type definitions and parameter definitions.

```yaml
schema:
  types:           # Optional: reusable type definitions
    MyType:
      field1: string
      field2: integer

  parameters:      # Developer-facing parameters
    repo:
      url: string | description="Repository URL"
    docker:
      context: string | default=. description="Build context"
```

### Parameter Types

Parameters support the following types and modifiers:

- **Basic types**: `string`, `integer`, `boolean`
- **Array types**: `array<type>` (e.g., `array<string>`)
- **Nested objects**: Maps defining nested parameter structures
- **Custom types**: References to types defined in the `types` section

**Inline type syntax:**

```
"type | default=value enum=val1,val2 minimum=1 maximum=10 description=\"...\""
```

### Example Schemas

#### Basic Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workflow
metadata:
  name: docker
  namespace: default
spec:
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
```

#### Schema with Reusable Types

Platform engineers can define reusable types for complex parameter structures:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workflow
metadata:
  name: advanced-workflow
  namespace: default
spec:
  schema:
    types:
      Endpoint:
        name: string
        port: integer
        type: string | enum=REST,HTTP,TCP,UDP

      ResourceQuantity:
        cpu: string | default=1000m
        memory: string | default=1Gi

    parameters:
      endpoints: '[]Endpoint | default=[]'
      resources: ResourceQuantity | default={}
```

## External References

External references allow a Workflow to declare dependencies on external Kubernetes resources (like SecretReference CRs). These resources are resolved at runtime and their specs are injected into template variables.

```yaml
externalRefs:
  - id: repo-credentials
    apiVersion: openchoreo.dev/v1alpha1
    kind: SecretReference
    name: ${parameters.repository.secretRef}
```

Once resolved, external reference specs are available in template expressions as `${externalRefs.repo-credentials.spec.*}`.

If the resource name evaluates to empty, the reference is silently skipped.

## Workflow Resources

Additional Kubernetes resources (secrets, configmaps, etc.) can be created automatically when a WorkflowRun is executed. Resources support conditional creation via `includeWhen` CEL expressions.

```yaml
resources:
  - id: git-secret
    includeWhen: '${parameters.repository.secretRef != ""}'
    template:
      apiVersion: external-secrets.io/v1
      kind: ExternalSecret
      metadata:
        name: ${metadata.workflowRunName}-git-secret
      spec:
        refreshInterval: 15s
        secretStoreRef:
          name: default
          kind: ClusterSecretStore
        target:
          name: ${metadata.workflowRunName}-git-secret
```

**Resource lifecycle:**
- Resources are rendered and created in the build plane before workflow execution
- Resources with `includeWhen` conditions are only created if the condition evaluates to true
- When a WorkflowRun is deleted, associated resources are automatically cleaned up

## Template Variable Reference

The `runTemplate` field supports the following variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `${metadata.workflowRunName}` | WorkflowRun resource name | `${metadata.workflowRunName}` |
| `${metadata.namespaceName}` | Namespace name | `${metadata.namespaceName}` |
| `${parameters.*}` | Developer parameter values | `${parameters.docker.context}` |
| `${externalRefs[<id>]spec.*}` | Resolved external reference spec | `${externalRefs['repo-credentials'].spec.type}` |
| `${metadata.labels['openchoreo.dev/component']}` | Component name (for component workflows) | `${metadata.labels['openchoreo.dev/component']}` |
| `${metadata.labels['openchoreo.dev/project']}` | Project name (for component workflows) | `${metadata.labels['openchoreo.dev/project']}` |

## Using Parameters in runTemplate

The `runTemplate` field defines an Argo Workflow that will be rendered for each WorkflowRun execution. Template variables are substituted with actual values at runtime.

### Example: Automation Workflow

This example shows a generic workflow for fetching GitHub statistics:

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

## TTL and Cleanup

Use `ttlAfterCompletion` to automatically delete WorkflowRun resources after completion:

```yaml
spec:
  ttlAfterCompletion: "7d"  # Delete after 7 days
```

Supported duration formats: `90d`, `1h30m`, `30m`, `45s`
