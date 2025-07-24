---
layout: docs
title: Configuration Schema
---

# Configuration Schema

This reference provides the complete schema for all OpenChoreo configuration options, including Custom Resource Definitions (CRDs), Helm values, and environment variables.

## Component Configuration

### Component CRD Schema

```yaml
apiVersion: choreo.dev/v1
kind: Component
metadata:
  name: string                    # Required: Component name (DNS-1123 compliant)
  namespace: string               # Optional: Kubernetes namespace (defaults to project namespace)
  labels:
    choreo.dev/project: string    # Automatically set by project controller
    choreo.dev/environment: string # Set based on deployment environment
  annotations:
    choreo.dev/description: string # Human-readable description
spec:
  # Core Configuration
  type: enum                      # Required: "service" | "worker" | "scheduled"
  runtime: enum                   # Required: "go" | "nodejs" | "python" | "java" | "dotnet"
  
  # Source Configuration
  source:
    git:
      repository: string          # Required: Git repository URL
      branch: string              # Optional: Git branch (default: "main")
      path: string                # Optional: Path within repository (default: "/")
      auth:                       # Optional: Git authentication
        secretName: string        # Reference to git credentials secret
    image:                        # Alternative to git source
      repository: string          # Container image repository
      tag: string                 # Image tag (default: "latest")
      pullPolicy: enum            # "Always" | "IfNotPresent" | "Never"
      pullSecrets:                # Optional: Image pull secrets
        - name: string
  
  # Build Configuration
  build:
    enabled: boolean              # Optional: Enable building from source (default: true)
    buildpacks:
      enabled: boolean            # Optional: Use Cloud Native Buildpacks (default: true)
      builder: string             # Optional: Custom builder image
      env:                        # Optional: Build-time environment variables
        - name: string
          value: string
    dockerfile:                   # Alternative to buildpacks
      path: string                # Path to Dockerfile (default: "./Dockerfile")
      context: string             # Build context (default: ".")
      args:                       # Optional: Build arguments
        - name: string
          value: string
  
  # Runtime Configuration
  replicas: integer               # Optional: Number of replicas (default: 1, min: 0, max: 100)
  resources:
    requests:
      cpu: string                 # Optional: CPU request (e.g., "100m", "0.1")
      memory: string              # Optional: Memory request (e.g., "128Mi", "1Gi")
      storage: string             # Optional: Storage request (e.g., "1Gi", "10Gi")
    limits:
      cpu: string                 # Optional: CPU limit
      memory: string              # Optional: Memory limit
      storage: string             # Optional: Storage limit
  
  # Environment Variables
  env:
    - name: string                # Required: Environment variable name
      value: string               # Optional: Direct value
      valueFrom:                  # Optional: Reference to secret/configmap
        secretKeyRef:
          name: string            # Secret name
          key: string             # Secret key
        configMapKeyRef:
          name: string            # ConfigMap name
          key: string             # ConfigMap key
        fieldRef:
          fieldPath: string       # Field reference (e.g., "metadata.name")
  
  # Network Configuration (for service type components)
  endpoints:
    - name: string                # Required: Endpoint name
      port: integer               # Required: Container port (1-65535)
      targetPort: integer         # Optional: Target port (defaults to port)
      protocol: enum              # Optional: "HTTP" | "HTTPS" | "TCP" | "UDP" (default: "HTTP")
      path: string                # Optional: URL path (default: "/")
      visibility: enum            # Optional: "public" | "internal" | "private" (default: "internal")
      health:
        path: string              # Optional: Health check path (default: "/health")
        initialDelaySeconds: integer # Optional: Initial delay (default: 30)
        periodSeconds: integer    # Optional: Check period (default: 10)
        timeoutSeconds: integer   # Optional: Check timeout (default: 5)
        successThreshold: integer # Optional: Success threshold (default: 1)
        failureThreshold: integer # Optional: Failure threshold (default: 3)
  
  # Persistence (for stateful components)
  persistence:
    enabled: boolean              # Optional: Enable persistent storage (default: false)
    size: string                  # Required if enabled: Storage size (e.g., "10Gi")
    storageClass: string          # Optional: Storage class name
    accessModes:                  # Optional: Access modes (default: ["ReadWriteOnce"])
      - enum                      # "ReadWriteOnce" | "ReadOnlyMany" | "ReadWriteMany"
    mountPath: string             # Required if enabled: Mount path in container
  
  # Scheduling Configuration
  scheduling:
    nodeSelector:                 # Optional: Node selection constraints
      key: value
    tolerations:                  # Optional: Pod tolerations
      - key: string
        operator: enum            # "Equal" | "Exists"
        value: string
        effect: enum              # "NoSchedule" | "PreferNoSchedule" | "NoExecute"
    affinity:                     # Optional: Pod affinity rules
      nodeAffinity: object
      podAffinity: object
      podAntiAffinity: object
  
  # Scaling Configuration
  scaling:
    horizontal:
      enabled: boolean            # Optional: Enable HPA (default: false)
      minReplicas: integer        # Optional: Minimum replicas (default: 1)
      maxReplicas: integer        # Optional: Maximum replicas (default: 10)
      targetCPUUtilization: integer # Optional: Target CPU % (default: 70)
      targetMemoryUtilization: integer # Optional: Target memory %
      metrics:                    # Optional: Custom metrics
        - type: string
          name: string
          targetValue: string
    vertical:
      enabled: boolean            # Optional: Enable VPA (default: false)
      updateMode: enum            # "Off" | "Initial" | "Recreation" | "Auto"

status:
  # Status fields are read-only and managed by the controller
  phase: enum                     # "Pending" | "Building" | "Running" | "Failed" | "Terminated"
  replicas: integer               # Current number of replicas
  readyReplicas: integer          # Number of ready replicas
  conditions:
    - type: string                # Condition type
      status: enum                # "True" | "False" | "Unknown"
      reason: string              # Reason code
      message: string             # Human-readable message
      lastTransitionTime: string  # RFC3339 timestamp
  endpoints:
    - name: string                # Endpoint name
      url: string                 # Accessible URL
      internal: boolean           # Whether internal-only
  observedGeneration: integer     # Last observed spec generation
```

