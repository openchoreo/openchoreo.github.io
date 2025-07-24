---
layout: docs
title: Resource Limits & Quotas
---

# Resource Limits & Quotas

This document outlines OpenChoreo's resource constraints, sizing guidelines, and quota management to help you plan and optimize your platform deployment.

## Platform Resource Requirements

### Control Plane Requirements

#### Minimum Configuration
**Single Control Plane Node**:
- **CPU**: 4 cores (2 cores minimum)
- **Memory**: 8 GB RAM (4 GB minimum)
- **Storage**: 50 GB SSD (20 GB minimum)
- **Network**: 1 Gbps (100 Mbps minimum)

#### Recommended Configuration
**High Availability Setup**:
- **CPU**: 8 cores per node
- **Memory**: 16 GB RAM per node
- **Storage**: 100 GB SSD per node
- **Network**: 10 Gbps
- **Nodes**: 3 nodes for HA

#### Production Configuration
**Enterprise Scale**:
- **CPU**: 16 cores per node
- **Memory**: 32 GB RAM per node
- **Storage**: 200 GB NVMe SSD per node
- **Network**: 25 Gbps
- **Nodes**: 3-5 nodes with load balancing

### Data Plane Requirements

#### Per-Node Recommendations
```yaml
# Small Environment (Development/Testing)
nodes:
  count: 3
  specifications:
    cpu: 4 cores
    memory: 16 GB
    storage: 100 GB
    max_pods: 50

# Medium Environment (Staging/Small Production)  
nodes:
  count: 5-10
  specifications:
    cpu: 8 cores
    memory: 32 GB
    storage: 200 GB
    max_pods: 100

# Large Environment (Production)
nodes:
  count: 10-50
  specifications:
    cpu: 16+ cores
    memory: 64+ GB
    storage: 500+ GB
    max_pods: 200
```

## Component Resource Limits

### Default Resource Specifications

#### CPU Limits
```yaml
# Default CPU configurations per component type
service_components:
  requests:
    min: "100m"      # 0.1 CPU cores
    default: "200m"  # 0.2 CPU cores
    max: "4000m"     # 4 CPU cores
  limits:
    min: "200m"      # 0.2 CPU cores
    default: "500m"  # 0.5 CPU cores
    max: "8000m"     # 8 CPU cores

worker_components:
  requests:
    min: "200m"      # 0.2 CPU cores
    default: "500m"  # 0.5 CPU cores
    max: "8000m"     # 8 CPU cores
  limits:
    min: "500m"      # 0.5 CPU cores
    default: "1000m" # 1 CPU core
    max: "16000m"    # 16 CPU cores

scheduled_components:
  requests:
    min: "100m"      # 0.1 CPU cores
    default: "200m"  # 0.2 CPU cores
    max: "2000m"     # 2 CPU cores
  limits:
    min: "200m"      # 0.2 CPU cores
    default: "1000m" # 1 CPU core
    max: "4000m"     # 4 CPU cores
```

#### Memory Limits
```yaml
# Default memory configurations per component type
service_components:
  requests:
    min: "64Mi"      # 64 MiB
    default: "128Mi" # 128 MiB
    max: "8Gi"       # 8 GiB
  limits:
    min: "128Mi"     # 128 MiB
    default: "256Mi" # 256 MiB
    max: "16Gi"      # 16 GiB

worker_components:
  requests:
    min: "128Mi"     # 128 MiB
    default: "256Mi" # 256 MiB
    max: "16Gi"      # 16 GiB
  limits:
    min: "256Mi"     # 256 MiB
    default: "512Mi" # 512 MiB
    max: "32Gi"      # 32 GiB

scheduled_components:
  requests:
    min: "64Mi"      # 64 MiB
    default: "128Mi" # 128 MiB
    max: "4Gi"       # 4 GiB
  limits:
    min: "128Mi"     # 128 MiB
    default: "512Mi" # 512 MiB
    max: "8Gi"       # 8 GiB
```

