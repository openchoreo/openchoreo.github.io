---
title: Project Releases
description: How project releases are cut, bound to environments, and promoted
---

# Project Releases

Components are not the only thing a project deploys. Every project also carries project-scoped infrastructure (its data-plane namespace, network policies, quotas) defined by the [ProjectType](../../platform-engineer-guide/project-types.md) it references. This page covers how that infrastructure is versioned and promoted through project releases.

Two resources drive the lifecycle:

- **ProjectRelease**: an immutable snapshot of your project's type and parameter values at a point in time. Cut automatically; you never edit one.
- **ProjectReleaseBinding**: one per environment. It pins a ProjectRelease to that environment, owns the project's data-plane namespace there, and carries per-environment configuration.

```text
Project + ProjectType  →  ProjectRelease  →  ProjectReleaseBinding (per environment)  →  data plane
```

This is the same pattern components follow with ComponentRelease and ReleaseBinding, applied at the project level.

## Setting the Project Type

Every Project references a ProjectType or ClusterProjectType through `spec.type`, and optionally supplies `parameters` that conform to the type's schema:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Project
metadata:
  name: online-store
  namespace: default
spec:
  deploymentPipelineRef:
    name: default
  type:
    kind: ClusterProjectType
    name: standard-project
  parameters:
    tier: premium
```

`spec.type` is immutable after creation. When you create a project through the Backstage UI or the OpenChoreo API without picking a type, it defaults to the platform's `default` ClusterProjectType, which provisions only the namespace. Projects applied directly with `kubectl` must set `spec.type` explicitly.

To generate a Project manifest from a type's schema, with required parameters as placeholders and optional ones as commented examples, use the scaffolder:

```bash
occ project scaffold online-store --clusterprojecttype standard-project
```

The scaffold also emits one ProjectReleaseBinding per environment in the deployment pipeline (`--no-bindings` opts out).

## How Releases Are Cut

You do not create project releases by hand. The Project controller watches the project and its referenced type, and cuts a new ProjectRelease named `<project>-<hash>` whenever either changes:

- The platform engineer updates the ProjectType (a new policy, a changed template)
- You change `spec.parameters` on the Project

The newest release is recorded on the project's status:

```bash
kubectl get project online-store -o jsonpath='{.status.latestRelease.name}'
# online-store-a1b2c3d4
```

Existing releases are never modified. Environments that pin an older release keep running it until you promote.

## Bindings and Where They Come From

Each environment gets exactly one ProjectReleaseBinding. When you create a project through the Backstage UI or scaffold it with `occ`, one binding per pipeline environment is created for you. In GitOps setups you commit the bindings yourself; the controller never creates them behind your back, so a project only deploys to the environments you have bindings for.

A binding created with an empty `spec.projectRelease` is seeded once by the Project controller with the project's latest release. After that, no controller touches the pin. Advancing it is always an explicit action: that is the promotion model.

## Deploy and Promote

### Via CLI

`occ project deploy` follows the same shape as `occ component deploy`, one verb for both deploy and promote:

```bash
# Deploy: ensure a binding for the first pipeline environment.
# The pin is left unset so the controller seeds it with the latest release.
occ project deploy online-store

# Promote: advance the staging binding to the release development runs
occ project deploy online-store --to staging

# Promote to production, setting per-environment values on the way
occ project deploy online-store --to production --set cpuQuota=16
```

`--set key=value` merges into the binding's `environmentConfigs`.

### Via Backstage UI

1. Open your project in the Backstage console
2. Go to the **Releases** view to see the releases and what each environment currently runs
3. Click **Promote** on the target environment and confirm; the UI shows a diff against what the environment runs today

### Via kubectl or GitOps

Promotion is a one-field patch on the target environment's binding:

```bash
kubectl patch projectreleasebinding online-store-staging \
  --type merge -p '{"spec":{"projectRelease":"online-store-a1b2c3d4"}}'
```

In GitOps mode, commit the same change to the binding manifest in Git. Manifests that omit `projectRelease` never conflict with the controller's one-time seeding under server-side apply, so both styles coexist: leave the field out to let the platform seed the first environment, and manage promotion pins explicitly where you want Git to be authoritative.

## Environment-Specific Configuration

The ProjectType declares an `environmentConfigs` schema; the binding supplies the values for its environment:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ProjectReleaseBinding
metadata:
  name: online-store-production
  namespace: default
spec:
  owner:
    projectName: online-store
  environment: production
  projectRelease: online-store-a1b2c3d4
  environmentConfigs:
    cpuQuota: "16"
    memoryQuota: "32Gi"
```

The same release deployed to development and production can run with different quotas or policies while the snapshot itself stays identical. Values are validated against the schema on the pinned release; a value the schema rejects surfaces on the binding's conditions rather than reaching the data plane.

## Rolling Back

Because releases are immutable and kept, rollback is the same operation as promotion: point the binding at an older release.

```bash
occ projectrelease list --project online-store
kubectl patch projectreleasebinding online-store-production \
  --type merge -p '{"spec":{"projectRelease":"online-store-9f8e7d6c"}}'
```

## What Happens on the Data Plane

The binding owns the project's data-plane namespace for its environment (named `dp-{namespace}-{project}-{environment}-{hash}` and surfaced on `status.namespace`). It creates the namespace, applies the resources rendered from the project type, and reports readiness through conditions:

| Condition        | Meaning                                               |
| ---------------- | ----------------------------------------------------- |
| `Synced`         | The pinned release resolved and rendered successfully |
| `NamespaceReady` | The data-plane namespace exists and is active         |
| `ResourcesReady` | The rendered project-type resources report healthy    |
| `Ready`          | Aggregate over the three above                        |

Your components and resources deploy into that namespace. Until the project binding for an environment has converged, component and resource deployments to that environment wait for the namespace to exist.

```bash
kubectl get prb -n default
# NAME                       PROJECT        ENVIRONMENT   RELEASE                 READY   AGE
# online-store-development   online-store   development   online-store-a1b2c3d4   True    2d
# online-store-staging       online-store   staging       online-store-a1b2c3d4   True    1d
```

## What's Next

- [Deploy and Promote](./deploy-and-promote.md): the component-level deployment workflow
- [Environment Overrides](./environment-overrides.md): per-environment configuration for components
- [Authoring ProjectTypes](../../platform-engineer-guide/project-types.md): the platform engineer side of this lifecycle
- [ProjectRelease API Reference](../../reference/api/runtime/projectrelease.md) and [ProjectReleaseBinding API Reference](../../reference/api/platform/projectreleasebinding.md)
