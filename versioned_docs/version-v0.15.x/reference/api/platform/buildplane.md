---
title: BuildPlane API Reference
---

# BuildPlane

A BuildPlane represents the infrastructure layer responsible for executing build workloads in OpenChoreo. It provides the necessary compute resources and configuration for running CI/CD pipelines, typically using Argo Workflows or similar build orchestration systems. Each BuildPlane is associated with a specific Kubernetes cluster where build jobs are executed.

OpenChoreo uses **agent-based communication** where the control plane communicates with the build cluster through a WebSocket agent running in the BuildPlane cluster. The cluster agent establishes a secure WebSocket connection to the control plane's cluster gateway.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

BuildPlanes are namespace-scoped resources.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: BuildPlane
metadata:
  name: <buildplane-name>
  namespace: <namespace>  # Namespace for grouping buildplanes
```

### Spec Fields

| Field                     | Type                                      | Required | Default | Description                                                                                          |
|---------------------------|-------------------------------------------|----------|---------|------------------------------------------------------------------------------------------------------|
| `planeID`                 | string                                    | No       | CR name    | Identifies the logical plane this CR connects to. Must match `clusterAgent.planeId` Helm value.     |
| `clusterAgent`            | [ClusterAgentConfig](#clusteragentconfig) | Yes      | -       | Configuration for cluster agent-based communication                                                  |
| `secretStoreRef`          | [SecretStoreRef](#secretstoreref)         | No       | -       | Reference to External Secrets Operator ClusterSecretStore in the BuildPlane                         |
| `observabilityPlaneRef`   | [ObservabilityPlaneRef](#observabilityplaneref) | No | -    | Reference to the ObservabilityPlane or ClusterObservabilityPlane resource for monitoring and logging |

### PlaneID

The `planeID` identifies the logical plane this BuildPlane CR connects to. Multiple BuildPlane CRs can share the same `planeID` to connect to the same physical cluster while maintaining separate configurations for multi-tenancy scenarios.

**Validation Rules:**
- Maximum length: 63 characters
- Pattern: `^[a-z0-9]([-a-z0-9]*[a-z0-9])?$` (lowercase alphanumeric, hyphens allowed)
- Examples: `"shared-builder"`, `"ci-cluster"`, `"us-west-2"`

:::important PlaneID Consistency
The `planeID` in the BuildPlane CR must match the `clusterAgent.planeId` Helm value configured during build plane installation. If not specified, it defaults to the CR name for backwards compatibility.
:::

### ClusterAgentConfig

Configuration for cluster agent-based communication with the build cluster. The cluster agent establishes a WebSocket connection to the control plane's cluster gateway.

| Field      | Type                    | Required | Default | Description                                                                  |
|------------|-------------------------|----------|---------|------------------------------------------------------------------------------|
| `clientCA` | [ValueFrom](#valuefrom) | Yes      | -       | CA certificate to verify the agent's client certificate (base64-encoded PEM) |

### SecretStoreRef

Reference to an External Secrets Operator ClusterSecretStore.

| Field  | Type   | Required | Default | Description                                       |
|--------|--------|----------|---------|---------------------------------------------------|
| `name` | string | Yes      | -       | Name of the ClusterSecretStore in the BuildPlane  |

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

| Field                | Type                                                  | Default | Description                                                  |
|----------------------|-------------------------------------------------------|---------|--------------------------------------------------------------|
| `observedGeneration` | integer                                               | 0       | The generation observed by the controller                    |
| `conditions`         | []Condition                                           | []      | Standard Kubernetes conditions tracking the BuildPlane state |
| `agentConnection`    | [AgentConnectionStatus](#agentconnectionstatus)       | -       | Tracks the status of cluster agent connections               |

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

The cluster agent automatically generates its CA certificate when deployed to the build plane cluster. This certificate is used by the control plane to verify the identity of the build plane agent during mTLS authentication.

### Extracting the CA Certificate

You can extract the CA certificate using:

```bash
# For multi-cluster setups, specify the build plane cluster context
kubectl --context <buildplane-context> get secret cluster-agent-tls \
  -n openchoreo-build-plane \
  -o jsonpath='{.data.ca\.crt}' | base64 -d

# Example for k3d multi-cluster setup:
kubectl --context k3d-openchoreo-bp get secret cluster-agent-tls \
  -n openchoreo-build-plane \
  -o jsonpath='{.data.ca\.crt}' | base64 -d