### Storage Limits

#### Persistent Volume Sizes
```yaml
# Storage configurations per use case
database_storage:
  min: "1Gi"         # 1 GiB
  default: "10Gi"    # 10 GiB
  max: "1Ti"         # 1 TiB

cache_storage:
  min: "512Mi"       # 512 MiB
  default: "5Gi"     # 5 GiB
  max: "100Gi"       # 100 GiB

file_storage:
  min: "1Gi"         # 1 GiB
  default: "50Gi"    # 50 GiB
  max: "10Ti"        # 10 TiB

backup_storage:
  min: "10Gi"        # 10 GiB
  default: "100Gi"   # 100 GiB
  max: "100Ti"       # 100 TiB
```

#### Ephemeral Storage
```yaml
# Temporary storage limits
components:
  requests:
    min: "1Gi"       # 1 GiB
    default: "5Gi"   # 5 GiB
    max: "50Gi"      # 50 GiB
  limits:
    min: "2Gi"       # 2 GiB
    default: "10Gi"  # 10 GiB
    max: "100Gi"     # 100 GiB
```

## Environment Quotas

### Resource Quota Templates

#### Development Environment
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: development-quota
spec:
  hard:
    # Compute Resources
    requests.cpu: "10"           # 10 CPU cores
    requests.memory: "20Gi"      # 20 GiB memory
    limits.cpu: "20"             # 20 CPU cores
    limits.memory: "40Gi"        # 40 GiB memory
    
    # Storage Resources
    requests.storage: "100Gi"    # 100 GiB storage
    persistentvolumeclaims: "10" # 10 PVCs
    
    # Object Counts
    pods: "50"                   # 50 pods
    services: "20"               # 20 services
    secrets: "20"                # 20 secrets
    configmaps: "20"             # 20 configmaps
    
    # OpenChoreo Resources
    components.choreo.dev: "10"  # 10 components
```

#### Staging Environment
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: staging-quota
spec:
  hard:
    # Compute Resources
    requests.cpu: "30"           # 30 CPU cores
    requests.memory: "60Gi"      # 60 GiB memory
    limits.cpu: "60"             # 60 CPU cores
    limits.memory: "120Gi"       # 120 GiB memory
    
    # Storage Resources
    requests.storage: "500Gi"    # 500 GiB storage
    persistentvolumeclaims: "30" # 30 PVCs
    
    # Object Counts
    pods: "100"                  # 100 pods
    services: "50"               # 50 services
    secrets: "50"                # 50 secrets
    configmaps: "50"             # 50 configmaps
    
    # OpenChoreo Resources
    components.choreo.dev: "25"  # 25 components
```

#### Production Environment
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: production-quota
spec:
  hard:
    # Compute Resources
    requests.cpu: "100"          # 100 CPU cores
    requests.memory: "200Gi"     # 200 GiB memory
    limits.cpu: "200"            # 200 CPU cores
    limits.memory: "400Gi"       # 400 GiB memory
    
    # Storage Resources
    requests.storage: "2Ti"      # 2 TiB storage
    persistentvolumeclaims: "100" # 100 PVCs
    
    # Object Counts
    pods: "500"                  # 500 pods
    services: "200"              # 200 services
    secrets: "200"               # 200 secrets
    configmaps: "200"            # 200 configmaps
    
    # OpenChoreo Resources
    components.choreo.dev: "100" # 100 components
```

## Network Limits

### Connection Limits

#### Per-Component Limits
```yaml
# Network connection configurations
endpoints:
  max_per_component: 10        # Maximum endpoints per component
  max_connections: 10000       # Maximum concurrent connections
  timeout: "30s"               # Connection timeout
  keep_alive: "60s"            # Keep-alive timeout

ingress:
  max_rules: 100               # Maximum ingress rules per component
  max_hosts: 20                # Maximum hostnames per component
  max_paths: 50                # Maximum paths per host
  rate_limit: "1000/min"       # Requests per minute per IP

