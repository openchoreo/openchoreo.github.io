---
layout: docs
title: Development Guidelines
---

# Development Guidelines

This guide outlines the coding standards, architectural principles, and development practices for OpenChoreo contributors. Following these guidelines ensures consistency, maintainability, and quality across the entire codebase.

## Code Standards

### Go Coding Standards

OpenChoreo is primarily written in Go. We follow the official Go guidelines with additional project-specific conventions.

#### **Formatting and Style**

```go
// Use gofmt for consistent formatting
// All code must pass golangci-lint checks

// Good: Clear function names and documentation
// GetComponentByName retrieves a component by its name from the given namespace
func GetComponentByName(ctx context.Context, client client.Client, name, namespace string) (*choreov1.Component, error) {
    component := &choreov1.Component{}
    key := types.NamespacedName{
        Name:      name,
        Namespace: namespace,
    }
    
    if err := client.Get(ctx, key, component); err != nil {
        return nil, fmt.Errorf("failed to get component %s/%s: %w", namespace, name, err)
    }
    
    return component, nil
}

// Bad: Poor naming and no documentation
func get(c client.Client, n, ns string) *choreov1.Component {
    // implementation
}
```

#### **Error Handling**

```go
// Good: Wrap errors with context
func (r *ComponentReconciler) reconcileDeployment(ctx context.Context, component *choreov1.Component) error {
    deployment := &appsv1.Deployment{}
    if err := r.generateDeployment(component, deployment); err != nil {
        return fmt.Errorf("failed to generate deployment for component %s: %w", component.Name, err)
    }
    
    if err := r.Client.Create(ctx, deployment); err != nil {
        if !apierrors.IsAlreadyExists(err) {
            return fmt.Errorf("failed to create deployment %s: %w", deployment.Name, err)
        }
    }
    
    return nil
}

// Bad: Swallowing errors or poor error messages
func (r *ComponentReconciler) reconcileDeployment(ctx context.Context, component *choreov1.Component) error {
    deployment := &appsv1.Deployment{}
    r.generateDeployment(component, deployment) // ignoring error
    
    if err := r.Client.Create(ctx, deployment); err != nil {
        return err // no context
    }
    
    return nil
}
```

#### **Logging**

```go
// Use structured logging with logr
func (r *ComponentReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    log := r.Log.WithValues("component", req.NamespacedName)
    
    log.Info("Starting reconciliation")
    
    var component choreov1.Component
    if err := r.Get(ctx, req.NamespacedName, &component); err != nil {
        if apierrors.IsNotFound(err) {
            log.Info("Component not found, may have been deleted")
            return ctrl.Result{}, nil
        }
        log.Error(err, "Failed to get component")
        return ctrl.Result{}, err
    }
    
    log.Info("Successfully reconciled component", "status", component.Status.Phase)
    return ctrl.Result{}, nil
}
```

### TypeScript/JavaScript Standards

For frontend and CLI components written in TypeScript:

#### **Code Style**

```typescript
// Use Prettier for formatting and ESLint for linting

// Good: Proper typing and error handling
interface ComponentConfig {
  name: string;
  type: 'service' | 'worker' | 'scheduled';
  runtime: string;
  endpoints?: EndpointConfig[];
}

class ComponentManager {
  private client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  async createComponent(config: ComponentConfig): Promise<Component> {
    try {
      const response = await this.client.post('/components', config);
      return response.data as Component;
    } catch (error) {
      throw new Error(`Failed to create component ${config.name}: ${error.message}`);
    }
  }
}

// Bad: No typing, poor error handling
class ComponentManager {
  constructor(client) {
    this.client = client;
  }

  async createComponent(config) {
    const response = await this.client.post('/components', config);
    return response.data;
  }
}
```

## Architecture Principles

### **Separation of Concerns**

Each component should have a single, well-defined responsibility:

```go
// Good: Separate concerns
type ComponentValidator struct {
    // Only handles validation logic
}

type ComponentDeployer struct {
    client client.Client
    // Only handles deployment logic
}

type ComponentController struct {
    ComponentValidator
    ComponentDeployer
    // Orchestrates validation and deployment
}

// Bad: Mixed concerns
type ComponentManager struct {
    // Handles validation, deployment, monitoring, etc.
}
```

### **Dependency Injection**

Use dependency injection for testability and flexibility:

```go
// Good: Dependencies injected through interfaces
type ComponentService interface {
    CreateComponent(ctx context.Context, spec ComponentSpec) (*Component, error)
}

type ComponentController struct {
    client  client.Client
    service ComponentService
    log     logr.Logger
}

func NewComponentController(client client.Client, service ComponentService, log logr.Logger) *ComponentController {
    return &ComponentController{
        client:  client,
        service: service,
        log:     log,
    }
}

// Bad: Direct dependencies
type ComponentController struct {
    // Hard-coded dependencies
}
```

### **Configuration Management**

Use structured configuration with validation:

```go
// Good: Structured configuration
type ControllerConfig struct {
    MetricsAddr          string        `yaml:"metricsAddr" validate:"required"`
    HealthProbeAddr      string        `yaml:"healthProbeAddr" validate:"required"`
    LeaderElectionID     string        `yaml:"leaderElectionID" validate:"required"`
    ReconcileTimeout     time.Duration `yaml:"reconcileTimeout" validate:"min=1s"`
    MaxConcurrentReconciles int        `yaml:"maxConcurrentReconciles" validate:"min=1"`
}

func (c *ControllerConfig) Validate() error {
    validate := validator.New()
    return validate.Struct(c)
}

// Bad: Unstructured configuration
var (
    metricsAddr = flag.String("metrics-addr", ":8080", "...")
    healthAddr  = flag.String("health-addr", ":8081", "...")
    // ... many global variables
)
```

## Testing Standards

### **Unit Testing**

Write comprehensive unit tests with good coverage:

```go
func TestComponentValidator_ValidateComponent(t *testing.T) {
    tests := []struct {
        name      string
        component *choreov1.Component
        wantErr   bool
        errMsg    string
    }{
        {
            name: "valid component",
            component: &choreov1.Component{
                ObjectMeta: metav1.ObjectMeta{
                    Name:      "test-component",
                    Namespace: "default",
                },
                Spec: choreov1.ComponentSpec{
                    Type:    "service",
                    Runtime: "go",
                },
            },
            wantErr: false,
        },
        {
            name: "missing name",
            component: &choreov1.Component{
                Spec: choreov1.ComponentSpec{
                    Type:    "service",
                    Runtime: "go",
                },
            },
            wantErr: true,
            errMsg:  "component name is required",
        },
    }

    validator := NewComponentValidator()

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := validator.ValidateComponent(tt.component)
            
            if tt.wantErr {
                assert.Error(t, err)
                if tt.errMsg != "" {
                    assert.Contains(t, err.Error(), tt.errMsg)
                }
            } else {
                assert.NoError(t, err)
            }
        })
    }
}
```

### **Integration Testing**

Test component interactions:

```go
func TestComponentController_Integration(t *testing.T) {
    // Setup test environment
    scheme := runtime.NewScheme()
    _ = choreov1.AddToScheme(scheme)
    _ = appsv1.AddToScheme(scheme)
    
    client := fake.NewClientBuilder().
        WithScheme(scheme).
        Build()
    
    controller := &ComponentController{
        Client: client,
        Log:    logr.Discard(),
    }
    
    // Create test component
    component := &choreov1.Component{
        ObjectMeta: metav1.ObjectMeta{
            Name:      "test-component",
            Namespace: "default",
        },
        Spec: choreov1.ComponentSpec{
            Type:    "service",
            Runtime: "go",
        },
    }
    
    err := client.Create(context.TODO(), component)
    require.NoError(t, err)
    
    // Test reconciliation
    req := ctrl.Request{
        NamespacedName: types.NamespacedName{
            Name:      "test-component",
            Namespace: "default",
        },
    }
    
    result, err := controller.Reconcile(context.TODO(), req)
    assert.NoError(t, err)
    assert.Equal(t, ctrl.Result{}, result)
    
    // Verify deployment was created
    deployment := &appsv1.Deployment{}
    err = client.Get(context.TODO(), types.NamespacedName{
        Name:      "test-component",
        Namespace: "default",
    }, deployment)
    assert.NoError(t, err)
}
```

### **End-to-End Testing**

Test complete workflows:

```go
func TestE2E_ComponentDeployment(t *testing.T) {
    if testing.Short() {
        t.Skip("Skipping e2e test in short mode")
    }
    
    // Setup real Kubernetes cluster
    cfg := ctrl.GetConfigOrDie()
    client, err := client.New(cfg, client.Options{})
    require.NoError(t, err)
    
    // Create test namespace
    ns := &corev1.Namespace{
        ObjectMeta: metav1.ObjectMeta{
            Name: "e2e-test-" + uuid.New().String()[:8],
        },
    }
    err = client.Create(context.TODO(), ns)
    require.NoError(t, err)
    
    defer func() {
        _ = client.Delete(context.TODO(), ns)
    }()
    
    // Test complete component lifecycle
    // ... test implementation
}
```

