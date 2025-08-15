---
layout: docs
title: Platform Abstractions
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

## Class System

OpenChoreo implements the standard Kubernetes Class pattern, similar to GatewayClass or StorageClass, enabling platform
engineers to define platform-level abstractions that developers consume through their applications.

### The Class Pattern

Classes are platform-level resources that encode organizational standards, best practices, and governance policies.
Platform engineers create Classes for different workload types - ServiceClass for backend services, WebApplicationClass
for frontend applications, and ScheduledTaskClass for batch jobs. Each Class defines the platform standards that
applications must follow when claiming these resources.

Just as GatewayClass defines infrastructure capabilities that Gateway resources consume, or StorageClass defines how
storage should be provisioned when a PersistentVolumeClaim is created, ServiceClass defines how services should be
deployed when developers create Service resources. This pattern provides a clean separation between platform
capabilities (defined by platform engineers) and application requirements (expressed by developers).

### Class Consumption

When developers create application resources like Service or WebApplication, they reference the appropriate Class,
similar to how a PersistentVolumeClaim references a StorageClass. The platform uses the Class definition to provision
the actual workload with the correct configuration, policies, and governance rules.

Environment-specific Bindings act as the instantiation of this claim in a specific environment. While the Service
resource expresses the developer's intent and references a ServiceClass, the ServiceBinding represents the actual
deployment of that service in a particular environment with environment-specific overrides.

This consumption model balances standardization with flexibility. Platform teams maintain control over critical
configurations through Classes while developers express their requirements through simple resource definitions. The
platform handles the complex mapping between developer intent and infrastructure reality.


