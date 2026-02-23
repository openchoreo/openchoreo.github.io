---
title: Configuration Helpers
---

# Configuration Helper Functions

Configuration helpers are CEL extension functions that provide convenient methods to work with the `configurations` object in your templates. They help reduce boilerplate code and make templates more readable and maintainable.

## Overview

These helpers simplify working with container configurations, environment variables, and file mounts. All configuration helper functions are available on the `configurations` context object when working with ComponentType templates.

## Helper Functions Reference

### toContainerEnvFrom()

Generates an `envFrom` array for the container configuration, creating `configMapRef` and `secretRef` entries based on available environment variables.

**Parameters:** None

**Returns:** List of envFrom entries, each containing either:

| Field | Type | Description |
|-------|------|-------------|
| `configMapRef` | map | Reference to ConfigMap (only present if container has config envs) |
| `secretRef` | map | Reference to Secret (only present if container has secret envs) |

**Examples:**

```yaml
# Using helper function
spec:
  template:
    spec:
      containers:
        - name: main
          image: myapp:latest
          envFrom: ${configurations.toContainerEnvFrom()}

# Equivalent manual implementation
envFrom: |
  ${(has(configurations.configs.envs) && configurations.configs.envs.size() > 0 ?
    [{
      "configMapRef": {
        "name": oc_generate_name(metadata.name, "env-configs")
      }
    }] : []) +
  (has(configurations.secrets.envs) && configurations.secrets.envs.size() > 0 ?
    [{
      "secretRef": {
        "name": oc_generate_name(metadata.name, "env-secrets")
      }
    }] : [])}

# Combine with additional envFrom entries
envFrom: |
  ${configurations.toContainerEnvFrom() +
    [{"configMapRef": {"name": "external-config"}}]}
```

### toConfigEnvsByContainer()

Generates a list of objects for creating ConfigMaps from environment variables. Each object contains the container name, generated resource name, and environment variables.

**Parameters:** None

**Returns:** List of objects, each containing:

| Field | Type | Description |
|-------|------|-------------|
| `container` | string | Name of the container |
| `resourceName` | string | Generated ConfigMap name (componentName-environmentName-containerName-env-configs-hash) |
| `envs` | array | List of environment variable objects with `name` and `value` |

**Examples:**

```yaml
# Using helper function
- id: env-config
  forEach: ${configurations.toConfigEnvsByContainer()}
  var: envConfig
  template:
    apiVersion: v1
    kind: ConfigMap
    metadata:
      name: ${envConfig.resourceName}
      namespace: ${metadata.namespace}
    data: |
      ${envConfig.envs.transformMapEntry(index, env, {env.name: env.value})}

# Equivalent manual implementation
- id: env-config
  forEach: |
    ${configurations.transformList(containerName, cfg,
      {
        "container": containerName,
        "resourceName": oc_generate_name(metadata.name, containerName, "env-configs"),
        "envs": cfg.configs.envs
      }
    )}
  var: envConfig
  template:
    apiVersion: v1
    kind: ConfigMap
    metadata:
      name: ${envConfig.resourceName}
      namespace: ${metadata.namespace}
    data: |
      ${envConfig.envs.transformMapEntry(index, env, {env.name: env.value})}
```

**Notes:**
- Only returns entries for containers that have config environment variables
- Skips containers with no config envs or only secret envs
- Generated resource names include container name and a hash for uniqueness

### toSecretEnvsByContainer()

Generates a list of objects for creating ExternalSecrets from secret environment variables. Each object contains the container name, generated resource name, and secret environment variables.

**Parameters:** None

**Returns:** List of objects, each containing:

| Field | Type | Description |
|-------|------|-------------|
| `container` | string | Name of the container |
| `resourceName` | string | Generated ExternalSecret name (componentName-environmentName-containerName-env-secrets-hash) |
| `envs` | array | List of secret environment variable objects with `name` and `remoteRef` |

