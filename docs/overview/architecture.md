---
title: Architecture
---

# OpenChoreo Architecture

OpenChoreo implements a **multi-plane architecture** that separates infrastructure concerns across four specialized
planes: Control, Data, Build, and Observability. This architectural pattern enables clear separation of
responsibilities, independent scaling, and enhanced security through isolation boundaries.

## Overview

In OpenChoreo's architecture, each plane operates as a distinct functional unit with its own lifecycle, scaling
characteristics, and security boundaries. The planes work together through well-defined APIs and protocols to deliver a
complete Internal Developer Platform (IDP).

The four planes are:

- **Control Plane**: Orchestrates the platform and manages desired state
- **Data Plane**: Runs application workloads with cell-based isolation
- **Build Plane**: Executes CI/CD workflows in isolated environments
- **Observability Plane**: Aggregates metrics, logs, and traces from all planes

While production deployments typically use separate Kubernetes clusters for each plane, OpenChoreo supports flexible
deployment topologies including colocated setups for development environments.

---

## Control Plane

The **Control Plane** is the brain of OpenChoreo, implementing the platform's core logic as Kubernetes operators that
extend the Kubernetes API. It manages all developer intent and orchestrates platform-wide activities.

### Architecture Components

The Control Plane consists of several key components:

- **OpenChoreo Controller Manager**: A collection of Kubernetes controllers that reconcile custom resources and maintain
  desired state
- **API Server (openchoreo-api)**: REST API that provides programmatic access for CLI tools, UI dashboards, and CI/CD
  systems
- **Webhook Server**: Validates and mutates custom resources to enforce policies and defaults

### Custom Resource Definitions (CRDs)

OpenChoreo extends Kubernetes with three categories of CRDs:

**Platform Resources** (Platform Engineer focused):

- Examples: `Organization`, `DataPlane`, `Environment`, etc.

**Application Resources** (Developer focused):

- Examples: `Project`, `Component`, `Service`, etc.

**Runtime Resources** (System managed):

- Examples: `ServiceBinding`, `WebApplicationBinding`, `Release`, etc.

### Resource Management Patterns

The Control Plane implements several key patterns:

**Claim/Class Pattern**: Platform engineers define Classes (templates with governance policies), while developers create
Claims (Services, WebApplications, etc.) that reference these Classes. This separation ensures standardization while
maintaining developer autonomy.

**Environment Independence**: Developer resources (Component, Workload, Service) are environment-agnostic.
Environment-specific configurations are handled through Binding resources during deployment.

**Progressive Delivery**: The Control Plane manages promotion workflows through DeploymentPipelines, creating
environment-specific Bindings that combine workload specifications with runtime configurations.

### Cross-Plane Orchestration

The Control Plane coordinates activities across other planes:

- **DataPlane Management**: Registers and manages connections to multiple Kubernetes clusters, handling credentials, TLS
  certificates, and cluster-specific configurations
- **BuildPlane Dispatching**: Triggers build jobs on registered BuildPlanes, managing build configurations and artifact
  repositories
- **Observability Integration**: Configures connections to Observer APIs for centralized logging and metrics collection

---

## Data Plane

The **Data Plane** is where applications run, implementing a cell-based architecture that provides strong isolation,
security, and observability for workloads. Each Data Plane is a Kubernetes cluster enhanced with networking, security,
and API management capabilities.

### Cell-Based Architecture

At runtime, each **Project** becomes a **Cell** - an isolated, secure unit that encapsulates all components of a bounded
context. This architecture pattern:

- **Isolates workloads**: Each cell runs in dedicated namespaces with network boundaries
- **Enforces domain boundaries**: Aligns with Domain-Driven Design principles
- **Enables autonomous operation**: Cells can be independently deployed and managed
- **Provides clear interfaces**: All inter-cell communication goes through well-defined gateways

### Networking Stack

The Data Plane leverages advanced networking technologies:

