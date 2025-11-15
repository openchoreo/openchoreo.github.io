---
title: Configuration Schema
unlisted: true
---

# Configuration Schema

This reference provides the complete schema for all OpenChoreo configuration options, including Custom Resource Definitions (CRDs), Helm values, and environment variables.

## Platform Resources

OpenChoreo follows a hierarchical platform model where Organizations contain Projects, which reference DeploymentPipelines that define promotion paths between Environments deployed on DataPlanes.

### Organization CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Organization
metadata:
  name: string                    # Required: Organization name (cluster-scoped)
spec: {}                          # Empty spec - used for namespace provisioning

status:
  namespace: string               # Provisioned namespace for the organization
  conditions:                     # Standard Kubernetes conditions
    - type: string
      status: enum                # "True" | "False" | "Unknown"
      reason: string
      message: string
      lastTransitionTime: string
  observedGeneration: integer     # Generation tracking
```

### Project CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Project
metadata:
  name: string                    # Required: Project name (DNS-1123 compliant)
  namespace: string               # Required: Organization namespace
spec:
  deploymentPipelineRef: string   # Required: Reference to deployment pipeline

status:
  conditions:                     # Standard Kubernetes conditions
    - type: string
      status: enum                # "True" | "False" | "Unknown"
      reason: string
      message: string
      lastTransitionTime: string
  observedGeneration: integer     # Generation tracking
```

### Environment CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Environment
metadata:
  name: string                    # Required: Environment name
  namespace: string               # Required: Organization namespace
spec:
  dataPlaneRef: string            # Optional: Reference to data plane
  isProduction: boolean           # Optional: Production environment flag
  gateway:                        # Optional: Gateway configuration
    dnsPrefix: string             # DNS prefix for the environment
    security:                     # Security configuration
      remoteJwks:                 # Remote JWKS configuration
        uri: string               # Required: JWKS URI

status:
  conditions:                     # Standard Kubernetes conditions
    - type: string
      status: enum
      reason: string
      message: string
      lastTransitionTime: string
  observedGeneration: integer
```

### DataPlane CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: DataPlane
metadata:
  name: string                    # Required: DataPlane name
  namespace: string               # Required: Organization namespace
spec:
  # API Gateway Configuration
  gateway:                        # Required: Gateway configuration
    organizationVirtualHost: string  # Required: Organization virtual host
    publicVirtualHost: string     # Required: Public virtual host

  # Kubernetes Cluster Configuration
  kubernetesCluster:              # Required: Target cluster
    name: string                  # Required: Cluster name
    credentials:                  # Required: Authentication details
      apiServerURL: string        # Required: Kubernetes API server URL
      caCert: string              # Required: Base64-encoded CA certificate
      clientCert: string          # Required: Base64-encoded client certificate
      clientKey: string           # Required: Base64-encoded client private key

  # Container Registry Configuration
  registry:                       # Required: Registry configuration
    prefix: string                # Required: Registry domain and namespace
    secretRef: string             # Optional: Registry credentials secret

  # Secret Store Configuration
  secretStoreRef:                 # Optional: External Secrets reference
    name: string                  # Required: Secret store name

  # Observer API Integration
  observer:                       # Optional: Observer API
    url: string                   # Required: Observer API base URL
    authentication:               # Required: Authentication
      basicAuth:                  # Required: Basic auth credentials
        username: string          # Required: Username
        password: string          # Required: Password

status:
  conditions:                     # Standard Kubernetes conditions
    - type: string
      status: enum
      reason: string
      message: string
      lastTransitionTime: string
  observedGeneration: integer
```

### BuildPlane CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: BuildPlane
metadata:
  name: string                    # Required: BuildPlane name
  namespace: string               # Required: Organization namespace
spec:
  # Kubernetes Cluster for Build Workloads
  kubernetesCluster:              # Required: Build cluster
    name: string                  # Required: Cluster name
    credentials:                  # Required: Same structure as DataPlane
      apiServerURL: string
      caCert: string
      clientCert: string
      clientKey: string

  # Observer API Integration (Optional)
  observer:                       # Optional: Same structure as DataPlane
    url: string
    authentication:
      basicAuth:
        username: string
        password: string

