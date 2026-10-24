---
title: ReleaseLine API Reference
description: A named series of releases of one Component that is built, deployed, and promoted on its own
---

# ReleaseLine

A ReleaseLine is a named series of releases of one [Component](./component.md) that evolves independently of the component's other lines. Each line has its own Workload, its own ComponentReleases, and at most one ReleaseBinding per Environment. Values set on a line are layered on top of the component's spec for that line only.

Every component also has an implicit `default` line, which has no ReleaseLine: resources that leave `spec.owner.releaseLine` empty belong to it. See [Release Lines](../../../developer-guide/deploying-applications/release-lines.md).

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ReleaseLines are namespace-scoped. The name is the line name. It is unique within the namespace, at most 63 characters long, and cannot be `default`.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ReleaseLine
metadata:
  name: <line-name>
  namespace: <namespace>
```

Short names: `rl`, `rls`.

### Spec Fields

| Field        | Type                                              | Required | Default | Description                                                                                                                                              |
| ------------ | ------------------------------------------------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `owner`      | [ReleaseLineOwner](#releaselineowner)             | Yes      | -       | The component this line belongs to. Immutable                                                                                                            |
| `autoDeploy` | boolean                                           | No       | -       | Overrides the component's `autoDeploy` for this line                                                                                                     |
| `parameters` | object                                            | No       | -       | Deep-merged onto the component's `parameters` for this line. Maps merge key by key. Scalars and lists replace                                            |
| `traits`     | [[ComponentTrait](./component.md#componenttrait)] | No       | []      | Merged onto the component's `traits` by `kind`, `name`, and `instanceName`. A matching trait has its parameters deep-merged, and a new trait is appended |
| `workflow`   | [ReleaseLineWorkflow](#releaselineworkflow)       | No       | -       | Overrides of the component's build configuration for this line                                                                                           |

### ReleaseLineOwner

| Field           | Type   | Required | Default | Description                                          |
| --------------- | ------ | -------- | ------- | ---------------------------------------------------- |
| `projectName`   | string | Yes      | -       | Name of the project that owns the component (min: 1) |
| `componentName` | string | Yes      | -       | Name of the component (min: 1)                       |

### ReleaseLineWorkflow

The workflow kind and name are shared by every line of the component.

| Field        | Type   | Required | Default | Description                                                                                                      |
| ------------ | ------ | -------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| `parameters` | object | No       | -       | Deep-merged onto the component's `workflow.parameters` for this line, typically to build from a different branch |

### Status Fields

| Field                | Type                                                | Default | Description                                                            |
| -------------------- | --------------------------------------------------- | ------- | ---------------------------------------------------------------------- |
| `observedGeneration` | integer                                             | 0       | The generation observed by the controller                              |
| `conditions`         | []Condition                                         | []      | Standard Kubernetes conditions tracking the line's state               |
| `latestRelease`      | [LatestRelease](./component.md#latestrelease)       | -       | The most recent ComponentRelease created for this line by `autoDeploy` |
| `environments`       | [[ReleaseLineEnvironment](#releaselineenvironment)] | []      | The line's ReleaseBindings, one per environment it is deployed to      |

#### ReleaseLineEnvironment

| Field            | Type    | Description                                          |
| ---------------- | ------- | ---------------------------------------------------- |
| `environment`    | string  | Name of the environment                              |
| `releaseBinding` | string  | Name of the line's ReleaseBinding in the environment |
| `release`        | string  | The ComponentRelease bound in the environment        |
| `ready`          | boolean | Whether the ReleaseBinding is Ready                  |

#### Condition Types

`Ready` reports the line's state. Its reasons:

| Reason                  | Status | Meaning                                                                  |
| ----------------------- | ------ | ------------------------------------------------------------------------ |
| `ComponentReleaseReady` | True   | The line's latest release is bound in the first environment              |
| `Reconciled`            | True   | The line was validated. `autoDeploy` is off for the line                 |
| `ComponentNotFound`     | False  | The owning Component does not exist                                      |
| `InvalidConfiguration`  | False  | The line, or the component with the line's overrides applied, is invalid |
| `WorkloadNotFound`      | False  | The line has no Workload yet                                             |
| `TraitNotFound`         | False  | A trait the line uses does not exist                                     |
| `AutoDeployFailed`      | False  | The line's release or binding could not be created or updated            |

## Resources of a Line

Workloads, ComponentReleases, and ReleaseBindings belong to a line through `spec.owner.releaseLine`, which is immutable. Leave it empty for the default line.

| Resource                                           | Field                    | Conventional name                  |
| -------------------------------------------------- | ------------------------ | ---------------------------------- |
| [Workload](./workload.md)                          | `spec.owner.releaseLine` | `<component>-<line>-workload`      |
| [ComponentRelease](../runtime/componentrelease.md) | `spec.owner.releaseLine` | `<component>-<line>-<hash>`        |
| [ReleaseBinding](../platform/releasebinding.md)    | `spec.owner.releaseLine` | `<component>-<line>-<environment>` |

Deleting a ReleaseLine undeploys it from every environment and deletes its ComponentReleases and Workload. Deleting the Component deletes its ReleaseLines.

## Examples

### Line That Uses the Component as It Is

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ReleaseLine
metadata:
  name: canary
  namespace: default
spec:
  owner:
    projectName: default
    componentName: hello
```

### Line That Builds From Another Branch

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ReleaseLine
metadata:
  name: next
  namespace: default
spec:
  owner:
    projectName: default
    componentName: hello
  autoDeploy: true
  workflow:
    parameters:
      repository:
        revision:
          branch: "next"
  traits:
    - kind: ClusterTrait
      name: health-probes
      instanceName: health
      parameters:
        readiness:
          enabled: true
          handler:
            httpGet:
              path: /greet
              port: 9090
```

## Usage

```bash
# List the lines of a component
occ component releaseline list hello --namespace default

# Show one line and its status per environment
occ component releaseline get hello next --namespace default

# Create or update lines
occ apply -f release-lines.yaml

# Delete a line
occ component releaseline delete hello next --namespace default
```

The OpenChoreo API serves a component's lines at `/api/v1/namespaces/{namespace}/components/{component}/releaselines`, with `default` first. `POST` on that path creates a line. `GET`, `PUT`, and `DELETE` on `/releaselines/{line}` read, replace, and delete one. `default` can be read but not created, replaced, or deleted. These calls need the `releaseline:view`, `releaseline:create`, `releaseline:update`, and `releaseline:delete` actions.

## Related Resources

- [Component](./component.md) - Owns the line, and is its default line
- [Workload](./workload.md) - Each line has its own Workload
- [ComponentRelease](../runtime/componentrelease.md) - Releases of the line
- [ReleaseBinding](../platform/releasebinding.md) - Deploys a release of the line to an environment
