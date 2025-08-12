---
layout: docs
title: ScheduledTask API Reference
---

# ScheduledTask

A ScheduledTask represents a scheduled or cron job component in OpenChoreo. It defines the deployment configuration for
scheduled task-type components by referencing a Workload and optionally a ScheduledTaskClass for platform-defined
policies. ScheduledTasks are used for batch processing, periodic maintenance, or any workload that runs on a schedule.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ScheduledTasks are namespace-scoped resources that must be created within an Organization's namespace and belong to a
Component through the owner field.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ScheduledTask
metadata:
  name: <scheduledtask-name>
  namespace: <org-namespace>  # Organization namespace
```

### Spec Fields

| Field          | Type                                            | Required | Default   | Description                                                                  |
|----------------|--------------------------------------------------|----------|-----------|------------------------------------------------------------------------------|
| `owner`        | [ScheduledTaskOwner](#scheduledtaskowner)       | Yes      | -         | Ownership information linking the scheduled task to a project and component  |
| `workloadName` | string                                           | Yes      | -         | Name of the workload that this scheduled task references                     |
| `className`    | string                                           | No       | "default" | Name of the ScheduledTaskClass that provides deployment configuration        |

### ScheduledTaskOwner

| Field           | Type   | Required | Default | Description                                                   |
|-----------------|--------|----------|---------|---------------------------------------------------------------|
| `projectName`   | string | Yes      | -       | Name of the project that owns this scheduled task (min: 1)    |
| `componentName` | string | Yes      | -       | Name of the component that owns this scheduled task (min: 1)  |

## Examples

### Basic ScheduledTask

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ScheduledTask
metadata:
  name: data-cleanup-job
  namespace: default
spec:
  owner:
    projectName: my-project
    componentName: data-cleanup
  workloadName: data-cleanup-workload
  className: default
```

### ScheduledTask with Custom Class

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ScheduledTask
metadata:
  name: report-generator
  namespace: default
spec:
  owner:
    projectName: my-project
    componentName: reporting
  workloadName: report-generator-workload
  className: hourly-batch-job
```

## Annotations

ScheduledTasks support the following annotations:

| Annotation                    | Description                              |
|-------------------------------|------------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display       |
| `openchoreo.dev/description`  | Detailed description of the scheduled task |

## Related Resources

- [Component](/docs/reference/api/application/component/) - Components that own scheduled tasks
- [Workload](/docs/reference/api/application/workload/) - Workloads referenced by scheduled tasks
- [ScheduledTaskClass](/docs/reference/api/platform/scheduledtaskclass/) - Platform-defined scheduled task templates
- [ScheduledTaskBinding](/docs/reference/api/runtime/scheduledtaskbinding/) - Environment-specific scheduled task instances