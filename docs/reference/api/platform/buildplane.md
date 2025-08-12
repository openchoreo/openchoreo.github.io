---
layout: docs
title: BuildPlane API Reference
---

# BuildPlane

A BuildPlane represents the infrastructure layer responsible for executing build workloads in OpenChoreo. It provides
the necessary compute resources and configuration for running CI/CD pipelines, typically using Argo Workflows or similar
build orchestration systems. Each BuildPlane is associated with a specific Kubernetes cluster where build jobs are
executed.

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
| `kubernetesCluster` | [KubernetesClusterSpec](#kubernetesclusterspec) | Yes      | -       | Defines the Kubernetes cluster where build workloads (e.g., Argo Workflows) will be executed       |
| `observer`          | [ObserverAPI](#observerapi)                     | No       | -       | Configuration for the Observer API integration for monitoring and observability of build processes |

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

## Examples

### Basic BuildPlane

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: BuildPlane
metadata:
  name: primary-buildplane
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

- [Build](/docs/reference/api/application/build/) - Build job definitions that execute on BuildPlanes
- [Component](/docs/reference/api/application/component/) - Application components that trigger builds
- [Organization](/docs/reference/api/platform/organization/) - Organizational context for BuildPlanes