load_balancer:
  max_backends: 50             # Maximum backend servers
  health_check_interval: "10s" # Health check frequency
  health_check_timeout: "5s"   # Health check timeout
  max_retries: 3               # Maximum retry attempts
```

#### Bandwidth Limits
```yaml
# Network bandwidth configurations per environment
development:
  ingress_bandwidth: "100Mbps"  # Inbound bandwidth limit
  egress_bandwidth: "100Mbps"   # Outbound bandwidth limit
  inter_component: "1Gbps"      # Inter-component bandwidth

staging:
  ingress_bandwidth: "500Mbps"  # Inbound bandwidth limit
  egress_bandwidth: "500Mbps"   # Outbound bandwidth limit
  inter_component: "5Gbps"      # Inter-component bandwidth

production:
  ingress_bandwidth: "10Gbps"   # Inbound bandwidth limit
  egress_bandwidth: "10Gbps"    # Outbound bandwidth limit
  inter_component: "25Gbps"     # Inter-component bandwidth
```

## API Rate Limits

### OpenChoreo API Limits

#### Per-User Limits
```yaml
# API rate limits per user
api_limits:
  requests_per_minute: 60      # 60 requests per minute
  requests_per_hour: 3600      # 3600 requests per hour
  requests_per_day: 86400      # 86400 requests per day
  
  # Burst limits
  burst_requests: 10           # 10 burst requests
  burst_window: "1m"           # 1-minute burst window

# Resource-specific limits  
resource_limits:
  component_creates: "10/min"  # 10 component creates per minute
  component_updates: "30/min"  # 30 component updates per minute
  component_deletes: "5/min"   # 5 component deletes per minute
  
  build_triggers: "20/hour"    # 20 build triggers per hour
  deployment_triggers: "50/hour" # 50 deployment triggers per hour
```

#### Service Account Limits
```yaml
# API limits for service accounts (CI/CD, automation)
service_account_limits:
  requests_per_minute: 300     # 300 requests per minute
  requests_per_hour: 18000     # 18000 requests per hour
  requests_per_day: 432000     # 432000 requests per day
  
  # Higher burst limits for automation
  burst_requests: 50           # 50 burst requests
  burst_window: "1m"           # 1-minute burst window
```

### Kubernetes API Limits

#### QPS (Queries Per Second) Limits
```yaml
# Kubernetes API client configuration
kubernetes_client:
  qps: 50                      # 50 queries per second
  burst: 100                   # 100 burst queries
  timeout: "30s"               # API request timeout

# Per-resource limits
resource_qps:
  pods: 100                    # 100 pod operations per second
  services: 50                 # 50 service operations per second
  configmaps: 50               # 50 configmap operations per second
  secrets: 25                  # 25 secret operations per second
```

## Scaling Limits

### Horizontal Scaling

#### Component Replica Limits
```yaml
# Horizontal scaling configurations
horizontal_scaling:
  service_components:
    min_replicas: 1            # Minimum replicas
    max_replicas: 100          # Maximum replicas
    default_replicas: 2        # Default replicas
    target_cpu: 70             # Target CPU utilization %
    target_memory: 80          # Target memory utilization %
    scale_up_period: "3m"      # Scale up evaluation period
    scale_down_period: "5m"    # Scale down evaluation period

  worker_components:
    min_replicas: 0            # Can scale to zero
    max_replicas: 50           # Maximum replicas
    default_replicas: 1        # Default replicas
    target_cpu: 80             # Target CPU utilization %
    target_memory: 85          # Target memory utilization %

  scheduled_components:
    min_replicas: 0            # Can scale to zero
    max_replicas: 10           # Maximum replicas
    default_replicas: 1        # Default replicas
