---
title: Validation Rules
description: CEL-based validation rules for ComponentTypes and Traits
---

# Validation Rules

This guide explains how to define CEL-based validation rules for ComponentTypes and Traits to enforce semantic constraints and cross-field relationships beyond basic schema validation.

## Overview

Validation rules complement schema validation by enabling:

- **Cross-field relationships** - Validate that multiple fields work together correctly
- **Domain-specific invariants** - Enforce business logic constraints
- **Runtime context validation** - Access workload, dataplane, and environment configuration
- **Custom error messages** - Provide clear, actionable feedback when validation fails

Validation rules use CEL expressions wrapped in `${}` that must evaluate to `true` for validation to pass.

## Basic Validation Structure

### ValidationRule Format

Each validation rule consists of two required fields:

```yaml
validations:
  - rule: ${parameters.replicas >= 1}
    message: "replicas must be at least 1"
  - rule: ${parameters.port > 0 && parameters.port <= 65535}
    message: "port must be between 1 and 65535"
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rule` | string | Yes | CEL expression wrapped in `${...}` that must evaluate to true |
| `message` | string | Yes | Error message shown when the rule evaluates to false |

## ComponentType Validations

### Basic Parameter Validation

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentType
metadata:
  name: web-service
spec:
  workloadType: deployment
  schema:
    parameters:
      replicas: "integer | default=1 minimum=1"
      port: "integer | minimum=1 maximum=65535"
      environment: "string | enum=development,staging,production"

  validations:
    # Ensure production has multiple replicas
    - rule: ${parameters.environment != "production" || parameters.replicas >= 2}
      message: "Production environment requires at least 2 replicas for high availability"

    # Validate port ranges for different environments
    - rule: ${parameters.environment != "development" || parameters.port >= 8000}
      message: "Development environment must use ports >= 8000 to avoid conflicts"

    # Cross-field validation
    - rule: ${parameters.replicas <= 10 || parameters.environment == "production"}
      message: "High replica counts (>10) are only allowed in production environment"
```

### Environment-Specific Validation

```yaml
validations:
  # Validate environment override consistency
  - rule: ${!has(envOverrides.maxReplicas) || !has(envOverrides.minReplicas) || envOverrides.maxReplicas >= envOverrides.minReplicas}
    message: "maxReplicas must be greater than or equal to minReplicas"

  # Ensure resource limits are set in production
  - rule: ${metadata.environmentName != "production" || (has(envOverrides.resources) && has(envOverrides.resources.limits))}
    message: "Production deployments must specify resource limits"
```

### Workload-Based Validation

```yaml
validations:
  # Validate endpoint configuration
  - rule: ${size(workload.endpoints) > 0}
    message: "Service components must expose at least one endpoint"

  # Ensure HTTP endpoints for web applications
  - rule: ${parameters.componentType != "web-app" || workload.endpoints.exists(name, workload.endpoints[name].type == "HTTP")}
    message: "Web applications must expose at least one HTTP endpoint"

  # Validate endpoint port matches parameter
  - rule: ${!has(parameters.endpointName) || (parameters.endpointName in workload.endpoints && workload.endpoints[parameters.endpointName].port == parameters.port)}
    message: "Endpoint port must match the configured service port"
```

## Trait Validations

### Basic Trait Validation

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Trait
metadata:
  name: persistent-volume
spec:
  schema:
    parameters:
      volumeName: "string"
      mountPath: "string"
      accessMode: "string | enum=ReadWriteOnce,ReadOnlyMany,ReadWriteMany default=ReadWriteOnce"

  validations:
    # Ensure volume name is valid
    - rule: ${parameters.volumeName != "" && size(parameters.volumeName) <= 63}
      message: "volumeName must be non-empty and 63 characters or less"

    # Validate mount path format
    - rule: ${parameters.mountPath.startsWith("/")}
      message: "mountPath must be an absolute path starting with '/'"

    # Ensure no mount conflicts
    - rule: ${parameters.mountPath != "/tmp" && parameters.mountPath != "/var/tmp"}
      message: "Cannot mount volumes to system temp directories /tmp or /var/tmp"
```

### Workload-Aware Trait Validation

```yaml
validations:
  # Validate access modes for different workload types
  - rule: ${parameters.accessMode == "ReadWriteOnce" || workload.workloadType == "statefulset"}
    message: "ReadWriteMany and ReadOnlyMany access modes are only supported for StatefulSet workloads"

  # Ensure container exists for volume mounts
  - rule: ${!has(parameters.containerName) || has(workload.container)}
    message: "Cannot mount volume: no container found in workload"

  # Validate trait instance naming
  - rule: ${trait.instanceName.matches("^[a-z][a-z0-9-]*[a-z0-9]$")}
    message: "Trait instanceName must be lowercase DNS-compliant: start/end with alphanumeric, contain only lowercase letters, numbers, and hyphens"
```

## Context Variables in Validations

Validation rules have access to different context variables depending on scope:

### ComponentType Context
- `metadata` - Component metadata (name, namespace, environment, labels, etc.)
- `parameters` - Component parameters with schema defaults applied
- `envOverrides` - Environment-specific parameter overrides
- `workload` - Workload specification (container, endpoints, workloadType)
- `configurations` - Configuration and secret references
- `dataplane` - DataPlane configuration (secretStore, publicVirtualHost, etc.)

