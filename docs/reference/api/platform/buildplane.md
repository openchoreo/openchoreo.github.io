---
title: BuildPlane API Reference
---

# BuildPlane

A BuildPlane represents the infrastructure layer responsible for executing build workloads in OpenChoreo. It provides
the necessary compute resources and configuration for running CI/CD pipelines, typically using Argo Workflows or similar
build orchestration systems. Each BuildPlane is associated with a specific Kubernetes cluster where build jobs are
executed.

OpenChoreo supports agent-based communication with the BuildPlane where the control plane communicates with the build cluster through a WebSocket agent running in the BuildPlane cluster.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

BuildPlanes are namespace-scoped resources that must be created within an Organization's namespace.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: BuildPlane
metadata:
  name: <buildplane-name>
  namespace: <org-namespace>  # Organization namespace
```

### Spec Fields

| Field               | Type                                            | Required | Default | Description                                                                                        |
|---------------------|-------------------------------------------------|----------|---------|----------------------------------------------------------------------------------------------------|
| `agent`             | [AgentConfig](#agentconfig)                     | No       | -       | Agent-based communication configuration (recommended)                                               |
| `kubernetesCluster` | [KubernetesClusterSpec](#kubernetesclusterspec) | No       | -       | Defines the Kubernetes cluster where build workloads (e.g., Argo Workflows) will be executed (optional when agent is enabled) |
| `observer`          | [ObserverAPI](#observerapi)                     | No       | -       | Configuration for the Observer API integration for monitoring and observability of build processes |

### AgentConfig

Configuration for agent-based communication with the build cluster.

| Field      | Type                      | Required | Default | Description                                                                  |
|------------|---------------------------|----------|---------|------------------------------------------------------------------------------|
| `enabled`  | boolean                   | No       | false   | Whether agent-based communication is enabled                                 |
| `clientCA` | [ValueFrom](#valuefrom)   | No       | -       | CA certificate to verify the agent's client certificate (base64-encoded PEM) |

### ValueFrom

Common pattern for referencing secrets or providing inline values. Either `secretRef` or `value` should be specified.

| Field       | Type                                        | Required | Default | Description                       |
|-------------|---------------------------------------------|----------|---------|-----------------------------------|
| `secretRef` | [SecretKeyReference](#secretkeyreference)   | No       | -       | Reference to a secret key         |
| `value`     | string                                      | No       | -       | Inline value (not recommended for sensitive data) |

### SecretKeyReference

Reference to a specific key in a Kubernetes secret.

| Field       | Type   | Required | Default                   | Description                                                  |
|-------------|--------|----------|---------------------------|--------------------------------------------------------------|
| `name`      | string | Yes      | -                         | Name of the secret                                           |
| `namespace` | string | No       | Same as parent resource   | Namespace of the secret                                      |
| `key`       | string | Yes      | -                         | Key within the secret                                        |

### KubernetesClusterSpec

| Field                      | Type   | Required | Default | Description                                |
|----------------------------|--------|----------|---------|--------------------------------------------|
| `name`                     | string | Yes      | -       | Name identifier for the Kubernetes cluster |
| `credentials.apiServerURL` | string | Yes      | -       | URL of the Kubernetes API server           |
| `credentials.caCert`       | string | Yes      | -       | Base64-encoded CA certificate              |
| `credentials.clientCert`   | string | Yes      | -       | Base64-encoded client certificate          |
| `credentials.clientKey`    | string | Yes      | -       | Base64-encoded client private key          |

### ObserverAPI

| Field                               | Type   | Required | Default | Description                       |
|-------------------------------------|--------|----------|---------|-----------------------------------|
| `url`                               | string | Yes      | -       | Base URL of the Observer API      |
| `authentication.basicAuth.username` | string | Yes      | -       | Username for basic authentication |
| `authentication.basicAuth.password` | string | Yes      | -       | Password for basic authentication |

### Status Fields

The BuildPlane status is currently minimal, with fields reserved for future use.

| Field | Type | Default | Description                               |
|-------|------|---------|-------------------------------------------|
| -     | -    | -       | Status fields are reserved for future use |

## Getting the Agent CA Certificate

When using agent-based communication (`agent.enabled: true`), you need to provide the cluster agent's CA certificate in the BuildPlane CR. This certificate is used by the control plane to verify the identity of the build plane agent during mTLS authentication.

### Extracting the CA Certificate

The cluster agent automatically generates its CA certificate when deployed to the build plane cluster. You can extract it using:

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
  agent:
    enabled: true
    clientCA:
      value: |
$(echo "$BP_CA_CERT" | sed 's/^/        /')
  observer:
    url: https://observer.example.com
    authentication:
      basicAuth:
        username: admin
        password: secretpassword
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
  agent:
    enabled: true
    clientCA:
      secretRef:
        name: buildplane-agent-ca
        namespace: my-org
        key: ca.crt
  observer:
    url: https://observer.example.com
    authentication:
      basicAuth:
        username: admin
        password: secretpassword
EOF
```

## Examples

### Agent-based BuildPlane (Recommended)

This example shows a BuildPlane using agent-based communication. The control plane communicates with the build cluster through a WebSocket agent.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: BuildPlane
metadata:
  name: agent-buildplane
  namespace: my-org
spec:
  # Agent configuration
  agent:
    enabled: true
    clientCA:
      secretRef:
        name: buildplane-agent-ca
        key: ca.crt

  # Observer API (optional)
  observer:
    url: https://observer.example.com
    authentication:
      basicAuth:
        username: admin
        password: secretpassword
```

### BuildPlane with Direct Kubernetes API Access

This example shows a BuildPlane using direct Kubernetes API access with client certificates.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: BuildPlane
metadata:
  name: direct-access-buildplane
  namespace: default
spec:
  kubernetesCluster:
    name: build-cluster-1
    credentials:
      apiServerURL: https://api.build-cluster.example.com:6443
      caCert: LS0tLS1CRUdJTi... # Base64-encoded CA cert
      clientCert: LS0tLS1CRUdJTi... # Base64-encoded client cert
      clientKey: LS0tLS1CRUdJTi... # Base64-encoded client key
  observer:
    url: https://observer.example.com
    authentication:
      basicAuth:
        username: admin
        password: secretpassword
```

## Annotations

BuildPlanes support the following annotations:

| Annotation                    | Description                            |
|-------------------------------|----------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display     |
| `openchoreo.dev/description`  | Detailed description of the BuildPlane |

## Related Resources

- [Build](../application/build.md) - Build job definitions that execute on BuildPlanes
- [Component](../application/component.md) - Application components that trigger builds
- [Organization](./organization.md) - Organizational context for BuildPlanes
