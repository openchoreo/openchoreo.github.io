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
  namespace: <namespace> # Namespace for grouping component types
```

**Short names:** `ct`, `cts`

### Spec Fields

| Field                | Type                                        | Required | Default | Description                                                                                                 |
| -------------------- | ------------------------------------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| `workloadType`       | string                                      | Yes      | -       | Primary workload type: `deployment`, `statefulset`, `cronjob`, `proxy`                                      |
| `allowedWorkflows`   | [[WorkflowRef](#workflowref)]               | No       | []      | Workflow references developers can use for building this component type; if empty, no workflows are allowed |
| `parameters`         | [SchemaSection](#schemasection)             | No       | -       | Developer-facing parameter schema for components of this type                                               |
| `environmentConfigs` | [SchemaSection](#schemasection)             | No       | -       | Per-environment configuration overrides schema                                                              |
| `traits`             | [[ComponentTypeTrait](#componenttypetrait)] | No       | []      | Pre-configured trait instances automatically applied to all Components of this type                         |
| `allowedTraits`      | [[TraitRef](#traitref)]                     | No       | []      | Traits that developers can attach to components of this type beyond those embedded in `traits`              |
| `validations`        | [[ValidationRule](#validationrule)]         | No       | []      | CEL-based rules evaluated during rendering; all must pass for rendering to proceed                          |
| `resources`          | [[ResourceTemplate](#resourcetemplate)]     | Yes      | -       | Templates for generating Kubernetes resources                                                               |

:::note
The `workloadType` field is immutable after creation and determines the primary resource type for components of this
type. For non-proxy workload types, one resource template must have an `id` matching the `workloadType`.
:::

### WorkflowRef

Specifies a Workflow that developers can use with components of this type. `allowedWorkflows` is an explicit allow
list, so only referenced Workflows are permitted.

| Field  | Type   | Required | Default    | Description                                                                                          |
| ------ | ------ | -------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `kind` | string | No       | `Workflow` | Kind of the referenced resource: `Workflow` (namespace-scoped) or `ClusterWorkflow` (cluster-scoped) |
| `name` | string | Yes      | -          | Name of the Workflow or ClusterWorkflow resource                                                     |

**Example:**

```yaml
allowedWorkflows:
  - kind: Workflow
    name: nodejs-build
  - kind: ClusterWorkflow
    name: dockerfile-builder
  - name: container-image-scan
```

### ComponentTypeTrait

Represents a pre-configured trait instance embedded in a ComponentType. These traits are automatically applied to all
Components of this type.

| Field                | Type   | Required | Default | Description                                                                                                                    |
| -------------------- | ------ | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `kind`               | string | No       | `Trait` | Kind of the referenced resource: `Trait` (namespace-scoped) or `ClusterTrait` (cluster-scoped)                                 |
| `name`               | string | Yes      | -       | Name of the Trait or ClusterTrait                                                                                              |
| `instanceName`       | string | Yes      | -       | Unique instance name within the component type                                                                                 |
| `parameters`         | object | No       | -       | Trait parameter values (can use CEL expressions referencing the ComponentType schema, e.g., `${parameters.storage.mountPath}`) |
| `environmentConfigs` | object | No       | -       | Environment-specific override values for the trait                                                                             |

### TraitRef

Specifies a Trait or ClusterTrait that developers can attach to components of this type. Traits listed here must not
overlap with traits already embedded in `spec.traits`.

| Field  | Type   | Required | Default | Description                                                                                    |
| ------ | ------ | -------- | ------- | ---------------------------------------------------------------------------------------------- |
| `kind` | string | No       | `Trait` | Kind of the referenced resource: `Trait` (namespace-scoped) or `ClusterTrait` (cluster-scoped) |
| `name` | string | Yes      | -       | Name of the Trait or ClusterTrait                                                              |

### ValidationRule

Defines a CEL-based validation rule evaluated during rendering. All rules must evaluate to true for rendering to
proceed.

| Field     | Type   | Required | Description                                                   |
| --------- | ------ | -------- | ------------------------------------------------------------- |
| `rule`    | string | Yes      | CEL expression wrapped in `${...}` that must evaluate to true |
| `message` | string | Yes      | Error message shown when the rule evaluates to false          |

**Example:**

```yaml
validations:
  - rule: ${parameters.replicas >= 1}
    message: "replicas must be at least 1"
  - rule: ${parameters.port > 0 && parameters.port <= 65535}
    message: "port must be between 1 and 65535"
```

### SchemaSection

Both `parameters` and `environmentConfigs` use the `SchemaSection` type, which holds a schema in `openAPIV3Schema` format:

| Field             | Type   | Required | Default | Description                            |
| ----------------- | ------ | -------- | ------- | -------------------------------------- |
| `openAPIV3Schema` | object | No       | -       | Standard OpenAPI v3 JSON Schema format |

#### openAPIV3Schema Format

Uses standard OpenAPI v3 JSON Schema:

```yaml
parameters:
  openAPIV3Schema:
    type: object
    properties:
      replicas:
        type: integer
        default: 1
      port:
        type: integer
        default: 80