status: {}                        # Minimal status implementation
```

### DeploymentPipeline CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: DeploymentPipeline
metadata:
  name: string                    # Required: Pipeline name
  namespace: string               # Required: Organization namespace
spec:
  promotionPaths:                 # Optional: Environment promotion paths
    - sourceEnvironmentRef: string    # Required: Source environment
      targetEnvironmentRefs:      # Required: Target environments
        - name: string            # Required: Target environment name
          requiresApproval: boolean # Optional: Approval required flag
          isManualApprovalRequired: boolean # Optional: Manual approval flag

status:
  conditions:                     # Standard Kubernetes conditions
    - type: string
      status: enum
      reason: string
      message: string
      lastTransitionTime: string
  observedGeneration: integer
```

### ComponentType CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentType
metadata:
  name: string                    # Required: ComponentType name
  namespace: string               # Required: Organization namespace
spec:
  # Workload Type
  workloadType: enum              # Required: "deployment" | "statefulset" | "cronjob" | "job"

  # Workflow Restrictions
  allowedWorkflows:               # Optional: Restrict which workflows can be used
    - name: string                # Required: Workflow name

  # Schema Definition
  schema:                         # Optional: Developer-facing configuration schema
    types:                        # Optional: Reusable type definitions
      "{TypeName}":               # Custom type definitions
        field: string             # Type definition using inline syntax

    parameters:                   # Optional: Static parameters (environment-independent)
      "{fieldName}": string       # Type definition: "type | default=value | enum=val1,val2"

    envOverrides:                 # Optional: Environment-overridable parameters
      "{fieldName}": string       # Type definition: "type | default=value"

  # Resource Templates
  resources:                      # Required: Templates for generating Kubernetes resources
    - id: string                  # Required: Unique identifier (primary must match workloadType)
      includeWhen: string         # Optional: CEL expression for conditional inclusion
      forEach: string             # Optional: CEL expression for iteration
      var: string                 # Optional: Loop variable name (required if forEach specified)
      template:                   # Required: Kubernetes resource with CEL expressions
        # ... Kubernetes resource YAML with ${...} CEL expressions

status: {}                        # Empty status object
```


### Trait CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Trait
metadata:
  name: string                    # Required: Trait name
  namespace: string               # Required: Organization namespace
spec:
  # Schema Definition
  schema:                         # Optional: Trait configuration schema
    types:                        # Optional: Reusable type definitions
      "{TypeName}":               # Custom type definitions
        field: string             # Type definition using inline syntax

    parameters:                   # Optional: Static parameters
      "{fieldName}": string       # Type definition

    envOverrides:                 # Optional: Environment-overridable parameters
      "{fieldName}": string       # Type definition

  # Resource Creation
  creates:                        # Optional: Resources to create
    - includeWhen: string         # Optional: CEL condition
      forEach: string             # Optional: CEL iteration
      var: string                 # Optional: Loop variable
      template:                   # Required: Resource template
        # ... Kubernetes resource with CEL expressions

  # Resource Patches
  patches:                        # Optional: Patches to apply
    - target:                     # Required: Target resource
        group: string             # API group
        version: string           # API version
        kind: string              # Resource kind
      forEach: string             # Optional: CEL iteration
      var: string                 # Optional: Loop variable
      operations:                 # Required: JSON Patch operations
        - op: enum                # "add" | "remove" | "replace"
          path: string            # JSON path
          value:                  # Value (for add/replace)
            # ... Value specification

status: {}                        # Empty status object
```

### Workflow CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workflow
metadata:
  name: string                    # Required: Workflow name
  namespace: string               # Required: Organization namespace
spec:
  # Developer-facing Schema
  schema:                         # Optional: Parameters developers can configure
    "{fieldName}": string         # Type definition: "type | default=value | enum=val1,val2"
    # Nested structure supported for complex configurations

  # Secret References
  secrets:                        # Optional: Secrets to sync to build plane
    - string                      # Secret reference (supports CEL: ${schema.field})

  # Resource Template
  resource:                       # Required: Argo Workflow with CEL expressions
    # Kubernetes resource with ${ctx.*} and ${schema.*} variables
    apiVersion: argoproj.io/v1alpha1
    kind: Workflow
    # ... Argo Workflow specification with CEL expressions

status:
  conditions:                     
    - type: string
      status: enum
      reason: string
      message: string
      lastTransitionTime: string