```

:::important
In multi-cluster setups, you **must** specify the `--context` flag to target the build plane cluster, not the control plane cluster. The `cluster-agent-tls` secret exists in the build plane cluster where the agent is deployed.
:::

### Adding the Certificate to the BuildPlane CR

You can add the CA certificate to the BuildPlane CR in two ways:

**Option 1: Inline value (for testing/development)**

```bash
# Extract the CA certificate from the build plane cluster
BP_CA_CERT=$(kubectl --context <buildplane-context> get secret cluster-agent-tls \
  -n openchoreo-build-plane \
  -o jsonpath='{.data.ca\.crt}' | base64 -d)

# Create BuildPlane in the control plane with inline CA certificate
kubectl --context <control-plane-context> apply -f - <<EOF
apiVersion: openchoreo.dev/v1alpha1
kind: BuildPlane
metadata:
  name: my-buildplane
  namespace: my-org
spec:
  planeID: "default"
  clusterAgent:
    clientCA:
      value: |
$(echo "$BP_CA_CERT" | sed 's/^/        /')
EOF
```

**Option 2: Secret reference (recommended for production)**

```bash
# Extract the CA certificate from the build plane cluster and save to file
kubectl --context <buildplane-context> get secret cluster-agent-tls \
  -n openchoreo-build-plane \
  -o jsonpath='{.data.ca\.crt}' | base64 -d > /tmp/buildplane-ca.crt

# Create a secret in the control plane cluster
kubectl --context <control-plane-context> create secret generic buildplane-agent-ca \
  --from-file=ca.crt=/tmp/buildplane-ca.crt \
  -n my-org

# Create BuildPlane in the control plane referencing the secret
kubectl --context <control-plane-context> apply -f - <<EOF
apiVersion: openchoreo.dev/v1alpha1
kind: BuildPlane
metadata:
  name: my-buildplane
  namespace: my-org
spec:
  planeID: "default"
  clusterAgent:
    clientCA:
      secretRef:
        name: buildplane-agent-ca
        namespace: my-org
        key: ca.crt
EOF
```

## Examples

### Basic BuildPlane Configuration

This example shows a minimal BuildPlane configuration.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: BuildPlane
metadata:
  name: production-buildplane
  namespace: my-org
spec:
  planeID: "prod-builder"
  clusterAgent:
    clientCA:
      secretRef:
        name: buildplane-agent-ca
        key: ca.crt
```

### BuildPlane with Secret Store

This example demonstrates using External Secrets Operator for managing secrets.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: BuildPlane
metadata:
  name: secure-buildplane
  namespace: my-org
spec:
  planeID: "secure-builder"
  clusterAgent:
    clientCA:
      secretRef:
        name: agent-ca-cert
        namespace: openchoreo-system
        key: ca.crt
  secretStoreRef:
    name: vault-backend
```

### BuildPlane with Observability

This example shows a BuildPlane linked to an ObservabilityPlane for monitoring build jobs.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: BuildPlane
metadata:
  name: monitored-buildplane
  namespace: my-org
spec:
  planeID: "prod-ci"
  clusterAgent:
    clientCA:
      value: |
        -----BEGIN CERTIFICATE-----
        MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKuoMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
        ... (certificate content) ...
        -----END CERTIFICATE-----
  secretStoreRef:
    name: default
  observabilityPlaneRef:
    kind: ObservabilityPlane
    name: production-observability
```

### Multi-tenant BuildPlane Configuration

This example shows multiple BuildPlane CRs sharing the same `planeID` for multi-tenancy.

```yaml
# Organization 1's BuildPlane
apiVersion: openchoreo.dev/v1alpha1
kind: BuildPlane
metadata:
  name: org1-buildplane
  namespace: org1
spec:
  planeID: "shared-builder"  # Same physical cluster
  clusterAgent:
    clientCA:
      secretRef:
        name: shared-cluster-ca
        key: ca.crt
  secretStoreRef:
    name: org1-secrets

---
# Organization 2's BuildPlane
apiVersion: openchoreo.dev/v1alpha1
kind: BuildPlane
metadata:
  name: org2-buildplane
  namespace: org2
spec:
  planeID: "shared-builder"  # Same physical cluster
  clusterAgent:
    clientCA:
      secretRef:
        name: shared-cluster-ca
        key: ca.crt
  secretStoreRef:
    name: org2-secrets
```

## Annotations

BuildPlanes support the following annotations:

| Annotation                    | Description                            |
|-------------------------------|----------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display     |
| `openchoreo.dev/description`  | Detailed description of the BuildPlane |

## Related Resources

- [ClusterBuildPlane](./clusterbuildplane.md) - Cluster-scoped variant of BuildPlane
- [DataPlane](./dataplane.md) - Runtime infrastructure for deployed applications
- [Component](../application/component.md) - Application components that trigger builds
- [WorkflowRun](../application/workflowrun.md) - Build job executions on BuildPlanes
