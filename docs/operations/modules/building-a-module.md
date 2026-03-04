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

1. **Installs the underlying tool** into the target Kubernetes cluster (data plane, build plane, or observability plane).
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

A CI module integrates a workflow engine with OpenChoreo build plane. OpenChoreo represents CI workflows as `ComponentWorkflow` CRDs, and the workflow engine is responsible for executing them.

**Requirements:**

- Install the workflow engine into the build plane cluster.
- Support the workflow schema defined in OpenChoreo's `ComponentWorkflow` API.
- Expose workflow execution status so OpenChoreo controllers can track build progress.

**Reference**: See the [User Guide: CI overview](../../../user-guide/workflows/ci/overview) for the workflow contract, and [Custom Workflows](../../../user-guide/workflows/workflow-schema) for the workflow schema.

---

#### Observability Module

An Observability module installs a logging, tracing, or metrics backend and integrates it with OpenChoreo's Observer component. The Observer acts as an aggregation layer, querying backends on behalf of the platform API.

**Requirements (Logging):**

- Deploy a log aggregation backend compatible with a Fluent Bit output plugin.
- The Observer component must be able to query logs via a supported client (OpenSearch-compatible API or native SDK).
- Configure log retention and indexing patterns consistent with OpenChoreo's log schema.

**Requirements (Tracing):**

- Deploy a trace aggregation backend that accepts OpenTelemetry Protocol (OTLP) traces.
- The Observer component must be able to query traces using a supported API.

**Requirements (Metrics):**

- Deploy a metrics backend compatible with the Prometheus query API (`/api/v1/query`, `/api/v1/query_range`).
- The Observer component queries metrics via this Prometheus-compatible API.

**Reference implementations**: [observability-logs-opensearch](https://github.com/openchoreo/community-modules/tree/main/observability-logs-opensearch) and [observability-metrics-prometheus](https://github.com/openchoreo/community-modules/tree/main/observability-metrics-prometheus).

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

- Join the [OpenChoreo Discord](https://discord.gg/asqDFC8suT) and reach out in the relevant channel.
- Open a [GitHub Discussion](https://github.com/openchoreo/openchoreo/discussions) for design questions or architectural feedback.
- Browse existing modules in the [community-modules repository](https://github.com/openchoreo/community-modules) for reference implementations.
