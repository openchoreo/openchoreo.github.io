---
title: Templating Syntax
description: CEL expression syntax for dynamic resource generation in ComponentTypes and Traits
---

# Templating Syntax

This guide covers the OpenChoreo templating system for dynamic resource generation in ComponentTypes and Traits.

## Overview

OpenChoreo's templating system enables dynamic configuration through expressions embedded in YAML/JSON structures. Expressions are enclosed in `${}` and evaluated using [CEL (Common Expression Language)](https://github.com/google/cel-spec).

CEL expressions can be used in:

- **Resource templates** (`template:` in ComponentType `resources[]` or Trait `creates[]`) - complete Kubernetes resources with embedded expressions
- **Patch values** (`value:` in Trait `patches[]`) - primitives, objects, or nested structures
- **Resource control fields** (`includeWhen`, `forEach`) - entire field value is a CEL expression

```yaml
resources:
  - id: deployment
    includeWhen: ${parameters.enabled}    # Resource control - entire CEL expression
    forEach: ${parameters.instances}      # Resource control - entire CEL expression
    template:                             # Resource template
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: ${metadata.name}            # Embedded expression
      spec:
        replicas: ${parameters.replicas}

patches:
  - target:
      kind: Deployment
    operations:
      - op: add
        path: /metadata/labels/app
        value: ${metadata.name}           # Patch value - primitive
      - op: add
        path: /spec/template/spec/volumes/-
        value:                            # Patch value - object
          name: ${parameters.volumeName}
          emptyDir: {}
```

**Key components:**
- **Template Syntax**: Where expressions can be used and how to control resource generation
- **CEL Expression Language**: What you can write inside `${}`
- **[Built-in Functions](../../reference/cel/built-in-functions.md)**: OpenChoreo-provided functions like `oc_omit()`, `oc_merge()`, and `oc_generate_name()`
- **[Context Variables](../../reference/cel/context-variables.md)**: Variables providing access to metadata, parameters, workload, and configurations

## Template Syntax

This section covers where expressions can be used and how to control resource generation.

### Expression Formats

Expressions can appear in three formats within templates:

#### Standalone Value

When an expression is the entire value, it preserves the original data type.

```yaml
# Returns an integer
replicas: ${parameters.replicas}

# Returns a map
labels: ${metadata.labels}

# Returns a boolean
enabled: ${has(parameters.feature) ? parameters.feature : false}

# Returns a list
volumes: ${parameters.volumes}

# Complex expression with block scalar (avoids quoting issues)
nodeSelector: |
  ${parameters.highPerformance ? {"node-type": "compute"} : {"node-type": "standard"}}
```

#### String Interpolation

When an expression is embedded within a string, it is converted to a string and interpolated.

```yaml
# Multiple expressions in a string
message: "Application ${metadata.name} has ${parameters.replicas} replicas"

# URL construction
url: "https://${metadata.name}.${metadata.namespace}.svc.cluster.local:${parameters.port}"

# Image tag
image: "${parameters.registry}/${parameters.repository}:${parameters.tag}"
```

#### Dynamic Map Keys

Map keys can be dynamically generated (must evaluate to strings).

```yaml
# Dynamic labels based on component name
labels:
  ${metadata.name}: active
  ${metadata.name + "-metrics"}: enabled

# Dynamic labels with parameters
labels:
  ${'app.kubernetes.io/' + metadata.name}: active
  ${parameters.labelPrefix + '/version'}: ${parameters.version}
```

### Resource Control Fields

These fields control resource generation in ComponentTypes and Traits. They use CEL expressions to determine which resources to generate.

#### includeWhen

Controls whether a resource is included based on a CEL expression:

```yaml
resources:
  # Only create HPA if auto-scaling is enabled
  - id: hpa
    includeWhen: ${parameters.autoscaling.enabled}
    template:
      apiVersion: autoscaling/v2
      kind: HorizontalPodAutoscaler
      # ...

  # Create PDB only for production with multiple replicas
  - id: pdb
    includeWhen: ${parameters.environment == "production" && parameters.replicas > 1}
    template:
      apiVersion: policy/v1
      kind: PodDisruptionBudget
      # ...
```

#### forEach

Generates multiple resources from a list or map:

```yaml
resources:
  # Generate ConfigMaps for each database
  - id: db-config
    forEach: ${parameters.databases}
    var: db
    template:
      apiVersion: v1
      kind: ConfigMap
      metadata:
        name: ${oc_generate_name(metadata.name, db.name, "config")}
      data:
        host: ${db.host}
        port: ${string(db.port)}
```

**Iterating over maps** - Each item has `.key` and `.value` fields:

```yaml
resources:
  - id: config
    forEach: ${parameters.configFiles}
    var: config
    template:
      apiVersion: v1
      kind: ConfigMap
      metadata:
        name: ${oc_generate_name(metadata.name, config.key)}
      data:
        "${config.key}": ${config.value}
```

Map keys are iterated in **alphabetical order** for deterministic output.

#### Filtering Items in forEach

Use `.filter()` within the forEach expression:

```yaml
resources:
  # Generate secrets only for enabled integrations
  - id: secrets
    forEach: ${parameters.integrations.filter(i, i.enabled && has(i.credentials))}
    var: integration
    template:
      apiVersion: v1
      kind: Secret
      metadata:
        name: ${oc_generate_name(metadata.name, integration.name, "secret")}
      stringData:
        api_key: ${integration.credentials.apiKey}
```

#### Combining forEach with includeWhen

`includeWhen` is evaluated **before** the forEach loop and controls the **entire block**. The loop variable is **not available** in `includeWhen`:

