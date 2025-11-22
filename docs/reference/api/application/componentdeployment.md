---
title: ComponentDeployment API Reference (Deprecated)
---

# ComponentDeployment (Deprecated)

:::warning Deprecated
ComponentDeployment has been replaced by [ReleaseBinding](../platform/releasebinding.md). Please use ReleaseBinding for new deployments.
:::

A ComponentDeployment represents an environment-specific deployment of a Component. It allows platform engineers to
override component parameters, trait configurations, and workload settings for specific environments like development,
staging, or production.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ComponentDeployments are namespace-scoped resources created in the same namespace as the Component they deploy.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentDeployment
metadata:
  name: <component-name>-<environment-name>
  namespace: <project-namespace>
```

### Spec Fields

| Field                    | Type                                                    | Required | Default | Description                                            |
|--------------------------|---------------------------------------------------------|----------|---------|--------------------------------------------------------|
| `owner`                  | [ComponentDeploymentOwner](#componentdeploymentowner)   | Yes      | -       | Identifies the component this deployment applies to    |
| `environment`            | string                                                  | Yes      | -       | Name of the environment (must match an Environment CR) |
| `overrides`              | object                                                  | No       | -       | Overrides for ComponentType `envOverrides` parameters  |
| `traitOverrides`         | map[string]object                                       | No       | -       | Environment-specific trait parameter overrides         |
| `configurationOverrides` | [EnvConfigurationOverrides](#envconfigurationoverrides) | No       | -       | Overrides for workload configurations                  |

### ComponentDeploymentOwner

Identifies which component this deployment is for.

| Field           | Type   | Required | Description                                 |
|-----------------|--------|----------|---------------------------------------------|
| `projectName`   | string | Yes      | Name of the project that owns the component |
| `componentName` | string | Yes      | Name of the component to deploy             |

### EnvConfigurationOverrides

Environment-specific configuration overrides for the workload.

| Field   | Type                  | Required | Description                    |
|---------|-----------------------|----------|--------------------------------|
| `env`   | [[EnvVar](#envvar)]   | No       | Environment variable overrides |
| `files` | [[FileVar](#filevar)] | No       | File configuration overrides   |

#### EnvVar

| Field   | Type   | Required | Description                |
|---------|--------|----------|----------------------------|
| `name`  | string | Yes      | Environment variable name  |
| `value` | string | Yes      | Environment variable value |

#### FileVar

| Field       | Type   | Required | Description             |
|-------------|--------|----------|-------------------------|
| `name`      | string | Yes      | File name               |
| `mountPath` | string | Yes      | Mount path in container |
| `value`     | string | Yes      | File content            |

### Status Fields

| Field                | Type        | Default | Description                                                       |
|----------------------|-------------|---------|-------------------------------------------------------------------|
| `observedGeneration` | integer     | 0       | Generation observed by the controller                             |
| `conditions`         | []Condition | []      | Standard Kubernetes conditions tracking ComponentDeployment state |

#### Condition Types

Common condition types for ComponentDeployment resources:

- `Ready` - Indicates if the deployment is ready
- `Deployed` - Indicates if resources have been deployed successfully
- `Synced` - Indicates if the deployment is in sync with the component definition

## Examples

### Basic ComponentDeployment

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentDeployment
metadata:
  name: my-service-production
  namespace: default
spec:
  owner:
    projectName: default
    componentName: my-service

  environment: production
```

### ComponentDeployment with Parameter Overrides

Override ComponentType `envOverrides` parameters for production:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentDeployment
metadata:
  name: my-service-production
  namespace: default
spec:
  owner:
    projectName: default
    componentName: my-service

  environment: production

  overrides:
    resources:
      requests:
        cpu: "500m"
        memory: "1Gi"
      limits:
        cpu: "2000m"
        memory: "4Gi"
```

### ComponentDeployment with Trait Overrides

Override trait parameters for a specific environment:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentDeployment
metadata:
  name: my-service-production
  namespace: default
spec:
  owner:
    projectName: default
    componentName: my-service

  environment: production

  traitOverrides:
    data-storage:  # instanceName of the trait attachment
      size: 100Gi
      storageClass: production-ssd
      iops: 3000
```

### ComponentDeployment with Configuration Overrides

Override workload environment variables and files:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentDeployment
metadata:
  name: my-service-production
  namespace: default
spec:
  owner:
    projectName: default
    componentName: my-service

  environment: production

  configurationOverrides:
    env:
      - name: LOG_LEVEL
        value: "error"
      - name: CACHE_TTL
        value: "3600"

    files:
      - name: config.yaml
        mountPath: /etc/app
        value: |
          database:
            host: prod-db.example.com
            port: 5432
          cache:
            enabled: true
```

### Complete ComponentDeployment Example

Combining all override types:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentDeployment
metadata:
  name: my-service-production
  namespace: default
spec:
  owner:
    projectName: default
    componentName: my-service

  environment: production

  # Override ComponentType envOverrides
  overrides:
    resources:
      requests:
        cpu: "500m"
        memory: "1Gi"
      limits:
        cpu: "2000m"
        memory: "4Gi"

  # Override trait parameters
  traitOverrides:
    data-storage:
      size: 100Gi
      storageClass: fast-ssd

    backup:
      schedule: "0 2 * * *"
      retention: 30

  # Override workload configurations
  configurationOverrides:
    env:
      - name: LOG_LEVEL
        value: "info"
      - name: MAX_CONNECTIONS
        value: "1000"
```

## Usage

ComponentDeployments are typically created for each environment where a component should be deployed:

```bash
# Development environment
kubectl apply -f my-service-development.yaml

# Staging environment
kubectl apply -f my-service-staging.yaml

# Production environment
kubectl apply -f my-service-production.yaml
```

View component deployments:

```bash
# List all component deployments
kubectl get componentdeployments

# Get deployments for a specific component
kubectl get componentdeployment -l openchoreo.dev/component=my-service

# View deployment details
kubectl describe componentdeployment my-service-production
```

## Override Hierarchy

Parameters are resolved in the following order (later overrides earlier):

1. **ComponentType defaults** - Default values from ComponentType schema
2. **Component parameters** - Values specified in the Component spec
3. **ComponentDeployment overrides** - Environment-specific values in ComponentDeployment

Example:

```yaml
# ComponentType defines: replicas default=1
# Component sets: replicas=3
# ComponentDeployment (prod) overrides: replicas=5
# Result: Production deployment will have 5 replicas
```

## Best Practices

1. **Naming Convention**: Use `<component-name>-<environment-name>` pattern
2. **Environment-Specific Values**: Only override what differs between environments
3. **Resource Limits**: Always set appropriate limits for production environments
4. **Configuration Management**: Use ConfigMaps/Secrets for complex configurations
5. **Trait Management**: Override trait parameters rather than removing/adding traits
6. **Testing**: Validate overrides in lower environments before production
7. **Documentation**: Document why specific overrides are needed

## Related Resources

- [Component](component.md) - Defines the component being deployed
- [Environment](../platform/environment.md) - Defines the target environment
- [ComponentType](../platform/componenttype.md) - Defines available parameters for override
- [Trait](../platform/trait.md) - Traits whose parameters can be overridden
