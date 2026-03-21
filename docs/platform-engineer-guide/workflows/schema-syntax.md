---
title: Schema Syntax
description: Parameter schema definition for Workflows using openAPIV3Schema

---

# Schema Syntax

This guide explains how to define parameter schemas for Workflows and ClusterWorkflows using `openAPIV3Schema`. Schemas are defined using standard [OpenAPI v3 JSON Schema](https://swagger.io/docs/specification/data-models/) format.

## Overview

Workflow parameters are defined under `spec.parameters.openAPIV3Schema`. They control what developers can configure when creating a WorkflowRun. The schema validates input and provides defaults for omitted fields.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterWorkflow
metadata:
  name: my-workflow
spec:
  parameters:
    openAPIV3Schema:
      type: object
      properties:
        fieldName:
          type: string
          description: "A description of this field"
```

## Basic Types

### Primitives

```yaml
parameters:
  openAPIV3Schema:
    type: object
    properties:
      repoUrl:
        type: string
        description: "Git repository URL"
      retryCount:
        type: integer
        default: 3
        minimum: 0
        maximum: 10
      timeoutMinutes:
        type: number
        minimum: 0.5
      dryRun:
        type: boolean
        default: false
```

### Arrays

```yaml
parameters:
  openAPIV3Schema:
    type: object
    properties:
      buildArgs:
        type: array
        default: []
        description: "Docker build arguments"
        items:
          type: object
          required: [name, value]
          properties:
            name:
              type: string
              description: "Build argument name"
            value:
              type: string
              description: "Build argument value"
      tags:
        type: array
        items:
          type: string
        default: []
```

### Objects

For structured parameters, use nested `properties`:

```yaml
parameters:
  openAPIV3Schema:
    type: object
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
                description: "Git commit SHA (optional)"
          appPath:
            type: string
            default: "."
            description: "Path to the application directory"
```

## Required vs Optional Fields

Fields are **optional by default** in JSON Schema. Use `required` to mark mandatory fields, and `default` to provide fallback values.

### Required Fields

Use the `required` keyword at the object level to list mandatory properties:

```yaml
parameters:
  openAPIV3Schema:
    type: object
    required:
      - repository # Must be provided
    properties:
      repository:
        type: object
        required:
          - url # Must be provided within repository
        properties:
          url:
            type: string
          branch:
            type: string
            default: main # Optional with default
```

### Defaults

Provide `default` values to make fields optional and ensure predictable behavior when omitted:

```yaml
parameters:
  openAPIV3Schema:
    type: object
    properties:
      # Optional primitives with defaults
      timeout:
        type: string
        default: "30m"
      trivyScan:
        type: boolean
        default: true

      # Optional object with default
      docker:
        type: object
        default: {}
        properties:
          context:
            type: string
            default: "."
          filePath:
            type: string
            default: "./Dockerfile"
```

When an object has `default: {}`, all its nested field defaults are applied automatically:

```yaml
# Input: parameters: {}
# Result: docker = {context: ".", filePath: "./Dockerfile"}
```

## Validation Constraints

Standard JSON Schema validation keywords are supported:

### Strings

```yaml
identifier:
  type: string
  minLength: 1
  maxLength: 63
  pattern: "^[a-z]([a-z0-9-]*[a-z0-9])?$"
```

### Numbers

```yaml
replicas:
  type: integer
  minimum: 1
  maximum: 10
cpuLimit:
  type: number
  minimum: 0.1
  exclusiveMinimum: true
```

### Enumerations

```yaml
outputFormat:
  type: string
  enum:
    - table
    - json
    - yaml
  default: "table"
  description: "Report output format"
```

### Arrays

```yaml
environments:
  type: array
  items:
    type: string
  minItems: 1
  maxItems: 5
  uniqueItems: true
```

## Vendor Extensions for CI Workflows

CI workflows that support auto-build (Git webhook-triggered builds) use `x-openchoreo-component-parameter-repository-*` vendor extensions to identify repository-related fields. See [CI Governance](./ci-governance.md#vendor-extension-fields-for-auto-build-and-ui) for details.

```yaml
parameters:
  openAPIV3Schema:
    type: object
    required:
      - repository
    properties:
      repository:
        type: object
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
                x-openchoreo-component-parameter-repository-branch: true
              commit:
                type: string
                default: ""
                x-openchoreo-component-parameter-repository-commit: true
          appPath:
            type: string
            default: "."
            x-openchoreo-component-parameter-repository-app-path: true
```

## Template Variable Access

Parameters defined in the schema are accessible in `runTemplate` and `resources` via CEL expressions:

```yaml
parameters:
  openAPIV3Schema:
    type: object
    properties:
      repository:
        type: object
        properties:
          url:
            type: string
          revision:
            type: object
            properties:
              branch:
                type: string
                default: main
      timeout:
        type: string
        default: "30m"

runTemplate:
  apiVersion: argoproj.io/v1alpha1
  kind: Workflow
  metadata:
    name: ${metadata.workflowRunName}
    namespace: ${metadata.namespace}
  spec:
    arguments:
      parameters:
        - name: git-repo
          value: ${parameters.repository.url} # Nested access
        - name: branch
          value: ${parameters.repository.revision.branch}
        - name: timeout
          value: ${parameters.timeout} # Top-level access
```

See [Context Variables](../../reference/cel/context-variables.md#workflow-variables) for all available template variables.

## Complete Examples

### CI Workflow (Dockerfile Builder)

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
              description: "Path to the application directory"
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
        buildEnv:
          type: array
          default: []
          description: "Environment variables for the build"
          items:
            type: object
            required: [name, value]
            properties:
              name:
                type: string
              value:
                type: string
```

### Generic Automation Workflow (Terraform)

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workflow
metadata:
  name: aws-rds-postgres-create
  namespace: default
  annotations:
    openchoreo.dev/description: "Provision an AWS RDS PostgreSQL instance using Terraform"
spec:
  ttlAfterCompletion: "1d"
  parameters:
    openAPIV3Schema:
      type: object
      properties:
        git:
          type: object
          default: {}
          description: "Source repository containing Terraform files"
          properties:
            repoUrl:
              type: string
              default: "https://github.com/openchoreo/openchoreo.git"
              description: "Git repository URL"
            branch:
              type: string
              default: "main"
              description: "Branch or tag to check out"
            tfPath:
              type: string
              default: "samples/workflows/aws-rds-postgres-create/terraform"
              description: "Path to Terraform files in the repo"
        aws:
          type: object
          default: {}
          properties:
            region:
              type: string
              default: "us-east-1"
              description: "AWS region for the RDS instance"
            credentialsSecret:
              type: string
              description: "Kubernetes Secret with AWS credentials"
        db:
          type: object
          default: {}
          properties:
            identifier:
              type: string
              description: "Unique RDS instance identifier"
            name:
              type: string
              description: "Initial database name"
            username:
              type: string
              description: "Master username"
            engineVersion:
              type: string
              default: "16"
              description: "PostgreSQL engine version"
```

## Related Resources

- [Creating Workflows](./creating-workflows.mdx) - Step-by-step guide for defining Workflows
- [Workflow API Reference](../../reference/api/platform/workflow.md) - Full CRD specification
- [Context Variables](../../reference/cel/context-variables.md#workflow-variables) - Template variables available in Workflows
- [CI Governance](./ci-governance.md) - CI workflow labels, governance, and auto-build configuration