**Cilium (eBPF-based networking)**:

- Automatically generates network policies to enforce security boundaries
- Provides visibility into network flows and performance metrics
- Workload communication is secured with WireGuard transport encryption

**Envoy Gateway**:

- Manages ingress traffic with advanced routing capabilities
- Provides API management features (rate limiting, authentication)
- Handles TLS termination and certificate management
- Supports multiple protocols (HTTP/HTTPS, gRPC, WebSocket)

### Traffic Flow Patterns

Data Planes implement structured traffic patterns through directional gateways:

- **Northbound Ingress**: Routes public internet traffic into cells (public APIs, web apps)
- **Southbound Egress**: Manages outbound internet access (third-party APIs, external services)
- **Westbound Ingress**: Handles organization-internal traffic between cells
- **Eastbound Egress**: Controls inter-cell communication within the platform

Each visibility scope (`public`, `organization`, `project`) maps to specific gateway configurations, ensuring traffic
flows only through authorized paths.

### Workload Management

The Data Plane handles workload deployment through:

- **Namespace Isolation**: Each Project/Environment combination gets dedicated namespaces
- **Release Deployment**: The Control Plane pushes Release resources containing Kubernetes manifests
- **Multi-tenancy**: Organizations are isolated through namespace boundaries and network policies
- **Resource Management**: Enforces quotas, limits, and scheduling constraints per project

### Multi-Region Support

Organizations can register multiple Data Planes for:

- Geographic distribution (e.g., `us-west-2`, `eu-central-1`)
- Environment separation (e.g., `staging`, `production`)
- Compliance requirements (e.g., data residency)
- Disaster recovery and high availability

Each Data Plane is registered using a `DataPlane` custom resource that stores connection details, credentials, and
configuration.

---

## Build Plane

The **Build Plane** provides dedicated infrastructure for executing continuous integration workflows, separating build
workloads from runtime environments. It handles source code compilation, container image creation, and test execution in
an isolated, scalable environment.

### Argo Workflows Integration

The Build Plane is powered by **Argo Workflows**, which provides:

- **Workflow Orchestration**: Manages complex build pipelines with dependencies
- **Parallel Execution**: Runs multiple build steps concurrently for faster builds
- **Resource Management**: Controls CPU and memory allocation for build pods
- **Build Monitoring**: Tracks build progress and provides real-time status updates

### Build Strategies

OpenChoreo supports multiple build strategies to accommodate different application types:

**Cloud Native Buildpacks**:

- Automatically detects application type and runtime
- Provides consistent, reproducible builds without Dockerfiles
- Includes security patches and best practices by default
- Supports multiple languages and frameworks

**Docker Builds**:

- Uses custom Dockerfiles for complete control
- Supports multi-stage builds for optimized images
- Enables specialized build requirements

### Build Workflow

The build process follows a structured workflow:

1. **Build Trigger**: Control Plane creates a Build resource from Component specifications
2. **Source Retrieval**: Clones source code from configured Git repositories
3. **Image Building**: Executes the selected build strategy (Buildpack or Docker)
4. **Registry Push**: Publishes container images to configured registries with appropriate tags
5. **Status Updates**: Reports build progress and results back to the Control Plane

### Security & Isolation

The Build Plane provides strong security boundaries:

- **Namespace Isolation**: Each organization gets dedicated build namespaces
- **Resource Isolation**: Build jobs run independently without affecting other builds
- **Registry Authentication**: Secure credential management for image repositories

### Integration Points

The Build Plane integrates with other components:

- **Control Plane Communication**: Receives build requests and reports status
- **Container Registries**: Pushes built images to configured registries
- **Observer API**: Streams build logs for monitoring and debugging

Each Build Plane is registered using a `BuildPlane` custom resource, which stores connection details and configuration
for the Control Plane to dispatch build jobs.

---

## Observability Plane

The **Observability Plane** provides centralized logging infrastructure for the entire platform, collecting and
aggregating logs from all other planes for monitoring, debugging, and analysis.

