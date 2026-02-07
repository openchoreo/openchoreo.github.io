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

OpenChoreo is designed to work with any repository structure by adhering to core GitOps principles. Choose the pattern that best fits your team's size, structure, and governance requirements.

### Mono Repository

A single repository containing all OpenChoreo resources - ideal for smaller teams or organizations where platform and development teams work closely together.

```text
.
├── namespace/                                 # namespace resources
│   └── namespace.yaml
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
├── namespace/
│   └── namespace.yaml
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
The patterns above are common starting points, but OpenChoreo is designed to work with **any repository structure** that fits your team's needs. Since OpenChoreo reconciles resources based on their content rather than their location, you have complete flexibility in how you organize your Git repositories. Other patterns you might consider:

- **Repository per Project** - Each development team owns their Project in a dedicated repository
- **Repository per Component** - Individual Components managed in separate repositories for maximum isolation
- **Separate ReleaseBindings repository** - Keep ReleaseBindings in a dedicated repository for centralized deployment control
- **Environment-based repositories** - Separate repositories for production vs non-production configurations
- **Hybrid approaches** - Combine patterns based on team structure and security requirements

Choose the structure that aligns with your team's governance policies, boundaries, and operational workflows.
:::

## Best Practices

### Repository Organization

OpenChoreo's declarative nature means it works with any repository structure - resources are reconciled based on their content, not their location. However, following consistent patterns provides significant benefits:

**Choose the right repository strategy**

- Use a **mono repository** for smaller teams or when platform and development teams collaborate closely
- Use **multi repository** for larger teams requiring strict access controls and independent workflows
- See [Repository Organization Patterns](#repository-organization-patterns) for detailed structures

**Use consistent directory structures**

While OpenChoreo doesn't enforce directory layouts, consistent structure helps teams:
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

OpenChoreo integrates with the [External Secrets Operator (ESO)](https://external-secrets.io/) to provide secure, GitOps-friendly secrets management. Platform teams define [SecretReference](../../reference/api/platform/secretreference.md) resources to bring in secrets from external secret stores without committing plaintext secrets to Git.

In a GitOps repository, SecretReference resources are typically organized under the platform-level directory (e.g., `platform/secret-references/`), managed by the platform team alongside other infrastructure resources.

For complete setup instructions, provider configuration, and usage examples, see the [Secret Management](../secret-management.mdx) guide.

## Deployment Strategy

OpenChoreo uses a two-resource model for deployments that enables GitOps-friendly, Environment-aware releases:

| Resource | Purpose |
|----------|---------|
| [**ComponentRelease**](../../reference/api/runtime/componentrelease.md) | Immutable snapshot of a Component version (workload, traits, configurations) |
| [**ReleaseBinding**](../../reference/api/platform/releasebinding.md) | Binds a ComponentRelease to an Environment with optional overrides |

This separation allows the same ComponentRelease to be deployed across multiple Environments with Environment-specific configurations. To promote a Component, create a ReleaseBinding that references the same ComponentRelease in the target Environment. To roll back, update the ReleaseBinding to reference a previous ComponentRelease.

For a hands-on walkthrough of this promotion workflow, see the [Flux CD Tutorial](./fluxcd/tutorial.mdx).

:::note Upcoming Feature
A CLI tool for managing GitOps repositories is planned for an upcoming release. This will simplify common operations such as creating ComponentReleases, automating promotions via GitHub Actions, and managing ReleaseBindings across Environments.
:::

## Monitoring and Observability

### GitOps Tool Monitoring

GitOps operators provide built-in monitoring for sync status, drift detection, reconciliation metrics, and event logging. Refer to your tool's documentation for specific setup:

- [Flux CD Monitoring](https://fluxcd.io/flux/monitoring/)

### OpenChoreo Resource Monitoring

OpenChoreo tracks the health of deployed resources through ReleaseBinding status conditions:

| Condition | Description |
|-----------|-------------|
| **ReleaseSynced** | Whether the Release was successfully created/updated |
| **ResourcesReady** | Whether all resources in the DataPlane are healthy |
| **Ready** | Overall readiness of the deployment |

Use `kubectl` to check deployment status:

```bash
kubectl get releasebindings -A -o wide
kubectl describe releasebinding <name> -n <namespace>
```


## Next Steps

Get started on GitOps with OpenChoreo:

- [Flux CD Getting Started](./fluxcd/getting-started.mdx) - Set up Flux CD with OpenChoreo
