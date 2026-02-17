---
title: DataPlane API Reference
---

# DataPlane

A DataPlane represents a Kubernetes cluster where application workloads are deployed. It defines the connection to a target Kubernetes cluster via a cluster agent and gateway settings for routing traffic to applications.

OpenChoreo uses **agent-based communication** where the control plane communicates with the downstream cluster through a WebSocket agent running in the DataPlane cluster. The cluster agent establishes a secure WebSocket connection to the control plane's cluster gateway.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

DataPlanes are namespace-scoped resources.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: DataPlane
metadata:
  name: <dataplane-name>
  namespace: <namespace>  # Namespace for grouping dataplanes
```

### Spec Fields

| Field                     | Type                                  | Required | Default | Description                                                                                          |
|---------------------------|---------------------------------------|----------|---------|------------------------------------------------------------------------------------------------------|
| `planeID`                 | string                                | No       | CR name   | Identifies the logical plane this CR connects to. Must match `clusterAgent.planeId` Helm value.     |
| `clusterAgent`            | [ClusterAgentConfig](#clusteragentconfig) | Yes      | -       | Configuration for cluster agent-based communication                                                  |
| `gateway`                 | [GatewaySpec](#gatewayspec)           | Yes      | -       | API gateway configuration for this DataPlane                                                         |
| `imagePullSecretRefs`     | []string                              | No       | -       | References to SecretReference resources for image pull secrets                                       |
| `secretStoreRef`          | [SecretStoreRef](#secretstoreref)     | No       | -       | Reference to External Secrets Operator ClusterSecretStore in the DataPlane                          |
| `observabilityPlaneRef`   | [ObservabilityPlaneRef](#observabilityplaneref) | No | -    | Reference to the ObservabilityPlane or ClusterObservabilityPlane resource for monitoring and logging |

### PlaneID

The `planeID` identifies the logical plane this DataPlane CR connects to. Multiple DataPlane CRs can share the same `planeID` to connect to the same physical cluster while maintaining separate configurations for multi-tenancy scenarios.

**Validation Rules:**
- Maximum length: 63 characters
- Pattern: `^[a-z0-9]([-a-z0-9]*[a-z0-9])?$` (lowercase alphanumeric, hyphens allowed)
- Examples: `"prod-cluster"`, `"shared-dataplane"`, `"us-east-1"`

:::important PlaneID Consistency
The `planeID` in the DataPlane CR must match the `clusterAgent.planeId` Helm value configured during data plane installation. If not specified, it defaults to the CR name for backwards compatibility.
:::

### ClusterAgentConfig

Configuration for cluster agent-based communication with the downstream cluster. The cluster agent establishes a WebSocket connection to the control plane's cluster gateway.

| Field      | Type                    | Required | Default | Description                                                                  |
|------------|-------------------------|----------|---------|------------------------------------------------------------------------------|
| `clientCA` | [ValueFrom](#valuefrom) | Yes      | -       | CA certificate to verify the agent's client certificate (base64-encoded PEM) |

### GatewaySpec

Gateway configuration for the DataPlane.

| Field                     | Type   | Required | Default | Description                                             |
|---------------------------|--------|----------|---------|---------------------------------------------------------|
| `publicVirtualHost`       | string | Yes      | -       | Public virtual host for external traffic                |
| `organizationVirtualHost` | string | Yes      | -       | Organization-specific virtual host for internal traffic |

### SecretStoreRef

Reference to an External Secrets Operator ClusterSecretStore.

| Field  | Type   | Required | Default | Description                                       |
|--------|--------|----------|---------|---------------------------------------------------|
| `name` | string | Yes      | -       | Name of the ClusterSecretStore in the DataPlane   |

### ObservabilityPlaneRef

Reference to an ObservabilityPlane or ClusterObservabilityPlane for monitoring and logging.

| Field  | Type   | Required | Default              | Description                                                            |
|--------|--------|----------|----------------------|------------------------------------------------------------------------|
| `kind` | string | No       | `ObservabilityPlane` | Kind of the observability plane (`ObservabilityPlane` or `ClusterObservabilityPlane`) |
| `name` | string | Yes      | -                    | Name of the observability plane resource                               |

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

| Field                | Type                                                  | Default | Description                                                 |
|----------------------|-------------------------------------------------------|---------|-------------------------------------------------------------|
| `observedGeneration` | integer                                               | 0       | The generation observed by the controller                   |
| `conditions`         | []Condition                                           | []      | Standard Kubernetes conditions tracking the DataPlane state |
| `agentConnection`    | [AgentConnectionStatus](#agentconnectionstatus)       | -       | Tracks the status of cluster agent connections              |

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

Common condition types for DataPlane resources:

- `Ready` - Indicates if the DataPlane is ready to accept workloads
- `Connected` - Indicates if connection to the target cluster is established
- `GatewayProvisioned` - Indicates if the gateway has been configured

## Getting the Agent CA Certificate

The cluster agent automatically generates its CA certificate when deployed to the data plane cluster. This certificate is used by the control plane to verify the identity of the data plane agent during mTLS authentication.

### Extracting the CA Certificate

You can extract the CA certificate using:

```bash
# For multi-cluster setups, specify the data plane cluster context
kubectl --context <dataplane-context> get secret cluster-agent-tls \
  -n openchoreo-data-plane \
  -o jsonpath='{.data.ca\.crt}' | base64 -d

