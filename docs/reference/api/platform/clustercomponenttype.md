---
title: ClusterComponentType API Reference
---

# ClusterComponentType

A ClusterComponentType is a cluster-scoped variant of [ComponentType](./componenttype.md) that defines reusable
deployment templates available across all namespaces. This enables platform engineers to define shared component types
once and reference them from Components in any namespace, eliminating duplication.

ClusterComponentTypes share the same spec structure as ComponentTypes with one key constraint: because
ClusterComponentTypes are cluster-scoped, they can only reference **ClusterTraits** (not namespace-scoped Traits)
in their `traits` and `allowedTraits` fields.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ClusterComponentTypes are cluster-scoped resources (no namespace).

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterComponentType
metadata:
  name: <clustercomponenttype-name>
```

:::note
ClusterComponentType manifests must **not** include `metadata.namespace`. If you are copying from a namespace-scoped
ComponentType example, remove the `namespace` field.
:::

**Short names:** `cct`, `ccts`

### Spec Fields

| Field              | Type                                                    | Required | Default | Description                                                                         |
|--------------------|---------------------------------------------------------|----------|---------|-------------------------------------------------------------------------------------|
| `workloadType`     | string                                                  | Yes      | -       | Primary workload type: `deployment`, `statefulset`, `cronjob`, `job`, `proxy`       |
| `allowedWorkflows` | []string                                                | No       | []      | Names of ComponentWorkflow CRs developers can use for building this component type  |
| `schema`           | [ComponentTypeSchema](#componenttypeschema)              | No       | -       | Configurable parameters for components of this type                                 |
| `traits`           | [[ClusterComponentTypeTrait](#clustercomponenttypetrait)]| No       | []      | Pre-configured ClusterTrait instances automatically applied to all Components of this type |
| `allowedTraits`    | [[ClusterTraitRef](#clustertraitref)]                   | No       | []      | ClusterTraits that developers can attach to components of this type                 |
| `validations`      | [[ValidationRule](#validationrule)]                     | No       | []      | CEL-based rules evaluated during rendering; all must pass for rendering to proceed  |
| `resources`        | [[ResourceTemplate](#resourcetemplate)]                 | Yes      | -       | Templates for generating Kubernetes resources                                       |

:::note
The `workloadType` field is immutable after creation and determines the primary resource type for components of this
type. For non-proxy workload types, one resource template must have an `id` matching the `workloadType`.
:::

### ClusterComponentTypeTrait

Represents a pre-configured trait instance embedded in a ClusterComponentType. Only ClusterTrait references are
allowed since ClusterComponentType is cluster-scoped.

| Field          | Type   | Required | Default        | Description                                                            |
|----------------|--------|----------|----------------|------------------------------------------------------------------------|
| `kind`         | string | No       | `ClusterTrait` | Must be `ClusterTrait`                                                 |
| `name`         | string | Yes      | -              | Name of the ClusterTrait                                               |
| `instanceName` | string | Yes      | -              | Unique instance name within the component type                         |
| `parameters`   | object | No       | -              | Trait parameter values (can use CEL expressions referencing the ComponentType schema, e.g., `${parameters.storage.mountPath}`) |
| `envOverrides` | object | No       | -              | Environment-specific override values for the trait                     |

### ClusterTraitRef

Specifies a ClusterTrait that developers can attach to components of this type. Unlike the namespace-scoped
[TraitRef](./componenttype.md#traitref), only ClusterTrait references are allowed.

| Field  | Type   | Required | Default        | Description                |
|--------|--------|----------|----------------|----------------------------|
| `kind` | string | Yes      | `ClusterTrait` | Must be `ClusterTrait`     |
| `name` | string | Yes      | -              | Name of the ClusterTrait   |

### ComponentTypeSchema

Defines the configurable parameters that developers can set when creating components of this type.

| Field          | Type   | Required | Default | Description                                                            |
|----------------|--------|----------|---------|------------------------------------------------------------------------|
| `types`        | object | No       | -       | Reusable type definitions referenced in parameters                     |
| `parameters`   | object | No       | -       | Static parameters exposed to developers (same across all envs)         |
| `envOverrides` | object | No       | -       | Parameters that can be overridden per environment (must have defaults) |

#### Parameter Schema Syntax

Parameters use inline schema syntax with a single pipe after the type; constraints are space-separated:

```
fieldName: "type | default=value enum=val1,val2"
```

Supported types: `string`, `integer`, `boolean`, `array<type>`, custom type references

**Example:**

```yaml
schema:
    types:
      ResourceRequirements:
        requests: "ResourceQuantity | default={}"
        limits: "ResourceQuantity | default={}"
      ResourceQuantity:
        cpu: "string | default=100m"
        memory: "string | default=256Mi"

    parameters:
      replicas: "integer | default=1"
      imagePullPolicy: "string | default=IfNotPresent"
      port: "integer | default=80"
      exposed: "boolean | default=false"

    envOverrides:
      resources: "ResourceRequirements | default={}"
