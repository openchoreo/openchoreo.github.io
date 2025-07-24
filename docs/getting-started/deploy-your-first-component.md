---
layout: docs
title: Deploy Your First Component
---

# Deploy Your First Component

This guide walks you through deploying your first component on OpenChoreo. By the end of this tutorial, you'll have a running web service accessible through the internet, complete with monitoring and security configured automatically.

## Prerequisites

Before you begin, ensure you have:

- ✅ **OpenChoreo installed** in your Kubernetes cluster ([Installation Guide](/docs/getting-started/install-in-your-cluster/))
- ✅ **kubectl** configured to access your cluster
- ✅ **choreo CLI** installed and authenticated
- ✅ **A sample application** (we'll provide one if you don't have your own)

## Step 1: Verify Your Setup

First, let's confirm OpenChoreo is running correctly:

```bash
# Check OpenChoreo installation
kubectl get pods -n openchoreo-system

# Verify CLI connection
choreo system status
```

You should see all OpenChoreo components running and the CLI connecting successfully.

## Step 2: Create Your First Project

Every component in OpenChoreo belongs to a project. Let's create one:

```bash
# Create a new project
choreo project create my-first-project \
  --description "My first OpenChoreo project"

# Verify project creation
choreo project list
```

## Step 3: Prepare Your Application

For this tutorial, we'll use a simple Node.js web service. You can either:

### Option A: Use Our Sample Application

Clone the OpenChoreo sample repository:

```bash
git clone https://github.com/openchoreo/samples.git
cd samples/hello-world-nodejs
```

### Option B: Use Your Own Application

If you have your own application, ensure it:
- Listens on a configurable port (via environment variable)
- Has a health check endpoint
- Is containerizable

## Step 4: Create Component Definition

Create a component definition file that tells OpenChoreo how to deploy your application:

```yaml
# component.yaml
apiVersion: choreo.dev/v1
kind: Component
metadata:
  name: hello-world
  namespace: my-first-project
spec:
  # Component type - determines how it's deployed
  type: service
  
  # Runtime environment
  runtime: nodejs
  
  # Source code location
  source:
    git:
      repository: https://github.com/openchoreo/samples.git
      path: hello-world-nodejs
      branch: main
  
  # Build configuration
  build:
    buildpacks: true
  
  # Network endpoints
  endpoints:
    - name: web
      port: 3000
      path: /
      visibility: public
      health:
        path: /health
        initialDelaySeconds: 10
        periodSeconds: 5
  
  # Resource requirements
  resources:
    requests:
      cpu: "100m"
      memory: "128Mi"
    limits:
      cpu: "500m"
      memory: "256Mi"
  
  # Environment variables
  env:
    - name: PORT
      value: "3000"
    - name: NODE_ENV
      value: "production"
```

## Step 5: Deploy Your Component

Apply the component definition to deploy your application:

```bash
# Deploy the component
kubectl apply -f component.yaml

# Watch the deployment progress
choreo component status hello-world --watch
```

You'll see OpenChoreo:
1. **Building** your application using Cloud Native Buildpacks
2. **Creating** Kubernetes resources (Deployment, Service, etc.)
3. **Configuring** network policies and security
4. **Setting up** monitoring and observability

## Step 6: Monitor the Deployment

Track your component's deployment progress:

```bash
# Check component status
choreo component status hello-world

# View deployment events
kubectl get events -n my-first-project --sort-by=.metadata.creationTimestamp

# Check pod status
kubectl get pods -n my-first-project -l choreo.dev/component=hello-world
```

## Step 7: Access Your Application

Once deployed, get the access URL for your component:

```bash
# Get component endpoint information
choreo component get hello-world --show-endpoints

# Or check via kubectl
kubectl get httproutes -n my-first-project
```

Your application will be accessible via a URL like:
`https://hello-world.my-first-project.your-domain.com`

## Step 8: Verify Everything Works

Test your deployed application:

```bash
# Test the application endpoint
curl https://hello-world.my-first-project.your-domain.com

# Test the health check
curl https://hello-world.my-first-project.your-domain.com/health

# Check application logs
choreo logs component hello-world --tail 50
```

## Step 9: Explore What OpenChoreo Created

