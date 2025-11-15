---
title: DataPlane API Reference
---

# DataPlane

A DataPlane represents a Kubernetes cluster where application workloads are deployed. It defines the connection to a
target Kubernetes cluster, container registry configuration, and gateway settings for routing traffic to applications.

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

| Field               | Type                                            | Required | Default | Description                                         |
|---------------------|-------------------------------------------------|----------|---------|-----------------------------------------------------|
| `kubernetesCluster` | [KubernetesClusterSpec](#kubernetesclusterspec) | Yes      | -       | Target Kubernetes cluster configuration             |
| `registry`          | [Registry](#registry)                           | Yes      | -       | Container registry configuration for pulling images |
| `gateway`           | [GatewaySpec](#gatewayspec)                     | Yes      | -       | API gateway configuration for this DataPlane        |
| `observer`          | [ObserverAPI](#observerapi)                     | No       | -       | Observer API integration for monitoring and logging |

### KubernetesClusterSpec

| Field                      | Type   | Required | Default | Description                       |
|----------------------------|--------|----------|---------|-----------------------------------|
| `name`                     | string | Yes      | -       | Name of the Kubernetes cluster    |
| `credentials.apiServerURL` | string | Yes      | -       | URL of the Kubernetes API server  |
| `credentials.caCert`       | string | Yes      | -       | Base64-encoded CA certificate     |
| `credentials.clientCert`   | string | Yes      | -       | Base64-encoded client certificate |
| `credentials.clientKey`    | string | Yes      | -       | Base64-encoded client private key |

### Registry

| Field       | Type   | Required | Default | Description                                               |
|-------------|--------|----------|---------|-----------------------------------------------------------|
| `prefix`    | string | Yes      | -       | Registry domain and namespace (e.g., docker.io/namespace) |
| `secretRef` | string | No       | ""      | Name of Kubernetes Secret with registry credentials       |

### GatewaySpec

| Field                     | Type   | Required | Default | Description                                             |
|---------------------------|--------|----------|---------|---------------------------------------------------------|
| `publicVirtualHost`       | string | Yes      | -       | Public virtual host for external traffic                |
| `organizationVirtualHost` | string | Yes      | -       | Organization-specific virtual host for internal traffic |

### ObserverAPI

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

## Examples

### Basic DataPlane

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: DataPlane
metadata:
  name: production-dataplane
  namespace: default
spec:
  kubernetesCluster:
    name: production-cluster
    credentials:
      apiServerURL: https://k8s-api.example.com:6443
      caCert: LS0tLS1CRUdJTi... # Base64-encoded CA cert
      clientCert: LS0tLS1CRUdJTi... # Base64-encoded client cert
      clientKey: LS0tLS1CRUdJTi... # Base64-encoded client key
  registry:
    prefix: docker.io/myorg
    secretRef: registry-credentials
  gateway:
    publicVirtualHost: api.example.com
    organizationVirtualHost: internal.example.com
  observer:
    url: https://observer.example.com
    authentication:
      basicAuth:
        username: admin
        password: secretpassword
```

## Annotations

DataPlanes support the following annotations:

| Annotation                    | Description                           |
|-------------------------------|---------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display    |
| `openchoreo.dev/description`  | Detailed description of the DataPlane |

## Related Resources

- [Environment](./environment.md) - Runtime environments deployed on DataPlanes
- [Project](../application/project.md) - Applications deployed to DataPlanes
