---
layout: docs
title: Application Abstractions
---
## OpenChoreo Concepts

At its core, OpenChoreo provides a control plane that sits on top of one or more Kubernetes clusters, turning them into a cohesive internal developer platform.

OpenChoreo introduces a combination of platform abstractions and application abstractions, enabling platform engineers to define standards and enforce policies while giving developers a simplified, self-service experience.

### Platform Abstractions

Platform engineers use the following abstractions to create their internal developer platform:

- **Organization**
  - A logical grouping of users and resources, typically aligned to a company, business unit, or team, enabling multi-tenancy and access control at scale.
- **Data Plane**
  - A Kubernetes cluster to host one or more of your deployment environments, providing the compute infrastructure where applications run.
- **Environment**
  - A runtime context such as development, staging, and production, each with their own configurations and policies where workloads are deployed and executed.
- **Deployment Pipeline**
  - A defined process that governs how workloads are promoted across different environments, automating testing, approval, and deployment workflows.

### Application Abstractions

Project managers, architects, and developers use the following abstractions to manage the organization of their work:

These abstractions align with the Domain-Driven Design principles, where projects represent bounded contexts and components represent the individual services or workloads within a domain. Developers use these abstractions to describe the structure and intent of the application in a declarative manner without having to deal with runtime infrastructure details.

- **Project**
  - A cloud-native application composed of multiple components. Serves as the unit of isolation.
  - Maps to a set of Namespaces (one per Environment) in one or more Data planes.
- **Component**
  - A deployable unit within a project, such as a web service, API, worker, or scheduled task.
  - Maps to workload resources like Deployment, Job, or StatefulSet.
- **Endpoint**
  - A network-accessible interface exposed by a component, including routing rules, supported protocols, and visibility scopes (e.g., public, organization, project).
  - Maps to HTTPRoute (for HTTP), Service resources, and routes via shared ingress gateways. Visibility is enforced via Cilium network policies.
- **Connection**
  - An outbound service dependency defined by a component, targeting either other components or external systems.
  - Maps to Cilium network policies and is routed through egress gateways.

### Runtime Abstractions

Architects and developers use the following runtime abstractions to manage how components and projects operate at runtime:

At runtime, OpenChoreo turns each Project (Bounded Context) into a Cell - a secure, isolated, and observable unit that enforces domain boundaries through infrastructure.

- **Cell**
  - A Cell is the runtime reification of a single project in OpenChoreo. It encapsulates all components of a project and controls how they communicate internally and externally through well-defined ingress and egress paths.
  - Communication between components in the same cell is permitted without interception.
  - Cilium and eBPF are used to enforce fine-grained network policies across all ingress and egress paths.
- **Northbound Ingress**
  - Routes incoming traffic from external (internet) sources into the cell.
  - Endpoints with `visibility: public` are exposed through this ingress path.
- **Southbound Egress**
  - Handles outbound Internet access from components in the Cell. Connections to external services are routed through this egress path.
- **Westbound Ingress**
  - Handles traffic entering the Cell from within the organization, be it from another cell or just from the internal network.
  - Endpoints with `visibility: organization` are exposed through this ingress path.
- **Eastbound Egress**
  - Handles outbound traffic to other cells or to the internal network.