# Example for k3d multi-cluster setup:
kubectl --context k3d-openchoreo-dp get secret cluster-agent-tls \
  -n openchoreo-data-plane \
  -o jsonpath='{.data.ca\.crt}' | base64 -d
```

:::important
In multi-cluster setups, you **must** specify the `--context` flag to target the data plane cluster, not the control plane cluster. The `cluster-agent-tls` secret exists in the data plane cluster where the agent is deployed.
:::

### Adding the Certificate to the DataPlane CR

You can add the CA certificate to the DataPlane CR in two ways:

**Option 1: Inline value (for testing/development)**

```bash
# Extract the CA certificate from the data plane cluster
CA_CERT=$(kubectl --context <dataplane-context> get secret cluster-agent-tls \
  -n openchoreo-data-plane \
  -o jsonpath='{.data.ca\.crt}' | base64 -d)

# Create DataPlane in the control plane with inline CA certificate
kubectl --context <control-plane-context> apply -f - <<EOF
apiVersion: openchoreo.dev/v1alpha1
kind: DataPlane
metadata:
  name: my-dataplane
  namespace: my-org
spec:
  planeID: "default"
  clusterAgent:
    clientCA:
      value: |
$(echo "$CA_CERT" | sed 's/^/        /')
  gateway:
    publicVirtualHost: api.example.com
    organizationVirtualHost: internal.example.com
  secretStoreRef:
    name: default
EOF
```

**Option 2: Secret reference (recommended for production)**

```bash
# Extract the CA certificate from the data plane cluster and save to file
kubectl --context <dataplane-context> get secret cluster-agent-tls \
  -n openchoreo-data-plane \
  -o jsonpath='{.data.ca\.crt}' | base64 -d > /tmp/dataplane-ca.crt

# Create a secret in the control plane cluster
kubectl --context <control-plane-context> create secret generic dataplane-agent-ca \
  --from-file=ca.crt=/tmp/dataplane-ca.crt \
  -n my-org

# Create DataPlane in the control plane referencing the secret
kubectl --context <control-plane-context> apply -f - <<EOF
apiVersion: openchoreo.dev/v1alpha1
kind: DataPlane
metadata:
  name: my-dataplane
  namespace: my-org
spec:
  planeID: "default"
  clusterAgent:
    clientCA:
      secretRef:
        name: dataplane-agent-ca
        namespace: my-org
        key: ca.crt
  gateway:
    publicVirtualHost: api.example.com
    organizationVirtualHost: internal.example.com
  secretStoreRef:
    name: default
