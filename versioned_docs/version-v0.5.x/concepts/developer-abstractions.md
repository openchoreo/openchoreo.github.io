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

Components use a **ComponentType** reference to determine their deployment characteristics. This reference follows the
format `{workloadType}/{componentTypeName}`, such as `deployment/web-service` or `cronjob/data-processor`. This explicit
typing allows platform engineers to define multiple variations of deployment patterns for the same workload type, each
tuned for different use cases.

The Component resource connects four essential elements:

**ComponentType Reference** specifies which platform-defined template governs this component's deployment. The
ComponentType defines the available configuration schema, resource templates, and allowed workflows. This separation
of concerns means developers work with a simplified interface while platform engineers maintain control over
infrastructure patterns.

**Parameters** provide the component-specific configuration values that conform to the schema defined in the
ComponentType. These values include both static parameters that remain consistent across environments and
environment-overridable parameters that can be customized per environment through ComponentDeployment resources. The
inline schema syntax from the ComponentType validates these values automatically, ensuring developers provide correct
types and stay within defined constraints.

**Traits** enable composition of additional capabilities into the component. Each trait instance adds specific
functionality like persistent storage, caching, or monitoring. Traits can be instantiated multiple times with
different configurations using unique instance names. For example, a component might attach multiple persistent volume
traits for different storage needs, each with its own size, storage class, and mount configuration. Traits use the
same schema-driven approach as ComponentTypes, with parameters and environment overrides that can be customized through
ComponentDeployment resources.

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

## WorkflowRun

A **WorkflowRun** represents a runtime execution instance of a Workflow. While Workflows define the template and schema
for what can be executed, WorkflowRuns represent actual executions with specific parameter values and context.

WorkflowRuns bridge the gap between developer intent and CI/CD execution. Developers create WorkflowRun resources to
trigger workflows, providing only the schema values defined in the Workflow template. The platform handles all the
complexity of rendering the final workflow specification, synchronizing secrets, and managing execution in the build
plane.

Each WorkflowRun captures two essential pieces of information:

**Workflow Configuration** references the Workflow template to use and provides the developer-configured schema values.
These values conform to the schema defined in the referenced Workflow, with automatic validation ensuring type
correctness and constraint satisfaction. For example, a Docker build workflow might receive repository URL, branch
name, and Dockerfile path, while a buildpack workflow might receive additional configuration for build resources,
caching, and testing modes.

This abstraction provides a simplified interface where developers interact with curated schemas rather than complex
CI/CD pipeline definitions, while creating permanent audit trails essential for compliance and debugging. The separation
of concerns allows platform engineers to control workflow implementation and security policies through Workflow templates
while developers manage application-specific parameters through WorkflowRun schema values. For component-bound workflows,
automatic linkage between builds and components enables coordinated build and deployment lifecycles. WorkflowRuns can be
created manually for ad-hoc builds or automatically by platform controllers in response to code changes, supporting both
interactive development and fully automated CI/CD pipelines while maintaining consistent execution patterns and governance.
