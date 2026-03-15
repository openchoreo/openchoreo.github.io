---
title: Building a Module
description: A guide for module authors on how to create, package, and contribute new modules to extend OpenChoreo's platform capabilities.
sidebar_position: 2
---

# Building a Module

This guide is for platform engineers and community contributors who want to build a new module for OpenChoreo. As described in the [Modules overview](../overview), there are two types of modules: **OpenChoreo Modules** and **Curated Backstage Modules**. The process for building each is different.

---

## Building an OpenChoreo Module

OpenChoreo Modules extend the platform runtime at one of the defined extensibility areas: API Gateway, CI, Observability, or GitOps.

### Prerequisites

Before building an OpenChoreo module, you should be familiar with:

- Kubernetes and Helm charts
- The OpenChoreo [architecture](../../../overview/architecture) and the plane you are targeting
- The specific extensibility area your module integrates with (API Gateway, CI, Observability, or GitOps)

### What Is an OpenChoreo Module?

An OpenChoreo module is a Helm chart that:

1. **Installs the underlying tool** into the target Kubernetes cluster (data plane, workflow plane, or observability plane).
2. **Wires it into OpenChoreo integration contracts**, so the control plane and other components can interact with it correctly.
3. **Provides documentation** so operators know how to configure and use it.

Modules are hosted in the [openchoreo/community-modules](https://github.com/openchoreo/community-modules) repository and are discoverable through the [OpenChoreo Modules Catalog](/modules).

### Integration Requirements by Area

Each extensibility area has specific integration requirements that your module must satisfy for OpenChoreo to work with it correctly.

#### API Gateway Module

An API Gateway module must provide a [Kubernetes Gateway API](https://gateway-api.sigs.k8s.io/) compliant implementation. OpenChoreo's control plane creates `Gateway` and `HTTPRoute` resources to route traffic, and expects a compatible gateway controller to fulfill them.

**Requirements:**

- Install a `GatewayClass` resource that identifies the gateway implementation.
- The gateway controller must accept `Gateway` resources and route traffic based on `HTTPRoute` objects created by OpenChoreo.
- Configure the gateway to be installed in the data plane namespace (by default `openchoreo-data-plane`).
- Document any additional configuration required for TLS termination, external access, and traffic policies.

**Reference implementations**: [gateway-kong](https://github.com/openchoreo/community-modules/tree/main/gateway-kong) and [gateway-envoy-gateway](https://github.com/openchoreo/community-modules/tree/main/gateway-envoy-gateway).

---

#### CI Module

A CI module integrates a workflow engine with OpenChoreo workflow plane. OpenChoreo represents CI workflows as `Workflow` CRDs, and the workflow engine is responsible for executing them.

**Requirements:**

- Install the workflow engine into the workflow plane cluster.
- Support the workflow schema defined in OpenChoreo's `Workflow` API.
- Expose workflow execution status so OpenChoreo controllers can track build progress.

**Reference**: See the [User Guide: CI overview](../../../user-guide/workflows/ci/overview) for the workflow contract, and [Schema Syntax](../../../user-guide/workflows/schema-syntax) for the workflow schema.

---

#### Observability Modules

There are 3 types of observability modules: logs, metrics, and tracing. Each module integrates a specific observability backend with the OpenChoreo platform.

##### The Adapter Pattern

OpenChoreo uses an **adapter pattern** to decouple the Observer from specific backend implementations. The Observer is the platform component responsible for serving observability data to the rest of the platform (e.g., the Backstage portal and the platform API). Rather than coupling the Observer directly to each backend's native query API, each observability module provides an **adapter** — a lightweight service that translates between the Observer's standardized API and the backend's native interface.

```mermaid
flowchart LR
    A[Observer] -->|Standardized API| B[Adapter]
    B -->|Native Query API| C[Logs Backend]
```

The adapter is a component that must be written by the module author and deployed alongside the logging backend. When the Observer needs to retrieve logs, it makes HTTP requests to the adapter using a well-defined OpenAPI contract. The adapter receives these requests, queries the underlying logs backend using its native API or SDK, transforms the results into the standardized response format, and returns them to the Observer.

This pattern provides several benefits:

- **Backend independence** — The Observer does not need to know how to query each specific backend. Adding support for a new logging backend only requires writing a new adapter.
- **Stable contract** — The API contract between the Observer and the adapter is versioned and stable, so module authors can upgrade or replace their backend without affecting the rest of the platform.
- **Separation of concerns** — The adapter encapsulates all backend-specific logic (connection handling, query translation, authentication), keeping the Observer focused on aggregation and serving.

##### Observability Logs Module

A logs module must provide two components:

1. **A log aggregation backend** — The storage and query engine for logs (e.g., OpenSearch, OpenObserve, Loki).
2. **A logging adapter** — A service that implements the [Logging Adapter API](../observability-logging-adapter-api) and acts as the bridge between the Observer and the log backend.

The logging adapter must:

- Implement the endpoints defined in the [Logging Adapter API specification](../observability-logging-adapter-api)
- Translate the standardized log query parameters (time range, search scope, log levels, search phrase) into the backend's native query format.
- Return log entries in the standardized response format, including structured metadata.

The module's Helm chart should deploy both the backend and the adapter, and configure the adapter's service endpoint so the Observer can discover and communicate with it.

Reference implementation: [observability-logs-openobserve module](https://github.com/openchoreo/community-modules/tree/main/observability-logs-openobserve)

##### Observability Tracing Module

Like the logs module, a tracing module follows the same adapter pattern. The module must provide two components:

1. **A trace aggregation backend** — The storage and query engine for traces (e.g., OpenSearch, Jaeger, Tempo).
2. **A tracing adapter** — A service that implements the [Tracing Adapter API](../observability-tracing-adapter-api) and acts as the bridge between the Observer and the trace backend.

The tracing adapter must:

- Implement the endpoints defined in the [Tracing Adapter API specification](../observability-tracing-adapter-api)
- Translate the standardized trace query parameters (time range, search scope, sort order) into the backend's native query format.
- Return traces, spans, and span details in the standardized response format, including span attributes and resource attributes.


---

#### GitOps Module

A GitOps module installs a continuous delivery tool that manages workload synchronization from a Git repository. OpenChoreo's controllers produce declarative resource manifests and expect the GitOps engine to apply and reconcile them in the target cluster.

**Requirements:**

- Install the GitOps engine into the target cluster.
- The engine must support reconciling Kubernetes manifests from a Git repository.
- Provide a mechanism (CRD or API) through which OpenChoreo can configure sync targets (repository, path, branch, interval).
- Expose sync status for OpenChoreo to surface to operators.

**Reference**: See the [Flux CD getting started guide](../../gitops/overview) for the existing integration pattern.

---

### Publishing an OpenChoreo Module

Once your module is ready, follow these steps to publish it.

#### 1. Open a Pull Request to community-modules

Fork the [openchoreo/community-modules](https://github.com/openchoreo/community-modules) repository and open a pull request with your module directory. Include in the PR description:

- What tool the module integrates
- Which extensibility area it targets
- How to install and configure it
- Any known limitations or prerequisites

#### 2. Add an Entry to the Modules Catalog

To make your module discoverable in the [Modules Catalog](/modules), add an entry to `src/data/marketplace-plugins.source.json` in the [openchoreo/openchoreo.github.io](https://github.com/openchoreo/openchoreo.github.io) repository:

```json
{
  "id": "<unique-id>",
  "name": "<Module Name>",
  "description": "<Short description of what the module does>",
  "category": "<API Gateway | CI/CD | Observability | GitOps>",
  "tags": ["<tag1>", "<tag2>"],
  "logoUrl": "<URL to the tool's logo>",
  "author": "<Author or organization name>",
  "repo": "<upstream-org/upstream-repo>",
  "moduleUrl": "https://github.com/openchoreo/community-modules/tree/main/<your-module-dir>",
  "core": false,
  "released": true
}
```

#### 3. Write Documentation

If your module requires configuration steps beyond Helm chart installation, contribute a documentation page to the [openchoreo/openchoreo.github.io](https://github.com/openchoreo/openchoreo.github.io) repository under `docs/operations/`.

At minimum, your module `README.md` should cover:

- Prerequisites and compatibility requirements
- Installation steps with example Helm values
- Configuration options for integrating with OpenChoreo
- How to verify the module is working correctly

---

## Building a Curated Backstage Module

Curated Backstage Modules are Backstage plugins that have been validated and bundled into the OpenChoreo Backstage portal. Because Backstage plugins are compiled into the portal at build time, contributing a Curated Backstage Module requires forking the portal, adding the plugin, and building a custom portal image.

### Prerequisites

Before building a Curated Backstage Module, you should be familiar with:

- [Backstage](https://backstage.io) architecture and plugin development
- React and TypeScript (for frontend plugins)
- Node.js package management (yarn)
- Docker image building and publishing

### How Curated Backstage Modules Work

The OpenChoreo Backstage portal is a standard Backstage application that ships with a curated set of plugins pre-installed. To add a new Backstage plugin as a Curated Backstage Module:

1. Fork the [openchoreo/backstage-plugins](https://github.com/openchoreo/backstage-plugins) repository.
2. Install the desired Backstage plugin package into the portal.
3. Wire the plugin into the Backstage app configuration.
4. Build and publish your customized portal image.
5. Deploy using the updated image.

### Step-by-Step Guide

#### 1. Fork and Clone the Portal

Fork the [openchoreo/backstage-plugins](https://github.com/openchoreo/backstage-plugins) repository and clone it locally:

```bash
git clone https://github.com/<your-org>/backstage.git
cd backstage
yarn install
```

#### 2. Install the Plugin

Install the Backstage plugin package you want to add. Most plugins consist of a frontend package, and some also have a backend package:

```bash
# Frontend plugin
yarn --cwd packages/app add @backstage-community/<plugin-name>

# Backend plugin (if applicable)
yarn --cwd packages/backend add @backstage-community/<plugin-name>-backend
```

#### 3. Wire the Plugin

Follow the plugin's installation instructions to register it with the Backstage app. This typically involves editing:

- `packages/app/src/App.tsx` — to add frontend routes and components
- `packages/app/src/plugins.ts` — to register the plugin
- `packages/backend/src/index.ts` — to register backend features (if applicable)
- `app-config.yaml` — to add plugin-specific configuration

#### 4. Build and Publish the Portal Image

Build the Backstage portal and package it as a Docker image:

```bash
yarn build:all
docker build -t <your-registry>/<your-org>/backstage:<tag> .
docker push <your-registry>/<your-org>/backstage:<tag>
```

#### 5. Deploy the Custom Portal

Update your OpenChoreo Backstage deployment to use the new image. See [Backstage Configuration](../../backstage-configuration) for deployment details.

### Contributing to the OpenChoreo Portal

If you believe a plugin should be included in the official OpenChoreo Backstage portal, open a pull request against the [openchoreo/backstage-plugins](https://github.com/openchoreo/backstage-plugins) repository with the plugin integrated and a clear description of the use case it addresses.

To make your module visible in the [Modules Catalog](/modules), also add an entry to `src/data/marketplace-plugins.source.json` in the [openchoreo/openchoreo.github.io](https://github.com/openchoreo/openchoreo.github.io) repository with `"category": "Backstage"`.

## Getting Help

If you have questions or need feedback on your module:

- Join the [Slack](https://cloud-native.slack.com/archives/C0ABYRG1MND) and reach out in the relevant channel.
- Open a [GitHub Discussion](https://github.com/openchoreo/openchoreo/discussions) for design questions or architectural feedback.
- Browse existing modules in the [community-modules repository](https://github.com/openchoreo/community-modules) for reference implementations.
