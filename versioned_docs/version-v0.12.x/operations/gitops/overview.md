---
title: Overview
description: Learn how to use GitOps principles with OpenChoreo for declarative, versioned, and auditable infrastructure and application management.
sidebar_position: 1
---

# GitOps with OpenChoreo

OpenChoreo embraces GitOps principles by treating Git repositories as the single source of truth for both platform configuration and application deployments. This approach enables declarative, versioned, and auditable infrastructure and application management across multiple Environments and clusters.

## GitOps Principles

OpenChoreo implements GitOps through four core principles:

1. **Declarative Configuration**: All system state is described through OpenChoreo CRDs and YAML manifests
2. **Version Control**: Platform and application configurations can be stored in Git repositories
3. **Automated Deployment**: Changes can be automatically reconciled by Kubernetes controllers and GitOps operators
4. **Continuous Monitoring**: The system continuously reconciles desired vs actual state with drift detection

## Repository Organization Patterns

OpenChoreo is designed to work with any repository structure by adhering to core GitOps principles. Choose the pattern that best fits your organization's size, team structure, and governance requirements.

### Mono Repository

A single repository containing all OpenChoreo resources - ideal for smaller teams or organizations where platform and development teams work closely together.

```text
.
├── organization/                              # organization and namespace
│   ├── namespace.yaml
│   └── organization.yaml
│
├── platform/                                  # platform-level resources (managed by platform team)
│   ├── infrastructure/
│   │   ├── dataplanes/
│   │   │   ├── non-prod-dataplane.yaml
│   │   │   └── prod-dataplane.yaml
│   │   ├── deployment-pipelines/
│   │   │   ├── fast-track-pipeline.yaml
│   │   │   └── standard-pipeline.yaml
│   │   └── environments/
│   │       ├── dev-environment.yaml
│   │       ├── staging-environment.yaml
│   │       └── prod-environment.yaml
│   ├── component-types/
│   │   ├── http-service.yaml
│   │   ├── scheduled-task.yaml
│   │   └── web-app.yaml
│   ├── traits/
│   │   ├── emptydir-volume.yaml
│   │   └── persistent-volume.yaml
│   └── secret-references/                      # secret-references defined by platform team
│       └── database-secret-reference.yaml
│
└── projects/                                   # application resources (managed by development teams)
    └── <project-name>/
        ├── project.yaml
        └── components/
            └── <component-name>/
                ├── component.yaml
                ├── workload.yaml
                ├── releases/
                │   └── <component>-<date>-<revision>.yaml
                └── release-bindings/
                    ├── <component>-development.yaml
                    └── <component>-staging.yaml
```

### Multi Repository

Separate repositories for platform configuration and application resources. This pattern is recommended for larger organizations where platform teams and development teams have different access controls, approval workflows, and release cadences.

**Platform Configuration Repository** - Managed by platform engineers:

```text
.
├── organization/
│   ├── namespace.yaml
│   └── organization.yaml
│
├── infrastructure/
│   ├── dataplanes/
│   │   ├── non-prod-dataplane.yaml
│   │   └── prod-dataplane.yaml
│   ├── deployment-pipelines/
│   │   ├── fast-track-pipeline.yaml
│   │   └── standard-pipeline.yaml
│   └── environments/
│       ├── dev-environment.yaml
│       ├── staging-environment.yaml
│       └── prod-environment.yaml
│
├── component-types/
│   ├── http-service.yaml
│   ├── scheduled-task.yaml
│   └── web-app.yaml
│
├── traits/
│   ├── emptydir-volume.yaml
│   └── persistent-volume.yaml
│
└── secret-references/
    └── database-secret-reference.yaml
```

**Application Repository** - Managed by development teams:

```text
.
└── projects/
    └── <project-name>/
        ├── project.yaml
        └── components/
            └── <component-name>/
                ├── component.yaml
                ├── workload.yaml
                ├── releases/
                │   └── <component>-<date>-<revision>.yaml
                └── release-bindings/
                    ├── <component>-development.yaml
                    └── <component>-staging.yaml
```

**Benefits of Multi Repository:**

- **Clear ownership boundaries** - Platform teams control infrastructure; development teams control applications
- **Independent access controls** - Different permissions and approval workflows per repository
- **Separate release cadences** - Platform changes can be reviewed and deployed independently from application changes
- **Reduced blast radius** - Changes to one repository don't affect the other
- **Easier compliance and auditing** - Clear separation for regulatory requirements

:::tip Flexible Repository Structures
The patterns above are common starting points, but OpenChoreo is designed to work with **any repository structure** that fits your organization's needs. Since OpenChoreo reconciles resources based on their content rather than their location, you have complete flexibility in how you organize your Git repositories. Other patterns you might consider:

