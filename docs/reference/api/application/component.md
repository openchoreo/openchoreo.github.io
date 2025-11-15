---
title: Component API Reference
---

# Component

A Component represents a deployable unit of software in OpenChoreo. It connects a ComponentType (which defines how to
deploy) with parameters (which configure what to deploy), optional traits (which add capabilities), and optional
workflow configuration (which defines how to build). Components are the primary building blocks used to define
applications within a Project.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

Components are namespace-scoped resources that must be created within an Organization's namespace and belong to a
Project through the owner field.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: <component-name>
  namespace: <org-namespace>  # Organization namespace
```

### Spec Fields

| Field           | Type                              | Required | Default | Description                                                                                    |
|-----------------|-----------------------------------|----------|---------|------------------------------------------------------------------------------------------------|
| `owner`         | [ComponentOwner](#componentowner) | Yes      | -       | Ownership information linking the component to a project                                       |
| `componentType` | string                            | No*      | -       | ComponentType reference in format `{workloadType}/{componentTypeName}` (new schema-driven API) |
| `type`          | string                            | No*      | -       | Legacy component type (Service, WebApplication, ScheduledTask) - use `componentType` instead   |
| `parameters`    | object                            | No       | -       | Configuration values conforming to the ComponentType schema                                    |
| `traits`        | [[ComponentTrait](#componenttrait)] | No     | []      | Trait instances to compose into this component                                                 |
| `workflow`      | [WorkflowConfig](#workflowconfig) | No       | -       | Optional workflow configuration for building from source                                       |

*Either `componentType` (new) or `type` (legacy) must be specified.

### ComponentOwner

| Field         | Type   | Required | Default | Description                                           |
|---------------|--------|----------|---------|-------------------------------------------------------|
| `projectName` | string | Yes      | -       | Name of the project that owns this component (min: 1) |

### ComponentTrait

| Field          | Type   | Required | Default | Description                                                               |
|----------------|--------|----------|---------|---------------------------------------------------------------------------|
| `name`         | string | Yes      | -       | Name of the Trait resource to use                                         |
| `instanceName` | string | Yes      | -       | Unique identifier for this trait instance within the component            |
| `parameters`   | object | No       | -       | Trait parameter values conforming to the Trait's schema                   |

### WorkflowConfig

| Field    | Type   | Required | Default | Description                                                          |
|----------|--------|----------|---------|----------------------------------------------------------------------|
| `name`   | string | Yes      | -       | Name of the Workflow CR to use for building                          |
| `schema` | object | No       | -       | Developer-provided values conforming to the Workflow's schema        |

### Status Fields

| Field                | Type        | Default | Description                                             |
|----------------------|-------------|---------|---------------------------------------------------------|
| `observedGeneration` | integer     | 0       | The generation observed by the controller               |
| `conditions`         | []Condition | []      | Standard Kubernetes conditions tracking component state |

#### Condition Types

Common condition types for Component resources:

- `Ready` - Indicates if the component is ready
- `Reconciled` - Indicates if the controller has successfully reconciled the component

## Examples

### Basic Component with ComponentType

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: customer-service
  namespace: default
spec:
  owner:
    projectName: ecommerce

  componentType: deployment/http-service

  parameters:
    replicas: 2
    port: 8080
    resources:
      requests:
        cpu: "200m"
        memory: "512Mi"
      limits:
        cpu: "1000m"
        memory: "1Gi"
```

### Component with Workflow Configuration

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: payment-service
  namespace: default
spec:
  owner:
    projectName: ecommerce

  componentType: deployment/secure-service

  parameters:
    replicas: 3
    port: 8080

  workflow:
    name: docker
    schema:
      repository:
        url: https://github.com/myorg/payment-service
        revision:
          branch: main
        appPath: .
        secretRef: github-credentials
      docker:
        context: .
        filePath: ./Dockerfile
```

### Component with Traits

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: order-service
  namespace: default
spec:
  owner:
    projectName: ecommerce

  componentType: deployment/web-service

  parameters:
    replicas: 2
    port: 8080
    resources:
      requests:
        cpu: "200m"
        memory: "512Mi"
      limits:
        cpu: "1000m"
        memory: "1Gi"

  traits:
    - name: persistent-volume
      instanceName: data-storage
      parameters:
        volumeName: order-data
        mountPath: /var/data
        containerName: app
        size: "20Gi"
        storageClass: "fast"

    - name: emptydir-volume
      instanceName: cache
      parameters:
        volumeName: cache-vol
        mounts:
          - containerName: app
            mountPath: /tmp/cache
            readOnly: false
        medium: ""
        sizeLimit: "1Gi"
```

### Component with Multiple Traits and Workflow

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: analytics-service
  namespace: default
spec:
  owner:
    projectName: data-platform

  componentType: deployment/data-processor

  parameters:
    replicas: 1
    resources:
      requests:
        cpu: "500m"
        memory: "2Gi"
      limits:
        cpu: "2000m"
        memory: "4Gi"

  traits:
    - name: persistent-volume
      instanceName: analytics-data
      parameters:
        volumeName: analytics-storage
        mountPath: /data
        size: "100Gi"

    - name: monitoring
      instanceName: metrics
      parameters:
        enabled: true
        port: 9090

  workflow:
    name: google-cloud-buildpacks
    schema:
      repository:
        url: https://github.com/myorg/analytics-service
        revision:
          branch: main
        secretRef: repo-credentials
      version: 1
      testMode: unit
      resources:
        cpuCores: 2
        memoryGb: 4
```

### CronJob Component

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: daily-report-generator
  namespace: default
spec:
  owner:
    projectName: reporting

  componentType: cronjob/scheduled-processor

  parameters:
    schedule: "0 2 * * *"  # Run at 2 AM daily
    resources:
      requests:
        cpu: "100m"
        memory: "256Mi"
      limits:
        cpu: "500m"
        memory: "512Mi"

  workflow:
    name: docker
    schema:
      repository:
        url: https://github.com/myorg/report-generator
        secretRef: github-token
```

## Annotations

Components support the following annotations:

| Annotation                    | Description                           |
|-------------------------------|---------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display    |
| `openchoreo.dev/description`  | Detailed description of the component |

## Related Resources

- [Project](./project.md) - Contains components
- [ComponentType](../platform/componenttype.md) - Defines deployment templates for components
- [Workload](./workload.md) - Workload definitions associated with components
- [WorkflowRun](./workflowrun.md) - Workflow execution instances for builds
- [Workflow](../platform/workflow.md) - Build workflow templates