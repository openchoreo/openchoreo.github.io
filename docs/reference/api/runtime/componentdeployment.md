---
title: ComponentDeployment API Reference
---

# ComponentDeployment

A ComponentDeployment represents an environment-specific deployment configuration for a Component in OpenChoreo. It
allows platform engineers and developers to override component parameters and trait configurations on a per-environment
basis, enabling progressive delivery and environment-specific customization while maintaining a single component
definition.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ComponentDeployments are namespace-scoped resources that must be created within an Organization's namespace.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentDeployment
metadata:
  name: <componentdeployment-name>
  namespace: <org-namespace>  # Organization namespace
```

### Spec Fields

| Field                      | Type                                                          | Required | Default | Description                                                                       |
|----------------------------|---------------------------------------------------------------|----------|---------|-----------------------------------------------------------------------------------|
| `owner`                    | [ComponentDeploymentOwner](#componentdeploymentowner)         | Yes      | -       | Identifies the component this deployment applies to                               |
| `environment`              | string                                                        | Yes      | -       | Name of the environment this deployment applies to                                |
| `overrides`                | object                                                        | No       | -       | Environment-specific overrides for ComponentType envOverrides parameters          |
| `traitOverrides`           | map[string]object                                             | No       | {}      | Environment-specific overrides for trait configurations (keyed by instanceName)   |
| `configurationOverrides`   | [EnvConfigurationOverrides](#envconfigurationoverrides)       | No       | -       | Environment-specific overrides for workload configurations                        |

### ComponentDeploymentOwner

| Field           | Type   | Required | Default | Description                                       |
|-----------------|--------|----------|---------|---------------------------------------------------|
| `projectName`   | string | Yes      | -       | Name of the project that owns the component       |
| `componentName` | string | Yes      | -       | Name of the component this deployment applies to  |

### EnvConfigurationOverrides

| Field   | Type            | Required | Default | Description                             |
|---------|-----------------|----------|---------|-----------------------------------------|
| `env`   | [[EnvVar](#envvar)] | No   | []      | Environment variable overrides          |
| `files` | [[FileVar](#filevar)] | No | []      | File configuration overrides            |

### EnvVar

Environment variable configuration (structure depends on workload implementation).

### FileVar

File configuration (structure depends on workload implementation).

### Status Fields

| Field                | Type        | Default | Description                                                  |
|----------------------|-------------|---------|--------------------------------------------------------------|
| `observedGeneration` | integer     | 0       | The generation observed by the controller                    |
| `conditions`         | []Condition | []      | Standard Kubernetes conditions tracking deployment state     |

#### Condition Types

Common condition types for ComponentDeployment resources:

- `Ready` - Indicates if the component deployment is ready
- `Reconciled` - Indicates if the controller has successfully reconciled the deployment

## Examples

### Basic ComponentDeployment with Resource Overrides

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentDeployment
metadata:
  name: customer-service-production
  namespace: default
spec:
  owner:
    projectName: ecommerce
    componentName: customer-service

  environment: production

  overrides:
    resources:
      requests:
        cpu: "1000m"
        memory: "2Gi"
      limits:
        cpu: "4000m"
        memory: "8Gi"
```

### ComponentDeployment with Development Environment Constraints

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentDeployment
metadata:
  name: payment-service-development
  namespace: default
spec:
  owner:
    projectName: ecommerce
    componentName: payment-service

  environment: development

  overrides:
    resources:
      requests:
        cpu: "50m"
        memory: "128Mi"
      limits:
        cpu: "200m"
        memory: "256Mi"
```

### ComponentDeployment with Trait Overrides

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentDeployment
metadata:
  name: order-service-staging
  namespace: default
spec:
  owner:
    projectName: ecommerce
    componentName: order-service

  environment: staging

  overrides:
    resources:
      requests:
        cpu: "500m"
        memory: "1Gi"
      limits:
        cpu: "2000m"
        memory: "4Gi"

  traitOverrides:
    data-storage:
      size: "50Gi"
      storageClass: "standard"
    cache:
      medium: "Memory"
      sizeLimit: "2Gi"
```

### ComponentDeployment with Configuration Overrides

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentDeployment
metadata:
  name: analytics-service-production
  namespace: default
spec:
  owner:
    projectName: data-platform
    componentName: analytics-service

  environment: production

  overrides:
    replicas: 5
    resources:
      requests:
        cpu: "2000m"
        memory: "8Gi"
      limits:
        cpu: "8000m"
        memory: "16Gi"

  configurationOverrides:
    env:
      - name: DATABASE_URL
        value: "postgres://prod-db.example.com:5432/analytics"
      - name: CACHE_ENABLED
        value: "true"
    files:
      - name: app-config.yaml
        value: |
          logging:
            level: info
          performance:
            maxConnections: 1000
```

### Multiple Environment Deployments for Same Component

Development:
```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentDeployment
metadata:
  name: api-gateway-development
  namespace: default
spec:
  owner:
    projectName: platform
    componentName: api-gateway
  environment: development
  overrides:
    replicas: 1
    resources:
      requests:
        cpu: "100m"
        memory: "256Mi"
```

Staging:
```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentDeployment
metadata:
  name: api-gateway-staging
  namespace: default
spec:
  owner:
    projectName: platform
    componentName: api-gateway
  environment: staging
  overrides:
    replicas: 2
    resources:
      requests:
        cpu: "500m"
        memory: "1Gi"
```

Production:
```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentDeployment
metadata:
  name: api-gateway-production
  namespace: default
spec:
  owner:
    projectName: platform
    componentName: api-gateway
  environment: production
  overrides:
    replicas: 5
    resources:
      requests:
        cpu: "2000m"
        memory: "4Gi"
      limits:
        cpu: "8000m"
        memory: "16Gi"
```

## Annotations

ComponentDeployments support the following annotations:

| Annotation                    | Description                                     |
|-------------------------------|-------------------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display              |
| `openchoreo.dev/description`  | Detailed description of the component deployment |

## Related Resources

- [Component](../application/component.md) - Components being deployed
- [ComponentType](../platform/componenttype.md) - Defines envOverrides schema
- [Environment](../platform/environment.md) - Target environments
- [Release](./release.md) - Created by ComponentDeployment for actual deployment