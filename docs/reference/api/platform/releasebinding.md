---
title: ReleaseBinding API Reference
---

# ReleaseBinding

A ReleaseBinding represents an environment-specific deployment of a Component. It binds a specific release to an environment and allows platform engineers to override component parameters, trait configurations, and workload settings for specific environments like development, staging, or production.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ReleaseBindings are namespace-scoped resources created in the same namespace as the Component they deploy.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ReleaseBinding
metadata:
  name: <component-name>-<environment-name>
  namespace: <project-namespace>
```

### Spec Fields

| Field                       | Type                                        | Required | Default | Description                                                  |
|-----------------------------|---------------------------------------------|----------|---------|--------------------------------------------------------------|
| `owner`                     | [ReleaseBindingOwner](#releasebindingowner) | Yes      | -       | Identifies the component this release binding applies to     |
| `environment`               | string                                      | Yes      | -       | Name of the environment (must match an Environment CR)       |
| `releaseName`               | string                                      | Yes      | -       | Name of the ComponentRelease to bind to this environment     |
| `componentTypeEnvOverrides` | object                                      | No       | -       | Overrides for ComponentType `envOverrides` parameters        |
| `traitOverrides`            | map[string]object                           | No       | -       | Environment-specific trait parameter overrides               |
| `workloadOverrides`         | [WorkloadOverride](#workloadoverride)       | No       | -       | Overrides for workload configurations                        |

### ReleaseBindingOwner

Identifies which component this release binding is for.

| Field           | Type   | Required | Description                                 |
|-----------------|--------|----------|---------------------------------------------|
| `projectName`   | string | Yes      | Name of the project that owns the component |
| `componentName` | string | Yes      | Name of the component to deploy             |

### WorkloadOverride

Environment-specific configuration overrides for the workload.

| Field       | Type                                            | Required | Description                           |
|-------------|-------------------------------------------------|----------|---------------------------------------|
| `container` | [ContainerOverride](#containeroverride)         | No       | Container-specific overrides          |

#### ContainerOverride

| Field   | Type                  | Required | Description                    |
|---------|-----------------------|----------|--------------------------------|
| `env`   | [[EnvVar](#envvar)]   | No       | Environment variable overrides |
| `files` | [[FileVar](#filevar)] | No       | File configuration overrides   |

#### EnvVar

| Field       | Type                    | Required | Description                   |
|-------------|-------------------------|----------|-------------------------------|
| `key`      | string                  | Yes      | Environment variable name     |
| `value`     | string                  | No       | Plain text value              |
| `secretRef` | [SecretRef](#secretref) | No       | Reference to a secret value   |

#### SecretRef

| Field  | Type   | Required | Description                    |
|--------|--------|----------|--------------------------------|
| `name` | string | Yes      | Name of the SecretReference CR |
| `key`  | string | Yes      | Key within the secret          |

#### FileVar

| Field       | Type                    | Required | Description                |
|-------------|-------------------------|----------|----------------------------|
| `key`      | string                  | Yes      | File name                  |
| `mountPath` | string                  | Yes      | Mount path in container    |
| `value`     | string                  | No       | Plain text file content    |
| `secretRef` | [SecretRef](#secretref) | No       | Reference to a secret file |

### Status Fields

| Field        | Type        | Default | Description                                                  |
|--------------|-------------|---------|--------------------------------------------------------------|
| `conditions` | []Condition | []      | Standard Kubernetes conditions tracking ReleaseBinding state |

#### Condition Types

Common condition types for ReleaseBinding resources:

- `Ready` - Indicates if the release binding is ready
- `Deployed` - Indicates if resources have been deployed successfully
- `Synced` - Indicates if the deployment is in sync with the component definition

## Examples

### Basic ReleaseBinding

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ReleaseBinding
metadata:
  name: my-service-production
  namespace: default
spec:
  owner:
    projectName: default
    componentName: my-service

  environment: production
  releaseName: my-service-v1
```

### ReleaseBinding with Parameter Overrides

Override ComponentType `envOverrides` parameters for production:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ReleaseBinding
metadata:
  name: my-service-production
  namespace: default
spec:
  owner:
    projectName: default
    componentName: my-service

  environment: production
  releaseName: my-service-v1

  componentTypeEnvOverrides:
    resources:
      requests:
        cpu: "500m"
        memory: "1Gi"
      limits:
        cpu: "2000m"
        memory: "4Gi"
```

### ReleaseBinding with Trait Overrides

Override trait parameters for a specific environment:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ReleaseBinding
metadata:
  name: my-service-production
  namespace: default
spec:
  owner:
    projectName: default
    componentName: my-service

  environment: production
  releaseName: my-service-v1

  traitOverrides:
    data-storage:  # instanceName of the trait attachment
      size: 100Gi
      storageClass: production-ssd
      iops: 3000
```

### ReleaseBinding with Workload Overrides

Override workload environment variables and files:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ReleaseBinding
metadata:
  name: my-service-production
  namespace: default
spec:
  owner:
    projectName: default
    componentName: my-service

  environment: production
  releaseName: my-service-v1

  workloadOverrides:
    container:
      env:
        - key: LOG_LEVEL
          value: "error"
        - key: CACHE_TTL
          value: "3600"

      files:
        - key: config.yaml
          mountPath: /etc/app
          value: |
            database:
              host: prod-db.example.com
              port: 5432
            cache:
              enabled: true
```

### Complete ReleaseBinding Example

Combining all override types:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ReleaseBinding
metadata:
  name: my-service-production
  namespace: default
spec:
  owner:
    projectName: default
    componentName: my-service

  environment: production
  releaseName: my-service-v1

  # Override ComponentType envOverrides
  componentTypeEnvOverrides:
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
  workloadOverrides:
    container:
      env:
        - key: LOG_LEVEL
          value: "info"
        - key: MAX_CONNECTIONS
          value: "1000"
```

## Usage

ReleaseBindings are typically created for each environment where a component should be deployed:

```bash
# Development environment
kubectl apply -f my-service-development.yaml

# Staging environment
kubectl apply -f my-service-staging.yaml

# Production environment
kubectl apply -f my-service-production.yaml
```

View release bindings:

```bash
# List all release bindings
kubectl get releasebindings

# Get release bindings for a specific component
kubectl get releasebinding -l openchoreo.dev/component=my-service

# View release binding details
kubectl describe releasebinding my-service-production
```

## Override Hierarchy

Parameters are resolved in the following order (later overrides earlier):

1. **ComponentType defaults** - Default values from ComponentType schema
2. **Component parameters** - Values specified in the Component spec
3. **ReleaseBinding overrides** - Environment-specific values in ReleaseBinding

Example:

```yaml
# ComponentType defines: replicas default=1
# Component sets: replicas=3
# ReleaseBinding (prod) overrides: replicas=5
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

- [Component](../application/component.md) - Defines the component being deployed
- [ComponentRelease](../runtime/componentrelease.md) - Immutable snapshot that ReleaseBinding references for deployment
- [Environment](environment.md) - Defines the target environment
- [ComponentType](componenttype.md) - Defines available parameters for override
- [Trait](trait.md) - Traits whose parameters can be overridden
