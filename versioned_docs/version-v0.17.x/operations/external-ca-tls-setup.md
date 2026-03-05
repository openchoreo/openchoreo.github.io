---
title: mTLS Setup for Cluster Gateway and Agent with External CA
description: Configure mTLS for cluster gateway and agent communication using an external CA instead of cert-manager.
sidebar_position: 6
---

# mTLS Setup for Cluster Gateway and Agent with External CA

This guide explains how to configure mTLS for OpenChoreo's cluster gateway and cluster agent communication without relying on cert-manager. Instead, you provision certificates using an external CA (e.g., OpenSSL, HashiCorp Vault, AWS ACM PCA, or a corporate PKI).

## When to Use This Guide

- **Air-gapped environments** where cert-manager cannot be installed
- **Corporate PKI mandates** requiring certificates from an approved CA
- **Proof-of-concept setups** where simplicity is preferred over automation
- **Environments** where cert-manager is not desired as a dependency

## What cert-manager Does by Default

In the default OpenChoreo installation, cert-manager handles the full certificate lifecycle:

1. Creates a self-signed CA (stored in Secret `cluster-gateway-ca`)
2. Issues a server certificate for the cluster gateway (stored in Secret `cluster-gateway-tls`)
3. Issues client certificates for each cluster agent (stored in Secret `cluster-agent-tls`)
4. Extracts the CA certificate into a ConfigMap (`cluster-gateway-ca`) via a post-install Job
5. Handles automatic renewal before expiry

Without cert-manager, you must perform all of these steps manually.

## Certificate Architecture

Three types of certificates are needed:

```text
External CA (your CA)
  |
  ├── Gateway Server Certificate (control plane cluster)
  |     Secret: cluster-gateway-tls (tls.crt, tls.key)
  |     Used by: cluster-gateway Deployment
  |     Purpose: TLS server identity for WebSocket endpoint
  |     DNS SANs: cluster-gateway.<namespace>.svc,
  |               cluster-gateway.<namespace>.svc.cluster.local
  |
  └── Agent Client Certificate (one per plane, in each plane's cluster)
        Secret: cluster-agent-tls (tls.crt, tls.key)
        Used by: cluster-agent Deployment
        Purpose: mTLS client authentication to gateway
        CN: <planeID>
        Extended Key Usage: Client Authentication
```

