---
layout: docs
title: Single Cluster Setup
---

# Single Cluster Setup

This guide provides step-by-step instructions for setting up a local development environment for OpenChoreo using Kind (Kubernetes in Docker).

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) v20.10+ installed and running
- [Kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation) v0.20+ installed
- [kubectl](https://kubernetes.io/docs/tasks/tools/) v1.32+ installed
- [Helm](https://helm.sh/docs/intro/install/) v3.12+ installed

### Verify Prerequisites

Before proceeding, verify that all tools are installed and meet the minimum version requirements:

```bash
# Check Docker (should be v20.10+)
docker --version

# Check Kind (should be v0.20+) 
kind --version

# Check kubectl (should be v1.32+)
kubectl version --client

# Check Helm (should be v3.12+)
helm version --short
```

Make sure Docker is running:

```bash
docker info
```

## Quick Setup

This setup uses pre-built images and Helm charts from the OpenChoreo registry. 


### 1. Create OpenChoreo Kind Cluster

Create a new Kind cluster using the provided configuration:

```bash
curl -s https://raw.githubusercontent.com/openchoreo/openchoreo/main/install/kind/kind-config.yaml | kind create cluster --config=-
```

This will:
- Create a cluster named "openchoreo" 
- Set up control plane and worker nodes
- Configure the worker node with OpenChoreo-specific labels
- Set kubectl context to "kind-openchoreo"

### 2. Install Cilium CNI

Install Cilium as the Container Network Interface (CNI). This will create the `cilium` namespace automatically:

```bash
helm install cilium oci://ghcr.io/openchoreo/helm-charts/cilium --create-namespace --namespace cilium --wait
```

Wait for Cilium pods to be ready:

```bash
kubectl wait --for=condition=Ready pod -l k8s-app=cilium -n cilium --timeout=300s
```

Verify that the nodes are now Ready:

```bash
kubectl get nodes
```

You should see both nodes in `Ready` status.

### 3. Install OpenChoreo Control Plane

Install the OpenChoreo control plane using the following helm install command. This will create the `openchoreo-control-plane` namespace automatically:

```bash
helm install control-plane oci://ghcr.io/openchoreo/helm-charts/openchoreo-control-plane \
  --create-namespace --namespace openchoreo-control-plane \
  --timeout=10m
```

Wait for the installation to complete and verify all pods are running:

```bash
kubectl get pods -n openchoreo-control-plane
```

You should see pods for:
- `controller-manager` (Running)
- `api-server` (Running) 
- `cert-manager-*` (3 pods, all Running)

### 4. Install OpenChoreo Data Plane

Install the OpenChoreo data plane using the following helm install command. This will create the `openchoreo-data-plane` namespace automatically:

```bash
helm install data-plane oci://ghcr.io/openchoreo/helm-charts/openchoreo-data-plane \
  --create-namespace --namespace openchoreo-data-plane \
  --timeout=10m \
  --set cert-manager.enabled=false \
  --set cert-manager.crds.enabled=false
```

Note: We disable cert-manager since it's already installed by the control plane.

Wait for dataplane components to be ready:

```bash
kubectl get pods -n openchoreo-data-plane
```

You should see pods for:
- `hashicorp-vault-0` (Running)
- `secrets-store-csi-driver-*` (Running on each node)
- `gateway-*` (Running)
- `registry-*` (Running)
- `redis-*` (Running)
- `envoy-gateway-*` (Running)
- `envoy-ratelimit-*` (Running)
- `fluent-bit-*` (Running)

### 5. Install OpenChoreo Build Plane (Optional)

The Build Plane is required if you plan to use OpenChoreo’s internal CI capabilities. If you're only deploying pre-built container images, you can skip this step.

Install the OpenChoreo build plane using the following helm install command for CI/CD capabilities using Argo Workflows. This will create the `openchoreo-build-plane` namespace automatically:

```bash
helm install build-plane oci://ghcr.io/openchoreo/helm-charts/openchoreo-build-plane \
  --create-namespace --namespace openchoreo-build-plane --timeout=10m
```

Wait for the build plane components to be ready:

```bash
kubectl get pods -n openchoreo-build-plane
```

You should see pods for:
- `argo-workflow-controller-*` (Running)

#### Configure BuildPlane

Register the build plane with the control plane by running:

```bash
curl -s https://raw.githubusercontent.com/openchoreo/openchoreo/main/install/add-build-plane.sh | bash
```

This script will:
- Detect single-cluster mode automatically
- Extract cluster credentials from your kubeconfig
- Create a BuildPlane resource in the default namespace
- Configure the build plane connection to the control plane

Verify that the BuildPlane was created:

```bash
kubectl get buildplane -n default
```

### 6. Configure DataPlane

Register the data plane with the control plane by running:

```bash
curl -s https://raw.githubusercontent.com/openchoreo/openchoreo/main/install/add-default-dataplane.sh | bash
```

This script will:
- Detect single-cluster mode automatically
- Extract cluster credentials from your kubeconfig
- Create a DataPlane resource in the default namespace
- Configure the registry and gateway endpoints

Verify the DataPlane was created:

```bash
kubectl get dataplane -n default
```

### 7. Install OpenChoreo Observability Plane (Optional)

Install the OpenChoreo observability plane using the following helm install command for monitoring and logging capabilities. This will create the `openchoreo-observability-plane` namespace automatically:

```bash
helm install observability-plane oci://ghcr.io/openchoreo/helm-charts/openchoreo-observability-plane \
  --create-namespace --namespace openchoreo-observability-plane \
  --timeout=10m
```

Wait for the observability plane components to be ready:

```bash
kubectl get pods -n openchoreo-observability-plane
```

You should see pods for:
- `opensearch-0` (Running) - Log storage backend
- `opensearch-dashboard-*` (Running) - Visualization dashboard
- `observer-*` (Running) - Log processing service

Note: The OpenSearch pod may take several minutes.

Verify that all pods are ready:

```bash
kubectl wait --for=condition=Ready pod --all -n openchoreo-observability-plane --timeout=600s
```

Verify FluentBit is sending logs to OpenSearch:

```bash
# Check if kubernetes indices are being created
kubectl exec -n openchoreo-observability-plane opensearch-0 -- curl -s "http://localhost:9200/_cat/indices?v" | grep kubernetes

# Check recent log count
kubectl exec -n openchoreo-observability-plane opensearch-0 -- curl -s "http://localhost:9200/kubernetes-*/_count" | jq '.count'
```

If the indices exist and the count is greater than 0, FluentBit is successfully collecting and storing logs.

#### Configure Observer Integration 
Configure the DataPlane and BuildPlane to use the observer service.

```bash
# Configure DataPlane to use observer service
kubectl patch dataplane default -n default --type merge -p '{"spec":{"observer":{"url":"http://observer.openchoreo-observability-plane:8080","authentication":{"basicAuth":{"username":"dummy","password":"dummy"}}}}}'

# Configure BuildPlane to use observer service  
kubectl patch buildplane default -n default --type merge -p '{"spec":{"observer":{"url":"http://observer.openchoreo-observability-plane:8080","authentication":{"basicAuth":{"username":"dummy","password":"dummy"}}}}}'
```

**Important**: Without this configuration, build logs will not be pushed to the observability plane and application logs will not be visible in the Backstage portal, significantly impacting the developer experience.

This configuration enables:
- Application logs to appear in Backstage portal
- Enhanced logging and monitoring across build and data planes
- Integration with the observability plane for comprehensive platform monitoring
- Centralized log publishing and access through the observer service

Verify the observer configuration:

```bash
# Check DataPlane observer config
kubectl get dataplane default -n default -o jsonpath='{.spec.observer}' | jq '.'

# Check BuildPlane observer config  
kubectl get buildplane default -n default -o jsonpath='{.spec.observer}' | jq '.'
```

### 8. Install OpenChoreo Backstage Portal (Optional)

Install the OpenChoreo Backstage developer portal to visualize and manage your deployed components. The portal provides a unified interface for viewing all your services, APIs, and other components in the platform.

```bash
helm install openchoreo-backstage-demo oci://ghcr.io/openchoreo/helm-charts/backstage-demo \
  --namespace openchoreo-control-plane
```

Wait for the Backstage pod to be ready:

```bash
kubectl wait --for=condition=Ready pod -l app.kubernetes.io/name=backstage -n openchoreo-control-plane --timeout=300s
```

Verify the installation:

```bash
# Check pod status
kubectl get pods -l app.kubernetes.io/name=backstage -n openchoreo-control-plane

# Check service
kubectl get svc openchoreo-backstage-demo -n openchoreo-control-plane
```

To access the Backstage portal:

```bash
# Port forward the Backstage service in background and open browser
kubectl port-forward -n openchoreo-control-plane svc/openchoreo-backstage-demo 7007:7007 > /dev/null 2>&1 & sleep 2 && open http://localhost:7007

# Or if you prefer to manually open the browser:
kubectl port-forward -n openchoreo-control-plane svc/openchoreo-backstage-demo 7007:7007 > /dev/null 2>&1 & sleep 2
# Then access in browser at http://localhost:7007

# To stop the port-forward when done:
pkill -f "kubectl port-forward.*openchoreo-backstage-demo.*7007:7007"
```

You can verify the portal is working correctly with curl:

```bash
curl -s http://localhost:7007 | head -20
```

The OpenChoreo plugin will automatically detect and display any components you deploy to the platform.


### 9. Verify OpenChoreo Installation

#### Check that default OpenChoreo resources were created:

```bash
# Check default organization and project
kubectl get organizations,projects,environments -A

# Check default platform classes
kubectl get serviceclass,apiclass -n default

# Check all OpenChoreo CRDs
kubectl get crds | grep openchoreo

# Check gateway resources
kubectl get gateway,httproute -n openchoreo-data-plane
```

#### Check that all components are running:

```bash
# Check cluster info
kubectl cluster-info --context kind-openchoreo

# Check control plane pods
kubectl get pods -n openchoreo-control-plane

# Check data plane pods
kubectl get pods -n openchoreo-data-plane

# Check build plane pods (if installed)
kubectl get pods -n openchoreo-build-plane

# Check observability plane pods (if installed)
kubectl get pods -n openchoreo-observability-plane

# Check Cilium pods
kubectl get pods -n cilium

# Check nodes (should be Ready)
kubectl get nodes
```

## Next Steps

After completing this setup you can:

1. [Deploy your first component](/docs/getting-started/deploy-your-first-component/) 
2. Test the [GCP microservices demo](https://github.com/openchoreo/openchoreo/tree/main/samples/gcp-microservices-demo)
3. Deploy additional sample applications from the [OpenChoreo samples](https://github.com/openchoreo/openchoreo/tree/main/samples)
4. Develop and test new OpenChoreo features
5. Explore the Backstage portal to manage your deployed components

## Cleaning Up

To completely remove the development environment:

```bash
# Delete the Kind cluster
kind delete cluster --name openchoreo

# Remove kubectl context (optional)
kubectl config delete-context kind-openchoreo

# Clean up cert-manager leader election leases (for future reinstalls)
kubectl delete lease cert-manager-controller -n kube-system --ignore-not-found
kubectl delete lease cert-manager-cainjector-leader-election -n kube-system --ignore-not-found
```
