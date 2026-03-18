---
title: Context Variables
description: Variables available in Workflow, ComponentType, and Trait templates
---

# Context Variables

This reference documents all context variables available in Workflow, ComponentType, and Trait templates.

## Workflow Variables

The following variables are available in Workflow and ClusterWorkflow `runTemplate` and `resources` templates.

### metadata

Platform-computed metadata for workflow execution.

| Field                      | Type   | Description                                                                     |
| -------------------------- | ------ | ------------------------------------------------------------------------------- |
| `metadata.workflowRunName` | string | Name of the WorkflowRun CR                                                      |
| `metadata.namespaceName`   | string | Namespace name of the WorkflowRun                                               |
| `metadata.namespace`       | string | Enforced workflow plane namespace (e.g., `workflows-default`)                   |
| `metadata.labels`          | map    | WorkflowRun labels (e.g., `openchoreo.dev/component`, `openchoreo.dev/project`) |

**Usage:**

```yaml
metadata:
  name: ${metadata.workflowRunName}
  namespace: ${metadata.namespace}
spec:
  arguments:
    parameters:
      - name: component-name
        value: ${metadata.labels['openchoreo.dev/component']}
      - name: project-name
        value: ${metadata.labels['openchoreo.dev/project']}
```

### parameters

Developer-provided values from `WorkflowRun.spec.workflow.parameters`, with schema defaults from the Workflow's `openAPIV3Schema` applied.

```yaml
# Access parameters defined in the Workflow schema
- name: git-repo
  value: ${parameters.repository.url}
- name: branch
  value: ${parameters.repository.revision.branch}
```

### externalRefs

Resolved external CR specs, keyed by the `id` declared in the Workflow's `externalRefs`. Only present when the Workflow declares external references. See [ExternalRef](../api/platform/workflow.md#externalref).

```yaml
# Access resolved SecretReference spec
template:
  type: ${externalRefs['git-secret-reference'].spec.template.type}

# Iterate over secret data
data: |
  ${externalRefs['git-secret-reference'].spec.data.map(secret, {
    "secretKey": secret.secretKey,
    "remoteRef": {
      "key": secret.remoteRef.key,
      "property": has(secret.remoteRef.property) && secret.remoteRef.property != "" ? secret.remoteRef.property : oc_omit()
    }
  })}
```

---

## ComponentType Variables

The following variables are available in ComponentType resource templates.

### metadata

Platform-computed metadata for resource generation.

| Field                         | Type   | Description                                                         |
| ----------------------------- | ------ | ------------------------------------------------------------------- |
| `metadata.name`               | string | Base name for generated resources (e.g., `my-service-dev-a1b2c3d4`) |
| `metadata.namespace`          | string | Target namespace for resources                                      |
| `metadata.componentNamespace` | string | Target namespace of the component                                   |
| `metadata.componentName`      | string | Name of the component                                               |
| `metadata.componentUID`       | string | Unique identifier of the component                                  |
| `metadata.projectName`        | string | Name of the project                                                 |
| `metadata.projectUID`         | string | Unique identifier of the project                                    |
| `metadata.environmentName`    | string | Name of the environment (e.g., `development`, `production`)         |
| `metadata.environmentUID`     | string | Unique identifier of the environment                                |
| `metadata.dataPlaneName`      | string | Name of the data plane                                              |
| `metadata.dataPlaneUID`       | string | Unique identifier of the data plane                                 |
| `metadata.labels`             | map    | Common labels to add to all resources                               |
| `metadata.annotations`        | map    | Common annotations to add to all resources                          |
| `metadata.podSelectors`       | map    | Platform-injected selectors for pod identity                        |

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

### environmentConfigs

Environment-specific configuration from `ReleaseBinding.spec.componentTypeEnvironmentConfigs`, pruned to the ComponentType's `environmentConfigs` schema with defaults applied. Use for values that vary per environment (resources, replicas, etc.).

```yaml
# Access environment-specific values
replicas: ${environmentConfigs.replicas}
resources:
  limits:
    cpu: ${environmentConfigs.resources.cpu}
    memory: ${environmentConfigs.resources.memory}
```

### workload

Workload specification from the Workload resource.

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
| `workload.endpoints[name].schema`     | object            | Optional API schema definition                                            |

**Usage:**

```yaml
containers:
  - name: main
    image: ${workload.container.image}
    command: ${workload.container.command}
    args: ${workload.container.args}

# Iterate over endpoints with external visibility
- id: httproute-external
  forEach: '${workload.endpoints.transformList(name, ep, ("external" in ep.visibility && ep.type in ["HTTP", "GraphQL", "Websocket"]) ? [name] : []).flatten()}'
  var: endpoint
  template:
    # ...
    spec:
      backendRefs:
        - name: ${metadata.componentName}
          port: ${workload.endpoints[endpoint].port}
```

