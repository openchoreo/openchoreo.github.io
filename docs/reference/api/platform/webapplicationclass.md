---
title: WebApplicationClass API Reference
---

# WebApplicationClass

A WebApplicationClass is a platform-level template that provides governance and standardization for WebApplication
resources in OpenChoreo. It follows the Claim/Class pattern where platform teams define Classes to enforce
organizational policies, resource limits, and deployment configurations while application teams create
WebApplications (claims) that reference these classes.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

WebApplicationClasses are namespace-scoped resources that must be created within an Organization's namespace.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WebApplicationClass
metadata:
  name: <webapplicationclass-name>
  namespace: <org-namespace>  # Organization namespace
```

### Spec Fields

| Field                | Type                                                                                                                                     | Required | Default | Description                                                                |
|----------------------|------------------------------------------------------------------------------------------------------------------------------------------|----------|---------|----------------------------------------------------------------------------|
| `deploymentTemplate` | <a href="https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.32/#deploymentspec-v1-apps" target="_blank">DeploymentSpec</a> | No       | -       | Kubernetes Deployment specification template for web application workloads |
| `serviceTemplate`    | <a href="https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.32/#servicespec-v1-core" target="_blank">ServiceSpec</a>       | No       | -       | Kubernetes Service specification template for web application networking   |

## Examples

### Basic WebApplicationClass

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WebApplicationClass
metadata:
  name: standard-webapp
  namespace: default
spec:
  deploymentTemplate:
    replicas: 3
    selector:
      matchLabels:
        app: webapp
    template:
      spec:
        containers:
          - name: main
            resources:
              requests:
                memory: "256Mi"
                cpu: "200m"
              limits:
                memory: "1Gi"
                cpu: "1000m"
  serviceTemplate:
    type: ClusterIP
    ports:
      - port: 80
        targetPort: 8080
        protocol: TCP
```

## Annotations

WebApplicationClasses support the following annotations:

| Annotation                    | Description                                     |
|-------------------------------|-------------------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display              |
| `openchoreo.dev/description`  | Detailed description of the WebApplicationClass |

## Related Resources

- [WebApplication](/docs/reference/api/application/webapplication/) - WebApplication resources that reference
  WebApplicationClasses
- [WebApplicationBinding](/docs/reference/api/runtime/webapplicationbinding/) - Environment-specific web application
  instances
- [Organization](/docs/reference/api/platform/organization/) - Contains WebApplicationClass definitions
