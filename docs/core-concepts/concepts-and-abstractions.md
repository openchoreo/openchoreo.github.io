---
layout: docs
title: Concepts and Abstractions
---
# Concepts and Abstractions

OpenChoreo defines a comprehensive set of developer-facing abstractions (Project, Component, API, and WorkloadSpec) that enable teams to declaratively model application architecture and runtime behavior. These abstractions are designed to be GitOps-compatible and support both monorepo and multi-repo setups, allowing the same source code to be reused across multiple components with distinct runtime contracts.

## Goals

The OpenChoreo abstraction model aims to:

- **Enable Declarative Development**: Developers define Projects, Components, and APIs using declarative YAML files
- **Separate Runtime Contracts**: Provide a clear way to declare a component's runtime contract (endpoints, connections, etc.) separate from source code
- **GitOps Compatibility**: Ensure all declarations are easily managed in Git repositories and compatible with GitOps workflows (Argo CD, Flux)
- **Repository Flexibility**: Support recommended patterns for organizing declarations across mono- and multi-repository setups
- **Code Reusability**: Allow a single codebase to back multiple components, each with its own workload configuration
- **Interactive Operations**: Expose an API server in the OpenChoreo control plane to support CLI, UI, and CI systems

At its core, OpenChoreo provides a control plane that sits on top of one or more Kubernetes clusters, turning them into a cohesive internal developer platform through a layered abstraction model.

OpenChoreo introduces a set of high-level, Kubernetes-native abstractions that help developers and platform engineers structure, deploy, and expose cloud-native applications with clarity and control. These abstractions are explicitly separated to address concerns like identity, runtime behavior, API exposure, version tracking, and environment-specific deployment.

## Developer Abstractions
Developers work with additional abstractions that focus on application connectivity, networking, and operational concerns. These abstractions complement the common abstractions by providing fine-grained control over how components interact and expose themselves.

### Project

A **Project** is a logical grouping of related components that collectively define an application or bounded context. It serves as the main organizational boundary for source code, deployments, and network policies.

Projects:
- Define team or application-level boundaries
- Govern internal access across components
- Define deployment isolation, visibility scope, and govern how components communicate internally and with external systems via ingress and egress gateways
- Map to a set of Namespaces (one per Environment) in one or more Data planes
- Align with Domain-Driven Design principles, representing bounded contexts

### Component

A **Component** represents a deployable piece of software, such as a backend service, frontend webapp, background task, or API proxy.

Each Component:
- Defines its identity within a Project
- Declares its type (e.g., service, webapp, task, api)
- Specifies component type-specific settings (cron expressions, replica sets, API management configurations)
- Refers to a source code location (Git repo, image registry)
- Maps to workload resources like Deployment, Job, or StatefulSet

#### Component Types and Templates

OpenChoreo uses a **Class/Binding** pattern to provide reusable deployment templates:

**Component Type Definitions:**
- **Service**: Backend API services with HTTP/gRPC endpoints
- **WebApplication**: Frontend web applications serving client-side assets  
- **ScheduledTask**: Cron jobs and batch processing workloads
- **API**: API proxy/gateway components for API management

**Template System (Classes):**
- **ServiceClass**: Deployment templates for backend services
- **WebApplicationClass**: Templates for web applications
- **ScheduledTaskClass**: Templates for scheduled tasks
- **APIClass**: Templates for API gateways

**Environment-Specific Instances (Bindings):**
- **ServiceBinding**: Environment-specific Service deployment
- **WebApplicationBinding**: Environment-specific WebApplication deployment  
- **ScheduledTaskBinding**: Environment-specific ScheduledTask deployment
- **APIBinding**: Environment-specific API deployment


**Note**: Component Types are pluggable. Platform teams can define their own types to represent custom workloads, third-party services, or golden-path abstractions, each with their own schema and runtime behavior.

### API

