---
title: GitOps
---

# GitOps with OpenChoreo

OpenChoreo embraces GitOps principles by treating Git repositories as the single source of truth for both platform configuration and application deployments. This approach enables declarative, versioned, and auditable infrastructure and application management across multiple environments and clusters.

## GitOps Principles in OpenChoreo

OpenChoreo implements GitOps through four core principles:

1. **Declarative Configuration**: All system state described through OpenChoreo CRDs and YAML manifests
2. **Version Control**: Platform and application configurations stored in Git repositories
3. **Automated Deployment**: Changes automatically reconciled by Kubernetes controllers and GitOps operators
4. **Continuous Monitoring**: System continuously reconciles desired vs actual state with drift detection

## Repository Organization Patterns

### Platform Configuration Repository

Structure for platform engineers managing infrastructure and standards:

```
platform-config/
├── platform/
│   ├── organizations/
│   │   └── acme-corp.yaml              # Organization definition
│   ├── dataplanes/
│   │   ├── development-cluster.yaml    # Development cluster config
│   │   ├── staging-cluster.yaml        # Staging cluster config
│   │   └── production-cluster.yaml     # Production cluster config
│   ├── buildplanes/
│   │   └── ci-buildplane.yaml          # Build infrastructure
│   ├── environments/
│   │   ├── development.yaml            # Dev environment
│   │   ├── staging.yaml               # Staging environment
│   │   └── production.yaml            # Production environment
│   ├── deployment-pipelines/
│   │   └── standard-pipeline.yaml     # Promotion workflows
│   ├── workload-classes/
│   │   ├── service-class.yaml         # Service templates
│   │   ├── webapp-class.yaml          # Web app templates
│   │   └── task-class.yaml            # Scheduled task templates
│   └── endpoint-classes/
│       ├── internal-api.yaml          # Internal API policies
│       ├── public-api.yaml            # Public API policies
│       └── webapp-endpoint.yaml       # Web application endpoints
├── configuration-groups/
│   ├── database-config.yaml           # Shared database config
│   ├── monitoring-config.yaml         # Observability settings
│   └── security-config.yaml           # Security policies
└── flux-system/
    ├── gotk-components.yaml           # Flux components
    ├── gotk-sync.yaml                 # Repository sync config
    └── kustomization.yaml             # Platform Kustomization
```

### Application Repository

Structure for development teams managing applications:

```
user-service/
├── .choreo/
│   ├── project.yaml                   # Project definition
│   ├── components/
│   │   ├── api-component.yaml         # API ComponentV
│   │   ├── worker-component.yaml      # Background worker
│   │   └── database-component.yaml    # Database component
│   ├── workloads/
│   │   ├── base/
│   │   │   ├── api-workload.yaml      # Base API workload
│   │   │   └── worker-workload.yaml   # Base worker workload
│   │   ├── development/
│   │   │   ├── kustomization.yaml     # Dev overrides
│   │   │   └── api-dev-patch.yaml     # Dev-specific config
│   │   ├── staging/
│   │   │   ├── kustomization.yaml     # Staging overrides
│   │   │   └── api-staging-patch.yaml # Staging-specific config
│   │   └── production/
│   │       ├── kustomization.yaml     # Prod overrides
│   │       └── api-prod-patch.yaml    # Prod-specific config
│   └── endpoints/
│       ├── user-api-endpoint.yaml     # API endpoint definition
│       └── admin-api-endpoint.yaml    # Admin endpoint definition
├── src/                               # Application source code
├── Dockerfile                         # Container build definition
└── README.md
```

## OpenChoreo Resource Integration

### Component with GitOps

Define application components with integrated build and deployment:

```yaml
# .choreo/components/api-component.yaml
apiVersion: choreo.dev/v1alpha1
kind: Component
metadata:
  name: user-api
  namespace: acme-corp
spec:
  componentOwner:
    projectRef: "user-service"
  componentType: "Service"
  buildSpecInComponent:
    repository: "https://github.com/acme-corp/user-service"
    contextPath: "."
    buildTemplate: "dockerfile"
    parameters:
      DOCKERFILE_PATH: "./Dockerfile"
      BUILD_ARGS: |
        NODE_ENV=production
        API_VERSION=v1
  workloadClassRef: "standard-service"
  endpointClassRef: "internal-api"
```

### Workload with Environment Overrides

Base workload specification:

```yaml
# .choreo/workloads/base/api-workload.yaml
apiVersion: choreo.dev/v1alpha1
kind: Workload
metadata:
  name: user-api-workload
spec:
  owner:
    projectName: "user-service"
    componentName: "user-api"
  containers:
    api:
      image: "user-service:latest"
      ports:
        - containerPort: 3000
          protocol: TCP
      env:
        - name: "NODE_ENV"
          value: "development"
        - name: "LOG_LEVEL"
          value: "info"
      resources:
        requests:
          memory: "256Mi"
          cpu: "200m"
        limits:
          memory: "512Mi"
          cpu: "500m"
  endpoints:
    http:
      type: "HTTP"
      port: 3000
      schema: "openapi.yaml"
  connections:
    database:
      type: "api"
      url: "postgresql://user-db:5432/users"
```

Production environment overlay:

```yaml
# .choreo/workloads/production/api-prod-patch.yaml
apiVersion: choreo.dev/v1alpha1
kind: Workload
metadata:
  name: user-api-workload
spec:
  containers:
    api:
      env:
        - name: "NODE_ENV"
          value: "production"
        - name: "LOG_LEVEL"
          value: "warn"
      resources:
        requests:
          memory: "512Mi"
          cpu: "500m"
        limits:
          memory: "1Gi"
          cpu: "1000m"
```

```yaml
# .choreo/workloads/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- ../base

patchesStrategicMerge:
- api-prod-patch.yaml

images:
- name: user-service
  newTag: v1.2.3
```

## Flux Integration

### GitRepository Configuration

Configure Flux to monitor OpenChoreo repositories:

```yaml
# Platform repository sync
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: platform-config
  namespace: flux-system
spec:
  interval: 1m
  url: https://github.com/acme-corp/platform-config
  ref:
    branch: main
  secretRef:
    name: git-credentials
---
# Application repository sync
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: user-service
  namespace: flux-system
spec:
  interval: 30s
  url: https://github.com/acme-corp/user-service
  ref:
    branch: main
  secretRef:
    name: git-credentials
```

### Kustomization for Platform Resources

Deploy platform configuration with proper dependencies:

```yaml
# Platform infrastructure
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: platform-infrastructure
  namespace: flux-system
spec:
  interval: 5m
  path: "./platform"
  prune: true
  sourceRef:
    kind: GitRepository
    name: platform-config
  healthChecks:
  - apiVersion: choreo.dev/v1alpha1
    kind: Organization
    name: acme-corp
  - apiVersion: choreo.dev/v1alpha1
    kind: DataPlane
    name: production-cluster
---
# Application deployments (depends on platform)
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: user-service-production
  namespace: flux-system
spec:
  interval: 2m
  path: "./.choreo/workloads/production"
  prune: true
  sourceRef:
    kind: GitRepository
    name: user-service
  targetNamespace: user-service-prod
  dependsOn:
  - name: platform-infrastructure
```

## Multi-Environment Management

### Environment-Specific Configurations

Development environment with relaxed settings:

```yaml
# .choreo/workloads/development/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- ../base

patchesStrategicMerge:
- dev-overrides.yaml

images:
- name: user-service
  newTag: latest

replicas:
- name: user-api-workload
  count: 1
```

Production environment with enhanced security:

```yaml
# .choreo/workloads/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- ../base

patchesStrategicMerge:
- prod-overrides.yaml
- security-policies.yaml

images:
- name: user-service
  newTag: v1.2.3

replicas:
- name: user-api-workload
  count: 3
```

### ConfigurationGroup for Environment Variables

Environment-specific configuration management:

```yaml
apiVersion: choreo.dev/v1alpha1
kind: ConfigurationGroup
metadata:
  name: user-service-config
  namespace: acme-corp
spec:
  scope:
    organization: "acme-corp"
    project: "user-service"
  environmentGroups:
  - name: "non-production"
    environments: ["development", "staging"]
  - name: "production"
    environments: ["production"]
  configurations:
  - key: "database.host"
    values:
    - environmentGroupRef: "non-production"
      value: "dev-postgres.internal"
    - environmentGroupRef: "production"
      vaultKey: "secret/prod/database/host"
  - key: "redis.url"
    values:
    - environment: "development"
      value: "redis://dev-redis:6379"
    - environment: "staging"
      value: "redis://staging-redis:6379"
    - environment: "production"
      vaultKey: "secret/prod/redis/url"
```