## Project Configuration

### Project CRD Schema

```yaml
apiVersion: choreo.dev/v1
kind: Project
metadata:
  name: string                    # Required: Project name (DNS-1123 compliant)
  namespace: string               # Optional: Organization namespace
spec:
  description: string             # Optional: Project description
  
  # Project Metadata
  metadata:
    displayName: string           # Optional: Human-readable name
    tags:                         # Optional: Project tags
      - string
    owner: string                 # Optional: Project owner/team
    documentation: string         # Optional: Documentation URL
    repository: string            # Optional: Source repository URL
  
  # Default Configuration
  defaults:
    runtime: string               # Optional: Default runtime for components
    resources:                    # Optional: Default resource limits
      requests:
        cpu: string
        memory: string
      limits:
        cpu: string
        memory: string
    env:                          # Optional: Default environment variables
      - name: string
        value: string
  
  # Components
  components:
    - name: string                # Component name
      source: string              # Source path or reference
      type: string                # Component type override
      config:                     # Component-specific configuration
        key: value

status:
  phase: enum                     # "Active" | "Terminating" | "Failed"
  componentCount: integer         # Number of components in project
  conditions:
    - type: string
      status: enum
      reason: string
      message: string
      lastTransitionTime: string
```

## Environment Configuration

### Environment CRD Schema

