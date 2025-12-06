---
title: DataPlane API Reference
---

# DataPlane

A DataPlane represents a Kubernetes cluster where application workloads are deployed. It defines the connection to a target Kubernetes cluster and gateway settings for routing traffic to applications.

OpenChoreo supports two modes of communication with the DataPlane:
- **Agent-based** (Recommended): The control plane communicates with the downstream cluster through a WebSocket agent running in the DataPlane cluster
- **Direct Kubernetes API access**: The control plane connects directly to the Kubernetes API server using client certificates or bearer tokens

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

DataPlanes are namespace-scoped resources that must be created within an Organization's namespace.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: DataPlane
metadata:
  name: <dataplane-name>
  namespace: <org-namespace>  # Organization namespace
```

### Spec Fields

| Field                 | Type                                            | Required | Default | Description                                                                    |
|-----------------------|-------------------------------------------------|----------|---------|--------------------------------------------------------------------------------|
| `gateway`             | [GatewaySpec](#gatewayspec)                     | Yes      | -       | API gateway configuration for this DataPlane                                   |
| `agent`               | [AgentConfig](#agentconfig)                     | No       | -       | Agent-based communication configuration (recommended)                          |
| `kubernetesCluster`   | [KubernetesClusterSpec](#kubernetesclusterspec) | No       | -       | Target Kubernetes cluster configuration (optional when agent is enabled) |
| `imagePullSecretRefs` | []string                                        | No       | -       | References to SecretReference resources for image pull secrets                 |
| `secretStoreRef`      | [SecretStoreRef](#secretstoreref)               | No       | -       | Reference to External Secrets Operator ClusterSecretStore in the DataPlane    |
| `observer`            | [ObserverAPI](#observerapi)                     | No       | -       | Observer API integration for monitoring and logging                            |

### AgentConfig

Configuration for agent-based communication with the downstream cluster.

| Field      | Type                      | Required | Default | Description                                                                  |
|------------|---------------------------|----------|---------|------------------------------------------------------------------------------|
| `enabled`  | boolean                   | No       | false   | Whether agent-based communication is enabled                                 |
| `clientCA` | [ValueFrom](#valuefrom)   | No       | -       | CA certificate to verify the agent's client certificate (base64-encoded PEM) |

### KubernetesClusterSpec

Configuration for the target Kubernetes cluster. Optional when `agent.enabled` is true.

| Field    | Type                              | Required | Default | Description                                    |
|----------|-----------------------------------|----------|---------|------------------------------------------------|
| `server` | string                            | Yes      | -       | URL of the Kubernetes API server               |
| `tls`    | [KubernetesTLS](#kubernetestls)   | Yes      | -       | TLS configuration for the connection           |
| `auth`   | [KubernetesAuth](#kubernetesauth) | Yes      | -       | Authentication configuration                   |

### KubernetesTLS

TLS configuration for the Kubernetes connection.

| Field | Type                    | Required | Default | Description                |
|-------|-------------------------|----------|---------|----------------------------|
| `ca`  | [ValueFrom](#valuefrom) | Yes      | -       | CA certificate             |

### KubernetesAuth

Authentication configuration for the Kubernetes cluster. Either `mtls` or `bearerToken` must be specified.

| Field         | Type                      | Required | Default | Description                                   |
|---------------|---------------------------|----------|---------|-----------------------------------------------|
| `mtls`        | [MTLSAuth](#mtlsauth)     | No       | -       | Certificate-based authentication (mTLS)       |
| `bearerToken` | [ValueFrom](#valuefrom)   | No       | -       | Bearer token authentication                   |

### MTLSAuth

Certificate-based authentication (mTLS) configuration.

| Field        | Type                    | Required | Default | Description            |
|--------------|-------------------------|----------|---------|------------------------|
| `clientCert` | [ValueFrom](#valuefrom) | Yes      | -       | Client certificate     |
| `clientKey`  | [ValueFrom](#valuefrom) | Yes      | -       | Client private key     |

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

### SecretStoreRef

Reference to an External Secrets Operator ClusterSecretStore.

| Field  | Type   | Required | Default | Description                                       |
|--------|--------|----------|---------|---------------------------------------------------|
| `name` | string | Yes      | -       | Name of the ClusterSecretStore in the DataPlane   |

### GatewaySpec

Gateway configuration for the DataPlane.

| Field                     | Type   | Required | Default | Description                                             |
|---------------------------|--------|----------|---------|---------------------------------------------------------|
| `publicVirtualHost`       | string | Yes      | -       | Public virtual host for external traffic                |
| `organizationVirtualHost` | string | Yes      | -       | Organization-specific virtual host for internal traffic |

### ObserverAPI

Configuration for Observer API integration.

| Field                               | Type   | Required | Default | Description                       |
|-------------------------------------|--------|----------|---------|-----------------------------------|
| `url`                               | string | Yes      | -       | Base URL of the Observer API      |
| `authentication.basicAuth.username` | string | Yes      | -       | Username for basic authentication |
| `authentication.basicAuth.password` | string | Yes      | -       | Password for basic authentication |

### Status Fields

| Field                | Type        | Default | Description                                                 |
|----------------------|-------------|---------|-------------------------------------------------------------|
| `observedGeneration` | integer     | 0       | The generation observed by the controller                   |
| `conditions`         | []Condition | []      | Standard Kubernetes conditions tracking the DataPlane state |

#### Condition Types

Common condition types for DataPlane resources:

- `Ready` - Indicates if the DataPlane is ready to accept workloads
- `Connected` - Indicates if connection to the target cluster is established
- `GatewayProvisioned` - Indicates if the gateway has been configured

## Getting the Agent CA Certificate

When using agent-based communication (`agent.enabled: true`), you need to provide the cluster agent's CA certificate in the DataPlane CR. This certificate is used by the control plane to verify the identity of the data plane agent during mTLS authentication.

### Extracting the CA Certificate

The cluster agent automatically generates its CA certificate when deployed to the data plane cluster. You can extract it using:

```bash
kubectl get secret cluster-agent-tls \
  -n openchoreo-data-plane \
  -o jsonpath='{.data.ca\.crt}' | base64 -d
