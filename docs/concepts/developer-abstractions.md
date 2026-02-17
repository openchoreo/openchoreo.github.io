---
title: Developer Abstractions
description: Developer abstractions for building and running applications
---

# Developer Abstractions

Developer abstractions in OpenChoreo enable teams to build, deploy, and operate cloud-native applications without
managing infrastructure complexity. These abstractions provide a declarative model for expressing application
architecture, dependencies, and operational requirements while the platform handles the underlying Kubernetes resources,
networking, and security configurations automatically.

## Project

A **Project** represents a bounded context in Domain-Driven Design terms - a cohesive collection of components that
together implement a specific business capability or application domain. It serves as the primary organizational unit
for developers, defining clear boundaries for code ownership, deployment coordination, and operational responsibility.

Projects establish both logical and physical boundaries in the platform. Logically, they group related components that
share common business logic, data models, and team ownership. Physically, they translate into isolated deployment units
with dedicated namespaces, network boundaries, and security policies. This alignment between organizational structure
and technical architecture enables teams to work autonomously while maintaining clear integration points with other
projects.

The project boundary also defines the scope for internal communication and shared resources. Components within a project
can communicate freely with each other. This locality principle reduces complexity for
developers while maintaining security and isolation between different application domains.

## Component

A **Component** represents a deployable unit of software - the fundamental building block of applications in OpenChoreo.
Each component encapsulates a specific piece of functionality, whether it's a microservice handling business logic, a
web application serving user interfaces, or a background job processing data.

Components use a **ComponentType** reference to determine their deployment characteristics. This reference is a structured
object with `kind` and `name` fields, where `kind` specifies the resource type (`ComponentType` or `ClusterComponentType`,
defaulting to `ComponentType`) and `name` follows the `{workloadType}/{componentTypeName}` format, such as
`deployment/web-service` or `cronjob/data-processor`. This explicit typing allows platform engineers to define multiple
variations of deployment patterns for the same workload type, each tuned for different use cases.

The Component resource connects four essential elements:

**ComponentType Reference** specifies which platform-defined template governs this component's deployment. The
ComponentType defines the available configuration schema, resource templates, and allowed workflows. This separation
of concerns means developers work with a simplified interface while platform engineers maintain control over
infrastructure patterns.

**Parameters** provide the component-specific configuration values that conform to the schema defined in the
ComponentType. When a ComponentRelease is created, these parameter values are captured in the release snapshot. The
same values then apply wherever that release is deployed—if you deploy the same ComponentRelease to dev, staging, and
prod, the parameters are identical across all environments. To change parameter values, you update the Component and
create a new ComponentRelease. Environment-specific values (like resource limits or storage sizes) are handled
separately through `envOverrides` in ReleaseBinding resources.

**Traits** enable composition of additional capabilities into the component. Each trait instance adds specific
functionality like persistent storage, caching, or monitoring. Traits can be instantiated multiple times with
different configurations using unique instance names. For example, a component might attach multiple persistent volume
traits for different storage needs, each with its own size, storage class, and mount configuration. Traits use the
same schema-driven approach as ComponentTypes, with parameters set in the Component and environment-specific overrides
applied through ReleaseBinding resources.

**Workflow Configuration** optionally specifies how to build the component from source code. This references a
Workflow and provides the developer-configured schema values needed to execute builds. The workflow integration
enables automated container image creation triggered by code changes or manual developer actions.

The component abstraction thus becomes a declarative specification that combines:
- A ComponentType that defines *how* to deploy
- Parameters that configure *what* to deploy
- Traits that compose *additional capabilities*
- A Workflow that defines *how to build*

This composition-based approach enables developers to assemble complex applications from reusable building blocks
while the platform ensures consistency, governance, and operational best practices through the underlying ComponentType
and Trait templates.

## Workload

A **Workload** defines the runtime contract of a component - specifying what the component needs to run. The workload 
focuses on application requirements rather than infrastructure details, which are handled by the platform through Classes.

Each component has one workload that describes its runtime needs through several key specifications:

**Containers** define the container images to deploy, along with their commands, arguments, and environment variables. 
This tells the platform what code to run and how to configure it.

**Endpoints** specify the network interfaces that the component exposes - the ports and protocols it listens on. Each 
endpoint declares its type (HTTP, gRPC, TCP, etc.) and port number. These definitions tell the platform what network 
services the component provides, enabling automatic service creation and network policy generation.

**Connections** declare the component's dependencies on other services, whether internal to the platform or external 
third-party services. Each connection specifies how to inject service information into the component through environment 
variables. This enables the platform to manage service discovery, configure network policies, and track dependencies.

This declarative specification can be generated from configuration files in the source repository or applied directly 
to the cluster. The separation between workload (what the application needs) and classes (how the platform provides it) 
enables platform teams to control infrastructure policies while developers focus on application requirements. Resource 
limits, scaling parameters, and operational policies come from the ServiceClass or WebApplicationClass, while the 
workload simply declares what the application needs to function.

## ComponentWorkflowRun

A **ComponentWorkflowRun** represents a runtime execution instance of a ComponentWorkflow - a specialized workflow type
designed specifically for building components. While ComponentWorkflows define the build template and schema,
ComponentWorkflowRuns represent actual build executions with specific parameter values and ownership tracking.

ComponentWorkflowRuns bridge the gap between developer intent and CI/CD execution for component builds. Developers
create ComponentWorkflowRun resources to trigger builds, providing component ownership information, repository details,
and build parameters. The platform handles all the complexity of rendering the final workflow specification,
synchronizing secrets, and managing execution in the build plane.

Each ComponentWorkflowRun captures three essential pieces of information:

**Ownership Tracking** links the build execution to a specific component and project. This enables traceability,
allowing the platform to track which builds belong to which components and maintain build history per component. The
ownership information includes both project name and component name, ensuring proper audit trails and enabling
component-specific build operations.

**System Parameters** provide the structured repository information required for build-specific platform features. These
parameters follow a fixed structure with `repository.url`, `repository.revision.branch`, `repository.revision.commit`,
and `repository.appPath` fields. This predictable structure enables the platform to support auto-builds triggered by
webhooks, manual build actions in the UI, build traceability linking images to source commits, and monorepo support by
identifying specific application paths within repositories.

**Developer Parameters** provide values for the flexible configuration schema defined by the platform engineer in the
ComponentWorkflow. These might include build version numbers, test modes, resource allocations, timeout settings,
caching configurations, and retry limits. The schema validation ensures type correctness and constraint satisfaction
automatically.

This abstraction provides a specialized interface for component builds, where developers interact with curated schemas
rather than complex CI/CD pipeline definitions. The separation of concerns allows platform engineers to control build
implementation and security policies through ComponentWorkflow templates while developers manage repository information
and build parameters through ComponentWorkflowRun instances. ComponentWorkflowRuns can be created manually for ad-hoc
builds or automatically by platform controllers in response to code changes, supporting both interactive development and
fully automated CI/CD pipelines while maintaining consistent execution patterns and governance specifically tailored for
component build operations.
