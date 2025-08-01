---
layout: docs
title: Deploy Your First Component
---

# Deploy Your First Component

This guide walks you through deploying your first component on OpenChoreo. By the end of this tutorial, you'll have a running web service accessible through the platform, complete with monitoring and security configured automatically.

## Prerequisites

Before you begin, ensure you have:

- ✅ **OpenChoreo installed** in your Kubernetes cluster ([Single Cluster Setup](/docs/getting-started/single-cluster/))
- ✅ **kubectl** configured to access your cluster
- ✅ **OpenChoreo context** set to your cluster (should be `kind-openchoreo` if following the setup guide)

## Step 1: Verify Your Setup

First, make sure you have setup choreo on your local cluster following the [guide](./single-cluster.md)

You should see all OpenChoreo components running with the control plane and data plane pods in `Running` status.

## Step 2: Deploy the Go Greeter Service

For this tutorial, we'll use the Go Greeter Service sample that comes with OpenChoreo. This is a simple web service that demonstrates OpenChoreo's core capabilities.

```bash
# Deploy the greeter service (Component, Workload, Service)
kubectl apply -f https://raw.githubusercontent.com/openchoreo/openchoreo/main/samples/from-image/go-greeter-service/greeter-service.yaml
```

This single command creates:
- **Component**: Defines the application and its requirements
- **Workload**: Specifies the container image and runtime configuration  
- **Service**: Configures the API endpoint and network access

## Step 3: Monitor the Deployment

Track your component's deployment progress:

```bash
# Check that all resources are created
kubectl get component,workload,service,api -A

# Check the component status
kubectl get component greeter-service 

# Monitor the workload deployment
kubectl get workload greeter-service 
```

## Step 4: Verify the Deployment

Wait for the service to be ready (this may take 1-2 minutes):

```bash
# Check the actual Kubernetes deployment
kubectl get deployment -A | grep greeter

# Verify pods are running
kubectl get pods -A | grep greeter

# Check HTTP routes are configured
kubectl get httproute -A -o wide
```

## Step 5: Test Your Application

Test the greeter service from inside the cluster:

```bash
# Test the greeter service endpoint
kubectl run test-curl --image=curlimages/curl --rm -i --restart=Never -- \
  curl -v -k https://gateway-external.openchoreo-data-plane.svc.cluster.local/default/greeter-service/greeter/greet \
  -H "Host: development.choreoapis.localhost"
```

You should receive a successful response:
```
Hello, Stranger!
```

This confirms that:
- ✅ Your component is deployed and running
- ✅ The API gateway is properly configured
- ✅ Network routing is working correctly
- ✅ Security policies are applied automatically

## Step 6: Explore What OpenChoreo Created

Let's examine what OpenChoreo automatically created for your component:

```bash
# View the OpenChoreo resources
kubectl get component,workload,service,api -n default

# Check the underlying Kubernetes resources
kubectl get deployment,pod,svc -A | grep greeter

# View the HTTP routing configuration
kubectl describe httproute -A | grep -A 20 greeter

# Check the API definition
kubectl get api greeter-service -n default -o yaml
```

OpenChoreo automatically created:
- **Component** - High-level application definition
- **Workload** - Container deployment specification  
- **Service** - API service configuration
- **API** - OpenAPI specification and routing
- **Deployment** - Kubernetes deployment managing pods
- **Service** - Kubernetes service for networking
- **HTTPRoute** - Gateway API routing configuration

## Summary

You've successfully:
- ✅ Deployed your first OpenChoreo component from a container image
- ✅ Tested API access through the OpenChoreo gateway
- ✅ Explored the resources OpenChoreo created automatically

Your application is now running in a production-ready environment with enterprise-grade security, networking, and observability—all configured automatically by OpenChoreo!

**Ready for more?** Try deploying additional samples or start building your own components using OpenChoreo's powerful abstractions.

## Clean Up

To remove the sample application:

```bash
# Remove the greeter service
kubectl delete -f https://raw.githubusercontent.com/openchoreo/openchoreo/main/samples/from-image/go-greeter-service/greeter-service.yaml

# Remove the build sample (if deployed)
kubectl delete -f https://raw.githubusercontent.com/openchoreo/openchoreo/main/samples/from-source/services/go-google-buildpack-reading-list/reading-list-service.yaml
```
