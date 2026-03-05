---
title: ScheduledTaskClass API Reference (Deprecated)
---

# ScheduledTaskClass

:::warning Deprecated
ScheduledTaskClass is deprecated as of OpenChoreo v0.4.0 and will be removed in a future version.
Use [ComponentType](componenttype.md) with [Traits](trait.md) instead for a more flexible and composable approach to
defining component deployment patterns.
:::

A ScheduledTaskClass is a platform-level template that provides governance and standardization for ScheduledTask
resources in OpenChoreo. It follows the Claim/Class pattern where platform teams define Classes to enforce
organizational policies, resource limits, and scheduling configurations while application teams create
ScheduledTasks (claims) that reference these classes.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ScheduledTaskClasses are namespace-scoped resources.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ScheduledTaskClass
metadata:
  name: <scheduledtaskclass-name>
  namespace: <namespace>  # Namespace for grouping scheduled task classes
```

### Spec Fields

| Field             | Type                                                                                                                                | Required | Default | Description                                                            |
|-------------------|-------------------------------------------------------------------------------------------------------------------------------------|----------|---------|------------------------------------------------------------------------|
| `cronJobTemplate` | <a href="https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.32/#cronjobspec-v1-batch" target="_blank">CronJobSpec</a> | No       | -       | Kubernetes CronJob specification template for scheduled task workloads |

## Examples

### Basic ScheduledTaskClass

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ScheduledTaskClass
metadata:
  name: standard-cronjob
  namespace: default
spec:
  cronJobTemplate:
    schedule: "*/30 * * * *"  # Every 30 minutes
    concurrencyPolicy: Forbid
    successfulJobsHistoryLimit: 3
    failedJobsHistoryLimit: 1
    jobTemplate:
      spec:
        backoffLimit: 3
        template:
          spec:
            restartPolicy: OnFailure
            containers:
              - name: main
                resources:
                  requests:
                    memory: "64Mi"
                    cpu: "50m"
                  limits:
                    memory: "256Mi"
                    cpu: "200m"
```

## Annotations

ScheduledTaskClasses support the following annotations:

| Annotation                    | Description                                    |
|-------------------------------|------------------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display             |
| `openchoreo.dev/description`  | Detailed description of the ScheduledTaskClass |

## Related Resources

- [ScheduledTask](../application/scheduledtask.md) - ScheduledTask resources that reference
  ScheduledTaskClasses
