---
title: Context Variables
description: Variables available in ComponentType and Trait templates
---

# Context Variables

This reference documents all context variables available in ComponentType and Trait templates. These variables provide access to component metadata, parameters, workload specifications, and platform configuration.

## ComponentType Variables

The following variables are available in ComponentType resource templates.

### metadata

Platform-computed metadata for resource generation.

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
| `metadata.podSelectors` | map | Platform-injected selectors for pod identity |

**Usage:**

```yaml
metadata:
  name: ${metadata.name}
  namespace: ${metadata.namespace}
  labels: ${metadata.labels}
spec:
  selector:
    matchLabels: ${metadata.podSelectors}
```

### parameters

Component parameters from `Component.spec.parameters` with schema defaults applied. Use for static configuration that doesn't change across environments.

```yaml
# Access parameters defined in schema.parameters
replicas: ${parameters.replicas}
port: ${parameters.port}

# Nested parameters
database:
  host: ${parameters.database.host}
  port: ${parameters.database.port}
```

### envOverrides

Environment-specific overrides from `ReleaseBinding.spec.componentTypeEnvOverrides` with schema defaults applied. Use for values that vary per environment (resources, replicas, etc.).

```yaml
# Access environment-specific values
replicas: ${envOverrides.replicas}
resources:
  limits:
    cpu: ${envOverrides.resources.cpu}
    memory: ${envOverrides.resources.memory}
```

### workload

Workload specification from the Workload resource.

| Field | Type | Description |
|-------|------|-------------|
| `workload.container` | object | Container configuration |
| `workload.container.image` | string | Container image |
| `workload.container.command` | []string | Container command |
| `workload.container.args` | []string | Container arguments |

**Usage:**

```yaml
containers:
  - name: main
    image: ${workload.container.image}
    command: ${workload.container.command}
    args: ${workload.container.args}
```

### configurations

Configuration and secret references extracted from the workload container.

| Field | Type | Description |
|-------|------|-------------|
| `configurations.configs.envs` | []object | Environment variable configs (each has `name`, `value`) |
| `configurations.configs.files` | []object | File configs (each has `name`, `mountPath`, `value`) |
| `configurations.secrets.envs` | []object | Secret env vars (each has `name`, `value`, `remoteRef`) |
| `configurations.secrets.files` | []object | Secret files (each has `name`, `mountPath`, `remoteRef`) |

The `remoteRef` object contains: `key`, `property` (optional), `version` (optional).

**Usage:**

```yaml
# Access config envs
env: |
  ${configurations.configs.envs.map(e, {"name": e.name, "value": e.value})}

# Check if there are config files
includeWhen: ${has(configurations.configs.files) && configurations.configs.files.size() > 0}
```

See [Configuration Helpers](./configuration-helpers.md) for helper functions that simplify working with configurations.

### dataplane

Data plane configuration.

| Field | Type | Description |
|-------|------|-------------|
| `dataplane.secretStore` | string | Name of the ClusterSecretStore for external secrets |
| `dataplane.publicVirtualHost` | string | Public virtual host for external access |

**Usage:**

```yaml
# ExternalSecret configuration
spec:
  secretStoreRef:
    name: ${dataplane.secretStore}
    kind: ClusterSecretStore

# HTTPRoute hostname
hostnames:
  - ${metadata.name}.${dataplane.publicVirtualHost}
```

## Trait Variables

Traits have access to all the same variables as ComponentTypes, plus trait-specific variables.

### trait

Trait-specific metadata.

| Field | Type | Description |
|-------|------|-------------|
| `trait.name` | string | Name of the trait (e.g., `persistent-volume`) |
| `trait.instanceName` | string | Unique instance name within the component (e.g., `data-storage`) |

**Usage:**

```yaml
# Use trait instance name for resource naming
metadata:
  name: ${metadata.name}-${trait.instanceName}

# Use trait name in labels
labels:
  trait: ${trait.name}
  instance: ${trait.instanceName}
```

### parameters (Traits)

Trait instance parameters from `Component.spec.traits[].parameters` with schema defaults applied.

```yaml
# Access trait-specific parameters
volumeMounts:
  - name: ${parameters.volumeName}
    mountPath: ${parameters.mountPath}
```

### envOverrides (Traits)

Environment-specific overrides from `ReleaseBinding.spec.traitOverrides[instanceName]` with schema defaults applied.

```yaml
# Access environment-specific trait values
resources:
  requests:
    storage: ${envOverrides.size}
storageClassName: ${envOverrides.storageClass}
```

## Variable Availability Summary

| Variable | ComponentType | Trait creates | Trait patches |
|----------|---------------|---------------|---------------|
| `metadata.*` | Yes | Yes | Yes |
| `parameters` | Yes | Yes | Yes |
| `envOverrides` | Yes | Yes | Yes |
| `workload.*` | Yes | No | No |
| `configurations.*` | Yes | No | No |
| `dataplane.*` | Yes | Yes | Yes |
| `trait.*` | No | Yes | Yes |
| `resource` (patch target) | No | No | Yes (in `where`) |

## Examples

### ComponentType Using All Variables

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentType
metadata:
  name: web-service
spec:
  workloadType: deployment
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
          replicas: ${envOverrides.replicas}
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
                  envFrom: ${configurations.toContainerEnvFrom()}
```

### Trait Using Trait-Specific Variables

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Trait
metadata:
  name: persistent-volume
spec:
  creates:
    - template:
        apiVersion: v1
        kind: PersistentVolumeClaim
        metadata:
          name: ${metadata.name}-${trait.instanceName}
          namespace: ${metadata.namespace}
        spec:
          accessModes: ["ReadWriteOnce"]
          storageClassName: ${envOverrides.storageClass}
          resources:
            requests:
              storage: ${envOverrides.size}
```

## Related Resources

- [Built-in Functions](./built-in-functions.md) - Functions available in templates
- [Configuration Helpers](./configuration-helpers.md) - Helper functions for configurations
- [Templating Syntax](../../user-guide/component-types/templating-syntax.md) - Expression syntax and resource control
