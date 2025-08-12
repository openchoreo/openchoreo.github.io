---
layout: docs
title: ServiceClass API Reference
---

# ServiceClass

A ServiceClass is a platform-level template that provides governance and standardization for Service
resources in OpenChoreo. It follows the Claim/Class pattern where platform teams define Classes to enforce
organizational policies, resource limits, and deployment configurations while application teams create Services (claims)
that reference these classes.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ServiceClasses are namespace-scoped resources that must be created within an Organization's namespace.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ServiceClass
metadata:
  name: <serviceclass-name>
  namespace: <org-namespace>  # Organization namespace
```

### Spec Fields

| Field                | Type                                                                                                                                     | Required | Default | Description                                                        |
|----------------------|------------------------------------------------------------------------------------------------------------------------------------------|----------|---------|--------------------------------------------------------------------|
| `deploymentTemplate` | <a href="https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.32/#deploymentspec-v1-apps" target="_blank">DeploymentSpec</a> | No       | -       | Kubernetes Deployment specification template for service workloads |
| `serviceTemplate`    | <a href="https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.32/#servicespec-v1-core" target="_blank">ServiceSpec</a>       | No       | -       | Kubernetes Service specification template for service networking   |

## Examples

### Basic ServiceClass

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ServiceClass
metadata:
  name: standard-service
  namespace: default
spec:
  deploymentTemplate:
    replicas: 2
    selector:
      matchLabels:
        app: service
    template:
      spec:
        containers:
          - name: main
            resources:
              requests:
                memory: "128Mi"
                cpu: "100m"
              limits:
                memory: "512Mi"
                cpu: "500m"
  serviceTemplate:
    type: ClusterIP
    ports:
      - port: 80
        targetPort: 8080
        protocol: TCP
```

## Annotations

ServiceClasses support the following annotations:

| Annotation                    | Description                              |
|-------------------------------|------------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display       |
| `openchoreo.dev/description`  | Detailed description of the ServiceClass |

## Related Resources

- [Service](/docs/reference/api/application/service/) - Service resources that reference ServiceClasses
- [ServiceBinding](/docs/reference/api/runtime/servicebinding/) - Environment-specific service instances
- [Organization](/docs/reference/api/platform/organization/) - Contains ServiceClass definitions
