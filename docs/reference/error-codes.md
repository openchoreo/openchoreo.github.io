---
layout: docs
title: Error Code Reference
---

# Error Code Reference

This reference provides detailed information about OpenChoreo error codes, their causes, and resolution steps. All error codes follow the format `CHOREO-XXXX` where `XXXX` is a unique identifier.

## Error Code Categories

- **1000-1999**: Component-related errors
- **2000-2999**: Project-related errors  
- **3000-3999**: Environment-related errors
- **4000-4999**: Data plane-related errors
- **5000-5999**: Authentication/Authorization errors
- **6000-6999**: Network-related errors
- **7000-7999**: Storage-related errors
- **8000-8999**: Build/Deployment errors
- **9000-9999**: System/Internal errors

## Component Errors (1000-1999)

### CHOREO-1001: Component Validation Failed

**Description**: Component specification contains invalid configuration.

**Common Causes**:
- Invalid component name format
- Unsupported runtime specified
- Invalid resource limits
- Missing required fields

**Example Error**:
```
Component validation failed: spec.runtime 'php' is not supported. 
Supported runtimes: go, nodejs, python, java, dotnet
```

**Resolution Steps**:
1. **Check component name**: Must be DNS-1123 compliant (lowercase alphanumeric with hyphens)
2. **Verify runtime**: Use supported runtimes (go, nodejs, python, java, dotnet)
3. **Validate resources**: Ensure CPU/memory limits are properly formatted
4. **Required fields**: Ensure all required fields are present

```bash
# Validate component configuration
choreo validate component ./my-component.yaml

# Check supported runtimes
choreo runtime list
```

---

### CHOREO-1002: Component Build Failed

**Description**: Component build process encountered an error.

**Common Causes**:
- Source repository not accessible
- Build dependencies missing
- Dockerfile syntax errors
- Buildpack compatibility issues

**Example Error**:
```
Build failed for component 'user-service': failed to detect buildpack for runtime 'nodejs'. 
Ensure package.json exists in repository root.
```

**Resolution Steps**:
1. **Verify source access**: Ensure repository is accessible and credentials are correct
2. **Check build files**: Verify Dockerfile or buildpack-compatible files exist
3. **Review build logs**: Check detailed build logs for specific errors
4. **Update dependencies**: Ensure all build dependencies are available

```bash
# Check build logs
choreo logs build user-service

# Retry build
choreo build restart user-service

# Validate source repository
choreo source validate https://github.com/org/repo
```

---

### CHOREO-1003: Component Deployment Failed

**Description**: Component deployment to Kubernetes failed.

**Common Causes**:
- Insufficient cluster resources
- Image pull failures
- Invalid Kubernetes manifests
- RBAC permission issues

**Example Error**:
```
Deployment failed for component 'api-service': pods "api-service-7d4b9c8f-xyz" 
is forbidden: exceeds quota: compute-quota, requested: requests.memory=2Gi, 
used: requests.memory=8Gi, limited: requests.memory=10Gi
```

**Resolution Steps**:
1. **Check resource availability**: Verify cluster has sufficient CPU/memory
2. **Review resource requests**: Adjust component resource requirements
3. **Verify image access**: Ensure container images are accessible
4. **Check RBAC**: Verify service account permissions

```bash
# Check cluster resources
kubectl top nodes
kubectl describe quota -n <namespace>

# Review component status
choreo component status api-service

# Check pod events
kubectl get events -n <namespace> --sort-by=.metadata.creationTimestamp
```

---

### CHOREO-1004: Component Health Check Failed

**Description**: Component health checks are failing consistently.

**Common Causes**:
- Application startup issues
- Incorrect health check configuration
- Network connectivity problems
- Application bugs

**Example Error**:
```
Health check failed for component 'database': HTTP probe failed with status 503. 
Readiness probe failed: Get "http://10.244.1.5:5432/health": dial tcp 10.244.1.5:5432: 
connect: connection refused
```

**Resolution Steps**:
1. **Check application logs**: Review application startup and runtime logs
2. **Verify health endpoint**: Ensure health check path is correct and accessible
3. **Adjust timing**: Increase initial delay or timeout values
4. **Test connectivity**: Verify network connectivity to component

```bash
# Check component logs
choreo logs component database

# Test health endpoint
kubectl exec -it <pod-name> -- curl localhost:5432/health

# Update health check configuration
choreo component update database --health-path=/status --health-timeout=30s
```

