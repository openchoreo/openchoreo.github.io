---
layout: docs
title: Architecture
---

# OpenChoreo Architecture

OpenChoreo's architecture is designed as a layered system that provides developer-friendly abstractions while maintaining the flexibility and power of cloud-native technologies. This section explores the system's architectural components, design principles, and how they work together to create a comprehensive Internal Developer Platform.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer Interface                      │
├─────────────────────────────────────────────────────────────┤
│  CLI Tools  │  Web Console  │  IDE Integrations  │  APIs   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Abstraction Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Component    │  Project     │  Environment │  Connection  │
│  Definitions  │  Management  │  Configs     │  Management  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Control Plane                            │
├─────────────────────────────────────────────────────────────┤
│  Project      │  Component   │  Environment │  Pipeline    │
│  Controller   │  Controller  │  Controller  │  Controller  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Data Plane                               │
├─────────────────────────────────────────────────────────────┤
│  Kubernetes Clusters │ Service Mesh │ Observability Stack │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Developer Interface Layer

The top layer provides multiple interfaces for developers to interact with the platform:

#### **Command Line Interface (CLI)**
- **choreo**: Primary CLI tool for all platform operations
- **Integration**: Works with existing development workflows
- **Authentication**: Secure token-based authentication
- **Offline Capabilities**: Local validation and development

#### **Web Console**
- **Visual Management**: Graphical interface for platform resources
- **Real-time Monitoring**: Live application and infrastructure status
- **Team Collaboration**: Multi-user access and role-based permissions
- **Audit Trails**: Complete history of platform changes

#### **API Gateway**
- **RESTful APIs**: Standard HTTP APIs for platform operations
- **GraphQL Support**: Flexible query interface for complex data
- **Webhook Integration**: Event-driven integrations with external systems
- **Rate Limiting**: Protection against abuse and resource exhaustion

### 2. Abstraction Layer

This layer transforms developer intent into platform-specific configurations:

#### **Component Abstractions**
```yaml
apiVersion: choreo.dev/v1
kind: Component
metadata:
  name: user-service
spec:
  type: service
  runtime: go
  source:
    git:
      repository: github.com/company/user-service
      branch: main
  build:
    buildpacks: true
  endpoints:
    - name: api
      port: 8080
      path: /api/v1
      visibility: public
  dependencies:
    - name: database
      type: postgres
    - name: redis
      type: redis
```

#### **Project Management**
- **Multi-Component Applications**: Logical grouping of related services
- **Dependency Management**: Automatic service discovery and connection
- **Configuration Management**: Environment-specific overrides
- **Version Management**: Coordinated deployments across components

#### **Environment Abstractions**
- **Environment Templates**: Reusable environment configurations
- **Resource Quotas**: Automatic resource allocation and limits
- **Network Policies**: Environment-specific network isolation
- **Access Controls**: Role-based access to environments

### 3. Control Plane

The control plane implements the business logic that translates abstractions into concrete infrastructure:

#### **Controller Architecture**
OpenChoreo uses the Kubernetes controller pattern with custom controllers for each abstraction:

```go
type ProjectController struct {
    client.Client
    Scheme *runtime.Scheme
    Log    logr.Logger
}

func (r *ProjectController) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    // Fetch the Project instance
    var project choreov1.Project
    if err := r.Get(ctx, req.NamespacedName, &project); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }
    
    // Implement reconciliation logic
    return r.reconcileProject(ctx, &project)
}
```

#### **Component Controller**
- **Deployment Generation**: Creates Kubernetes Deployments from component specs
- **Service Creation**: Exposes components through Kubernetes Services
- **Configuration Management**: Manages ConfigMaps and Secrets
- **Health Monitoring**: Implements health checks and readiness probes

#### **Environment Controller**
- **Namespace Management**: Creates and configures Kubernetes namespaces
- **RBAC Setup**: Implements role-based access control
- **Network Policy Creation**: Establishes network isolation boundaries
- **Resource Quota Management**: Enforces resource limits per environment

#### **Pipeline Controller**
- **Workflow Orchestration**: Manages build and deployment pipelines
- **Integration Testing**: Coordinates testing across environments
- **Promotion Logic**: Handles environment-to-environment promotions
- **Rollback Management**: Implements automated rollback capabilities

### 4. Data Plane

The data plane consists of the actual infrastructure where applications run:

#### **Kubernetes Clusters**
- **Multi-Cluster Support**: Manage applications across multiple clusters
- **Cluster Lifecycle**: Automated cluster provisioning and management
- **Node Management**: Automatic scaling and maintenance
- **Storage Integration**: Persistent volume management

#### **Service Mesh Integration**
```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: user-service
spec:
  hosts:
    - user-service
  http:
    - match:
        - uri:
            prefix: "/api/v1"
      route:
        - destination:
            host: user-service
            port:
              number: 8080
```

#### **Observability Stack**
- **Metrics Collection**: Prometheus for application and infrastructure metrics
- **Log Aggregation**: Centralized logging with OpenSearch
- **Distributed Tracing**: Request tracing across service boundaries
- **Alerting**: Automated alerting based on SLOs and error rates