**Examples:**

```yaml
# Using helper function
- id: secret-env-external
  forEach: ${configurations.toSecretEnvsByContainer()}
  var: secretEnv
  template:
    apiVersion: external-secrets.io/v1
    kind: ExternalSecret
    metadata:
      name: ${secretEnv.resourceName}
      namespace: ${metadata.namespace}
    spec:
      refreshInterval: 15s
      secretStoreRef:
        name: ${dataplane.secretStore}
        kind: ClusterSecretStore
      target:
        name: ${secretEnv.resourceName}
        creationPolicy: Owner
      data: |
        ${secretEnv.envs.map(secret, {
          "secretKey": secret.name,
          "remoteRef": {
            "key": secret.remoteRef.key,
            "property": has(secret.remoteRef.property) ? secret.remoteRef.property : oc_omit()
          }
        })}

# Equivalent manual implementation
- id: secret-env-external
  forEach: |
    ${configurations.transformList(containerName, cfg,
      {
        "container": containerName,
        "resourceName": oc_generate_name(metadata.name, containerName, "env-secrets"),
        "envs": cfg.secrets.envs
      }
    )}
  var: secretEnv
  template:
    apiVersion: external-secrets.io/v1
    kind: ExternalSecret
    metadata:
      name: ${secretEnv.resourceName}
      namespace: ${metadata.namespace}
    spec:
      refreshInterval: 15s
      secretStoreRef:
        name: ${dataplane.secretStore}
        kind: ClusterSecretStore
      target:
        name: ${secretEnv.resourceName}
        creationPolicy: Owner
      data: |
        ${secretEnv.envs.map(secret, {
          "secretKey": secret.name,
          "remoteRef": {
            "key": secret.remoteRef.key,
            "property": has(secret.remoteRef.property) ? secret.remoteRef.property : oc_omit()
          }
        })}
```

**Notes:**
- Only returns entries for containers that have secret environment variables
- Skips containers with no secret envs or only config envs
- Generated resource names include container name and a hash for uniqueness

### toConfigFileList()

Flattens `configs.files` from all containers into a single list. Each file includes a generated `resourceName` for creating ConfigMaps.

**Parameters:** None

**Returns:** List of file objects, each containing:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | File name |
| `mountPath` | string | Mount path |
| `value` | string | File content (empty string if using remoteRef) |
| `resourceName` | string | Generated Kubernetes-compliant resource name (componentName-environmentName-containerName-config-fileName) |
| `remoteRef` | map | Remote reference (only present if the file uses a secret reference) |

**Examples:**

```yaml
# Generate a ConfigMap for each config file
- id: file-configs
  forEach: ${configurations.toConfigFileList()}
  var: config
  template:
    apiVersion: v1
    kind: ConfigMap
    metadata:
      name: ${config.resourceName}
      namespace: ${metadata.namespace}
    data:
      ${config.name}: |
        ${config.value}
```

**Equivalent CEL expression:**

If you need additional fields (e.g., `container` name) or different behavior, use the underlying data directly:

```yaml
forEach: |
  ${configurations.transformList(containerName, cfg,
    cfg.configs.files.map(f, oc_merge(f, {
      "container": containerName,
      "resourceName": oc_generate_name(metadata.name, containerName, "config", f.name.replace(".", "-"))
    }))
  ).flatten()}
```

### toSecretFileList()

Flattens `secrets.files` from all containers into a single list. Each file includes a generated `resourceName` for creating Secrets or ExternalSecrets.

**Parameters:** None

**Returns:** List of file objects, each containing:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | File name |
| `mountPath` | string | Mount path |
| `value` | string | File content (empty string if using remoteRef) |
| `resourceName` | string | Generated Kubernetes-compliant resource name (componentName-environmentName-containerName-secret-fileName) |
| `remoteRef` | map | Remote reference (only present if the file uses a secret reference) |

