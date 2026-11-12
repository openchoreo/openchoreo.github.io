---
title: Sending Traces
description: Instrument a component with OpenTelemetry so its traces are collected by OpenChoreo and can be viewed by project, component and environment.
---

# Sending Traces

When the observability plane has a tracing module, OpenChoreo collects the traces your components send with the [OpenTelemetry Protocol (OTLP)](https://opentelemetry.io/docs/specs/otlp/). Each span is linked to the component, project and environment it came from, so you can find a component's traces without adding OpenChoreo-specific attributes yourself.

## Prerequisites

- An observability plane with a tracing module, set up by your platform engineer. See [Traces](../../platform-engineer-guide/observability/traces.mdx) in the Platform Engineer Guide.
- A component instrumented with an OpenTelemetry SDK or auto-instrumentation agent for its language. See the [OpenTelemetry language docs](https://opentelemetry.io/docs/languages/).

## Collector Address

Send traces to the tracing module's OpenTelemetry Collector:

| Protocol | Endpoint                                                                               |
| -------- | -------------------------------------------------------------------------------------- |
| HTTP     | `http://opentelemetry-collector.openchoreo-observability-plane.svc.cluster.local:4318` |
| gRPC     | `opentelemetry-collector.openchoreo-observability-plane.svc.cluster.local:4317`        |

These are the addresses of a default installation. When the observability plane runs on its own cluster, a collector on your component's cluster receives the traces and forwards them, so the address stays the same. If your platform engineer runs the collector elsewhere, use the address they give you.

:::note
OpenTelemetry SDKs append `/v1/traces` to the HTTP endpoint automatically, so configure your application with the base URL above rather than including the path explicitly.
:::

## Configuring Your Component

Most OpenTelemetry SDKs and auto-instrumentation agents read the standard `OTEL_*` environment variables. Set them in your [Workload](../workload/overview.md#environment-variables):

```yaml
container:
  image: myregistry/my-service:v1.0.0
  env:
    - key: OTEL_EXPORTER_OTLP_ENDPOINT
      value: http://opentelemetry-collector.openchoreo-observability-plane.svc.cluster.local:4318
    - key: OTEL_EXPORTER_OTLP_PROTOCOL
      value: http/protobuf
    - key: OTEL_SERVICE_NAME
      value: my-service
```

In a [workload descriptor](../workload/descriptor.md), set the same variables under `configurations.env`, with `name` instead of `key`.

To configure the exporter in code instead, point it at the same address. For example, with the Go SDK:

```go
import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
)

exporter, _ := otlptracehttp.New(ctx,
    otlptracehttp.WithEndpoint("opentelemetry-collector.openchoreo-observability-plane:4318"),
    otlptracehttp.WithInsecure(),
)
```

Send spans straight from your component to the collector. The collector links a span to its component through the pod that sent it, so spans relayed through another proxy or collector may not be linked to your component.

## Viewing Traces

- **Backstage portal**: open the project and select the **Traces** tab.
- **MCP**: the Observability Plane MCP server's `query_traces`, `query_trace_spans` and `get_span_details` tools. See [MCP Servers](../../reference/mcp-servers.mdx#observability-plane-mcp-server).
- **Observer API**: the trace query endpoints of the Observer REST API.

The Observer checks your OpenChoreo identity and permissions on every trace query, as it does for logs and metrics.

## What's Next

- [Logs and Troubleshooting](./logs-and-troubleshooting.md): view runtime logs and manage deployments
- [Workload](../workload/overview.md): define containers, endpoints and environment variables
