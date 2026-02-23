---
title: Runtime Model
description: Runtime execution and deployment model
---

# Runtime Model

The runtime model describes how OpenChoreo's abstractions transform into running systems. When developers declare
projects and components, the platform orchestrates a sophisticated runtime environment that provides isolation,
security, and observability. Understanding this transformation from declaration to execution helps teams design better
applications and troubleshoot issues effectively.

## Cell Architecture

At runtime, each **Project** transforms into a **Cell** - a secure, isolated runtime boundary that encapsulates all
components of an application domain. This transformation represents a fundamental principle of OpenChoreo:
organizational boundaries in code become physical boundaries in infrastructure.

Cells provide complete isolation between different application domains. Each cell operates as an independent unit with
its own namespace, network policies, and security boundaries. Components within a cell can communicate freely using
cluster-local networking, but all communication across cell boundaries must flow through well-defined gateways. This
architecture ensures that failures, security breaches, or performance issues in one cell cannot directly impact others.

The cell model aligns with microservices best practices and Domain-Driven Design principles. By mapping bounded contexts
to isolated runtime units, OpenChoreo ensures that architectural boundaries are enforced by infrastructure. This
alignment reduces the cognitive load on developers - the same mental model used for designing applications applies to
their runtime behavior.

## Traffic Flow Patterns

OpenChoreo implements a structured approach to network traffic through directional gateways, each serving a specific
purpose in the overall communication architecture. These patterns provide clarity about how data flows through the
system while enabling sophisticated security and routing policies.

### Northbound Ingress

Northbound ingress handles traffic entering cells from the public internet. This gateway serves as the entry point for
external users, customers, and third-party integrations accessing public APIs and web applications. The platform
automatically configures load balancing and TLS termination at this boundary.

The northbound gateway translates friendly DNS names into internal service endpoints, handles HTTP routing based on
hostnames and paths, and enforces public-facing API policies. This abstraction means developers can focus on application
logic while the platform manages the complexities of internet-facing services.

### Southbound Egress

Southbound egress manages traffic leaving cells to reach external services on the internet. This gateway provides
controlled access to third-party APIs, cloud services, and external databases. By channeling all outbound traffic
through a managed gateway, the platform can enforce security policies, manage credentials, and provide observability for
external dependencies.

The southbound gateway enables capabilities like egress filtering to prevent data exfiltration, credential injection for
authenticated external services, and circuit breaking for unreliable external dependencies. This controlled approach to
external communication reduces security risks while improving reliability.

### Westbound Ingress

Westbound ingress handles traffic from other parts of the organization entering the cell. This gateway manages internal
API consumption, service-to-service communication across projects, and administrative access. Unlike public northbound
traffic, westbound traffic comes from trusted sources within the organization but still requires authentication and
authorization.

The westbound gateway enables internal service discovery, allowing components in other cells to locate and communicate
with services using logical names. It enforces organization-wide policies while allowing more permissive communication
than public interfaces. This balance enables productive development while maintaining security boundaries.

### Eastbound Egress

Eastbound egress manages traffic leaving the cell to reach other cells or internal services within the organization.
This gateway handles inter-project dependencies, shared service consumption, and platform service integration. By
managing internal outbound traffic, the platform can track dependencies, enforce quotas, and provide circuit breaking
between internal services.

The eastbound gateway makes internal service dependencies explicit and observable. Teams can understand which other
projects they depend on, platform engineers can track usage patterns across the organization, and the system can prevent
cascading failures through circuit breaking and retry policies.

## Network Security

OpenChoreo manages network security through the cell architecture and gateway pattern. Communication within a cell is 
allowed between components of the same project, while all cross-cell communication must flow through the defined 
gateways. This provides security boundaries between different application domains.

The platform uses Cilium for network policy enforcement and Kgateway for ingress traffic management. Developers
declare their components' endpoints and connections in the workload specification, and the platform handles the
underlying network configuration.

## Workload Execution

When components deploy to a runtime environment, OpenChoreo orchestrates a complex series of transformations. The
abstract component definition combines with workload specifications, environment configurations, and platform policies
to produce concrete Kubernetes resources.

The platform manages the complete lifecycle of these resources. It creates deployments with appropriate resource limits
and scaling parameters, configures services for network access and load balancing, injects configuration and secrets
from secure stores, and establishes health checks and readiness probes. This orchestration happens transparently -
developers see their components running while the platform manages the underlying complexity.

Workload execution is environment-aware. The same component might run with different resource allocations, replica
counts, or configuration values in different environments. The platform manages these variations through the binding
system, where environment-specific bindings override default values from classes and workload specifications.

## Service Discovery and Load Balancing

Service discovery uses standard Kubernetes DNS, allowing services to communicate using service names. Within a cell, 
components can discover each other using simple service names. Across cells, services require routing through the 
appropriate gateways.

## Observability

The runtime model includes centralized logging through the Observability Plane. Logs from all containers flow through 
the platform's collection pipeline using Fluentbit, enriched with metadata about the source component, project, and 
environment. This enrichment enables queries across the entire platform while maintaining clear attribution of log 
entries to their sources.

The Observer API provides access to these logs, allowing developers to search and analyze application behavior across 
environments. This centralized logging approach ensures that debugging information is always available without requiring 
additional configuration from developers.


