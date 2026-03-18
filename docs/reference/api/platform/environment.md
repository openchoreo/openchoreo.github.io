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
  namespace: <namespace> # Namespace for grouping environments
```

### Spec Fields

| Field          | Type                          | Required | Default | Description                                                                       |
| -------------- | ----------------------------- | -------- | ------- | --------------------------------------------------------------------------------- |
| `dataPlaneRef` | [DataPlaneRef](#dataplaneref) | No       | -       | Reference to the DataPlane or ClusterDataPlane where this environment is deployed |
| `isProduction` | boolean                       | No       | false   | Indicates if this is a production environment                                     |
| `gateway`      | [GatewaySpec](#gatewayspec)   | No       | -       | Gateway configuration specific to this environment                                |

### DataPlaneRef

Reference to a DataPlane or ClusterDataPlane where this environment is deployed.

| Field  | Type   | Required | Default | Description                                                |
| ------ | ------ | -------- | ------- | ---------------------------------------------------------- |
| `kind` | string | Yes      | -       | Kind of the data plane (`DataPlane` or `ClusterDataPlane`) |
| `name` | string | Yes      | -       | Name of the data plane resource                            |

:::note DataPlaneRef Resolution
If `dataPlaneRef` is not specified, the system resolves a DataPlane using the following fallback order:

1. DataPlane named "default" in the Environment's namespace
2. ClusterDataPlane named "default"
3. First available DataPlane or ClusterDataPlane

When `dataPlaneRef` is provided, both `kind` and `name` are required. Set `kind` to `DataPlane` or `ClusterDataPlane`.
:::

### GatewaySpec

Gateway configuration for the environment.

| Field     | Type                                      | Required | Default | Description                   |
| --------- | ----------------------------------------- | -------- | ------- | ----------------------------- |
| `ingress` | [GatewayNetworkSpec](#gatewaynetworkspec) | No       | -       | Ingress gateway configuration |
| `egress`  | [GatewayNetworkSpec](#gatewaynetworkspec) | No       | -       | Egress gateway configuration  |

### GatewayNetworkSpec

| Field      | Type                                        | Required | Default | Description                             |
| ---------- | ------------------------------------------- | -------- | ------- | --------------------------------------- |
| `external` | [GatewayEndpointSpec](#gatewayendpointspec) | No       | -       | External gateway endpoint configuration |
| `internal` | [GatewayEndpointSpec](#gatewayendpointspec) | No       | -       | Internal gateway endpoint configuration |

### GatewayEndpointSpec

| Field       | Type                                        | Required | Default | Description                                  |
| ----------- | ------------------------------------------- | -------- | ------- | -------------------------------------------- |
| `name`      | string                                      | Yes      | -       | Name of the Kubernetes Gateway resource      |
| `namespace` | string                                      | Yes      | -       | Namespace of the Kubernetes Gateway resource |
| `http`      | [GatewayListenerSpec](#gatewaylistenerspec) | No       | -       | HTTP listener configuration                  |
| `https`     | [GatewayListenerSpec](#gatewaylistenerspec) | No       | -       | HTTPS listener configuration                 |
| `tls`       | [GatewayListenerSpec](#gatewaylistenerspec) | No       | -       | TLS listener configuration                   |

### GatewayListenerSpec

| Field          | Type    | Required | Default | Description                         |
| -------------- | ------- | -------- | ------- | ----------------------------------- |
| `listenerName` | string  | No       | -       | Name of the listener on the Gateway |
| `port`         | integer | Yes      | -       | Port number for the listener        |
| `host`         | string  | Yes      | -       | Hostname for the listener           |

### Status Fields

| Field                | Type        | Default | Description                                                   |
| -------------------- | ----------- | ------- | ------------------------------------------------------------- |
| `observedGeneration` | integer     | 0       | The generation observed by the controller                     |
| `conditions`         | []Condition | []      | Standard Kubernetes conditions tracking the environment state |

#### Condition Types

Common condition types for Environment resources:

- `Ready` - Indicates if the environment is fully provisioned and ready
- `DataPlaneConnected` - Indicates if the environment is connected to its DataPlane
- `GatewayConfigured` - Indicates if gateway configuration has been applied

## Examples

### Development Environment

A simple development environment with just a DataPlane reference:

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
```

### Production Environment

A production environment with gateway configuration:

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
    ingress:
      external:
        name: external-gateway
        namespace: gateway-system
        https:
          listenerName: https
          port: 443
          host: api.example.com
      internal:
        name: internal-gateway
        namespace: gateway-system
        http:
          listenerName: http
          port: 80
          host: internal.example.com
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
```

## Annotations

Environments support the following annotations:

| Annotation                    | Description                             |
| ----------------------------- | --------------------------------------- |
| `openchoreo.dev/display-name` | Human-readable name for UI display      |
| `openchoreo.dev/description`  | Detailed description of the environment |

## Related Resources

- [DataPlane](./dataplane.md) - Kubernetes cluster hosting the environment
- [ClusterDataPlane](./clusterdataplane.md) - Cluster-scoped data plane for shared environments
- [DeploymentPipeline](./deployment-pipeline.md) - Defines promotion paths between environments
