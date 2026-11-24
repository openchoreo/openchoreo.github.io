---
title: Metrics
description: Follow the CPU and memory usage of your components, and their HTTP request rates and latency, in the Backstage portal.
---

# Metrics

Open your component and select the **Metrics** tab. Filter by environment, time range and release line, and select **Refresh** to load the latest values.

## Resource Metrics

Two charts show the component's resource usage against what it asked for:

- **CPU Usage**: usage, requests and limits
- **Memory Usage**: usage, requests and limits

Compare usage with requests and limits to size your component, or to spot a memory leak before the container is killed.

## HTTP Metrics

Two more charts show the HTTP traffic your component serves:

- **Network Throughput**: the number of requests, and how many succeeded and failed
- **Network Latency**: mean latency, and the 50th, 90th and 99th percentiles

HTTP metrics come from Cilium's network observability (Hubble). They appear only for environments whose data plane runs the Cilium network module with a metrics module that serves them. Elsewhere the charts are not shown.

## Project Metrics

The **Metrics** tab on the project shows the same charts for the whole project, or for each component.

## Other Ways to Read Metrics

The Observability Plane MCP server's `query_resource_metrics` and `query_http_metrics` tools return the same metrics to AI assistants. See [MCP Servers](../../reference/mcp-servers.mdx#observability-plane-mcp-server).

## What's Next

- [Alerts and Incidents](./alerts-and-incidents.md): alert on CPU or memory usage
- [Traces](./traces.md): follow requests across your components