EOF
```

## Examples

### Basic DataPlane Configuration

This example shows a minimal DataPlane configuration.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: DataPlane
metadata:
  name: production-dataplane
  namespace: my-org
spec:
  planeID: "prod-cluster"
  clusterAgent:
    clientCA:
      secretRef:
        name: cluster-agent-ca
        key: ca.crt
  gateway:
    publicVirtualHost: api.example.com
    organizationVirtualHost: internal.example.com
  secretStoreRef:
    name: vault-backend
```

### DataPlane with Image Pull Secrets

This example demonstrates using External Secrets Operator for managing image pull credentials.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: DataPlane
metadata:
  name: secure-dataplane
  namespace: my-org
spec:
  planeID: "secure-cluster"
  clusterAgent:
    clientCA:
      secretRef:
        name: agent-ca-cert
        namespace: openchoreo-system
        key: ca.crt
  gateway:
    publicVirtualHost: secure-api.example.com
    organizationVirtualHost: secure-internal.example.com

  # External Secrets Operator ClusterSecretStore reference
  secretStoreRef:
    name: vault-backend

  # References to SecretReference resources
  # These will be converted to ExternalSecrets and added as imagePullSecrets
  imagePullSecretRefs:
    - docker-hub-credentials
    - gcr-credentials
    - private-registry-credentials
```

### DataPlane with Observability

This example shows a DataPlane linked to an ObservabilityPlane for monitoring and logging.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: DataPlane
metadata:
  name: monitored-dataplane
  namespace: my-org
spec:
  planeID: "prod-us-east"
  clusterAgent:
    clientCA:
      value: |
        -----BEGIN CERTIFICATE-----
        MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKuoMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
        ... (certificate content) ...
        -----END CERTIFICATE-----
  gateway:
    publicVirtualHost: api.prod.example.com
    organizationVirtualHost: internal.prod.example.com
  secretStoreRef:
    name: default
  observabilityPlaneRef:
    kind: ObservabilityPlane
    name: production-observability
```

### Shared DataPlane Configuration

This example shows multiple DataPlane CRs sharing the same `planeID` to connect to the same physical cluster.

```yaml
# Team 1's DataPlane
apiVersion: openchoreo.dev/v1alpha1
kind: DataPlane
metadata:
  name: team1-dataplane
  namespace: team1-namespace
spec:
  planeID: "shared-dataplane"  # Same physical cluster
  clusterAgent:
    clientCA:
      secretRef:
        name: shared-cluster-ca
        key: ca.crt
  gateway:
    publicVirtualHost: team1.apps.example.com
    organizationVirtualHost: team1.internal.example.com
  secretStoreRef:
    name: team1-secrets

---
# Team 2's DataPlane
apiVersion: openchoreo.dev/v1alpha1
kind: DataPlane
metadata:
  name: team2-dataplane
  namespace: team2-namespace
spec:
  planeID: "shared-dataplane"  # Same physical cluster
  clusterAgent:
    clientCA:
      secretRef:
        name: shared-cluster-ca
        key: ca.crt
  gateway:
    publicVirtualHost: team2.apps.example.com
    organizationVirtualHost: team2.internal.example.com
  secretStoreRef:
    name: team2-secrets
```

## Annotations

DataPlanes support the following annotations:

| Annotation                    | Description                           |
|-------------------------------|---------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display    |
| `openchoreo.dev/description`  | Detailed description of the DataPlane |

## Related Resources

- [ClusterDataPlane](./clusterdataplane.md) - Cluster-scoped variant of DataPlane
- [Environment](./environment.md) - Runtime environments deployed on DataPlanes
- [BuildPlane](./buildplane.md) - Build and CI/CD plane configuration
- [Project](../application/project.md) - Applications deployed to DataPlanes
