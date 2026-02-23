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
  buildPlaneRef:                  # Optional: Reference to BuildPlane or ClusterBuildPlane
    kind: string                  # Optional: "BuildPlane" (default) or "ClusterBuildPlane"
    name: string                  # Required: Name of the build plane resource

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
  dataPlaneRef:                   # Optional: Reference to DataPlane or ClusterDataPlane
    kind: string                  # Optional: "DataPlane" (default) or "ClusterDataPlane"
    name: string                  # Required: Name of the data plane resource
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
  # Plane identifier for multi-tenancy scenarios
  planeID: string                 # Optional: Defaults to CR name. Max 63 chars, lowercase alphanumeric with hyphens.

  # Cluster Agent Configuration (mandatory for secure communication)
  clusterAgent:                   # Required: Cluster agent communication config
    clientCA:                     # Required: CA certificate for verifying agent's client cert
      secretRef:                  # Optional: Reference to secret containing CA cert
        name: string              # Required: Secret name
        namespace: string         # Optional: Secret namespace (defaults to parent's namespace)
        key: string               # Required: Key within the secret
      value: string               # Optional: Inline CA certificate value

  # API Gateway Configuration
  gateway:                        # Required: Gateway configuration
    publicVirtualHost: string     # Required: Public virtual host
    organizationVirtualHost: string  # Required: Organization virtual host
    publicHTTPPort: integer       # Optional: Default 19080
    publicHTTPSPort: integer      # Optional: Default 19443
    organizationHTTPPort: integer # Optional: Default 19081
    organizationHTTPSPort: integer # Optional: Default 19444

  # Image Pull Secrets
  imagePullSecretRefs:            # Optional: References to SecretReference resources
    - string

  # External Secrets Operator Integration
  secretStoreRef:                 # Optional: ESO ClusterSecretStore reference
    name: string                  # Required: ClusterSecretStore name

  # Observability Integration
  observabilityPlaneRef:          # Optional: Reference to ObservabilityPlane or ClusterObservabilityPlane
    kind: string                  # Optional: "ObservabilityPlane" (default) or "ClusterObservabilityPlane"
    name: string                  # Required: Name of the observability plane resource

status:
  conditions:                     # Standard Kubernetes conditions
    - type: string
      status: enum
      reason: string
      message: string
      lastTransitionTime: string
  observedGeneration: integer
  agentConnection:                # Optional: Cluster agent connection status
    connected: boolean            # Whether any cluster agent is currently connected
    connectedAgents: integer      # Number of cluster agents currently connected
    lastConnectedTime: string     # Optional: When an agent last successfully connected
    lastDisconnectedTime: string  # Optional: When the last agent disconnected
    lastHeartbeatTime: string     # Optional: Last communication from an agent
    message: string               # Optional: Additional status information
```

### BuildPlane CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: BuildPlane
metadata:
  name: string                    # Required: BuildPlane name
  namespace: string               # Required: Organization namespace
spec:
  # Plane identifier for multi-tenancy scenarios
  planeID: string                 # Optional: Defaults to CR name. Max 63 chars, lowercase alphanumeric with hyphens.

  # Cluster Agent Configuration (mandatory for secure communication)
  clusterAgent:                   # Required: Cluster agent communication config
    clientCA:                     # Required: CA certificate for verifying agent's client cert
      secretRef:                  # Optional: Reference to secret containing CA cert
        name: string              # Required: Secret name
        namespace: string         # Optional: Secret namespace
        key: string               # Required: Key within the secret
      value: string               # Optional: Inline CA certificate value

  # External Secrets Operator Integration
  secretStoreRef:                 # Optional: ESO ClusterSecretStore reference
    name: string                  # Required: ClusterSecretStore name

  # Observability Integration
  observabilityPlaneRef:          # Optional: Reference to ObservabilityPlane or ClusterObservabilityPlane
    kind: string                  # Optional: "ObservabilityPlane" (default) or "ClusterObservabilityPlane"
    name: string                  # Required: Name of the observability plane resource

status:
  conditions:                     # Standard Kubernetes conditions
    - type: string
      status: enum
      reason: string
      message: string
      lastTransitionTime: string
  observedGeneration: integer
  agentConnection:                # Optional: Cluster agent connection status
    connected: boolean            # Whether any cluster agent is currently connected
    connectedAgents: integer      # Number of cluster agents currently connected
    lastConnectedTime: string     # Optional: When an agent last successfully connected
    lastDisconnectedTime: string  # Optional: When the last agent disconnected
    lastHeartbeatTime: string     # Optional: Last communication from an agent
    message: string               # Optional: Additional status information
```

