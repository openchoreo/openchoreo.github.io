---
layout: docs
title: Runtime Abstractions
---

# Runtime Abstractions

## Cells (runtime project boundaries and security isolation)

Cells provide runtime reification of projects with strong security boundaries, ensuring complete isolation between different project workloads through network policies and resource controls.

## Traffic Management Patterns (North/South/East/West ingress/egress)

Traffic management encompasses all communication patterns:
- **North/South**: External traffic entering and leaving the cluster
- **East/West**: Internal service-to-service communication
- **Ingress/Egress**: Controlled routing with security policies and observability

## Built-in Service Catalog & Discovery

The service catalog automatically registers APIs, events, and data streams with metadata, enabling:
- Automatic service discovery
- Governance and compliance tracking
- Simplified service reuse across projects