---

## Project Errors (2000-2999)

### CHOREO-2001: Project Creation Failed

**Description**: Unable to create new project.

**Common Causes**:
- Project name conflicts
- Invalid project configuration
- Insufficient permissions
- Namespace creation failure

**Example Error**:
```
Project creation failed: project 'ecommerce' already exists in organization 'acme-corp'. 
Choose a different project name or delete the existing project.
```

**Resolution Steps**:
1. **Check name uniqueness**: Ensure project name is unique within organization
2. **Verify permissions**: Confirm user has project creation permissions
3. **Review configuration**: Validate project specification
4. **Check namespace**: Ensure target namespace exists and is accessible

```bash
# List existing projects
choreo project list

# Check permissions
choreo auth whoami

# Create project with different name
choreo project create ecommerce-v2 --description "E-commerce platform v2"
```

---

### CHOREO-2002: Component Dependency Loop

**Description**: Circular dependency detected between project components.

**Common Causes**:
- Component A depends on Component B, which depends on Component A
- Complex dependency chains forming loops
- Incorrect dependency configuration

**Example Error**:
```
Dependency loop detected in project 'microservices': 
user-service -> order-service -> payment-service -> user-service. 
Remove circular dependencies to proceed.
```

**Resolution Steps**:
1. **Analyze dependencies**: Review component dependency graph
2. **Break the loop**: Remove or restructure circular dependencies
3. **Use shared services**: Extract common functionality to shared components
4. **Implement async patterns**: Use event-driven communication to break synchronous loops

```bash
# Visualize dependencies
choreo project dependencies microservices --format graph

# Remove dependency
choreo component update user-service --remove-dependency payment-service

# Validate project structure
choreo project validate microservices
```

---

## Environment Errors (3000-3999)

### CHOREO-3001: Environment Resource Quota Exceeded

**Description**: Environment has exceeded its allocated resource limits.

**Common Causes**:
- Too many components in environment
- Components requesting more resources than available
- Resource limits set too low
- Resource leaks in applications

**Example Error**:
```
Environment 'production' resource quota exceeded: requested CPU 12 cores, 
memory 32Gi, but quota allows CPU 8 cores, memory 24Gi. 
Reduce resource requests or increase quota.
```

**Resolution Steps**:
1. **Review resource usage**: Check current resource allocation
2. **Optimize components**: Reduce resource requests where possible
3. **Increase quota**: Request higher resource limits for environment
4. **Scale down**: Reduce number of replicas or components

```bash
# Check environment resource usage
choreo environment resources production

# List components by resource usage
choreo component list --sort-by=resources --environment=production

# Update environment quota
choreo environment update production --cpu-limit=16 --memory-limit=48Gi
```

---

### CHOREO-3002: Environment Network Policy Violation

**Description**: Network communication blocked by environment security policies.

**Common Causes**:
- Strict network policies blocking required traffic
- Missing network policy exceptions
- Incorrect component labeling
- Cross-environment communication attempts

**Example Error**:
```
Network policy violation in environment 'staging': component 'frontend' 
cannot connect to 'database' on port 5432. 
Update network policies to allow required connections.
```

**Resolution Steps**:
1. **Review network policies**: Check current network policy configuration
2. **Add exceptions**: Create network policy rules for required connections
3. **Verify labels**: Ensure components have correct labels for policy matching
4. **Test connectivity**: Verify network paths between components

```bash
# Check network policies
kubectl get networkpolicies -n staging-environment

# Test connectivity
choreo network test frontend database --port=5432 --environment=staging

# Add network policy exception
choreo environment update staging --allow-connection frontend:database:5432
```

---

## Data Plane Errors (4000-4999)

### CHOREO-4001: Cluster Connection Failed

**Description**: Unable to connect to Kubernetes cluster.

**Common Causes**:
- Invalid kubeconfig
- Network connectivity issues
- Cluster API server unavailable
- Authentication credentials expired

**Example Error**:
```
Cluster connection failed: Unable to connect to the server: dial tcp 192.168.1.100:6443: 
i/o timeout. Verify cluster connectivity and credentials.
```

**Resolution Steps**:
1. **Check kubeconfig**: Verify kubeconfig file is valid and accessible
2. **Test connectivity**: Ensure network path to cluster API server
3. **Refresh credentials**: Update authentication tokens or certificates
4. **Verify cluster status**: Confirm cluster is running and accessible