```

#### Cluster Scaling
```yaml
# Node scaling configurations
cluster_scaling:
  node_groups:
    min_nodes: 1               # Minimum nodes per group
    max_nodes: 100             # Maximum nodes per group
    scale_up_utilization: 70   # Scale up at 70% utilization
    scale_down_utilization: 30 # Scale down at 30% utilization
    scale_up_delay: "5m"       # Delay before scaling up
    scale_down_delay: "10m"    # Delay before scaling down
    
  total_cluster:
    max_nodes: 1000            # Maximum total nodes
    max_cpu: "10000"           # Maximum total CPU cores
    max_memory: "20Ti"         # Maximum total memory
```

## Build and Deployment Limits

### Build Constraints

#### Build Resource Limits
```yaml
# Build process resource constraints
build_limits:
  cpu: "4"                     # 4 CPU cores per build
  memory: "8Gi"                # 8 GiB memory per build
  timeout: "30m"               # 30-minute build timeout
  disk_space: "20Gi"           # 20 GiB disk space per build
  
  # Concurrent build limits
  concurrent_builds: 10        # 10 concurrent builds per cluster
  concurrent_per_project: 3    # 3 concurrent builds per project
  concurrent_per_user: 2       # 2 concurrent builds per user

# Build artifact limits
artifact_limits:
  image_size: "5Gi"            # Maximum container image size
  layer_count: 128             # Maximum image layers
  build_context: "1Gi"         # Maximum build context size
  cache_size: "10Gi"           # Maximum build cache size
```

#### Build Queue Limits
```yaml
# Build queue management
build_queue:
  max_queued: 100              # Maximum queued builds
  max_queued_per_project: 10   # Maximum queued per project
  max_queued_per_user: 5       # Maximum queued per user
  queue_timeout: "1h"          # Queue timeout
  priority_levels: 3           # Number of priority levels
```

### Deployment Constraints

#### Deployment Process Limits
```yaml
# Deployment resource constraints
deployment_limits:
  timeout: "20m"               # 20-minute deployment timeout
  rollback_timeout: "10m"      # 10-minute rollback timeout
  health_check_timeout: "5m"   # 5-minute health check timeout
  
  # Concurrent deployment limits
  concurrent_deployments: 20   # 20 concurrent deployments per cluster
  concurrent_per_environment: 5 # 5 concurrent per environment
  concurrent_per_project: 3    # 3 concurrent per project

# Rolling update constraints
rolling_update:
  max_unavailable: "25%"       # Maximum unavailable during update
  max_surge: "25%"             # Maximum surge during update
  revision_history: 10         # Keep 10 revision history
```

## Monitoring and Observability Limits

### Metrics Collection

#### Prometheus Limits
```yaml
# Prometheus resource and retention limits
prometheus:
  retention_time: "30d"        # 30-day metric retention
  retention_size: "100GB"      # 100 GB storage limit
  max_series: 10000000         # 10 million time series
  max_samples_per_query: 50000000 # 50 million samples per query
  query_timeout: "2m"          # 2-minute query timeout
  
  # Resource limits
  cpu: "4"                     # 4 CPU cores
  memory: "16Gi"               # 16 GiB memory
  storage: "500Gi"             # 500 GiB storage
```

#### Custom Metrics
```yaml
# Custom metrics limits per component
custom_metrics:
  max_metrics_per_component: 100 # 100 custom metrics per component
  max_labels_per_metric: 10    # 10 labels per metric
  max_label_value_length: 256  # 256 characters per label value
  scrape_interval: "15s"       # 15-second scrape interval
  scrape_timeout: "10s"        # 10-second scrape timeout
```

### Logging Limits

#### Log Collection and Storage
```yaml
# Logging resource constraints
logging:
  max_log_rate: "10MB/s"       # 10 MB/s log ingestion per component
  max_log_line_length: 32768   # 32 KB per log line
  retention_days: 30           # 30-day log retention
  index_retention_days: 7      # 7-day index retention
  
  # Storage limits
  total_storage: "1Ti"         # 1 TiB total log storage
  daily_storage: "50Gi"        # 50 GiB daily log storage
  
  # OpenSearch limits
  max_indices: 1000            # Maximum number of indices
  max_shards_per_index: 5      # Maximum shards per index
  max_docs_per_index: 10000000 # Maximum documents per index