## Advanced GitOps Patterns

### Progressive Delivery with Canary Deployments

Canary deployment configuration using Workload bindings:

```yaml
# Production canary binding
apiVersion: choreo.dev/v1alpha1
kind: ServiceBinding
metadata:
  name: user-api-canary
  namespace: user-service-prod
spec:
  serviceClassRef: "standard-service"
  environmentRef: "production"
  workload:
    containers:
      api:
        image: "user-service:v1.3.0-canary"
    replicas: 1
  traffic:
    weight: 10  # 10% of traffic to canary
---
# Production stable binding
apiVersion: choreo.dev/v1alpha1
kind: ServiceBinding
metadata:
  name: user-api-stable
  namespace: user-service-prod
spec:
  serviceClassRef: "standard-service"
  environmentRef: "production"
  workload:
    containers:
      api:
        image: "user-service:v1.2.3"
    replicas: 2
  traffic:
    weight: 90  # 90% of traffic to stable
```

### Multi-Repository Strategy

Separate repositories for different concerns:

```yaml
# apps-of-apps.yaml - Root application managing multiple repositories
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: platform-apps
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/acme-corp/gitops-apps
    path: applications
    targetRevision: main
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

```yaml
# applications/user-service.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: user-service
spec:
  project: default
  sources:
  - repoURL: https://github.com/acme-corp/user-service
    path: .choreo/workloads/production
    targetRevision: main
  - repoURL: https://github.com/acme-corp/platform-config
    path: configuration-groups
    targetRevision: main
  destination:
    server: https://kubernetes.default.svc
    namespace: user-service-prod
  syncPolicy:
    automated:
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

## Secret Management Integration

### Vault CSI Integration

Vault secret configuration:

```yaml
apiVersion: choreo.dev/v1alpha1
kind: ConfigurationGroup
metadata:
  name: user-service-secrets
spec:
  configurations:
  - key: "database.password"
    values:
    - environment: "production"
      vaultKey: "secret/prod/database/password"
      vaultMount: "kv-v2"
  - key: "api.jwt.secret"
    values:
    - environment: "production"
      vaultKey: "secret/prod/api/jwt-secret"
      vaultMount: "kv-v2"
```

Corresponding Vault CSI SecretProviderClass:

```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: user-service-secrets
  namespace: user-service-prod
spec:
  provider: vault
  parameters:
    vaultAddress: "https://vault.internal:8200"
    roleName: "user-service"
    objects: |
      - objectName: "database-password"
        secretPath: "secret/prod/database"
        secretKey: "password"
      - objectName: "jwt-secret"
        secretPath: "secret/prod/api"
        secretKey: "jwt-secret"
  secretObjects:
  - secretName: user-service-secrets
    type: Opaque
    data:
    - objectName: database-password
      key: password
    - objectName: jwt-secret
      key: jwt-secret
```

## Promotion Workflows

### Automated Promotion Pipeline

GitHub Actions workflow for environment promotion:

```yaml
# .github/workflows/promote.yml
name: Promote Application
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
        - staging
        - production
      image_tag:
        description: 'Image tag to promote'
        required: true

jobs:
  promote:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Update Kustomization
      run: |
        cd .choreo/workloads/${{ inputs.environment }}
        yq eval '.images[0].newTag = "${{ inputs.image_tag }}"' \
          -i kustomization.yaml
          
    - name: Create GitCommitRequest
      run: |
        kubectl apply -f - <<EOF
        apiVersion: choreo.dev/v1alpha1
        kind: GitCommitRequest
        metadata:
          name: promote-${{ inputs.environment }}-$(date +%s)
          namespace: acme-corp
        spec:
          repository: "https://github.com/acme-corp/user-service"
          branch: "main"
          commitMessage: "Promote to ${{ inputs.environment }}: ${{ inputs.image_tag }}"
          files:
          - path: ".choreo/workloads/${{ inputs.environment }}/kustomization.yaml"
            content: |
              $(cat .choreo/workloads/${{ inputs.environment }}/kustomization.yaml | base64 -w 0)
        EOF
```

### Pull Request Based Promotion

Promotion through code review:

