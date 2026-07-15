---
title: ProjectRelease API Reference
description: Immutable snapshot of a Project and its referenced ProjectType at a point in time
---

# ProjectRelease

A ProjectRelease is an immutable snapshot of a [Project](../application/project.md) and its referenced [ProjectType](../platform/projecttype.md) (or [ClusterProjectType](../platform/clusterprojecttype.md)) at a point in time. It works like a lock file: the type's spec and the project's parameter values are frozen into the release, so later edits to the ProjectType never affect releases that were already cut.

The ProjectRelease is the unit that [ProjectReleaseBindings](../platform/projectreleasebinding.md) pin to environments. Promoting a project from one environment to the next means pointing the higher environment's binding at the same release; the release itself never changes.

The Project controller cuts releases automatically: whenever the inlined type snapshot or the parameter values change, a new ProjectRelease named `<project>-<hash>` is created and recorded on the Project's `status.latestRelease`. Releases can also be authored externally (GitOps, the OpenChoreo API, or `kubectl`). There is no ProjectRelease controller logic beyond that; the resource is a pure artifact.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ProjectReleases are namespace-scoped resources created in the same namespace as the Project they snapshot. Controller-cut releases are named `<project-name>-<hash>`.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ProjectRelease
metadata:
  name: <project-name>-<hash>
  namespace: <namespace>
```

### Spec Fields

The entire spec is immutable after creation. Edits are rejected by a CEL validation rule on the CRD.

| Field         | Type                                                    | Required | Description                                                                                |
| ------------- | ------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `owner`       | [ProjectReleaseOwner](#projectreleaseowner)             | Yes      | Identifies the project this release belongs to                                             |
| `projectType` | [ProjectReleaseProjectType](#projectreleaseprojecttype) | Yes      | Frozen snapshot of the referenced (Cluster)ProjectType: kind, name, and the full spec      |
| `parameters`  | object                                                  | No       | Snapshot of `Project.spec.parameters` at release time, validated against the type's schema |

### ProjectReleaseOwner

| Field         | Type   | Required | Description                         |
| ------------- | ------ | -------- | ----------------------------------- |
| `projectName` | string | Yes      | Name of the owning project (min: 1) |

### ProjectReleaseProjectType

The frozen type snapshot. Both kinds are stored under the same spec shape, since ClusterProjectTypeSpec currently mirrors ProjectTypeSpec.

| Field  | Type                                                      | Required | Description                                           |
| ------ | --------------------------------------------------------- | -------- | ----------------------------------------------------- |
| `kind` | string                                                    | Yes      | `ProjectType` or `ClusterProjectType`                 |
| `name` | string                                                    | Yes      | Name of the type the snapshot was taken from (min: 1) |
| `spec` | [ProjectTypeSpec](../platform/projecttype.md#spec-fields) | Yes      | The full type spec as it was at snapshot time         |

### Status Fields

ProjectRelease does not report status fields. Rendering state surfaces on the ProjectReleaseBinding that pins the release.

## Examples

### Controller-Cut ProjectRelease

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ProjectRelease
metadata:
  name: online-store-a1b2c3d4
  namespace: default
spec:
  owner:
    projectName: online-store
  projectType:
    kind: ClusterProjectType
    name: standard-project
    spec:
      environmentConfigs:
        openAPIV3Schema:
          type: object
          properties:
            cpuQuota:
              type: string
              default: "4"
      resources:
        - id: cell-namespace
          template:
            apiVersion: v1
            kind: Namespace
            metadata:
              name: ${metadata.namespace}
              labels: ${metadata.labels}
  parameters:
    tier: premium
```

## Immutability

ProjectRelease's spec is enforced immutable by a CEL validation rule (`self == oldSelf`). All fields (`owner`, `projectType`, `parameters`) are part of the snapshot guarantee:

- Spec edits via `kubectl edit` or API PATCH are rejected.
- The Project controller cuts a new ProjectRelease (new hash, new name) when the inlined (Cluster)ProjectType spec or the project's `parameters` change. Previous snapshots are left untouched, so environments pinned to them keep running exactly what they were promoted to.

## Lifecycle

1. **Create.** The Project controller computes the hash of the inlined (Cluster)ProjectType spec plus `Project.spec.parameters`. When it drifts from `status.latestRelease.hash`, the controller creates a release named `{project}-{hash}` and updates `Project.status.latestRelease`. Releases can also be authored externally (GitOps, the OpenChoreo API, or `kubectl`); the controller refuses to claim an existing name owned by a different project.
2. **Promote.** A [ProjectReleaseBinding](../platform/projectreleasebinding.md)'s `spec.projectRelease` is advanced to point at this snapshot, through `occ project deploy --to <env>`, a GitOps commit, or a kubectl patch. The binding controller renders the snapshot's `projectType.spec` with the snapshot's `parameters` and the binding's `environmentConfigs`, creates the cell namespace, and applies the rendered manifests to the data plane.
3. **Delete.** When the parent Project is deleted, its cleanup finalizer removes the project's Components, Resources, and ProjectReleaseBindings, tearing down the data-plane namespaces the bindings own. Direct `kubectl delete projectrelease ...` is not blocked by a finalizer but breaks the binding chain if any binding still pins the snapshot.

## Related Resources

- [Project](../application/project.md): source of the snapshot; tracks the newest release on `status.latestRelease`
- [ProjectType](../platform/projecttype.md) / [ClusterProjectType](../platform/clusterprojecttype.md): the inlined template
- [ProjectReleaseBinding](../platform/projectreleasebinding.md): pins a release to an environment
- [ComponentRelease](./componentrelease.md): component-side counterpart
- [ResourceRelease](./resourcerelease.md): resource-side counterpart