```

### ValidationRule

Defines a CEL-based validation rule evaluated during rendering. All rules must evaluate to true for rendering to
proceed.

| Field     | Type   | Required | Description                                              |
|-----------|--------|----------|----------------------------------------------------------|
| `rule`    | string | Yes      | CEL expression wrapped in `${...}` that must evaluate to true |
| `message` | string | Yes      | Error message shown when the rule evaluates to false     |

**Example:**

```yaml
validations:
  - rule: ${parameters.replicas >= 1}
    message: "replicas must be at least 1"
  - rule: ${parameters.port > 0 && parameters.port <= 65535}
    message: "port must be between 1 and 65535"
```

### ResourceTemplate

Defines a template for generating Kubernetes resources with CEL expressions for dynamic values.

| Field         | Type   | Required | Default     | Description                                                |
|---------------|--------|----------|-------------|------------------------------------------------------------|
| `id`          | string | Yes      | -           | Unique identifier (must match `workloadType` for primary)  |
| `targetPlane` | string | No       | `dataplane` | Target plane: `dataplane` or `observabilityplane`          |
| `includeWhen` | string | No       | -           | CEL expression determining if resource should be created   |
| `forEach`     | string | No       | -           | CEL expression for generating multiple resources from list |
| `var`         | string | No       | -           | Variable name for `forEach` iterations (required if `forEach` is set) |
| `template`    | object | Yes      | -           | Kubernetes resource template with CEL expressions          |

#### CEL Expression Syntax

Templates use CEL expressions enclosed in `${...}` that have access to context variables. Refer to the
[ComponentType CEL Expression Syntax](./componenttype.md#cel-expression-syntax) for the full list of available
context variables (`metadata`, `parameters`, `envOverrides`, `workload`, `configurations`, `dataplane`) and
[helper functions](./componenttype.md#helper-functions).

## Examples

### Basic Deployment ClusterComponentType

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterComponentType
metadata:
  name: service
spec:
  workloadType: deployment

  schema:
    parameters:
      replicas: "integer | default=1"
      port: "integer | default=80"

  resources:
    - id: deployment
      template:
        apiVersion: apps/v1
        kind: Deployment
        metadata:
          name: ${metadata.name}
          namespace: ${metadata.namespace}
        spec:
          replicas: ${parameters.replicas}
          selector:
            matchLabels: ${metadata.podSelectors}
          template:
            metadata:
              labels: ${metadata.podSelectors}
            spec:
              containers:
                - name: main
                  image: ${workload.container.image}
                  ports:
                    - containerPort: ${parameters.port}
```

### ClusterComponentType with Embedded Traits and Validations

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterComponentType
metadata:
  name: web-service
