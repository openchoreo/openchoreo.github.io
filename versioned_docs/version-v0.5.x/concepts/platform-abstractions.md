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

## Workflows

A **Workflow** is a platform engineer-defined template for executing build, test, and automation tasks in OpenChoreo.
Workflows provide a schema-driven interface that separates developer-facing parameters from platform-controlled
configurations, enabling developers to trigger complex CI/CD processes through simple, validated inputs.

Workflows in OpenChoreo integrate with Argo Workflows to provide Kubernetes-native execution for continuous
integration tasks. Unlike traditional CI/CD systems where developers must understand pipeline implementation details,
OpenChoreo Workflows present a curated schema of configurable options while platform engineers control the underlying
execution logic, security policies, and infrastructure configurations.

Each Workflow defines a **schema** that specifies what developers can configure when creating a run instance.
This schema uses the same inline type definition syntax as ComponentTypes, making validation rules explicit and
self-documenting. The schema typically includes repository configuration, build parameters, resource limits, and
testing options, with type validation, default values, and constraints enforced automatically.

The Workflow's **resource template** contains the actual Argo Workflow specification with CEL expressions for dynamic
value injection. These expressions access three categories of variables:

**Context variables** (`${ctx.*}`) provide runtime information like the workflow run name, component name, project name, and
organization name. These enable unique resource naming and proper isolation across
executions.

**Schema variables** (`${schema.*}`) inject developer-provided values from the WorkflowRun instance. These include
repository URLs, build configurations, and other parameters defined in the workflow schema.

**Platform-controlled parameters** are hardcoded directly in the workflow and remain invisible to developers. These may
include container image references, registry URLs, security scanning configurations, and organizational policies. By
hardcoding these values, platform engineers ensure compliance with security standards and infrastructure policies
regardless of developer input.

Workflows can be referenced by Components through the `workflow` field, enabling automated builds triggered by code
changes or manual developer actions. ComponentTypes can restrict which Workflows are allowed through the
`allowedWorkflows` field, ensuring that different component types use appropriate build strategies and security
policies.

The Workflow abstraction thus provides a controlled interface to powerful CI/CD capabilities, enabling platform teams
to offer self-service build automation while maintaining governance over build processes, security scanning, artifact
storage, and compliance requirements.
