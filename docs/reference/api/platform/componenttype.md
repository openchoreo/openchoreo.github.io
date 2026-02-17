---
title: ComponentType API Reference
---

# ComponentType

A ComponentType is a platform-defined template that determines how components are deployed and what resources are
generated for them. ComponentTypes enable platform engineers to create reusable deployment patterns with configurable
parameters, replacing the fixed component classes from previous versions.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ComponentTypes are namespace-scoped resources typically created in a namespace to be available for
components in that namespace.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentType
metadata:
  name: <componenttype-name>
  namespace: <namespace>  # Namespace for grouping component types
```

### Spec Fields

| Field              | Type                                        | Required | Default | Description                                                          |
|--------------------|---------------------------------------------|----------|---------|----------------------------------------------------------------------|
| `workloadType`     | string                                      | Yes      | -       | Primary workload type: `deployment`, `statefulset`, `cronjob`, `job`, `proxy` |
| `allowedWorkflows` | []string                                    | No       | []      | Names of Workflows that developers can use for building this component type |
| `allowedTraits`    | [[TraitRef](#traitref)]                      | No       | []      | Traits that can be attached to components of this type               |
| `schema`           | [ComponentTypeSchema](#componenttypeschema) | No       | -       | Configurable parameters for components of this type                  |
| `resources`        | [[ResourceTemplate](#resourcetemplate)]     | Yes      | -       | Templates for generating Kubernetes resources                        |

:::note
The `workloadType` field is immutable after creation and determines the primary resource type for components of this
type.
:::

### TraitRef

Specifies a Trait or ClusterTrait that can be attached to components of this type.

| Field  | Type   | Required | Default | Description                                                                     |
|--------|--------|----------|---------|---------------------------------------------------------------------------------|
| `kind` | string | No       | `Trait` | Kind of the referenced resource: `Trait` (namespace-scoped) or `ClusterTrait` (cluster-scoped) |
| `name` | string | Yes      | -       | Name of the Trait or ClusterTrait                                               |

### ComponentTypeSchema

Defines the configurable parameters that developers can set when creating components of this type.

| Field          | Type   | Required | Default | Description                                                            |
|----------------|--------|----------|---------|------------------------------------------------------------------------|
| `types`        | object | No       | -       | Reusable type definitions referenced in parameters                     |
| `parameters`   | object | No       | -       | Static parameters exposed to developers (same across all envs)         |
| `envOverrides` | object | Yes      | -       | Parameters that can be overridden per environment (Must have defaults) |

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
      containerName: "string | default=main"
    
    envOverrides:
      resources: "ResourceRequirements | default={}"
```

### ResourceTemplate

Defines a template for generating Kubernetes resources with CEL expressions for dynamic values.

| Field         | Type   | Required | Default | Description                                                |
|---------------|--------|----------|---------|------------------------------------------------------------|
| `id`          | string | Yes      | -       | Unique identifier (must match `workloadType` for primary)  |
| `includeWhen` | string | No       | -       | CEL expression determining if resource should be created   |
| `forEach`     | string | No       | -       | CEL expression for generating multiple resources from list |
| `var`         | string | No       | -       | Variable name for `forEach` iterations                     |
| `template`    | object | Yes      | -       | Kubernetes resource template with CEL expressions          |

#### CEL Expression Syntax

Templates use CEL expressions enclosed in `${...}` that have access to the following context variables:

##### metadata

Platform-computed metadata for resource generation:

| Field | Type | Description |
|-------|------|-------------|
| `metadata.name` | string | Base name for generated resources (e.g., `my-service-dev-a1b2c3d4`) |
| `metadata.namespace` | string | Target namespace for resources |
| `metadata.componentNamespace` | string | Target namespace of the component |
| `metadata.componentName` | string | Name of the component |
| `metadata.componentUID` | string | Unique identifier of the component |
| `metadata.projectName` | string | Name of the project |
| `metadata.projectUID` | string | Unique identifier of the project |
| `metadata.environmentName` | string | Name of the environment (e.g., `development`, `production`) |
| `metadata.environmentUID` | string | Unique identifier of the environment |
| `metadata.dataPlaneName` | string | Name of the data plane |
| `metadata.dataPlaneUID` | string | Unique identifier of the data plane |
| `metadata.labels` | map | Common labels to add to all resources |
| `metadata.annotations` | map | Common annotations to add to all resources |
| `metadata.podSelectors` | map | Platform-injected selectors for pod identity (use in Deployment/Service selectors) |

##### parameters

Component parameters from `Component.spec.parameters` with schema defaults applied. Use for static configuration that doesn't change across environments.

##### envOverrides

Environment-specific overrides from `ReleaseBinding.spec.componentTypeEnvOverrides` with schema defaults applied. Use for values that vary per environment (resources, replicas, etc.).

##### workload

Workload specification from the Workload resource:

| Field | Type | Description |
|-------|------|-------------|
| `workload.containers` | map | Map of container configurations keyed by container name |
| `workload.containers[parameters.containerName].image` | string | Container image |
| `workload.containers[parameters.containerName].command` | []string | Container command |
| `workload.containers[parameters.containerName].args` | []string | Container arguments |

