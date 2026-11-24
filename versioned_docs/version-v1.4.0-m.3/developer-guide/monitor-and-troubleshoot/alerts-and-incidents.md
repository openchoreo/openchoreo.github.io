---
title: Alerts and Incidents
description: Define alert rules on your components, choose per environment who is notified and whether incidents and AI root cause analysis follow, and work with the alerts and incidents they raise.
---

# Alerts and Incidents

You define alert rules on your component, as traits. When a rule fires, OpenChoreo records an alert, notifies the rule's notification channels, and can open an incident and start an AI root cause analysis (RCA).

## Defining an Alert Rule

The default installation includes an `observability-alert-rule` trait, which you attach to your component if its component type allows it. Your platform may provide other alert traits.

A rule on the component's logs fires when the number of matching log entries crosses a threshold:

```yaml
traits:
  - name: observability-alert-rule
    kind: ClusterTrait
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

A rule on the component's metrics names the metric instead of a query:

```yaml
traits:
  - name: observability-alert-rule
    kind: ClusterTrait
    instanceName: high-cpu-alert
    parameters:
      description: "CPU usage stays above the threshold for 5 minutes."
      severity: "warning"
      source:
        type: "metric"
        metric: "cpu_usage"
      condition:
        window: 5m
        interval: 1m
        operator: gt
        threshold: 80
```

| Parameter             | Description                                                                        |
| --------------------- | ---------------------------------------------------------------------------------- |
| `description`         | What the rule checks. Required.                                                    |
| `severity`            | `info`, `warning` (default) or `critical`.                                         |
| `source.type`         | `log` or `metric`. Required.                                                       |
| `source.query`        | For a `log` rule, the log query to count matches of.                               |
| `source.metric`       | For a `metric` rule, `cpu_usage` or `memory_usage`.                                |
| `condition.window`    | The period the rule evaluates, such as `5m` (default).                             |
| `condition.interval`  | How often the rule is evaluated, such as `1m` (default).                           |
| `condition.operator`  | `gt` (default), `lt`, `gte`, `lte` or `eq`, comparing the result to the threshold. |
| `condition.threshold` | The value to compare against.                                                      |

## Per-Environment Settings

Each environment can turn a rule on or off and decide what happens when it fires. Set this in the environment's ReleaseBinding, under `traitEnvironmentConfigs`, keyed by the rule's `instanceName`:

```yaml
spec:
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

- `enabled` turns the rule on (the default) or off in this environment.
- `actions.notifications.channels` lists the [notification channels](../../platform-engineer-guide/observability/notification-channels.mdx) to notify. Without it, the environment's default channel is used. A rule needs a channel, from the list or the default.
- `actions.incident.enabled` opens an incident when the rule fires.
- `actions.incident.triggerAiRca` also starts an AI root cause analysis of the incident. It needs incidents enabled.

Alert rules are created only in environments whose data plane is linked to an observability plane. See [Alerting](../../platform-engineer-guide/observability/alerting.mdx) in the Platform Engineer Guide for how rules are set up on the platform side.

## Viewing Alerts

The **Alerts** tab on the component lists the alerts that fired: when, the rule, its severity, its source and the value that crossed the threshold. Expand an alert for its details, such as the log query or metric, and the channels that were notified. Search by rule name, description or alert ID, and filter by severity, environment, time range and release line.

For an alert that opened an incident, **View incident** opens it on the project's **Incidents** tab.

## Incidents

The **Incidents** tab on the project lists the incidents of its components. An incident moves from `active` to `acknowledged` to `resolved`: select **Acknowledge** on an active incident and **Resolve** once it is fixed. Search and filter by component, status, environment, time range and release line.

The default `developer` role can't see incidents. Ask your platform engineer for access if you are on call for your components.

## RCA Reports

When a rule triggers AI root cause analysis and your platform runs the SRE Agent, the **RCA Reports** tab on the project lists the reports. A report covers the likely and unlikely root causes, next steps and a timeline of what happened. Some reports suggest quick fixes, such as an environment variable change, which you can apply to the environment's ReleaseBinding from the report. See [SRE Agent](../../ai/sre-agent.mdx).

## Learn More

- [Configure Component Alerts and Manage Incidents](../../tutorials/component-alerts-and-incidents.mdx): an end-to-end walkthrough
- [Identify and Fix a Root Cause using the SRE Agent](../../tutorials/identify-and-fix-root-cause-with-sre-agent.mdx)
