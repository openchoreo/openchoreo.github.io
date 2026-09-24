---
title: Helper Functions
description: CEL extension functions for working with configurations, dependencies, and workloads in ComponentType templates
---

# Helper Functions

Helper functions are CEL extension functions that provide convenient methods to work with context objects in your templates. They reduce boilerplate and make templates more readable.

## Configuration Helpers

These helpers simplify working with container configurations, environment variables, and file mounts. All configuration helper functions are available on the `configurations` context object.

### toContainerEnvFrom()

Generates an `envFrom` array for the container configuration, creating `configMapRef` and `secretRef` entries based on available environment variables.

**Parameters:** None

**Returns:** List of envFrom entries, each containing either:

| Field          | Type | Description                                                        |
| -------------- | ---- | ------------------------------------------------------------------ |
| `configMapRef` | map  | Reference to ConfigMap (only present if container has config envs) |
| `secretRef`    | map  | Reference to Secret (only present if container has secret envs)    |

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

| Field          | Type   | Description                                                                             |
| -------------- | ------ | --------------------------------------------------------------------------------------- |
| `container`    | string | Name of the container                                                                   |
| `resourceName` | string | Generated ConfigMap name (componentName-environmentName-containerName-env-configs-hash) |
| `envs`         | array  | List of environment variable objects with `name` and `value`                            |

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

| Field          | Type   | Description                                                                                  |
| -------------- | ------ | -------------------------------------------------------------------------------------------- |
| `container`    | string | Name of the container                                                                        |
| `resourceName` | string | Generated ExternalSecret name (componentName-environmentName-containerName-env-secrets-hash) |
| `envs`         | array  | List of secret environment variable objects with `name` and `remoteRef`                      |

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

| Field          | Type   | Description                                                                                                |
| -------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| `name`         | string | File name                                                                                                  |
| `mountPath`    | string | Mount path                                                                                                 |
| `value`        | string | File content (empty string if using remoteRef)                                                             |
| `resourceName` | string | Generated Kubernetes-compliant resource name (componentName-environmentName-containerName-config-fileName) |
| `remoteRef`    | map    | Remote reference (only present if the file uses a secret reference)                                        |

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

| Field          | Type   | Description                                                                                                |
| -------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| `name`         | string | File name                                                                                                  |
| `mountPath`    | string | Mount path                                                                                                 |
| `value`        | string | File content (empty string if using remoteRef)                                                             |
| `resourceName` | string | Generated Kubernetes-compliant resource name (componentName-environmentName-containerName-secret-fileName) |
| `remoteRef`    | map    | Remote reference (only present if the file uses a secret reference)                                        |

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

| Field       | Type   | Description                                  |
| ----------- | ------ | -------------------------------------------- |
| `name`      | string | Volume name (`file-mount-{hash}` format)     |
| `mountPath` | string | Full mount path (mountPath + "/" + filename) |
| `subPath`   | string | Filename to mount as subPath                 |

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

| Field       | Type   | Description                                                  |
| ----------- | ------ | ------------------------------------------------------------ |
| `name`      | string | Volume name (generated using hash of mountPath and filename) |
| `configMap` | map    | ConfigMap volume source (only present for config files)      |
| `secret`    | map    | Secret volume source (only present for secret files)         |

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

## Dependency Helpers

These helpers simplify injecting resolved dependency environment variables into containers. Available on the `dependencies` context object.

### dependencies.toContainerEnvs()

Returns the merged flat list of all dependency environment variables. This is a compile-time macro that rewrites to `dependencies.envVars` and is the recommended way to inject dependency env vars into containers.

**Parameters:** None

**Returns:** List of environment variable objects, each containing:

| Field   | Type   | Description                                             |
| ------- | ------ | ------------------------------------------------------- |
| `name`  | string | Environment variable name (from Workload `envBindings`) |
| `value` | string | Resolved value (e.g., `http://svc-a:8080/api`)          |

**Examples:**

```yaml
# Using helper function
spec:
  template:
    spec:
      containers:
        - name: main
          image: ${workload.container.image}
          env: ${dependencies.toContainerEnvs()}

# Equivalent manual implementation
env: ${dependencies.envVars}
```

**Notes:**

- Each dependency item in `dependencies.items[]` has its own `envVars` list; this helper merges all of them into a single flat list
- If there are no dependencies, returns an empty list `[]`
- For per-dependency details (target component, endpoint, visibility), use `dependencies.items` directly

## Workload Helpers

These helpers simplify working with endpoint configurations. Available on the `workload` context object.

### workload.toServicePorts()

Converts a workload's endpoints into Kubernetes Service port definitions, automatically mapping endpoint configurations to the proper service port format.

**Parameters:** None (operates on workload.endpoints)

**Returns:** List of service port objects, each containing:

