---
title: ScheduledTaskBinding API Reference
---

# ScheduledTaskBinding

A ScheduledTaskBinding represents the deployment of a ScheduledTask to a specific Environment in OpenChoreo. It binds a
ScheduledTask component to an environment, creating the actual runtime instances for scheduled jobs.
ScheduledTaskBindings
contain environment-specific configurations including the workload specification and scheduling parameters. They control
the lifecycle of the deployed scheduled task.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ScheduledTaskBindings are namespace-scoped resources.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ScheduledTaskBinding
metadata:
  name: <scheduledtaskbinding-name>
  namespace: <namespace>  # Namespace for grouping scheduled task bindings
```

### Spec Fields

| Field          | Type                                          | Required | Default   | Description                                                           |
|----------------|-----------------------------------------------|----------|-----------|-----------------------------------------------------------------------|
| `owner`        | [ScheduledTaskOwner](#scheduledtaskowner)     | Yes      | -         | Ownership information linking the binding to a project and component  |
| `environment`  | string                                        | Yes      | -         | Target environment for this binding                                   |
| `className`    | string                                        | No       | "default" | Name of the ScheduledTaskClass that provides deployment configuration |
| `workloadSpec` | [WorkloadTemplateSpec](#workloadtemplatespec) | Yes      | -         | Workload specification for this environment                           |
| `releaseState` | [ReleaseState](#releasestate)                 | No       | "Active"  | Controls the deployment state of the release                          |

### ScheduledTaskOwner

| Field           | Type   | Required | Default | Description                                                 |
|-----------------|--------|----------|---------|-------------------------------------------------------------|
| `projectName`   | string | Yes      | -       | Name of the project that owns this scheduled task binding   |
| `componentName` | string | Yes      | -       | Name of the component that owns this scheduled task binding |

### WorkloadTemplateSpec

The WorkloadTemplateSpec contains the same fields as the Workload spec, allowing environment-specific configuration.

| Field         | Type                                                                           | Required | Default | Description                                                                                            |
|---------------|--------------------------------------------------------------------------------|----------|---------|--------------------------------------------------------------------------------------------------------|
| `containers`  | map[string][Container](../application/workload.md#container)                   | Yes      | -       | Container specifications keyed by container name. Must have at least one container with the key "main" |
| `endpoints`   | map[string][WorkloadEndpoint](../application/workload.md#workloadendpoint)     | No       | {}      | Network endpoints for port exposure keyed by endpoint name                                             |
| `connections` | map[string][WorkloadConnection](../application/workload.md#workloadconnection) | No       | {}      | Connections to internal/external resources keyed by connection name                                    |

### ReleaseState

| Value      | Description                                       |
|------------|---------------------------------------------------|
| `Active`   | Resources are deployed normally to the data plane |
| `Suspend`  | Resources are suspended (scheduled job is paused) |
| `Undeploy` | Resources are removed from the data plane         |

## Examples

### Basic ScheduledTaskBinding

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ScheduledTaskBinding
metadata:
  name: data-cleanup-prod-binding
  namespace: default
spec:
  owner:
    projectName: my-project
    componentName: data-cleanup
  environment: production
  className: default
  workloadSpec:
    containers:
      main:
        image: myregistry/data-cleanup:v1.2.0
        env:
          - key: RETENTION_DAYS
            value: "30"
          - key: LOG_LEVEL
            value: info
```

## Annotations

ScheduledTaskBindings support the following annotations:

| Annotation                    | Description                                        |
|-------------------------------|----------------------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display                 |
| `openchoreo.dev/description`  | Detailed description of the scheduled task binding |

## Related Resources

- [ScheduledTask](../application/scheduledtask.md) - ScheduledTask resources that ScheduledTaskBindings
  deploy
- [Environment](../platform/environment.md) - Environments where scheduled tasks are bound
- [Release](./release.md) - Releases created by ScheduledTaskBindings
- [Workload](../application/workload.md) - Workload specifications used in bindings