- **Repository per Project** - Each development team owns their Project in a dedicated repository
- **Repository per Component** - Individual Components managed in separate repositories for maximum isolation
- **Separate ReleaseBindings repository** - Keep ReleaseBindings in a dedicated repository for centralized deployment control
- **Environment-based repositories** - Separate repositories for production vs non-production configurations
- **Hybrid approaches** - Combine patterns based on team structure and security requirements

Choose the structure that aligns with your organization's governance policies, team boundaries, and operational workflows.
:::

## Best Practices

### Repository Organization

OpenChoreo's declarative nature means it works with any repository structure - resources are reconciled based on their content, not their location. However, following consistent patterns provides significant benefits:

**Choose the right repository strategy**

- Use a **mono repository** for smaller teams or when platform and development teams collaborate closely
- Use **multi repository** for larger organizations requiring strict access controls and independent workflows
- See [Repository Organization Patterns](#repository-organization-patterns) for detailed structures

**Use consistent directory structures**

While OpenChoreo doesn't enforce directory layouts, consistent organization helps teams:
- Quickly locate resources across projects
- Onboard new team members faster
- Apply automation and tooling uniformly

### Configuration Management

**OpenChoreo handles resource dependencies automatically**

OpenChoreo resources don't require specific ordering or dependency management. The controllers reconcile resources based on their relationships, not their application order.

**OpenChoreo supports multiple Environments natively**

Unlike traditional Kubernetes GitOps where you need separate branches or Kustomize overlays per environment, OpenChoreo handles multi-environment deployments through its built-in resources ([`Environment`](../../reference/api/platform/environment.md), [`ComponentRelease`](../../reference/api/runtime/componentrelease.md), [`ReleaseBinding`](../../reference/api/platform/releasebinding.md)). You define your Component once and use **ReleaseBindings** to deploy it across Environments.

**Consider Kustomize for operational concerns (optional)**

While not required for environment management, tools like Kustomize can still be useful for operational tasks such as injecting namespaces or adding common labels:

```yaml
# kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: my-org      # inject namespace for all resources
commonLabels:
  managed-by: gitops
resources:
  - project.yaml
  - components/
```

### Version Control Practices

- **Use pull requests for all changes** - Enable code review and maintain audit trails
- **Implement branch protection** - Require reviews for changes affecting production Environments
- **Tag releases** - Use semantic versioning for traceability and rollback capabilities
- **Write meaningful commit messages** - Document the intent behind configuration changes

### Security Practices

- **Never commit plaintext secrets** - Use SecretReference resources to reference external secret stores
- **Define Code Owners** - Use a `CODEOWNERS` file to protect critical files and directories by requiring review from designated owners before merging changes.

## Secrets Management

OpenChoreo integrates with the [External Secrets Operator (ESO)](https://external-secrets.io/) to provide secure, GitOps-friendly secrets management. Platform teams can define [SecretReference](../../../reference/api/platform/secretreference) resources to bring in secrets from external secret stores. For complete setup instructions and provider configuration, see the [Secret Management](../secret-management.mdx) guide.

### Organize Secrets

SecretReference resources are defined at the platform level and managed by the platform team:

| Directory Location | Use Case |
|-------------------|----------|
| `platform/secret-references/` | Infrastructure and application secrets: container registry credentials, database credentials, API keys, service tokens |

This centralized approach enables:
- **Clear ownership**: Platform team manages all secrets through SecretReference resources
- **Consistent security**: Unified access controls and audit policies
- **Simplified governance**: Single location for secret management across all Projects and Components

### Using Secrets in Workloads

Reference secrets in your Workload definitions using `secretRef`:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workload
metadata:
  name: my-app-workload
spec:
  containers:
    main:
      image: "my-app:latest"
      env:
        - key: DATABASE_PASSWORD
          valueFrom:
            secretRef:
              name: database-secret    # SecretReference name
              key: password            # Key defined in SecretReference
        - key: DATABASE_USERNAME
          valueFrom:
            secretRef:
              name: database-secret
              key: username
      files:
        - key: api-token
          mountPath: /secrets
          valueFrom:
            secretRef:
              name: api-secret
              key: token
```

### DataPlane Secret Store Configuration

Each DataPlane can be configured with a ClusterSecretStore reference that ESO uses to connect to your external secrets provider:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: DataPlane
metadata:
  name: production-dataplane
spec:
  secretStoreRef:
    name: vault-secret-store    # ClusterSecretStore in the DataPlane cluster
  # ... other configuration
```

### Supported External Secret Providers

OpenChoreo works with any provider supported by the External Secrets Operator:

| Provider | Use Case |
|----------|----------|
| **HashiCorp Vault** | Enterprise secrets management with dynamic secrets |
| **AWS Secrets Manager** | AWS-native secrets for cloud workloads |
| **Google Secret Manager** | GCP-native secrets management |
| **Azure Key Vault** | Azure-native secrets and key management |
| **Kubernetes Secrets** | For development or single-cluster setups |

### Security Best Practices

- **Never commit plaintext secrets** - Always use SecretReference resources
- **Use Environment-specific secret paths** - Organize secrets by Environment (e.g., `dev/database`, `prod/database`)
- **Set appropriate refresh intervals** - Balance freshness with API rate limits
- **Implement least-privilege access** - Configure secret store access per Environment
- **Audit secret access** - Enable logging on your external secrets provider

## Deployment Strategy

OpenChoreo uses a two-resource model for deployments that enables GitOps-friendly, Environment-aware releases.

### Release and ReleaseBinding

| Resource | Purpose |
|----------|---------|
| **ComponentRelease** | Immutable snapshot of a Component version (workload, traits, configurations) |
| **ReleaseBinding** | Binds a ComponentRelease to an Environment with optional overrides |

This separation allows the same ComponentRelease to be deployed across multiple Environments with Environment-specific configurations:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ReleaseBinding
metadata:
  name: my-service-production
spec:
  owner:
    project: my-project
    component: my-service
  environment: production
  releaseName: my-service-v1.2.0
  workloadOverrides:
    containers:
      main:
        env:
          - key: LOG_LEVEL
            value: warn
```

:::note Upcoming Feature
A CLI tool for managing GitOps repositories is planned for an upcoming release. This will simplify common operations such as creating ComponentReleases, automating promotions via GitHub Actions, and managing ReleaseBindings across Environments.
:::

### Health Monitoring

OpenChoreo tracks resource health with five states:

| State | Description |
|-------|-------------|
| **Healthy** | Resource is operating normally |
| **Progressing** | Resource is transitioning (scaling, updating) |
| **Degraded** | Resource has errors (CrashLoopBackOff, failed replicas) |
| **Suspended** | Resource is intentionally paused |
| **Unknown** | Health cannot be determined |

The Release controller monitors Deployments, StatefulSets, Jobs, CronJobs, and other resources, updating status in real-time.

### Rollback

OpenChoreo implements rollback through Git and resource lifecycle:

- **Git-based rollback**: Update the ReleaseBinding to reference a previous ComponentRelease
- **Automatic cleanup**: When a ReleaseBinding is deleted or updated to deploy a new ComponentRelease, OpenChoreo automatically handles the cleanup of old resources in the DataPlane 

```yaml
# Rollback by updating ReleaseBinding to previous version
spec:
  releaseName: my-service-v1.1.0  # Previous stable version
```

### Best Practices

- **Create immutable ComponentReleases** for each version to enable reliable rollbacks
- **Use ReleaseBinding overrides** for Environment-specific configurations instead of duplicating ComponentReleases
- **Monitor health status** through ReleaseBinding conditions before promoting to next Environment
- **Maintain audit trails** through Git history - all deployment changes are tracked as commits

## Monitoring and Observability

### GitOps Tool Monitoring

When using GitOps operators like FluxCD or ArgoCD, you can leverage their built-in monitoring capabilities:

- **Sync status**: Monitor repository synchronization state and reconciliation loops
- **Drift detection**: Track when actual cluster state diverges from Git-defined state
- **Reconciliation metrics**: Observe controller performance and error rates
- **Event logging**: Capture detailed logs of all Git operations and resource updates

Each GitOps tool provides its own metrics and dashboards. Refer to your tool's documentation for specific monitoring setup:
- [FluxCD Monitoring](https://fluxcd.io/flux/monitoring/)
- [ArgoCD Metrics](https://argo-cd.readthedocs.io/en/stable/operator-manual/metrics/)

### OpenChoreo Resource Monitoring

OpenChoreo tracks the health of deployed resources through ReleaseBinding status conditions. You can monitor:

- **ReleaseSynced**: Whether the Release was successfully created/updated
- **ResourcesReady**: Whether all resources in the DataPlane are healthy
- **Ready**: Overall readiness of the deployment

Use `kubectl` to check deployment status:

```bash
kubectl get releasebindings -A -o wide
kubectl describe releasebinding <name> -n <namespace>
```

:::note Upcoming Feature
OpenChoreo will introduce built-in observability rules in an upcoming release, enabling you to define GitOps-related alerting and monitoring rules directly through OpenChoreo resources. This will provide unified visibility across your deployments without requiring separate monitoring configuration for each GitOps tool.
:::


## Next Steps

Get started on GitOps with OpenChoreo:

- [FluxCD Getting Started](./fluxcd/getting-started.mdx) - Set up FluxCD with OpenChoreo
