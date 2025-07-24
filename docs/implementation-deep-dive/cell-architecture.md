---
layout: docs
title: Cell Architecture
---

# Cell Architecture

OpenChoreo implements a cell-based security model that provides strong isolation boundaries while enabling controlled communication between components. This architecture ensures that applications are secure by default with minimal operational overhead.

## Security Implementation

### Cell Boundary Enforcement
Each OpenChoreo project is deployed as a "cell" - a security boundary that:
- Isolates workloads using Kubernetes namespaces
- Enforces network policies using Cilium
- Implements identity-based access controls
- Provides encrypted communication channels

### Defense in Depth
The cell architecture implements multiple security layers:

#### 1. Network Layer Security
- **Cilium NetworkPolicies**: Default-deny ingress and egress rules
- **Identity-based policies**: Communication based on workload identity, not IP addresses
- **Encrypted transit**: All inter-cell communication uses mTLS

#### 2. Workload Security
- **Pod Security Standards**: Enforced security contexts and capabilities
- **Service Mesh Integration**: Automatic sidecar injection for traffic encryption
- **Secret Management**: Secure distribution of credentials and certificates

#### 3. API Security
- **Gateway Authentication**: Centralized authentication and authorization
- **Rate Limiting**: Per-client and per-endpoint rate limiting
- **Request Validation**: Schema-based request validation

## Network Policies

### Default Policies
Every cell starts with restrictive default policies:

```yaml
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: default-deny-all
spec:
  endpointSelector: {}
  ingress: []
  egress: []
```

### Connection-based Policies
When components declare connections, OpenChoreo automatically generates appropriate network policies:

```yaml
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: user-service-to-db
spec:
  endpointSelector:
    matchLabels:
      app: user-service
  egress:
  - toEndpoints:
    - matchLabels:
        app: postgres
    toPorts:
    - ports:
      - port: "5432"
        protocol: TCP
```

## mTLS Implementation

### Certificate Management
OpenChoreo automates certificate lifecycle management:
- **Root CA**: Platform-managed certificate authority
- **Workload Certificates**: Automatically issued and rotated
- **Trust Distribution**: Secure distribution of root certificates

### Service Mesh Integration
The platform integrates with Istio/Envoy for:
- Automatic mTLS between services
- Certificate rotation without downtime
- Encrypted communication verification
- Traffic observability and metrics

### Policy Enforcement Points
mTLS policies are enforced at multiple points:
- **Ingress**: External traffic authentication
- **Egress**: Outbound connection verification  
- **East-West**: Inter-service communication
- **North-South**: Client-to-service communication

## Cell Lifecycle Management

### Creation Process
1. **Namespace Creation**: Dedicated namespace with labels and annotations
2. **RBAC Setup**: Service accounts and role bindings
3. **Network Policy Injection**: Default-deny policies
4. **Certificate Provisioning**: mTLS certificates for workloads
5. **Monitoring Setup**: Observability stack configuration

### Runtime Operations
- **Policy Updates**: Dynamic policy updates without downtime
- **Certificate Rotation**: Automated certificate renewal
- **Security Scanning**: Continuous vulnerability assessment
- **Compliance Reporting**: Audit trails and compliance metrics