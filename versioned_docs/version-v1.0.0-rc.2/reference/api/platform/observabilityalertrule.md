---
title: ObservabilityAlertRule API Reference
---

# ObservabilityAlertRule

An `ObservabilityAlertRule` defines a rule for monitoring runtime observability data (metrics or logs) and triggering alerts when specific conditions are met.

:::tip Generated Resources
`ObservabilityAlertRule` resources are **generated automatically** by the OpenChoreo control plane during component releases. They are derived from the alert definitions specified in a component's traits and environment-specific parameters are applied via `ReleaseBinding` CR.
:::

:::important Notification Channel Required
`ObservabilityAlertRule` resources require a [ObservabilityAlertsNotificationChannel](./observabilityalertsnotificationchannel.md) resource to be configured in the relevant environment before they can be created.
:::

## Usage Recommendation

You should **not** create `ObservabilityAlertRule` resources manually. Instead, you should define alert rules using a `Trait` (either from the default `observability-alert-rule` trait or a custom trait) within your component definition. This ensures that the alert rules are properly scoped to your component and managed as part of its lifecycle across different environments.

### Example: Defining Alerts as Traits

In your `Component` CR, add the alert rule as a trait (using the default `observability-alert-rule` trait). The trait is responsible for generating an `ObservabilityAlertRule` CR with the appropriate `spec.source`, `spec.condition`, and `spec.actions` fields:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: my-service
spec:
  # ... other component fields ...
  traits:
    - name: observability-alert-rule
      kind: Trait
      instanceName: high-error-rate-log-alert
      parameters:
        description: "Triggered when error logs count exceeds 50 in 5 minutes."
        severity: "critical"
        source:
          type: "log"
          query: "status:error"
        condition:
          window: 5m
          interval: 1m
          operator: gt
          threshold: 50
```

Override the environment-specific parameters for the alert rule (enablement, notification channels, and incident/AI RCA behavior) in the `ReleaseBinding` CR via `traitEnvironmentConfigs`:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ReleaseBinding
metadata:
  name: my-service-production
  namespace: default
spec:
  owner:
    projectName: default
    componentName: my-service
  environment: production

  traitEnvironmentConfigs:
    high-error-rate-log-alert:
      enabled: true
      actions:
        notifications:
          channels:
            - devops-email-notifications
        incident:
          enabled: true
          triggerAiRca: false
```

The control plane will then generate the corresponding `ObservabilityAlertRule` resource for each environment where this component is released.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

`ObservabilityAlertRule` resources are namespace-scoped and typically created within the project-environment namespace similar to how resources are created in dataplanes.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ObservabilityAlertRule
metadata:
  name: <rule-name>
  namespace: <project-environment-namespace>
