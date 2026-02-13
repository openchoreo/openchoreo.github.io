---
title: ClusterObservabilityPlane API Reference
---

# ClusterObservabilityPlane

A ClusterObservabilityPlane is a cluster-scoped variant of [ObservabilityPlane](./observabilityplane.md) that represents the infrastructure layer responsible for collecting, storing, and analyzing observability data (metrics, logs, and traces) from OpenChoreo workloads. Unlike the namespace-scoped ObservabilityPlane, a ClusterObservabilityPlane is a cluster-scoped resource, making it suitable for shared monitoring infrastructure.

OpenChoreo uses **agent-based communication** where the control plane communicates with the observability cluster through a WebSocket agent running in the ClusterObservabilityPlane cluster. The cluster agent establishes a secure WebSocket connection to the control plane's cluster gateway.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ClusterObservabilityPlanes are cluster-scoped resources (no namespace).

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterObservabilityPlane
metadata:
  name: <clusterobservabilityplane-name>
```

### Spec Fields

| Field                     | Type                                      | Required | Default | Description                                                                                          |
|---------------------------|-------------------------------------------|----------|---------|------------------------------------------------------------------------------------------------------|
| `planeID`                 | string                                    | No       | CR name            | Identifies the logical plane this CR connects to. Must match `clusterAgent.planeId` Helm value.     |
| `clusterAgent`            | [ClusterAgentConfig](#clusteragentconfig) | Yes      | -       | Configuration for cluster agent-based communication                                                  |
| `observerURL`             | string                                    | Yes      | -       | Base URL of the Observer API in the observability plane cluster                                     |

### PlaneID

The `planeID` identifies the logical plane this ClusterObservabilityPlane CR connects to. Multiple ClusterObservabilityPlane CRs can share the same `planeID` to connect to the same physical cluster while maintaining separate configurations.

**Validation Rules:**
- Maximum length: 63 characters
- Pattern: `^[a-z0-9]([-a-z0-9]*[a-z0-9])?$` (lowercase alphanumeric, hyphens allowed)
- Examples: `"shared-obs"`, `"monitoring-cluster"`, `"eu-central-1"`

:::important PlaneID Consistency
The `planeID` in the ClusterObservabilityPlane CR must match the `clusterAgent.planeId` Helm value configured during observability plane installation. If not specified, it defaults to the CR name for backwards compatibility.
:::

### ClusterAgentConfig

Configuration for cluster agent-based communication with the observability cluster. The cluster agent establishes a WebSocket connection to the control plane's cluster gateway.

| Field      | Type                    | Required | Default | Description                                                                  |
|------------|-------------------------|----------|---------|------------------------------------------------------------------------------|
| `clientCA` | [ValueFrom](#valuefrom) | Yes      | -       | CA certificate to verify the agent's client certificate (base64-encoded PEM) |

### ObserverURL

The base URL of the Observer API service running in the observability plane cluster. This API is used by the control plane to query logs, metrics, and traces.

**Format:** `http://observer.<namespace>.svc.cluster.local:<port>`

**Example:** `http://observer.openchoreo-observability-plane.svc.cluster.local:8080`

:::tip In-Cluster Communication
The Observer API is typically accessed via in-cluster DNS. The URL should point to the Observer service within the observability plane cluster using the Kubernetes service DNS format.
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

