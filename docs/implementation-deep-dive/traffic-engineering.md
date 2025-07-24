---
layout: docs
title: Traffic Engineering
---

# Traffic Engineering

OpenChoreo provides sophisticated traffic management capabilities through its integration with Envoy Gateway and Cilium. This enables fine-grained control over request routing, load balancing, and policy enforcement while maintaining developer simplicity.

## Gateway Configuration

### Ingress Management
OpenChoreo automatically configures ingress gateways based on endpoint definitions:

```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: user-service-route
spec:
  parentRefs:
  - name: choreo-gateway
  hostnames:
  - api.example.com
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api/v1/users
    backendRefs:
    - name: user-service
      port: 8080
```

### Multi-Environment Routing
The platform supports sophisticated routing patterns:
- **Path-based routing**: Route by URL path prefixes
- **Header-based routing**: Route based on request headers
- **Weight-based routing**: Canary deployments and A/B testing
- **Subdomain routing**: Environment-specific subdomains

### TLS Termination
Automatic TLS certificate management:
- **Certificate Provisioning**: Let's Encrypt integration
- **Certificate Renewal**: Automated renewal before expiration
- **SNI Support**: Multiple domains per gateway
- **HSTS Enforcement**: Security header injection

## Policy Enforcement Points

### Request Processing Pipeline
Every request flows through multiple enforcement points:

1. **Gateway Level**: Authentication, rate limiting, request validation
2. **Service Mesh**: mTLS verification, circuit breaking, retry policies
3. **Application Level**: Business logic authorization, data validation

### Authentication and Authorization
Integrated identity and access management:

```yaml
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: SecurityPolicy
metadata:
  name: user-service-auth
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: HTTPRoute
    name: user-service-route
  jwt:
    providers:
    - name: choreo-auth
      issuer: https://auth.choreo.dev
      audiences:
      - user-service
```

### Rate Limiting
Configurable rate limiting at multiple levels:
- **Global limits**: Platform-wide request limits
- **Per-user limits**: User-specific rate limiting
- **Per-endpoint limits**: API-specific rate limiting
- **Burst handling**: Traffic spike management

## Load Balancing Strategies

### Algorithm Selection
OpenChoreo supports multiple load balancing algorithms:
- **Round Robin**: Default even distribution
- **Least Connections**: Route to least loaded instances
- **Random**: Random selection for uniform workloads
- **Consistent Hash**: Session affinity based on request attributes

### Health Checking
Comprehensive health monitoring:
- **HTTP Health Checks**: Application-level health verification
- **TCP Health Checks**: Network connectivity verification
- **Custom Health Checks**: Business logic health validation
- **Circuit Breaking**: Automatic failure isolation

### Geographic Routing
Support for multi-region deployments:
- **Proximity-based routing**: Route to nearest healthy instance
- **Failover policies**: Cross-region disaster recovery
- **Latency optimization**: Minimize request latency
- **Cost optimization**: Route to cost-effective regions

## Traffic Shaping

### Quality of Service
Traffic prioritization and shaping:
- **Priority Classes**: Critical vs. best-effort traffic
- **Bandwidth Allocation**: Per-service bandwidth limits
- **Congestion Control**: Adaptive rate limiting
- **Fair Queuing**: Prevent traffic starvation

### Observability Integration
Deep traffic observability:
- **Request Tracing**: Distributed tracing with Jaeger
- **Metrics Collection**: Prometheus-compatible metrics
- **Access Logging**: Structured request/response logging
- **Real-time Monitoring**: Live traffic dashboards

## Advanced Features

### Canary Deployments
Automated canary deployment support:
- **Traffic Splitting**: Percentage-based traffic distribution
- **Header-based Routing**: Feature flag integration
- **Automatic Rollback**: Error rate-based rollback
- **Progressive Delivery**: Gradual traffic shifting

### API Gateway Features
Enterprise-grade API management:
- **Request Transformation**: Header and payload modification
- **Response Caching**: Edge caching for improved performance
- **API Versioning**: Backwards-compatible API evolution
- **Developer Portal**: Self-service API documentation