### configurations

Configuration and secret references extracted from the workload container.

| Field                          | Type     | Description                                              |
| ------------------------------ | -------- | -------------------------------------------------------- |
| `configurations.configs.envs`  | []object | Environment variable configs (each has `name`, `value`)  |
| `configurations.configs.files` | []object | File configs (each has `name`, `mountPath`, `value`)     |
| `configurations.secrets.envs`  | []object | Secret env vars (each has `name`, `value`, `remoteRef`)  |
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

| Field                         | Type   | Description                                         |
| ----------------------------- | ------ | --------------------------------------------------- |
| `dataplane.secretStore`       | string | Name of the ClusterSecretStore for external secrets |
| `dataplane.publicVirtualHost` | string | Public virtual host for external access             |

**Usage:**

```yaml
# ExternalSecret configuration
spec:
  secretStoreRef:
    name: ${dataplane.secretStore}
    kind: ClusterSecretStore
```

### gateway

Ingress gateway configuration for routing traffic to components.

| Field                                | Type   | Description                                                        |
| ------------------------------------ | ------ | ------------------------------------------------------------------ |
| `gateway.ingress.external.name`      | string | Name of the external ingress Gateway resource                      |
| `gateway.ingress.external.namespace` | string | Namespace of the external ingress Gateway resource                 |
| `gateway.ingress.external.http`      | object | HTTP listener config (optional; has `.host`)                       |
| `gateway.ingress.external.https`     | object | HTTPS listener config (optional; has `.host`)                      |
| `gateway.ingress.internal.name`      | string | Name of the internal ingress Gateway resource                      |
| `gateway.ingress.internal.namespace` | string | Namespace of the internal ingress Gateway resource                 |
| `gateway.ingress.internal.http`      | object | HTTP listener config for internal gateway (optional; has `.host`)  |
| `gateway.ingress.internal.https`     | object | HTTPS listener config for internal gateway (optional; has `.host`) |

**Usage:**

```yaml
# HTTPRoute targeting the external gateway
parentRefs:
  - name: ${gateway.ingress.external.name}
    namespace: ${gateway.ingress.external.namespace}

# Build hostnames from available HTTP/HTTPS listeners
hostnames: |
  ${[gateway.ingress.external.?http, gateway.ingress.external.?https]
    .filter(g, g.hasValue()).map(g, g.value().host).distinct()
    .map(h, oc_dns_label(endpoint, metadata.componentName, metadata.environmentName, metadata.componentNamespace) + "." + h)}
```

## Trait Variables

Traits have access to all the same variables as ComponentTypes, plus trait-specific variables.

### trait

Trait-specific metadata.

| Field                | Type   | Description                                                      |
| -------------------- | ------ | ---------------------------------------------------------------- |
| `trait.name`         | string | Name of the trait (e.g., `persistent-volume`)                    |
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

### environmentConfigs (Traits)

Environment-specific configuration from `ReleaseBinding.spec.traitEnvironmentConfigs[instanceName]`, pruned to the Trait's `environmentConfigs` schema with defaults applied.

```yaml
# Access environment-specific trait values
resources:
  requests:
    storage: ${environmentConfigs.size}
storageClassName: ${environmentConfigs.storageClass}
```

## Variable Availability Summary

| Variable                  | Workflow | ComponentType | Trait creates | Trait patches    |
| ------------------------- | -------- | ------------- | ------------- | ---------------- |
| `metadata.*`              | Yes      | Yes           | Yes           | Yes              |
| `parameters`              | Yes      | Yes           | Yes           | Yes              |
| `externalRefs`            | Yes      | No            | No            | No               |
| `environmentConfigs`      | No       | Yes           | Yes           | Yes              |
| `workload.container.*`    | No       | Yes           | No            | No               |
| `workload.endpoints.*`    | No       | Yes           | No            | No               |
| `configurations.*`        | No       | Yes           | No            | No               |
| `dataplane.*`             | No       | Yes           | Yes           | Yes              |
| `gateway.*`               | No       | Yes           | Yes           | Yes              |
| `trait.*`                 | No       | No            | Yes           | Yes              |
| `resource` (patch target) | No       | No            | No            | Yes (in `where`) |

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
          replicas: ${environmentConfigs.replicas}
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
          storageClassName: ${environmentConfigs.storageClass}
          resources:
            requests:
              storage: ${environmentConfigs.size}
```

## Related Resources

- [Built-in Functions](./built-in-functions.md) - Functions available in templates
- [Configuration Helpers](./configuration-helpers.md) - Helper functions for configurations
- [Templating Syntax](../../user-guide/component-types/templating-syntax.md) - Expression syntax and resource control
