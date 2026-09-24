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

OpenChoreo uses Kubernetes namespaces to organize and isolate groups of related resources. By default, platform resources like ComponentTypes, Traits, Workflows, DataPlanes, and WorkflowPlanes are created as cluster-scoped resources (ClusterComponentType, ClusterTrait, ClusterWorkflow, ClusterDataPlane, ClusterWorkflowPlane, ClusterObservabilityPlane), making them automatically visible to all namespaces. This means any new namespace has access to them out of the box. Platform teams can create namespace-scoped variants when they need to customize or isolate resources for a particular namespace. Resources like Projects, Environments, and DeploymentPipelines remain namespace-scoped since they are inherently tied to a specific namespace context.

OpenChoreo identifies and manages namespaces through a label (`openchoreo.dev/control-plane: true`). The control plane uses this label to discover namespaces, perform list/get operations, and organize platform resources. When an OpenChoreo cluster is created, the default namespace is automatically labeled with this identifier, enabling immediate platform resource creation.

## Infrastructure Planes

OpenChoreo separates infrastructure concerns into specialized planes, each serving a distinct purpose in the platform architecture. This separation enables independent scaling, security isolation, and operational management of different platform functions.

### Control Plane

The **Control Plane** is the Kubernetes cluster where OpenChoreo itself runs. It hosts the platform's custom resource definitions (CRDs), controllers, and the OpenChoreo API. Platform engineers interact with the control plane to define platform abstractions—ComponentTypes, Traits, Workflows, Environments, and more—and the controllers running here reconcile those resources into running workloads on the connected data planes.

The control plane does not run application workloads directly. Instead, it orchestrates all other planes: rendering releases and applying them to DataPlanes, dispatching builds to WorkflowPlanes, and collecting observability signals from across the fleet. Because all platform state lives here, the control plane is the single source of truth for the entire OpenChoreo installation.

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

The **Observability Plane** provides centralized infrastructure for collecting and analyzing logs, metrics, and traces
across all other planes - Control, Data, and Workflow - providing a unified view of platform operations and
application behavior.

The Observability Plane uses a pluggable adapter-pattern, with OpenSearch as the default backend for logs and traces,
and Prometheus for metrics. The Observer API provides authenticated access to observability data, enabling integration
with external monitoring tools and dashboards. Module authors can swap in alternative backends by implementing the adapter API.

Platform engineers can configure alerting rules to define conditions on logs and metrics, and route notifications via email or webhook.

Platform engineers configure the Observability Plane during initial setup, establishing collection pipelines,
retention policies, and access controls. This centralized approach ensures that all platform activity is auditable and
debuggable while maintaining security boundaries between namespaces.

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

## ResourceReleaseBinding

A **ResourceReleaseBinding** is the resource-side counterpart of ReleaseBinding. It pins a specific **ResourceRelease**
to an Environment and carries per-environment configuration overrides for the referenced ResourceType. This is where
settings like dev-vs-prod replica counts, storage sizes, or admin-UI enablement live—while the ResourceRelease
snapshot itself remains unchanged across environments.

ResourceReleaseBindings are authored by platform engineers or GitOps tooling, not by the Resource controller. The
controller for the parent Resource never creates or modifies bindings on its own; this keeps developer-facing Resource
spec edits from triggering automatic redeploys. Promoting a release into an environment is always an explicit step.

A binding can also override the ResourceType's retention policy for its environment, allowing production environments
to preserve underlying state (volumes, databases) on deletion while dev and staging defer to the type-level default.

When a ResourceReleaseBinding is created, the binding controller renders the ResourceType template with the combined
Resource parameters and environment overrides, produces a RenderedRelease that is applied to the target plane, and
resolves the declared outputs so consuming workloads can read them.

## ProjectReleaseBinding

A **ProjectReleaseBinding** is the project-level member of the binding family. It pins a **ProjectRelease** (an
immutable snapshot of a Project and its referenced ProjectType) to an Environment, and it is the explicit owner of the
project's data-plane namespace for that environment. The binding controller creates the namespace, applies the
namespace-scoped resources rendered from the project type (NetworkPolicies, ResourceQuotas, baseline RBAC), and
reports readiness. Components and resources belonging to the project deploy into that namespace.

Bindings are authored by clients: the Backstage UI and the `occ` CLI create one binding per pipeline environment at
project-creation time, and GitOps setups commit them to Git. The controller never creates bindings on its own, so a
project only deploys to the environments that have bindings. A binding created without a release pin is seeded once
with the project's latest release; after that, advancing the pin is always an explicit promotion step.

Like the other bindings, a ProjectReleaseBinding carries per-environment configuration. Values supplied through its
`environmentConfigs` are validated against the project type schema inlined in the pinned ProjectRelease snapshot, not
the live ProjectType, so validation stays fixed for an existing binding even if the type is edited later. This lets the
same release run with different quotas or policies in each environment while the snapshot itself remains unchanged.

## Component Types

A **ComponentType** is a platform engineer-defined template that governs how components are deployed and managed in
OpenChoreo. It represents the bridge between developer intent and platform governance, encoding organizational
policies, best practices, and infrastructure patterns as reusable templates.

ComponentTypes separate developer intent from platform governance. While developers create Components
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
- **job**: For one-off tasks that run to completion
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

