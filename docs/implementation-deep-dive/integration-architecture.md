---
layout: docs
title: Integration Architecture
---

# Integration Architecture

OpenChoreo serves as an orchestration layer that seamlessly integrates best-in-class CNCF tools to provide a cohesive developer platform. Rather than replacing existing tools, OpenChoreo creates opinionated workflows that leverage the strengths of each component in the cloud native ecosystem.

## CNCF Tool Orchestration

### Kubernetes Foundation
OpenChoreo is built on Kubernetes as the foundational orchestration layer:
- **Custom Resources**: Extends Kubernetes API with OpenChoreo abstractions
- **Controller Pattern**: Implements controllers using controller-runtime
- **Native Integration**: Leverages Kubernetes RBAC, networking, and storage
- **Cluster API**: Multi-cluster management and lifecycle

### Container Runtime Integration
Seamless integration with container runtimes and image building:

#### BuildPacks Integration
```yaml
apiVersion: kpack.io/v1alpha2
kind: Image
metadata:
  name: user-service-image
spec:
  tag: registry.choreo.dev/user-service
  source:
    git:
      url: https://github.com/org/user-service
      revision: main
  builder:
    name: choreo-builder
```

#### Multi-Runtime Support
- **containerd**: Primary container runtime
- **Docker**: Development environment compatibility
- **Podman**: Rootless container support
- **BuildKit**: Advanced build features

## Networking and Security

### Cilium Integration
Deep integration with Cilium for networking and security:

#### eBPF-based Networking
- **Pod-to-Pod Communication**: High-performance networking without iptables
- **Service Load Balancing**: Native Layer 4 load balancing
- **Network Observability**: Real-time traffic monitoring and tracing
- **Performance Optimization**: Kernel-bypass networking for critical paths

#### Security Policy Enforcement
```yaml
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: choreo-generated-policy
spec:
  endpointSelector:
    matchLabels:
      choreo.dev/component: user-service
  ingress:
  - fromEndpoints:
    - matchLabels:
        choreo.dev/component: api-gateway
```

### Service Mesh Integration
Istio integration for advanced traffic management:
- **mTLS Automation**: Automatic certificate provisioning and rotation
- **Traffic Policies**: Declarative traffic routing and shaping
- **Observability**: Distributed tracing and metrics collection
- **Security**: Zero-trust network architecture

## Gateway and Ingress

### Envoy Gateway Integration
OpenChoreo leverages Envoy Gateway for ingress traffic management:

#### Gateway API Implementation
```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: Gateway
metadata:
  name: choreo-gateway
spec:
  gatewayClassName: envoy-gateway
  listeners:
  - name: http
    port: 80
    protocol: HTTP
  - name: https
    port: 443
    protocol: HTTPS
    tls:
      mode: Terminate
      certificateRefs:
      - name: choreo-tls-cert
```

#### Advanced Traffic Features
- **Rate Limiting**: Per-client and global rate limiting
- **Request Transformation**: Header and payload modification  
- **Circuit Breaking**: Automatic failure isolation
- **Observability**: Access logs and metrics integration

## Observability Stack

### Monitoring Integration
Comprehensive monitoring through Prometheus ecosystem:

#### Prometheus Configuration
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: choreo-components
spec:
  selector:
    matchLabels:
      choreo.dev/monitoring: enabled
  endpoints:
  - port: metrics
    path: /metrics
    interval: 30s
```

#### Thanos for Long-term Storage
- **Multi-cluster Metrics**: Aggregated metrics across data planes
- **Long-term Retention**: Cost-effective metric storage
- **Global Querying**: Cross-cluster metric queries
- **Downsampling**: Automatic metric compaction

### Logging with OpenSearch
Centralized logging infrastructure:
- **Log Aggregation**: Fluent Bit for log collection and forwarding
- **Log Processing**: OpenSearch for indexing and search
- **Log Visualization**: OpenSearch Dashboards for log analysis
- **Alerting**: OpenSearch alerting for log-based notifications

### Distributed Tracing
Jaeger integration for request tracing:
- **Automatic Instrumentation**: Transparent trace collection
- **Service Dependency Mapping**: Visualize service relationships
- **Performance Analysis**: Request latency and bottleneck identification
- **Error Tracking**: Trace-based error investigation

## Workflow and CI/CD Integration

### Argo Workflows
Build and deployment workflow orchestration:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: WorkflowTemplate
metadata:
  name: choreo-build-deploy
spec:
  entrypoint: build-and-deploy
  templates:
  - name: build-and-deploy
    steps:
    - - name: build
        template: build-image
    - - name: deploy
        template: deploy-component
```

### GitOps with ArgoCD
Declarative deployment through GitOps:
- **Git-based Configuration**: All deployment configs in Git
- **Automated Sync**: Continuous deployment from Git changes
- **Multi-environment Support**: Environment-specific configurations
- **Rollback Capabilities**: Git-based rollback mechanisms

## Storage and Data Management

### Persistent Volume Integration
Kubernetes storage orchestration:
- **Dynamic Provisioning**: Automatic PV creation
- **Storage Classes**: Multiple storage tiers and performance levels
- **Backup Integration**: Velero-based backup and restore
- **Cross-AZ Replication**: High availability storage

### Database Operators
Integrated database management:
- **PostgreSQL Operator**: Managed PostgreSQL clusters
- **MongoDB Operator**: Managed MongoDB deployments
- **Redis Operator**: Managed Redis instances
- **Backup Strategies**: Automated database backups

## Multi-Cluster Management

### Cluster API Integration
Declarative cluster lifecycle management:
- **Cluster Provisioning**: Automated cluster creation
- **Node Management**: Automatic node scaling and updates
- **Upgrade Orchestration**: Rolling cluster upgrades
- **Cost Optimization**: Automatic node rightsizing

### Cross-Cluster Networking
Multi-cluster connectivity:
- **Cluster Mesh**: Cilium-based cross-cluster networking
- **Service Discovery**: Cross-cluster service resolution
- **Traffic Routing**: Intelligent cross-cluster load balancing
- **Disaster Recovery**: Cross-cluster failover capabilities

## Extension Points

### Plugin Architecture
Extensible integration points:
- **Custom Controllers**: User-defined reconciliation logic
- **Webhook Integration**: Custom validation and mutation
- **Custom Resources**: Domain-specific resource types
- **API Extensions**: Custom API endpoints and functionality

### Tool Integration Framework
Standardized integration patterns:
- **Helm Chart Integration**: Standardized application packaging
- **Operator Integration**: Third-party operator lifecycle management
- **API Gateway Plugins**: Custom gateway functionality
- **Monitoring Integrations**: Custom metrics and alerting