```yaml
apiVersion: choreo.dev/v1
kind: Environment
metadata:
  name: string                    # Required: Environment name
  namespace: string               # Required: Project namespace
spec:
  type: enum                      # Required: "development" | "staging" | "production"
  
  # Resource Configuration
  resources:
    limits:                       # Optional: Environment-wide resource limits
      cpu: string                 # Total CPU limit for environment
      memory: string              # Total memory limit for environment
      storage: string             # Total storage limit for environment
      pods: integer               # Maximum number of pods
    requests:
      cpu: string                 # Reserved CPU for environment
      memory: string              # Reserved memory for environment
  
  # Network Configuration
  networking:
    isolation: enum               # Optional: "strict" | "relaxed" (default: "strict")
    allowedCIDRs:                 # Optional: External IP ranges allowed
      - string
    dnsConfig:                    # Optional: Custom DNS configuration
      nameservers:
        - string
      searches:
        - string
      options:
        - name: string
          value: string
  
  # Security Configuration
  security:
    podSecurityStandard: enum     # Optional: "privileged" | "baseline" | "restricted"
    serviceAccountName: string    # Optional: Custom service account
    imagePullSecrets:             # Optional: Image pull secrets
      - name: string
    secrets:                      # Optional: Environment-specific secrets
      - name: string
        data:
          key: value
  
  # Component Overrides
  componentOverrides:
    - name: string                # Component name
      replicas: integer           # Override replica count
      resources:                  # Override resource limits
        requests:
          cpu: string
          memory: string
        limits:
          cpu: string
          memory: string
      env:                        # Additional environment variables
        - name: string
          value: string

status:
  phase: enum                     # "Active" | "Terminating" | "Failed"
  allocatedResources:             # Currently allocated resources
    cpu: string
    memory: string
    storage: string
  conditions:
    - type: string
      status: enum
      reason: string
      message: string
      lastTransitionTime: string
```

## Data Plane Configuration

### DataPlane CRD Schema

```yaml
apiVersion: choreo.dev/v1
kind: DataPlane
metadata:
  name: string                    # Required: Data plane name
spec:
  type: enum                      # Required: "kubernetes" | "serverless" | "edge"
  
  # Kubernetes Configuration
  kubernetes:
    version: string               # Optional: Kubernetes version (default: latest supported)
    provider: enum                # Optional: "aws" | "gcp" | "azure" | "digital-ocean" | "self-managed"
    region: string                # Optional: Cloud provider region
    
    # Node Groups
    nodeGroups:
      - name: string              # Required: Node group name
        instanceType: string      # Required: Instance type/size
        minSize: integer          # Optional: Minimum nodes (default: 1)
        maxSize: integer          # Optional: Maximum nodes (default: 10)
        desiredSize: integer      # Optional: Desired nodes (default: 3)
        labels:                   # Optional: Node labels
          key: value
        taints:                   # Optional: Node taints
          - key: string
            value: string
            effect: enum          # "NoSchedule" | "PreferNoSchedule" | "NoExecute"
        userData: string          # Optional: User data script
    
    # Networking
    networking:
      vpcCIDR: string             # Optional: VPC CIDR block (default: "10.0.0.0/16")
      subnets:                    # Optional: Subnet configuration
        - name: string
          cidr: string
          zone: string
          type: enum              # "public" | "private"
      serviceCIDR: string         # Optional: Service CIDR (default: "10.96.0.0/12")
      podCIDR: string             # Optional: Pod CIDR (default: "10.244.0.0/16")
    
    # Add-ons
    addons:
      cilium:
        enabled: boolean          # Optional: Enable Cilium CNI (default: true)
        version: string           # Optional: Cilium version
        features:
          hubble: boolean         # Optional: Enable Hubble observability
          encryption: boolean     # Optional: Enable encryption
      prometheus:
        enabled: boolean          # Optional: Enable Prometheus (default: true)
        retention: string         # Optional: Metrics retention period
        storage: string           # Optional: Storage size for Prometheus
      grafana:
        enabled: boolean          # Optional: Enable Grafana (default: true)
        adminPassword: string     # Optional: Admin password (auto-generated if not set)

status:
  phase: enum                     # "Provisioning" | "Active" | "Updating" | "Deleting" | "Failed"
  endpoint: string                # Kubernetes API endpoint
  version: string                 # Current Kubernetes version
  nodeGroups:
    - name: string
      status: enum                # "Active" | "Updating" | "Failed"
      nodes: integer              # Current node count
  conditions:
    - type: string
      status: enum
      reason: string
      message: string
      lastTransitionTime: string
```

