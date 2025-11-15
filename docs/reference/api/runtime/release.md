---
title: Release API Reference
---

# Release

A Release represents the actual deployment of application resources to a data plane environment in OpenChoreo. It is
created by ComponentDeployment controllers and contains the complete set of Kubernetes resources that need to be
applied to the target environment. Releases manage the lifecycle and health monitoring of deployed resources across
all component types (deployments, statefulsets, cronjobs, jobs).

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

Releases are namespace-scoped resources that must be created within an Organization's namespace.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Release
metadata:
  name: <release-name>
  namespace: <org-namespace>  # Organization namespace
```

### Spec Fields

| Field                 | Type                          | Required | Default | Description                                                          |
|-----------------------|-------------------------------|----------|---------|----------------------------------------------------------------------|
| `owner`               | [ReleaseOwner](#releaseowner) | Yes      | -       | Ownership information linking the release to a project and component |
| `environmentName`     | string                        | Yes      | -       | Name of the target environment for this release                      |
| `resources`           | [[Resource](#resource)]       | No       | []      | List of Kubernetes resources to apply to the data plane              |
| `interval`            | Duration                      | No       | 5m      | Watch interval for resources when stable                             |
| `progressingInterval` | Duration                      | No       | 10s     | Watch interval for resources when transitioning                      |

### ReleaseOwner

| Field           | Type   | Required | Default | Description                                  |
|-----------------|--------|----------|---------|----------------------------------------------|
| `projectName`   | string | Yes      | -       | Name of the project that owns this release   |
| `componentName` | string | Yes      | -       | Name of the component that owns this release |

### Resource

| Field    | Type                 | Required | Default | Description                                              |
|----------|----------------------|----------|---------|----------------------------------------------------------|
| `id`     | string               | Yes      | -       | Unique identifier for the resource                       |
| `object` | runtime.RawExtension | Yes      | -       | Complete Kubernetes resource definition in raw JSON/YAML |

### Status Fields

| Field        | Type                                | Default | Description                                                             |
|--------------|-------------------------------------|---------|-------------------------------------------------------------------------|
| `resources`  | [[ResourceStatus](#resourcestatus)] | []      | List of resources that have been successfully applied to the data plane |
| `conditions` | [[Condition](#conditions)]          | []      | Conditions tracking the release state                                   |

### ResourceStatus

| Field              | Type                          | Default | Description                                              |
|--------------------|-------------------------------|---------|----------------------------------------------------------|
| `id`               | string                        | -       | Corresponds to the resource ID in spec.resources         |
| `group`            | string                        | ""      | API group of the resource (e.g., "apps", "batch")        |
| `version`          | string                        | -       | API version of the resource (e.g., "v1", "v1beta1")      |
| `kind`             | string                        | -       | Type of the resource (e.g., "Deployment", "Service")     |
| `name`             | string                        | -       | Name of the resource in the data plane                   |
| `namespace`        | string                        | ""      | Namespace of the resource in the data plane              |
| `status`           | runtime.RawExtension          | -       | Entire .status field of the resource from the data plane |
| `healthStatus`     | [HealthStatus](#healthstatus) | -       | Health of the resource in the data plane                 |
| `lastObservedTime` | Time                          | -       | Last time the status was observed                        |

### HealthStatus

| Value         | Description                                                                      |
|---------------|----------------------------------------------------------------------------------|
| `Unknown`     | Health of the resource is not known                                              |
| `Progressing` | Resource is in a transitioning state to become healthy                           |
| `Healthy`     | Resource is healthy and operating as expected                                    |
| `Suspended`   | Resource is intentionally paused (e.g., CronJob, Deployment with paused rollout) |
| `Degraded`    | Resource is not healthy and not operating as expected                            |

### Conditions

Releases report their state through standard Kubernetes conditions. The following condition types are used:

| Type         | Description                                                                                   |
|--------------|-----------------------------------------------------------------------------------------------|
| `Finalizing` | Indicates the Release is being deleted and resources are being cleaned up from the data plane |

## Examples

### Release for Deployment-based Component

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Release
metadata:
  name: customer-service-prod-release
  namespace: default
spec:
  owner:
    projectName: ecommerce
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
          name: customer-service-prod
          namespace: prod-data-plane
          labels:
            openchoreo.dev/component: customer-service
            openchoreo.dev/environment: production
        spec:
          replicas: 3
          selector:
            matchLabels:
              openchoreo.dev/component-id: abc123
          template:
            metadata:
              labels:
                openchoreo.dev/component-id: abc123
            spec:
              containers:
                - name: app
                  image: myregistry/customer-service:v1.0.0
                  ports:
                    - containerPort: 8080
                  resources:
                    requests:
                      cpu: "500m"
                      memory: "1Gi"
                    limits:
                      cpu: "2000m"
                      memory: "2Gi"
    - id: service
      object:
        apiVersion: v1
        kind: Service
        metadata:
          name: customer-service-prod
          namespace: prod-data-plane
        spec:
          selector:
            openchoreo.dev/component-id: abc123
          ports:
            - port: 80
              targetPort: 8080
```