```

### Tracing Limits

#### Distributed Tracing
```yaml
# Tracing collection and storage limits
tracing:
  max_spans_per_trace: 10000   # 10,000 spans per trace
  max_trace_duration: "1h"     # 1-hour maximum trace duration
  sampling_rate: 0.1           # 10% sampling rate
  retention_days: 7            # 7-day trace retention
  
  # Jaeger limits
  max_traces_per_query: 1000   # 1,000 traces per query
  max_lookback: "168h"         # 7-day maximum lookback
  
  # Resource limits
  cpu: "2"                     # 2 CPU cores
  memory: "4Gi"                # 4 GiB memory
  storage: "100Gi"             # 100 GiB storage
```

## Security and Compliance Limits

### Authentication and Authorization

#### Session and Token Limits
```yaml
# Authentication limits
authentication:
  max_sessions_per_user: 10    # 10 concurrent sessions per user
  session_timeout: "8h"        # 8-hour session timeout
  token_lifetime: "24h"        # 24-hour token lifetime
  refresh_token_lifetime: "30d" # 30-day refresh token lifetime
  
  # Failed authentication limits
  max_failed_attempts: 5       # 5 failed attempts before lockout
  lockout_duration: "15m"      # 15-minute lockout duration
  lockout_escalation: true     # Increase lockout duration on repeat
```

#### RBAC Limits
```yaml
# Role-based access control limits
rbac:
  max_roles_per_user: 20       # 20 roles per user
  max_permissions_per_role: 100 # 100 permissions per role
  max_users_per_organization: 1000 # 1,000 users per organization
  max_service_accounts: 100    # 100 service accounts per organization
  
  # Resource access limits
  max_projects_per_user: 50    # 50 projects per user
  max_environments_per_user: 100 # 100 environments per user
```

### Network Security

#### Network Policy Limits
```yaml
# Network security constraints
network_security:
  max_policies_per_namespace: 50 # 50 network policies per namespace
  max_rules_per_policy: 20     # 20 rules per network policy
  max_selectors_per_rule: 10   # 10 selectors per rule
  
  # Connection limits
  max_connections_per_pod: 1000 # 1,000 connections per pod
  connection_timeout: "30s"    # 30-second connection timeout
  idle_timeout: "5m"           # 5-minute idle timeout
```

## Quota Management

### Quota Enforcement

#### Soft vs Hard Limits
```yaml
# Quota enforcement levels
quotas:
  soft_limits:
    warning_threshold: 80      # Warn at 80% of quota
    notification_threshold: 90 # Notify at 90% of quota
    grace_period: "24h"        # 24-hour grace period
    
  hard_limits:
    enforcement: strict        # Strict enforcement
    override_allowed: false    # No override allowed
    escalation_required: true  # Require escalation for increases
```

#### Quota Monitoring
```yaml
# Quota monitoring and alerting
quota_monitoring:
  check_interval: "5m"         # Check quotas every 5 minutes
  alert_threshold: 85          # Alert at 85% quota usage
  critical_threshold: 95       # Critical alert at 95% usage
  
  # Alerting
  alert_channels:
    - email
    - slack
    - webhook
  escalation_levels: 3         # 3 escalation levels
```

### Resource Cleanup

#### Automatic Cleanup Policies
```yaml
# Resource cleanup configurations
cleanup_policies:
  # Completed builds
  completed_builds:
    retention: "7d"            # Keep for 7 days
    cleanup_interval: "1h"     # Clean up every hour
    
  # Failed builds
  failed_builds:
    retention: "3d"            # Keep for 3 days
    cleanup_interval: "6h"     # Clean up every 6 hours
    
  # Unused images
  unused_images:
    retention: "30d"           # Keep for 30 days
    cleanup_interval: "24h"    # Clean up daily
    
  # Temporary volumes
  temp_volumes:
    retention: "1d"            # Keep for 1 day
    cleanup_interval: "1h"     # Clean up every hour