```

### Spec Fields

| Field         | Type                              | Required | Description                                                                                   |
| ------------- | --------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `name`        | string                            | Yes      | Unique identifier for the alert rule                                                          |
| `description` | string                            | No       | A human-friendly summary of the alert rule                                                    |
| `severity`    | [AlertSeverity](#alertseverity)   | No       | Describes how urgent the alert is (`info`, `warning`, `critical`)                             |
| `enabled`     | boolean                           | No       | Toggles whether this alert rule should be evaluated. Defaults to `true`                       |
| `source`      | [AlertSource](#alertsource)       | Yes      | Specifies the observability source type (log or metric) and query/metric that drives the rule |
| `condition`   | [AlertCondition](#alertcondition) | Yes      | Controls when an alert should be triggered based on the source data                           |
| `actions`     | [AlertActions](#alertactions)     | Yes      | Defines where alerts are sent and whether incidents/AI RCA are triggered                      |

### AlertSeverity

| Value      | Description          |
| ---------- | -------------------- |
| `info`     | Informational alerts |
| `warning`  | Warning-level alerts |
| `critical` | Critical alerts      |

### AlertSource

Specifies where and how events are pulled for evaluation.

| Field    | Type                                | Required | Description                                                                                                                              |
| -------- | ----------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `type`   | [AlertSourceType](#alertsourcetype) | Yes      | The telemetry source type (`log`, `metric`)                                                                                              |
| `query`  | string                              | No       | The query for log-based alerting (for example, `status:error`). Required when `type=log`.                                                |
| `metric` | string                              | No       | The metric type for metrics-based alerting. Required when `type=metric`. Must be one of the supported metrics (cpu_usage, memory_usage). |

### AlertSourceType

| Value    | Description                                                            |
| -------- | ---------------------------------------------------------------------- |
| `log`    | Log-based alerting (powered by observability logs module)              |
| `metric` | Usage metrics-based alerting (powered by observability metrics module) |

### AlertCondition

Represents the conditions under which an alert should be triggered.

| Field       | Type                                              | Required | Description                                                                          |
| ----------- | ------------------------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| `window`    | duration                                          | Yes      | The time window aggregated before comparison (e.g., `5m`)                            |
| `interval`  | duration                                          | Yes      | How often the alert rule is evaluated (e.g., `1m`)                                   |
| `operator`  | [AlertConditionOperator](#alertconditionoperator) | Yes      | Comparison operator used for evaluation                                              |
| `threshold` | integer                                           | Yes      | Trigger value for the configured operator (percentage or count, depending on source) |

### AlertConditionOperator

| Value | Description                        |
| ----- | ---------------------------------- |
| `gt`  | Greater than threshold             |
| `lt`  | Less than threshold                |
| `gte` | Greater than or equal to threshold |
| `lte` | Less than or equal to threshold    |
| `eq`  | Equals the threshold               |

### AlertActions

Defines what happens when an alert rule is triggered.

| Field           | Type                                      | Required | Description                             |
| --------------- | ----------------------------------------- | -------- | --------------------------------------- |
| `notifications` | [AlertNotifications](#alertnotifications) | Yes      | Notification channels to send alerts to |
| `incident`      | [AlertIncident](#alertincident)           | No       | Optional incident and AI RCA behavior   |

### AlertNotifications

| Field      | Type     | Required | Description                                                                                                   |
| ---------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `channels` | string[] | Yes      | List of [ObservabilityAlertsNotificationChannel](./observabilityalertsnotificationchannel.md) names to notify |

At least one notification channel must be configured. If the originating trait or `ReleaseBinding` override omits `actions.notifications.channels`, the control plane resolves the environment’s default notification channel and populates `actions.notifications.channels` in the generated `ObservabilityAlertRule`.

### AlertIncident

Represents incident behavior when an alert fires.

| Field          | Type    | Required | Description                                                                                          |
| -------------- | ------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `enabled`      | boolean | No       | Enables incident creation when this alert fires. Defaults to `false`.                                |
| `triggerAiRca` | boolean | No       | Enables AI-powered root cause analysis when an incident is created. Requires `enabled` to be `true`. |

## Examples

### Log-based Alert Rule (Generated from trait)

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ObservabilityAlertRule
metadata:
  name: error-logs-alert
  namespace: my-project-production
spec:
  name: Error Logs Detected
  description: Triggered when more than 10 error logs are detected in 1 minute.
  severity: critical
  enabled: true
  source:
    type: log
    query: 'status: "error"'
  condition:
    window: 1m
    interval: 1m
    operator: gt
    threshold: 10
  actions:
    notifications:
      channels:
        - devops-email-notifications
    incident:
      enabled: true
      triggerAiRca: false
```

### Metric-based Alert Rule for CPU usage (Generated from trait)

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ObservabilityAlertRule
metadata:
  name: high-cpu-usage
  namespace: my-project-production
spec:
  name: High CPU Usage
  description: Triggered when average container CPU usage exceeds 80% of limits for 5 minutes.
  severity: warning
  enabled: true
  source:
    type: metric
    metric: cpu_usage
  condition:
    window: 5m
    interval: 1m
    operator: gte
    threshold: 80
  actions:
    notifications:
      channels:
        - devops-slack-notifications
```

## Related Resources

- [ObservabilityPlane](./observabilityplane.md) - The infrastructure layer providing observability data
- [ClusterObservabilityPlane](./clusterobservabilityplane.md) - The infrastructure layer providing observability data for cluster-scoped resources
- [ObservabilityAlertsNotificationChannel](./observabilityalertsnotificationchannel.md) - Destinations for alert notifications
- [Trait](./trait.md) - Alert rules can be defined as traits on components