```bash
# Test cluster connectivity
kubectl cluster-info

# Check kubeconfig
kubectl config current-context
kubectl config view

# Update credentials (for cloud providers)
aws eks update-kubeconfig --name my-cluster
```

---

### CHOREO-4002: Node Resource Exhaustion

**Description**: Cluster nodes have insufficient resources for new workloads.

**Common Causes**:
- All nodes at capacity
- Node resource fragmentation
- Large resource requests
- Node failures reducing capacity

**Example Error**:
```
Node resource exhaustion: 0/3 nodes are available: 3 Insufficient cpu, 2 Insufficient memory. 
Scale cluster or reduce resource requests.
```

**Resolution Steps**:
1. **Scale cluster**: Add more nodes to increase capacity
2. **Optimize resources**: Reduce component resource requests
3. **Enable autoscaling**: Configure cluster autoscaler
4. **Redistribute workloads**: Move components to less utilized nodes

```bash
# Check node resources
kubectl top nodes
kubectl describe nodes

# Check pending pods
kubectl get pods --all-namespaces --field-selector=status.phase=Pending

# Scale node group (cloud-specific)
aws eks update-nodegroup-config --cluster-name my-cluster --nodegroup-name workers --scaling-config minSize=3,maxSize=10,desiredSize=6
```

---

## Authentication/Authorization Errors (5000-5999)

### CHOREO-5001: Authentication Failed

**Description**: User authentication failed.

**Common Causes**:
- Invalid credentials
- Expired tokens
- Incorrect authentication provider configuration
- Network issues with identity provider

**Example Error**:
```
Authentication failed: Invalid token. Token may be expired or malformed. 
Please log in again to obtain a new token.
```

**Resolution Steps**:
1. **Re-authenticate**: Log in again to refresh credentials
2. **Check token expiry**: Verify token hasn't expired
3. **Verify provider**: Ensure identity provider is accessible
4. **Update configuration**: Check authentication configuration

```bash
# Re-authenticate
choreo auth login

# Check current authentication status
choreo auth whoami

# Refresh token
choreo auth refresh

# Check token expiry
choreo auth token --show-expiry
```

---

### CHOREO-5002: Insufficient Permissions

**Description**: User lacks required permissions for the requested operation.

**Common Causes**:
- Missing RBAC permissions
- Incorrect role assignments
- Organization access restrictions
- Resource-level access controls

**Example Error**:
```
Insufficient permissions: User 'john.doe@company.com' cannot create components 
in project 'production-app'. Required role: 'project-developer' or higher.
```

**Resolution Steps**:
1. **Check permissions**: Review current user permissions
2. **Request access**: Contact administrator for required permissions
3. **Verify role assignments**: Ensure proper roles are assigned
4. **Check resource ownership**: Verify access to specific resources

```bash
# Check current permissions
choreo auth permissions

# List available roles
choreo auth roles list

# Request access (if self-service available)
choreo auth request-access --project=production-app --role=project-developer
```

---

## Network Errors (6000-6999)

### CHOREO-6001: Service Discovery Failed

**Description**: Component cannot discover other services.

**Common Causes**:
- DNS resolution issues
- Service registration problems
- Network policy blocking service discovery
- Incorrect service configuration

**Example Error**:
```
Service discovery failed: component 'frontend' cannot resolve 'api-service'. 
DNS lookup failed: server can't find api-service.default.svc.cluster.local: NXDOMAIN
```

**Resolution Steps**:
1. **Check DNS**: Verify DNS resolution is working
2. **Verify service**: Ensure target service exists and is properly configured
3. **Test connectivity**: Check network connectivity between components
4. **Review configuration**: Verify service names and ports are correct

```bash
# Test DNS resolution
kubectl exec -it <pod-name> -- nslookup api-service.default.svc.cluster.local

# Check services
kubectl get services -n default

# Test service connectivity
kubectl exec -it <pod-name> -- curl http://api-service:8080/health

# Check endpoints
kubectl get endpoints api-service
```

---

### CHOREO-6002: Load Balancer Configuration Error

**Description**: Load balancer configuration is invalid or failing.

**Common Causes**:
- Invalid load balancer configuration
- Cloud provider quota limits
- Network security group issues
- Load balancer health check failures

**Example Error**:
```
Load balancer configuration error: Failed to create LoadBalancer service 'api-gateway': 
quota exceeded for resource 'load_balancers' in region 'us-west-2'
```

