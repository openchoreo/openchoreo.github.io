---
title: Multi Cluster
description: Try OpenChoreo locally with multiple Kind clusters.
---

# Multi Cluster Setup

This guide walks you through step-by-step instructions for deploying OpenChoreo across multiple clusters. This deploys a **Control Plane**, a **Data Plane**, and optional **Build** and **Observability Planes** in separate clusters.

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

This multi-cluster setup deploys OpenChoreo components across separate clusters for better isolation and scalability:

- **Control Plane Cluster**: Hosts the OpenChoreo API server and controllers
- **Data Plane Cluster**: Hosts application workloads and runtime components
- **Build Plane Cluster** (Optional): Hosts CI/CD capabilities using Argo Workflows
- **Observability Plane Cluster** (Optional): Hosts monitoring and logging infrastructure

### 1. Setup the Control Plane

#### Create the Control Plane Cluster

Create a dedicated Kind cluster for the control plane components:

```bash
curl -s https://raw.githubusercontent.com/openchoreo/openchoreo/main/install/kind/multi-cluster-setup/kind-config-cp.yaml | kind create cluster --config=-
```

This will:
- Create a cluster named "openchoreo-cp"
- Set up control plane nodes
- Set kubectl context to "kind-openchoreo-cp"

#### Install OpenChoreo Control Plane

Install the OpenChoreo control plane using Helm. This will create the `openchoreo-control-plane` namespace automatically:

```bash
helm install control-plane oci://ghcr.io/openchoreo/helm-charts/openchoreo-control-plane \
  --create-namespace --namespace openchoreo-control-plane \
  --timeout=10m \
  --kube-context kind-openchoreo-cp
```

Wait for the installation to complete and verify all pods are running:

```bash
kubectl get pods -n openchoreo-control-plane --context kind-openchoreo-cp
```

You should see pods for:
- `controller-manager` (Running)
- `api-server` (Running)
- `cert-manager-*` (3 pods, all Running)

### 2. Setup the Data Plane

#### Create the Data Plane Cluster

Create a dedicated Kind cluster for the data plane components:

```bash
curl -s https://raw.githubusercontent.com/openchoreo/openchoreo/main/install/kind/multi-cluster-setup/kind-config-dp.yaml | kind create cluster --config=-
```

This will:
- Create a cluster named "openchoreo-dp"
- Set up control plane and worker nodes
- Set kubectl context to "kind-openchoreo-dp"

#### Install Cilium CNI

Install Cilium as the Container Network Interface (CNI). This will create the `cilium` namespace automatically:

```bash
helm install cilium oci://ghcr.io/openchoreo/helm-charts/cilium --create-namespace --namespace cilium --wait --kube-context kind-openchoreo-dp
```

Wait for Cilium pods to be ready:

```bash
kubectl wait --for=condition=Ready pod -l k8s-app=cilium -n cilium --timeout=300s --context=kind-openchoreo-dp
```

Verify that the nodes are now Ready:

```bash
kubectl get nodes --context=kind-openchoreo-dp
```

You should see both nodes in `Ready` status.

#### Install OpenChoreo Data Plane

Install the OpenChoreo data plane using Helm. This will create the `openchoreo-data-plane` namespace automatically:

```bash
helm install data-plane oci://ghcr.io/openchoreo/helm-charts/openchoreo-data-plane \
  --create-namespace --namespace openchoreo-data-plane \
  --timeout=10m \
  --set cert-manager.enabled=true \
  --set cert-manager.crds.enabled=true \
  --kube-context kind-openchoreo-dp
```

Note: We enable cert-manager since this is a separate cluster from the control plane.

Wait for dataplane components to be ready:

```bash
kubectl get pods -n openchoreo-data-plane --context=kind-openchoreo-dp
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

#### Configure DataPlane

Register the data plane with the control plane by running:

```bash
bash -c "$(curl -s https://raw.githubusercontent.com/openchoreo/openchoreo/main/install/add-default-dataplane.sh)" -- --multi-cluster
```

This script will:
- Detect multi-cluster mode automatically
- Extract cluster credentials from your kubeconfig
- Create a DataPlane resource in the default namespace
- Configure the registry and gateway endpoints

Verify the DataPlane was created:

```bash
kubectl get dataplane -n default
```

### 3. Setup the Build Plane (Optional)

The Build Plane is required if you plan to use OpenChoreo's internal CI capabilities. If you're only deploying pre-built container images, you can skip this step.

#### Create the Build Plane Cluster

Create a dedicated Kind cluster for the build plane components:

```bash
curl -s https://raw.githubusercontent.com/openchoreo/openchoreo/main/install/kind/multi-cluster-setup/kind-config-bp.yaml | kind create cluster --config=-
```

This will:
- Create a cluster named "openchoreo-bp"
- Set up control plane and worker nodes
- Set kubectl context to "kind-openchoreo-bp"

#### Install OpenChoreo Build Plane

Install the OpenChoreo build plane using Helm for CI/CD capabilities using Argo Workflows. This will create the `openchoreo-build-plane` namespace automatically:

```bash
helm install build-plane oci://ghcr.io/openchoreo/helm-charts/openchoreo-build-plane \
  --create-namespace --namespace openchoreo-build-plane \
  --timeout=10m \
  --kube-context kind-openchoreo-bp \
  --set fluentBit.enabled=true