```

## Sizing Guidelines

### Component Sizing Recommendations

#### By Application Type
```yaml
# Sizing recommendations by application type
web_applications:
  small:
    cpu: "200m"
    memory: "256Mi"
    replicas: 2
    storage: "5Gi"
    
  medium:
    cpu: "500m"
    memory: "512Mi"
    replicas: 3
    storage: "20Gi"
    
  large:
    cpu: "1000m"
    memory: "1Gi"
    replicas: 5
    storage: "100Gi"

api_services:
  small:
    cpu: "100m"
    memory: "128Mi"
    replicas: 2
    
  medium:
    cpu: "300m"
    memory: "256Mi"
    replicas: 3
    
  large:
    cpu: "500m"
    memory: "512Mi"
    replicas: 5

databases:
  small:
    cpu: "500m"
    memory: "1Gi"
    replicas: 1
    storage: "50Gi"
    
  medium:
    cpu: "1000m"
    memory: "2Gi"
    replicas: 1
    storage: "200Gi"
    
  large:
    cpu: "2000m"
    memory: "4Gi"
    replicas: 1
    storage: "1Ti"
```

#### By Traffic Patterns
```yaml
# Sizing based on expected traffic
low_traffic:          # < 1,000 requests/day
  cpu: "100m"
  memory: "128Mi"
  replicas: 1

medium_traffic:       # 1,000 - 100,000 requests/day
  cpu: "200m"
  memory: "256Mi"
  replicas: 2

high_traffic:         # 100,000 - 1,000,000 requests/day
  cpu: "500m"
  memory: "512Mi"
  replicas: 3-5

very_high_traffic:    # > 1,000,000 requests/day
  cpu: "1000m"
  memory: "1Gi"
  replicas: 5-20
```

## Monitoring Resource Usage

### Resource Monitoring Commands

```bash
# Check resource usage across environments
choreo resources usage --all-environments

# Monitor specific component resources
choreo component resources user-service --environment=production

# Check quota utilization
choreo quota status --project=ecommerce

# View resource trends
choreo metrics resources --timerange=24h --environment=production

# Check for resource constraints
choreo system health --check-resources
```

### Resource Optimization

```bash
# Get resource recommendations
choreo optimize resources --project=ecommerce

# Analyze resource waste
choreo resources analyze --identify-waste

# Right-size components
choreo component rightsize user-service --recommendations

# Check for over-provisioning
choreo resources audit --threshold=50
```

---

## Best Practices

### Resource Planning
1. **Start Small**: Begin with minimal resources and scale up based on actual usage
2. **Monitor Continuously**: Track resource usage patterns and trends
3. **Set Appropriate Quotas**: Use quotas to prevent resource exhaustion
4. **Plan for Growth**: Account for traffic growth in resource planning

### Performance Optimization
1. **Use Resource Requests**: Always set resource requests for predictable scheduling
2. **Set Resource Limits**: Prevent resource contention with appropriate limits
3. **Monitor Efficiency**: Track resource utilization efficiency
4. **Optimize Regularly**: Regularly review and optimize resource allocations

### Cost Management
1. **Right-size Resources**: Avoid over-provisioning resources
2. **Use Autoscaling**: Implement horizontal and vertical pod autoscaling
3. **Clean Up Unused Resources**: Regularly clean up unused resources
4. **Monitor Costs**: Track resource costs and optimize based on usage patterns

---

**Questions about resource limits?** Contact us at [support@openchoreo.dev](mailto:support@openchoreo.dev) or consult our [optimization guides](/docs/core-concepts/).