### Trait Context
All ComponentType variables plus:
- `trait.name` - Name of the trait type
- `trait.instanceName` - Unique instance name for this trait within the component

### Example Context Usage

```yaml
validations:
  # Access component metadata
  - rule: ${size(metadata.componentName) <= 63}
    message: "Component name must be 63 characters or less for DNS compatibility"

  # Check dataplane capabilities
  - rule: ${!parameters.externalAccess || has(dataplane.publicVirtualHost)}
    message: "External access requires publicVirtualHost configuration in the dataplane"

  # Validate against workload container
  - rule: ${!has(parameters.containerPort) || parameters.containerPort == workload.container.port}
    message: "Container port parameter must match workload container configuration"

  # Environment-specific checks
  - rule: ${metadata.environmentName != "production" || metadata.componentNamespace != "default"}
    message: "Production components cannot be deployed to the default namespace"
```

## Advanced Validation Patterns

### List and Map Validation

```yaml
validations:
  # Validate all items in a list
  - rule: ${!has(parameters.databases) || parameters.databases.all(db, has(db.host) && has(db.port) && db.port > 0)}
    message: "All databases must have valid host and port configuration"

  # Check for required keys in maps
  - rule: ${!has(parameters.secrets) || parameters.secrets.all(name, secret, has(secret.key))}
    message: "All secrets must specify a key field"

  # Validate uniqueness
  - rule: ${!has(parameters.endpoints) || size(parameters.endpoints) == size(parameters.endpoints.map(ep, ep.name).distinct())}
    message: "Endpoint names must be unique"
```

### Conditional Validation

```yaml
validations:
  # Conditional requirements based on features
  - rule: ${!parameters.ssl.enabled || (has(parameters.ssl.certSecret) && has(parameters.ssl.keySecret))}
    message: "SSL enabled requires both certificate and key secrets"

  # Environment-conditional validation
  - rule: ${metadata.environmentName != "production" || (parameters.replicas >= 2 && has(envOverrides.resources.limits))}
    message: "Production requires >=2 replicas and resource limits"

  # Mutually exclusive options
  - rule: ${[has(parameters.basicAuth), has(parameters.oauth)].filter(x, x).size() <= 1}
    message: "Cannot enable both basicAuth and oauth authentication"
```

## Validation Execution and Error Handling

### Execution Order
1. **Schema validation** - Type checking and constraint validation happens first
2. **Default application** - Schema defaults are applied to parameters
3. **Rule evaluation** - All validation rules are evaluated with full context
4. **Error collection** - Multiple rule failures are collected and reported together

### Error Message Format
When validation fails, OpenChoreo provides structured error messages:
```
rule[0] "${parameters.replicas >= 1}" evaluated to false: replicas must be at least 1
```

Multiple failures are joined with `; `:
```
rule[0] "${parameters.replicas >= 1}" evaluated to false: replicas must be at least 1; rule[1] "${parameters.port > 0}" evaluated to false: port must be greater than 0
```

### Best Practices for Error Messages

```yaml
validations:
  # Bad - unclear and not actionable
  - rule: ${parameters.value > 0}
    message: "Invalid value"

  # Good - specific and actionable
  - rule: ${parameters.replicas > 0 && parameters.replicas <= 20}
    message: "replicas must be between 1 and 20. Current value: ${parameters.replicas}"

  # Good - includes context and guidance
  - rule: ${!parameters.highAvailability || parameters.replicas >= 3}
    message: "High availability mode requires at least 3 replicas. Set replicas >= 3 or disable highAvailability."

  # Good - references documentation
  - rule: ${parameters.storageClass in ["standard", "ssd", "premium"]}
    message: "storageClass '${parameters.storageClass}' is not supported. Allowed values: standard, ssd, premium. See: https://docs.example.com/storage"
```

## Testing Validation Rules

### Component Testing

Create test Components to verify validation behavior:

```yaml
# This should pass validation
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: test-valid-prod
spec:
  componentType:
    kind: ComponentType
    name: deployment/web-service
  parameters:
    environment: "production"
    replicas: 3
    port: 8080

---
# This should fail validation (production with 1 replica)
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: test-invalid-prod
spec:
  componentType:
    kind: ComponentType
    name: deployment/web-service
  parameters:
    environment: "production"
    replicas: 1  # Should fail: production needs >= 2
    port: 8080
```

### Verification Commands

```bash
# Apply and check for validation errors
kubectl apply -f test-components.yaml

# Check component status for validation failures
kubectl get components -o wide

# View detailed error messages
kubectl describe component test-invalid-prod
```

## Related Resources

- [Templating Syntax](./templating-syntax.md) - CEL expressions and context variables
- [Schema Syntax](./schema-syntax.md) - Parameter validation and constraints
- [Overview](./overview.md) - ComponentTypes and Traits fundamentals
- [Context Variables](../../reference/cel/context-variables.md) - Complete context reference
- [ComponentType API](../../reference/api/platform/componenttype.md) - Full API specification
- [Trait API](../../reference/api/platform/trait.md) - Full API specification