| Field        | Type    | Description                                                                 |
| ------------ | ------- | --------------------------------------------------------------------------- |
| `name`       | string  | Port name (derived from endpoint name, DNS-compliant)                       |
| `port`       | integer | Service port number (from endpoint.port)                                    |
| `targetPort` | integer | Target port on pods (from endpoint.targetPort or defaults to endpoint.port) |
| `protocol`   | string  | Protocol (derived from endpoint.type, defaults to "TCP")                    |

**Endpoint Type Mapping:**

| Endpoint Type     | Service Protocol |
| ----------------- | ---------------- |
| `HTTP`, `GraphQL` | `TCP`            |
| `gRPC`            | `TCP`            |
| `Websocket`       | `TCP`            |
| `TCP`             | `TCP`            |
| `UDP`             | `UDP`            |

**Examples:**

```yaml
# Service resource using helper function
- id: service
  template:
    apiVersion: v1
    kind: Service
    metadata:
      name: ${metadata.componentName}
      namespace: ${metadata.namespace}
    spec:
      selector: ${metadata.podSelectors}
      ports: ${workload.toServicePorts()}

# Equivalent manual implementation
ports: |
  ${workload.endpoints.map(name, ep, {
    "name": oc_dns_label(name),
    "port": ep.port,
    "targetPort": has(ep.targetPort) ? ep.targetPort : ep.port,
    "protocol": ep.type in ["UDP"] ? "UDP" : "TCP"
  })}
```

**Input Requirements:**

- `workload.endpoints` must be a map where each key is an endpoint name
- Each endpoint must have a `port` field (integer, 1-65535)
- Each endpoint should have a `type` field for protocol mapping
- Each endpoint may have a `targetPort` field (integer, defaults to `port` value)
- Each endpoint may have a `visibility` field (array of visibility levels: `external`, `internal`, `namespace`, `project`)
- Each endpoint may have `displayName` and `basePath` fields for documentation and routing

**Behavior:**

- Filters out any endpoints without a valid `port` field
- Generates DNS-compliant port names using `oc_dns_label()`
- Maps endpoint types to appropriate Kubernetes service protocols
- Uses `targetPort` if specified, otherwise defaults to `port` value
- Includes all endpoints regardless of visibility level (visibility is handled separately in routing resources)
- Returns empty list if no valid endpoints are found

**Edge Cases:**

- Empty `workload.endpoints`: Returns empty array `[]`
- Endpoint missing `port`: Endpoint is skipped
- Endpoint missing `type`: Defaults to "TCP" protocol
- Endpoint missing `targetPort`: Uses `port` value for `targetPort`
- Invalid endpoint names: Converted to DNS-compliant format using `oc_dns_label()`

**Usage in Templates:**

```yaml
# Basic service
spec:
  selector: ${metadata.podSelectors}
  ports: ${workload.toServicePorts()}

# Service with additional ports
spec:
  selector: ${metadata.podSelectors}
  ports: |
    ${workload.toServicePorts() + [
      {"name": "metrics", "port": 9090, "targetPort": 9090}
    ]}

# Conditional service creation
- id: service
  includeWhen: ${size(workload.endpoints) > 0}
  template:
    apiVersion: v1
    kind: Service
    metadata:
      name: ${metadata.componentName}
    spec:
      ports: ${workload.toServicePorts()}

# HTTPRoute using endpoint details directly (not toServicePorts())
- id: httproute-external
  forEach: '${workload.endpoints.transformList(name, ep, ("external" in ep.visibility) ? [name] : []).flatten()}'
  var: endpoint
  template:
    apiVersion: gateway.networking.k8s.io/v1
    kind: HTTPRoute
    metadata:
      name: ${oc_generate_name(metadata.componentName, endpoint)}
    spec:
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
                  replacePrefixMatch: '${workload.endpoints[endpoint].?basePath.orValue("/")}'
          backendRefs:
            - name: ${metadata.componentName}
              port: ${workload.endpoints[endpoint].port}
```

**Notes:**

- This helper only works with Service resources; for HTTPRoute backend references, use `workload.endpoints[endpointName].port` directly
- Port names are automatically generated and may differ from original endpoint names to ensure DNS compliance
- The helper maintains a consistent mapping between endpoint configurations and service definitions
- **Visibility handling**: The `visibility` attribute is not processed by this helper. Use visibility in routing resources (HTTPRoute, Gateway) to control endpoint exposure:
  - `external`: Accessible from outside the cluster
  - `internal`: Accessible within the cluster but not externally
  - `namespace`: Accessible only within the same namespace
  - `project`: Accessible only within the same project (implicit for all endpoints)
- **BasePath usage**: For HTTPRoute path rewriting, use `workload.endpoints[endpointName].basePath` to configure URL path prefixes
- **TargetPort distinction**: `targetPort` (container listening port) vs `port` (service port) - the helper uses the correct values for each

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
                  env: ${dependencies.toContainerEnvs()}
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
- [Context Variables](./context-variables.md) - Complete workload context reference