**Resolution Steps**:
1. **Check quotas**: Verify cloud provider resource quotas
2. **Review configuration**: Validate load balancer settings
3. **Check security groups**: Ensure proper network security configurations
4. **Monitor health checks**: Verify health check endpoints are responding

```bash
# Check service status
kubectl get service api-gateway -o yaml

# Describe service for events
kubectl describe service api-gateway

# Check load balancer status (cloud-specific)
aws elbv2 describe-load-balancers --names api-gateway-lb
```

---

## Storage Errors (7000-7999)

### CHOREO-7001: Persistent Volume Provisioning Failed

**Description**: Unable to provision persistent storage for component.

**Common Causes**:
- Storage class not available
- Insufficient storage quota
- Storage provider issues
- Invalid volume configuration

**Example Error**:
```
Persistent volume provisioning failed for component 'database': 
StorageClass 'fast-ssd' not found. Available storage classes: gp2, standard
```

**Resolution Steps**:
1. **Check storage classes**: Verify available storage classes
2. **Update configuration**: Use correct storage class name
3. **Check quotas**: Ensure sufficient storage quota available
4. **Verify provider**: Confirm storage provider is operational

```bash
# List available storage classes
kubectl get storageclass

# Check persistent volumes
kubectl get pv

# Check persistent volume claims
kubectl get pvc -n <namespace>

# Describe PVC for details
kubectl describe pvc <pvc-name> -n <namespace>
```

---

### CHOREO-7002: Volume Mount Failed

**Description**: Unable to mount persistent volume to component.

**Common Causes**:
- Volume not available
- Mount path conflicts
- File system errors
- Permission issues

**Example Error**:
```
Volume mount failed for component 'database': MountVolume.MountDevice failed 
for volume "pv-database" : mount failed: exit status 32. 
File system corruption detected.
```

**Resolution Steps**:
1. **Check volume status**: Verify persistent volume is available
2. **Resolve conflicts**: Ensure mount paths don't conflict
3. **Fix file system**: Repair file system corruption if detected
4. **Verify permissions**: Check volume access permissions

```bash
# Check pod events
kubectl describe pod <pod-name> -n <namespace>

# Check volume status
kubectl get pv <volume-name> -o yaml

# Force unmount and remount
kubectl delete pod <pod-name> -n <namespace>
```

---

## Build/Deployment Errors (8000-8999)

### CHOREO-8001: Image Registry Access Denied

**Description**: Unable to push or pull container images from registry.

**Common Causes**:
- Invalid registry credentials
- Registry access permissions
- Network connectivity to registry
- Registry service unavailable

**Example Error**:
```
Image registry access denied: failed to push image 'registry.company.com/app:v1.0.0': 
unauthorized: authentication required
```

**Resolution Steps**:
1. **Verify credentials**: Check registry authentication credentials
2. **Update secrets**: Create or update image pull secrets
3. **Check permissions**: Ensure registry access permissions
4. **Test connectivity**: Verify network access to registry

```bash
# Test registry login
docker login registry.company.com

# Create image pull secret
kubectl create secret docker-registry regcred \
  --docker-server=registry.company.com \
  --docker-username=<username> \
  --docker-password=<password>

# Check existing secrets
kubectl get secrets -n <namespace>
```

---

### CHOREO-8002: Build Context Too Large

**Description**: Build context exceeds size limits.

**Common Causes**:
- Large files in build context
- Missing .dockerignore file
- Including unnecessary files
- Large git repository

**Example Error**:
```
Build context too large: build context size 2.1GB exceeds limit of 1GB. 
Use .dockerignore to exclude unnecessary files.
```

**Resolution Steps**:
1. **Add .dockerignore**: Exclude unnecessary files from build context
2. **Clean up files**: Remove large temporary or cache files
3. **Use multi-stage builds**: Optimize Dockerfile for smaller context
4. **Configure excludes**: Exclude paths in OpenChoreo configuration

```bash
# Check build context size
docker build --no-cache --progress=plain .

# Create .dockerignore
cat > .dockerignore << EOF
node_modules
*.log
.git
.cache
dist
EOF

# Configure excludes in component
choreo component update myapp --build-exclude="node_modules,*.log,dist/*"
```

---

## System/Internal Errors (9000-9999)

### CHOREO-9001: Controller Reconciliation Failed

**Description**: OpenChoreo controller failed to reconcile resources.