### ObservabilityPlane CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ObservabilityPlane
metadata:
  name: string                    # Required: ObservabilityPlane name
  namespace: string               # Required: Organization namespace
spec:
  # Plane identifier for multi-tenancy scenarios
  planeID: string                 # Optional: Defaults to CR name. Max 63 chars, lowercase alphanumeric with hyphens.

  # Cluster Agent Configuration (mandatory for secure communication)
  clusterAgent:                   # Required: Cluster agent communication config
    clientCA:                     # Required: CA certificate for verifying agent's client cert
      secretRef:                  # Optional: Reference to secret containing CA cert
        name: string              # Required: Secret name
        namespace: string         # Optional: Secret namespace (defaults to parent's namespace)
        key: string               # Required: Key within the secret
      value: string               # Optional: Inline CA certificate value

  # Observer API
  observerURL: string             # Required: Base URL of the Observer API

status:
  conditions:                     # Standard Kubernetes conditions
    - type: string
      status: enum
      reason: string
      message: string
      lastTransitionTime: string
  observedGeneration: integer
  agentConnection:                # Optional: Cluster agent connection status
    connected: boolean            # Whether any cluster agent is currently connected
    connectedAgents: integer      # Number of cluster agents currently connected
    lastConnectedTime: string     # Optional: When an agent last successfully connected
    lastDisconnectedTime: string  # Optional: When the last agent disconnected
    lastHeartbeatTime: string     # Optional: Last communication from an agent
    message: string               # Optional: Additional status information
```

### ClusterDataPlane CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterDataPlane
metadata:
  name: string                    # Required: ClusterDataPlane name (cluster-scoped, no namespace)
spec:
  # Plane identifier for multi-tenancy scenarios
  planeID: string                 # Optional: Defaults to CR name. Max 63 chars, lowercase alphanumeric with hyphens.

  # Cluster Agent Configuration (mandatory for secure communication)
  clusterAgent:                   # Required: Cluster agent communication config
    clientCA:                     # Required: CA certificate for verifying agent's client cert
      secretRef:                  # Optional: Reference to secret containing CA cert
        name: string              # Required: Secret name
        namespace: string         # Optional: Secret namespace
        key: string               # Required: Key within the secret
      value: string               # Optional: Inline CA certificate value

  # API Gateway Configuration
  gateway:                        # Required: Gateway configuration
    publicVirtualHost: string     # Required: Public virtual host
    organizationVirtualHost: string  # Required: Organization virtual host

  # Image Pull Secrets
  imagePullSecretRefs:            # Optional: References to SecretReference resources
    - string

  # External Secrets Operator Integration
  secretStoreRef:                 # Optional: ESO ClusterSecretStore reference
    name: string                  # Required: ClusterSecretStore name

  # Observability Integration
  observabilityPlaneRef:          # Optional: Reference to ClusterObservabilityPlane
    kind: string                  # Must be "ClusterObservabilityPlane"
    name: string                  # Required: Name of the ClusterObservabilityPlane resource

status:
  conditions:                     # Standard Kubernetes conditions
    - type: string
      status: enum
      reason: string
      message: string
      lastTransitionTime: string
  observedGeneration: integer
  agentConnection:                # Optional: Cluster agent connection status
    connected: boolean            # Whether any cluster agent is currently connected
    connectedAgents: integer      # Number of cluster agents currently connected
    lastConnectedTime: string     # Optional: When an agent last successfully connected
    lastDisconnectedTime: string  # Optional: When the last agent disconnected
    lastHeartbeatTime: string     # Optional: Last communication from an agent
    message: string               # Optional: Additional status information
```