```

## Application Resources

OpenChoreo uses a schema-driven architecture where Components reference ComponentTypes to define deployment patterns, compose capabilities through Traits, and optionally configure Workflows for building from source.

### Component CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: string                    # Required: Component name
  namespace: string               # Required: Organization namespace
spec:
  # Owner Reference
  owner:                          # Required: Owner information
    projectName: string           # Required: Project name (minLength: 1)

  # Component Type (new schema-driven API)
  componentType: string           # Optional: Format "{workloadType}/{componentTypeName}"
                                  # Example: "deployment/web-service"

  # Legacy Type (deprecated)
  type: enum                      # Optional: "Service" | "WebApplication" | "ScheduledTask"
                                  # Use componentType instead for new components

  # Parameters
  parameters:                     # Optional: Configuration conforming to ComponentType schema
    # Structure defined by referenced ComponentType's schema
    # Supports both parameters and envOverrides fields

  # Traits (Composition)
  traits:                         # Optional: Trait instances to compose
    - name: string                # Required: Trait resource name
      instanceName: string        # Required: Unique instance identifier
      parameters:                 # Optional: Trait-specific configuration
        # Structure defined by Trait's schema

  # Workflow Configuration
  workflow:                       # Optional: Build workflow configuration
    name: string                  # Required: Workflow CR name
    schema:                       # Optional: Developer-provided values
      # Structure defined by Workflow's schema

status:
  conditions:                     # Standard Kubernetes conditions
    - type: string
      status: enum                # "True" | "False" | "Unknown"
      reason: string
      message: string
      lastTransitionTime: string
  observedGeneration: integer
```

### Workload CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workload
metadata:
  name: string                    # Required: Workload name
  namespace: string               # Required: Organization namespace
spec:
  # Owner Reference
  owner:                          # Required: Owner information
    projectName: string           # Required: Project name
    componentName: string         # Required: Component name

  # Container Specifications
  containers:                     # Optional: Container definitions (map)
    "{containerName}":            # Container name (e.g., "app", "sidecar")
      image: string               # Required: Container image reference
      command:                    # Optional: Command override
        - string
      args:                       # Optional: Arguments
        - string
      env:                        # Optional: Environment variables
        - name: string
          value: string

  # Endpoints
  endpoints:                      # Optional: Network endpoints
    - name: string                # Required: Endpoint name
      port: integer               # Required: Port number
      protocol: string            # Optional: Protocol (default: "TCP")
      type: string                # Optional: Type (e.g., "http", "grpc")

  # Connections
  connections:                    # Optional: Service dependencies
    - name: string                # Required: Connection name
      target:                     # Required: Target service
        service: string           # Service name
        port: integer             # Service port
      inject:                     # Optional: Injection configuration
        env:                      # Environment variables
          - key: string
            value: string

status: {}                        # Empty status object
```

### WorkflowRun CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: string                    # Required: WorkflowRun name
  namespace: string               # Required: Organization namespace
spec:
  # Owner Reference (Optional)
  owner:                          # Optional: Component-bound workflow
    projectName: string           # Required: Project name
    componentName: string         # Required: Component name

  # Workflow Configuration
  workflow:                       # Required: Workflow execution config
    name: string                  # Required: Workflow CR name
    schema:                       # Optional: Developer-provided values
      # Structure defined by Workflow's schema

status:
  # Execution Status
  conditions:                     # Standard Kubernetes conditions
    - type: string
      status: enum
      reason: string
      message: string
      lastTransitionTime: string

  # Build Output
  imageStatus:                    # Optional: Built image information
    image: string                 # Fully qualified image name

  # Execution Reference
  runReference:                   # Optional: Reference to actual workflow run
    name: string                  # Workflow run name in build plane
    namespace: string             # Workflow run namespace in build plane
```

## Runtime Resources

OpenChoreo uses ComponentDeployment for environment-specific configuration and Release for managing deployed resources across all component types.

### ComponentDeployment CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentDeployment
metadata:
  name: string                    # Required: ComponentDeployment name
  namespace: string               # Required: Organization namespace