**Common Causes**:
- Controller bugs
- Resource conflicts
- API server issues
- Resource finalizer problems

**Example Error**:
```
Controller reconciliation failed: failed to reconcile Component 'user-service': 
Operation cannot be fulfilled on components.choreo.dev "user-service": 
the object has been modified
```

**Resolution Steps**:
1. **Check controller logs**: Review OpenChoreo controller logs
2. **Restart controller**: Restart controller pods if needed
3. **Clear finalizers**: Remove stuck finalizers if safe
4. **Report bug**: File issue if appears to be controller bug

```bash
# Check controller logs
kubectl logs -n openchoreo-system deployment/openchoreo-controller

# Restart controller
kubectl rollout restart deployment/openchoreo-controller -n openchoreo-system

# Check resource status
kubectl get components user-service -o yaml

# Remove finalizers (use with caution)
kubectl patch component user-service --type='merge' -p='{"metadata":{"finalizers":null}}'
```

---

### CHOREO-9002: API Server Timeout

**Description**: Request to OpenChoreo API server timed out.

**Common Causes**:
- High API server load
- Network connectivity issues
- Database performance problems
- Resource contention

**Example Error**:
```
API server timeout: request to create component 'new-service' timed out after 30s. 
Server may be experiencing heavy load.
```

**Resolution Steps**:
1. **Retry request**: Try the operation again
2. **Check API server status**: Verify API server health
3. **Review load**: Check API server resource usage
4. **Increase timeout**: Use longer timeout for large operations

```bash
# Check API server status
choreo system status

# Check API server logs
kubectl logs -n openchoreo-system deployment/openchoreo-api-server

# Retry with longer timeout
choreo component create new-service --timeout=60s

# Check system resources
kubectl top pods -n openchoreo-system
```

---

### CHOREO-9003: Database Connection Failed

**Description**: OpenChoreo cannot connect to its backend database.

**Common Causes**:
- Database service unavailable
- Invalid database credentials
- Network connectivity issues
- Database resource exhaustion

**Example Error**:
```
Database connection failed: failed to connect to PostgreSQL database: 
dial tcp 10.0.1.100:5432: connect: connection refused
```

**Resolution Steps**:
1. **Check database status**: Verify database service is running
2. **Test connectivity**: Check network connectivity to database
3. **Verify credentials**: Ensure database credentials are correct
4. **Check resources**: Monitor database resource usage

```bash
# Check database pod status
kubectl get pods -l app=postgresql -n openchoreo-system

# Test database connectivity
kubectl exec -it <api-server-pod> -- pg_isready -h postgresql -p 5432

# Check database logs
kubectl logs -l app=postgresql -n openchoreo-system

# Restart database if needed
kubectl rollout restart statefulset/postgresql -n openchoreo-system
```

---

## Error Troubleshooting Tools

### OpenChoreo CLI Debugging

```bash
# Enable debug mode
export CHOREO_DEBUG=true

# Verbose output
choreo --verbose component create myapp

# Check system status
choreo system status --verbose

# Validate configuration
choreo validate --all
```

### Kubernetes Troubleshooting

```bash
# Check events across all namespaces
kubectl get events --all-namespaces --sort-by=.metadata.creationTimestamp

# Describe resources for detailed status
kubectl describe component <name>
kubectl describe pod <name>

# Check resource logs
kubectl logs <pod-name> --previous
kubectl logs -f <pod-name> -c <container-name>
```

### Log Analysis

```bash
# Controller logs with error filtering
kubectl logs -n openchoreo-system deployment/openchoreo-controller | grep -i error

# Component logs with timestamps
choreo logs component myapp --timestamps --since=1h

# System audit logs
choreo audit logs --filter="error" --since="2024-01-01"
```

---

## Getting Help

If you encounter errors not covered in this reference:

1. **Check Documentation**: Review relevant documentation sections
2. **Search Issues**: Look for similar issues on GitHub
3. **Community Support**: Ask questions in community forums
4. **File Bug Reports**: Create detailed bug reports for new issues

**Support Channels**:
- **GitHub Issues**: [github.com/openchoreo/openchoreo/issues](https://github.com/openchoreo/openchoreo/issues)
- **Community Forum**: [discussions.openchoreo.dev](https://discussions.openchoreo.dev)
- **Chat**: [slack.openchoreo.dev](https://slack.openchoreo.dev)
- **Email**: [support@openchoreo.dev](mailto:support@openchoreo.dev)