---
title: ObservabilityAlertRule API Reference
---

# ObservabilityAlertRule

An `ObservabilityAlertRule` defines a rule for monitoring runtime observability data (metrics or logs) and triggering alerts when specific conditions are met.

:::tip Generated Resources
`ObservabilityAlertRule` resources are typically **generated automatically** by the OpenChoreo control plane during component releases. They are derived from the alert definitions specified in a component's traits.
:::

## Usage Recommendation

You should **not** create `ObservabilityAlertRule` resources manually. Instead, you should define alert rules using a `Trait` (either from the default `observability-alertrule` trait or a custom trait) within your component definition. This ensures that the alert rules are properly scoped to your component and managed as part of its lifecycle across different environments.

### Example: Defining Alerts as Traits

In your `Component` CR, add the alert rule as a trait (using the default `observability-alertrule` trait):

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: my-service
spec:
  # ... other component fields ...
  traits:
    - name: observability-alertrule
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
Override the environment-specific parameters for the alert rule in the `ReleaseBinding` CR.

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

  traitOverrides:
    high-error-rate-log-alert:
      enabled: true
      enableAiRootCauseAnalysis: false
      notificationChannel: devops-email-notifications
```

The control plane will then generate the corresponding `ObservabilityAlertRule` resource for each environment where this component is released.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

`ObservabilityAlertRule` resources are namespace-scoped and typically created within the project-environment namespace.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ObservabilityAlertRule
metadata:
  name: <rule-name>
  namespace: <project-environment-namespace>
```

### Spec Fields

| Field                       | Type                                      | Required | Description                                                                 |
|-----------------------------|-------------------------------------------|----------|-----------------------------------------------------------------------------|
| `name`                      | string                                    | Yes      | Unique identifier for the alert rule                                       |
| `description`               | string                                    | No       | A human-friendly summary of the alert rule                                 |
| `severity`                  | [AlertSeverity](#alertseverity)           | No       | Describes how urgent the alert is (`info`, `warning`, `critical`)          |
| `enabled`                   | boolean                                   | No       | Toggles whether this alert rule should be evaluated. Defaults to `true`    |
| `enableAiRootCauseAnalysis` | boolean                                   | No       | Allows an attached AI engine to perform root cause analysis and generate a report when the alert is triggered |
| `notificationChannel`       | string                                    | Yes      | Name of the [ObservabilityAlertsNotificationChannel](./observabilityalertsnotificationchannel.md) to notify |
| `source`                    | [AlertSource](#alertsource)               | Yes      | Specifies the observability source type (log or metrics) and query that drives the rule                        |
| `condition`                 | [AlertCondition](#alertcondition)         | Yes      | Controls when an alert should be triggered based on the source data               |

### AlertSeverity

| Value      | Description             |
|------------|-------------------------|
| `info`     | Informational alerts    |
| `warning`  | Warning-level alerts    |
| `critical` | Critical alerts         |

### AlertSource

Specifies where and how events are pulled for evaluation.

| Field    | Type                                | Required | Description                                                  |
|----------|-------------------------------------|----------|--------------------------------------------------------------|
| `type`   | [AlertSourceType](#alertsourcetype) | Yes      | The telemetry source type (`log`, `metrics`)                |
| `query`  | string                              | No       | The query for log-based alerting (e.g., `status:error`)                  |
| `metric` | string                              | No       | The metric name for metrics-based alerting (e.g., `cpu, memory`)                  |

### AlertSourceType

| Value     | Description            |
|-----------|------------------------|
| `log`     | Log-based alerting (Powered by OpenSearch)     |
| `metrics` | Usage metrics-based alerting (Powered by Prometheus) |

### AlertCondition

Represents the conditions under which an alert should be triggered.

| Field       | Type                                          | Required | Description                                                  |
|-------------|-----------------------------------------------|----------|--------------------------------------------------------------|
| `window`    | duration                                      | Yes      | The time window aggregated before comparison (e.g., `5m`)   |
| `interval`  | duration                                      | Yes      | How often the alert rule is evaluated (e.g., `1m`)          |
| `operator`  | [AlertConditionOperator](#alertconditionoperator) | Yes      | Comparison operator used for evaluation                     |
| `threshold` | integer                                       | Yes      | Trigger value for the configured operator                   |

### AlertConditionOperator

| Value | Description                                      |
|-------|--------------------------------------------------|
| `gt`  | Greater than threshold                           |
| `lt`  | Less than threshold                              |
| `gte` | Greater than or equal to threshold               |
| `lte` | Less than or equal to threshold                  |
| `eq`  | Equals the threshold                             |

## Examples

### Log-based Alert Rule

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
  notificationChannel: devops-email-notifications
  source:
    type: log
    query: 'status: "error"'
  condition:
    window: 1m
    interval: 1m
    operator: gt
    threshold: 10
```

## Related Resources

- [ObservabilityPlane](./observabilityplane.md) - The infrastructure layer providing observability data
- [ObservabilityAlertsNotificationChannel](./observabilityalertsnotificationchannel.md) - Destinations for alert notifications
- [Trait](./trait.md) - Alert rules can be defined as traits on components
