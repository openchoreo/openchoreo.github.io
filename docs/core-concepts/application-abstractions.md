---
layout: docs
title: Application Abstractions
---

# Application Abstractions

## Projects as Bounded Contexts (DDD alignment)

Projects represent bounded contexts in Domain-Driven Design, encapsulating related functionality and maintaining clear boundaries between different business domains.

## Components & Component Types (services, workers, scheduled tasks)

Components are deployable units within a project that can take various forms:
- **Services**: HTTP-based APIs and web applications
- **Workers**: Background processing components
- **Scheduled Tasks**: Time-based automated workflows

## Endpoints & Visibility Scopes (public, organization, project-level access)

Endpoints define network-accessible interfaces with configurable visibility:
- **Public**: Accessible from the internet
- **Organization**: Limited to organization members
- **Project-level**: Restricted to project scope

## Connections & Service Dependencies (explicit relationship modeling)

Connections model explicit dependencies between components, ensuring clear service relationships and enabling proper security policies and observability.