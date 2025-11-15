---
title: ComponentType API Reference
---

# ComponentType

A ComponentType is a platform engineer-defined template that governs how components are deployed and managed in
OpenChoreo. It implements the platform's claim/class pattern, where platform engineers define ComponentTypes (classes)
to enforce organizational policies, best practices, and infrastructure patterns, while developers create Components
(claims) that reference these types.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ComponentTypes are namespace-scoped resources that must be created within an Organization's namespace.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentType
metadata:
  name: <componenttype-name>
  namespace: <org-namespace>  # Organization namespace
```

### Spec Fields

| Field              | Type                | Required | Default | Description                                                                                          |
|--------------------|---------------------|----------|---------|------------------------------------------------------------------------------------------------------|
| `workloadType`     | string              | Yes      | -       | Primary workload resource type: `deployment`, `statefulset`, `cronjob`, or `job`                    |
| `allowedWorkflows` | []AllowedWorkflow   | No       | []      | Restricts which Workflow CRs developers can use for building components of this type                 |
| `schema`           | ComponentTypeSchema | No       | -       | Defines configurable parameters for components, including types, parameters, and environment overrides |
| `resources`        | []ResourceTemplate  | Yes      | -       | Templates that generate Kubernetes resources dynamically using CEL expressions                       |

#### ComponentTypeSchema

| Field         | Type                     | Required | Default | Description                                                                             |
|---------------|--------------------------|----------|---------|-----------------------------------------------------------------------------------------|
| `types`       | map[string]interface{}   | No       | -       | Reusable type definitions that can be referenced in schema fields                       |
| `parameters`  | map[string]interface{}   | No       | -       | Static configurations that remain consistent across environments                        |
| `envOverrides`| map[string]interface{}   | No       | -       | Configurations that can be overridden per environment via ComponentDeployment resources |

#### ResourceTemplate

| Field        | Type   | Required | Default | Description                                                                                      |
|--------------|--------|----------|---------|--------------------------------------------------------------------------------------------------|
| `id`         | string | Yes      | -       | Unique identifier for this resource. For primary workload, must match `workloadType`             |
| `includeWhen`| string | No       | -       | CEL expression determining if this resource should be created                                    |
| `forEach`    | string | No       | -       | CEL expression for generating multiple resources from a list                                     |
| `var`        | string | No       | -       | Loop variable name when using `forEach` (required if `forEach` is specified)                     |
| `template`   | object | Yes      | -       | Kubernetes resource template with CEL expressions enclosed in `${...}` for dynamic value injection |

#### AllowedWorkflow

| Field  | Type   | Required | Default | Description                     |
|--------|--------|----------|---------|---------------------------------|
| `name` | string | Yes      | -       | Name of the allowed Workflow CR |

## Schema Syntax

ComponentType schemas use an inline type definition syntax:

```
"type | default=value enum=val1,val2 minimum=1 maximum=10"
```

**Supported Types:**
- `string`, `integer`, `number`, `boolean`
- `array<type>` or `[]type`
- Custom type references defined in `types` section

**Modifiers:**
- `default=value` - Default value if not provided
- `required=true` - Field must be provided
- `enum=val1,val2` - Restrict to enumerated values
- `minimum=N`, `maximum=N` - Numeric constraints
- `minItems=N`, `maxItems=N` - Array size constraints

## CEL Variables in Templates

Resource templates support CEL expressions with access to:

| Variable                              | Description                                                       |
|---------------------------------------|-------------------------------------------------------------------|
| `${metadata.name}`                    | Generated resource name for the deployment                        |
| `${metadata.namespace}`               | Target namespace for resources                                    |
| `${metadata.labels}`                  | Platform-generated labels for resources                           |
| `${metadata.podSelectors}`            | Pod selector labels for Deployments and Services                  |
| `${parameters.*}`                     | Component parameters (merged from Component and ComponentDeployment) |
| `${environment.name}`                 | Environment name                                                  |
| `${environment.vhost}`                | Environment virtual host for routing                              |
| `${configurations.*}`                 | Configuration values from SecretReferences (configs, secrets)     |
| `${dataplane.secretStore}`            | Secret store reference name from DataPlane (for External Secrets) |
| `${trait.instanceName}`               | Trait instance name (available in trait templates)               |

## Examples

### Basic ComponentType for HTTP Service

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentType
metadata:
  name: http-service
  namespace: default
spec:
  workloadType: deployment

  schema:
    types:
      Resources:
        cpu: "string | default=100m"
        memory: "string | default=256Mi"

    parameters:
      replicas: "integer | default=1"
      imagePullPolicy: "string | default=IfNotPresent"
      port: "integer | default=8080"

    envOverrides:
      resources:
        requests: Resources
        limits: Resources

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
                - name: app
                  image: ${workload.containers["app"].image}
                  imagePullPolicy: ${parameters.imagePullPolicy}
                  ports:
                    - name: http
                      containerPort: ${parameters.port}
                      protocol: TCP
                  resources:
                    requests:
                      cpu: ${parameters.resources.requests.cpu}
                      memory: ${parameters.resources.requests.memory}
                    limits:
                      cpu: ${parameters.resources.limits.cpu}
                      memory: ${parameters.resources.limits.memory}

    - id: service
      template:
        apiVersion: v1
        kind: Service
        metadata:
          name: ${metadata.name}
          namespace: ${metadata.namespace}
          labels: ${metadata.labels}
        spec:
          type: ClusterIP
          selector: ${metadata.podSelectors}
          ports:
            - name: http
              port: 80
              targetPort: ${parameters.port}
              protocol: TCP
```

### ComponentType with Allowed Workflows

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentType
metadata:
  name: secure-web-service
  namespace: default
spec:
  workloadType: deployment

  allowedWorkflows:
    - name: docker
    - name: google-cloud-buildpacks

  schema:
    parameters:
      replicas: "integer | default=2"
      port: "integer | default=8080"

  resources:
    - id: deployment
      template:
        apiVersion: apps/v1
        kind: Deployment
        metadata:
          name: ${metadata.name}
        spec:
          replicas: ${parameters.replicas}
          # ... deployment spec
```

### ComponentType with Conditional Resources

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentType
metadata:
  name: scalable-service
  namespace: default
spec:
  workloadType: deployment

  schema:
    parameters:
      replicas: "integer | default=1"
      autoscaling:
        enabled: "boolean | default=false"
        minReplicas: "integer | default=1"
        maxReplicas: "integer | default=10"

  resources:
    - id: deployment
      template:
        # ... deployment template

    - id: hpa
      includeWhen: ${parameters.autoscaling.enabled}
      template:
        apiVersion: autoscaling/v2
        kind: HorizontalPodAutoscaler
        metadata:
          name: ${metadata.name}
        spec:
          minReplicas: ${parameters.autoscaling.minReplicas}
          maxReplicas: ${parameters.autoscaling.maxReplicas}
          # ... HPA spec
```

## Annotations

ComponentTypes support the following annotations:

| Annotation                    | Description                                 |
|-------------------------------|---------------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display          |
| `openchoreo.dev/description`  | Detailed description of the ComponentType   |

## Related Resources

- [Component](../application/component.md) - Components that reference ComponentTypes
- [Workflow](./workflow.md) - Build workflows that can be restricted by ComponentTypes
