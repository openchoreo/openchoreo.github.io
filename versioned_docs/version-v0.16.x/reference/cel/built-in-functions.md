---
title: Built-in Functions
description: OpenChoreo CEL built-in functions for templates
---

# Built-in Functions

OpenChoreo provides several built-in CEL functions for common operations in ComponentType and Trait templates.

## oc_omit()

Removes fields from output. Has two distinct behaviors depending on usage context.

### Field-level Omission

When used as a standalone value, removes the entire YAML key from the template:

```yaml
resources:
  limits:
    memory: ${parameters.memoryLimit}
    cpu: ${has(parameters.cpuLimit) ? parameters.cpuLimit : oc_omit()}
    # When cpuLimit is missing, the entire 'cpu:' line is removed

metadata:
  name: ${metadata.name}
  annotations: ${has(parameters.annotations) ? parameters.annotations : oc_omit()}
  # When annotations is missing, the entire 'annotations:' key is removed
```

### Expression-level Omission

When used inside a CEL map expression, removes the key from the map:

```yaml
# Use CEL's optional key syntax for simple optional fields
container: |
  ${{
    "image": parameters.image,
    ?"cpu": parameters.?cpu,
    ?"memory": parameters.?memory
  }}
  # Keys are only included if the value exists

# Use oc_omit() when conditional logic is involved
container: |
  ${{
    "image": parameters.image,
    "cpu": parameters.cpuLimit > 0 ? parameters.cpuLimit : oc_omit(),
    "debug": parameters.environment == "dev" ? true : oc_omit()
  }}
  # Keys are conditionally included based on logic, not just existence
```

## oc_merge(base, override, ...)

Shallow merge two or more maps. Later maps override earlier ones for conflicting keys.

**Parameters:**
- `base` - Base map
- `override` - Map to merge (overrides base)
- `...` - Additional maps (optional)

**Returns:** Merged map

```yaml
# Merge default and custom labels
labels: |
  ${oc_merge({"app": metadata.name, "version": "v1"}, parameters.customLabels)}

# Merge multiple maps (later maps take precedence)
config: ${oc_merge(defaults, layer1, layer2, layer3)}

# Common pattern: merge platform labels with user labels
metadata:
  labels: ${oc_merge(metadata.labels, parameters.customLabels)}
```

## oc_generate_name(...args)

Generate valid Kubernetes resource names with a hash suffix for uniqueness. Converts input to lowercase, replaces invalid characters with hyphens, and appends an 8-character hash.

**Parameters:**
- `...args` - One or more strings to combine into a name

**Returns:** Kubernetes-compliant name string (lowercase, alphanumeric, hyphens, max 63 chars)

```yaml
# Create ConfigMap name with hash
name: ${oc_generate_name(metadata.name, "config", parameters.environment)}
# Result: "myapp-config-prod-a1b2c3d4"

# Handle special characters automatically
name: ${oc_generate_name("My_App", "Service!")}
# Result: "my-app-service-e5f6g7h8"

# Single argument also gets hash
name: ${oc_generate_name("Hello World!")}
# Result: "hello-world-7f83b165"
```

**Notes:**
- The hash is deterministic: same inputs always produce the same output
- Useful for generating unique names for resources created in `forEach` loops
- Ensures names comply with Kubernetes naming requirements

## oc_hash(string)

Generate an 8-character FNV-32a hash from an input string. Useful for creating unique identifiers or suffixes.

**Parameters:**
- `string` - Input string to hash

**Returns:** 8-character hexadecimal hash string

```yaml
# Generate hash for volume name uniqueness
volumeName: main-file-mount-${oc_hash(config.mountPath + "/" + config.name)}

# Use in resource naming
suffix: ${oc_hash(parameters.uniqueKey)}
```

**Notes:**
- Hash is deterministic: same input always produces the same output
- Used internally by `oc_generate_name()` to create the hash suffix

## Usage Examples

### Complete ComponentType Example

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentType
metadata:
  name: web-service
spec:
  workloadType: deployment

  schema:
    parameters:
      port: "integer | default=8080"
      customLabels: "map<string> | default={}"
      cpuLimit: "string"

  resources:
    - id: deployment
      template:
        apiVersion: apps/v1
        kind: Deployment
        metadata:
          name: ${metadata.name}
          # Merge platform labels with custom labels
          labels: ${oc_merge(metadata.labels, parameters.customLabels)}
        spec:
          template:
            spec:
              containers:
                - name: app
                  image: ${workload.container.image}
                  resources:
                    limits:
                      # Only include cpu if specified
                      cpu: ${has(parameters.cpuLimit) ? parameters.cpuLimit : oc_omit()}

    # Generate ConfigMaps with unique names
    - id: configs
      forEach: ${parameters.configFiles}
      var: config
      template:
        apiVersion: v1
        kind: ConfigMap
        metadata:
          name: ${oc_generate_name(metadata.name, config.name)}
```

## Related Resources

- [Context Variables](./context-variables.md) - Variables available in templates
- [Configuration Helpers](./configuration-helpers.md) - Helper functions for configurations
- [Templating Syntax](../../user-guide/component-types/templating-syntax.md) - Expression syntax and resource control