### ClusterBuildPlane CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterBuildPlane
metadata:
  name: string                    # Required: ClusterBuildPlane name (cluster-scoped, no namespace)
spec:
  # Plane identifier for multi-tenancy scenarios
  planeID: string                 # Optional: Defaults to CR name. Max 63 chars, lowercase alphanumeric with hyphens.

  # Cluster Agent Configuration (mandatory for secure communication)
  clusterAgent:                   # Required: Cluster agent communication config
    clientCA:                     # Required: CA certificate for verifying agent's client cert
      secretRef:                  # Optional: Reference to secret containing CA cert
        name: string              # Required: Secret name
        namespace: string         # Optional: Secret namespace
        key: string               # Required: Key within the secret
      value: string               # Optional: Inline CA certificate value

  # External Secrets Operator Integration
  secretStoreRef:                 # Optional: ESO ClusterSecretStore reference
    name: string                  # Required: ClusterSecretStore name

  # Observability Integration
  observabilityPlaneRef:          # Optional: Reference to ClusterObservabilityPlane
    kind: string                  # Must be "ClusterObservabilityPlane"
    name: string                  # Required: Name of the ClusterObservabilityPlane resource

status:
  conditions:                     # Standard Kubernetes conditions
    - type: string
      status: enum
      reason: string
      message: string
      lastTransitionTime: string
  observedGeneration: integer
  agentConnection:                # Optional: Cluster agent connection status
    connected: boolean            # Whether any cluster agent is currently connected
    connectedAgents: integer      # Number of cluster agents currently connected
    lastConnectedTime: string     # Optional: When an agent last successfully connected
    lastDisconnectedTime: string  # Optional: When the last agent disconnected
    lastHeartbeatTime: string     # Optional: Last communication from an agent
    message: string               # Optional: Additional status information
```

### ClusterObservabilityPlane CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterObservabilityPlane
metadata:
  name: string                    # Required: ClusterObservabilityPlane name (cluster-scoped, no namespace)
spec:
  # Plane identifier for multi-tenancy scenarios
  planeID: string                 # Optional: Defaults to CR name. Max 63 chars, lowercase alphanumeric with hyphens.

  # Cluster Agent Configuration (mandatory for secure communication)
  clusterAgent:                   # Required: Cluster agent communication config
    clientCA:                     # Required: CA certificate for verifying agent's client cert
      secretRef:                  # Optional: Reference to secret containing CA cert
        name: string              # Required: Secret name
        namespace: string         # Optional: Secret namespace
        key: string               # Required: Key within the secret
      value: string               # Optional: Inline CA certificate value

  # Observer API
  observerURL: string             # Required: Base URL of the Observer API

status:
  conditions:                     # Standard Kubernetes conditions
    - type: string
      status: enum
      reason: string
      message: string
      lastTransitionTime: string
  observedGeneration: integer
  agentConnection:                # Optional: Cluster agent connection status
    connected: boolean            # Whether any cluster agent is currently connected
    connectedAgents: integer      # Number of cluster agents currently connected
    lastConnectedTime: string     # Optional: When an agent last successfully connected
    lastDisconnectedTime: string  # Optional: When the last agent disconnected
    lastHeartbeatTime: string     # Optional: Last communication from an agent
    message: string               # Optional: Additional status information
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

## Application Resources

OpenChoreo supports different component types through a layered architecture: Component defines deployable units with integrated build capabilities, while runtime abstractions (Services, WebApplications, ScheduledTasks, APIs) provide specific deployment patterns.

### Component CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: string                    # Required: Component name
  namespace: string               # Required: Project namespace
spec:
  # Build Configuration
  build:                          # Optional: Build configuration for the component
    repository:                   # Source repository configuration
      appPath: string             # Optional: Path to application within repository (default: ".")
      revision:                   # Default revision configuration
        branch: string            # Git branch name
        tag: string               # Git tag (mutually exclusive with branch)
        commit: string            # Git commit SHA (mutually exclusive with branch/tag)
      url: string                 # Required: Git repository URL
      authentication:             # Optional: Git authentication
        secretRef: string         # Secret reference for Git credentials
    
    # Build Process Configuration
    buildPlan:                    # Build execution plan
      type: string                # Build type (e.g., "buildpacks", "dockerfile")
      dockerfile:                 # Dockerfile-based builds
        path: string              # Path to Dockerfile
        context: string           # Build context directory
      buildpacks:                 # Buildpacks-based builds
        builder: string           # Builder image to use
        env:                      # Build-time environment variables
          - name: string
            value: string
  
  # Runtime Configuration
  workloadSpec:                   # Workload specification
    # Runtime workload configuration
    replicas: integer             # Number of replicas
    resources:                    # Resource requirements
      requests:
        cpu: string
        memory: string
      limits:
        cpu: string
        memory: string

status:
  conditions:                     # Standard Kubernetes conditions
    - type: string
      status: enum                # "True" | "False" | "Unknown"
      reason: string
      message: string
      lastTransitionTime: string
  observedGeneration: integer
```