Let's examine what OpenChoreo automatically created for your component:

```bash
# View all resources created for your component
kubectl get all -n my-first-project -l choreo.dev/component=hello-world

# Check network policies (security)
kubectl get networkpolicies -n my-first-project

# View service monitor (observability)
kubectl get servicemonitors -n my-first-project

# Check ingress configuration
kubectl get httproutes -n my-first-project
```

You'll see that OpenChoreo automatically created:
- **Deployment** - Manages your application pods
- **Service** - Provides stable networking
- **HTTPRoute** - Configures ingress routing
- **NetworkPolicy** - Enforces security boundaries
- **ServiceMonitor** - Enables metrics collection
- **HorizontalPodAutoscaler** - Handles automatic scaling

## Step 10: Make Changes and Redeploy

Let's make a change to see OpenChoreo's update capabilities:

```yaml
# Update component.yaml - change replica count
spec:
  replicas: 2  # Add this line
  # ... rest of configuration
```

```bash
# Apply the update
kubectl apply -f component.yaml

# Watch the rolling update
kubectl rollout status deployment/hello-world -n my-first-project
```

## Understanding What Happened

Congratulations! You've successfully deployed your first component. Here's what OpenChoreo did behind the scenes:

### 🏗️ **Build Process**
- Detected your Node.js application
- Used Cloud Native Buildpacks to create a container image
- Stored the image in the configured registry

### 🚀 **Deployment**
- Created Kubernetes Deployment with your specifications
- Applied security contexts and resource limits
- Configured health checks and readiness probes

### 🔒 **Security**
- Implemented network policies for zero-trust networking
- Configured service-to-service mTLS encryption
- Applied Pod Security Standards

### 🌐 **Networking**
- Created HTTPRoute for external access
- Configured load balancing and traffic routing
- Set up TLS termination

### 📊 **Observability**
- Enabled metrics collection via Prometheus
- Configured log aggregation
- Set up distributed tracing hooks

## Next Steps

Now that you've deployed your first component, explore these next steps:

### 🔄 **Add More Components**
```bash
# Create a database component
choreo component create database \
  --type stateful \
  --runtime postgres \
  --project my-first-project
```

### 🔗 **Connect Components**
Learn how to establish secure connections between components:
```yaml
# In your web service component
spec:
  connections:
    - name: database
      target: postgres
      port: 5432
```

### 🌍 **Multiple Environments**
Deploy to different environments:
```bash
# Create staging environment
choreo environment create staging --project my-first-project

# Deploy to staging
choreo component deploy hello-world --environment staging
```

### 📈 **Advanced Configuration**
Explore advanced features:
- Custom build configurations
- Advanced networking rules
- Scaling policies
- Monitoring dashboards

## Troubleshooting

### Common Issues

**Component Stuck in "Building" State**
```bash
# Check build logs
choreo logs build hello-world

# Verify source repository access
git clone <your-repo-url>
```

**Application Not Accessible**
```bash
# Check ingress configuration
kubectl describe httproute hello-world -n my-first-project

# Verify DNS resolution
nslookup hello-world.my-first-project.your-domain.com
```

**Pod CrashLoopBackOff**
```bash
# Check application logs
kubectl logs -l choreo.dev/component=hello-world -n my-first-project

# Verify health check endpoint
kubectl exec -it <pod-name> -n my-first-project -- curl localhost:3000/health
```

### Getting Help

- **Documentation**: [Core Concepts](/docs/core-concepts/)
- **Examples**: [Learn from Examples](/docs/learn-from-examples/)
- **Community**: [GitHub Discussions](https://github.com/openchoreo/openchoreo/discussions)
- **Support**: [support@openchoreo.dev](mailto:support@openchoreo.dev)

## Summary

You've successfully:
- ✅ Created your first OpenChoreo project
- ✅ Deployed a component from source code
- ✅ Configured networking and security automatically
- ✅ Set up monitoring and observability
- ✅ Learned about OpenChoreo's automated resource management

Your application is now running in a production-ready environment with enterprise-grade security, networking, and observability—all configured automatically by OpenChoreo!

**Ready for more?** Check out our [Learn from Examples](/docs/learn-from-examples/) section for more complex scenarios and use cases.