```

Wait for the build plane components to be ready:

```bash
kubectl get pods -n openchoreo-build-plane --context kind-openchoreo-bp
```

You should see pods for:
- `argo-workflow-controller-*` (Running)
- `fluent-bit-*` (Running)

#### Configure BuildPlane

Register the build plane with the control plane by running:

```bash
bash -c "$(curl -s https://raw.githubusercontent.com/openchoreo/openchoreo/main/install/add-build-plane.sh)" -- --separate
```

When prompted, make sure to enter the build plane Kubernetes context as `kind-openchoreo-bp`.

This script will:
- Detect multi-cluster mode automatically
- Extract cluster credentials from your kubeconfig
- Create a BuildPlane resource in the default namespace
- Configure the build plane connection to the control plane

Verify that the BuildPlane was created:

```bash
kubectl get buildplane -n default
```

### 4. Setup the Observability Plane (Optional)

Install the OpenChoreo observability plane for monitoring and logging capabilities across all clusters.

#### Create the Observability Plane Cluster

Create a dedicated Kind cluster for the observability plane components:

```bash
curl -s https://raw.githubusercontent.com/openchoreo/openchoreo/main/install/kind/multi-cluster-setup/kind-config-op.yaml | kind create cluster --config=-
```

This will:
- Create a cluster named "openchoreo-op"
- Set up control plane and worker nodes
- Set kubectl context to "kind-openchoreo-op"

#### Install OpenChoreo Observability Plane

Install the OpenChoreo observability plane using Helm. This will create the `openchoreo-observability-plane` namespace automatically:

```bash
helm install observability-plane oci://ghcr.io/openchoreo/helm-charts/openchoreo-observability-plane \
  --create-namespace --namespace openchoreo-observability-plane \
  --timeout=10m \
  --kube-context kind-openchoreo-op
```

Wait for the observability plane components to be ready:

```bash
kubectl get pods -n openchoreo-observability-plane --context kind-openchoreo-op
```

You should see pods for:
- `opensearch-0` (Running) - Log storage backend
- `opensearch-dashboard-*` (Running) - Visualization dashboard
- `observer-*` (Running) - Log processing service

Note: The OpenSearch pod may take several minutes to start.

Verify that all pods are ready:

```bash
kubectl wait --for=condition=Ready pod --all -n openchoreo-observability-plane --timeout=600s --context kind-openchoreo-op
```

#### Configure Cross-Cluster Observability

Configure the build plane and data plane to send logs to the observability plane. The host and port should be accessible from the data/build plane clusters:

```bash
# Configure Build Plane FluentBit
helm upgrade build-plane oci://ghcr.io/openchoreo/helm-charts/openchoreo-build-plane \
  --namespace openchoreo-build-plane \
  --set fluentBit.config.opensearch.host="openchoreo-op-control-plane" \
  --set fluentBit.config.opensearch.port=30920 \
  --kube-context kind-openchoreo-bp \
  --set fluentBit.enabled=true
```

```bash
# Configure Data Plane FluentBit
helm upgrade data-plane oci://ghcr.io/openchoreo/helm-charts/openchoreo-data-plane \
  --namespace openchoreo-data-plane \
  --set fluentBit.config.opensearch.host="openchoreo-op-control-plane" \
  --set fluentBit.config.opensearch.port=30920 \
  --set cert-manager.enabled=false \
  --set cert-manager.crds.enabled=false \
  --kube-context kind-openchoreo-dp
```

**Important Security Note**: The observability plane collects data from outside clusters without encryption in this setup. For production environments, we recommend implementing proper TLS encryption and network security measures.

Verify FluentBit is sending logs to OpenSearch:

```bash
# Check if kubernetes indices are being created
kubectl exec -n openchoreo-observability-plane opensearch-0 --context kind-openchoreo-op -- curl -s "http://localhost:9200/_cat/indices?v" | grep kubernetes

# Check recent log count
kubectl exec -n openchoreo-observability-plane opensearch-0 --context kind-openchoreo-op -- curl -s "http://localhost:9200/kubernetes-*/_count" | jq '.count'
```

If the indices exist and the count is greater than 0, FluentBit is successfully collecting and storing logs.

### 5. Install OpenChoreo Backstage Portal (Optional)

Install the OpenChoreo Backstage developer portal to provide a unified developer experience across your multi-cluster OpenChoreo platform. Backstage serves as a centralized hub where developers can discover, manage, and monitor all their services and components.

The Backstage portal provides:

- **Cell Diagram**: View all deployed components and their relationships across clusters
- **Logs**: View runtime logs and build logs of each component
- **Configure and Deploy**: Configure, deploy and promote web applications and services through environments

```bash
helm install openchoreo-backstage-demo oci://ghcr.io/openchoreo/helm-charts/backstage-demo \
  --namespace openchoreo-control-plane \
  --kube-context kind-openchoreo-cp