## Design Principles

### **Separation of Concerns**

Each layer has distinct responsibilities:
- **Interface Layer**: User experience and API contracts
- **Abstraction Layer**: Business logic and policy enforcement
- **Control Plane**: Infrastructure orchestration and state management
- **Data Plane**: Runtime execution and resource management

### **Declarative Configuration**

All platform state is managed declaratively:
```yaml
apiVersion: choreo.dev/v1
kind: Project
metadata:
  name: e-commerce-platform
spec:
  description: "Complete e-commerce platform"
  components:
    - name: frontend
      source: ./frontend
    - name: api-gateway
      source: ./api-gateway
    - name: user-service
      source: ./services/user
    - name: product-service
      source: ./services/product
```

### **Event-Driven Architecture**

Components communicate through well-defined events:
- **Resource Events**: Kubernetes-native event system
- **Webhook Integration**: External system notifications
- **Audit Events**: Complete audit trail for compliance
- **Metric Events**: Performance and health monitoring

### **Extensibility**

The platform is designed for customization:
- **Custom Resource Definitions**: Extend platform abstractions
- **Webhook Plugins**: Custom validation and mutation logic
- **Controller Extensions**: Additional reconciliation logic
- **Integration APIs**: Connect with external systems

## Security Architecture

### **Multi-Tenant Isolation**

OpenChoreo provides strong isolation between tenants:

```yaml
apiVersion: choreo.dev/v1
kind: Organization
metadata:
  name: acme-corp
spec:
  isolation: strict
  networkPolicies:
    defaultDeny: true
    allowedCommunication:
      - internal
  resourceQuotas:
    cpu: "100"
    memory: "500Gi"
    storage: "1Ti"
```

### **Network Security**

- **Zero-Trust Networking**: All communication requires explicit authorization
- **mTLS by Default**: Encrypted service-to-service communication
- **Network Policies**: Kubernetes-native network isolation
- **Service Mesh Security**: Identity-based access control

### **Identity and Access Management**

- **RBAC Integration**: Kubernetes-native role-based access control
- **OIDC Support**: Integration with enterprise identity providers
- **Service Identities**: Automatic service account management
- **Audit Logging**: Complete access audit trails

## Scalability and Performance

### **Horizontal Scaling**

OpenChoreo is designed to scale horizontally:
- **Controller Replication**: Multiple controller instances for high availability
- **Load Balancing**: Distributed load across controller instances
- **Database Sharding**: Partition data across multiple databases
- **Cache Layers**: Reduce database load with intelligent caching

### **Performance Optimization**

- **Efficient Reconciliation**: Minimize unnecessary resource updates
- **Batch Operations**: Group related operations for efficiency
- **Asynchronous Processing**: Non-blocking operations where possible
- **Resource Caching**: Intelligent caching of Kubernetes resources

## Integration Architecture

### **CNCF Ecosystem Integration**

OpenChoreo integrates with key CNCF projects:

#### **Container Runtime**
- **containerd**: Primary container runtime
- **Kubernetes CRI**: Container runtime interface compliance
- **Image Registry**: Support for multiple registry types

#### **Networking**
- **Cilium**: Advanced networking with eBPF
- **Envoy**: Service proxy and load balancing
- **Gateway API**: Standard ingress and traffic management

#### **Storage**
- **CSI Drivers**: Support for multiple storage backends
- **Backup Integration**: Velero for disaster recovery
- **Database Operators**: Managed database services

#### **Observability**
- **OpenTelemetry**: Unified observability framework
- **Prometheus**: Metrics collection and alerting
- **Jaeger**: Distributed tracing
- **OpenSearch**: Log aggregation and search

## Deployment Patterns

### **Single Cluster Deployment**
Ideal for development and small-scale deployments:
```yaml
apiVersion: choreo.dev/v1
kind: DataPlane
metadata:
  name: development
spec:
  type: single-cluster
  kubernetes:
    version: "1.28"
    nodeGroups:
      - name: general
        instanceType: t3.medium
        minSize: 3
        maxSize: 10
```

### **Multi-Cluster Deployment**
Production-ready setup with geographic distribution:
```yaml
apiVersion: choreo.dev/v1
kind: DataPlane
metadata:
  name: production
spec:
  type: multi-cluster
  clusters:
    - name: us-west-2
      region: us-west-2
      primary: true
    - name: eu-west-1
      region: eu-west-1
      primary: false
```

### **Hybrid Cloud**
Support for multi-cloud and on-premises deployments:
```yaml
apiVersion: choreo.dev/v1
kind: DataPlane
metadata:
  name: hybrid
spec:
  type: hybrid
  clusters:
    - name: aws-production
      provider: aws
      region: us-west-2
    - name: on-premises
      provider: self-managed
      endpoint: https://k8s.company.com
```

The OpenChoreo architecture provides a solid foundation for building cloud-native applications at scale, while maintaining the flexibility to adapt to changing requirements and integrate with existing infrastructure investments.