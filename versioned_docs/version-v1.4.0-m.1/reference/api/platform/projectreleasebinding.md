---
title: ProjectReleaseBinding API Reference
description: Pins a ProjectRelease to an environment, owns the cell namespace, and carries per-environment overrides
---

# ProjectReleaseBinding

A ProjectReleaseBinding pins a [ProjectRelease](../runtime/projectrelease.md) to an [Environment](./environment.md), owns the cell namespace for that project and environment pair, and applies the project-type resources from the inlined snapshot to that namespace. It is the project-level counterpart of [ReleaseBinding](./releasebinding.md) and [ResourceReleaseBinding](./resourcereleasebinding.md).

Bindings are authored by clients: the Backstage UI and `occ project scaffold` create one binding per pipeline environment at project-creation time, and GitOps setups commit them to Git. The Project controller never creates bindings on its own. It retains one narrow behavior: when a binding's `spec.projectRelease` is empty, the controller seeds it once with the project's latest release. A pin that has been set is never touched by any controller; advancing it is how you promote.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ProjectReleaseBindings are namespace-scoped resources created in the same namespace as the Project they deploy.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ProjectReleaseBinding
metadata:
  name: <project-name>-<environment-name>
  namespace: <namespace>
```

**Short names:** `prb`, `prbs`

### Spec Fields

| Field                | Type                                                      | Required | Default | Description                                                                                                                                                              |
| -------------------- | --------------------------------------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `owner`              | [ProjectReleaseBindingOwner](#projectreleasebindingowner) | Yes      | -       | Identifies the project this binding deploys (immutable)                                                                                                                  |
| `environment`        | string                                                    | Yes      | -       | Name of the target Environment (immutable; min: 1)                                                                                                                       |
| `projectRelease`     | string                                                    | No       | -       | Name of the pinned ProjectRelease. When left unset, the Project controller seeds it once with the project's latest release; the binding stays pending until a pin is set |
| `environmentConfigs` | object                                                    | No       | -       | Per-environment values for the inlined type's `environmentConfigs` schema. Validated against the schema on the pinned release by the binding controller                  |

:::note
`owner` and `environment` are immutable after creation. To re-target a binding, delete and recreate it.
:::

### ProjectReleaseBindingOwner

| Field         | Type   | Required | Description                  |
| ------------- | ------ | -------- | ---------------------------- |
| `projectName` | string | Yes      | Name of the project (min: 1) |

### Status Fields

| Field                | Type        | Default | Description                                                                                               |
| -------------------- | ----------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `observedGeneration` | integer     | 0       | The generation observed by the controller                                                                 |
| `conditions`         | []Condition | []      | Standard Kubernetes conditions tracking binding state                                                     |
| `namespace`          | string      | -       | The data-plane namespace owned by this binding (`dp-{ns}-{project}-{env}-{hash}`), surfaced for debugging |

#### Condition Types

| Type             | Meaning                                                                                                                                                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Synced`         | The binding resolved its pinned ProjectRelease and produced a matching `RenderedRelease`. Reported false with reason `ProjectReleaseNotSet` (no pin yet), `ProjectReleaseNotFound` (pin points at a missing release), or `NamespaceMissing` (rendered output lacks the mandated Namespace) |
| `NamespaceReady` | The project's data-plane namespace exists and is active                                                                                                                                                                                                                                    |
| `ResourcesReady` | Every non-namespace entry rendered from the project type reports healthy                                                                                                                                                                                                                   |
| `Ready`          | Aggregate condition over `Synced`, `NamespaceReady`, and `ResourcesReady`                                                                                                                                                                                                                  |

## Examples

### Basic ProjectReleaseBinding

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ProjectReleaseBinding
metadata:
  name: online-store-development
  namespace: default
spec:
  owner:
    projectName: online-store
  environment: development
  projectRelease: online-store-a1b2c3d4
```

### Binding With Environment-Specific Overrides

`environmentConfigs` supplies per-environment values declared in the project type's `environmentConfigs` schema:

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
    allowMonitoringEgress: true
```

### Pending Binding (No Release Pinned Yet)

A binding created without `spec.projectRelease` is seeded once by the Project controller with the project's latest release. If no release exists yet, the binding stays `Synced=False, Reason=ProjectReleaseNotSet` until one is cut:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ProjectReleaseBinding
metadata:
  name: online-store-development
  namespace: default
spec:
  owner:
    projectName: online-store
  environment: development
  # projectRelease intentionally unset; the Project controller seeds it
  # once with the latest release, then never touches it again.
```

## Promoting a Release

Advancing `spec.projectRelease` is how a project release moves into an environment. The `occ` CLI advances the target environment's binding to the release pinned in the source environment:

```bash
# Promote whatever development runs to staging
occ project deploy online-store --to staging

# Equivalent kubectl flow
kubectl get project online-store -o jsonpath='{.status.latestRelease.name}'
kubectl patch projectreleasebinding online-store-staging \
  --type merge -p '{"spec":{"projectRelease":"<release-name>"}}'
```

In GitOps setups, advance the pin with a commit. Manifests that omit `projectRelease` never contend for the field under server-side apply: the controller's seeding only fills an empty pin once, so a Git-managed pin stays authoritative.

## Deletion

Deleting a binding tears down what it owns on the data plane, including the cell namespace, through its `RenderedRelease`. When a Project is deleted, its cleanup finalizer cascades the deletion to all of the project's bindings.

## Related Resources

- [Project](../application/project.md): owns the binding through `spec.owner.projectName`
- [ProjectRelease](../runtime/projectrelease.md): immutable snapshot pinned by `spec.projectRelease`
- [ProjectType](./projecttype.md) / [ClusterProjectType](./clusterprojecttype.md): source of the `environmentConfigs` schema and the rendered resources
- [Environment](./environment.md): target environment for the binding
- [RenderedRelease](../runtime/renderedrelease.md): final manifests produced by the binding controller
- [ReleaseBinding](./releasebinding.md): component-side counterpart
- [ResourceReleaseBinding](./resourcereleasebinding.md): resource-side counterpart
- [Project Releases (developer guide)](../../../developer-guide/deploying-applications/project-releases.md)