spec:
  # Owner Reference
  owner:                          # Required: Component reference
    projectName: string           # Required: Project name
    componentName: string         # Required: Component name

  # Environment
  environment: string             # Required: Target environment name

  # Parameter Overrides
  overrides:                      # Optional: Environment-specific parameter overrides
    # Structure matches ComponentType's envOverrides schema
    # Merged with Component.spec.parameters

  # Trait Overrides
  traitOverrides:                 # Optional: Environment-specific trait overrides
    "{instanceName}":             # Keyed by trait instanceName
      # Structure matches Trait's envOverrides schema

  # Configuration Overrides
  configurationOverrides:         # Optional: Workload configuration overrides
    env:                          # Environment variable overrides
      - name: string
        value: string
    files:                        # File configuration overrides
      - name: string
        value: string

status:
  conditions:                     # Standard Kubernetes conditions
    - type: string
      status: enum
      reason: string
      message: string
      lastTransitionTime: string
  observedGeneration: integer
```

### Release CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Release
metadata:
  name: string                    # Required: Release name
  namespace: string               # Required: Organization namespace
spec:
  # Owner Reference
  owner:                          # Required: Component reference
    projectName: string           # Required: Project name
    componentName: string         # Required: Component name

  # Environment
  environmentName: string         # Required: Target environment (minLength: 1)

  # Resources
  resources:                      # Optional: Kubernetes resources to deploy
    - id: string                  # Required: Resource identifier
      object:                     # Required: Complete Kubernetes resource
        # ... Kubernetes resource YAML

  # Watch Configuration
  interval: string                # Optional: Watch interval (default: 5m)
                                  # Pattern: ^([0-9]+(\.[0-9]+)?(ms|s|m|h))+$
  progressingInterval: string     # Optional: Interval when progressing (default: 10s)

status:
  # Resource Status
  resources:                      # List of deployed resources
    - id: string                  # Resource identifier
      group: string               # API group
      version: string             # API version
      kind: string                # Resource kind
      name: string                # Resource name in data plane
      namespace: string           # Resource namespace in data plane
      status:                     # Resource status from data plane
        # ... Resource-specific status
      healthStatus: enum          # "Unknown" | "Progressing" | "Healthy" | "Suspended" | "Degraded"
      lastObservedTime: string    # Last observation timestamp

  # Release Status
  conditions:                     # Standard Kubernetes conditions
    - type: string
      status: enum                # "True" | "False" | "Unknown"
      reason: string
      message: string
      lastTransitionTime: string
```

## Validation Rules

### Common Patterns

All OpenChoreo resources follow standard Kubernetes patterns with consistent validation:

```yaml
# Name validation (DNS-1123 compliant)
metadata.name:
  pattern: "^[a-z0-9]([-a-z0-9]*[a-z0-9])?$"
  maxLength: 253

# Condition validation
status.conditions[*].reason:
  pattern: "^[A-Za-z]([A-Za-z0-9_,:]*[A-Za-z0-9_])?$"
  minLength: 1
  maxLength: 1024

status.conditions[*].type:
  pattern: "^([a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*/)?(([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])$"
  maxLength: 316

status.conditions[*].message:
  maxLength: 32768

# Generation tracking
status.observedGeneration:
  minimum: 0
  type: integer (int64)

# ComponentType validation
componentType:
  pattern: "^(deployment|statefulset|cronjob|job)/[a-z0-9]([-a-z0-9]*[a-z0-9])?$"
```

## Short Names and Categories

OpenChoreo resources support kubectl short names for convenience:

```bash
# Platform Resources
kubectl get org,orgs              # Organization
kubectl get proj,projs            # Project
kubectl get env,envs              # Environment
kubectl get dp,dps                # DataPlane
kubectl get deppipe,deppipes      # DeploymentPipeline

# Application Resources
kubectl get comp,comps            # Component
kubectl get ct,cts                # ComponentType
kubectl get wf                    # Workflow
kubectl get wfr                   # WorkflowRun

# Runtime Resources
kubectl get compdeployment,compdeployments  # ComponentDeployment
kubectl get release               # Release
```

---

## Schema Updates

This schema reference reflects OpenChoreo's v0.4.0 CRD definitions. For the latest schema definitions, see:

- **CRD Definitions**: [GitHub Repository](https://github.com/openchoreo/openchoreo/tree/main/config/crd)
- **Resource Reference Guide**: [Complete Resource Guide](https://github.com/openchoreo/openchoreo/blob/main/docs/resource-kind-reference-guide.md)