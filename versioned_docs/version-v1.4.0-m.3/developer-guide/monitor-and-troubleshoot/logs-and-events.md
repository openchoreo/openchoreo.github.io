---
title: Logs and Events
description: Search the runtime logs of your components and the Kubernetes events of their resources, in the Backstage portal or with occ.
---

# Logs and Events

OpenChoreo collects the logs your components write to standard output and standard error, and the Kubernetes events of the resources it creates for them, such as pod scheduling, image pulls and restarts.

## Logs

### Via Backstage UI

Open your component and select the **Logs** tab. You can:

- search the log text, and filter by log level (`ERROR`, `WARN`, `INFO`, `DEBUG`), environment, time range and release line;
- choose which columns to show, and sort newest or oldest first;
- turn on **Live** to fetch new entries every 5 seconds;
- expand an entry to see the full message and the component, project and environment it came from.

For a component with [release lines](../deploying-applications/release-lines.md), set the release line filter to all lines to add a **Release Line** column.

The **Logs** tab on the project shows the logs of several components together, with a **Components** filter and a component column.

### Via CLI

```bash
# Get recent logs
occ component logs my-service --namespace default --project default

# Follow logs in real-time
occ component logs my-service -f

# Logs from a specific environment
occ component logs my-service --env production

# Last 100 lines
occ component logs my-service --tail 100

# Logs since a specific time
occ component logs my-service --since 1h
```

Without `--env`, the command reads the first environment of the project's deployment pipeline, and without `--since`, the last hour. Use `--container` to pick a container, and `--release-line <name>` or `--all-release-lines` for a component with release lines.

## Events

The **Events** tab on the component lists the Kubernetes events of its resources: when each happened, its type (`Normal` or `Warning`), its reason, the object it is about and its message. Filter by environment, time range and release line, sort newest or oldest first, and turn on **Live** to fetch new events every 5 seconds.

Warning events are often the quickest way to find out why a component is not running, for example a failed image pull or a container that keeps restarting.

Events are collected by a separate events collector on the platform. If your platform doesn't run one, the tab shows no events. To read events directly from the cluster instead, see [Troubleshooting](./troubleshooting.md#viewing-kubernetes-resources).

## What's Next

- [Metrics](./metrics.md): resource usage and HTTP traffic of your component
- [Troubleshooting](./troubleshooting.md): inspect resources and fix common issues
