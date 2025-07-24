---
layout: docs
title: Control Plane Components
---

# Control Plane Components

OpenChoreo's control plane is built using the Kubernetes controller pattern, implementing multiple specialized controllers that work together to maintain the desired state of the platform. Each controller manages specific aspects of the system through reconciliation loops.

## Reconciliation Loops

### Controller Pattern Implementation
OpenChoreo controllers follow the standard Kubernetes controller pattern:

1. **Watch**: Monitor changes to relevant resources
2. **Compare**: Determine difference between current and desired state  
3. **Act**: Take actions to reconcile differences
4. **Repeat**: Continuously monitor and adjust

### Core Controllers

#### Project Controller
Manages the lifecycle of OpenChoreo projects:

```go
func (r *ProjectReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    var project choreov1.Project
    if err := r.Get(ctx, req.NamespacedName, &project); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }
    
    // Create namespace for project
    if err := r.ensureNamespace(ctx, &project); err != nil {
        return ctrl.Result{}, err
    }
    
    // Setup RBAC
    if err := r.setupRBAC(ctx, &project); err != nil {
        return ctrl.Result{}, err
    }
    
    // Configure network policies
    return r.configureNetworkPolicies(ctx, &project)
}
```

#### Component Controller
Handles component deployments and configurations:
- **Deployment Generation**: Creates Kubernetes deployments from component specs
- **Service Creation**: Exposes components through Kubernetes services
- **Configuration Management**: Manages ConfigMaps and Secrets
- **Scaling Management**: Implements HorizontalPodAutoscaler resources

#### Environment Controller
Manages deployment environments:
- **Environment Provisioning**: Creates isolated environment namespaces
- **Resource Quotas**: Enforces environment-specific resource limits
- **Access Controls**: Configures environment-specific RBAC
- **Lifecycle Management**: Handles environment creation and destruction

## CRD Management

### Custom Resource Definitions
OpenChoreo defines several custom resources:

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: projects.choreo.dev
spec:
  group: choreo.dev
  versions:
  - name: v1
    served: true
    storage: true
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            properties:
              components:
                type: array
                items:
                  type: object
```

### Resource Relationships
The CRD hierarchy reflects OpenChoreo's conceptual model:
- **Organization** → **Projects** → **Components**
- **DataPlane** → **Environments** → **Deployments**
- **Connection** relationships between components

### Validation and Admission Control
Comprehensive validation ensures resource integrity:
- **Schema Validation**: OpenAPI v3 schema enforcement
- **Business Logic Validation**: Cross-resource dependency checking
- **Admission Webhooks**: Real-time validation during resource creation
- **Defaulting**: Automatic population of optional fields

## Event Processing

### Event-Driven Architecture
Controllers communicate through Kubernetes events:

```go
type ComponentEvent struct {
    Type      string
    Component *choreov1.Component
    Reason    string
    Message   string
}

func (r *ComponentReconciler) recordEvent(ctx context.Context, component *choreov1.Component, eventType, reason, message string) {
    r.Recorder.Event(component, eventType, reason, message)
}
```

### Event Aggregation
The platform aggregates events for:
- **Audit Trails**: Complete history of resource changes
- **Debugging**: Troubleshooting deployment issues
- **Notifications**: Alert integration for critical events
- **Metrics**: Operational metrics from event patterns

## State Management

### Desired State Specification
Controllers maintain separation between desired and actual state:
- **Declarative Specs**: User-defined desired state
- **Status Updates**: Current state observation
- **Condition Tracking**: Detailed status conditions
- **Generation Tracking**: Change detection optimization

### Conflict Resolution
Sophisticated conflict resolution mechanisms:
- **Owner References**: Clear resource ownership hierarchy
- **Resource Finalizers**: Controlled deletion ordering
- **Leader Election**: Single active controller instance
- **Optimistic Concurrency**: Resource version conflict handling

## Controller Coordination

### Multi-Controller Orchestration
Controllers coordinate through:
- **Resource Dependencies**: Hierarchical resource relationships
- **Cross-References**: Resource references across controller domains
- **Shared Caches**: Efficient resource watching and caching
- **Event Broadcasting**: Cross-controller communication

### Performance Optimization  
The control plane is optimized for scale:
- **Work Queues**: Rate-limited processing queues
- **Informer Caching**: Efficient resource watching
- **Batching**: Grouped operations for efficiency
- **Backoff Strategies**: Exponential backoff for failed reconciliations

## Observability and Debugging

### Controller Metrics
Comprehensive metrics for monitoring:
- **Reconciliation Duration**: Time spent in reconciliation loops
- **Queue Depth**: Work queue backlog monitoring
- **Error Rates**: Failed reconciliation tracking
- **Resource Counts**: Managed resource inventory

### Debugging Tools
Built-in debugging capabilities:
- **Controller Logs**: Structured logging with correlation IDs
- **Resource Events**: Kubernetes event integration
- **Status Conditions**: Detailed status reporting
- **Debug Endpoints**: Runtime introspection APIs