### Build CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Build
metadata:
  name: string                    # Required: Build name
  namespace: string               # Required: Project namespace
spec:
  # Owner Reference
  owner:                          # Required: Owner information
    projectName: string           # Required: Project name (minLength: 1)
    componentName: string         # Required: Component name (minLength: 1)
  
  # Build Configuration
  repository:                     # Source repository for the build
    url: string                   # Git repository URL
    revision:                     # Specific revision to build
      branch: string              # Git branch
      tag: string                 # Git tag
      commit: string              # Git commit SHA
    appPath: string               # Path within repository
    authentication:               # Git authentication
      secretRef: string           # Secret reference
  
  # Build Execution
  buildPlan:                      # How to execute the build
    type: string                  # Build type
    dockerfile:                   # Dockerfile configuration
      path: string                # Dockerfile path
      context: string             # Build context
    buildpacks:                   # Buildpacks configuration
      builder: string             # Builder image
      env:                        # Environment variables
        - name: string
          value: string
  
  # Output Configuration
  output:                         # Build output configuration
    registry:                     # Container registry details
      repository: string          # Image repository
      tag: string                 # Image tag

status:
  # Build execution status
  phase: enum                     # "Pending" | "Running" | "Succeeded" | "Failed"
  startTime: string               # Build start time
  completionTime: string          # Build completion time
  image: string                   # Built image reference
  conditions:                     # Standard Kubernetes conditions
    - type: string
      status: enum
      reason: string
      message: string
      lastTransitionTime: string
  observedGeneration: integer
```

### DeploymentTrack CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: DeploymentTrack
metadata:
  name: string                    # Required: DeploymentTrack name
  namespace: string               # Required: Project namespace
spec:
  # Deployment Automation
  autoDeploy: boolean             # Optional: Enable automatic deployment (default: false)
  
  # Build Template Configuration
  buildTemplateSpec:              # Optional: Build template configuration
    # Defines how builds should be created and managed
    # for this deployment track
    
  # Deployment Configuration
  deploymentPolicy:               # Optional: Deployment policies and rules
    # Controls how deployments are executed and managed
    strategy: enum                # Deployment strategy ("rolling" | "blue-green" | "canary")
    rollbackPolicy:               # Rollback configuration
      enabled: boolean            # Enable automatic rollback
      conditions:                 # Conditions that trigger rollback
        - type: string
          threshold: string
    
  # Environment Targeting
  environments:                   # Optional: Target environments for this track
    - name: string                # Environment name
      promotion:                  # Promotion configuration
        automatic: boolean        # Enable automatic promotion
        approval:                 # Approval requirements
          required: boolean       # Require manual approval
          reviewers:              # List of required reviewers
            - string
  
  # Component Tracking
  componentRefs:                  # Optional: Component references to track
    - name: string                # Component name
      branch: string              # Git branch to track (optional)
      
  # Source Configuration
  source:                         # Optional: Source repository configuration
    repository: string            # Git repository URL
    branch: string                # Default branch to track
    path: string                  # Path within repository

status:
  # Deployment tracking status
  phase: enum                     # "Active" | "Paused" | "Failed"
  lastDeployment:                 # Information about last deployment
    timestamp: string             # When last deployment occurred
    version: string               # Deployed version/tag
    status: enum                  # "Success" | "Failed" | "InProgress"
  
  # Environment Status
  environments:                   # Status per environment
    - name: string                # Environment name
      status: enum                # "Deployed" | "Pending" | "Failed"
      version: string             # Currently deployed version
      lastUpdated: string         # Last update timestamp
      
  conditions:                     # Standard Kubernetes conditions
    - type: string
      status: enum                # "True" | "False" | "Unknown"
      reason: string
      message: string
      lastTransitionTime: string
  observedGeneration: integer
```