spec:
  workloadType: deployment

  schema:
    parameters:
      replicas: "integer | default=1 minimum=1"
      port: "integer | default=8080"
      exposed: "boolean | default=false"

    envOverrides:
      cpu: "string | default=100m"
      memory: "string | default=256Mi"

  validations:
    - rule: ${parameters.replicas >= 1}
      message: "replicas must be at least 1"

  # Pre-configured traits automatically applied to all components
  traits:
    - kind: ClusterTrait
      name: resource-limits
      instanceName: default-limits
      envOverrides:
        cpuLimit: "${envOverrides.cpu}"
        memoryLimit: "${envOverrides.memory}"

  # Additional traits developers can attach
  allowedTraits:
    - kind: ClusterTrait
      name: persistent-volume

  resources:
    - id: deployment
      template:
        apiVersion: apps/v1
        kind: Deployment
        metadata:
          name: ${metadata.name}
          namespace: ${metadata.namespace}
          labels: ${metadata.labels}
        spec:
          replicas: ${parameters.replicas}
          selector:
            matchLabels: ${metadata.podSelectors}
          template:
            metadata:
              labels: ${metadata.podSelectors}
            spec:
              containers:
                - name: main
                  image: ${workload.container.image}
                  ports:
                    - containerPort: ${parameters.port}

    - id: service
      template:
        apiVersion: v1
        kind: Service
        metadata:
          name: ${metadata.componentName}
          namespace: ${metadata.namespace}
        spec:
          selector: ${metadata.podSelectors}
          ports:
            - port: 80
              targetPort: ${parameters.port}

    - id: httproute
      includeWhen: ${parameters.exposed}
      template:
        apiVersion: gateway.networking.k8s.io/v1
        kind: HTTPRoute
        metadata:
          name: ${metadata.name}
          namespace: ${metadata.namespace}
        spec:
          hostnames:
            - ${metadata.name}-${metadata.environmentName}.${dataplane.publicVirtualHost}
          rules:
            - backendRefs:
                - name: ${metadata.componentName}
                  port: 80
```

### Scheduled Task ClusterComponentType

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterComponentType
metadata:
  name: scheduled-task
spec:
  workloadType: cronjob

  schema:
    parameters:
      schedule: "string"
      concurrencyPolicy: "string | default=Forbid | enum=Allow,Forbid,Replace"

  resources:
    - id: cronjob
      template:
        apiVersion: batch/v1
        kind: CronJob
        metadata:
          name: ${metadata.name}
          namespace: ${metadata.namespace}
        spec:
          schedule: ${parameters.schedule}
          concurrencyPolicy: ${parameters.concurrencyPolicy}
          jobTemplate:
            spec:
              template:
                spec:
                  containers:
                    - name: main
                      image: ${workload.container.image}
                  restartPolicy: OnFailure
```

## Usage

Components reference a ClusterComponentType using `spec.componentType` with `kind: ClusterComponentType`:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: my-service
  namespace: default
spec:
  componentType:
    kind: ClusterComponentType
    name: deployment/service  # format: workloadType/name
  parameters:
    replicas: 3
    port: 8080
```

## Best Practices

1. **Use for shared patterns**: Define ClusterComponentTypes for deployment patterns used across multiple namespaces; use namespace-scoped ComponentTypes for namespace-specific patterns
2. **Naming convention**: Use descriptive names like `service`, `web-application`, `scheduled-task`
3. **Trait restrictions**: Remember that ClusterComponentTypes can only reference ClusterTraits, not namespace-scoped Traits
4. **Parameter design**: Keep parameters focused and provide sensible defaults
5. **Validations**: Add validation rules for parameters that have constraints (e.g., minimum replicas, valid port ranges)
6. **Testing**: Validate ClusterComponentTypes with sample Components before platform-wide deployment

## Related Resources

- [ComponentType](./componenttype.md) - Namespace-scoped variant of ClusterComponentType
- [ClusterTrait](./clustertrait.md) - Cluster-scoped traits that can be referenced by ClusterComponentTypes
- [Configuration Helpers](../../cel/configuration-helpers.md) - Configuration helper functions reference
- [Component](../application/component.md) - Uses ComponentTypes or ClusterComponentTypes for deployment
- [ReleaseBinding](releasebinding.md) - Binds a ComponentRelease to an environment with parameter overrides
- [Trait](trait.md) - Namespace-scoped traits (cannot be used with ClusterComponentTypes)
