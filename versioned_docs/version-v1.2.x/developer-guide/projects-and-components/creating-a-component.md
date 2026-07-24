---
title: Creating a Component
description: Create and configure components for deployment in OpenChoreo
---

# Creating a Component

A Component is a single deployable unit within a Project. It references a platform-defined ComponentType template that determines how it gets deployed, and optionally includes workflow configuration for building from source code.

## Choosing a ComponentType

Before creating a component, check which ComponentTypes are available. ComponentTypes are defined by platform engineers and determine the workload type (Deployment, StatefulSet, CronJob, etc.) and default configuration.

```bash
# List cluster-scoped ComponentTypes (available to all namespaces)
occ clustercomponenttype list

# List namespace-scoped ComponentTypes
occ componenttype list --namespace default
```

Common built-in ComponentTypes:

| Component Type Reference     | Workload Type | Use Case                                     |
| ---------------------------- | ------------- | -------------------------------------------- |
| `deployment/service`         | Deployment    | Backend services and APIs                    |
| `deployment/web-application` | Deployment    | Frontend or full-stack web apps              |
| `deployment/worker`          | Deployment    | Background workers without exposed endpoints |
| `cronjob/scheduled-task`     | CronJob       | Periodic batch jobs                          |

The reference format is `{workloadType}/{componentTypeName}`. This is used in the Component's `spec.componentType.name` field.

## Creating via Backstage UI

The Backstage UI provides a 3-step wizard for creating components.

### Step 1: Component Metadata

- Select your **Namespace** and **Project**
- Enter a **Component Name** (must be a valid Kubernetes name)
- Optionally add a **Display Name** and **Description**

### Step 2: Build & Deploy

Choose how your component gets its container image:

**Build from Source**: OpenChoreo builds your code using a workflow

- Select a **Workflow** from the available build workflows
- Enter your **Git Repository URL**, **Branch**, and **Application Path**
- Optionally select a **Git Secret** for private repositories

**Container Image**: Deploy a pre-built image directly

- Enter the **Container Image** reference (e.g., `ghcr.io/myorg/myapp:v1.0.0`)
- Toggle **Auto Deploy** to deploy automatically

**External CI**: Use your existing CI system (Jenkins, GitHub Actions, GitLab CI)

- Select your **CI Platform**
- Enter the platform-specific identifier (job path, repo slug, or project ID)

### Step 3: Type-Specific Details

This step is dynamically generated from the selected ComponentType (e.g., "Service Details", "Web Application Details"):

- **Parameters**: configure values defined by the ComponentType schema (e.g., replicas, port, resource limits)
- **Endpoints**: define HTTP, gRPC, or WebSocket endpoints your service exposes (for deployment workload types)
- **Environment Variables**: set key-value pairs or reference secrets (available for container image deployments)
- **File Mounts**: mount configuration files into the container (available for container image deployments)
- **Traits**: attach reusable cross-cutting concerns from the platform's available traits

Click **Create** to finish.

:::note
For "Build from Source" deployments, environment variables and file mounts are configured via a [`workload.yaml` descriptor](../workflows/ci/workload-descriptor.md) in your source repository rather than in the wizard.
:::

## Creating via YAML

### Scaffolding with occ CLI

The `occ component scaffold` command generates a Component YAML from a ComponentType, pre-filling defaults and documenting available fields:

```bash
# Generate from a ClusterComponentType
occ component scaffold my-service \
  --clustercomponenttype deployment/service \
  --namespace default \
  --project default \
  -o my-service.yaml

# Include traits
occ component scaffold my-service \
  --clustercomponenttype deployment/service \
  --clustertraits observability-alert-rule \
  -o my-service.yaml

# Include a workflow for building from source
occ component scaffold my-service \
  --clustercomponenttype deployment/service \
  --clusterworkflow dockerfile-builder \
  -o my-service.yaml

# Minimal output without comments
occ component scaffold my-service \
  --clustercomponenttype deployment/service \
  --skip-comments --skip-optional
```

Edit the generated file to fill in your values, then apply it.

### From a Pre-built Image

Create a Component and Workload together:

```yaml
# component.yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: greeter-service
  namespace: default
spec:
  owner:
    projectName: default
  componentType:
    kind: ClusterComponentType
    name: deployment/service
  autoDeploy: true

---
apiVersion: openchoreo.dev/v1alpha1
kind: Workload
metadata:
  name: greeter-service-workload
  namespace: default
spec:
  owner:
    projectName: default
    componentName: greeter-service
  container:
    image: "ghcr.io/openchoreo/samples/greeter-service:latest"
    env:
      - key: LOG_LEVEL
        value: "info"
  endpoints:
    http:
      type: HTTP
      port: 9090
      visibility: [external]
```

```bash
kubectl apply -f component.yaml
```

:::tip
The `componentType.kind` defaults to `ComponentType` (namespace-scoped) if omitted. Since the built-in types are `ClusterComponentType` (cluster-scoped), always specify `kind: ClusterComponentType` explicitly. The same applies to traits (`kind` defaults to `Trait`, so specify `kind: ClusterTrait` for cluster-scoped traits). Workflows default to `ClusterWorkflow`, so omitting `kind` is fine for cluster-scoped workflows.
:::

### From Source Code

Create a Component with workflow configuration:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: my-service
  namespace: default
spec:
  owner:
    projectName: default
  componentType:
    kind: ClusterComponentType
    name: deployment/service
  autoDeploy: true
  autoBuild: true
  workflow:
    kind: ClusterWorkflow
    name: dockerfile-builder
    parameters:
      repository:
        url: "https://github.com/myorg/my-service"
        revision:
          branch: "main"
        appPath: "/"
      docker:
        context: "."
        filePath: "./Dockerfile"
```

```bash
kubectl apply -f component.yaml
```

The workflow builds the container image and creates a Workload automatically. If `autoBuild` is enabled, subsequent Git pushes trigger new builds via webhooks.

## Adding Traits

Traits are reusable extensions that add cross-cutting functionality to your component. Add them to the `traits` array:

```yaml
spec:
  traits:
    - kind: ClusterTrait
      name: observability-alert-rule
      instanceName: high-error-rate
      parameters:
        enabled: true
        condition: "error_count > 100"
```

Each trait instance needs a unique `instanceName` within the component. List available traits:

```bash
occ clustertrait list
occ trait list --namespace default
```

## Managing Components

### List components

```bash
occ component list --namespace default --project default
```

### View component details

```bash
occ component get greeter-service --namespace default
```

### Delete a component

```bash
occ component delete greeter-service --namespace default
```

## What's Next

- [Define Your Workload](../workload/overview.md): learn more about workload specifications
- [Build Your Code](../workflows/ci/overview.md): configure CI workflows and auto-build
- [Workload Descriptor](../workflows/ci/workload-descriptor.md): customize what your CI build produces
