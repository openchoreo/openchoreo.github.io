---
title: ComponentType API Reference
---

# ComponentType

A ComponentType is a platform-defined template that determines how components are deployed and what resources are generated for them. ComponentTypes enable platform engineers to create reusable deployment patterns with configurable parameters, replacing the fixed component classes from previous versions.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ComponentTypes are namespace-scoped resources typically created in an Organization's namespace to be available for components in that organization.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentType
metadata:
  name: <componenttype-name>
  namespace: <org-namespace>  # Organization namespace
```

### Spec Fields

| Field              | Type                                          | Required | Default | Description                                                          |
|--------------------|-----------------------------------------------|----------|---------|----------------------------------------------------------------------|
| `workloadType`     | string                                        | Yes      | -       | Primary workload type: `deployment`, `statefulset`, `cronjob`, `job` |
| `allowedWorkflows` | [[AllowedWorkflow](#allowedworkflow)]         | No       | []      | Workflows that developers can use for building this component type   |
| `schema`           | [ComponentTypeSchema](#componenttypeschema)   | No       | -       | Configurable parameters for components of this type                  |
| `resources`        | [[ResourceTemplate](#resourcetemplate)]       | Yes      | -       | Templates for generating Kubernetes resources                        |

:::note
The `workloadType` field is immutable after creation and determines the primary resource type for components of this type.
:::

### ComponentTypeSchema

Defines the configurable parameters that developers can set when creating components of this type.

| Field         | Type           | Required | Default | Description                                                      |
|---------------|----------------|----------|---------|------------------------------------------------------------------|
| `types`       | object         | No       | -       | Reusable type definitions referenced in parameters               |
| `parameters`  | object         | No       | -       | Static parameters exposed to developers (same across all envs)   |
| `envOverrides`| object         | No       | -       | Parameters that can be overridden per environment                |

#### Parameter Schema Syntax

Parameters use inline schema syntax with pipe-separated modifiers:

```
fieldName: "type | default=value | required=true | enum=val1,val2"
```

Supported types: `string`, `integer`, `boolean`, `array<type>`, custom type references

**Example:**
```yaml
schema:
  types:
    Resources:
      cpu: "string | default=100m"
      memory: "string | default=256Mi"

  parameters:
    replicas: "integer | default=1"
    port: "integer | default=8080"
    imagePullPolicy: "string | default=IfNotPresent | enum=Always,IfNotPresent,Never"

  envOverrides:
    resources:
      requests: Resources
      limits: Resources
```

### ResourceTemplate

Defines a template for generating Kubernetes resources with CEL expressions for dynamic values.

| Field        | Type   | Required | Default | Description                                                |
|--------------|--------|----------|---------|------------------------------------------------------------|
| `id`         | string | Yes      | -       | Unique identifier (must match `workloadType` for primary)  |
| `includeWhen`| string | No       | -       | CEL expression determining if resource should be created   |
| `forEach`    | string | No       | -       | CEL expression for generating multiple resources from list |
| `var`        | string | No       | -       | Variable name for `forEach` iterations                     |
| `template`   | object | Yes      | -       | Kubernetes resource template with CEL expressions          |

#### CEL Expression Syntax

Templates use CEL expressions enclosed in `${...}` that have access to:

- `metadata.*` - Component metadata (name, namespace, labels, podSelectors)
- `parameters.*` - ComponentType parameters
- `workload.*` - Workload specification (containers, volumes)
- `configurations.*` - Configuration and secret references
- `environment.*` - Environment information
- `dataplane.*` - DataPlane configuration
- OpenChoreo helper functions: `oc_generate_name()`, `oc_hash()`, `oc_omit()`

### AllowedWorkflow

References a Workflow CR that developers can use for building components of this type.

| Field  | Type   | Required | Description          |
|--------|--------|----------|----------------------|
| `name` | string | Yes      | Name of the Workflow |

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
      includeWhen: ${parameters.exposed == true}
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
            - ${metadata.name}-${environment.name}.${environment.vhost}
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
      schedule: "string | required=true"
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
  componentType: deployment/service  # References the ComponentType
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

- [Component](../application/component.md) - Uses ComponentTypes for deployment
- [ComponentDeployment](../application/componentdeployment.md) - Can override ComponentType parameters per environment
- [Trait](trait.md) - Adds cross-cutting concerns to components using ComponentTypes