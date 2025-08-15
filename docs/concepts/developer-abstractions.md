---
layout: docs
title: Developer Abstractions
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

Components provide the connection between source code and running applications. They define how code is built, what
resources it requires, and how it should be deployed. This abstraction allows developers to focus on application logic
while the platform handles the complexities of containerization, orchestration, and lifecycle management.

## Component Types

OpenChoreo provides specialized component types that represent common application patterns, each with its own
operational characteristics and platform integrations.

### Service

A **Service** component represents backend applications that expose APIs or handle business logic. Services are the
workhorses of cloud-native applications, processing requests, managing data, and integrating with other systems. The
platform understands that services need stable network identities, load balancing, and API management capabilities.

Services can expose multiple protocols including HTTP, gRPC, and TCP, with the platform handling the appropriate 
routing and load balancing for each protocol type.

### WebApplication

A **WebApplication** component represents frontend applications that serve user interfaces. These might be single-page
applications, server-side rendered websites, or static content. The platform recognizes that web applications have
different operational requirements than backend services and provides appropriate deployment patterns through the 
WebApplicationClass.

### ScheduledTask

A **ScheduledTask** component represents batch jobs, cron jobs, and other time-based workloads. Unlike continuously
running services, scheduled tasks execute at specific times or intervals, complete their work, and terminate. 
ScheduledTasks are configured with cron expressions to define when they should run, and the platform handles the 
scheduling through the ScheduledTaskClass and Kubernetes CronJob resources.

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

## Build

A **Build** represents the process of transforming source code into deployable artifacts. It captures the build
configuration, tracks build execution, and manages the resulting container images. The build abstraction provides a
consistent interface for different build strategies while handling the complexities of secure, reproducible builds.

Builds in OpenChoreo are first-class resources that can be monitored, audited, and managed independently of deployments.
This separation enables practices like building once and deploying many times, pre-building images for faster
deployments, and maintaining clear traceability from source code to running containers.

The platform supports multiple build strategies to accommodate different technology stacks and organizational
preferences. Whether using Cloud Native Buildpacks for automatic, opinionated builds or custom Dockerfiles for complete
control, the build abstraction provides a consistent operational model.
