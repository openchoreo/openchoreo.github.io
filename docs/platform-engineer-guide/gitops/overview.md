---
title: Overview
description: Learn how to use GitOps principles with OpenChoreo for declarative, versioned, and auditable infrastructure and application management.
sidebar_position: 1
---

# GitOps with OpenChoreo

OpenChoreo embraces GitOps principles by treating Git repositories as the single source of truth for both platform configuration and application deployments. This approach enables declarative, versioned, and auditable infrastructure and application management across multiple Environments and clusters.

## GitOps Principles

OpenChoreo implements GitOps through the four [OpenGitOps](https://opengitops.dev/) principles:

1. **Declarative**: The desired state of the system is expressed declaratively through OpenChoreo CRDs and YAML manifests
2. **Versioned and Immutable**: Desired state is stored in Git, which enforces immutability, versioning, and retains a complete version history
3. **Pulled Automatically**: GitOps agents (such as Flux CD) automatically pull the desired state declarations from the Git repository
4. **Continuously Reconciled**: Software agents continuously observe the actual system state and attempt to apply the desired state

## Repository Organization Patterns

OpenChoreo is designed to work with any repository structure by adhering to core GitOps principles. Choose the pattern that best fits your team's size, structure, and governance requirements.

### Cluster-Scoped and Namespace-Scoped Resources

Many OpenChoreo platform resources have both cluster-scoped and namespace-scoped variants (see [Platform Abstractions](../../concepts/platform-abstractions.md) for details). This distinction has a direct impact on how you organize your GitOps repository:

- **Cluster-scoped resources** (e.g., ClusterComponentType, ClusterTrait, ClusterWorkflow, ClusterDataPlane, ClusterWorkflowPlane, ClusterObservabilityPlane, ClusterAuthzRole, ClusterAuthzRoleBinding) are shared across all namespaces and organized under `platform-shared/`.
- **Namespace-scoped resources** (e.g., ComponentType, Trait, Workflow, DataPlane, WorkflowPlane, ObservabilityPlane, AuthzRole, AuthzRoleBinding) are specific to a namespace and organized under `namespaces/<namespace>/platform/`.

The default setup uses cluster-scoped variants, which provide platform-wide defaults. Namespace-scoped variants are available when you need per-namespace customization.

### Mono Repository

A single repository containing all OpenChoreo resources - ideal for smaller teams or organizations where platform and development teams work closely together.

```text
.
├── platform-shared/                            # cluster-scoped resources (available to all namespaces)
│   ├── component-types/                        # ClusterComponentType resources
│   │   ├── service.yaml
│   │   ├── webapp.yaml
│   │   └── scheduled-task.yaml
│   ├── traits/                                 # ClusterTrait resources
│   │   ├── persistent-volume.yaml
│   │   └── api-management.yaml
│   ├── workflows/                              # ClusterWorkflow resources
│   │   ├── docker-with-gitops.yaml
│   │   └── bulk-gitops-release.yaml
│   ├── infra/                                  # Infrastructure plane resources
│   │   ├── data-planes/                        # ClusterDataPlane resources
│   │   │   └── default.yaml
│   │   ├── workflow-planes/                    # ClusterWorkflowPlane resources
│   │   │   └── default.yaml
│   │   └── observability-planes/               # ClusterObservabilityPlane resources
│   │       └── default.yaml
│   ├── authz/                                  # Cluster authorization resources
│   │   ├── roles/                              # ClusterAuthzRole resources
│   │   │   ├── platform-admin.yaml
│   │   │   └── developer.yaml
│   │   └── role-bindings/                      # ClusterAuthzRoleBinding resources
│   │       └── admin-binding.yaml
│   └── cluster-workflow-templates/             # Argo ClusterWorkflowTemplate CRDs
│       └── argo/
│           ├── docker.yaml
│           └── bulk-gitops-release-template.yaml
│
└── namespaces/                                 # namespace-scoped resources
    └── <namespace>/
        ├── namespace.yaml
        │
        ├── platform/                           # platform-level resources (managed by platform team)
        │   ├── infra/
        │   │   ├── deployment-pipelines/
        │   │   │   └── standard.yaml
        │   │   ├── environments/
        │   │   │   ├── development.yaml
        │   │   │   ├── staging.yaml
        │   │   │   └── production.yaml
        │   │   ├── data-planes/                # DataPlane resources
        │   │   │   └── custom.yaml
        │   │   ├── workflow-planes/            # WorkflowPlane resources
        │   │   │   └── custom.yaml
        │   │   └── observability-planes/       # ObservabilityPlane resources
        │   │       └── custom.yaml
        │   ├── component-types/
        │   │   ├── service.yaml
        │   │   ├── webapp.yaml
        │   │   └── scheduled-task.yaml
        │   ├── traits/
        │   │   ├── persistent-volume.yaml
        │   │   └── api-management.yaml
        │   ├── component-workflows/
        │   │   └── docker-with-gitops.yaml
        │   ├── workflows/
        │   │   └── bulk-gitops-release.yaml
        │   ├── authz/                          # Namespace authorization resources
        │   │   ├── roles/                      # AuthzRole resources
        │   │   │   └── namespace-admin.yaml
        │   │   └── role-bindings/              # AuthzRoleBinding resources
        │   │       └── admin-binding.yaml
        │   └── secret-references/
        │       └── database-secret-reference.yaml
        │
        └── projects/                           # application resources (managed by development teams)
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
├── platform-shared/                            # cluster-scoped resources (available to all namespaces)
│   ├── component-types/                        # ClusterComponentType resources
│   │   ├── service.yaml
│   │   ├── webapp.yaml
│   │   └── scheduled-task.yaml
│   ├── traits/                                 # ClusterTrait resources
│   │   ├── persistent-volume.yaml
│   │   └── api-management.yaml
│   ├── workflows/                              # ClusterWorkflow resources
│   │   ├── docker-with-gitops.yaml
│   │   └── bulk-gitops-release.yaml
│   ├── infra/                                  # Infrastructure plane resources
│   │   ├── data-planes/                        # ClusterDataPlane resources
│   │   │   └── default.yaml
│   │   ├── workflow-planes/                    # ClusterWorkflowPlane resources
│   │   │   └── default.yaml
│   │   └── observability-planes/               # ClusterObservabilityPlane resources
│   │       └── default.yaml
│   ├── authz/                                  # Cluster authorization resources
│   │   ├── roles/                              # ClusterAuthzRole resources
│   │   │   ├── platform-admin.yaml
│   │   │   └── developer.yaml
│   │   └── role-bindings/                      # ClusterAuthzRoleBinding resources
│   │       └── admin-binding.yaml
│   └── cluster-workflow-templates/             # Argo ClusterWorkflowTemplate CRDs
│       └── argo/
│           ├── docker.yaml
│           └── bulk-gitops-release-template.yaml
│
└── namespaces/
    └── <namespace>/
        ├── namespace.yaml
        └── platform/
            ├── infra/
            │   ├── deployment-pipelines/
            │   │   └── standard.yaml
            │   ├── environments/
            │   │   ├── development.yaml
            │   │   ├── staging.yaml
            │   │   └── production.yaml
            │   ├── data-planes/                # DataPlane resources
            │   │   └── custom.yaml
            │   ├── workflow-planes/            # WorkflowPlane resources
            │   │   └── custom.yaml
            │   └── observability-planes/       # ObservabilityPlane resources
            │       └── custom.yaml
            ├── component-types/
            │   ├── service.yaml
            │   ├── webapp.yaml
            │   └── scheduled-task.yaml
            ├── traits/
            │   ├── persistent-volume.yaml
            │   └── api-management.yaml
            ├── component-workflows/
            │   └── docker-with-gitops.yaml
            ├── workflows/
            │   └── bulk-gitops-release.yaml
            ├── authz/                          # Namespace authorization resources
            │   ├── roles/                      # AuthzRole resources
            │   │   └── namespace-admin.yaml
            │   └── role-bindings/              # AuthzRoleBinding resources
            │       └── admin-binding.yaml
            └── secret-references/
                └── database-secret-reference.yaml
```

**Application Repository** - Managed by development teams:

```text
.
└── namespaces/
    └── <namespace>/
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

:::note Cluster-Scoped vs Namespace-Scoped Resources in the Trees
The directory trees above show both cluster-scoped resources (under `platform-shared/`) and namespace-scoped resources (under `namespaces/<namespace>/platform/`). The default OpenChoreo setup uses cluster-scoped variants (e.g., ClusterComponentType, ClusterDataPlane) to provide platform-wide defaults. You only need namespace-scoped variants when you require per-namespace customization that overrides the cluster defaults.
:::

## Best Practices

### Repository Organization

OpenChoreo's declarative nature means it works with any repository structure - resources are reconciled based on their content, not their location. However, following consistent patterns provides significant benefits:

**Choose the right repository strategy**

- Use a **mono repository** for smaller teams or when platform and development teams collaborate closely
- Use **multi repository** for larger teams requiring strict access controls and independent workflows
- See [Repository Organization Patterns](#repository-organization-patterns) for detailed structures

**Organize cluster-scoped and namespace-scoped resources separately**

- Keep cluster-scoped resources (ClusterComponentType, ClusterDataPlane, etc.) in `platform-shared/` — separate from namespace-scoped resources
- This separation makes it clear which changes affect the entire cluster vs a single namespace
- See [Cluster-Scoped and Namespace-Scoped Resources](#cluster-scoped-and-namespace-scoped-resources) for details

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

While not required for environment management, tools like Kustomize can be useful for operational tasks. For example, when using Flux CD, you can use Flux Kustomization resources to inject the target namespace for all resources in a path:

```yaml
# flux/platform-kustomization.yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: platform
  namespace: flux-system
spec:
  interval: 5m
  path: ./namespaces/default/platform
  prune: true
  targetNamespace: default # inject namespace for all resources
  sourceRef:
    kind: GitRepository
    name: my-gitops-repo
```

**Sync cluster-scoped resources before namespace-scoped resources**

When using a GitOps operator, configure `platform-shared/` to sync before namespace-scoped resources. Cluster-scoped resources (e.g., ClusterComponentType, ClusterDataPlane) define platform-wide defaults that namespace-scoped resources may depend on. For example, with Flux CD you can use the `dependsOn` field to enforce ordering:

```yaml
# flux/platform-shared-kustomization.yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: platform-shared
  namespace: flux-system
spec:
  interval: 5m
  path: ./platform-shared
  prune: true
  sourceRef:
    kind: GitRepository
    name: my-gitops-repo
---
# flux/platform-kustomization.yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: platform
  namespace: flux-system
spec:
  dependsOn:
    - name: platform-shared
  interval: 5m
  path: ./namespaces/default/platform
  prune: true
  targetNamespace: default
  sourceRef:
    kind: GitRepository
    name: my-gitops-repo
```

Note that the `platform-shared` Kustomization does not set `targetNamespace`, since cluster-scoped resources are not namespaced.

### Version Control Practices

- **Use pull requests for all changes** - Enable code review and maintain audit trails
- **Implement branch protection** - Require reviews for changes affecting production Environments
- **Tag releases** - Use semantic versioning for traceability and rollback capabilities
- **Write meaningful commit messages** - Document the intent behind configuration changes

### Security Practices

- **Never commit plaintext secrets** - Use SecretReference resources to reference external secret stores
- **Define Code Owners** - Use a `CODEOWNERS` file to protect critical files and directories by requiring review from designated owners before merging changes
- **Restrict access to `platform-shared/`** - Since changes to cluster-scoped resources affect all namespaces, use `CODEOWNERS` to require platform team review for any changes under `platform-shared/`

## Secrets Management

OpenChoreo integrates with the [External Secrets Operator (ESO)](https://external-secrets.io/) to provide secure, GitOps-friendly secrets management. Platform teams define [SecretReference](../../reference/api/platform/secretreference.md) resources to bring in secrets from external secret stores without committing plaintext secrets to Git.

In a GitOps repository, SecretReference resources are typically organized under the platform-level directory (e.g., `namespaces/<namespace>/platform/secret-references/`), managed by the platform team alongside other infrastructure resources.

For complete setup instructions, provider configuration, and usage examples, see the [Secret Management](../secret-management.mdx) guide.

## Deployment Strategy

OpenChoreo uses a two-resource model for deployments that enables GitOps-friendly, Environment-aware releases:

| Resource                                                                | Purpose                                                                      |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [**ComponentRelease**](../../reference/api/runtime/componentrelease.md) | Immutable snapshot of a Component version (workload, traits, configurations) |
| [**ReleaseBinding**](../../reference/api/platform/releasebinding.md)    | Binds a ComponentRelease to an Environment with optional overrides           |

This separation allows the same ComponentRelease to be deployed across multiple Environments with Environment-specific configurations. To promote a Component, create a ReleaseBinding that references the same ComponentRelease in the target Environment. To roll back, update the ReleaseBinding to reference a previous ComponentRelease.

For a hands-on walkthrough of this promotion workflow, see the [Using Flux CD](./using-flux-cd.mdx) tutorial.

:::tip OpenChoreo CLI (`occ`)
The `occ` CLI simplifies common GitOps operations such as creating Workloads, generating ComponentReleases, managing ReleaseBindings, and automating promotions. See the [CLI Reference](../../reference/cli-reference.md) for available commands.
:::

## Monitoring and Observability

### GitOps Tool Monitoring

GitOps operators provide built-in monitoring for sync status, drift detection, reconciliation metrics, and event logging. Refer to your tool's documentation for specific setup:

- [Flux CD Monitoring](https://fluxcd.io/flux/monitoring/)

### OpenChoreo Resource Monitoring

OpenChoreo tracks the health of deployed resources through ReleaseBinding status conditions:

| Condition          | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| **ReleaseSynced**  | Whether the RenderedRelease was successfully created/updated |
| **ResourcesReady** | Whether all resources in the DataPlane are healthy           |
| **Ready**          | Overall readiness of the deployment                          |

Use `kubectl` to check deployment status:

```bash
kubectl get releasebindings -A -o wide
kubectl describe releasebinding <name> -n <namespace>
```

## Next Steps

Get started on GitOps with OpenChoreo:

- [Using Flux CD](./using-flux-cd.mdx) - Configure Flux CD with OpenChoreo for GitOps-based deployments
