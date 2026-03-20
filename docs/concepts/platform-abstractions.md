---
title: Platform Abstractions
description: Platform abstractions for managing infrastructure
---

# Platform Abstractions

Platform abstractions in OpenChoreo provide the foundational infrastructure layer that platform engineers use to build
and manage Internal Developer Platforms. These abstractions establish logical boundaries, manage infrastructure
resources, and define the operational policies that enable developer self-service while maintaining security and
compliance.

## Namespace

OpenChoreo uses Kubernetes namespaces to organize and isolate groups of related resources. By default, platform resources like ComponentTypes, Traits, Workflows, DataPlanes, and WorkflowPlanes are created as cluster-scoped resources (ClusterComponentType, ClusterTrait, ClusterWorkflow, ClusterDataPlane, ClusterWorkflowPlane), making them automatically visible to all namespaces. This means any new namespace has access to them out of the box. Platform teams can create namespace-scoped variants when they need to customize or isolate resources for a particular namespace. Resources like Projects, Environments, and DeploymentPipelines remain namespace-scoped since they are inherently tied to a specific namespace context.

OpenChoreo identifies and manages namespaces through a label (`openchoreo.dev/control-plane: true`). The control plane uses this label to discover namespaces, perform list/get operations, and organize platform resources. When an OpenChoreo cluster is created, the default namespace is automatically labeled with this identifier, enabling immediate platform resource creation.

## Infrastructure Planes

OpenChoreo separates infrastructure concerns into specialized planes, each serving a distinct purpose in the platform architecture. This separation enables independent scaling, security isolation, and operational management of different platform functions.

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

### WorkflowPlane

A **WorkflowPlane** provides dedicated infrastructure for executing continuous integration and build workloads. By
separating build operations from runtime workloads, WorkflowPlanes ensure that resource-intensive compilation and testing
processes don't impact production applications.

WorkflowPlanes integrate with Argo Workflows to provide a scalable, Kubernetes-native CI/CD execution environment. They
handle the complete build lifecycle, from source code retrieval through compilation, testing, and container image
creation. This separation also provides security benefits, isolating potentially untrusted build processes from
production environments.

Platform engineers configure WorkflowPlanes with the necessary tools, credentials, and policies for building applications.
This includes container registry credentials, build tool configurations, and security scanning policies. WorkflowPlanes can
be scaled independently based on build demand and can be distributed geographically to reduce latency for development
teams.

### Observability Plane

The **Observability Plane** provides centralized logging infrastructure for the entire platform. It collects and
aggregates logs from all other planes - Control, Data, and Workflow - providing a unified view of platform operations and
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
represents the organization's software delivery process as a declarative configuration, encoding promotion rules and quality gates.

DeploymentPipelines go beyond simple environment ordering to define complex promotion topologies. They can specify
parallel paths for different types of releases and conditional progressions based on application characteristics.
This flexibility allows organizations to implement sophisticated delivery strategies while maintaining governance and
control.

The pipeline abstraction also serves as an integration point for organizational processes. Automated testing can be
triggered at promotion boundaries, and compliance checks can be enforced before production deployment. This ensures
that all applications follow organizational standards regardless of which team develops them.

## ReleaseBinding

A **ReleaseBinding** connects a ComponentRelease to a specific Environment. This is what actually deploys a release to
a data plane—but it's more than just a reference.

ReleaseBinding provides a way to override configuration for a specific environment. Values defined in the ComponentType's
`environmentConfigs` and Trait's `environmentConfigs` can be customized per environment through the ReleaseBinding.
This is where environment-specific differences reside: scaling in production versus development, resource limits,
storage classes, and so on—while the ComponentRelease itself remains unchanged.

Once a ReleaseBinding is created, the ReleaseBinding controller renders the ComponentType and Trait templates with the
combined configuration, generates the necessary Kubernetes resources (Deployments, Services, ConfigMaps, etc.), and
produces a **RenderedRelease** resource that is applied to the target plane.

## Component Types

A **ComponentType** is a platform engineer-defined template that governs how components are deployed and managed in
OpenChoreo. It represents the bridge between developer intent and platform governance, encoding organizational
policies, best practices, and infrastructure patterns as reusable templates.

ComponentTypes implement the platform's claim/class pattern at the component level. While developers create Components
that express their application requirements, platform engineers define ComponentTypes that specify how those
requirements should be fulfilled. This separation enables developers to focus on application logic while platform
engineers maintain control over infrastructure policies, resource limits, security configurations, and operational
standards.

OpenChoreo also provides **ClusterComponentType**, a cluster-scoped variant of ComponentType. The default platform setup uses ClusterComponentTypes so that all namespaces can reference them without duplication. Namespace-scoped ComponentTypes are available when platform engineers need to customize or override the defaults for a specific namespace.

Each ComponentType (or ClusterComponentType) is built around a specific **workload type** - the primary Kubernetes
resource that will run the application. OpenChoreo supports four fundamental workload types:

- **deployment**: For long-running services that need continuous availability
- **statefulset**: For applications requiring stable network identities and persistent storage
- **cronjob**: For scheduled tasks that run at specific times or intervals
- **proxy**: For proxy workloads that route traffic without running application containers

The ComponentType uses a **schema-driven architecture** that defines what developers can configure when creating
components. This schema consists of two types of parameters:

**Parameters** are configurations captured in the ComponentRelease and applied uniformly wherever that release is
deployed. These include settings like replica counts, image pull policies, and container ports. When you deploy the
same ComponentRelease to multiple environments, the parameter values are identical. To change parameters, you update
the Component and create a new ComponentRelease.

