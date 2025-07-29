---
layout: docs
title: What is OpenChoreo
---

# What is OpenChoreo?

OpenChoreo is a complete, open-source Internal Developer Platform (IDP) designed for platform engineering (PE) teams who want to streamline developer workflows and deliver Internal Developer Portals without having to build everything from scratch. Choreo orchestrates many CNCF and other projects to give a comprehensive framework for PE teams to build the platform they want.

## The Challenge

Kubernetes gives you powerful primitives like Namespaces, Deployments, CronJobs, Services and NetworkPolicies—but they are too low-level for most developers.

Platform engineers are left to build the actual platform: defining higher-level abstractions and wiring together tools for engineering, delivery, security and visibility.

Modern cloud-native development presents significant challenges:

- **Complexity Overload**: Developers must understand Kubernetes, service meshes, observability tools, security policies, and more
- **Configuration Sprawl**: Managing YAML files, Helm charts, and infrastructure configurations across environments
- **Platform Fragmentation**: Different teams reinventing platform capabilities
- **Developer Productivity**: Time spent on infrastructure instead of features
- **Operational Burden**: Platform teams struggling to provide self-service capabilities

## The OpenChoreo Solution

OpenChoreo fills that gap and provides all the essential building blocks of an IDP, including CI, GitOps, observability, RBAC and analytics.

With OpenChoreo, we are bringing the best ideas of [WSO2 Choreo](https://choreo.dev) (an IDP as a Service) to the open-source community. WSO2 Choreo is designed not just to automate software delivery workflows, but to support engineering best practices: enforcing architecture standards, promoting service reuse, and integrating API management and observability.

OpenChoreo addresses these challenges through a comprehensive platform approach:

### **Developer-Centric Abstractions**
Transform complex infrastructure into simple, declarative specifications:

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

This simple definition automatically generates:
- Kubernetes Deployments and Services
- Network policies and security configurations
- Monitoring and observability integration points for this specific artifact
- Scaling and resource management

###  **Platform Abstractions**
Organize and manage infrastructure through logical concepts:

- **Organizations**: Multi-tenant resource isolation
- **Data Planes**: Kubernetes cluster lifecycle management
- **Environments**: Development, staging, production contexts
- **Deployment Pipelines**: Automated promotion workflows across environments

###  **Security by Default**
Built-in security that doesn't require deep expertise:

- **Cell-based Architecture**: Automatic network isolation
- **mTLS Everywhere**: Encrypted service-to-service communication
- **Policy Enforcement**: Declarative security and compliance rules
- **Zero-Trust Networking**: Identity-based access controls

###  **Production Ready**
Enterprise-grade capabilities from day one:

- **High Availability**: Multi-cluster deployments
- **Observability**: Integrated monitoring, logging, and tracing
- **GitOps**: Infrastructure as code with audit trails

## Key Benefits

These abstractions provide the following benefits for businesses to build & operate cloud-native applications:

### **Design clarity for cloud-native applications**
OpenChoreo's abstractions—Projects, Components, Endpoints, and Connections—enable teams to model systems around business domains. These abstractions align with Domain-Driven Design (DDD) and promote modular, independently deployable services with explicit service boundaries.

### **A developer experience that hides the infrastructure**
Developers define application intent (e.g., deploy a component, expose an endpoint, connect to another service) through high-level abstractions. OpenChoreo compiles this model into the necessary Kubernetes resources, network policies, gateways, and observability hooks.

### **Built-in ingress and egress API management**
OpenChoreo manages ingress and egress for all Components based on endpoint visibility (public, organization, or project). APIs are exposed through Envoy gateways with built-in support for routing, rate limiting, authentication, and traffic policies — without requiring manual configuration.

### **Zero trust security by default**
Each Cell acts as a security boundary where communication between components is explicitly declared and enforced. Internal and external traffic is governed by Cilium network policies and routed through Envoy gateways. All traffic, including intra-cell communication, is encrypted using mTLS. No implicit trust is granted — every access is authenticated, authorized, and policy-checked.

### **Observability by default**
Each Cell is instrumented for logging, metrics, and distributed tracing. Observability spans all ingress/egress gateways and component-to-component communication, with no additional configuration required. Collected data can be integrated into existing monitoring and analysis pipelines.

### **Developer and platform separation of concerns**
The platform team defines the rules (networking, security, observability, and operational policies). Application teams work within those boundaries by modeling their systems using OpenChoreo abstractions. This separation ensures consistency, security, and operational reliability at scale.

## Architecture Philosophy

OpenChoreo is built on key architectural principles that ensure reliability, flexibility, and ease of adoption.

**Declarative Everything**: All platform state is declared through YAML configurations, enabling version control, reproducible environments, automated reconciliation, and GitOps workflows.

**Kubernetes Native**: Built as Kubernetes operators that extend the API, follow cloud-native patterns, integrate with CNCF ecosystem, and provide familiar operational models.

**Composable Platform**: Modular architecture allows incremental adoption, component customization, existing tool integration, and platform capability evolution.

**Open Source First**: Community-driven development ensures transparency, vendor neutrality, extensibility, and collaborative innovation.

## Technology Stack

OpenChoreo orchestrates best-in-class CNCF tools:

### **Container Platform**
- **Kubernetes**: Orchestration foundation
- **Cilium**: Networking and security with eBPF
- **Envoy Gateway**: API gateway and traffic management

### **Developer Experience**
- **Buildpacks**: Source-to-image transformation
- **Argo Workflows**: Build and deployment pipelines
- **ArgoCD/Flux**: GitOps deployment automation

### **Observability**
- **Prometheus/Thanos**: Metrics collection and storage
- **OpenSearch**: Centralized logging and search

## Getting Started

The easiest way to try OpenChoreo is by following the **[Quick Start Guide](/docs/getting-started/quick-start-guide.md)**. It walks you through setting up Choreo using a Dev Container, so you can start experimenting without affecting your local environment.

For a deeper understanding of OpenChoreo’s architecture, see **[Choreo Concepts](/docs/core-concepts/)**.

Visit **[Installation Guide](/docs/getting-started/install-in-your-cluster.md)** to learn more about installation methods.

## Community and Ecosystem

OpenChoreo thrives through community collaboration:

- **Open Development**: All development happens in the open
- **Community Driven**: Features prioritized by community needs
- **Extensible**: Plugin architecture for custom capabilities
- **Integrations**: Works with existing tools and workflows


Ready to transform your development experience? [Get started with OpenChoreo](/docs/getting-started/) and see how an Internal Developer Platform can revolutionize your cloud-native journey.
