---
title: ObservabilityPlane API Reference
---

# ObservabilityPlane

An ObservabilityPlane represents the infrastructure layer responsible for collecting, storing, and analyzing observability data (metrics, logs, and traces) from OpenChoreo workloads. It provides centralized monitoring and logging capabilities for applications deployed across DataPlanes and build processes running on BuildPlanes.

OpenChoreo uses **agent-based communication** where the control plane communicates with the observability cluster through a WebSocket agent running in the ObservabilityPlane cluster. The cluster agent establishes a secure WebSocket connection to the control plane's cluster gateway.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ObservabilityPlanes are namespace-scoped resources.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ObservabilityPlane
metadata:
  name: <observabilityplane-name>
  namespace: <namespace>  # Namespace for grouping observability planes
```

### Spec Fields

| Field                     | Type                                      | Required | Default | Description                                                                                          |
|---------------------------|-------------------------------------------|----------|---------|------------------------------------------------------------------------------------------------------|
| `planeID`                 | string                                    | No       | CR name            | Identifies the logical plane this CR connects to. Must match `clusterAgent.planeId` Helm value.     |
| `clusterAgent`            | [ClusterAgentConfig](#clusteragentconfig) | Yes      | -       | Configuration for cluster agent-based communication                                                  |
| `observerURL`             | string                                    | Yes      | -       | Base URL of the Observer API in the observability plane cluster                                     |

### PlaneID

The `planeID` identifies the logical plane this ObservabilityPlane CR connects to. Multiple ObservabilityPlane CRs can share the same `planeID` to connect to the same physical cluster while maintaining separate configurations for multi-tenancy scenarios.

**Validation Rules:**
- Maximum length: 63 characters
- Pattern: `^[a-z0-9]([-a-z0-9]*[a-z0-9])?$` (lowercase alphanumeric, hyphens allowed)
- Examples: `"shared-obs"`, `"monitoring-cluster"`, `"eu-central-1"`

:::important PlaneID Consistency
The `planeID` in the ObservabilityPlane CR must match the `clusterAgent.planeId` Helm value configured during observability plane installation. If not specified, it defaults to the CR name for backwards compatibility.
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
| `namespace` | string | No       | Same as parent resource   | Namespace of the secret                                      |
| `key`       | string | Yes      | -                         | Key within the secret                                        |

### Status Fields

| Field                | Type                                                  | Default | Description                                                            |
|----------------------|-------------------------------------------------------|---------|------------------------------------------------------------------------|
| `observedGeneration` | integer                                               | 0       | The generation observed by the controller                              |
| `conditions`         | []Condition                                           | []      | Standard Kubernetes conditions tracking the ObservabilityPlane state   |
| `agentConnection`    | [AgentConnectionStatus](#agentconnectionstatus)       | -       | Tracks the status of cluster agent connections                         |

#### AgentConnectionStatus

| Field                  | Type      | Default | Description                                                              |
|------------------------|-----------|---------|--------------------------------------------------------------------------|
| `connected`            | boolean   | false   | Whether any cluster agent is currently connected                         |
| `connectedAgents`      | integer   | 0       | Number of cluster agents currently connected                             |
| `lastConnectedTime`    | timestamp | -       | When an agent last successfully connected                                |
| `lastDisconnectedTime` | timestamp | -       | When the last agent disconnected                                         |
| `lastHeartbeatTime`    | timestamp | -       | When the control plane last received any communication from an agent     |
| `message`              | string    | -       | Additional information about the agent connection status                 |

## Getting the Agent CA Certificate

The cluster agent automatically generates its CA certificate when deployed to the observability plane cluster. This certificate is used by the control plane to verify the identity of the observability plane agent during mTLS authentication.

### Extracting the CA Certificate

You can extract the CA certificate using:

```bash
# For multi-cluster setups, specify the observability plane cluster context
kubectl --context <observabilityplane-context> get secret cluster-agent-tls \
  -n openchoreo-observability-plane \
  -o jsonpath='{.data.ca\.crt}' | base64 -d

# Example for k3d multi-cluster setup:
kubectl --context k3d-openchoreo-op get secret cluster-agent-tls \
  -n openchoreo-observability-plane \
  -o jsonpath='{.data.ca\.crt}' | base64 -d
```

:::important
In multi-cluster setups, you **must** specify the `--context` flag to target the observability plane cluster, not the control plane cluster. The `cluster-agent-tls` secret exists in the observability plane cluster where the agent is deployed.
:::

### Adding the Certificate to the ObservabilityPlane CR

You can add the CA certificate to the ObservabilityPlane CR in two ways:

**Option 1: Inline value (for testing/development)**

```bash
# Extract the CA certificate from the observability plane cluster
OP_CA_CERT=$(kubectl --context <observabilityplane-context> get secret cluster-agent-tls \
  -n openchoreo-observability-plane \
  -o jsonpath='{.data.ca\.crt}' | base64 -d)

# Create ObservabilityPlane in the control plane with inline CA certificate
kubectl --context <control-plane-context> apply -f - <<EOF
apiVersion: openchoreo.dev/v1alpha1
kind: ObservabilityPlane
metadata:
  name: my-observabilityplane
  namespace: my-org
spec:
  planeID: "default"
  clusterAgent:
    clientCA:
      value: |
$(echo "$OP_CA_CERT" | sed 's/^/        /')
  observerURL: http://observer.openchoreo-observability-plane.svc.cluster.local:8080