An **API** describes how a component's endpoint is exposed beyond its Project. This includes HTTP routing, versioning, authentication, rate limits, and scopes.

APIs:
- Are optional — many components may remain internal
- Can be independently versioned
- Enable controlled exposure (organization-wide or public)
- Support integration into API gateways or developer portals
- Can be exposed by both Service and ProxyAPI Component types

### Build
Build execution resource created from Component specifications that:
- Contains repository references and build template configurations
- Supports Docker and Buildpack build strategies
- Integrates with Argo Workflows on BuildPlanes
- Tracks build status and resulting container images
- Is owned by Project/Component pairs


### Release  
Environment-specific deployment resource using a KRO-inspired approach that:
- Contains arbitrary Kubernetes resources as `runtime.RawExtension`
- Supports any resource type (HPA, PDB, NetworkPolicy, CRDs)
- Tracks resource health status and lifecycle
- Is owned by Project/Component pairs, targeted to specific environments


### Workload

A **Workload** captures the runtime contract of a Component within a DeploymentTrack. It defines how the component runs: its container image, ports, environment variables, and runtime dependencies.

Workloads:
- Are versioned and linked to a specific track
- Can change frequently (e.g., after every CI build)
- Are typically maintained along with the source code of a component
- Define what OpenChoreo needs to know to wire, expose, and run the component

The WorkloadDescriptor describes:
- What ports and protocols does the component expose?
- What are the connection dependencies (databases, queues, other component endpoints)?
- What container image should be deployed?

By decoupling the OpenChoreo component from its workload descriptor, we support linking a single source code repository to multiple OpenChoreo components - enabling code reuse across different deployment scenarios.

### DeploymentTrack

A **DeploymentTrack** represents a line of development or a delivery stream for a component. It can be aligned with a Git branch (main, release-1.0, feature-xyz), an API version (v1, v2), or any other meaningful label that denotes evolution over time.

DeploymentTracks:
- Are optional when getting started or for simpler use cases
- Default to "default" track if omitted
- Enable parallel development and deployment streams
- Support feature branching and API versioning strategies

### Deployments

A **Deployment** binds a specific Workload (and optionally an API) to an Environment within a given track. It represents the act of deploying a concrete version of a component to a specific environment.

Deployments:
- Are the unit of rollout and promotion
- Track the exact workload/API deployed in each environment  
- Enable progressive delivery by reusing the same workload across environments (dev → staging → prod)
- Are always derived, never written by hand
- Are generated by GitOps or CI/CD workflows that link Workload + API + Track + Environment

### DeployableArtifact
Artifact management resource for versioned artifacts (container images, etc.) that bridges build output to deployment consumption.

### Endpoint

An **Endpoint** represents a network-accessible interface exposed by a component, including routing rules, supported protocols, and visibility scopes.

Endpoints:
- Define how components expose services to consumers
- Support multiple protocols (HTTP, gRPC, TCP, WebSocket)
- Control visibility scope (public, organization, project-internal)
- Map to HTTPRoute resources and Service objects in Kubernetes
- Are enforced through shared ingress gateways
- Have visibility controlled via Cilium network policies

**Example visibility scopes:**
- `public`: Accessible from the internet
- `organization`: Accessible within the organization network
- `project`: Accessible only within the same project/cell

### Connection

A **Connection** represents an outbound service dependency defined by a component, targeting either other components within the platform or external systems.

Connections:
- Define how components consume services from other components or external systems
- Support service discovery and load balancing
- Enable secure communication through mTLS when connecting to other OpenChoreo components
- Map to Cilium network policies for traffic control
- Are routed through egress gateways for external connections
- Support connection-level configuration like timeouts, retries, and circuit breakers

**Connection types:**
- **Internal**: Connections to other components within the same or different projects
- **External**: Connections to services outside the OpenChoreo platform
- **Managed**: Connections to platform-managed services (databases, message queues)

