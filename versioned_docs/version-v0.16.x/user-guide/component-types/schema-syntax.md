---
title: Schema Syntax
description: Parameter schema syntax for ComponentTypes and Traits
---

# Schema Syntax

This guide explains how to define schemas for ComponentTypes and Traits using OpenChoreo's schema syntax. The syntax provides a concise, readable alternative to verbose JSON Schema.

## Overview

Schemas allow you to define parameter validation rules using simple string expressions:

```yaml
fieldName: "type | constraint1=value1 constraint2=value2"
```

## Basic Types

### Primitives

```yaml
name: string                              # Required string
age: "integer | minimum=0 maximum=120"    # Integer with constraints
price: "number | minimum=0.01"            # Number (float) with minimum
enabled: "boolean | default=false"        # Optional boolean with default
```

### Arrays

```yaml
tags: "[]string"              # Array of strings
ports: "[]integer"            # Array of integers
mounts: "[]MountConfig"       # Array of custom type
configs: "[]map<string>"      # Array of maps
```

### Maps

```yaml
labels: "map<string>"      # Map with string values (keys always strings)
ports: "map<integer>"      # Map with integer values
settings: "map<boolean>"   # Map with boolean values
```

### Objects

For structured objects, use nested field definitions:

```yaml
database:
  host: "string"
  port: "integer | default=5432"
  username: "string"
  password: "string"
  options:
    ssl: "boolean | default=true"
    timeout: "integer | default=30"
```

## Custom Types

Define reusable types in the `schema.types` section. Use custom types when a structure is reused in multiple places or for self-documenting type names.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentType
metadata:
  name: web-app
spec:
  schema:
    types:
      MountConfig:
        path: "string"
        subPath: "string | default=''"
        readOnly: "boolean | default=false"

      DatabaseConfig:
        host: "string"
        port: "integer | default=5432 minimum=1 maximum=65535"
        database: "string"

    parameters:
      volumes: "[]MountConfig"
      database: DatabaseConfig
      replicas: "integer | default=1 minimum=1"
```

## Defaults

All fields are **required by default**. To make a field optional, provide a `default` value.

### Primitives, Arrays, and Maps

```yaml
# Required - must provide value
name: string
tags: "[]string"
labels: "map<string>"

# Optional - have explicit defaults
replicas: "integer | default=1"
tags: "[]string | default=[]"
labels: "map<string> | default={}"
```

### Objects

Objects are required unless they have a default. Two approaches:

**Approach 1: Default when referencing a type**

```yaml
schema:
  types:
    Monitoring:
      enabled: "boolean | default=false"
      port: "integer | default=9090"

    Database:
      host: string
      port: "integer | default=5432"

  parameters:
    # Valid: All fields in Monitoring have defaults
    monitoring: "Monitoring | default={}"

    # Valid: Default provides required host field
    database: "Database | default={\"host\":\"localhost\"}"
```

**Approach 2: Default in the definition (`$default`)**

```yaml
schema:
  parameters:
    # Inline object with empty default
    monitoring:
      $default: {}
      enabled: "boolean | default=false"
      port: "integer | default=9090"

    # Inline object with non-empty default
    database:
      $default:
        host: "localhost"
      host: string
      port: "integer | default=5432"
```

### Default Precedence

When an object is **not provided**, the object default is used, then field-level defaults apply to missing fields:

```yaml
# Schema
database:
  $default:
    host: "localhost"
  host: string
  port: "integer | default=5432"

# Input: parameters: {}
# Result: database = {host: "localhost", port: 5432}
```

When an object **is provided**, the object default is ignored and field-level defaults apply:

```yaml
# Input: parameters: {database: {host: "production-db"}}
# Result: database = {host: "production-db", port: 5432}
```

### Using `$default` in Type Definitions

Type-level `$default` makes all references to that type automatically optional:

```yaml
types:
  Resources:
    $default: {}
    cpu: "string | default=100m"
    memory: "string | default=256Mi"

parameters:
  resources1: Resources  # Optional
  resources2: Resources  # Optional
```

:::note Why explicit defaults are required
Objects are required unless you explicitly provide a default—even when all nested fields have defaults. This is intentional:

- **Predictable**: You can tell if an object is optional by checking for a default, without inspecting nested fields
- **Safe evolution**: When you add a required field to an object, the existing `$default: {}` fails validation, alerting you to update it. Without explicit defaults, the object would silently become required, breaking existing Components.
- **Clear intent**: `$default: {}` signals that the entire configuration block is optional
:::

## Constraint Markers

Constraints are specified after the pipe (`|`) separator, space-separated.

### Validation Constraints

```yaml
# Strings
username: "string | minLength=3 maxLength=20 pattern=^[a-z][a-z0-9_]*$"
email: "string | format=email"