##### configurations

Configuration and secret references extracted from workload, keyed by container name:

| Field | Type | Description |
|-------|------|-------------|
| `configurations[parameters.containerName].configs.envs` | []object | Environment variable configs (each has `name`, `value`) |
| `configurations[parameters.containerName].configs.files` | []object | File configs (each has `name`, `mountPath`, `value`) |
| `configurations[parameters.containerName].secrets.envs` | []object | Secret env vars (each has `name`, `value`, `remoteRef`) |
| `configurations[parameters.containerName].secrets.files` | []object | Secret files (each has `name`, `mountPath`, `remoteRef`) |

The `remoteRef` object contains: `key`, `property` (optional), `version` (optional).

**Configuration Helper Functions:**

The `configurations` object provides several helper methods to simplify working with container configurations. See [Configuration Helpers](../../cel/configuration-helpers.md) for detailed documentation on these functions:

- `configurations.toContainerEnvFrom(containerName)` - Generate envFrom array for a container
- `configurations.toConfigEnvsByContainer()` - List config environment variables by container
- `configurations.toSecretEnvsByContainer()` - List secret environment variables by container
- `configurations.toConfigFileList()` - Flatten all config files into a single list
- `configurations.toSecretFileList()` - Flatten all secret files into a single list
- `configurations.toContainerVolumeMounts(containerName)` - Generate volumeMounts for a container
- `configurations.toVolumes()` - Generate volumes array for all containers

##### dataplane

Data plane configuration:

| Field | Type | Description |
|-------|------|-------------|
| `dataplane.secretStore` | string | Name of the ClusterSecretStore for external secrets |
| `dataplane.publicVirtualHost` | string | Public virtual host for external access |

##### Helper Functions

| Function | Description |
|----------|-------------|
| `oc_generate_name(args...)` | Generate valid Kubernetes names with hash suffix for uniqueness |
| `oc_hash(string)` | Generate 8-character FNV-32a hash from input string |
| `oc_merge(map1, map2, ...)` | Shallow merge maps (later maps override earlier ones) |
| `oc_omit()` | Remove field/key from output when used in conditional expressions |

For a comprehensive guide to configuration helper functions, see the [Configuration Helpers](../../cel/configuration-helpers.md).

## Examples

### Basic HTTP Service ComponentType

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentType
metadata:
  name: service
  namespace: default
spec:
  workloadType: deployment

  schema:
    parameters:
      replicas: "integer | default=1"
      port: "integer | default=80"
      exposed: "boolean | default=false"

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
                  image: ${workload.containers["main"].image}
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
          parentRefs:
            - name: gateway-external
              namespace: openchoreo-data-plane
          hostnames:
            - ${metadata.name}-${metadata.environmentName}.${dataplane.publicVirtualHost}
          rules:
            - backendRefs:
                - name: ${metadata.componentName}
                  port: 80
```

### Scheduled Task ComponentType

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentType
metadata:
  name: scheduled-task
  namespace: default
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
                      image: ${workload.containers["main"].image}
                  restartPolicy: OnFailure
```

### ComponentType with Resource Iteration

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentType
metadata:
  name: multi-config-service
  namespace: default
spec:
  workloadType: deployment

  schema:
    parameters:
      containerName: "string | default=main"

  resources:
    - id: deployment
      template:
        # ... deployment spec ...

    - id: file-config
      includeWhen: ${has(configurations[parameters.containerName].configs.files) && configurations[parameters.containerName].configs.files.size() > 0}
      forEach: ${configurations[parameters.containerName].configs.files}
      var: config
      template:
        apiVersion: v1
        kind: ConfigMap
        metadata:
          name: ${metadata.name}-${config.name}
          namespace: ${metadata.namespace}
        data:
          ${config.name}: ${config.value}
```

## Usage

Components reference a ComponentType using the `spec.componentType` field:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: my-service
spec:
  componentType:
    kind: ComponentType
    name: deployment/service  # References the ComponentType
  parameters:
    replicas: 3
    port: 8080
    exposed: true
```

## Best Practices

1. **Naming Convention**: Use descriptive names like `service`, `web-application`, `scheduled-task`
2. **Parameter Design**: Keep parameters focused and provide sensible defaults
3. **Resource IDs**: Use clear, descriptive IDs for each resource template
4. **Conditional Resources**: Use `includeWhen` for optional resources based on parameters
5. **Type Definitions**: Define reusable types for complex parameter structures
6. **Testing**: Validate ComponentTypes with sample components before platform-wide deployment

## Related Resources

- [ClusterComponentType](./clustercomponenttype.md) - Cluster-scoped variant of ComponentType
- [Configuration Helpers](../../cel/configuration-helpers.md) - Configuration helper functions reference
- [Component](../application/component.md) - Uses ComponentTypes for deployment
- [ReleaseBinding](releasebinding.md) - Binds a ComponentRelease to an environment with parameter overrides
- [Trait](trait.md) - Adds cross-cutting concerns to components using ComponentTypes