```

### ResourceTemplate

Defines a template for generating Kubernetes resources with CEL expressions for dynamic values.

| Field         | Type   | Required | Default     | Description                                                           |
| ------------- | ------ | -------- | ----------- | --------------------------------------------------------------------- |
| `id`          | string | Yes      | -           | Unique identifier (must match `workloadType` for primary)             |
| `targetPlane` | string | No       | `dataplane` | Target plane: `dataplane` or `observabilityplane`                     |
| `includeWhen` | string | No       | -           | CEL expression determining if resource should be created              |
| `forEach`     | string | No       | -           | CEL expression for generating multiple resources from list            |
| `var`         | string | No       | -           | Variable name for `forEach` iterations (required if `forEach` is set) |
| `template`    | object | Yes      | -           | Kubernetes resource template with CEL expressions                     |

#### CEL Expression Syntax

Templates use CEL expressions enclosed in `${...}` that have access to the following context variables:

##### metadata

Platform-computed metadata for resource generation:

| Field                         | Type   | Description                                                                        |
| ----------------------------- | ------ | ---------------------------------------------------------------------------------- |
| `metadata.name`               | string | Base name for generated resources (e.g., `my-service-dev-a1b2c3d4`)                |
| `metadata.namespace`          | string | Target namespace for resources                                                     |
| `metadata.componentNamespace` | string | Target namespace of the component                                                  |
| `metadata.componentName`      | string | Name of the component                                                              |
| `metadata.componentUID`       | string | Unique identifier of the component                                                 |
| `metadata.projectName`        | string | Name of the project                                                                |
| `metadata.projectUID`         | string | Unique identifier of the project                                                   |
| `metadata.environmentName`    | string | Name of the environment (e.g., `development`, `production`)                        |
| `metadata.environmentUID`     | string | Unique identifier of the environment                                               |
| `metadata.dataPlaneName`      | string | Name of the data plane                                                             |
| `metadata.dataPlaneUID`       | string | Unique identifier of the data plane                                                |
| `metadata.labels`             | map    | Common labels to add to all resources                                              |
| `metadata.annotations`        | map    | Common annotations to add to all resources                                         |
| `metadata.podSelectors`       | map    | Platform-injected selectors for pod identity (use in Deployment/Service selectors) |

##### parameters

Component parameters from `Component.spec.parameters` with schema defaults applied. Use for static configuration that doesn't change across environments.

##### environmentConfigs

Environment-specific overrides from `ReleaseBinding.spec.componentTypeEnvironmentConfigs` with schema defaults applied. Use for values that vary per environment (resources, replicas, etc.).

##### workload

Workload specification from the Workload resource:

| Field                                 | Type              | Description                                                               |
| ------------------------------------- | ----------------- | ------------------------------------------------------------------------- |
| `workload.container`                  | object            | Container configuration                                                   |
| `workload.container.image`            | string            | Container image                                                           |
| `workload.container.command`          | []string          | Container command                                                         |
| `workload.container.args`             | []string          | Container arguments                                                       |
| `workload.endpoints`                  | map[string]object | Network endpoints keyed by endpoint name                                  |
| `workload.endpoints[name].type`       | string            | Endpoint protocol (`HTTP`, `gRPC`, `GraphQL`, `Websocket`, `TCP`, `UDP`)  |
| `workload.endpoints[name].port`       | int32             | Port number                                                               |
| `workload.endpoints[name].basePath`   | string            | Base path prefix (optional, default `"/"`)                                |
| `workload.endpoints[name].visibility` | []string          | Visibility scopes: `"project"`, `"namespace"`, `"internal"`, `"external"` |

##### configurations

Configuration and secret references extracted from the workload container:

| Field                          | Type     | Description                                              |
| ------------------------------ | -------- | -------------------------------------------------------- |
| `configurations.configs.envs`  | []object | Environment variable configs (each has `name`, `value`)  |
| `configurations.configs.files` | []object | File configs (each has `name`, `mountPath`, `value`)     |
| `configurations.secrets.envs`  | []object | Secret env vars (each has `name`, `value`, `remoteRef`)  |
| `configurations.secrets.files` | []object | Secret files (each has `name`, `mountPath`, `remoteRef`) |

The `remoteRef` object contains: `key`, `property` (optional), `version` (optional).

**Configuration Helper Functions:**

The `configurations` object provides several helper methods to simplify working with container configurations. See [Configuration Helpers](../../cel/configuration-helpers.md) for detailed documentation on these functions:

- `configurations.toContainerEnvFrom()` - Generate envFrom array for the container
- `configurations.toConfigEnvsByContainer()` - List config environment variables
- `configurations.toSecretEnvsByContainer()` - List secret environment variables
- `configurations.toConfigFileList()` - Flatten all config files into a single list
- `configurations.toSecretFileList()` - Flatten all secret files into a single list
- `configurations.toContainerVolumeMounts()` - Generate volumeMounts for the container
- `configurations.toVolumes()` - Generate volumes array

##### dataplane

Data plane configuration:

| Field                         | Type   | Description                                         |
| ----------------------------- | ------ | --------------------------------------------------- |
| `dataplane.secretStore`       | string | Name of the ClusterSecretStore for external secrets |
| `dataplane.publicVirtualHost` | string | Public virtual host for external access             |

##### gateway

Ingress gateway configuration for HTTPRoute generation:

| Field                                | Type   | Description                                                 |
| ------------------------------------ | ------ | ----------------------------------------------------------- |
| `gateway.ingress.external.name`      | string | Name of the external ingress Gateway resource               |
| `gateway.ingress.external.namespace` | string | Namespace of the external ingress Gateway resource          |
| `gateway.ingress.external.http`      | object | HTTP listener (optional; has `.host`)                       |
| `gateway.ingress.external.https`     | object | HTTPS listener (optional; has `.host`)                      |
| `gateway.ingress.internal.name`      | string | Name of the internal ingress Gateway resource               |
| `gateway.ingress.internal.namespace` | string | Namespace of the internal ingress Gateway resource          |
| `gateway.ingress.internal.http`      | object | HTTP listener for internal gateway (optional; has `.host`)  |
| `gateway.ingress.internal.https`     | object | HTTPS listener for internal gateway (optional; has `.host`) |

##### Helper Functions

| Function                    | Description                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| `oc_generate_name(args...)` | Generate valid Kubernetes names with hash suffix for uniqueness                            |
| `oc_hash(string)`           | Generate 8-character FNV-32a hash from input string                                        |
| `oc_merge(map1, map2, ...)` | Shallow merge maps (later maps override earlier ones)                                      |
| `oc_omit()`                 | Remove field/key from output when used in conditional expressions                          |
| `oc_dns_label(args...)`     | Generate RFC 1123-compliant DNS label (≤63 chars) with hash suffix for HTTPRoute hostnames |

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

  parameters:
    openAPIV3Schema:
      type: object
      properties:
        replicas:
          type: integer
          default: 1
        port:
          type: integer
          default: 80

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

    - id: httproute-external
      forEach: '${workload.endpoints.transformList(name, ep, ("external" in ep.visibility && ep.type in ["HTTP", "GraphQL", "Websocket"]) ? [name] : []).flatten()}'
      var: endpoint
      template:
        apiVersion: gateway.networking.k8s.io/v1
        kind: HTTPRoute
        metadata:
          name: ${oc_generate_name(metadata.componentName, endpoint)}
          namespace: ${metadata.namespace}
          labels: '${oc_merge(metadata.labels, {"openchoreo.dev/endpoint-name": endpoint, "openchoreo.dev/endpoint-visibility": "external"})}'
        spec:
          parentRefs:
            - name: ${gateway.ingress.external.name}
              namespace: ${gateway.ingress.external.namespace}
          hostnames: |
            ${[gateway.ingress.external.?http, gateway.ingress.external.?https]
              .filter(g, g.hasValue()).map(g, g.value().host).distinct()
              .map(h, oc_dns_label(endpoint, metadata.componentName, metadata.environmentName, metadata.componentNamespace) + "." + h)}
          rules:
            - matches:
                - path:
                    type: PathPrefix
                    value: /${metadata.componentName}-${endpoint}
              filters:
                - type: URLRewrite
                  urlRewrite:
                    path:
                      type: ReplacePrefixMatch
                      replacePrefixMatch: '${workload.endpoints[endpoint].?basePath.orValue("") != "" ? workload.endpoints[endpoint].?basePath.orValue("") : "/"}'
              backendRefs:
                - name: ${metadata.componentName}
                  port: ${workload.endpoints[endpoint].port}
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

  parameters:
    openAPIV3Schema:
      type: object
      properties:
        schedule:
          type: string
        concurrencyPolicy:
          type: string
          default: Forbid
          enum:
            - Allow
            - Forbid
            - Replace

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

### ComponentType with Resource Iteration

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentType
metadata:
  name: multi-config-service
  namespace: default
spec:
  workloadType: deployment

  resources:
    - id: deployment
      template:
        # ... deployment spec ...

    - id: file-config
      includeWhen: ${has(configurations.configs.files) && configurations.configs.files.size() > 0}
      forEach: ${configurations.configs.files}
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
    name: deployment/service # References the ComponentType
  parameters:
    replicas: 3
    port: 8080
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
