#!/usr/bin/env bash
set -euo pipefail

VERSION=$1
GITHUB_REF=${2:-main}

step() {
  echo ""
  echo "==> $1"
}

step "Installing observability plane core services..."
helm upgrade --install openchoreo-observability-plane oci://ghcr.io/openchoreo/helm-charts/openchoreo-observability-plane \
  --version $VERSION \
  --namespace openchoreo-observability-plane \
  --values "https://raw.githubusercontent.com/openchoreo/openchoreo/${GITHUB_REF}/install/k3d/single-cluster/values-op.yaml" \
  --timeout 25m

step "Installing OpenSearch-based logs module..."
helm upgrade --install observability-logs-opensearch \
  oci://ghcr.io/openchoreo/helm-charts/observability-logs-opensearch \
  --create-namespace \
  --namespace openchoreo-observability-plane \
  --version 0.5.3 \
  --set openSearchSetup.openSearchSecretName="opensearch-admin-credentials"

step "Installing OpenSearch-based traces module..."
helm upgrade --install observability-traces-opensearch \
  oci://ghcr.io/openchoreo/helm-charts/observability-tracing-opensearch \
  --create-namespace \
  --namespace openchoreo-observability-plane \
  --version 0.5.0 \
  --set openSearch.enabled=false \
  --set openSearchSetup.openSearchSecretName="opensearch-admin-credentials"

step "Installing Prometheus-based metrics module..."
helm upgrade --install observability-metrics-prometheus \
  oci://ghcr.io/openchoreo/helm-charts/observability-metrics-prometheus \
  --create-namespace \
  --namespace openchoreo-observability-plane \
  --version 0.6.1

step "Enabling logs collection in the configured logs module..."
helm upgrade observability-logs-opensearch \
  oci://ghcr.io/openchoreo/helm-charts/observability-logs-opensearch \
  --namespace openchoreo-observability-plane \
  --version 0.5.3 \
  --reuse-values \
  --set fluent-bit.enabled=true

step "Enabling kubernetes events collection and exporting to logs module..."
helm upgrade --install observability-events-otel-collector \
  oci://ghcr.io/openchoreo/helm-charts/observability-events-otel-collector \
  --namespace openchoreo-observability-plane \
  --version 0.1.1 \
  -f - <<'EOF'
collector:
  extraEnv:
    - name: OPENSEARCH_USERNAME
      valueFrom:
        secretKeyRef:
          name: opensearch-admin-credentials
          key: username
    - name: OPENSEARCH_PASSWORD
      valueFrom:
        secretKeyRef:
          name: opensearch-admin-credentials
          key: password
extraExtensions:
  basicauth/opensearch:
    client_auth:
      username: ${env:OPENSEARCH_USERNAME}
      password: ${env:OPENSEARCH_PASSWORD}
exporters:
  opensearch:
    logs_index: "k8s-events"
    logs_index_time_format: "yyyy-MM-dd"
    http:
      endpoint: "https://opensearch:9200"
      tls:
        insecure_skip_verify: true
      auth:
        authenticator: basicauth/opensearch
pipelineExporters:
  - opensearch
EOF

echo ""
echo "==> Observability plane and default modules installed successfully."
