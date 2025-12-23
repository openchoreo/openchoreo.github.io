---
title: Platform Abstractions
description: Platform abstractions for managing infrastructure
---

# Platform Abstractions

Platform abstractions in OpenChoreo provide the foundational infrastructure layer that platform engineers use to build
and manage Internal Developer Platforms. These abstractions establish organizational boundaries, manage infrastructure
resources, and define the operational policies that enable developer self-service while maintaining security and
compliance.

## Organization

The **Organization** represents the highest level of tenancy in OpenChoreo, serving as the root container for all
platform resources. It establishes the fundamental isolation boundary between different business units, teams, or
customers in a multi-tenant platform.

Organizations provide complete resource isolation through dedicated Kubernetes namespaces, ensuring that resources,
configurations, and workloads from different organizations never interact. This isolation extends beyond simple
namespace separation to include network policies, RBAC rules, and resource quotas, creating a secure multi-tenant
environment.

Each organization maintains its own set of platform resources, application resources, and runtime configurations. This
hierarchical structure enables platform teams to manage multiple independent tenants on the same OpenChoreo
installation, each with their own governance policies, resource limits, and operational procedures.

## Infrastructure Planes

OpenChoreo separates infrastructure concerns into specialized planes, each serving a distinct purpose in the platform
architecture. This separation enables independent scaling, security isolation, and operational management of different
platform functions.

### DataPlane

A **DataPlane** represents a Kubernetes cluster where application workloads run. It abstracts the complexity of cluster
management, providing a unified interface for deploying applications across multiple clusters regardless of their
location or underlying infrastructure.

DataPlanes encapsulate all the configuration needed to connect to and manage a Kubernetes cluster, including connection
credentials, TLS certificates, and cluster-specific settings. They enable platform teams to register multiple clusters -
whether on-premises, in public clouds, or at edge locations - and manage them through a single control plane.

Each DataPlane can host multiple environments and projects, with OpenChoreo managing the creation of namespaces, network
policies, and other cluster resources automatically. This abstraction allows platform teams to treat clusters as
interchangeable infrastructure resources, enabling strategies like geographic distribution, compliance-based placement,
and disaster recovery.

### BuildPlane

A **BuildPlane** provides dedicated infrastructure for executing continuous integration and build workloads. By
separating build operations from runtime workloads, BuildPlanes ensure that resource-intensive compilation and testing
processes don't impact production applications.

BuildPlanes integrate with Argo Workflows to provide a scalable, Kubernetes-native CI/CD execution environment. They
handle the complete build lifecycle, from source code retrieval through compilation, testing, and container image
creation. This separation also provides security benefits, isolating potentially untrusted build processes from
production environments.

Platform engineers configure BuildPlanes with the necessary tools, credentials, and policies for building applications.
This includes container registry credentials, build tool configurations, and security scanning policies. BuildPlanes can
be scaled independently based on build demand and can be distributed geographically to reduce latency for development
teams.

### Observability Plane

The **Observability Plane** provides centralized logging infrastructure for the entire platform. It collects and
aggregates logs from all other planes - Control, Data, and Build - providing a unified view of platform operations and
application behavior.

Built on OpenSearch, the Observability Plane offers full-text search capabilities and log retention management. The
Observer API provides authenticated access to log data, enabling integration with external monitoring tools and
dashboards. Unlike other planes, the Observability Plane has no custom resources to manage - it operates independently
after initial setup, receiving log streams from Fluentbit agents deployed across the platform.

Platform engineers configure the Observability Plane once during initial setup, establishing log collection pipelines,
retention policies, and access controls. This centralized approach ensures that all platform activity is auditable and
debuggable while maintaining security boundaries between organizations.

## Environment

An **Environment** represents a stage in the software delivery lifecycle, such as development, staging, or production.
Environments provide the context for deploying and running applications, defining the policies, configurations, and
constraints that apply to workloads in that stage.

Environments are not just labels or namespaces - they are first-class abstractions that define where applications 
should be deployed (which DataPlane) and serve as targets for deployment pipelines. This abstraction enables platform 
teams to organize different stages of the delivery pipeline.

Each environment represents a distinct deployment target. Development environments might target smaller clusters or 
shared infrastructure, while production environments target dedicated, high-availability clusters. The Environment 
resource primarily defines the mapping to infrastructure (DataPlane) and serves as a reference point for deployments 
and promotion workflows.

## DeploymentPipeline

A **DeploymentPipeline** defines the allowed progression paths for applications moving through environments. It
represents the organization's software delivery process as a declarative configuration, encoding promotion rules,
approval requirements, and quality gates.

DeploymentPipelines go beyond simple environment ordering to define complex promotion topologies. They can specify
parallel paths for different types of releases and conditional progressions based on application characteristics. 
This flexibility allows organizations to implement sophisticated delivery strategies while maintaining governance and 
control.

The pipeline abstraction also serves as an integration point for organizational processes. Manual approval gates can be
configured for sensitive environments, automated testing can be triggered at promotion boundaries, and compliance checks
can be enforced before production deployment. This ensures that all applications follow organizational standards
regardless of which team develops them.

## Component Types

A **ComponentType** is a platform engineer-defined template that governs how components are deployed and managed in
OpenChoreo. It represents the bridge between developer intent and platform governance, encoding organizational
policies, best practices, and infrastructure patterns as reusable templates.

ComponentTypes implement the platform's claim/class pattern at the component level. While developers create Components
that express their application requirements, platform engineers define ComponentTypes that specify how those
requirements should be fulfilled. This separation enables developers to focus on application logic while platform
engineers maintain control over infrastructure policies, resource limits, security configurations, and operational
standards.

