---
title: Environment API Reference
---

# Environment

An Environment represents a runtime context (e.g., dev, test, staging, production) where workloads are deployed and
executed. Environments define deployment targets within a DataPlane and control environment-specific configurations like
gateway settings and production flags.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

Environments are namespace-scoped resources.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Environment
metadata:
  name: <environment-name>
  namespace: <namespace>  # Namespace for grouping environments
```

### Spec Fields

| Field          | Type                            | Required | Default   | Description                                                   |
|----------------|---------------------------------|----------|-----------|---------------------------------------------------------------|
| `dataPlaneRef` | [DataPlaneRef](#dataplaneref)   | No       | -         | Reference to the DataPlane or ClusterDataPlane where this environment is deployed |
| `isProduction` | boolean                         | No       | false     | Indicates if this is a production environment                 |
| `gateway`      | [GatewayConfig](#gatewayconfig) | No       | -         | Gateway configuration specific to this environment            |

### DataPlaneRef

Reference to a DataPlane or ClusterDataPlane where this environment is deployed.

| Field  | Type   | Required | Default      | Description                                                    |
|--------|--------|----------|--------------|----------------------------------------------------------------|
| `kind` | string | No       | `DataPlane`  | Kind of the data plane (`DataPlane` or `ClusterDataPlane`)     |
| `name` | string | Yes      | -            | Name of the data plane resource                                |

:::note DataPlaneRef Resolution
If `dataPlaneRef` is not specified, the system resolves a DataPlane using the following fallback order:
1. DataPlane named "default" in the Environment's namespace
2. ClusterDataPlane named "default"
3. First available DataPlane or ClusterDataPlane

When `dataPlaneRef` is provided, `kind` defaults to `DataPlane` if omitted. To reference a ClusterDataPlane, set `kind` explicitly to `ClusterDataPlane`.
:::

### GatewayConfig

| Field                     | Type   | Required | Default | Description                                                      |
|---------------------------|--------|----------|---------|------------------------------------------------------------------|
| `dnsPrefix`               | string | No       | ""      | DNS prefix for the environment (e.g., "dev" for dev.example.com) |
| `security.remoteJwks.uri` | string | No       | ""      | URI for remote JWKS endpoint for JWT validation                  |

### Status Fields

| Field                | Type        | Default | Description                                                   |
|----------------------|-------------|---------|---------------------------------------------------------------|
| `observedGeneration` | integer     | 0       | The generation observed by the controller                     |
| `conditions`         | []Condition | []      | Standard Kubernetes conditions tracking the environment state |

#### Condition Types

Common condition types for Environment resources:

- `Ready` - Indicates if the environment is fully provisioned and ready
- `DataPlaneConnected` - Indicates if the environment is connected to its DataPlane
- `GatewayConfigured` - Indicates if gateway configuration has been applied

## Examples

### Development Environment

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Environment
metadata:
  name: development
  namespace: default
spec:
  dataPlaneRef:
    kind: DataPlane
    name: dev-dataplane
  isProduction: false
  gateway:
    dnsPrefix: dev
    security:
      remoteJwks:
        uri: https://auth.example.com/.well-known/jwks.json
```

### Production Environment

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Environment
metadata:
  name: production
  namespace: default
spec:
  dataPlaneRef:
    kind: DataPlane
    name: prod-dataplane
  isProduction: true
  gateway:
    dnsPrefix: api
    security:
      remoteJwks:
        uri: https://auth.example.com/.well-known/jwks.json
```

### Environment with ClusterDataPlane

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Environment
metadata:
  name: staging
  namespace: default
spec:
  dataPlaneRef:
    kind: ClusterDataPlane
    name: shared-dataplane
  isProduction: false
  gateway:
    dnsPrefix: staging
```

## Annotations

Environments support the following annotations:

| Annotation                    | Description                             |
|-------------------------------|-----------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display      |
| `openchoreo.dev/description`  | Detailed description of the environment |

## Related Resources

- [DataPlane](./dataplane.md) - Kubernetes cluster hosting the environment
- [ClusterDataPlane](./clusterdataplane.md) - Cluster-scoped data plane for shared environments
- [DeploymentPipeline](./deployment-pipeline.md) - Defines promotion paths between environments