## API Design Guidelines

### **REST API Design**

Follow REST conventions for HTTP APIs:

```go
// Good: RESTful routes
// GET    /api/v1/projects                    - List projects
// POST   /api/v1/projects                    - Create project
// GET    /api/v1/projects/{id}               - Get project
// PUT    /api/v1/projects/{id}               - Update project
// DELETE /api/v1/projects/{id}               - Delete project
// GET    /api/v1/projects/{id}/components    - List project components

type ProjectHandler struct {
    service ProjectService
}

func (h *ProjectHandler) CreateProject(w http.ResponseWriter, r *http.Request) {
    var req CreateProjectRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }
    
    if err := req.Validate(); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    project, err := h.service.CreateProject(r.Context(), req)
    if err != nil {
        // Handle different error types appropriately
        if errors.Is(err, ErrProjectAlreadyExists) {
            http.Error(w, "Project already exists", http.StatusConflict)
            return
        }
        http.Error(w, "Internal server error", http.StatusInternalServerError)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(project)
}
```

### **Custom Resource Definitions**

Design CRDs following Kubernetes conventions:

```yaml
# Good: Well-structured CRD
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: components.choreo.dev
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
            required:
            - type
            - runtime
            properties:
              type:
                type: string
                enum: ["service", "worker", "scheduled"]
              runtime:
                type: string
                enum: ["go", "nodejs", "python", "java"]
              replicas:
                type: integer
                minimum: 0
                maximum: 100
                default: 1
          status:
            type: object
            properties:
              phase:
                type: string
                enum: ["Pending", "Running", "Failed"]
              conditions:
                type: array
                items:
                  type: object
                  properties:
                    type:
                      type: string
                    status:
                      type: string
                    reason:
                      type: string
                    message:
                      type: string
```

## Security Guidelines

### **Input Validation**

Always validate and sanitize inputs:

```go
func (h *ComponentHandler) CreateComponent(w http.ResponseWriter, r *http.Request) {
    var req CreateComponentRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }
    
    // Validate required fields
    if req.Name == "" {
        http.Error(w, "Component name is required", http.StatusBadRequest)
        return
    }
    
    // Sanitize name (Kubernetes naming conventions)
    if !isValidKubernetesName(req.Name) {
        http.Error(w, "Invalid component name format", http.StatusBadRequest)
        return
    }
    
    // Validate enum values
    if !isValidComponentType(req.Type) {
        http.Error(w, "Invalid component type", http.StatusBadRequest)
        return
    }
    
    // Continue with processing...
}

func isValidKubernetesName(name string) bool {
    // DNS-1123 subdomain names
    matched, _ := regexp.MatchString(`^[a-z0-9]([-a-z0-9]*[a-z0-9])?$`, name)
    return matched && len(name) <= 253
}
```

### **Authentication and Authorization**

Implement proper RBAC:

```go
type AuthMiddleware struct {
    tokenValidator TokenValidator
}

func (m *AuthMiddleware) RequireAuth(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := extractBearerToken(r)
        if token == "" {
            http.Error(w, "Authorization header required", http.StatusUnauthorized)
            return
        }
        
        claims, err := m.tokenValidator.ValidateToken(token)
        if err != nil {
            http.Error(w, "Invalid token", http.StatusUnauthorized)
            return
        }
        
        // Add user info to context
        ctx := context.WithValue(r.Context(), "user", claims)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

func (m *AuthMiddleware) RequirePermission(permission string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            user := r.Context().Value("user").(*Claims)
            
            if !user.HasPermission(permission) {
                http.Error(w, "Insufficient permissions", http.StatusForbidden)
                return
            }
            
            next.ServeHTTP(w, r)
        })
    }
}
```

## Performance Guidelines

### **Efficient Kubernetes Operations**

Use efficient patterns for Kubernetes API interactions:

```go
// Good: Use field selectors and list options
func (r *ComponentReconciler) listComponentsInProject(ctx context.Context, projectName string) ([]choreov1.Component, error) {
    var components choreov1.ComponentList
    
    listOptions := []client.ListOption{
        client.MatchingLabels{"choreo.dev/project": projectName},
        client.InNamespace(r.getProjectNamespace(projectName)),
    }
    
    if err := r.List(ctx, &components, listOptions...); err != nil {
        return nil, fmt.Errorf("failed to list components for project %s: %w", projectName, err)
    }
    
    return components.Items, nil
}

// Good: Use patch instead of update when possible
func (r *ComponentReconciler) updateComponentStatus(ctx context.Context, component *choreov1.Component, status choreov1.ComponentStatus) error {
    patch := client.MergeFrom(component.DeepCopy())
    component.Status = status
    
    return r.Status().Patch(ctx, component, patch)
}

// Bad: Inefficient operations
func (r *ComponentReconciler) listAllComponents(ctx context.Context) ([]choreov1.Component, error) {
    var components choreov1.ComponentList
    
    // Lists all components in all namespaces - inefficient
    if err := r.List(ctx, &components); err != nil {
        return nil, err
    }
    
    return components.Items, nil
}
```

### **Memory Management**

Be mindful of memory usage:

```go
// Good: Process items in batches
func (r *ComponentReconciler) processComponents(ctx context.Context, components []choreov1.Component) error {
    const batchSize = 10
    
    for i := 0; i < len(components); i += batchSize {
        end := i + batchSize
        if end > len(components) {
            end = len(components)
        }
        
        batch := components[i:end]
        if err := r.processBatch(ctx, batch); err != nil {
            return fmt.Errorf("failed to process batch %d-%d: %w", i, end, err)
        }
    }
    
    return nil
}

// Bad: Load everything into memory
func (r *ComponentReconciler) processAllComponents(ctx context.Context) error {
    components, err := r.listAllComponents(ctx)
    if err != nil {
        return err
    }
    
    // Could use excessive memory for large numbers of components
    for _, component := range components {
        // process component
    }
    
    return nil
}
```

## Documentation Standards

### **Code Documentation**

Write clear and comprehensive documentation:

```go
// ComponentReconciler reconciles a Component object by ensuring the desired
// Kubernetes resources exist and are configured correctly. It handles the
// complete lifecycle of component deployments including creation, updates,
// and deletion.
//
// The reconciler implements the following workflow:
// 1. Validate the component specification
// 2. Generate required Kubernetes resources (Deployment, Service, etc.)
// 3. Apply resources to the cluster
// 4. Update component status based on resource health
//
// +kubebuilder:rbac:groups=choreo.dev,resources=components,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=choreo.dev,resources=components/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=apps,resources=deployments,verbs=get;list;watch;create;update;patch;delete
type ComponentReconciler struct {
    client.Client
    Scheme *runtime.Scheme
    Log    logr.Logger
}

// Reconcile handles a single reconciliation request for a Component resource.
// It ensures that the actual state of the cluster matches the desired state
// specified in the Component specification.
//
// Returns:
//   - ctrl.Result{}: Reconciliation completed successfully
//   - ctrl.Result{RequeueAfter: duration}: Reconciliation should be retried after duration
//   - error: Reconciliation failed and should be retried with exponential backoff
func (r *ComponentReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    // Implementation...
}
```

### **API Documentation**

Document all public APIs:

```go
// CreateComponentRequest represents the request body for creating a new component
type CreateComponentRequest struct {
    // Name is the unique identifier for the component within its project.
    // Must be a valid DNS-1123 subdomain name.
    // Example: "user-service", "payment-api"
    Name string `json:"name" validate:"required,dns1123"`
    
    // Type specifies the component type which determines how it will be deployed
    // and managed. Valid values are "service", "worker", and "scheduled".
    Type string `json:"type" validate:"required,oneof=service worker scheduled"`
    
    // Runtime specifies the programming language runtime for the component.
    // Supported runtimes include "go", "nodejs", "python", "java".
    Runtime string `json:"runtime" validate:"required,oneof=go nodejs python java"`
    
    // Replicas specifies the desired number of running instances.
    // Defaults to 1 if not specified. Must be between 0 and 100.
    Replicas *int32 `json:"replicas,omitempty" validate:"omitempty,min=0,max=100"`
    
    // Endpoints defines the network endpoints exposed by this component.
    // Only applicable for "service" type components.
    Endpoints []EndpointConfig `json:"endpoints,omitempty"`
}

// CreateComponentResponse represents the response after successfully creating a component
type CreateComponentResponse struct {
    // Component contains the created component details including generated metadata
    Component Component `json:"component"`
    
    // Status indicates the current state of the component creation process
    Status string `json:"status"`
    
    // Message provides additional information about the component creation
    Message string `json:"message,omitempty"`
}
```

By following these development guidelines, we ensure that OpenChoreo maintains high code quality, remains maintainable, and provides a consistent experience for both contributors and users.