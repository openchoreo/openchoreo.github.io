#!/usr/bin/env bash
set -euo pipefail


step() {
  echo ""
  echo "==> $1"
}

step "Installing Gateway API CRDs..."
kubectl apply --server-side \
  -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.4.1/experimental-install.yaml

step "Installing cert-manager..."
helm upgrade --install cert-manager oci://quay.io/jetstack/charts/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.19.2 \
  --set crds.enabled=true \
  --wait --timeout 180s

step "Installing External Secrets Operator..."
helm upgrade --install external-secrets oci://ghcr.io/external-secrets/charts/external-secrets \
  --namespace external-secrets \
  --create-namespace \
  --version 1.3.2 \
  --set installCRDs=true \
  --wait --timeout 180s

step "Installing kgateway CRDs..."
helm upgrade --install kgateway-crds oci://cr.kgateway.dev/kgateway-dev/charts/kgateway-crds \
  --create-namespace --namespace openchoreo-control-plane \
  --version v2.2.1

step "Installing kgateway..."
helm upgrade --install kgateway oci://cr.kgateway.dev/kgateway-dev/charts/kgateway \
  --namespace openchoreo-control-plane --create-namespace \
  --version v2.2.1 \
  --set controller.extraEnv.KGW_ENABLE_GATEWAY_API_EXPERIMENTAL_FEATURES=true

step "Installing OpenBao..."
helm upgrade --install openbao oci://ghcr.io/openbao/charts/openbao \
  --namespace openbao \
  --create-namespace \
  --version 0.25.6 \
  --values "https://raw.githubusercontent.com/openchoreo/openchoreo/main/install/k3d/common/values-openbao.yaml" \
  --wait --timeout 300s

step "Creating ClusterSecretStore and ServiceAccount..."
kubectl apply -f - <<'EOF'
apiVersion: v1
kind: ServiceAccount
metadata:
  name: external-secrets-openbao
  namespace: openbao
---
apiVersion: external-secrets.io/v1
kind: ClusterSecretStore
metadata:
  name: default
spec:
  provider:
    vault:
      server: "http://openbao.openbao.svc:8200"
      path: "secret"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "openchoreo-secret-writer-role"
          serviceAccountRef:
            name: "external-secrets-openbao"
            namespace: "openbao"
EOF

step "Configuring CoreDNS rewrite..."
kubectl apply -f "https://raw.githubusercontent.com/openchoreo/openchoreo/main/install/k3d/common/coredns-custom.yaml"

echo ""
echo "==> All prerequisites installed successfully."