| Field                | Type                                                  | Default | Description                                                               |
|----------------------|-------------------------------------------------------|---------|---------------------------------------------------------------------------|
| `observedGeneration` | integer                                               | 0       | The generation observed by the controller                                 |
| `conditions`         | []Condition                                           | []      | Standard Kubernetes conditions tracking the ClusterObservabilityPlane state |
| `agentConnection`    | [AgentConnectionStatus](#agentconnectionstatus)       | -       | Tracks the status of cluster agent connections                            |

#### AgentConnectionStatus

| Field                  | Type      | Default | Description                                                              |
|------------------------|-----------|---------|--------------------------------------------------------------------------|
| `connected`            | boolean   | false   | Whether any cluster agent is currently connected                         |
| `connectedAgents`      | integer   | 0       | Number of cluster agents currently connected                             |
| `lastConnectedTime`    | timestamp | -       | When an agent last successfully connected                                |
| `lastDisconnectedTime` | timestamp | -       | When the last agent disconnected                                         |
| `lastHeartbeatTime`    | timestamp | -       | When the control plane last received any communication from an agent     |
| `message`              | string    | -       | Additional information about the agent connection status                 |

## Examples

### Basic ClusterObservabilityPlane Configuration

This example shows a minimal ClusterObservabilityPlane configuration.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterObservabilityPlane
metadata:
  name: production-observability
spec:
  planeID: "prod-monitoring"
  clusterAgent:
    clientCA:
      secretRef:
        name: observability-agent-ca
        namespace: openchoreo-system
        key: ca.crt
  observerURL: http://observer.openchoreo-observability-plane.svc.cluster.local:8080
```

### ClusterObservabilityPlane with Inline CA Certificate

This example uses an inline CA certificate (suitable for development/testing).

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterObservabilityPlane
metadata:
  name: dev-observability
spec:
  planeID: "dev-monitoring"
  clusterAgent:
    clientCA:
      value: |
        -----BEGIN CERTIFICATE-----
        MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKuoMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
        ... (certificate content) ...
        -----END CERTIFICATE-----
  observerURL: http://observer.openchoreo-observability-plane.svc.cluster.local:8080
```

## Linking Planes to ClusterObservabilityPlane

Once a ClusterObservabilityPlane is created, you can link DataPlanes, ClusterDataPlanes, BuildPlanes, and ClusterBuildPlanes to it for centralized monitoring and logging.

### Linking a DataPlane

```bash
kubectl patch dataplane <dataplane-name> -n <org-namespace> --type merge \
  -p '{"spec":{"observabilityPlaneRef":{"kind":"ClusterObservabilityPlane","name":"<clusterobservabilityplane-name>"}}}'
```

Example:
```bash
kubectl patch dataplane production-dataplane -n my-org --type merge \
  -p '{"spec":{"observabilityPlaneRef":{"kind":"ClusterObservabilityPlane","name":"production-observability"}}}'
```

### Linking a ClusterDataPlane

```bash
kubectl patch clusterdataplane <clusterdataplane-name> --type merge \
  -p '{"spec":{"observabilityPlaneRef":{"kind":"ClusterObservabilityPlane","name":"<clusterobservabilityplane-name>"}}}'
```

Example:
```bash
kubectl patch clusterdataplane shared-dataplane --type merge \
  -p '{"spec":{"observabilityPlaneRef":{"kind":"ClusterObservabilityPlane","name":"production-observability"}}}'
```

### Linking a BuildPlane

```bash
kubectl patch buildplane <buildplane-name> -n <org-namespace> --type merge \
  -p '{"spec":{"observabilityPlaneRef":{"kind":"ClusterObservabilityPlane","name":"<clusterobservabilityplane-name>"}}}'
```

Example:
```bash
kubectl patch buildplane production-buildplane -n my-org --type merge \
  -p '{"spec":{"observabilityPlaneRef":{"kind":"ClusterObservabilityPlane","name":"production-observability"}}}'
```

### Linking a ClusterBuildPlane

```bash
kubectl patch clusterbuildplane <clusterbuildplane-name> --type merge \
  -p '{"spec":{"observabilityPlaneRef":{"kind":"ClusterObservabilityPlane","name":"<clusterobservabilityplane-name>"}}}'
```

Example:
```bash
kubectl patch clusterbuildplane shared-buildplane --type merge \
  -p '{"spec":{"observabilityPlaneRef":{"kind":"ClusterObservabilityPlane","name":"production-observability"}}}'
```

## Annotations

ClusterObservabilityPlanes support the following annotations:

| Annotation                    | Description                                            |
|-------------------------------|--------------------------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display                     |
| `openchoreo.dev/description`  | Detailed description of the ClusterObservabilityPlane  |

## Related Resources

- [ObservabilityPlane](./observabilityplane.md) - Namespace-scoped variant of ClusterObservabilityPlane
- [DataPlane](./dataplane.md) - Can reference ClusterObservabilityPlane for monitoring
- [ClusterDataPlane](./clusterdataplane.md) - Cluster-scoped data plane that can reference ClusterObservabilityPlane
- [BuildPlane](./buildplane.md) - Can reference ClusterObservabilityPlane for build job monitoring
- [ClusterBuildPlane](./clusterbuildplane.md) - Cluster-scoped build plane that can reference ClusterObservabilityPlane
- [ObservabilityAlertRule](./observabilityalertrule.md) - Defines alerting rules for the plane
- [ObservabilityAlertsNotificationChannel](./observabilityalertsnotificationchannel.md) - Defines notification destinations for alerts