Each ComponentType is built around a specific **workload type** - the primary Kubernetes resource that will run the
application. OpenChoreo supports four fundamental workload types:

- **deployment**: For long-running services that need continuous availability
- **statefulset**: For applications requiring stable network identities and persistent storage
- **cronjob**: For scheduled tasks that run at specific times or intervals
- **job**: For one-time or on-demand batch processing tasks

The ComponentType uses a **schema-driven architecture** that defines what developers can configure when creating
components. This schema consists of two types of parameters:

**Parameters** are static configurations that remain consistent across all environments. These include settings like
replica counts, image pull policies, and container ports. Once set at component creation, these values apply uniformly
whether the component runs in development, staging, or production.

**EnvOverrides** are configurations that platform engineers can override on a per-environment basis through
ComponentDeployment resources. These typically include resource allocations, scaling limits, and environment-specific
policies. This flexibility allows platform engineers to provide generous resources in production while constraining
development environments to optimize infrastructure costs.

The schema uses an inline type definition syntax that makes configuration requirements explicit and self-documenting.
For example, `"integer | default=1"` declares an integer parameter with a default value, while
`"string | enum=Always,IfNotPresent,Never"` restricts a string to specific allowed values. This syntax supports
validation rules like minimum/maximum values, required fields, and enumerated choices.

ComponentTypes define **resource templates** that generate the actual Kubernetes resources for components. Each
template uses CEL (Common Expression Language) expressions to dynamically generate resource manifests based on
component specifications. Templates can access component metadata, schema parameters, and workload specifications
through predefined variables like `${metadata.name}` and  `${parameters.replicas}`.

Templates support advanced patterns through conditional inclusion and iteration. The `includeWhen` field uses CEL
expressions to conditionally create resources based on configuration, enabling optional features like autoscaling or
ingress. The `forEach` field generates multiple resources from lists, useful for creating ConfigMaps from multiple
configuration files or managing multiple service dependencies.

ComponentTypes can also restrict which **Workflows** developers can use for building components through the
`allowedWorkflows` field. This enables platform engineers to enforce build standards, ensure security scanning, or
mandate specific build tools for different component types. For instance, a web application ComponentType might only
allow Workflows that use approved frontend build tools and security scanners.

This schema-driven approach ensures consistency across the platform while providing flexibility for different
application patterns. Platform engineers create ComponentTypes that encode organizational knowledge about how to run
applications securely and efficiently, while developers benefit from simplified configuration and automatic compliance
with platform standards.

## ComponentWorkflow

A **ComponentWorkflow** is a platform engineer-defined template specifically designed for building components in
OpenChoreo. Unlike generic automation workflows, ComponentWorkflows enforce a structured schema for repository
information while providing flexibility for additional build configuration, enabling powerful build-specific platform
features like auto-builds, webhooks, and build traceability.

ComponentWorkflows address the unique requirements of component builds that generic workflows cannot solve. Component
builds need to power manual build actions in the UI, integrate with Git webhooks for auto-builds, maintain build
traceability linking container images to source commits, and support monorepo structures by identifying specific
application paths. These features require the platform to reliably locate critical repository fields, which is only
possible with a predictable schema structure.

Each ComponentWorkflow defines three key sections:

**System Parameters Schema** enforces a required structured schema for repository information. This schema must follow
a specific structure with `repository.url`, `repository.revision.branch`, `repository.revision.commit`, and
`repository.appPath` fields, all of type string. Platform engineers can customize defaults, enums, and descriptions
within each field, but must maintain the field names, nesting structure, and types. This predictable structure enables
build-specific platform features to work reliably across all component workflows while still giving platform engineers
control over validation rules and default values.

**Developer Parameters Schema** provides complete freedom for platform engineers to define additional build
configuration. This flexible schema can include any structure the platform engineer designs - build version numbers,
test modes, resource allocations, timeout settings, caching configurations, retry limits, and more. The schema supports
all types including integers, booleans, strings, arrays, and nested objects, with full validation through defaults,
minimums, maximums, and enums. This separation between required system parameters and flexible developer parameters
balances platform reliability with configuration freedom.

**Run Template** contains the actual Kubernetes resource specification (typically an Argo Workflow) with template
variables for dynamic value injection. These expressions access context variables like `${metadata.workflowRunName}`,
`${metadata.componentName}`, `${metadata.projectName}`, and `${metadata.orgName}` for runtime information, system parameter values
through `${systemParameters.*}` for repository details, and developer parameter values through `${parameters.*}` for
custom configuration. Platform engineers can also hardcode platform-controlled parameters directly in the template,
such as builder images, registry URLs, security scanning settings, and organizational policies.

ComponentTypes govern which ComponentWorkflows developers can use through the `allowedWorkflows` field. This enables
platform engineers to enforce build standards per component type, ensuring that web applications use approved frontend
build tools, backend services use appropriate security scanners, and different component types follow their specific
build requirements.

Components reference ComponentWorkflows in their `workflow` field, providing the system parameters for repository
information and developer parameters for build configuration. The platform handles template rendering, secret
synchronization, and execution management in the build plane, with ComponentWorkflowRun resources tracking individual
build executions.

The ComponentWorkflow abstraction thus provides a specialized interface for component builds that balances platform
needs with developer flexibility. Platform engineers control build implementation, security policies, and
infrastructure configurations while ensuring build-specific features work reliably. Developers get a simplified
interface for configuring builds without managing complex CI/CD pipeline definitions. The separation from generic
workflows makes clear that component builds have unique requirements deserving dedicated abstractions, while
maintaining the schema-driven approach that characterizes OpenChoreo's architecture.
