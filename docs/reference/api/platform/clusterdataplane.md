---
title: ClusterDataPlane API Reference
---

# ClusterDataPlane

A ClusterDataPlane is a cluster-scoped variant of [DataPlane](./dataplane.md) that represents a Kubernetes cluster where application workloads are deployed. Unlike the namespace-scoped DataPlane, a ClusterDataPlane is a cluster-scoped resource, making it suitable for shared infrastructure scenarios where multiple teams or organizations use the same underlying cluster.

OpenChoreo uses **agent-based communication** where the control plane communicates with the downstream cluster through a WebSocket agent running in the ClusterDataPlane cluster. The cluster agent establishes a secure WebSocket connection to the control plane's cluster gateway.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ClusterDataPlanes are cluster-scoped resources (no namespace).

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterDataPlane
metadata:
  name: <clusterdataplane-name>
```

### Spec Fields

| Field                     | Type                                  | Required | Default | Description                                                                                          |
|---------------------------|---------------------------------------|----------|---------|------------------------------------------------------------------------------------------------------|
| `planeID`                 | string                                | No       | CR name   | Identifies the logical plane this CR connects to. Must match `clusterAgent.planeId` Helm value.     |
| `clusterAgent`            | [ClusterAgentConfig](#clusteragentconfig) | Yes      | -       | Configuration for cluster agent-based communication                                                  |
| `gateway`                 | [GatewaySpec](#gatewayspec)           | Yes      | -       | API gateway configuration for this ClusterDataPlane                                                  |
| `imagePullSecretRefs`     | []string                              | No       | -       | References to SecretReference resources for image pull secrets                                       |
| `secretStoreRef`          | [SecretStoreRef](#secretstoreref)     | No       | -       | Reference to External Secrets Operator ClusterSecretStore in the ClusterDataPlane                   |
| `observabilityPlaneRef`   | [ObservabilityPlaneRef](#observabilityplaneref) | No | -    | Reference to a ClusterObservabilityPlane resource for monitoring and logging |

### PlaneID

The `planeID` identifies the logical plane this ClusterDataPlane CR connects to. Multiple ClusterDataPlane CRs can share the same `planeID` to connect to the same physical cluster while maintaining separate configurations.

**Validation Rules:**
- Maximum length: 63 characters
- Pattern: `^[a-z0-9]([-a-z0-9]*[a-z0-9])?$` (lowercase alphanumeric, hyphens allowed)
- Examples: `"prod-cluster"`, `"shared-dataplane"`, `"us-east-1"`

:::important PlaneID Consistency
The `planeID` in the ClusterDataPlane CR must match the `clusterAgent.planeId` Helm value configured during data plane installation. If not specified, it defaults to the CR name for backwards compatibility.
:::

### ClusterAgentConfig

Configuration for cluster agent-based communication with the downstream cluster. The cluster agent establishes a WebSocket connection to the control plane's cluster gateway.

| Field      | Type                    | Required | Default | Description                                                                  |
|------------|-------------------------|----------|---------|------------------------------------------------------------------------------|
| `clientCA` | [ValueFrom](#valuefrom) | Yes      | -       | CA certificate to verify the agent's client certificate (base64-encoded PEM) |

### GatewaySpec

Gateway configuration for the ClusterDataPlane.

| Field                     | Type   | Required | Default | Description                                             |
|---------------------------|--------|----------|---------|---------------------------------------------------------|
| `publicVirtualHost`       | string | Yes      | -       | Public virtual host for external traffic                |
| `organizationVirtualHost` | string | Yes      | -       | Organization-specific virtual host for internal traffic |

### SecretStoreRef

Reference to an External Secrets Operator ClusterSecretStore.

| Field  | Type   | Required | Default | Description                                              |
|--------|--------|----------|---------|----------------------------------------------------------|
| `name` | string | Yes      | -       | Name of the ClusterSecretStore in the ClusterDataPlane   |

### ObservabilityPlaneRef

Reference to a ClusterObservabilityPlane for monitoring and logging.

| Field  | Type   | Required | Default                    | Description                                                            |
|--------|--------|----------|----------------------------|------------------------------------------------------------------------|
| `kind` | string | No       | `ClusterObservabilityPlane` | Must be `ClusterObservabilityPlane`. ClusterDataPlane can only reference cluster-scoped observability planes. |
| `name` | string | Yes      | -                          | Name of the ClusterObservabilityPlane resource                         |

:::note Resolution Behavior
- ClusterDataPlane can **only** reference a `ClusterObservabilityPlane` (not a namespace-scoped `ObservabilityPlane`). This is enforced by API validation.
- If `observabilityPlaneRef` is omitted, the controller attempts to find a ClusterObservabilityPlane named "default". If no default exists, observability is not configured.
- If the referenced ClusterObservabilityPlane is not found, the controller returns an error and the ClusterDataPlane will not become ready.
:::

### ValueFrom

Common pattern for referencing secrets or providing inline values. Either `secretRef` or `value` should be specified.

| Field       | Type                                        | Required | Default | Description                                              |
|-------------|---------------------------------------------|----------|---------|----------------------------------------------------------|
| `secretRef` | [SecretKeyReference](#secretkeyreference)   | No       | -       | Reference to a secret key                                |
| `value`     | string                                      | No       | -       | Inline value (not recommended for sensitive data)        |

### SecretKeyReference

Reference to a specific key in a Kubernetes secret.

| Field       | Type   | Required | Default                   | Description                                                  |
|-------------|--------|----------|---------------------------|--------------------------------------------------------------|
| `name`      | string | Yes      | -                         | Name of the secret                                           |
| `namespace` | string | No*      | -                         | Namespace of the secret (required for cluster-scoped resources) |
| `key`       | string | Yes      | -                         | Key within the secret                                        |

### Status Fields

| Field                | Type                                                  | Default | Description                                                        |
|----------------------|-------------------------------------------------------|---------|--------------------------------------------------------------------|
| `observedGeneration` | integer                                               | 0       | The generation observed by the controller                          |
| `conditions`         | []Condition                                           | []      | Standard Kubernetes conditions tracking the ClusterDataPlane state |
| `agentConnection`    | [AgentConnectionStatus](#agentconnectionstatus)       | -       | Tracks the status of cluster agent connections                     |

#### AgentConnectionStatus

| Field                  | Type      | Default | Description                                                              |
|------------------------|-----------|---------|--------------------------------------------------------------------------|
| `connected`            | boolean   | false   | Whether any cluster agent is currently connected                         |
| `connectedAgents`      | integer   | 0       | Number of cluster agents currently connected                             |
| `lastConnectedTime`    | timestamp | -       | When an agent last successfully connected                                |
| `lastDisconnectedTime` | timestamp | -       | When the last agent disconnected                                         |
| `lastHeartbeatTime`    | timestamp | -       | When the control plane last received any communication from an agent     |
| `message`              | string    | -       | Additional information about the agent connection status                 |

#### Condition Types

Common condition types for ClusterDataPlane resources:

- `Ready` - Indicates if the ClusterDataPlane is ready to accept workloads
- `Connected` - Indicates if connection to the target cluster is established
- `GatewayProvisioned` - Indicates if the gateway has been configured

## Examples

### Basic ClusterDataPlane Configuration

This example shows a minimal ClusterDataPlane configuration.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterDataPlane
metadata:
  name: shared-dataplane
spec:
  planeID: "shared-cluster"
  clusterAgent:
    clientCA:
      secretRef:
        name: cluster-agent-ca
        namespace: openchoreo-system
        key: ca.crt
  gateway:
    publicVirtualHost: api.example.com
    organizationVirtualHost: internal.example.com
  secretStoreRef:
    name: vault-backend
```

