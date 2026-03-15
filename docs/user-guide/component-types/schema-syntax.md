---
title: openAPIV3Schema
description: Parameter schema definition for ComponentTypes and Traits using openAPIV3Schema
---

# openAPIV3Schema

This guide explains how to define schemas for ComponentTypes and Traits using `openAPIV3Schema`. Schemas are defined using standard [OpenAPI v3 JSON Schema](https://swagger.io/docs/specification/data-models/) format, giving you full control over parameter validation with a widely adopted specification.

## Overview

Schemas are defined under the `openAPIV3Schema` field in your ComponentType or Trait spec. They follow the standard JSON Schema structure used by OpenAPI v3:

```yaml
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
      name:
        type: string                    # Required string
      age:
        type: integer
        minimum: 0
        maximum: 120                    # Integer with constraints
      price:
        type: number
        minimum: 0.01                   # Number (float) with minimum
      enabled:
        type: boolean
        default: false                  # Optional boolean with default
```

### Arrays

```yaml
parameters:
  openAPIV3Schema:
    type: object
    properties:
      tags:
        type: array
        items:
          type: string                  # Array of strings
      ports:
        type: array
        items:
          type: integer                 # Array of integers
      mounts:
        type: array
        items:
          type: object
          properties:
            path:
              type: string
            readOnly:
              type: boolean             # Array of objects
      configs:
        type: array
        items:
          type: object
          additionalProperties:
            type: string                # Array of maps
```

### Maps

```yaml
parameters:
  openAPIV3Schema:
    type: object
    properties:
      labels:
        type: object
        additionalProperties:
          type: string                  # Map with string values
      ports:
        type: object
        additionalProperties:
          type: integer                 # Map with integer values
      settings:
        type: object
        additionalProperties:
          type: boolean                 # Map with boolean values
```

### Objects

For structured objects, use nested `properties`:

```yaml
parameters:
  openAPIV3Schema:
    type: object
    properties:
      database:
        type: object
        properties:
          host:
            type: string
          port:
            type: integer
            default: 5432
          username:
            type: string
          password:
            type: string
          options:
            type: object
            properties:
              ssl:
                type: boolean
                default: true
              timeout:
                type: integer
                default: 30
```

## Defaults

All fields are **required by default**. To make a field optional, provide a `default` value.

### Primitives, Arrays, and Maps

```yaml
parameters:
  openAPIV3Schema:
    type: object
    properties:
      # Required - must provide value
      name:
        type: string
      tags:
        type: array
        items:
          type: string

      # Optional - have explicit defaults
      replicas:
        type: integer
        default: 1
      optionalTags:
        type: array
        items:
          type: string
        default: []
      labels:
        type: object
        additionalProperties:
          type: string
        default: {}
```

### Objects

Objects are required unless they have a `default`. Provide a default at the object level:

```yaml
parameters:
  openAPIV3Schema:
    type: object
    properties:
      # Optional: all fields have defaults, object defaults to empty
      monitoring:
        type: object
        default: {}
        properties:
          enabled:
            type: boolean
            default: false
          port:
            type: integer
            default: 9090

      # Optional: default provides required host field
      database:
        type: object
        default:
          host: "localhost"
        properties:
          host:
            type: string
          port:
            type: integer
            default: 5432
```

### Default Precedence

When an object is **not provided**, the object default is used, then field-level defaults apply to missing fields:

```yaml
# Schema
parameters:
  openAPIV3Schema:
    type: object
    properties:
      database:
        type: object
        default:
          host: "localhost"
        properties:
          host:
            type: string
          port:
            type: integer
            default: 5432

# Input: parameters: {}
# Result: database = {host: "localhost", port: 5432}
```

When an object **is provided**, the object default is ignored and field-level defaults apply:

```yaml
# Input: parameters: {database: {host: "production-db"}}
# Result: database = {host: "production-db", port: 5432}
```

:::note Why explicit defaults are required
Objects are required unless you explicitly provide a default—even when all nested fields have defaults. This is intentional:

- **Predictable**: You can tell if an object is optional by checking for a default, without inspecting nested fields
- **Safe evolution**: When you add a required field to an object, the existing `default: {}` fails validation, alerting you to update it. Without explicit defaults, the object would silently become required, breaking existing Components.
- **Clear intent**: `default: {}` signals that the entire configuration block is optional
:::

## Constraint Markers

Standard JSON Schema validation keywords are used directly as properties.

### Validation Constraints

```yaml
parameters:
  openAPIV3Schema:
    type: object
    properties:
      # Strings
      username:
        type: string
        minLength: 3
        maxLength: 20
        pattern: "^[a-z][a-z0-9_]*$"
      email:
        type: string
        format: email

      # Numbers
      age:
        type: integer
        minimum: 0
        maximum: 150
      price:
        type: number
        minimum: 0
        exclusiveMinimum: true
        multipleOf: 0.01

      # Arrays
      tags:
        type: array
        items:
          type: string
        minItems: 1
        maxItems: 10
        uniqueItems: true
```

### Enumerations

```yaml
parameters:
  openAPIV3Schema:
    type: object
    properties:
      environment:
        type: string
        enum:
          - development
          - staging
          - production
      logLevel:
        type: string
        enum:
          - debug
          - info
          - warning
          - error
        default: info
```

### Documentation

```yaml
parameters:
  openAPIV3Schema:
    type: object
    properties:
      apiKey:
        type: string
        title: "API Key"
        description: "Authentication key for external service"
        example: "sk-abc123"
      timeout:
        type: integer
        description: "Request timeout in seconds"
        default: 30
```

## Custom Annotations

Add custom metadata using `x-oc-` extension fields. These are ignored during validation but can be used by UI generators and tooling:

```yaml
parameters:
  openAPIV3Schema:
    type: object
    properties:
      commitHash:
        type: string
        x-oc-build-inject: "git.sha"
        x-oc-ui-hidden: true
      advancedTimeout:
        type: string
        default: "30s"
        x-oc-scaffolding: "omit"
```

## Schema Evolution

OpenChoreo schemas allow additional properties beyond what's defined, enabling safe schema evolution:

- **Development**: Add fields to Component before updating ComponentType schema
- **Promotion**: Add new `environmentConfigs` in target environment before promoting
- **Rollback**: Rolling back works - extra fields are simply ignored
- **Safety**: Unknown fields don't cause failures

```yaml
# Environment prepared for promotion
environmentConfigs:
  openAPIV3Schema:
    type: object
    properties:
      replicas:
        type: integer
        default: 2
      monitoring:
        type: string
        default: "enabled"   # Added before new Release arrives
```

## Complete Example

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentType
metadata:
  name: web-service
  namespace: default
spec:
  workloadType: deployment

  # Traits that can be applied to components of this type
  allowedTraits:
    - kind: Trait
      name: persistent-volume
    - kind: Trait
      name: autoscaler
    - kind: Trait
      name: monitoring

  parameters:
    openAPIV3Schema:
      type: object
      properties:
        # Optional parameters with defaults
        replicas:
          type: integer
          default: 1
          minimum: 1
          maximum: 100
        serviceType:
          type: string
          enum:
            - ClusterIP
            - NodePort
            - LoadBalancer
          default: ClusterIP

        # Nested optional objects
        livenessProbe:
          type: object
          default: {}
          properties:
            path:
              type: string
              default: "/healthz"
            port:
              type: integer
              default: 8080
            initialDelaySeconds:
              type: integer
              default: 0
            periodSeconds:
              type: integer
              default: 10
        readinessProbe:
          type: object
          default: {}
          properties:
            path:
              type: string
              default: "/healthz"
            port:
              type: integer
              default: 8080
            initialDelaySeconds:
              type: integer
              default: 0
            periodSeconds:
              type: integer
              default: 10

  environmentConfigs:
    openAPIV3Schema:
      type: object
      properties:
        resources:
          type: object
          default: {}
          properties:
            cpu:
              type: string
              default: "100m"
            memory:
              type: string
              default: "256Mi"
        replicas:
          type: integer
          default: 1

  # Validation rules for cross-field validation
  validations:
    - rule: ${size(workload.endpoints) > 0}
      message: "Service components must expose at least one endpoint"

  resources:
    # Primary workload - id must match workloadType
    - id: deployment
      template:
        # ... uses ${workload.endpoints}, ${environmentConfigs.resources.cpu}, etc.
```

## Related Resources

- [Templating Syntax](./templating-syntax.md) - Using parameters in templates
- [Patching Syntax](./patching-syntax.md) - JSON Patch operations for Traits
- [Validation Rules](./validation-rules.md) - CEL-based semantic validation
- [ComponentType API Reference](../../reference/api/platform/componenttype.md) - Full CRD specification