**Promotion Workflow**: Promotion means copying or regenerating the Deployment with the same Workload in a different environment, enabling consistent deployments across the delivery pipeline.

## Platform Abstractions

Platform engineers use OpenChoreo's foundational abstractions to create and manage internal developer platforms that abstract infrastructure complexity while maintaining security, scalability, and operational best practices. These platform abstractions provide the infrastructure foundation that enables developer productivity and self-service capabilities.

Platform abstractions follow a clear hierarchy that builds from foundational infrastructure to environment-specific capabilities:

```
Organization (cluster-scoped root)
├── DataPlane (runtime clusters)
├── BuildPlane (build infrastructure)
├── Environment (runtime contexts)
├── DeploymentPipeline (promotion workflows)
└── ConfigurationGroup (environment configuration)
```

### Organization

An **Organization** serves as the top-level tenant boundary in OpenChoreo, providing multi-tenancy and resource isolation at scale. It represents a logical grouping of users and resources, typically aligned to a company, business unit, or team.

Organizations:
- Are cluster-scoped resources that contain all other OpenChoreo resources
- Create dedicated Kubernetes namespaces for tenant isolation
- Establish security boundaries between organizational units
- Provide the foundation for RBAC and access control policies
- Enable resource tracking and quota management per tenant
- Support enterprise multi-tenancy and team separation

### Data Plane

A **DataPlane** represents a target Kubernetes cluster where applications are deployed, providing cluster abstraction and enabling multi-cluster management. DataPlanes encapsulate all the configuration needed to deploy and manage applications on specific Kubernetes clusters.

DataPlanes:
- Abstract connection details and credentials for target Kubernetes clusters
- Store TLS certificates and authentication information securely
- Enable centralized management of multiple clusters from a single control plane
- Support different cluster types (on-premises, cloud providers, edge locations)
- Configure public-facing and organization-internal virtual hosts for gateways
- Integrate with container registries with authentication credentials
- Connect to Observer API endpoints for monitoring and logging
- Support multi-cluster deployment and infrastructure abstraction

### Build Plane

A **BuildPlane** provides dedicated Kubernetes infrastructure for build workloads, separating build execution from runtime environments. BuildPlanes integrate with Argo Workflows to provide scalable, secure CI/CD capabilities.

BuildPlanes:
- Provide separate Kubernetes clusters dedicated to CI/CD operations
- Isolate build workloads from production runtime environments
- Enable independent scaling and resource management for builds
- Create dedicated namespaces for build execution per organization
- Support Docker-based builds and Cloud Native Buildpacks integration
- Connect to Observer API for build monitoring and logging
- Provide dedicated credentials and secrets management for builds
- Enable secure artifact promotion between build and runtime environments

### Environments

An **Environment** represents a target runtime space — such as dev, staging, or prod. It encapsulates infrastructure-specific configuration like cluster bindings, gateway setups, secrets, and policies.

Environments:
- Are where actual deployments occur
- May have constraints or validations (e.g., only approved workloads may run in prod)
- Define runtime context with specific configurations and policies
- Map to different Kubernetes clusters or namespaces

### Deployment Pipeline

A **DeploymentPipeline** defines promotion workflows and approval processes that govern how applications move between environments. DeploymentPipelines provide the automation and governance needed for safe, reliable deployments.

DeploymentPipelines:
- Define allowed transitions between environments (dev → staging → prod)
- Support complex promotion topologies with multiple paths
- Configure manual approval gates for sensitive environments
- Support automated approval based on testing and validation
- Enable role-based approval permissions and audit trails
- Integrate with automated testing frameworks and quality gates
- Enable rollback mechanisms for failed promotions
- Support feature branch deployments and parallel development
- Provide flexible promotion strategies per component or project


### Developer Workflow Abstractions

Additional abstractions that support developer workflows:

#### Build Configuration