The schema uses standard [OpenAPI v3 JSON Schema](https://swagger.io/specification/) format (`openAPIV3Schema`), making
configuration requirements explicit and self-documenting. For example, `type: integer` with `default: 1` declares an
integer parameter with a default value, while `type: string` with `enum: [Always, IfNotPresent, Never]` restricts a
string to specific allowed values. This format supports validation rules like minimum/maximum values, required fields,
and enumerated choices.

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

## Resource Types

A **ResourceType** is a platform engineer-defined template that governs how managed infrastructure is provisioned in
OpenChoreo. Where ComponentTypes describe how a code component is deployed, ResourceTypes describe how a Resource is
provisioned: what Kubernetes manifests the platform emits on the data plane, what parameters the developer can set,
what outputs (hostnames, credentials, connection URLs) the resulting infrastructure exposes to consumers, and what
retention behavior applies on deletion.

OpenChoreo also provides **ClusterResourceType**, a cluster-scoped variant that is available across all namespaces.
Use ClusterResourceType for templates intended to be shared platform-wide and namespace-scoped ResourceType for
templates that are only relevant to a single namespace.

ResourceTypes use the same schema-driven approach as ComponentTypes, with two schemas:

**Parameters** capture developer-supplied values that become part of the immutable ResourceRelease snapshot—engine
version pin, schema name, replica count, anything that should stay identical across environments for a given release.
The schema is `openAPIV3Schema` with support for defaults, enums, validation, and CEL-based rules.

**EnvironmentConfigs** capture per-environment overrides applied through ResourceReleaseBinding's
`resourceTypeEnvironmentConfigs`—storage size, request limits, dev-only admin UI toggles. The same ResourceRelease
deployed to dev and prod uses different environment overrides while the snapshot itself is unchanged.

A ResourceType defines two further sections:

**Resources** are the Kubernetes manifest templates the provisioner emits on the data plane—StatefulSets, Services,
Secrets, or third-party CRs like Crossplane claims. Each entry has a unique `id`, an optional `includeWhen` CEL
expression for conditional rendering, the manifest template, and an optional `readyWhen` CEL expression for per-Kind
health beyond the default heuristic. Templates have access to `metadata.*`, `parameters.*`, `environmentConfigs.*`,
and `dataplane.*` through the same CEL surface ComponentTypes use.

**Outputs** declare the named values that consuming workloads bind to environment variables and file mounts. Each
output is one of three source kinds: a literal or CEL-rendered `value`, a `secretKeyRef` to a data-plane Secret, or a
`configMapKeyRef` to a data-plane ConfigMap. Output CEL has access to the same context as the resource templates plus
`applied.<id>.status.*` for reading fields populated by the provisioner. Sensitive material—passwords, tokens, private
keys—is declared with `secretKeyRef`; only the `{name, key}` reference transits to the control plane while the
underlying credential never leaves the data plane.

The **`retainPolicy`** field on a ResourceType sets the default retention behavior for bindings of that type. The
default is `Delete`. Platform engineers opt into `Retain` for templates that emit non-recoverable state (production
databases, persistent volumes), and individual environments can still override the policy through the binding.

## Project Types

A **ProjectType** is a platform engineer-defined template for project-scoped infrastructure. Where ComponentTypes
describe how a code component is deployed and ResourceTypes describe how managed infrastructure is provisioned,
ProjectTypes describe what every project of that type gets in each environment: the data-plane namespace itself and
the shared resources seeded into it, such as default-deny NetworkPolicies, ResourceQuotas, baseline RBAC, and
ImagePullSecrets. This gives infrastructure that is scoped to a project and environment pair a proper home, instead of
being carried by whichever component's template happened to include it.

OpenChoreo also provides **ClusterProjectType**, a cluster-scoped variant available to projects in all namespaces. The
platform ships a minimal `default` ClusterProjectType that provisions only the namespace; projects created through the
API or the Backstage UI reference it unless another type is chosen.

ProjectTypes use the same schema-driven approach as ComponentTypes and ResourceTypes. **Parameters** capture
project-level values supplied on the Project and frozen into each ProjectRelease snapshot. **EnvironmentConfigs**
capture per-environment values supplied through ProjectReleaseBinding, so the same release can apply different quotas
or policies in each environment. CEL-based **validation rules** enforce invariants across both during rendering.

Every ProjectType must include a `v1/Namespace` entry in its resource templates whose name is the platform-computed
namespace placeholder. This mandate is what makes namespace ownership explicit: the namespace exists because the
project was deployed to the environment, with a lifecycle independent of any individual component.

When a Project references a ProjectType, the Project controller cuts an immutable **ProjectRelease** capturing the
type's spec and the project's parameters at that point in time. Later edits to the ProjectType never affect releases
that were already cut; they produce a new release that environments adopt through promotion.

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
Component workflows carry the label `openchoreo.dev/workflow-type: "component"`, which identifies the workflow
as component-scoped and is used by developer tooling (e.g., `occ`) for categorization. To enable auto-build via
Git webhooks and UI integration, the Workflow's `openAPIV3Schema` uses vendor extensions
(e.g., `x-openchoreo-component-parameter-repository-url: true`, `x-openchoreo-component-parameter-repository-branch: true`)
to map schema fields to logical parameter keys. Component workflows must also be listed in a ComponentType's
`allowedWorkflows` field to be available for components.

ComponentTypes govern which Workflows developers can use through the `allowedWorkflows` field. This enables platform
engineers to enforce build standards per component type, ensuring that web applications use approved frontend build
tools, backend services use appropriate security scanners, and different component types follow their specific build
requirements.

Components reference Workflows in their `workflow` field, providing parameter values for build configuration. The
platform handles template rendering, external reference resolution, secret synchronization, and execution management
in the workflow plane, with WorkflowRun resources tracking individual executions.
