---
title: Overview
description: See what OpenChoreo collects about your running components and where to read it, from logs and metrics to traces, alerts and incidents.
---

# Monitor and Troubleshoot

When your platform runs an observability plane, OpenChoreo collects the logs, Kubernetes events, metrics and traces of your components, raises the alerts you define, and can open incidents and AI root cause analysis reports for them. You read all of it by OpenChoreo concepts (project, component, environment and release line), without knowing where the data is stored.

## What You Can Use

| What                           | Backstage portal                                           | CLI                  | See                                                   |
| ------------------------------ | ---------------------------------------------------------- | -------------------- | ----------------------------------------------------- |
| Logs                           | **Logs** tab on the component and the project              | `occ component logs` | [Logs and Events](./logs-and-events.md)               |
| Kubernetes events              | **Events** tab on the component                            | -                    | [Logs and Events](./logs-and-events.md#events)        |
| Resource and HTTP metrics      | **Metrics** tab on the component and the project           | -                    | [Metrics](./metrics.md)                               |
| Traces                         | **Traces** tab on the project                              | -                    | [Traces](./traces.md)                                 |
| Alerts                         | **Alerts** tab on the component                            | -                    | [Alerts and Incidents](./alerts-and-incidents.md)     |
| Incidents and RCA reports      | **Incidents** and **RCA Reports** tabs on the project      | -                    | [Alerts and Incidents](./alerts-and-incidents.md)     |
| Network flows (wirelogs)       | **Wirelogs** tab on the component                          | -                    | [Troubleshooting](./troubleshooting.md#network-flows) |
| Deployment and resource status | **Deploy** tab and **View K8s Artifacts** on the component | `occ component get`  | [Troubleshooting](./troubleshooting.md)               |

The [Observability Plane MCP server](../../reference/mcp-servers.mdx#observability-plane-mcp-server) gives AI assistants the same logs, events, metrics, traces, alerts and incidents.

## Before You Start

- **An observability plane.** Your platform engineer installs it and links it to the data plane of each environment. Without one, the portal tabs say that observability is not enabled for the component in that environment. Which signals are available also depends on the modules your platform runs: for example, events need an events collector, traces need a tracing module, and HTTP metrics need the Cilium network module.
- **Permissions.** The default `developer` role can read logs, events, metrics, traces, alerts and RCA reports. Incidents and wirelogs need permissions it doesn't include. Ask your platform engineer if a tab shows **Permission Denied**.

## Common Filters

Most tabs share the same filters:

- **Environment**: each environment of the project's deployment pipeline.
- **Time range**: the last 10 minutes up to the last 30 days, or a custom range.
- **Release line**: for a component with [release lines](../deploying-applications/release-lines.md), all lines, the main line or one named line. It starts on the main line.

## What's Next

- [Logs and Events](./logs-and-events.md): search your component's logs and Kubernetes events
- [Alerts and Incidents](./alerts-and-incidents.md): define alert rules on your component
- [Troubleshooting](./troubleshooting.md): inspect resources and fix common issues
