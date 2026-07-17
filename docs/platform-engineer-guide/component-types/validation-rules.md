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
- **Rendering context validation** - Check parameters against the workload, dataplane, and environment configuration resolved for the target environment
- **Rendered output invariants** - Assert that a guarantee still holds on the final rendered resources after all traits are applied
- **Custom error messages** - Provide clear, actionable feedback when validation fails

Validation rules use CEL expressions wrapped in `${}` that must evaluate to `true` for validation to pass.

Validations run in two stages. Both stages are available on ComponentTypes and Traits (and their Cluster-scoped variants):

|                       | [Pre-render](#pre-render-validations) (`preRenderValidations`)              | [Post-render](#post-render-validations) (`postRenderValidations`)         |
| --------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Runs                  | Before rendering                                                              | After all traits are applied                                                 |
| Evaluates against     | Static configuration (`parameters`, `environmentConfigs`, `workload`, ...)   | The final rendered Kubernetes resources                                      |
| Rule shape            | `rule` + `message`                                                            | `target` selection + `rule` + `message`, with optional `when` / `forEach`    |
| `${...}` in `message` | Interpolated                                                                  | Not interpolated (shown literally)                                           |
| Typical use           | "These parameters are consistent"                                             | "No trait undid my guarantee"                                                |

:::warning ComponentTypes and Traits are environment-agnostic
A ComponentType or Trait is a reusable definition applied across **every** environment, so validation rules must never hard-code environment names (`"production"`, `"staging"`, ...) — the same definition has to work regardless of how a platform names its environments. To vary behavior per environment, expose the varying value or toggle in `environmentConfigs` and let the platform set it per environment via the `ReleaseBinding`. Write rules that check **relationships and overrides**, not environment-name string comparisons.
:::

## Context Variables in Validations

Validation rules have access to different context variables depending on scope:

### ComponentType Context

- `metadata` - Component metadata (`componentName`, `componentNamespace`, `environmentName`, labels, etc.). The environment name is present, but don't branch on it — see the warning above
- `parameters` - Component parameters with schema defaults applied
- `environmentConfigs` - Environment-specific parameter overrides (from the `ReleaseBinding`)
- `workload` - Workload specification (container, endpoints, workloadType)
- `configurations` - Configuration and secret references
- `dataplane` - DataPlane configuration (secretStore, gateway, etc.)
- `gateway` - Ingress gateway resolved for the environment (`gateway.ingress.external` / `internal`)
- `environment` - Environment-specific configuration (gateway overrides, `defaultNotificationChannel`)
- `dependencies` - Resolved endpoint connections and resource dependencies

### Trait Context

All ComponentType variables plus:

- `trait.name` - Name of the trait type
- `trait.instanceName` - Unique instance name for this trait within the component

### Post-render Context

Post-render rules evaluate with the declaring resource's own context (the same variables listed above), plus:

- `resource` - The rendered Kubernetes resource matched by the validation's `target` (bound per match, available in `target.where` and `rule`)

## Pre-render Validations

Pre-render rules (`spec.preRenderValidations`) run against static configuration after schema defaults are applied, before any resource is rendered.

### Rule Format

Each pre-render validation rule consists of two required fields:

```yaml
preRenderValidations:
  - rule: ${parameters.replicas >= 1}
    message: "replicas must be at least 1"
  - rule: ${parameters.port > 0 && parameters.port <= 65535}
    message: "port must be between 1 and 65535"
```

| Field     | Type   | Required | Description                                                   |
| --------- | ------ | -------- | ------------------------------------------------------------- |
| `rule`    | string | Yes      | CEL expression wrapped in `${...}` that must evaluate to true |
| `message` | string | Yes      | Error message shown when the rule evaluates to false          |

:::note `validations` is deprecated
`spec.validations` is a deprecated alias for `spec.preRenderValidations` with identical shape and semantics. Set only one of the two — specifying both on the same resource is rejected at admission time.
:::

### ComponentType Examples

#### Cross-field parameter validation

Use validation rules for cross-field relationships that a schema alone can't express. This `web-service` type exposes an `autoscaling` range as parameters and checks that the range is internally consistent:

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
          minimum: 1
          maximum: 65535
        autoscaling:
          type: object
          # default: {} makes the nested defaults apply even when the
          # developer omits autoscaling entirely, so rules can read the
          # fields without has() guards
          default: {}
          properties:
            enabled:
              type: boolean
              default: false
            minReplicas:
              type: integer
              default: 1
              minimum: 1
            maxReplicas:
              type: integer
              default: 5
              minimum: 1
  environmentConfigs:
    openAPIV3Schema:
      type: object
      properties:
        autoscaling:
          type: object
          # An environment that overrides the range must set both bounds
          required: [minReplicas, maxReplicas]
          properties:
            minReplicas:
              type: integer
              minimum: 1
            maxReplicas:
              type: integer
              minimum: 1

  preRenderValidations:
    # Cross-field parameter check: the autoscaling range must be internally consistent
    - rule: ${!parameters.autoscaling.enabled || parameters.autoscaling.maxReplicas >= parameters.autoscaling.minReplicas}
      message: "autoscaling.maxReplicas (${parameters.autoscaling.maxReplicas}) must be >= autoscaling.minReplicas (${parameters.autoscaling.minReplicas})"
```

#### Validating environment overrides

To vary behavior per environment, validate the per-environment overrides in `environmentConfigs` — the platform sets these through the `ReleaseBinding`, so the same rule works no matter what an environment is named. A `has()` guard keeps the rule safe in environments that don't override the value; the schema above requires both bounds whenever the override is present, so one guard is enough:

```yaml
preRenderValidations:
  # The per-environment autoscaling override (when set) must stay internally consistent.
  # Guarded with has() because not every environment overrides the range.
  - rule: ${!has(environmentConfigs.autoscaling) || environmentConfigs.autoscaling.maxReplicas >= environmentConfigs.autoscaling.minReplicas}
    message: "this environment's autoscaling override must keep maxReplicas >= minReplicas"
```

#### Workload-based validation

These rules constrain the workload and relate endpoint visibility to the ingress resolved for the environment via the `gateway` context — never to an environment name:

```yaml
preRenderValidations:
  # A service must expose at least one endpoint
  - rule: ${size(workload.endpoints) > 0}
    message: "Service components must have at least one endpoint. Use 'deployment/worker' for components without endpoints."

  # Restrict the allowed endpoint types
  - rule: ${workload.endpoints.all(name, ep, ep.type == "HTTP")}
    message: "This component only supports endpoints of type HTTP."

  # Endpoints exposed externally need an external ingress on the Environment or DataPlane.
  # gateway is resolved per environment, so this holds for every environment.
  - rule: >-
      ${workload.endpoints.exists(name, ep, "external" in ep.visibility)
        ? has(gateway.ingress) && has(gateway.ingress.external)
        : true}
    message: "Endpoints with 'external' visibility require gateway.ingress.external to be configured on the Environment or DataPlane."
```

### Trait Examples

#### Parameter validation

Prefer the schema for shape constraints — required fields, lengths, patterns, enums all belong there. Use rules for what the schema can't express:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Trait
metadata:
  name: persistent-volume
spec:
  parameters:
    openAPIV3Schema:
      type: object
      required: [volumeName, mountPath]
      properties:
        volumeName:
          type: string
          maxLength: 63
        mountPath:
          type: string
          pattern: "^/"
        accessMode:
          type: string
          enum: [ReadWriteOnce, ReadOnlyMany, ReadWriteMany]
          default: ReadWriteOnce

  preRenderValidations:
    # A blacklist the schema can't express: block mounts over system temp directories,
    # including anything nested beneath them (/tmp/cache, /var/tmp/build/out, ...)
    - rule: ${!["/tmp", "/var/tmp"].exists(d, parameters.mountPath == d || parameters.mountPath.startsWith(d + "/"))}
      message: "Cannot mount volumes to system temp directories /tmp or /var/tmp"
```

#### Workload-aware validation

```yaml
preRenderValidations:
  # Validate access modes for different workload types
  - rule: ${parameters.accessMode == "ReadWriteOnce" || workload.workloadType == "statefulset"}
    message: "ReadWriteMany and ReadOnlyMany access modes are only supported for StatefulSet workloads"

  # Ensure container exists for volume mounts
  - rule: ${!has(parameters.containerName) || has(workload.container)}
    message: "Cannot mount volume: no container found in workload"

  # Validate trait instance naming
  - rule: ${trait.instanceName.matches("^[a-z]([a-z0-9-]*[a-z0-9])?$")}
    message: "Trait instanceName must be lowercase DNS-compliant: start/end with alphanumeric, contain only lowercase letters, numbers, and hyphens"
```

### Common Patterns

#### Context-aware checks

```yaml
preRenderValidations:
  # Access component metadata
  - rule: ${size(metadata.componentName) <= 63}
    message: "Component name must be 63 characters or less for DNS compatibility"

  # Check dataplane capabilities
  - rule: ${!parameters.externalAccess || has(dataplane.publicVirtualHost)}
    message: "External access requires publicVirtualHost configuration in the dataplane"

  # Validate against workload container
  - rule: ${!has(parameters.containerPort) || parameters.containerPort == workload.container.port}
    message: "Container port parameter must match workload container configuration"
```

#### List and map validation

```yaml
preRenderValidations:
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

#### Conditional validation

```yaml
preRenderValidations:
  # Conditional requirements based on features.
  # ssl is an optional object, so guard it with has() before reading enabled —
  # an object without `default: {}` in the schema is absent, not empty.
  - rule: ${!has(parameters.ssl) || !parameters.ssl.enabled || (has(parameters.ssl.certSecret) && has(parameters.ssl.keySecret))}
    message: "SSL enabled requires both certificate and key secrets"

  # Conditional requirement driven by a component parameter (author intent), not an environment name
  - rule: ${!parameters.highAvailability || (parameters.replicas >= 2 && has(environmentConfigs.resources) && has(environmentConfigs.resources.limits))}
    message: "highAvailability requires >=2 replicas and resource limits"

  # Mutually exclusive options
  - rule: ${[has(parameters.basicAuth), has(parameters.oauth)].filter(x, x).size() <= 1}
    message: "Cannot enable both basicAuth and oauth authentication"
```

## Post-render Validations

Pre-render rules see only static configuration — they cannot check what the rendering pipeline actually produced. Traits stack: each one can create, patch, or remove resources, so a guarantee established by the ComponentType or an earlier trait can be silently undone by a later one. `postRenderValidations` close this gap. They are CEL rules evaluated **after all traits are applied**, against the final rendered Kubernetes resources.

Post-render rules see the rendered manifests exactly as the traits produced them: no Kubernetes server-side defaulting or admission mutation has been applied, and OpenChoreo's own labels and owner references are not yet injected. A field the cluster would default (like `spec.replicas`) may simply be absent — guard reads with `has()`.

Each entry selects rendered resources by GVK (plus an optional `where` filter), binds each match to the `resource` variable, and requires `rule` to evaluate to `true`:

| Field                                    | Required | Description                                                                                                        |
| ---------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| `when`                                   | No       | CEL guard evaluated against the trait/component context; if it evaluates to `false`, the validation is skipped      |
| `forEach` / `var`                        | No       | Repeats the validation per item of a CEL-evaluated list; `var` names the loop variable (in scope for `target.where` and `rule`) |
| `target.group` / `.version` / `.kind`    | Yes      | GVK of the rendered resources to select                                                                             |
| `target.where`                           | No       | CEL filter over the selected resources, with `resource` bound                                                        |
| `target.mustMatch`                       | No       | Defaults to `true`: when no rendered resource matches the target, the validation fails                              |
| `targetPlane`                            | No       | `dataplane` (default) or `observabilityplane`                                                                        |
| `rule`                                   | Yes      | CEL expression wrapped in `${...}`, evaluated with `resource` bound to each match; must evaluate to `true`          |
| `message`                                | Yes      | Error message shown when the rule fails (a literal string — `${...}` interpolation is not applied)                  |

A storage trait shows why this stage exists. With `accessMode: ReadWriteOnce`, the volume can only be attached to a single node, so the platform team's policy is to pin such workloads to a single replica. The trait can't enforce that on its own configuration: it neither renders nor patches `replicas` — the final value is the cumulative result of the ComponentType template and every other trait in the stack. Only the final rendered Deployment can answer whether the policy holds:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Trait
metadata:
  name: single-writer-pvc
spec:
  parameters:
    openAPIV3Schema:
      type: object
      properties:
        accessMode:
          type: string
          enum: [ReadWriteOnce, ReadWriteMany]
          default: ReadWriteOnce

  postRenderValidations:
    - when: ${parameters.accessMode == 'ReadWriteOnce'}
      target:
        group: apps
        version: v1
        kind: Deployment
      # replicas may be absent from the rendered manifest, in which case
      # Kubernetes defaults it to 1 — so absence passes
      rule: ${!has(resource.spec.replicas) || resource.spec.replicas <= 1}
      message: "ReadWriteOnce volume requires a single replica for exclusive write access"
```

If an HA trait anywhere in the stack patched `replicas: 3`, this rule sees the final value and fails the release with the message above — nothing from this release is deployed.

`mustMatch` defaults to `true`, so a target that matches zero rendered resources fails the validation. This catches the case where a later trait removed the resource entirely; set `mustMatch: false` only when the target is genuinely optional.

ComponentTypes support `postRenderValidations` with the same field shape and semantics. The only difference is that `when`, `forEach`, and `rule` bind the component context (`parameters`, `environmentConfigs`, ...) instead of a trait's. A ComponentType author can use this to assert that invariants it rendered — a hardened `securityContext`, resource limits — survived the whole trait stack.

## Validation Execution and Error Handling

### Execution Order

1. **Schema validation** - Type checking and constraint validation happens first
2. **Default application** - Schema defaults are applied to parameters and environmentConfigs
3. **Pre-render rule evaluation** - `preRenderValidations` (or the deprecated `validations`) are evaluated against the static context: the ComponentType's rules first, then each trait's rules just before that trait is applied
4. **Rendering** - Base resources are rendered from the ComponentType templates, then each trait's creates, patches, and removes are applied in order
5. **Post-render rule evaluation** - `postRenderValidations` from the ComponentType and every trait are evaluated against the final rendered resources, and failures from all of them are aggregated

A failure at any stage stops the pipeline — later stages don't run — and the release is not deployed. Failures within the same rule list are collected and reported together rather than stopping at the first.

### Error Message Format

When validation fails, OpenChoreo provides structured error messages:

```
rule[0] "${parameters.replicas >= 1}" evaluated to false: replicas must be at least 1
```

Multiple failures are joined with `; `:

```
rule[0] "${parameters.replicas >= 1}" evaluated to false: replicas must be at least 1; rule[1] "${parameters.port > 0}" evaluated to false: port must be greater than 0
```

Post-render failures are aggregated the same way, across all matched resources and every declaring ComponentType and trait. Unlike pre-render messages, `${...}` inside a post-render `message` is **not** interpolated — it is shown literally. When a `forEach` iteration fails, the aggregated error already identifies the failing item, so you don't need to embed it in the message.

### Best Practices for Error Messages

Interpolating context values into `message` (as below) works for **pre-render** rules only:

```yaml
preRenderValidations:
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

### Testing pre-render rules across environments

Validation rules that read `environmentConfigs` run at render time, once the per-environment overrides from the `ReleaseBinding` are applied — not on the bare `Component`. So the same Component can pass in one environment and fail in another. Define one Component, then bind it to environments whose `autoscaling` overrides differ:

```yaml
# The component is static and identical across every environment
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: test-web-service
spec:
  componentType:
    kind: ComponentType
    name: deployment/web-service
  parameters:
    port: 8080
    autoscaling:
      enabled: true
      minReplicas: 2
      maxReplicas: 5
```

The environment-specific autoscaling range comes from the `ReleaseBinding`, not the Component:

```yaml
# Development: no override, so the override-consistency rule passes vacuously
apiVersion: openchoreo.dev/v1alpha1
kind: ReleaseBinding
metadata:
  name: test-web-service-development
spec:
  owner:
    projectName: default
    componentName: test-web-service
  environment: development
  releaseName: test-web-service-v1
  # componentTypeEnvironmentConfigs omitted -> has(environmentConfigs.autoscaling) is false, rule passes

---
# Staging: overrides the range inconsistently (maxReplicas < minReplicas), so this environment FAILS
apiVersion: openchoreo.dev/v1alpha1
kind: ReleaseBinding
metadata:
  name: test-web-service-staging
spec:
  owner:
    projectName: default
    componentName: test-web-service
  environment: staging
  releaseName: test-web-service-v1
  componentTypeEnvironmentConfigs:
    autoscaling:
      minReplicas: 8
      maxReplicas: 4 # maxReplicas < minReplicas -> validation fails for this environment
```

Validation is driven entirely by the target environment's overrides — no environment name is baked into the ComponentType or the Component.

### Testing post-render rules

Post-render rules are exercised by attaching a trait that breaks the invariant. With the `single-writer-pvc` trait from [Post-render Validations](#post-render-validations) attached, adding an HA trait that patches the replica count makes the rule fail against the final rendered Deployment — regardless of the order the traits appear in:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: test-single-writer
spec:
  componentType:
    kind: ComponentType
    name: deployment/web-service
  parameters:
    port: 8080
  traits:
    - kind: Trait
      name: single-writer-pvc
      instanceName: data-volume
      # accessMode defaults to ReadWriteOnce -> the post-render rule is active
    - kind: Trait
      name: high-availability
      instanceName: ha
      parameters:
        replicas: 3 # patches the Deployment -> final replicas is 3, rule fails
```

The failure surfaces only once the component is bound to an environment, because rendering happens per environment. Unlike the pre-render case above, no override is needed to trigger it — the conflict is between the two traits, so every environment fails identically:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ReleaseBinding
metadata:
  name: test-single-writer-development
spec:
  owner:
    projectName: default
    componentName: test-single-writer
  environment: development
  releaseName: test-single-writer-v1
  # No componentTypeEnvironmentConfigs needed: the autoscaling override is optional,
  # and the post-render failure comes from the trait stack, not from an override
```

The `ReleaseBinding` status reports the post-render failure and nothing from the release is deployed.

### Verification Commands

```bash
# Apply the pre-render example (component + per-environment bindings)
kubectl apply -f test-web-service.yaml

# Apply the post-render example (component with conflicting traits + its binding)
kubectl apply -f test-single-writer.yaml

# Check binding status for validation failures
kubectl get releasebindings -o wide

# View detailed error messages for the failing pre-render environment
kubectl describe releasebinding test-web-service-staging

# View the post-render failure (the single-replica rule broken by the HA trait)
kubectl describe releasebinding test-single-writer-development
```

## Related Resources

- [Templating Syntax](./templating-syntax.md) - CEL expressions and context variables
- [Schema Syntax](./schema-syntax.md) - Parameter validation and constraints
- [Overview](./overview.md) - ComponentTypes and Traits fundamentals
- [Context Variables](../../reference/cel/context-variables.md) - Complete context reference
- [ComponentType API](../../reference/api/platform/componenttype.md) - Full API specification
- [Trait API](../../reference/api/platform/trait.md) - Full API specification