### Service CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Service
metadata:
  name: string                    # Required: Service name
  namespace: string               # Required: Project namespace
spec:
  className: string               # Optional: Service class name (default: "default")
  workloadName: string            # Required: Referenced workload name
  
  # Owner Reference
  owner:                          # Required: Owner information
    projectName: string           # Required: Project name (minLength: 1)
    componentName: string         # Required: Component name (minLength: 1)
  
  # API Configuration
  apis:                           # Optional: API endpoints
    "{api-name}":                 # Key-value pairs for API endpoints
      type: string                # Required: API technology type
      className: string           # Optional: API class name (default: "default")
      rest:                       # REST API configuration
        backend:                  # Backend configuration
          port: integer           # Required: Backend port (int32)
          basePath: string        # Optional: Base path
        exposeLevels:             # Optional: Exposure levels
          - string
  
  overrides: {}                   # Optional: Boolean overrides configuration

status: {}                        # Empty status object
```

### WebApplication CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WebApplication
metadata:
  name: string                    # Required: WebApplication name
  namespace: string               # Required: Project namespace
spec:
  className: string               # Optional: Web application class (default: "default")
  workloadName: string            # Required: Referenced workload name
  
  # Owner Reference
  owner:                          # Required: Owner information
    projectName: string           # Required: Project name (minLength: 1)
    componentName: string         # Required: Component name (minLength: 1)
  
  overrides: {}                   # Optional: Boolean overrides configuration

status: {}                        # Empty status object
```

### ScheduledTask CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ScheduledTask
metadata:
  name: string                    # Required: ScheduledTask name
  namespace: string               # Required: Project namespace
spec:
  className: string               # Optional: Task class name (default: "default")
  workloadName: string            # Required: Referenced workload name
  
  # Owner Reference
  owner:                          # Required: Owner information
    projectName: string           # Required: Project name (minLength: 1)
    componentName: string         # Required: Component name (minLength: 1)
  
  overrides: {}                   # Optional: Boolean overrides configuration

status: {}                        # Empty status object
```

### API CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: API
metadata:
  name: string                    # Required: API name
  namespace: string               # Required: Project namespace
spec:
  className: string               # Optional: API class name (default: "default")
  environmentName: string         # Required: Environment name (minLength: 1)
  type: string                    # Required: API technology type
  
  # Owner Reference
  owner:                          # Required: Owner information
    projectName: string           # Required: Project name (minLength: 1)
    componentName: string         # Required: Component name (minLength: 1)
  
  # REST API Configuration
  rest:                           # Optional: REST API configuration
    backend:                      # Backend configuration
      port: integer               # Required: Backend port (int32)
      basePath: string            # Optional: Base path
    exposeLevels:                 # Optional: Exposure levels
      - string

status:
  address: string                 # API address
  conditions:                     # Standard Kubernetes conditions
    - type: string
      status: enum
      reason: string
      message: string
      lastTransitionTime: string
```

## Deployment Resources

OpenChoreo uses a template-binding pattern for deployment where Classes define templates and Bindings create environment-specific instances. These resources work together with Workloads and Releases to manage the complete deployment lifecycle.

### ServiceClass CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ServiceClass
metadata:
  name: string                    # Required: ServiceClass name
  namespace: string               # Required: Project namespace
spec:
  # Template definition for service deployments
  # Defines default configurations, resource limits, and deployment patterns
  # Referenced by ServiceBinding instances