## Helm Configuration

### OpenChoreo Helm Chart Values

```yaml
# Global configuration
global:
  imageRegistry: string           # Optional: Global image registry (default: "registry.openchoreo.dev")
  imagePullSecrets:               # Optional: Global image pull secrets
    - name: string
  storageClass: string            # Optional: Global storage class

# Control Plane Configuration
controlPlane:
  # Controller Configuration
  controller:
    image:
      repository: string          # Controller image repository
      tag: string                 # Controller image tag
      pullPolicy: enum            # Image pull policy
    replicas: integer             # Number of controller replicas (default: 2)
    resources:
      requests:
        cpu: string               # CPU request (default: "100m")
        memory: string            # Memory request (default: "128Mi")
      limits:
        cpu: string               # CPU limit (default: "500m")
        memory: string            # Memory limit (default: "512Mi")
    
    # Controller Settings
    config:
      logLevel: enum              # "debug" | "info" | "warn" | "error" (default: "info")
      metricsAddr: string         # Metrics server address (default: ":8080")
      healthProbeAddr: string     # Health probe address (default: ":8081")
      leaderElection: boolean     # Enable leader election (default: true)
      reconcileTimeout: string    # Reconciliation timeout (default: "10m")
      maxConcurrentReconciles: integer # Max concurrent reconciliations (default: 1)
  
  # API Server Configuration
  apiServer:
    enabled: boolean              # Enable API server (default: true)
    image:
      repository: string
      tag: string
      pullPolicy: enum
    replicas: integer             # Number of API server replicas (default: 2)
    service:
      type: enum                  # "ClusterIP" | "NodePort" | "LoadBalancer"
      port: integer               # Service port (default: 443)
      annotations:                # Service annotations
        key: value
    
    # TLS Configuration
    tls:
      enabled: boolean            # Enable TLS (default: true)
      secretName: string          # TLS secret name
      certManager:
        enabled: boolean          # Use cert-manager for certificates
        issuer: string            # Certificate issuer name
    
    # Authentication
    auth:
      enabled: boolean            # Enable authentication (default: true)
      providers:
        oidc:
          enabled: boolean        # Enable OIDC
          issuerURL: string       # OIDC issuer URL
          clientID: string        # OIDC client ID
          clientSecret: string    # OIDC client secret
        github:
          enabled: boolean        # Enable GitHub auth
          organization: string    # GitHub organization
          team: string            # GitHub team
        ldap:
          enabled: boolean        # Enable LDAP auth
          server: string          # LDAP server URL
          baseDN: string          # Base DN for searches

# Data Plane Configuration
dataPlane:
  # Default data plane for single-cluster deployments
  default:
    enabled: boolean              # Create default data plane (default: true)
    name: string                  # Data plane name (default: "default")
    nodeGroups:
      - name: string
        instanceType: string
        minSize: integer
        maxSize: integer

# Networking Configuration
networking:
  # Service Mesh
  serviceMesh:
    enabled: boolean              # Enable service mesh (default: true)
    provider: enum                # "istio" | "linkerd" (default: "istio")
    istio:
      version: string             # Istio version
      values:                     # Istio Helm values override
        key: value
  
  # Ingress
  ingress:
    enabled: boolean              # Enable ingress (default: true)
    className: string             # Ingress class name
    controller: enum              # "nginx" | "envoy" | "traefik"
    annotations:                  # Ingress annotations
      key: value

# Observability Configuration
observability:
  # Metrics
  metrics:
    enabled: boolean              # Enable metrics collection (default: true)
    prometheus:
      enabled: boolean            # Install Prometheus (default: true)
      retention: string           # Metrics retention (default: "30d")
      storage: string             # Storage size (default: "50Gi")
      resources:
        requests:
          cpu: string
          memory: string
        limits:
          cpu: string
          memory: string
    
    # Grafana
    grafana:
      enabled: boolean            # Install Grafana (default: true)
      adminPassword: string       # Admin password
      datasources:                # Additional datasources
        - name: string
          type: string
          url: string
  
  # Logging  
  logging:
    enabled: boolean              # Enable log collection (default: true)
    fluentBit:
      enabled: boolean            # Install Fluent Bit (default: true)
      config:                     # Fluent Bit configuration
        inputs: string
        filters: string
        outputs: string
    opensearch:
      enabled: boolean            # Install OpenSearch (default: true)
      replicas: integer           # Number of OpenSearch nodes
      storage: string             # Storage per node
      resources:
        requests:
          cpu: string
          memory: string
        limits:
          cpu: string
          memory: string
  
  # Tracing
  tracing:
    enabled: boolean              # Enable distributed tracing (default: true)
    jaeger:
      enabled: boolean            # Install Jaeger (default: true)
      strategy: enum              # "all-in-one" | "production"
      storage: string             # Storage backend ("memory" | "elasticsearch")

# Security Configuration
security:
  # Pod Security
  podSecurityStandards:
    enforced: boolean             # Enforce pod security standards (default: true)
    level: enum                   # "privileged" | "baseline" | "restricted"
  
  # Network Policies
  networkPolicies:
    enabled: boolean              # Enable default network policies (default: true)
    defaultDeny: boolean          # Default deny all traffic (default: true)
  
  # RBAC
  rbac:
    enabled: boolean              # Create RBAC resources (default: true)
    aggregateClusterRoles: boolean # Aggregate to default cluster roles

# Storage Configuration
storage:
  # Default Storage Class
  defaultStorageClass:
    enabled: boolean              # Create default storage class (default: true)
    name: string                  # Storage class name
    provisioner: string           # Storage provisioner
    parameters:                   # Storage parameters
      key: value
    reclaimPolicy: enum           # "Retain" | "Delete"
    volumeBindingMode: enum       # "Immediate" | "WaitForFirstConsumer"

# Backup Configuration
backup:
  enabled: boolean                # Enable backup (default: false)
  velero:
    enabled: boolean              # Install Velero (default: true if backup enabled)
    provider: enum                # "aws" | "gcp" | "azure" | "minio"
    bucket: string                # Backup bucket name
    credentials:                  # Provider credentials
      secretName: string
    schedule: string              # Backup schedule (cron format)
    retention: string             # Backup retention period
```

