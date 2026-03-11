---
title: ClusterWorkflowPlane API Reference
---

# ClusterWorkflowPlane

A ClusterWorkflowPlane is a cluster-scoped variant of [WorkflowPlane](./workflowplane.md) that represents the infrastructure layer responsible for executing workflow workloads in OpenChoreo. Unlike the namespace-scoped WorkflowPlane, a ClusterWorkflowPlane is a cluster-scoped resource, making it suitable for shared workflow plane infrastructure scenarios.

OpenChoreo uses **agent-based communication** where the control plane communicates with the workflow plane cluster through a WebSocket agent running in the ClusterWorkflowPlane cluster. The cluster agent establishes a secure WebSocket connection to the control plane's cluster gateway.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ClusterWorkflowPlanes are cluster-scoped resources (no namespace).

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterWorkflowPlane
metadata:
  name: <clusterworkflowplane-name>
```

### Spec Fields

| Field                     | Type                                      | Required | Default | Description                                                                                          |
|---------------------------|-------------------------------------------|----------|---------|------------------------------------------------------------------------------------------------------|
| `planeID`                 | string                                    | No       | CR name    | Identifies the logical plane this CR connects to. Must match `clusterAgent.planeId` Helm value.     |
| `clusterAgent`            | [ClusterAgentConfig](#clusteragentconfig) | Yes      | -       | Configuration for cluster agent-based communication                                                  |
| `secretStoreRef`          | [SecretStoreRef](#secretstoreref)         | No       | -       | Reference to External Secrets Operator ClusterSecretStore in the ClusterWorkflowPlane                  |
| `observabilityPlaneRef`   | [ObservabilityPlaneRef](#observabilityplaneref) | No | -    | Reference to a ClusterObservabilityPlane resource for monitoring and logging |

### PlaneID

The `planeID` identifies the logical plane this ClusterWorkflowPlane CR connects to. Multiple ClusterWorkflowPlane CRs can share the same `planeID` to connect to the same physical cluster while maintaining separate configurations.

**Validation Rules:**
- Maximum length: 63 characters
- Pattern: `^[a-z0-9]([-a-z0-9]*[a-z0-9])?$` (lowercase alphanumeric, hyphens allowed)
- Examples: `"shared-workflow"`, `"ci-cluster"`, `"us-west-2"`

:::important PlaneID Consistency
The `planeID` in the ClusterWorkflowPlane CR must match the `clusterAgent.planeId` Helm value configured during workflow plane installation. If not specified, it defaults to the CR name for backwards compatibility.
:::

### ClusterAgentConfig

Configuration for cluster agent-based communication with the workflow plane cluster. The cluster agent establishes a WebSocket connection to the control plane's cluster gateway.

| Field      | Type                    | Required | Default | Description                                                                  |
|------------|-------------------------|----------|---------|------------------------------------------------------------------------------|
| `clientCA` | [ValueFrom](#valuefrom) | Yes      | -       | CA certificate to verify the agent's client certificate (base64-encoded PEM) |

### SecretStoreRef

Reference to an External Secrets Operator ClusterSecretStore.

| Field  | Type   | Required | Default | Description                                             |
|--------|--------|----------|---------|---------------------------------------------------------|
| `name` | string | Yes      | -       | Name of the ClusterSecretStore in the ClusterWorkflowPlane |

### ObservabilityPlaneRef

Reference to a ClusterObservabilityPlane for monitoring and logging.

| Field  | Type   | Required | Default                    | Description                                                            |
|--------|--------|----------|----------------------------|------------------------------------------------------------------------|
| `kind` | string | No       | `ClusterObservabilityPlane` | Must be `ClusterObservabilityPlane`. ClusterWorkflowPlane can only reference cluster-scoped observability planes. |
| `name` | string | Yes      | -                          | Name of the ClusterObservabilityPlane resource                         |

:::note Resolution Behavior
- ClusterWorkflowPlane can **only** reference a `ClusterObservabilityPlane` (not a namespace-scoped `ObservabilityPlane`). This is enforced by API validation.
- If `observabilityPlaneRef` is omitted, the controller attempts to find a ClusterObservabilityPlane named "default". If no default exists, observability is not configured.
- If the referenced ClusterObservabilityPlane is not found, the controller returns an error and the ClusterWorkflowPlane will not become ready.
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

| Field                | Type                                                  | Default | Description                                                         |
|----------------------|-------------------------------------------------------|---------|---------------------------------------------------------------------|
| `observedGeneration` | integer                                               | 0       | The generation observed by the controller                           |
| `conditions`         | []Condition                                           | []      | Standard Kubernetes conditions tracking the ClusterWorkflowPlane state |
| `agentConnection`    | [AgentConnectionStatus](#agentconnectionstatus)       | -       | Tracks the status of cluster agent connections                      |

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

### Basic ClusterWorkflowPlane Configuration

This example shows a minimal ClusterWorkflowPlane configuration.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterWorkflowPlane
metadata:
  name: shared-workflowplane
spec:
  planeID: "shared-workflow"
  clusterAgent:
    clientCA:
      secretRef:
        name: workflowplane-agent-ca
        namespace: openchoreo-system
        key: ca.crt
```

### ClusterWorkflowPlane with Secret Store

This example demonstrates using External Secrets Operator for managing secrets.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterWorkflowPlane
metadata:
  name: secure-workflowplane
spec:
  planeID: "secure-workflow"
  clusterAgent:
    clientCA:
      secretRef:
        name: agent-ca-cert
        namespace: openchoreo-system
        key: ca.crt
  secretStoreRef:
    name: vault-backend
```

### ClusterWorkflowPlane with Observability

This example shows a ClusterWorkflowPlane linked to a ClusterObservabilityPlane for monitoring workflow jobs.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterWorkflowPlane
metadata:
  name: monitored-workflowplane
spec:
  planeID: "prod-ci"
  clusterAgent:
    clientCA:
      secretRef:
        name: workflowplane-agent-ca
        namespace: openchoreo-system
        key: ca.crt
  secretStoreRef:
    name: default
  observabilityPlaneRef:
    kind: ClusterObservabilityPlane
    name: production-observability
```

## Annotations

ClusterWorkflowPlanes support the following annotations:

| Annotation                    | Description                                   |
|-------------------------------|-----------------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display            |
| `openchoreo.dev/description`  | Detailed description of the ClusterWorkflowPlane |

## Related Resources

- [WorkflowPlane](./workflowplane.md) - Namespace-scoped variant of ClusterWorkflowPlane
- [DataPlane](./dataplane.md) - Runtime infrastructure for deployed applications
- [ClusterDataPlane](./clusterdataplane.md) - Cluster-scoped data plane configuration
- [ClusterObservabilityPlane](./clusterobservabilityplane.md) - Cluster-scoped observability plane
- [Component](../application/component.md) - Application components that trigger workflows
- [WorkflowRun](../application/workflowrun.md) - Workflow job executions on WorkflowPlanes
