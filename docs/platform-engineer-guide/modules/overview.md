---
title: Modules Overview
description: Understand OpenChoreo's modular architecture and the extensibility areas that allow platform operators to customize their Internal Developer Platform.
sidebar_position: 1
---

# Modules

OpenChoreo is designed from the ground up as a modular Internal Developer Platform (IDP). Rather than coupling to a fixed set of tools, OpenChoreo defines clear integration points where operators can plug in the tools that best suit their organization.

## What Are Modules?

Modules are pluggable integrations that extend OpenChoreo platform capabilities at defined extensibility points. There are two main types of modules:

### OpenChoreo Modules

OpenChoreo Modules extend platform-defined extension points across OpenChoreo planes — the Data Plane, Workflow Plane, Observability Plane, and Control Plane. Each module integrates a third-party tool at one of these extension points, covering areas such as API Gateway, CI, Observability, and GitOps. Modules are packaged as Helm charts, making them straightforward to install and configure on any compatible Kubernetes cluster.

OpenChoreo modules are hosted in the [openchoreo/community-modules](https://github.com/openchoreo/community-modules) repository. Some modules are used by default in the OpenChoreo installation, while others are **community** modules that operators can install to replace or supplement the defaults.

### Curated Backstage Modules

Curated Backstage Modules are Backstage plugins that have been validated and bundled into the OpenChoreo Backstage portal. These modules extend the developer portal experience with additional capabilities.

Unlike OpenChoreo modules, Curated Backstage Modules are not installed independently - they are compiled into the portal itself. To add a Curated Backstage Module, you fork the [OpenChoreo Backstage portal](https://github.com/openchoreo/backstage-plugins), add the plugin, and build your own portal image.

---

You can discover all available modules in the [OpenChoreo Modules Catalog](/modules).

## Why a Modular Architecture?

Internal Developer Platforms need to serve diverse organizations with different tool preferences, scaling requirements, and existing investments in specific tools and technologies. A prescriptive, monolithic platform forces operators into a single stack, even when parts of it conflict with tools they have already standardized on or built expertise around.

OpenChoreo adopts a modular architecture for three key reasons:

**No vendor lock-in**

Platform critical capabilities like API gateway, CI, observability, and GitOps are all pluggable. Operators choose the tools they trust and can swap them as the ecosystem evolves without rebuilding their platform.

**Lean by default, extensible on demand**

OpenChoreo ships with sensible defaults (kgateway, Argo Workflows, OpenSearch, Flux CD) so you can get started immediately. But you can replace or supplement these defaults with alternatives that fit your specific needs, avoiding unnecessary complexity for teams that don't require it.

**Community driven ecosystem**

Modules are maintained independently of the core platform. The community can build, publish, and maintain integrations without requiring changes to OpenChoreo itself. This keeps the core platform focused and stable while allowing the ecosystem to grow organically.

## Extensibility Areas

OpenChoreo Modules and Curated Backstage Modules each target distinct extensibility areas. OpenChoreo Modules extend the capabilities of the OpenChoreo planes, while Curated Backstage Modules expand what the developer portal can offer.

### OpenChoreo Module Areas

The following areas correspond to functional planes in the platform where OpenChoreo modules can be plugged in.

#### API Gateway

The API Gateway layer routes external and internal traffic to components deployed in data planes. OpenChoreo supports any [Kubernetes Gateway API](https://gateway-api.sigs.k8s.io/) compliant implementation, giving operators the freedom to choose their preferred gateway technology.

|                       |                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Default module**    | [kgateway](https://kgateway.dev/) - a high-performance, Envoy-based gateway, pre-configured as part of the standard data plane installation |
| **Community modules** | Kong Ingress Controller, Envoy Gateway, Traefik, Apache APISIX, WSO2 API Platform                                                           |

#### CI

The Workflow Plane executes container image builds and automation tasks through the `Workflow` abstraction. Platform engineers define reusable Workflow templates with parameter schemas; developers provide build-specific values when creating WorkflowRuns. Workflows support governance via ComponentType's `allowedWorkflows` list, letting operators control which build processes components can use.

|                              |                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Default module**           | [Argo Workflows](https://argoproj.github.io/workflows/) - a Kubernetes-native workflow engine for building and automation |
| **External CI integration**  | [External CI Integration](../workflows/external-ci.mdx) for GitHub Actions, Jenkins, GitLab CI                            |

:::note
Argo Workflows is currently the only natively supported CI engine. The `Workflow` CRD's `runTemplate` directly embeds Argo Workflow specs. Support for alternative engines (e.g., Tekton Pipelines) would require controller-level changes and is not available as a drop-in module today.
:::

See [CI Governance](../workflows/ci-governance.md) for details on governance, auto-build, and component-specific workflows.

#### Observability

The Observability Plane aggregates logs, traces, and metrics from across all planes. Each observability signal has its own pluggable module, so operators can mix and match backends independently.

| Signal  | Default module                          | Community modules |
| ------- | --------------------------------------- | ----------------- |
| Logs    | OpenSearch with Fluent Bit              | OpenObserve       |
| Tracing | OpenSearch with OpenTelemetry Collector | —                 |
| Metrics | Prometheus                              | —                 |

#### GitOps

The GitOps module handles continuous delivery, keeping deployed workloads in sync with declarative configuration stored in Git. OpenChoreo's reconciliation controllers work alongside the GitOps engine to detect drift and trigger re-deployments.

|                       |                                                                 |
| --------------------- | --------------------------------------------------------------- |
| **Default module**    | [Flux CD](https://fluxcd.io/) - a CNCF graduated GitOps toolkit |
| **Community modules** | Argo CD                                                         |

### Curated Backstage Module Area

Curated Backstage Modules extend the OpenChoreo developer portal. The OpenChoreo Backstage portal ships with a curated set of built-in plugins, and operators can add more by forking the portal repository and bundling additional Backstage plugins.

Any plugin from the [Backstage plugin marketplace](https://backstage.io/plugins) can be contributed as a Curated Backstage Module - examples include cost visibility plugins, incident management integrations, API documentation renderers, and internal tooling portals.

See [Backstage Configuration](../../backstage-configuration) for details on setting up and customizing the developer portal.

## Browsing Available Modules

Visit the [OpenChoreo Modules Catalog](/modules) to browse all available modules by category, including their release status and links to installation guides.

To contribute a new module or integrate a tool not yet in the catalog, see [Building a Module](../building-a-module).
