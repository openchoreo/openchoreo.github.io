---
layout: docs
title: OpenChoreo Philosophy
---

# OpenChoreo Philosophy

## The conceptual model and philosophy behind the abstractions

OpenChoreo is built on the principle that platform abstractions should reflect how developers and platform engineers naturally think about applications and infrastructure. Rather than forcing users to understand the intricate details of Kubernetes, OpenChoreo provides higher-level concepts that map to business and operational realities.

## Domain-driven abstractions

The platform embraces Domain-Driven Design principles by organizing abstractions around business domains and operational concerns:

- **Business alignment**: Projects represent bounded contexts that align with business domains
- **Clear boundaries**: Each abstraction has well-defined responsibilities and interfaces  
- **Explicit relationships**: Dependencies and connections are modeled explicitly rather than implied
- **Separation of concerns**: Platform operations are separated from application development

## Why not just Kubernetes YAML?

While Kubernetes provides powerful primitives, raw YAML manifests present several challenges:

- **Cognitive overhead**: Developers must understand complex Kubernetes concepts to deploy simple applications
- **Inconsistent patterns**: Teams often reinvent solutions for common problems like service-to-service communication
- **Security gaps**: Default Kubernetes configurations often lack proper security boundaries
- **Operational complexity**: Managing observability, networking, and governance requires extensive manual configuration

OpenChoreo abstracts these complexities while maintaining the full power of Kubernetes underneath, providing opinionated solutions for common patterns while preserving flexibility for advanced use cases.