### ClusterDataPlane with Observability

This example shows a ClusterDataPlane linked to a ClusterObservabilityPlane for monitoring and logging.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterDataPlane
metadata:
  name: production-dataplane
spec:
  planeID: "prod-cluster"
  clusterAgent:
    clientCA:
      secretRef:
        name: cluster-agent-ca
        namespace: openchoreo-system
        key: ca.crt
  gateway:
    publicVirtualHost: api.prod.example.com
    organizationVirtualHost: internal.prod.example.com
  secretStoreRef:
    name: default
  observabilityPlaneRef:
    kind: ClusterObservabilityPlane
    name: production-observability
```

## Annotations

ClusterDataPlanes support the following annotations:

| Annotation                    | Description                                  |
|-------------------------------|----------------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display           |
| `openchoreo.dev/description`  | Detailed description of the ClusterDataPlane |

## Related Resources

- [DataPlane](./dataplane.md) - Namespace-scoped variant of ClusterDataPlane
- [Environment](./environment.md) - Runtime environments deployed on DataPlanes or ClusterDataPlanes
- [ClusterBuildPlane](./clusterbuildplane.md) - Cluster-scoped build plane configuration
- [ClusterObservabilityPlane](./clusterobservabilityplane.md) - Cluster-scoped observability plane
- [Project](../application/project.md) - Applications deployed to DataPlanes