## Environment Variables

### Controller Environment Variables

```bash
# Core Configuration
CHOREO_NAMESPACE="openchoreo-system"           # Controller namespace
CHOREO_METRICS_ADDR=":8080"                   # Metrics server address
CHOREO_HEALTH_PROBE_ADDR=":8081"              # Health probe address
CHOREO_LEADER_ELECTION="true"                 # Enable leader election
CHOREO_LOG_LEVEL="info"                       # Log level (debug|info|warn|error)

# Reconciliation Configuration
CHOREO_RECONCILE_TIMEOUT="10m"                # Reconciliation timeout
CHOREO_MAX_CONCURRENT_RECONCILES="1"          # Max concurrent reconciliations
CHOREO_RESYNC_PERIOD="1h"                     # Controller resync period

# Feature Flags
CHOREO_ENABLE_WEBHOOKS="true"                 # Enable admission webhooks
CHOREO_ENABLE_METRICS="true"                  # Enable metrics collection
CHOREO_ENABLE_TRACING="false"                 # Enable distributed tracing
CHOREO_ENABLE_PROFILING="false"               # Enable profiling endpoints

# Integration Configuration
CHOREO_DEFAULT_REGISTRY="registry.openchoreo.dev"  # Default image registry
CHOREO_BUILDPACKS_BUILDER="paketobuildpacks/builder:base"  # Default builder
CHOREO_SERVICE_MESH_PROVIDER="istio"          # Service mesh provider
CHOREO_INGRESS_CLASS="nginx"                  # Default ingress class

# Security Configuration
CHOREO_ENABLE_RBAC="true"                     # Enable RBAC
CHOREO_ENABLE_PSS="true"                      # Enable Pod Security Standards
CHOREO_PSS_LEVEL="baseline"                   # Pod Security Standard level
CHOREO_ENABLE_NETWORK_POLICIES="true"        # Enable network policies

# Observability Configuration
CHOREO_PROMETHEUS_ENDPOINT="http://prometheus:9090"  # Prometheus endpoint
CHOREO_JAEGER_ENDPOINT="http://jaeger:14268"         # Jaeger endpoint
CHOREO_OPENSEARCH_ENDPOINT="http://opensearch:9200" # OpenSearch endpoint
```