### Core Components

**OpenSearch**:

- Serves as the central log aggregation and search platform
- Provides full-text search capabilities across all platform logs
- Stores structured and unstructured log data with configurable retention
- Enables complex queries and log analysis

**Observer API**:

- Exposes a unified interface for querying logs
- Provides authenticated access to log data
- Supports filtering by organization, project, and component
- Enables integration with external tools and dashboards

### Log Collection Architecture

The Observability Plane implements a distributed log collection pattern:

- **Fluentbit Agents**: Deployed on Control, Data, and Build planes to collect logs
- **Log Forwarding**: Fluentbit agents ship logs to the central OpenSearch cluster
- **Structured Logging**: Logs are enriched with metadata (plane, organization, project, component)

### Integration with Other Planes

Unlike other planes, the Observability Plane:

- Has no custom resource definitions (CRDs) to manage
- Operates independently after initial setup via Helm charts
- Receives log streams from all planes through Fluentbit
- Provides read-only access through the Observer API

Each plane connects to the Observability Plane by:

- Configuring Fluentbit with OpenSearch endpoints
- Authenticating with appropriate credentials
- Enriching logs with plane-specific metadata

### Deployment Flexibility

The Observability Plane supports various deployment models:

- **Dedicated Cluster**: Recommended for production with high log volumes
- **Colocated Deployment**: Can share infrastructure with other planes in development
- **Regional Placement**: Often deployed near Data Planes to minimize data transfer costs
- **Non-Kubernetes Options**: Can run on bare metal or cloud-managed services (e.g., Amazon OpenSearch)

---

## Deployment Patterns

OpenChoreo's flexible architecture supports various deployment topologies to match different organizational needs and
stages of adoption.

### Development Setup

For local development and testing, all planes can be deployed in a single Kubernetes cluster:

- **Single Cluster**: All four planes share the same cluster with namespace separation
- **Minimal Resources**: Reduced replica counts and resource allocations
- **Simplified Networking**: No cross-cluster communication required
- **Quick Start**: Ideal for evaluating OpenChoreo and development environments

This pattern is used in the OpenChoreo Quick Start guide and is suitable for teams getting started with the platform.

### Production Setup

Production deployments typically use dedicated clusters for each plane:

- **Control Plane**: Dedicated cluster in a central region
- **Data Planes**: Multiple clusters across regions (e.g., us-west-2, eu-central-1)
- **Build Plane**: Isolated cluster for CI/CD workloads
- **Observability Plane**: Dedicated cluster or managed service for log aggregation

This pattern provides:

- Maximum isolation between planes
- Independent scaling and maintenance
- Geographic distribution for compliance and performance
- High availability and disaster recovery options

### Hybrid Setup

Many organizations use a hybrid approach that balances isolation with operational simplicity:

- **Control + Build Plane**: Colocated in a management cluster
- **Data Planes**: Separate clusters for production and non-production
- **Observability**: Managed service (e.g., Amazon OpenSearch) or shared cluster

This pattern works well for:

- Medium-sized organizations with limited operational overhead
- Teams transitioning from development to production
- Cost-conscious deployments that still require production isolation

### Multi-Environment Strategy

Organizations typically map environments to Data Planes:

- **Development Environment**: Shared Data Plane with relaxed policies
- **Staging Environment**: Dedicated Data Plane mirroring production
- **Production Environment**: Multiple Data Planes for regions and availability zones

---

## Next Steps

- **[Concepts](../concepts/developer-abstractions.md)** - Learn about Projects, Components, and other abstractions
- **[Quick Start Guide](../getting-started/quick-start-guide.md)** - Try OpenChoreo with a single-cluster development
  setup
- **[Installation Guide](../getting-started/single-cluster.md)** - Deploy OpenChoreo in your environment
- **[API Reference](../reference/api/application/project.md)** - Detailed documentation of all custom resources
