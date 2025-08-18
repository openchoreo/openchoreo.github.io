---
title: Multi Cluster
unlisted: true
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

### **Step 1: Setup the Control Plane**

**Create the Control Plane Cluster:**
This command provisions a `kind` cluster that will host the control plane components.

```bash
curl -s https://raw.githubusercontent.com/openchoreo/openchoreo/main/install/kind/multi-cluster-setup/kind-config-cp.yaml | kind create cluster --config=-
```

**Install the Control Plane via Helm:**

```bash
helm install control-plane oci://ghcr.io/openchoreo/helm-charts/openchoreo-control-plane \
 --create-namespace --namespace openchoreo-control-plane \
 --timeout=10m \
 --kube-context kind-openchoreo-cp
```

**Verify the Installation:**
Check that all pods in the `openchoreo-control-plane` namespace are running correctly.

```bash
kubectl get pods -n openchoreo-control-plane
```

---

### **Step 2: Setup the Data Plane**

**Create the Data Plane Cluster:**
Provision a separate `kind` cluster for the data plane.

```bash
curl -s https://raw.githubusercontent.com/openchoreo/openchoreo/main/install/kind/multi-cluster-setup/kind-config-dp.yaml | kind create cluster --config=-
```


**Install Cilium CNI:**
Install Cilium as the Container Network Interface (CNI). This will create the Cilium namespace automatically:

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

**Install the Data Plane via Helm:**
Deploy the data plane components. `cert-manager` is enabled to install cert-manager.

```bash
helm install data-plane oci://ghcr.io/openchoreo/helm-charts/openchoreo-data-plane \
--create-namespace --namespace openchoreo-data-plane \
--timeout=10m \
--set cert-manager.enabled=true \
--set cert-manager.crds.enabled=true \
--kube-context kind-openchoreo-dp
```

```bash
kubectl get pods -n openchoreo-data-plane --context=kind-openchoreo-dp
```

**Register the Data Plane:**
Run the script to connect the newly created data plane to the control plane.

```bash
bash -c "$(curl -s https://raw.githubusercontent.com/openchoreo/openchoreo/main/install/add-default-dataplane.sh)" -- --multi-cluster
```

**Verify the DataPlane was created:**
```bash
kubectl get dataplane -n default
```

### **Step 3: Setup the Build Plane (Optional)**

**Create the Build Plane Cluster:**
Provision a separate `kind` cluster for the build plane.

```bash
curl -s https://raw.githubusercontent.com/openchoreo/openchoreo/main/install/kind/multi-cluster-setup/kind-config-bp.yaml | kind create cluster --config=-
```

**Install the Build Plane via Helm:**
Deploy the build plane components. `fluentBit` is enabled to install Fluent Bit.

```bash
helm install build-plane oci://ghcr.io/openchoreo/helm-charts/openchoreo-build-plane \
--create-namespace --namespace openchoreo-build-plane \
--timeout=10m \
--kube-context kind-openchoreo-bp \
--set fluentBit.enabled=true
```

**Verify the Installation:**
Wait for the components to be ready and check the pod statuses.
```bash
kubectl get pods -n openchoreo-build-plane
```

**Register the Build Plane:**
Connect the build plane to the control plane.
```bash
bash -c "$(curl -s https://raw.githubusercontent.com/openchoreo/openchoreo/main/install/add-build-plane.sh )" -- --separate
```

Make sure to insert the `build plane Kubernetes context`, which should be changed to `kind-openchoreo-bp`.


Verify that the BuildPlane was created:
```bash
kubectl get buildplane -n default
```

### **Step 4: Setup the Observability Plane (Optional)**

**Create the Observability Plane Cluster:**
Provision a separate `kind` cluster for the observability plane.

```bash
curl -s https://raw.githubusercontent.com/openchoreo/openchoreo/main/install/kind/multi-cluster-setup/kind-config-op.yaml | kind create cluster --config=-
```

**Install the Observability Plane via Helm:**
Deploy the observability components.

```bash
helm install observability-plane oci://ghcr.io/openchoreo/helm-charts/openchoreo-observability-plane \
--create-namespace --namespace openchoreo-observability-plane \
--timeout=10m \
--kube-context kind-openchoreo-op
```

**Verify the Installation:**
Wait for all pods to become ready before proceeding.

```bash
kubectl wait --for=condition=Ready pod --all -n openchoreo-observability-plane --timeout=600s
```

**Configure build plane and data plane fluentbit:**

Host and port should be accessible from the data/build plane cluster; this connection will be used to publish telemetry to the observability plane.

```bash
helm upgrade openchoreo-build-plane oci://ghcr.io/openchoreo/helm-charts/openchoreo-build-plane \
--set fluentBit.config.opensearch.host="openchoreo-op-control-plane" \
--set fluentBit.config.opensearch.port=30920 \
--kube-context kind-openchoreo-bp \
--set fluentBit.enabled=true
```

```bash
helm upgrade openchoreo-data-plane oci://ghcr.io/openchoreo/helm-charts/openchoreo-data-plane \
--namespace openchoreo-data-plane \
--set fluentBit.config.opensearch.host="openchoreo-op-control-plane" \
--set fluentBit.config.opensearch.port=30920 \
--set cert-manager.enabled=false \
--set cert-manager.crds.enabled=false \
--kube-context kind-openchoreo-dp
```

Congratulations, you have successfully installed OpenChoreo in multiple clusters.

```bash
# Delete the Kind cluster
kind delete cluster --name openchoreo-cp
kind delete cluster --name openchoreo-dp
kind delete cluster --name openchoreo-bp
kind delete cluster --name openchoreo-op

# Remove kubectl context (optional)
kubectl config delete-context kind-openchoreo-cp
kubectl config delete-context kind-openchoreo-bp
kubectl config delete-context kind-openchoreo-dp
kubectl config delete-context kind-openchoreo-op

```