### Release for CronJob-based Component

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Release
metadata:
  name: report-generator-prod-release
  namespace: default
spec:
  owner:
    projectName: reporting
    componentName: daily-report-generator
  environmentName: production
  resources:
    - id: cronjob
      object:
        apiVersion: batch/v1
        kind: CronJob
        metadata:
          name: daily-report-generator-prod
          namespace: prod-data-plane
        spec:
          schedule: "0 2 * * *"
          jobTemplate:
            spec:
              template:
                spec:
                  containers:
                    - name: app
                      image: myregistry/report-generator:v2.0.0
                      resources:
                        requests:
                          cpu: "200m"
                          memory: "512Mi"
                  restartPolicy: OnFailure
```

### Release with Multiple Resources

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Release
metadata:
  name: order-service-staging-release
  namespace: default
spec:
  owner:
    projectName: ecommerce
    componentName: order-service
  environmentName: staging
  resources:
    - id: deployment
      object:
        apiVersion: apps/v1
        kind: Deployment
        # ... deployment spec
    - id: service
      object:
        apiVersion: v1
        kind: Service
        # ... service spec
    - id: configmap
      object:
        apiVersion: v1
        kind: ConfigMap
        metadata:
          name: order-service-config
        data:
          database_url: "postgres://db.staging.example.com:5432/orders"
    - id: httproute
      object:
        apiVersion: gateway.networking.k8s.io/v1
        kind: HTTPRoute
        metadata:
          name: order-service-route
        spec:
          parentRefs:
            - name: gateway-external
          hostnames:
            - order-service-staging.example.com
          # ... route spec
```

## Status Example

After deployment, a Release status might look like:

```yaml
status:
  conditions:
    - type: Ready
      status: "True"
      lastTransitionTime: "2024-01-15T10:30:00Z"
      reason: AllResourcesHealthy
      message: All resources are healthy
  resources:
    - id: deployment
      group: apps
      version: v1
      kind: Deployment
      name: customer-service-prod
      namespace: prod-data-plane
      healthStatus: Healthy
      lastObservedTime: "2024-01-15T10:35:00Z"
    - id: service
      group: ""
      version: v1
      kind: Service
      name: customer-service-prod
      namespace: prod-data-plane
      healthStatus: Healthy
      lastObservedTime: "2024-01-15T10:35:00Z"
```

## Annotations

Releases support the following annotations:

| Annotation                    | Description                         |
|-------------------------------|-------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display  |
| `openchoreo.dev/description`  | Detailed description of the release |

## Related Resources

- [ComponentDeployment](./componentdeployment.md) - Creates releases for component deployments
- [Component](../application/component.md) - Components being deployed
- [Environment](../platform/environment.md) - Target environments for releases
- [DataPlane](../platform/dataplane.md) - Data planes where resources are deployed