---
title: RenderedRelease API Reference
---

# RenderedRelease

A RenderedRelease represents the actual deployment of application resources to a target plane (DataPlane or
ObservabilityPlane) in OpenChoreo. It is created by the ReleaseBinding controller and contains the complete set of
Kubernetes resources that need to be applied to the target plane. RenderedReleases manage the lifecycle and health
monitoring of deployed resources.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

RenderedReleases are namespace-scoped resources.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: RenderedRelease
metadata:
  name: <renderedrelease-name>
  namespace: <namespace> # Namespace for grouping rendered releases
```

### Spec Fields

| Field                 | Type                                          | Required | Default   | Description                                                                          |
| --------------------- | --------------------------------------------- | -------- | --------- | ------------------------------------------------------------------------------------ |
| `owner`               | [RenderedReleaseOwner](#renderedreleaseowner) | Yes      | -         | Ownership information linking the rendered release to a project and component        |
| `environmentName`     | string                                        | Yes      | -         | Name of the target environment for this rendered release                             |
| `resources`           | [[Resource](#resource)]                       | No       | []        | List of Kubernetes resources to apply to the target plane                            |
| `interval`            | Duration                                      | No       | 5m        | Watch interval for resources when stable                                             |
| `progressingInterval` | Duration                                      | No       | 10s       | Watch interval for resources when transitioning                                      |
| `targetPlane`         | string                                        | No       | dataplane | Which plane this release should be deployed to (`dataplane` or `observabilityplane`) |

### RenderedReleaseOwner

| Field           | Type   | Required | Default | Description                                           |
| --------------- | ------ | -------- | ------- | ----------------------------------------------------- |
| `projectName`   | string | Yes      | -       | Name of the project that owns this rendered release   |
| `componentName` | string | Yes      | -       | Name of the component that owns this rendered release |

### Resource

| Field    | Type                 | Required | Default | Description                                              |
| -------- | -------------------- | -------- | ------- | -------------------------------------------------------- |
| `id`     | string               | Yes      | -       | Unique identifier for the resource                       |
| `object` | runtime.RawExtension | Yes      | -       | Complete Kubernetes resource definition in raw JSON/YAML |

### Status Fields

| Field        | Type                                | Default | Description                                                               |
| ------------ | ----------------------------------- | ------- | ------------------------------------------------------------------------- |
| `resources`  | [[ResourceStatus](#resourcestatus)] | []      | List of resources that have been successfully applied to the target plane |
| `conditions` | [[Condition](#conditions)]          | []      | Conditions tracking the rendered release state                            |

### ResourceStatus

| Field              | Type                          | Default | Description                                                |
| ------------------ | ----------------------------- | ------- | ---------------------------------------------------------- |
| `id`               | string                        | -       | Corresponds to the resource ID in spec.resources           |
| `group`            | string                        | ""      | API group of the resource (e.g., "apps", "batch")          |
| `version`          | string                        | -       | API version of the resource (e.g., "v1", "v1beta1")        |
| `kind`             | string                        | -       | Type of the resource (e.g., "Deployment", "Service")       |
| `name`             | string                        | -       | Name of the resource in the target plane                   |
| `namespace`        | string                        | ""      | Namespace of the resource in the target plane              |
| `status`           | runtime.RawExtension          | -       | Entire .status field of the resource from the target plane |
| `healthStatus`     | [HealthStatus](#healthstatus) | -       | Health of the resource in the target plane                 |
| `lastObservedTime` | Time                          | -       | Last time the status was observed                          |

### HealthStatus

| Value         | Description                                                                      |
| ------------- | -------------------------------------------------------------------------------- |
| `Unknown`     | Health of the resource is not known                                              |
| `Progressing` | Resource is in a transitioning state to become healthy                           |
| `Healthy`     | Resource is healthy and operating as expected                                    |
| `Suspended`   | Resource is intentionally paused (e.g., CronJob, Deployment with paused rollout) |
| `Degraded`    | Resource is not healthy and not operating as expected                            |

### Conditions

RenderedReleases report their state through standard Kubernetes conditions. The following condition types are used:

| Type         | Description                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| `Finalizing` | Indicates the RenderedRelease is being deleted and resources are being cleaned up from the target plane |

## Examples

### Basic RenderedRelease with Deployment and Service

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: RenderedRelease
metadata:
  name: customer-service-prod-renderedrelease
  namespace: default
spec:
  owner:
    projectName: my-project
    componentName: customer-service
  environmentName: production
  interval: 5m
  progressingInterval: 10s
  resources:
    - id: deployment
      object:
        apiVersion: apps/v1
        kind: Deployment
        metadata:
          name: customer-service
          namespace: prod-data-plane
        spec:
          replicas: 3
          selector:
            matchLabels:
              app: customer-service
          template:
            metadata:
              labels:
                app: customer-service
            spec:
              containers:
                - name: main
                  image: myregistry/customer-service:v1.0.0
                  ports:
                    - containerPort: 8080
    - id: service
      object:
        apiVersion: v1
        kind: Service
        metadata:
          name: customer-service
          namespace: prod-data-plane
        spec:
          selector:
            app: customer-service
          ports:
            - port: 80
              targetPort: 8080
```

## Annotations

RenderedReleases support the following annotations:

| Annotation                    | Description                                  |
| ----------------------------- | -------------------------------------------- |
| `openchoreo.dev/display-name` | Human-readable name for UI display           |
| `openchoreo.dev/description`  | Detailed description of the rendered release |

## Related Resources

- [Environment](../platform/environment.md) - Target environments for rendered releases
- [DataPlane](../platform/dataplane.md) - Data planes where application resources are deployed
- [ObservabilityPlane](../platform/observabilityplane.md) - Observability planes where monitoring resources are deployed