```

Wait for the Backstage pod to be ready:

```bash
kubectl wait --for=condition=Ready pod -l app.kubernetes.io/name=backstage -n openchoreo-control-plane --timeout=300s --context kind-openchoreo-cp
```

Verify the installation:

```bash
# Check pod status
kubectl get pods -l app.kubernetes.io/name=backstage -n openchoreo-control-plane --context kind-openchoreo-cp

# Check service
kubectl get svc openchoreo-backstage-demo -n openchoreo-control-plane --context kind-openchoreo-cp
```

To access the Backstage portal:

```bash
# Port forward the Backstage service in background and open browser
kubectl port-forward -n openchoreo-control-plane svc/openchoreo-backstage-demo 7007:7007 --context kind-openchoreo-cp > /dev/null 2>&1 & sleep 2 && open http://localhost:7007

# Or if you prefer to manually open the browser:
kubectl port-forward -n openchoreo-control-plane svc/openchoreo-backstage-demo 7007:7007 --context kind-openchoreo-cp > /dev/null 2>&1 & sleep 2
# Then access in browser at http://localhost:7007

# To stop the port-forward when done:
pkill -f "kubectl port-forward.*openchoreo-backstage-demo.*7007:7007"
```

You can verify the portal is working correctly with curl:

```bash
curl -s http://localhost:7007 | head -20
```

#### What You'll See in Backstage

Once you access the Backstage portal, you'll find:

**Service Catalog**:

- All OpenChoreo components automatically discovered and cataloged across clusters
- Component metadata, ownership, and lifecycle information

**OpenChoreo Integration**:

- **Cell Diagram**: View all deployed components and their relationships across the multi-cluster environment
- **Logs**: View runtime logs and build logs of each component from all clusters
- **Configure and Deploy**: Configure, deploy and promote web applications and services through environments

The OpenChoreo Backstage plugin automatically synchronizes with your multi-cluster platform, ensuring developers always have up-to-date information about their services across all clusters.

### 6. Verify OpenChoreo Installation

#### Check that default OpenChoreo resources were created:

```bash
# Check default organization and project (on control plane)
kubectl get organizations,projects,environments -A --context kind-openchoreo-cp

# Check default platform classes (on control plane)
kubectl get serviceclass,apiclass -n default --context kind-openchoreo-cp

# Check all OpenChoreo CRDs (on control plane)
kubectl get crds | grep openchoreo --context kind-openchoreo-cp

# Check gateway resources (on data plane)
kubectl get gateway,httproute -n openchoreo-data-plane --context kind-openchoreo-dp
```

#### Check that all components are running:

```bash
# Check control plane cluster
kubectl cluster-info --context kind-openchoreo-cp
kubectl get pods -n openchoreo-control-plane --context kind-openchoreo-cp

# Check data plane cluster
kubectl cluster-info --context kind-openchoreo-dp
kubectl get pods -n openchoreo-data-plane --context kind-openchoreo-dp
kubectl get pods -n cilium --context kind-openchoreo-dp
kubectl get nodes --context kind-openchoreo-dp

# Check build plane cluster (if installed)
kubectl cluster-info --context kind-openchoreo-bp
kubectl get pods -n openchoreo-build-plane --context kind-openchoreo-bp

# Check observability plane cluster (if installed)
kubectl cluster-info --context kind-openchoreo-op
kubectl get pods -n openchoreo-observability-plane --context kind-openchoreo-op
```

## Next Steps

After completing this multi-cluster setup you can:

1. **Explore the Backstage portal** (if installed) at `http://localhost:7007` to get familiar with the multi-cluster developer interface
2. [Deploy your first component](/docs/getting-started/deploy-first-component) and see it appear automatically in Backstage across your cluster topology
3. Test the [GCP microservices demo](https://github.com/openchoreo/openchoreo/tree/main/samples/gcp-microservices-demo) to see multi-component applications in action across clusters
4. Deploy additional sample applications from the [OpenChoreo samples](https://github.com/openchoreo/openchoreo/tree/main/samples)
5. Use Backstage to monitor component health, view logs, and manage your application portfolio across clusters
6. Experiment with cross-cluster deployments and observe how components interact across the distributed platform

## Cleaning Up

To completely remove the multi-cluster installation:

```bash
# Delete all Kind clusters
kind delete cluster --name openchoreo-cp
kind delete cluster --name openchoreo-dp
kind delete cluster --name openchoreo-bp
kind delete cluster --name openchoreo-op

# Remove kubectl contexts (optional)
kubectl config delete-context kind-openchoreo-cp
kubectl config delete-context kind-openchoreo-dp
kubectl config delete-context kind-openchoreo-bp
kubectl config delete-context kind-openchoreo-op
```
