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

**Returns:** Kubernetes-compliant name string (lowercase, alphanumeric, hyphens, max 253 chars)

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
- To keep a name shorter than 253 characters, use [`oc_generate_name_limit`](#oc_generate_name_limitmaxlength-args)

## oc_dns_label(...args)

Generate an RFC 1123-compliant DNS label name (≤63 characters) with a hash suffix, suitable for use as hostname subdomains in HTTPRoutes. Combines input strings with hyphens, lowercases them, replaces invalid characters, and appends an 8-character hash.

**Parameters:**

- `...args` - One or more strings to combine into a DNS label

**Returns:** RFC 1123-compliant DNS label string (≤63 chars, lowercase alphanumeric and hyphens)

```yaml
# Build a hostname subdomain from endpoint and component identity
hostnames: |
  ${[gateway.ingress.external.?http, gateway.ingress.external.?https]
    .filter(g, g.hasValue()).map(g, g.value().host).distinct()
    .map(h, oc_dns_label(endpoint, metadata.componentName, metadata.environmentName, metadata.componentNamespace) + "." + h)}

# Result: "api-my-service-dev-default-a1b2c3d4.apps.example.com"
```

**Notes:**

- The hash is deterministic: same inputs always produce the same output
- Designed for subdomain generation where the combined string may exceed 63 characters
- Differs from `oc_generate_name` in that it is optimized for DNS subdomain labels rather than Kubernetes resource names

## oc_generate_name_limit(maxLength, ...args)

Generate a valid Kubernetes resource name that fits within a length you choose. Works like `oc_generate_name`, but truncates to `maxLength` characters instead of 253. Use it for resources with a tighter name limit, such as a CronJob, whose name can be at most 52 characters.

**Parameters:**

- `maxLength` - Maximum length of the generated name, as an integer
- `...args` - One or more strings to combine into a name, or a single list of strings

**Returns:** Kubernetes-compliant name string of at most `maxLength` characters, ending in an 8-character hash

```yaml
# Keep a CronJob name within the 52-character limit
# (componentName "order-processing-service", environmentName "production")
apiVersion: batch/v1
kind: CronJob
metadata:
  name: ${oc_generate_name_limit(52, metadata.componentName, metadata.environmentName, "nightly-report-generator")}
# Result: "order-processi-production-nightly-repor-f4261c0b" (48 chars)
# oc_generate_name with the same arguments returns 69 chars, too long for a CronJob

# Pass the parts as a list
name: ${oc_generate_name_limit(30, ["payment-service", "prod", "cache"])}
# Result: "payment-prod-cache-111dc7db"

# Read the limit from a parameter, wrapped in int()
# (parameters.nameLimit 30, componentName "order-processing-service")
name: ${oc_generate_name_limit(int(parameters.nameLimit), metadata.componentName, "worker")}
# Result: "order-proc-worker-02a2e8f4"
```

**Notes:**

- The hash is deterministic: same inputs always produce the same output
- The hash is computed from the full input before truncation, so names that share a truncated prefix still differ
- `maxLength` must be between `8 + 2 × (number of parts)` and 253, which leaves room for one character and one hyphen per part plus the hash (at least 10 for one part, 14 for three)
- A `maxLength` outside that range fails the render, and the error appears in the ReleaseBinding status
- Numbers set in a Component's `parameters` reach CEL as floating-point values even when the schema declares `type: integer`, so wrap them in `int()` (passing them directly fails the render with a `no such overload` error)
- `oc_generate_name_limit(253, ...)` returns the same name as `oc_generate_name(...)`, and `oc_generate_name_limit(63, ...)` returns the same name as `oc_dns_label(...)`

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
- Uses a different algorithm from the hash suffix that `oc_generate_name()` appends, so the two values do not match

## Usage Examples

### Complete ComponentType Example

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentType
metadata:
  name: web-service
spec:
  workloadType: deployment

  parameters:
    openAPIV3Schema:
      type: object
      properties:
        port:
          type: integer
          default: 8080
        customLabels:
          type: object
          default: {}
          additionalProperties:
            type: string
        cpuLimit:
          type: string
        configFiles:
          type: array
          default: []
          items:
            type: object
            additionalProperties:
              type: string

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
- [Configuration Helpers](./helper-functions.md) - Helper functions for configurations
- [Templating Syntax](../../platform-engineer-guide/component-types/templating-syntax.md) - Expression syntax and resource control
