---
layout: docs
title: GitOps
---

# GitOps with OpenChoreo

OpenChoreo embraces GitOps principles by treating Git repositories as the single source of truth for application configurations and deployments. This approach enables declarative, versioned, and auditable infrastructure management.

## GitOps Principles

OpenChoreo implements GitOps through four core principles:

1. **Declarative Configuration**: All system state described declaratively
2. **Version Control**: Configuration stored in Git repositories
3. **Automated Deployment**: Changes automatically applied to target environments
4. **Continuous Monitoring**: System continuously reconciles desired vs actual state

## Repository Structure

### Application Repository

Structure for application-centric GitOps:

```
my-app/
├── .choreo/
│   ├── project.yaml           # Project definition
│   ├── components/
│   │   ├── api.yaml          # API component
│   │   ├── frontend.yaml     # Frontend component
│   │   └── database.yaml     # Database component
│   └── environments/
│       ├── development.yaml   # Dev environment config
│       ├── staging.yaml      # Staging environment config
│       └── production.yaml   # Production environment config
├── src/                      # Application source code
└── README.md
```

### Configuration Repository

Centralized configuration management:

```
platform-config/
├── clusters/
│   ├── development/
│   │   ├── cluster.yaml
│   │   └── applications/
│   ├── staging/
│   │   ├── cluster.yaml
│   │   └── applications/
│   └── production/
│       ├── cluster.yaml
│       └── applications/
├── environments/
│   ├── base/
│   ├── development/
│   ├── staging/
│   └── production/
└── policies/
    ├── security/
    ├── networking/
    └── governance/
```

## ArgoCD Integration

### Application Definition

OpenChoreo applications in ArgoCD:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: user-service
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/company/user-service
    path: .choreo
    targetRevision: main
  destination:
    server: https://kubernetes.default.svc
    namespace: user-service
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

### App of Apps Pattern

Manage multiple applications:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: platform-apps
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/company/platform-config
    path: clusters/production/applications
    targetRevision: main
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## Flux Integration

### GitRepository Source

Configure Flux to watch OpenChoreo repositories:

```yaml
apiVersion: source.toolkit.fluxcd.io/v1beta2
kind: GitRepository
metadata:
  name: user-service
  namespace: flux-system
spec:
  interval: 1m
  url: https://github.com/company/user-service
  ref:
    branch: main
  secretRef:
    name: git-credentials
```

### Kustomization

Deploy OpenChoreo configurations:

```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1beta2
kind: Kustomization
metadata:
  name: user-service
  namespace: flux-system
spec:
  interval: 5m
  path: "./.choreo"
  prune: true
  sourceRef:
    kind: GitRepository
    name: user-service
  targetNamespace: user-service
```

## Environment Management

### Environment-Specific Configurations

Base configuration:

```yaml
# .choreo/components/api.yaml
apiVersion: choreo.dev/v1
kind: Component
metadata:
  name: api
spec:
  type: service
  runtime: nodejs
  replicas: 2
  resources:
    requests:
      memory: "128Mi"
      cpu: "100m"
```

Production overlay:

```yaml
# .choreo/environments/production.yaml
apiVersion: choreo.dev/v1
kind: Environment
metadata:
  name: production
spec:
  components:
    api:
      replicas: 5
      resources:
        requests:
          memory: "256Mi"
          cpu: "200m"
        limits:
          memory: "512Mi"
          cpu: "500m"
      env:
        NODE_ENV: production
```

### Kustomize Integration

Using Kustomize for environment customization:

```yaml
# .choreo/environments/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- ../../base

patchesStrategicMerge:
- api-production.yaml

images:
- name: api
  newTag: v1.2.3
```

## Multi-Cluster GitOps

### Cluster Management

Define target clusters:

```yaml
# clusters/production/cluster.yaml
apiVersion: choreo.dev/v1
kind: DataPlane
metadata:
  name: production-cluster
spec:
  region: us-west-2
  provider: aws
  nodeGroups:
  - name: general
    instanceType: m5.large
    minSize: 3
    maxSize: 10
  networking:
    vpcCIDR: "10.0.0.0/16"
    subnets:
    - name: private-1
      cidr: "10.0.1.0/24"
      zone: us-west-2a
```

### Cross-Cluster Deployment

Deploy to multiple clusters:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: multi-cluster-app
spec:
  generators:
  - clusters: {}
  template:
    metadata:
      name: '{{name}}-user-service'
    spec:
      project: default
      source:
        repoURL: https://github.com/company/user-service
        path: .choreo/environments/{{metadata.labels.environment}}
        targetRevision: main
      destination:
        server: '{{server}}'
        namespace: user-service
```

## Secret Management

### Sealed Secrets

Encrypt secrets for Git storage:

```yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: database-credentials
  namespace: user-service
spec:
  encryptedData:
    username: AgBy3i4OJSWK+PiTySYZZA9rO43cGDEQAM...
    password: AgBy3i4OJSWK+PiTySYZZA9rO43cGDEQAM...
  template:
    metadata:
      name: database-credentials
      namespace: user-service
```

### External Secrets Operator

Integrate with external secret management:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: database-credentials
  namespace: user-service
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: database-credentials
    creationPolicy: Owner
  data:
  - secretKey: username
    remoteRef:
      key: database/prod
      property: username
```

## Promotion Workflows

### Branch-Based Promotion

Promote through Git branches:

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

jobs:
  promote:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v3
      
    - name: Update Environment Config
      run: |
        # Update image tags or configuration
        yq eval '.spec.image.tag = "${{ github.sha }}"' \
          -i .choreo/environments/${{ inputs.environment }}.yaml
          
    - name: Commit and Push
      run: |
        git config user.name "GitOps Bot"
        git config user.email "gitops@company.com"
        git add .choreo/environments/${{ inputs.environment }}.yaml
        git commit -m "Promote to ${{ inputs.environment }}: ${{ github.sha }}"
        git push
```

### Pull Request Based Promotion

Use PRs for approval workflows:

```yaml
name: Create Promotion PR
on:
  push:
    branches: [staging]

jobs:
  create-promotion-pr:
    runs-on: ubuntu-latest
    steps:
    - name: Create Pull Request
      uses: peter-evans/create-pull-request@v4
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        commit-message: "Promote to production"
        title: "Promote to Production"
        body: |
          Automated promotion to production environment
          
          Changes:
          - Updated image tags
          - Updated configuration
        base: main
        branch: promote-to-production
```

## Monitoring and Observability

### GitOps Metrics

Track GitOps deployment metrics:

```yaml
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: argocd-metrics
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: argocd-application-controller
  endpoints:
  - port: metrics
```

### Deployment Status

Monitor deployment health:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: user-service
spec:
  # ... other configuration
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

## Best Practices

### Repository Organization
- **Separate application and infrastructure repositories**
- **Use clear directory structures and naming conventions**
- **Implement branch protection rules**
- **Tag releases for version tracking**

### Security
- **Never commit secrets in plaintext**
- **Use secret management solutions**
- **Implement RBAC for repository access**
- **Enable signed commits and branch protection**

### Deployment Strategy
- **Use staged deployments with approval gates**
- **Implement automatic rollback on failures**
- **Monitor deployment metrics and health checks**
- **Maintain deployment history and audit trails**

### Troubleshooting
- **Enable verbose logging for GitOps operators**
- **Use drift detection and automatic remediation**
- **Implement proper error handling and notifications**
- **Maintain disaster recovery procedures**