status: {}                        # Empty status object
```

### ServiceBinding CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ServiceBinding
metadata:
  name: string                    # Required: ServiceBinding name
  namespace: string               # Required: Project namespace
spec:
  # Environment-specific binding configuration
  # References ServiceClass and applies environment overrides
  # Creates actual deployment instances

status: {}                        # Empty status object
```

### WebApplicationClass CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WebApplicationClass
metadata:
  name: string                    # Required: WebApplicationClass name
  namespace: string               # Required: Project namespace
spec:
  # Template definition for web application deployments
  # Defines frontend-specific configurations and routing

status: {}                        # Empty status object
```

### WebApplicationBinding CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WebApplicationBinding
metadata:
  name: string                    # Required: WebApplicationBinding name
  namespace: string               # Required: Project namespace
spec:
  # Environment-specific web application binding
  # References WebApplicationClass with environment overrides

status: {}                        # Empty status object
```

### ScheduledTaskClass CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ScheduledTaskClass
metadata:
  name: string                    # Required: ScheduledTaskClass name
  namespace: string               # Required: Project namespace
spec:
  # Template definition for scheduled task deployments
  # Defines cron schedules and task execution patterns

status: {}                        # Empty status object
```

### ScheduledTaskBinding CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ScheduledTaskBinding
metadata:
  name: string                    # Required: ScheduledTaskBinding name
  namespace: string               # Required: Project namespace
spec:
  # Environment-specific scheduled task binding
  # References ScheduledTaskClass with schedule overrides

status: {}                        # Empty status object
```

### APIClass CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: APIClass
metadata:
  name: string                    # Required: APIClass name
  namespace: string               # Required: Project namespace
spec:
  # Template definition for API deployments
  # Defines API gateway policies, rate limiting, authentication

status: {}                        # Empty status object
```

### APIBinding CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: APIBinding
metadata:
  name: string                    # Required: APIBinding name
  namespace: string               # Required: Project namespace
spec:
  # Environment-specific API binding
  # References APIClass with environment-specific policies

status: {}                        # Empty status object
```

### Workload CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workload
metadata:
  name: string                    # Required: Workload name
  namespace: string               # Required: Project namespace
spec:
  # Connection Configuration
  connections:                    # Optional: Internal API connections
    "{connection-name}":          # Key-value pairs for connections
      inject:                     # Connection detail injection
        env:                      # Environment variables to inject
          - key: string           # Environment variable name
            value: string         # Environment variable value
        files:                    # Files to inject
          - path: string          # File path in container
            content: string       # File content
      target:                     # Connection target
        service: string           # Target service name
        port: integer             # Target service port

status: {}                        # Empty status object
```

### Release CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Release
metadata:
  name: string                    # Required: Release name
  namespace: string               # Required: Project namespace
spec:
  environmentName: string         # Required: Target environment (minLength: 1)
  interval: string                # Optional: Watch interval (default: 5m)
                                  # Pattern: ^([0-9]+(\.[0-9]+)?(ms|s|m|h))+$
  
  # Release configuration and resource manifests
  # Manages the actual Kubernetes resources in the target environment

status:
  # Release status tracking
  conditions:                     # Standard Kubernetes conditions
    - type: string
      status: enum                # "True" | "False" | "Unknown"
      reason: string
      message: string
      lastTransitionTime: string
```

### DeployableArtifact CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: DeployableArtifact
metadata:
  name: string                    # Required: DeployableArtifact name
  namespace: string               # Required: Project namespace
spec:
  # Configuration parameters for the deployable artifact
  configuration:                  # Application runtime configuration
    application:                  # Application runtime parameters
      args:                       # Optional: Command line arguments
        - string
      env:                        # Optional: Environment variables
        - name: string
          value: string
      ports:                      # Optional: Container ports
        - containerPort: integer  # Port number
          name: string            # Port name
          protocol: string        # Protocol (TCP/UDP)
      resources:                  # Optional: Resource requirements
        requests:
          cpu: string
          memory: string
        limits:
          cpu: string
          memory: string
  
  # Artifact Source
  source:                         # Source of the deployable artifact
    image:                        # Container image information
      repository: string          # Image repository
      tag: string                 # Image tag
      digest: string              # Image digest for immutable reference
    build:                        # Build information (if built from source)
      buildRef: string            # Reference to Build that created this artifact
      commitSHA: string           # Git commit SHA
      buildTimestamp: string      # When the build was completed