# Numbers
age: "integer | minimum=0 maximum=150"
price: "number | minimum=0 exclusiveMinimum=true multipleOf=0.01"

# Arrays
tags: "[]string | minItems=1 maxItems=10 uniqueItems=true"
```

### Enumerations

```yaml
environment: "string | enum=development,staging,production"
logLevel: "string | enum=debug,info,warning,error default=info"
```

### Documentation

```yaml
apiKey: "string | title='API Key' description='Authentication key for external service' example=sk-abc123"
timeout: "integer | description='Request timeout in seconds' default=30"
```

## Custom Annotations

Add custom metadata using the `oc:` prefix. These are ignored during validation but can be used by UI generators and tooling:

```yaml
commitHash: "string | oc:build:inject=git.sha oc:ui:hidden=true"
advancedTimeout: "string | default='30s' oc:scaffolding=omit"
```

## Escaping and Special Characters

### Quoting Rules

```yaml
# Single quotes: double to escape
description: "string | default='User''s timezone'"

# Double quotes: backslash escape
pattern: "string | default=\"^[a-z]+\\\\d{3}$\""

# Pipes in values must be quoted
format: 'string | pattern="a|b|c"'

# Enum values with spaces/commas - quote each value
size: 'string | enum="extra small","small","medium","large"'
format: 'string | enum="lastname, firstname","firstname lastname"'
```

**Summary:**
- Single quotes: `''` escapes `'`
- Double quotes: `\\` escapes `\`, `\"` escapes `"`
- Pipes (`|`) in values require quoting
- Enum values with spaces or commas need individual quotes

## Schema Evolution

OpenChoreo schemas allow additional properties beyond what's defined, enabling safe schema evolution:

- **Development**: Add fields to Component before updating ComponentType schema
- **Promotion**: Add new `envOverrides` in target environment before promoting
- **Rollback**: Rolling back works - extra fields are simply ignored
- **Safety**: Unknown fields don't cause failures

```yaml
# Environment prepared for promotion
envOverrides:
  replicas: 2
  monitoring: "enabled"  # Added before new Release arrives
```

## Complete Example

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentType
metadata:
  name: web-service
spec:
  workloadType: deployment

  schema:
    types:
      ResourceRequirements:
        $default: {}
        cpu: "string | default=100m"
        memory: "string | default=256Mi"

      ProbeConfig:
        $default: {}
        path: "string | default=/healthz"
        port: "integer | default=8080"
        initialDelaySeconds: "integer | default=0"
        periodSeconds: "integer | default=10"

    parameters:
      # Required parameters
      port: "integer | minimum=1 maximum=65535"

      # Optional parameters with defaults
      replicas: "integer | default=1 minimum=1 maximum=100"
      serviceType: "string | enum=ClusterIP,NodePort,LoadBalancer default=ClusterIP"
      exposed: "boolean | default=false"

      # Nested optional objects
      livenessProbe: ProbeConfig
      readinessProbe: ProbeConfig

    envOverrides:
      resources: ResourceRequirements
      replicas: "integer | default=1"

  resources:
    - id: deployment
      template:
        # ... uses ${parameters.port}, ${envOverrides.resources.cpu}, etc.
```

## JSON Schema Mapping

OpenChoreo's schema syntax compiles to standard JSON Schema. For reference:

| OpenChoreo | JSON Schema |
|------------|-------------|
| `string` | `{"type": "string"}` |
| `integer` | `{"type": "integer"}` |
| `number` | `{"type": "number"}` |
| `boolean` | `{"type": "boolean"}` |
| `[]string` | `{"type": "array", "items": {"type": "string"}}` |
| `map<string>` | `{"type": "object", "additionalProperties": {"type": "string"}}` |
| `default=value` | `{"default": value}` |
| `minimum=N` | `{"minimum": N}` |
| `enum=a,b,c` | `{"enum": ["a", "b", "c"]}` |

## Related Resources

- [Templating Syntax](./templating-syntax.md) - Using parameters in templates
- [Patching Syntax](./patching-syntax.md) - JSON Patch operations for Traits
- [ComponentType API Reference](../../reference/api/platform/componenttype.md) - Full CRD specification