Additionally, the CA certificate is distributed as a ConfigMap (`cluster-gateway-ca`) to:
- The control plane cluster (for the CA extractor Job / controller-manager)
- Each plane cluster (so agents can verify the gateway's server certificate)

And the CA certificate is configured in the [DataPlane](../reference/api/platform/dataplane.md)/[BuildPlane](../reference/api/platform/buildplane.md)/[ObservabilityPlane](../reference/api/platform/observabilityplane.md) CR so the gateway can verify agent client certificates on a per-CR basis.

## Prerequisites

- `openssl` (or your preferred PKI tool)
- `kubectl` with access to the control plane cluster and each plane cluster
- Familiarity with your Helm values files

## Step 1: Create a CA

Generate a CA that will sign both the gateway server certificate and all agent client certificates.

```bash
# Generate CA private key
openssl genrsa -out ca.key 4096

# Generate CA certificate (10 years validity)
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 \
  -out ca.crt \
  -subj "/CN=openchoreo-cluster-gateway-ca/O=OpenChoreo"
```

:::warning Security
Keep `ca.key` secure. It should only be accessible to administrators who issue certificates.
:::

## Step 2: Generate the Gateway Server Certificate

This certificate is used by the `cluster-gateway` deployment in the control plane cluster.

```bash
# Generate server private key
openssl genrsa -out gateway-server.key 2048

# Create CSR config with SANs
cat > gateway-server-csr.conf <<EOF
[req]
req_extensions = v3_req
distinguished_name = req_distinguished_name
[req_distinguished_name]
[v3_req]
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = cluster-gateway.openchoreo-control-plane.svc
DNS.2 = cluster-gateway.openchoreo-control-plane.svc.cluster.local
EOF

# Generate CSR
openssl req -new -key gateway-server.key \
  -out gateway-server.csr \
  -subj "/CN=cluster-gateway/O=OpenChoreo" \
  -config gateway-server-csr.conf

# Sign with CA
openssl x509 -req -in gateway-server.csr \
  -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out gateway-server.crt -days 365 -sha256 \
  -extensions v3_req -extfile gateway-server-csr.conf
```

:::warning Important
The DNS SANs must match the gateway's Kubernetes Service name. If your control plane namespace is different from `openchoreo-control-plane`, update the `alt_names` section accordingly. The default DNS names are configured in `clusterGateway.tls.dnsNames` in the control plane Helm values.
:::

## Step 3: Generate Agent Client Certificates

Generate one client certificate per plane. The Common Name (CN) **must match the `planeID`** configured for that plane.

### Data Plane

```bash
PLANE_ID="default"  # Replace with your actual planeID

openssl genrsa -out agent-dataplane.key 2048

openssl req -new -key agent-dataplane.key \
  -out agent-dataplane.csr \
  -subj "/CN=${PLANE_ID}/O=OpenChoreo"

cat > agent-client-ext.conf <<EOF
basicConstraints = CA:FALSE
keyUsage = digitalSignature
extendedKeyUsage = clientAuth
EOF

openssl x509 -req -in agent-dataplane.csr \
  -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out agent-dataplane.crt -days 365 -sha256 \
  -extfile agent-client-ext.conf
```

### Build Plane

```bash
PLANE_ID="default"  # Replace with your build plane's planeID

openssl genrsa -out agent-buildplane.key 2048

openssl req -new -key agent-buildplane.key \
  -out agent-buildplane.csr \
  -subj "/CN=${PLANE_ID}/O=OpenChoreo"

openssl x509 -req -in agent-buildplane.csr \
  -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out agent-buildplane.crt -days 365 -sha256 \
  -extfile agent-client-ext.conf
```

### Observability Plane

```bash
PLANE_ID="default"  # Replace with your observability plane's planeID

openssl genrsa -out agent-obsplane.key 2048

openssl req -new -key agent-obsplane.key \
  -out agent-obsplane.csr \
  -subj "/CN=${PLANE_ID}/O=OpenChoreo"

openssl x509 -req -in agent-obsplane.csr \
  -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out agent-obsplane.crt -days 365 -sha256 \
  -extfile agent-client-ext.conf
```

:::note
If multiple planes share the same `planeID` and CA, they can use the same client certificate. If you use different CAs per plane for isolation, each plane's CA must be referenced in its respective CR.
:::

## Step 4: Create Kubernetes Secrets and ConfigMaps

:::warning Important
Create all Secrets and ConfigMaps **before** running `helm install`, so the Deployments can mount them immediately.
:::

### Control Plane Cluster

```bash
# Gateway server TLS secret
kubectl create secret tls cluster-gateway-tls \
  --cert=gateway-server.crt \
  --key=gateway-server.key \
  -n openchoreo-control-plane

# CA ConfigMap (used by agents and controller-manager to verify the gateway)
kubectl create configmap cluster-gateway-ca \
  --from-file=ca.crt=ca.crt \
  -n openchoreo-control-plane
```

### Data Plane Cluster

```bash
# Agent client certificate secret
kubectl create secret tls cluster-agent-tls \
  --cert=agent-dataplane.crt \
  --key=agent-dataplane.key \
  -n openchoreo-data-plane

# Gateway CA ConfigMap (agent uses this to verify gateway server cert)
kubectl create configmap cluster-gateway-ca \
  --from-file=ca.crt=ca.crt \
  -n openchoreo-data-plane
```

### Build Plane Cluster

```bash
kubectl create secret tls cluster-agent-tls \
  --cert=agent-buildplane.crt \
  --key=agent-buildplane.key \
  -n openchoreo-build-plane

kubectl create configmap cluster-gateway-ca \
  --from-file=ca.crt=ca.crt \
  -n openchoreo-build-plane
```

### Observability Plane Cluster

```bash
kubectl create secret tls cluster-agent-tls \
  --cert=agent-obsplane.crt \
  --key=agent-obsplane.key \
  -n openchoreo-observability-plane

kubectl create configmap cluster-gateway-ca \
  --from-file=ca.crt=ca.crt \
  -n openchoreo-observability-plane
```

## Step 5: Helm Values Configuration

### Handling cert-manager CRD Templates

The control plane and data plane Helm charts include cert-manager `Certificate` and `Issuer` templates that are rendered when TLS is enabled. If cert-manager CRDs are not installed in the cluster, `helm install` will fail with an error like:

```text
Error: unable to build kubernetes objects from release manifest:
resource mapping not found for name: "..." namespace: "..."
no matches for kind "Certificate" in version "cert-manager.io/v1"
```

**Recommended approach:** Install only the cert-manager CRDs (without the controller). This allows the Helm templates to render successfully, but since no cert-manager controller is running, the Certificate and Issuer resources will simply sit idle — your pre-created Secrets will be used directly.

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.19.3/cert-manager.crds.yaml
```

This is lightweight (just CRD definitions, no pods) and is the simplest way to make the Helm chart compatible without cert-manager.

### Control Plane Values

Use the default TLS values — the gateway deployment mounts from `clusterGateway.tls.secretName` regardless of whether cert-manager created the Secret:

```yaml
clusterGateway:
  tls:
    enabled: true
    secretName: cluster-gateway-tls  # Must match the Secret you created
```

### Data Plane Values

```yaml
clusterAgent:
  tls:
    enabled: true
    secretName: cluster-agent-tls
    clientSecretName: cluster-agent-tls   # Secret with agent client cert
    serverCAConfigMap: cluster-gateway-ca  # ConfigMap with gateway CA cert
    caSecretName: cluster-gateway-ca       # Referenced by cert-manager Issuer (harmless if controller not running)
```

The key values that affect the deployment's volume mounts are `clientSecretName` and `serverCAConfigMap` — these must match the Secret and ConfigMap names you created in Step 4.

### Build Plane and Observability Plane Values

Use the same pattern as the data plane, adjusting `planeType` and `planeID` accordingly:

```yaml
clusterAgent:
  planeType: buildplane  # or "observabilityplane"
  planeID: default        # Must match the CN in the client certificate
  tls:
    enabled: true
    secretName: cluster-agent-tls
    clientSecretName: cluster-agent-tls
    serverCAConfigMap: cluster-gateway-ca
    caSecretName: cluster-gateway-ca
```

## Step 6: Configure the Plane CRs

Each DataPlane, BuildPlane, or ObservabilityPlane CR must reference the CA certificate used to sign the corresponding agent's client certificate. The gateway uses this to verify agent connections on a per-CR basis.

### Inline CA Value

```yaml
apiVersion: core.openchoreo.dev/v1alpha1
kind: DataPlane
metadata:
  name: my-data-plane
  namespace: default
spec:
  planeID: "default"
  clusterAgent:
    clientCA:
      value: |
        -----BEGIN CERTIFICATE-----
        <paste contents of ca.crt here>
        -----END CERTIFICATE-----
  gateway:
    publicVirtualHost: "gw.example.com"
```

### CA from a Secret Reference

```yaml
apiVersion: core.openchoreo.dev/v1alpha1
kind: DataPlane
metadata:
  name: my-data-plane
  namespace: default
spec:
  planeID: "default"
  clusterAgent:
    clientCA:
      secretRef:
        name: my-external-ca
        key: ca.crt
        namespace: openchoreo-control-plane
  gateway:
    publicVirtualHost: "gw.example.com"
```

:::tip Key Point
The `clientCA` field tells the gateway which CA to trust for verifying agent client certificates. Without this, agent connections will be rejected with certificate verification errors.
:::

## Step 7: Certificate Renewal

Without cert-manager, certificate renewal is a manual process.

### Generating Replacement Certificates

Use the same OpenSSL commands from Steps 2 and 3 with the **same CA** to generate new certificates.

### Updating Kubernetes Secrets

```bash
# Update the gateway server certificate
kubectl create secret tls cluster-gateway-tls \
  --cert=gateway-server-new.crt \
  --key=gateway-server-new.key \
  -n openchoreo-control-plane \
  --dry-run=client -o yaml | kubectl apply -f -

# Update an agent client certificate
kubectl create secret tls cluster-agent-tls \
  --cert=agent-dataplane-new.crt \
  --key=agent-dataplane-new.key \
  -n openchoreo-data-plane \
  --dry-run=client -o yaml | kubectl apply -f -
```

### Restarting Pods

Both the gateway and agent read certificates at startup and do not hot-reload them. After updating secrets, restart the affected deployments:

```bash
# Restart gateway
kubectl rollout restart deployment cluster-gateway -n openchoreo-control-plane

# Restart agent
kubectl rollout restart deployment cluster-agent-dataplane -n openchoreo-data-plane
```

### Renewal Reminders

Set calendar reminders or use external automation (e.g., a CronJob, CI/CD pipeline, or your PKI's built-in renewal workflow) to renew certificates before they expire.

## Troubleshooting

### Common Errors

| Error | Cause | Fix |
|---|---|---|
| `x509: certificate signed by unknown authority` | Agent doesn't trust gateway's CA, or gateway doesn't trust agent's CA | Verify `cluster-gateway-ca` ConfigMap and `clientCA` in the plane CR both contain the correct CA |
| `tls: bad certificate` | Certificate format issue or wrong certificate type | Ensure server cert has `serverAuth` EKU and client cert has `clientAuth` EKU |
| `no CRs found with planeID` | No DataPlane/BuildPlane/ObservabilityPlane CR matches the agent's planeID | Ensure the plane CR exists and its `spec.planeID` matches the agent's `--plane-id` |
| `certificate not valid for any CR` | Agent's client cert cannot be verified by any CR's `clientCA` | Ensure the plane CR's `clientCA` contains the CA that signed the agent's client cert |

### Verify the Certificate Chain

```bash
# Verify gateway server cert
openssl verify -CAfile ca.crt gateway-server.crt

# Verify agent client cert
openssl verify -CAfile ca.crt agent-dataplane.crt
```

### Inspect Certificate SANs

```bash
openssl x509 -in gateway-server.crt -noout -text | grep -A1 "Subject Alternative Name"
```

### Inspect Certificate CN and Key Usage

```bash
# Check CN (should match planeID for agent certs)
openssl x509 -in agent-dataplane.crt -noout -subject

# Check key usage
openssl x509 -in agent-dataplane.crt -noout -text | grep -A1 "Extended Key Usage"
```

### Check Pod Logs

```bash
# Gateway logs — look for TLS handshake or certificate verification errors
kubectl logs -l app=cluster-gateway -n openchoreo-control-plane

# Agent logs — look for connection or TLS errors
kubectl logs -l app=cluster-agent -n openchoreo-data-plane
```

## Quick Reference: Secrets and ConfigMaps

| Component | Cluster | Resource Type | Name | Keys | Purpose |
|---|---|---|---|---|---|
| Gateway | Control Plane | Secret (TLS) | `cluster-gateway-tls` | `tls.crt`, `tls.key` | Gateway server certificate |
| Gateway CA | Control Plane | ConfigMap | `cluster-gateway-ca` | `ca.crt` | CA cert for controller-manager |
| Agent (DP) | Data Plane | Secret (TLS) | `cluster-agent-tls` | `tls.crt`, `tls.key` | Agent client certificate |
| Agent CA (DP) | Data Plane | ConfigMap | `cluster-gateway-ca` | `ca.crt` | CA cert to verify gateway |
| Agent (BP) | Build Plane | Secret (TLS) | `cluster-agent-tls` | `tls.crt`, `tls.key` | Agent client certificate |
| Agent CA (BP) | Build Plane | ConfigMap | `cluster-gateway-ca` | `ca.crt` | CA cert to verify gateway |
| Agent (OP) | Observability | Secret (TLS) | `cluster-agent-tls` | `tls.crt`, `tls.key` | Agent client certificate |
| Agent CA (OP) | Observability | ConfigMap | `cluster-gateway-ca` | `ca.crt` | CA cert to verify gateway |

## Related Resources

- [Multi-Cluster Connectivity](./multi-cluster-connectivity.mdx) — Default mTLS setup using cert-manager
- [Deployment Topology](./deployment-topology.mdx) — Overview of OpenChoreo deployment models
- [DataPlane API Reference](../reference/api/platform/dataplane.md) — DataPlane CR specification
- [Helm Chart Reference: Control Plane](../reference/helm/control-plane.mdx) — Control plane Helm values
- [Helm Chart Reference: Data Plane](../reference/helm/data-plane.mdx) — Data plane Helm values