### CLI Environment Variables

```bash
# Authentication
CHOREO_TOKEN=""                               # Authentication token
CHOREO_CONFIG_PATH="$HOME/.choreo/config"    # Config file path
CHOREO_CONTEXT=""                             # Active context

# API Configuration
CHOREO_API_SERVER="https://api.openchoreo.dev"  # API server URL
CHOREO_API_TIMEOUT="30s"                     # API request timeout
CHOREO_API_RETRY_COUNT="3"                   # API retry count

# Output Configuration
CHOREO_OUTPUT_FORMAT="table"                 # Output format (table|json|yaml)
CHOREO_NO_COLOR="false"                      # Disable colored output
CHOREO_LOG_LEVEL="info"                      # CLI log level

# Development Configuration
CHOREO_DEV_MODE="false"                      # Enable development mode
CHOREO_DEBUG="false"                         # Enable debug output
CHOREO_TRACE="false"                         # Enable request tracing
```

## Validation Rules

### Component Validation

```yaml
# Name validation
metadata.name:
  pattern: "^[a-z0-9]([-a-z0-9]*[a-z0-9])?$"
  maxLength: 253

# Resource limits validation
spec.resources.requests.cpu:
  pattern: "^[0-9]+m$|^[0-9]+(\\.[0-9]+)?$"
  examples: ["100m", "0.5", "2"]

spec.resources.requests.memory:
  pattern: "^[0-9]+(Mi|Gi|Ti)$"
  examples: ["128Mi", "1Gi", "2Ti"]

# Port validation
spec.endpoints[*].port:
  minimum: 1
  maximum: 65535
  exclusions: [22, 80, 443]  # Reserved ports

# Replica validation
spec.replicas:
  minimum: 0
  maximum: 100
  
# Environment variable validation  
spec.env[*].name:
  pattern: "^[A-Z][A-Z0-9_]*$"
  examples: ["DATABASE_URL", "API_KEY"]
```

### Cross-Resource Validation

```yaml
# Component-Environment consistency
- component.metadata.namespace == environment.metadata.namespace
- component.spec.type in environment.spec.allowedComponentTypes
- sum(component.spec.resources.requests) <= environment.spec.resources.limits

# Project-Component consistency  
- component.metadata.labels["choreo.dev/project"] == project.metadata.name
- component.metadata.namespace == project.spec.namespace
```

---

## Schema Updates

This schema reference is updated with each OpenChoreo release. For the latest schema definitions, see:

- **CRD Definitions**: [GitHub Repository](https://github.com/openchoreo/openchoreo/tree/main/config/crd)
- **Helm Chart**: [Helm Repository](https://charts.openchoreo.dev)
- **OpenAPI Spec**: [API Documentation](https://api.openchoreo.dev/swagger)

## Validation Tools

Validate your configurations using:

```bash
# Validate component configuration
choreo validate component ./my-component.yaml

# Validate project configuration  
choreo validate project ./my-project.yaml

# Validate Helm values
helm lint ./my-values.yaml
```