status:
  # Artifact status
  conditions:                     # Standard Kubernetes conditions
    - type: string
      status: enum                # "True" | "False" | "Unknown"
      reason: string
      message: string
      lastTransitionTime: string
  observedGeneration: integer
```

### Endpoint CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Endpoint
metadata:
  name: string                    # Required: Endpoint name
  namespace: string               # Required: Project namespace
spec:
  # Backend Configuration
  backendRef:                     # Required: Reference to backend service
    name: string                  # Backend service name
    port: integer                 # Backend service port
    namespace: string             # Backend service namespace
  
  # Endpoint Configuration
  protocol: enum                  # Optional: Protocol ("HTTP" | "HTTPS" | "TCP" | "UDP")
  path: string                    # Optional: URL path for HTTP/HTTPS endpoints (default: "/")
  
  # Traffic Management
  traffic:                        # Optional: Traffic management configuration
    weight: integer               # Traffic weight for load balancing
    canary:                       # Canary deployment configuration
      enabled: boolean            # Enable canary deployment
      percentage: integer         # Percentage of traffic to canary (0-100)
  
  # Security Configuration
  security:                       # Optional: Security configuration
    tls:                          # TLS configuration
      enabled: boolean            # Enable TLS termination
      secretName: string          # TLS certificate secret
    authentication:               # Authentication configuration
      required: boolean           # Require authentication
      methods:                    # Authentication methods
        - enum                    # "JWT" | "OAuth2" | "BasicAuth"

status:
  address: string                 # Endpoint address/URL
  conditions:                     # Standard Kubernetes conditions
    - type: string
      status: enum                # "True" | "False" | "Unknown"
      reason: string
      message: string
      lastTransitionTime: string
```

## Configuration Management

### ConfigurationGroup CRD Schema

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ConfigurationGroup
metadata:
  name: string                    # Required: ConfigurationGroup name
  namespace: string               # Required: Project namespace
spec:
  # Configuration Parameters
  configurations:                 # Required: Configuration parameters
    - key: string                 # Required: Configuration parameter key
      values:                     # Required: Configuration values
        - environment: string     # Target environment (mutually exclusive with environmentGroupRef)
          environmentGroupRef: string # Target environment group (mutually exclusive with environment)
          value: string           # Configuration value (mutually exclusive with vaultKey)
          vaultKey: string        # Vault secret key (mutually exclusive with value)
  
  # Environment Groups
  environmentGroups:              # Optional: Environment groups definition
    - name: string                # Required: Environment group name
      environments:               # Required: List of environments in group
        - string
  
  scope: {}                       # Optional: Configuration scope (default: {})

status:
  conditions:                     # Standard Kubernetes conditions
    - type: string
      status: enum
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
```

## Short Names and Categories

OpenChoreo resources support kubectl short names for convenience:

```bash
# Organizations
kubectl get org,orgs

# Projects  
kubectl get proj,projs

# Environments
kubectl get env,envs

# DataPlanes
kubectl get dp,dps

# DeploymentPipelines
kubectl get deppipe,deppipes

# Component
kubectl get components

# Build
kubectl get builds

# DeploymentTracks
kubectl get deploymenttracks

# DeployableArtifacts
kubectl get deployableartifacts

# ConfigurationGroups
kubectl get configgrp
```

---

## Schema Updates

This schema reference reflects the actual OpenChoreo v0.2.0 CRD definitions. For the latest schema definitions, see:

- **CRD Definitions**: [GitHub Repository](https://github.com/openchoreo/openchoreo/tree/main/config/crd)
- **Resource Reference Guide**: [Complete Resource Guide](https://github.com/openchoreo/openchoreo/blob/main/docs/resource-kind-reference-guide.md)