**Examples:**

```yaml
# Generate ExternalSecrets for secret files
- id: file-secrets
  forEach: ${configurations.toSecretFileList()}
  var: secret
  includeWhen: ${has(secret.remoteRef)}
  template:
    apiVersion: external-secrets.io/v1beta1
    kind: ExternalSecret
    metadata:
      name: ${secret.resourceName}
      namespace: ${metadata.namespace}
    spec:
      secretStoreRef:
        name: ${dataplane.secretStore}
        kind: ClusterSecretStore
      target:
        name: ${secret.resourceName}
        creationPolicy: Owner
      data:
        - secretKey: ${secret.name}
          remoteRef:
            key: ${secret.remoteRef.key}
            property: ${secret.remoteRef.property}

# Generate Secrets for files with inline values
- id: inline-file-secrets
  forEach: ${configurations.toSecretFileList()}
  var: secret
  includeWhen: ${!has(secret.remoteRef) && secret.value != ""}
  template:
    apiVersion: v1
    kind: Secret
    metadata:
      name: ${secret.resourceName}
      namespace: ${metadata.namespace}
    data:
      ${secret.name}: ${base64.encode(secret.value)}
```

**Equivalent CEL expression:**

```yaml
forEach: |
  ${configurations.transformList(containerName, cfg,
    cfg.secrets.files.map(f, oc_merge(f, {
      "container": containerName,
      "resourceName": oc_generate_name(metadata.name, containerName, "secret", f.name.replace(".", "-"))
    }))
  ).flatten()}
```

### toContainerVolumeMounts()

Generates a `volumeMounts` array for the container's config and secret files.

**Parameters:** None

**Returns:** List of volumeMount entries, each containing:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Volume name (`file-mount-{hash}` format) |
| `mountPath` | string | Full mount path (mountPath + "/" + filename) |
| `subPath` | string | Filename to mount as subPath |

**Examples:**

```yaml
# Using helper function
spec:
  template:
    spec:
      containers:
        - name: main
          image: myapp:latest
          volumeMounts: ${configurations.toContainerVolumeMounts()}

# Equivalent manual implementation
volumeMounts: |
  ${has(configurations.configs.files) && configurations.configs.files.size() > 0 || has(configurations.secrets.files) && configurations.secrets.files.size() > 0 ?
    (has(configurations.configs.files) && configurations.configs.files.size() > 0 ?
      configurations.configs.files.map(f, {
        "name": "file-mount-"+oc_hash(f.mountPath+"/"+f.name),
        "mountPath": f.mountPath+"/"+f.name ,
        "subPath": f.name
      }) : []) +
    (has(configurations.secrets.files) && configurations.secrets.files.size() > 0 ?
      configurations.secrets.files.map(f, {
        "name": "file-mount-"+oc_hash(f.mountPath+"/"+f.name),
        "mountPath": f.mountPath+"/"+f.name,
        "subPath": f.name
      }) : [])
  : oc_omit()}

# Combine with additional volume mounts
volumeMounts: |
  ${configurations.toContainerVolumeMounts() +
    [{"name": "cache", "mountPath": "/cache"}]}
```

### toVolumes()

Generates a `volumes` array for all containers' config and secret files.

**Parameters:** None

**Returns:** List of volume entries, each containing:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Volume name (generated using hash of mountPath and filename) |
| `configMap` | map | ConfigMap volume source (only present for config files) |
| `secret` | map | Secret volume source (only present for secret files) |

**Examples:**