```yaml
resources:
  # CORRECT - includeWhen controls entire forEach block
  - includeWhen: ${parameters.createSecrets}
    forEach: ${parameters.integrations}
    var: integration
    template:
      # ...

  # WRONG - loop variable not available in includeWhen
  - includeWhen: ${integration.enabled}  # ERROR: 'integration' doesn't exist yet
    forEach: ${parameters.integrations}
    var: integration

  # CORRECT - use filter() for item-level filtering
  - forEach: ${parameters.integrations.filter(i, i.enabled)}
    var: integration
    template:
      # ...
```

## CEL Expression Language

This section documents what you can write inside `${}` expressions. These are standard CEL and cel-go extension capabilities, documented here for convenience.

### Map Access

Both dot notation and bracket notation work for accessing map fields:

```yaml
# Equivalent for static keys:
${parameters.replicas}
${parameters["replicas"]}
```

**Bracket notation is required for:**
- Dynamic keys: `${parameters.labels[parameters.labelKey]}`
- Keys with special characters: `${resource.metadata.labels["app.kubernetes.io/name"]}`
- Optional access: `${resource.metadata.labels[?"app.kubernetes.io/name"].orValue("")}`

### Conditional Logic

```yaml
# Ternary operator with default
serviceType: ${has(parameters.serviceType) ? parameters.serviceType : "ClusterIP"}

# Minimum value check
replicas: ${parameters.replicas > 0 ? parameters.replicas : 1}

# Multi-condition logic
nodeSelector: |
  ${parameters.highPerformance ?
    {"node-type": "compute-optimized"} :
    (parameters.costOptimized ?
      {"node-type": "spot"} :
      {"node-type": "general-purpose"})}
```

### Safe Navigation

```yaml
# Optional chaining with ? for static keys
customValue: ${parameters.?custom.?value.orValue("default")}

# Optional access with safe navigation
containerConfig: ${configurations.?configs.?envs.orValue([])}

# Map with optional keys
config: |
  ${{"required": parameters.requiredConfig, ?"optional": parameters.?optionalConfig}}
```

### Array and List Operations

```yaml
# Transform list items
env: |
  ${parameters.envVars.map(e, {"name": e.key, "value": e.value})}

# Filter and transform
ports: |
  ${parameters.services.filter(s, s.enabled).map(s, {"port": s.port, "name": s.name})}

# List operations
firstItem: ${parameters.items[0]}
lastItem: ${parameters.items[size(parameters.items) - 1]}
joined: ${parameters.items.join(",")}

# Sorting
sortedStrings: ${parameters.names.sort()}
sortedByName: ${parameters.items.sortBy(item, item.name)}

# List concatenation
combined: ${parameters.list1 + parameters.list2}
withInlineItem: ${parameters.userPorts + [{"port": 8080, "name": "http"}]}

# Flatten nested lists
flattened: ${[[1, 2], [3, 4]].flatten()}  # returns [1, 2, 3, 4]

# Wrap the single workload container in a list
containerList: |
  ${[{"name": "main", "image": workload.container.image}]}
```

### Map Operations

```yaml
# Transform list to map with dynamic keys
envMap: |
  ${parameters.envVars.transformMapEntry(i, v, {v.name: v.value})}

# Map transformation (map to map)
labelMap: |
  ${parameters.labels.transformMap(k, v, {"app/" + k: v})}
```

### String Operations

```yaml
uppercaseName: ${metadata.name.upperAscii()}
trimmedValue: ${parameters.value.trim()}
replaced: ${parameters.text.replace("old", "new")}
prefixed: ${parameters.value.startsWith("prefix")}

# Split string into list
parts: ${parameters.path.split("/")}
limited: ${parameters.text.split(",", 2)}  # "a,b,c" → ["a", "b,c"]

# Extract substring
suffix: ${parameters.name.substring(4)}      # "hello-world" → "o-world"
middle: ${parameters.name.substring(0, 5)}   # "hello-world" → "hello"
```

### Math Operations

```yaml
maxValue: ${math.greatest([parameters.min, parameters.max, parameters.default])}
minValue: ${math.least([parameters.v1, parameters.v2, parameters.v3])}
rounded: ${math.ceil(parameters.floatValue)}
```

### Encoding Operations

```yaml
# Base64 encode (convert to bytes first)
encoded: ${base64.encode(bytes(parameters.value))}

# Base64 decode to string
decoded: ${string(base64.decode(parameters.encodedValue))}
```

### Built-in Functions

OpenChoreo provides built-in CEL functions for common operations:

- `oc_omit()` - Remove fields conditionally from output
- `oc_merge()` - Shallow merge maps
- `oc_generate_name()` - Generate Kubernetes-safe names with hash suffix
- `oc_hash()` - Generate hash from string

See the [Built-in Functions Reference](../../reference/cel/built-in-functions.md) for complete documentation and examples.

### Context Variables

Templates have access to context variables that provide component metadata, parameters, workload specifications, and platform configuration.

**ComponentType variables:** `metadata`, `parameters`, `envOverrides`, `workload`, `configurations`, `dataplane`

**Trait variables:** All ComponentType variables plus `trait.name` and `trait.instanceName`

See the [Context Variables Reference](../../reference/cel/context-variables.md) for complete documentation of all available fields.

## Related Resources

- [Schema Syntax](./schema-syntax.md) - Parameter validation and defaults
- [Patching Syntax](./patching-syntax.md) - JSON Patch operations for Traits
- [Context Variables](../../reference/cel/context-variables.md) - Variables available in templates
- [Built-in Functions](../../reference/cel/built-in-functions.md) - OpenChoreo CEL functions
- [Configuration Helpers](../../reference/cel/configuration-helpers.md) - Helper functions for configurations
