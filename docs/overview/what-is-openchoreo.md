---
layout: docs
title: What is OpenChoreo
---

# What is OpenChoreo?

OpenChoreo is an open-source Internal Developer Platform (IDP) that transforms how platform engineers build and manage cloud-native infrastructure. By providing developer-friendly abstractions over complex Kubernetes and cloud-native technologies, OpenChoreo enables teams to focus on business logic while ensuring production-ready deployments.

## The Challenge

Modern cloud-native development presents significant challenges:

- **Complexity Overload**: Developers must understand Kubernetes, service meshes, observability tools, security policies, and more
- **Configuration Sprawl**: Managing YAML files, Helm charts, and infrastructure configurations across environments
- **Platform Fragmentation**: Different teams reinventing platform capabilities
- **Developer Productivity**: Time spent on infrastructure instead of features
- **Operational Burden**: Platform teams struggling to provide self-service capabilities

## The OpenChoreo Solution

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
- Monitoring and observability setup
- Scaling and resource management

###  **Platform Abstractions**
Organize and manage infrastructure through logical concepts:

- **Organizations**: Multi-tenant resource isolation
- **Data Planes**: Kubernetes cluster lifecycle management
- **Environments**: Development, staging, production contexts
- **Deployment Pipelines**: Automated promotion workflows

###  **Security by Default**
Built-in security that doesn't require deep expertise:

- **Cell-based Architecture**: Automatic network isolation
- **mTLS Everywhere**: Encrypted service-to-service communication
- **Policy Enforcement**: Declarative security and compliance rules
- **Zero-Trust Networking**: Identity-based access controls

###  **Production Ready**
Enterprise-grade capabilities from day one:

- **High Availability**: Multi-region, multi-cluster deployments
- **Observability**: Integrated monitoring, logging, and tracing
- **GitOps**: Infrastructure as code with audit trails
- **Disaster Recovery**: Automated backup and restore capabilities

## Key Benefits

### For Developers
- **Faster Time to Market**: Deploy applications in minutes, not days
- **Reduced Cognitive Load**: Focus on business logic, not infrastructure
- **Consistent Environments**: Identical configurations across dev/staging/prod
- **Self-Service Capabilities**: Deploy and manage applications independently

### For Platform Engineers
- **Standardization**: Consistent patterns across all applications
- **Governance**: Automated policy enforcement and compliance
- **Efficiency**: Reduce toil through automation and abstraction
- **Extensibility**: Customize and extend platform capabilities

### For Organizations
- **Developer Productivity**: 10x faster deployment cycles
- **Operational Excellence**: Reduced incidents and faster recovery
- **Cost Optimization**: Efficient resource utilization and scaling
- **Security Posture**: Built-in security best practices

## Architecture Philosophy

OpenChoreo is built on several key architectural principles:

### **Declarative Everything**
All platform state is declared through YAML configurations, enabling:
- Version control and audit trails
- Reproducible environments
- Automated reconciliation
- GitOps workflows

### **Kubernetes Native**
Built as a set of Kubernetes operators that:
- Extend the Kubernetes API
- Follow cloud-native patterns
- Integrate with the CNCF ecosystem
- Provide familiar operational models

### **Composable Platform**
Modular architecture allows organizations to:
- Adopt incrementally
- Customize components
- Integrate existing tools
- Evolve platform capabilities

### **Open Source First**
Community-driven development ensures:
- Transparency and trust
- Vendor neutrality
- Extensibility and customization
- Collaborative innovation

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
- **Jaeger**: Distributed tracing

### **Data Management**
- **Operators**: Database and service lifecycle management
- **Velero**: Backup and disaster recovery
- **External Secrets**: Secure secrets management

## Getting Started

OpenChoreo is designed for gradual adoption:

1. **Start Small**: Deploy a simple web service
2. **Add Complexity**: Introduce databases and external dependencies
3. **Scale Up**: Multi-environment and multi-service applications
4. **Go Advanced**: Custom policies and enterprise features

## Community and Ecosystem

OpenChoreo thrives through community collaboration:

- **Open Development**: All development happens in the open
- **Community Driven**: Features prioritized by community needs
- **Extensible**: Plugin architecture for custom capabilities
- **Integrations**: Works with existing tools and workflows

## Use Cases

OpenChoreo excels in various scenarios:

### **Startup to Scale**
Provide enterprise-grade infrastructure from day one without the complexity

### **Enterprise Migration**
Modernize legacy applications with cloud-native patterns

### **Multi-Team Organizations**
Standardize development practices across diverse engineering teams

### **Compliance-Heavy Industries**
Built-in governance and security for regulated environments

Ready to transform your development experience? [Get started with OpenChoreo](/docs/getting-started/) and see how an Internal Developer Platform can revolutionize your cloud-native journey.