---
title: Resource Limits & Quotas
unlisted: true
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