```yaml
# Using helper function
spec:
  template:
    spec:
      containers:
        - name: main
          image: myapp:latest
          volumeMounts: ${configurations.toContainerVolumeMounts()}
      volumes: ${configurations.toVolumes()}

# Equivalent manual implementation
volumes: |
  ${has(configurations.configs.files) && configurations.configs.files.size() > 0 || has(configurations.secrets.files) && configurations.secrets.files.size() > 0 ?
    (has(configurations.configs.files) && configurations.configs.files.size() > 0 ?
      configurations.configs.files.map(f, {
        "name": "file-mount-"+oc_hash(f.mountPath+"/"+f.name),
        "configMap": {
          "name": oc_generate_name(metadata.name, "config", f.name).replace(".", "-")
        }
      }) : []) +
    (has(configurations.secrets.files) && configurations.secrets.files.size() > 0 ?
      configurations.secrets.files.map(f, {
        "name": "file-mount-"+oc_hash(f.mountPath+"/"+f.name),
        "secret": {
          "secretName": oc_generate_name(metadata.name, "secret", f.name).replace(".", "-")
        }
      }) : [])
  : oc_omit()}

# Combine with inline volumes
volumes: |
  ${configurations.toVolumes() +
    [{"name": "extra-volume", "emptyDir": {}}]}
```

## Common Usage Patterns

### Complete Deployment with Configurations

```yaml
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
        spec:
          replicas: ${parameters.replicas}
          selector:
            matchLabels: ${metadata.podSelectors}
          template:
            metadata:
              labels: ${oc_merge(metadata.labels, metadata.podSelectors)}
            spec:
              containers:
                - name: main
                  image: ${workload.container.image}
                  envFrom: ${configurations.toContainerEnvFrom()}
                  volumeMounts: ${configurations.toContainerVolumeMounts()}
              volumes: ${configurations.toVolumes()}

    # Generate ConfigMaps for environment variables
    - id: env-configs
      forEach: ${configurations.toConfigEnvsByContainer()}
      var: envConfig
      template:
        apiVersion: v1
        kind: ConfigMap
        metadata:
          name: ${envConfig.resourceName}
          namespace: ${metadata.namespace}
        data: |
          ${envConfig.envs.transformMapEntry(i, e, {e.name: e.value})}

    # Generate ExternalSecrets for secret environment variables
    - id: env-secrets
      forEach: ${configurations.toSecretEnvsByContainer()}
      var: secretEnv
      template:
        apiVersion: external-secrets.io/v1
        kind: ExternalSecret
        metadata:
          name: ${secretEnv.resourceName}
          namespace: ${metadata.namespace}
        spec:
          refreshInterval: 15s
          secretStoreRef:
            name: ${dataplane.secretStore}
            kind: ClusterSecretStore
          target:
            name: ${secretEnv.resourceName}
            creationPolicy: Owner
          data: |
            ${secretEnv.envs.map(e, {
              "secretKey": e.name,
              "remoteRef": {
                "key": e.remoteRef.key,
                "property": has(e.remoteRef.property) ? e.remoteRef.property : oc_omit()
              }
            })}

    # Generate ConfigMaps for config files
    - id: config-files
      forEach: ${configurations.toConfigFileList()}
      var: config
      template:
        apiVersion: v1
        kind: ConfigMap
        metadata:
          name: ${config.resourceName}
          namespace: ${metadata.namespace}
        data:
          ${config.name}: |
            ${config.value}

    # Generate ExternalSecrets for secret files
    - id: secret-files
      forEach: ${configurations.toSecretFileList()}
      var: secret
      includeWhen: ${has(secret.remoteRef)}
      template:
        apiVersion: external-secrets.io/v1beta1
        kind: ExternalSecret
        metadata:
          name: ${secret.resourceName}
          namespace: ${metadata.namespace}
        spec:
          secretStoreRef:
            name: ${dataplane.secretStore}
            kind: ClusterSecretStore
          target:
            name: ${secret.resourceName}
            creationPolicy: Owner
          data:
            - secretKey: ${secret.name}
              remoteRef:
                key: ${secret.remoteRef.key}
                property: ${secret.remoteRef.property}
```

## See Also
- [ComponentType API Reference](../api/platform/componenttype.md) - ComponentType resource documentation
