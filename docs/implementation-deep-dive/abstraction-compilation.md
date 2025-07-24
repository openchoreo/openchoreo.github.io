---
layout: docs
title: Abstraction Compilation
---

# Abstraction Compilation

OpenChoreo transforms high-level developer abstractions into native Kubernetes resources through a sophisticated compilation process. This section explores how YAML-based developer definitions are mapped to production-ready Kubernetes manifests.

## YAML to Kubernetes Resource Mapping

### Component Compilation
When developers define a component using OpenChoreo's abstractions, the system performs multi-stage compilation:

1. **Semantic Analysis**: Validates component definitions against OpenChoreo's schema
2. **Resource Generation**: Maps abstract concepts to concrete Kubernetes resources
3. **Policy Injection**: Applies security and operational policies automatically
4. **Template Expansion**: Generates complete manifests with all required configurations

### Abstraction Layers

#### Developer Layer
```yaml
apiVersion: choreo.dev/v1
kind: Component
metadata:
  name: user-service
spec:
  type: service
  runtime: go
  endpoints:
    - name: api
      port: 8080
      path: /api/v1
```

#### Generated Kubernetes Resources
The above component definition compiles to multiple Kubernetes resources:
- Deployment with security contexts and resource limits
- Service with appropriate selectors and ports
- NetworkPolicy for traffic isolation
- ServiceMonitor for observability
- HorizontalPodAutoscaler for scaling

### Compilation Pipeline

The compilation process follows a predictable pipeline:

1. **Input Validation**: Ensures YAML conforms to OpenChoreo schemas
2. **Dependency Resolution**: Identifies component relationships and dependencies
3. **Resource Template Selection**: Chooses appropriate templates based on component type
4. **Configuration Injection**: Adds platform-specific configurations
5. **Output Generation**: Produces final Kubernetes manifests

## Template System

OpenChoreo uses a sophisticated template system that:
- Maintains separation between developer intent and infrastructure concerns
- Ensures consistent security and operational patterns
- Allows platform teams to evolve infrastructure without breaking applications
- Provides escape hatches for advanced use cases

## Validation and Testing

The compilation process includes multiple validation stages:
- Schema validation for input YAML
- Resource validation for generated Kubernetes manifests
- Policy compliance checking
- Integration testing with dry-run capabilities