EOF
```

**Option 2: Secret reference (recommended for production)**

```bash
# Extract the CA certificate from the observability plane cluster and save to file
kubectl --context <observabilityplane-context> get secret cluster-agent-tls \
  -n openchoreo-observability-plane \
  -o jsonpath='{.data.ca\.crt}' | base64 -d > /tmp/observabilityplane-ca.crt

# Create a secret in the control plane cluster
kubectl --context <control-plane-context> create secret generic observabilityplane-agent-ca \
  --from-file=ca.crt=/tmp/observabilityplane-ca.crt \
  -n my-org

# Create ObservabilityPlane in the control plane referencing the secret
kubectl --context <control-plane-context> apply -f - <<EOF
apiVersion: openchoreo.dev/v1alpha1
kind: ObservabilityPlane
metadata:
  name: my-observabilityplane
  namespace: my-org
spec:
  planeID: "default"
  clusterAgent:
    clientCA:
      secretRef:
        name: observabilityplane-agent-ca
        namespace: my-org
        key: ca.crt
  observerURL: http://observer.openchoreo-observability-plane.svc.cluster.local:8080
EOF
```

## Examples

### Basic ObservabilityPlane Configuration

This example shows a minimal ObservabilityPlane configuration.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ObservabilityPlane
metadata:
  name: production-observability
  namespace: my-org
spec:
  planeID: "prod-monitoring"
  clusterAgent:
    clientCA:
      secretRef:
        name: observability-agent-ca
        key: ca.crt
  observerURL: http://observer.openchoreo-observability-plane.svc.cluster.local:8080
```

### ObservabilityPlane with Inline CA Certificate

This example uses an inline CA certificate (suitable for development/testing).

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ObservabilityPlane
metadata:
  name: dev-observability
  namespace: my-org
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

### Multi-tenant ObservabilityPlane Configuration

This example shows multiple ObservabilityPlane CRs sharing the same `planeID` for multi-tenancy.

```yaml
# Organization 1's ObservabilityPlane
apiVersion: openchoreo.dev/v1alpha1
kind: ObservabilityPlane
metadata:
  name: org1-observability
  namespace: org1
spec:
  planeID: "shared-monitoring"  # Same physical cluster
  clusterAgent:
    clientCA:
      secretRef:
        name: shared-cluster-ca
        key: ca.crt
  observerURL: http://observer.openchoreo-observability-plane.svc.cluster.local:8080

---
# Organization 2's ObservabilityPlane
apiVersion: openchoreo.dev/v1alpha1
kind: ObservabilityPlane
metadata:
  name: org2-observability
  namespace: org2
spec:
  planeID: "shared-monitoring"  # Same physical cluster
  clusterAgent:
    clientCA:
      secretRef:
        name: shared-cluster-ca
        key: ca.crt
  observerURL: http://observer.openchoreo-observability-plane.svc.cluster.local:8080
```

## Linking Planes to ObservabilityPlane

Once an ObservabilityPlane is created, you can link DataPlanes and BuildPlanes to it for centralized monitoring and logging.

### Linking a DataPlane

```bash
kubectl patch dataplane <dataplane-name> -n <org-namespace> --type merge \
  -p '{"spec":{"observabilityPlaneRef":{"kind":"ObservabilityPlane","name":"<observabilityplane-name>"}}}'
```

Example:
```bash
kubectl patch dataplane production-dataplane -n my-org --type merge \
  -p '{"spec":{"observabilityPlaneRef":{"kind":"ObservabilityPlane","name":"production-observability"}}}'
```

### Linking a BuildPlane

```bash
kubectl patch buildplane <buildplane-name> -n <org-namespace> --type merge \
  -p '{"spec":{"observabilityPlaneRef":{"kind":"ObservabilityPlane","name":"<observabilityplane-name>"}}}'
```

Example:
```bash
kubectl patch buildplane production-buildplane -n my-org --type merge \
  -p '{"spec":{"observabilityPlaneRef":{"kind":"ObservabilityPlane","name":"production-observability"}}}'
```

:::note Cluster-Scoped Resources
ClusterDataPlane and ClusterBuildPlane can **only** reference a `ClusterObservabilityPlane` — they cannot reference a namespace-scoped ObservabilityPlane. To link cluster-scoped resources, see the [ClusterObservabilityPlane linking examples](./clusterobservabilityplane.md#linking-planes-to-clusterobservabilityplane).
:::

## Annotations

ObservabilityPlanes support the following annotations:

| Annotation                    | Description                                     |
|-------------------------------|-------------------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display              |
| `openchoreo.dev/description`  | Detailed description of the ObservabilityPlane  |

## Related Resources

- [ClusterObservabilityPlane](./clusterobservabilityplane.md) - Cluster-scoped variant of ObservabilityPlane
- [DataPlane](./dataplane.md) - Can reference ObservabilityPlane for monitoring
- [ClusterDataPlane](./clusterdataplane.md) - Can reference ObservabilityPlane for monitoring
- [BuildPlane](./buildplane.md) - Can reference ObservabilityPlane for build job monitoring
- [ClusterBuildPlane](./clusterbuildplane.md) - Can reference ObservabilityPlane for build job monitoring
- [ObservabilityAlertRule](./observabilityalertrule.md) - Defines alerting rules for the plane
- [ObservabilityAlertsNotificationChannel](./observabilityalertsnotificationchannel.md) - Defines notification destinations for alerts