**EnvironmentConfigs** are configurations that can be overridden on a per-environment basis through ReleaseBinding resources.
These typically include resource allocations, scaling limits, and environment-specific policies. This flexibility
allows platform engineers to provide generous resources in production while constraining development environments to
optimize infrastructure costs.

The schema uses an inline type definition syntax that makes configuration requirements explicit and self-documenting.
For example, `"integer | default=1"` declares an integer parameter with a default value, while
`"string | enum=Always,IfNotPresent,Never"` restricts a string to specific allowed values. This syntax supports
validation rules like minimum/maximum values, required fields, and enumerated choices.

ComponentTypes define **resource templates** that generate the actual Kubernetes resources for components. Each
template uses CEL (Common Expression Language) expressions to dynamically generate resource manifests based on
component specifications. Templates can access component metadata, schema parameters, and workload specifications
through predefined variables like `${metadata.name}` and `${parameters.replicas}`.

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

## Traits

A **Trait** is a platform engineer-defined template that augments components with operational behavior without modifying
the ComponentType. Traits enable composable, reusable capabilities that can be attached to any component—such as
persistent storage, autoscaling, network policies, or sidecar injection.

Similar to ComponentTypes, OpenChoreo provides **ClusterTrait**, a cluster-scoped variant. The default platform setup uses ClusterTraits so that shared cross-cutting concerns are available to all namespaces. Namespace-scoped Traits can override or extend these defaults within a specific namespace.

Traits use the same schema-driven approach as ComponentTypes, with `parameters` for static configuration and
`environmentConfigs` for environment-specific values. Developers attach Traits to their Components with instance-specific
parameters, while platform engineers can override environment-specific values through ReleaseBindings.

Each Trait defines two types of operations:

**Creates** generate new Kubernetes resources that don't exist in the base ComponentType. For example, a storage Trait
might create PersistentVolumeClaims, or a monitoring Trait might create ServiceMonitor resources.

**Patches** modify existing resources generated by the ComponentType. Using JSON Patch operations with array filtering,
Traits can inject environment variables, add volume mounts, attach sidecar containers, or add labels and annotations
to existing resources.

This separation between ComponentTypes (base deployment patterns) and Traits (composable capabilities) enables platform
engineers to define orthogonal concerns independently. Rather than creating separate ComponentTypes for every combination
of features, platform engineers define focused Traits that developers can mix and match as needed.

## Workflow and ClusterWorkflow

A **Workflow** is a platform engineer-defined template for running automation tasks in OpenChoreo. Workflows provide
a unified mechanism for both component builds and generic automation — infrastructure provisioning, data pipelines,
end-to-end testing, and more.

OpenChoreo also provides **ClusterWorkflow**, a cluster-scoped variant of Workflow. While Workflows are
namespace-scoped and available only within their namespace, ClusterWorkflows are available across all namespaces.
This is useful when platform engineers want to define shared workflow templates once and allow WorkflowRuns in any
namespace to reference them, eliminating duplication. Because ClusterWorkflows are cluster-scoped, they can only
reference ClusterWorkflowPlanes (not namespace-scoped WorkflowPlanes) for their workflow operations.

Each Workflow defines:

**Parameter Schema** provides complete freedom for platform engineers to define developer-facing parameters. The schema
can include any structure — repository URLs, build version numbers, test modes, resource allocations, timeout settings,
and more. The schema supports all types including integers, booleans, strings, arrays, and nested objects, with full
validation through defaults, minimums, maximums, and enums.

**Run Template** contains the actual Kubernetes resource specification (typically an Argo Workflow) with CEL template
variables for dynamic value injection. These expressions access context variables like `${metadata.workflowRunName}`
and `${metadata.namespaceName}` for runtime information, developer parameter values through `${parameters.*}` for
configuration, and resolved external references through `${externalRefs.<id>.spec.*}` for secret data. Platform
engineers can also hardcode platform-controlled parameters directly in the template, such as builder images, registry
URLs, and security scanning settings.

**External References** declare references to external CRs (currently `SecretReference`) that are resolved at runtime
and injected into the CEL context. This enables secure access to credentials without embedding them in the Workflow
definition.

**Resources** are additional Kubernetes resource templates (e.g., ExternalSecrets, ConfigMaps) created in the workflow
plane alongside the workflow run, with optional `includeWhen` conditions for conditional creation.

Workflows can be triggered directly via WorkflowRun resources and are suitable for
tasks like infrastructure provisioning, data pipelines, scheduled jobs, and other automation that is not tied to a
specific component's build lifecycle. A Workflow becomes a **component workflow** when it is bound to a Component.
Component workflows carry two annotations: `openchoreo.dev/workflow-scope: "component"`, which identifies the workflow
as component-scoped and is used by developer tooling (e.g., `occ`) for categorization, and
`openchoreo.dev/component-workflow-parameters`, which maps logical parameter keys (like `repoUrl` and `branch`) to
their paths in the parameter schema to enable auto-build via Git webhooks and UI integration. Component workflows must
also be listed in a ComponentType's `allowedWorkflows` field to be available for components.

ComponentTypes govern which Workflows developers can use through the `allowedWorkflows` field. This enables platform
engineers to enforce build standards per component type, ensuring that web applications use approved frontend build
tools, backend services use appropriate security scanners, and different component types follow their specific build
requirements.

Components reference Workflows in their `workflow` field, providing parameter values for build configuration. The
platform handles template rendering, external reference resolution, secret synchronization, and execution management
in the workflow plane, with WorkflowRun resources tracking individual executions.