```

### Adding the Certificate to the DataPlane CR

You can add the CA certificate to the DataPlane CR in two ways:

**Option 1: Inline value (for testing/development)**

```bash
# Extract the CA certificate
CA_CERT=$(kubectl get secret cluster-agent-tls \
  -n openchoreo-data-plane \
  -o jsonpath='{.data.ca\.crt}' | base64 -d)

# Create DataPlane with inline CA certificate
kubectl apply -f - <<EOF
apiVersion: openchoreo.dev/v1alpha1
kind: DataPlane
metadata:
  name: my-dataplane
  namespace: my-org
spec:
  agent:
    enabled: true
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
# Extract and create a secret in the control plane
kubectl get secret cluster-agent-tls \
  -n openchoreo-data-plane \
  -o jsonpath='{.data.ca\.crt}' | base64 -d > /tmp/dataplane-ca.crt

kubectl create secret generic dataplane-agent-ca \
  --from-file=ca.crt=/tmp/dataplane-ca.crt \
  -n my-org

# Create DataPlane referencing the secret
kubectl apply -f - <<EOF
apiVersion: openchoreo.dev/v1alpha1
kind: DataPlane
metadata:
  name: my-dataplane
  namespace: my-org
spec:
  agent:
    enabled: true
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

**Note:** In multi-cluster setups, make sure to use the appropriate kubectl context when extracting the certificate from the data plane cluster.

## Examples

### Agent-based DataPlane

This example shows a DataPlane using agent-based communication. The control plane communicates with the downstream cluster through a WebSocket agent.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: DataPlane
metadata:
  name: agent-dataplane
  namespace: my-org
spec:
  # Agent configuration
  agent:
    enabled: true
    clientCA:
      secretRef:
        name: cluster-agent-ca
        key: ca.crt

  # Gateway configuration
  gateway:
    publicVirtualHost: api.example.com
    organizationVirtualHost: internal.example.com

  # External Secrets Operator integration
  secretStoreRef:
    name: vault-backend

  # Image pull secret references
  imagePullSecretRefs:
    - docker-registry-credentials

  # Observer API (optional)
  observer:
    url: https://observer.example.com
    authentication:
      basicAuth:
        username: admin
        password: secretpassword
```

### Direct Kubernetes API Access DataPlane

This example shows a DataPlane using direct Kubernetes API access with mTLS authentication.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: DataPlane
metadata:
  name: production-dataplane
  namespace: my-org
spec:
  # Direct Kubernetes cluster access
  kubernetesCluster:
    server: https://k8s-api.example.com:6443
    tls:
      ca:
        secretRef:
          name: k8s-ca-cert
          key: ca.crt
    auth:
      mtls:
        clientCert:
          secretRef:
            name: k8s-client-cert
            key: tls.crt
        clientKey:
          secretRef:
            name: k8s-client-cert
            key: tls.key

  # Gateway configuration
  gateway:
    publicVirtualHost: api.example.com
    organizationVirtualHost: internal.example.com

  # Observer API (optional)
  observer:
    url: https://observer.example.com
    authentication:
      basicAuth:
        username: admin
        password: secretpassword
```

### DataPlane with Bearer Token Authentication

This example shows a DataPlane using bearer token authentication instead of mTLS.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: DataPlane
metadata:
  name: dev-dataplane
  namespace: my-org
spec:
  kubernetesCluster:
    server: https://k8s-dev.example.com:6443
    tls:
      ca:
        secretRef:
          name: k8s-ca-cert
          key: ca.crt
    auth:
      bearerToken:
        secretRef:
          name: k8s-token
          key: token

  gateway:
    publicVirtualHost: dev-api.example.com
    organizationVirtualHost: dev-internal.example.com
```

### DataPlane with External Secrets Integration

This example demonstrates using External Secrets Operator for managing secrets and image pull credentials.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: DataPlane
metadata:
  name: secure-dataplane
  namespace: my-org
spec:
  # Agent-based communication
  agent:
    enabled: true
    clientCA:
      secretRef:
        name: agent-ca-cert
        namespace: openchoreo-system
        key: ca.crt

  # External Secrets Operator ClusterSecretStore reference
  secretStoreRef:
    name: vault-backend

  # References to SecretReference resources
  # These will be converted to ExternalSecrets and added as imagePullSecrets
  imagePullSecretRefs:
    - docker-hub-credentials
    - gcr-credentials
    - private-registry-credentials

  gateway:
    publicVirtualHost: secure-api.example.com
    organizationVirtualHost: secure-internal.example.com
```

## Annotations

DataPlanes support the following annotations:

| Annotation                    | Description                           |
|-------------------------------|---------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display    |
| `openchoreo.dev/description`  | Detailed description of the DataPlane |

## Related Resources

- [Environment](./environment.md) - Runtime environments deployed on DataPlanes
- [Organization](./organization.md) - Contains DataPlane definitions
- [Project](../application/project.md) - Applications deployed to DataPlanes