Defines how source code is transformed into deployable artifacts:
- **Buildpack Integration**: Automatic detection and building using Cloud Native Buildpacks
- **Custom Builds**: Support for Dockerfile and custom build processes
- **Multi-stage Builds**: Optimized container image creation
- **Build Caching**: Efficient rebuilds through layer caching

#### Configuration Management

Manages application configuration and secrets:
- **Environment Variables**: Component-specific and environment-specific variables
- **Config Maps**: Shared configuration across components
- **Secrets**: Secure handling of sensitive data
- **Dynamic Configuration**: Runtime configuration updates without redeployment

These developer abstractions work together with the common and platform abstractions to provide a complete development experience, enabling developers to focus on business logic while the platform handles infrastructure concerns automatically.

## Runtime Abstractions

At runtime, OpenChoreo transforms each Project (Bounded Context) into a **Cell** - a secure, isolated, and observable unit that enforces domain boundaries through infrastructure. Architects and developers interact with these runtime abstractions to understand how their applications operate in production.

### Cell
A **Cell** is the runtime reification of a single project in OpenChoreo. It encapsulates all components of a project and controls how they communicate internally and externally through well-defined ingress and egress paths.

Cell characteristics:
- Communication between components in the same cell is permitted without interception
- Cilium and eBPF enforce fine-grained network policies across all ingress and egress paths
- Provides security boundaries aligned with business domains
- Enables autonomous operation while maintaining organizational governance

### Traffic Flow Patterns

Cells implement a structured approach to traffic management through directional ingress and egress patterns:

#### Northbound Ingress
- Routes incoming traffic from external (internet) sources into the cell
- Endpoints with `visibility: public` are exposed through this ingress path
- Handles public API traffic, web applications, and external integrations

#### Southbound Egress  
- Handles outbound Internet access from components in the Cell
- Connections to external services are routed through this egress path
- Supports third-party API calls, external database connections, and cloud service integrations

#### Westbound Ingress
- Handles traffic entering the Cell from within the organization
- Routes traffic from other cells or internal network sources
- Endpoints with `visibility: organization` are exposed through this ingress path
- Enables secure inter-service communication within the organization

#### Eastbound Egress
- Handles outbound traffic to other cells or internal network destinations
- Supports component-to-component communication across project boundaries
- Maintains security policies while enabling necessary cross-domain integration

### Network Policies

**Network Policies** in OpenChoreo are automatically generated based on the declared Endpoints and Connections, implementing zero-trust networking principles.

Network Policies:
- Are automatically derived from component declarations
- Implement least-privilege access control
- Use Cilium and eBPF for high-performance policy enforcement
- Support both L3/L4 and L7 policy rules
- Enable fine-grained traffic control and monitoring
- Are updated automatically when component configurations change

## Workflow Integration

OpenChoreo's abstractions are designed to support modern development workflows:

### GitOps Compatibility
- All abstractions are defined as declarative YAML files
- Version controlled alongside application source code
- Compatible with GitOps tools like Argo CD and Flux for automated reconciliation
- Supports both monorepo and multi-repo organizational patterns

### Developer Experience
Developers interact with these abstractions through:
- **Declarative YAML**: Define components, workloads, and APIs as code
- **CLI Tools**: Interactive operations for development and debugging
- **UI Dashboard**: Visual management and monitoring of applications
- **CI/CD Integration**: Automated promotion and deployment workflows

### Promotion and Deployment
The abstraction model supports progressive delivery:
1. **Development**: Author Component and Workload definitions
2. **Build**: CI systems generate versioned Workload artifacts
3. **Deploy**: GitOps workflows create Deployments linking Workloads to Environments
4. **Promote**: Automated or manual promotion moves Workloads through Environment stages
5. **Monitor**: Runtime abstractions provide observability and control

By combining these developer-facing, platform, and runtime abstractions, OpenChoreo provides a complete model for building, deploying, and operating cloud-native applications at scale while maintaining developer productivity and platform reliability.