```yaml
# .github/workflows/create-promotion-pr.yml
name: Create Promotion PR
on:
  push:
    branches: [staging]

jobs:
  create-promotion-pr:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Get Latest Image Tag
      id: image
      run: |
        TAG=$(yq eval '.images[0].newTag' .choreo/workloads/staging/kustomization.yaml)
        echo "tag=$TAG" >> $GITHUB_OUTPUT
        
    - name: Update Production Config
      run: |
        yq eval '.images[0].newTag = "${{ steps.image.outputs.tag }}"' \
          -i .choreo/workloads/production/kustomization.yaml
          
    - name: Create Pull Request
      uses: peter-evans/create-pull-request@v5
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        commit-message: "Promote to production: ${{ steps.image.outputs.tag }}"
        title: "🚀 Promote to Production"
        body: |
          ## Promote to Production Environment
          
          **Image Tag**: `${{ steps.image.outputs.tag }}`
          
          ### Changes
          - Updated production image tag
          - Ready for production deployment
          
          ### Checklist
          - [ ] Staging tests passed
          - [ ] Security scan completed
          - [ ] Performance validation completed
          - [ ] Approved by platform team
        base: main
        branch: promote-to-production-${{ steps.image.outputs.tag }}
        labels: |
          promotion
          production
          auto-generated
```

## Monitoring and Observability

### GitOps Health Monitoring

Monitor GitOps deployment health:

```yaml
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: flux-system
  namespace: flux-system
spec:
  selector:
    matchLabels:
      app: source-controller
  endpoints:
  - port: http-prom
    interval: 30s
    path: /metrics
---
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: gitops-alerts
  namespace: flux-system
spec:
  groups:
  - name: gitops.rules
    rules:
    - alert: GitOpsReconciliationFailure
      expr: increase(gotk_reconcile_condition{type="Ready",status="False"}[5m]) > 0
      for: 2m
      labels:
        severity: warning
      annotations:
        summary: "GitOps reconciliation failing"
        description: "{{ $labels.kind }}/{{ $labels.name }} reconciliation has been failing"
```

### Deployment Status Dashboard

Grafana dashboard for tracking deployments:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: gitops-dashboard
  namespace: monitoring
data:
  dashboard.json: |
    {
      "dashboard": {
        "title": "OpenChoreo GitOps Status",
        "panels": [
          {
            "title": "Reconciliation Status",
            "type": "stat",
            "targets": [
              {
                "expr": "sum(gotk_reconcile_condition{type=\"Ready\",status=\"True\"})",
                "legendFormat": "Successful"
              },
              {
                "expr": "sum(gotk_reconcile_condition{type=\"Ready\",status=\"False\"})",
                "legendFormat": "Failed"
              }
            ]
          }
        ]
      }
    }
```

## Best Practices

### Repository Organization
- **Separate platform and application repositories** for clear ownership boundaries
- **Use consistent directory structures** across all repositories
- **Implement branch protection rules** with required reviews for production changes
- **Tag releases** with semantic versioning for traceability

### Security and Compliance
- **Never commit secrets in plaintext** - use Vault, External Secrets, or sealed secrets
- **Implement RBAC** for repository access aligned with OpenChoreo Organizations
- **Enable signed commits** and verify signatures in CI/CD pipelines
- **Scan configurations** for security vulnerabilities and policy violations

### Deployment Strategy
- **Use staged deployments** with proper approval gates between environments
- **Implement automated rollback** on health check failures
- **Monitor deployment metrics** and application health post-deployment
- **Maintain audit trails** through Git history and deployment logs

### Configuration Management
- **Use Kustomize overlays** for environment-specific configurations
- **Leverage ConfigurationGroups** for shared configuration across components
- **Implement configuration validation** in CI/CD pipelines
- **Version configuration changes** alongside application releases

### Troubleshooting and Operations
- **Enable comprehensive logging** for all GitOps operators and controllers
- **Implement drift detection** with automatic remediation where appropriate
- **Set up proper alerting** for reconciliation failures and configuration drift
- **Maintain disaster recovery procedures** for GitOps infrastructure and repositories
- **Document operational runbooks** for common scenarios and incident response

### Performance Optimization
- **Optimize reconciliation intervals** based on change frequency and requirements
- **Use resource limits** and requests for GitOps operators
- **Implement caching strategies** for frequently accessed configurations
- **Monitor resource utilization** and scale GitOps infrastructure appropriately

By following these GitOps patterns and best practices with OpenChoreo, organizations can achieve reliable, auditable, and scalable application delivery while maintaining the benefits of declarative infrastructure management and automated operations.
