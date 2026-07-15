---
title: Project API Reference
description: Logical boundary for organizing related components, services, and resources
---

# Project

A Project represents a cloud-native application composed of multiple components in OpenChoreo. It serves as the
fundamental unit of isolation and provides a logical boundary for organizing related components, services, and
resources.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

Projects are namespace-scoped resources.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Project
metadata:
  name: <project-name>
  namespace: <namespace> # Namespace for grouping projects
```

### Spec Fields

| Field                   | Type                                            | Required | Default | Description                                                                                                                                                                     |
| ----------------------- | ----------------------------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deploymentPipelineRef` | [DeploymentPipelineRef](#deploymentpipelineref) | Yes      | -       | Reference to the DeploymentPipeline that defines the promotion paths between environments for this project. Must reference an existing DeploymentPipeline in the same namespace |
| `type`                  | [ProjectTypeRef](#projecttyperef)               | Yes      | -       | Reference to the (Cluster)ProjectType that defines the infrastructure template materialized in each environment's data-plane namespace (immutable)                              |
| `parameters`            | object                                          | No       | -       | Project-level values validated against the referenced type's `parameters` schema and inlined into each ProjectRelease snapshot                                                  |

:::note
`type` is immutable after creation. The Project controller automatically cuts a new [ProjectRelease](../runtime/projectrelease.md) whenever the inlined type snapshot or the `parameters` values change. Projects created through the OpenChoreo API or the Backstage UI default `type` to the platform's `default` ClusterProjectType when no type is chosen; manifests applied directly must set it.
:::

### DeploymentPipelineRef

Reference to a DeploymentPipeline that defines the promotion paths between environments for this project.

| Field  | Type   | Required | Default              | Description                              |
| ------ | ------ | -------- | -------------------- | ---------------------------------------- |
| `kind` | string | No       | `DeploymentPipeline` | Kind of the deployment pipeline resource |
| `name` | string | Yes      | -                    | Name of the deployment pipeline resource |

### ProjectTypeRef

Reference to the project's infrastructure template.

| Field  | Type   | Required | Default       | Description                                          |
| ------ | ------ | -------- | ------------- | ---------------------------------------------------- |
| `kind` | string | No       | `ProjectType` | `ProjectType` or `ClusterProjectType`                |
| `name` | string | Yes      | -             | Name of the referenced type (DNS-1123 label, min: 1) |

### Status Fields

| Field                | Type                                          | Default | Description                                               |
| -------------------- | --------------------------------------------- | ------- | --------------------------------------------------------- |
| `observedGeneration` | integer                                       | 0       | The generation observed by the controller                 |
| `conditions`         | []Condition                                   | []      | Standard Kubernetes conditions tracking the project state |
| `latestRelease`      | [LatestProjectRelease](#latestprojectrelease) | -       | The most recent ProjectRelease cut for this project       |

#### LatestProjectRelease

ProjectReleaseBindings pin `spec.projectRelease` to the name recorded here (or to an older release for rollback).

| Field  | Type   | Description                                                                               |
| ------ | ------ | ----------------------------------------------------------------------------------------- |
| `name` | string | Name of the latest ProjectRelease (`<project>-<hash>`)                                    |
| `hash` | string | Spec hash that produced the release; a new release is cut when the recomputed hash drifts |

#### Condition Types

Common condition types for Project resources:

- `Ready` - Indicates if the project is fully provisioned and ready
- `Reconciled` - Indicates if the controller has successfully reconciled the project
- `NamespaceProvisioned` - Indicates if project namespaces have been created in all environments

## Examples

### Basic Project

A simple project referencing the default deployment pipeline:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Project
metadata:
  name: internal-apps
  namespace: default
  annotations:
    openchoreo.dev/display-name: Internal Applications
    openchoreo.dev/description: This project contains components that are used by company's internal applications
spec:
  deploymentPipelineRef:
    name: default-deployment-pipeline
  type:
    kind: ClusterProjectType
    name: default
```

### Project With a Custom Type and Parameters

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

## Annotations

Projects support the following annotations:

| Annotation                    | Description                         |
| ----------------------------- | ----------------------------------- |
| `openchoreo.dev/display-name` | Human-readable name for UI display  |
| `openchoreo.dev/description`  | Detailed description of the project |

## Related Resources

- [Component](./component.md) - Deployable units within projects
- [DeploymentPipeline](../platform/deployment-pipeline.md) - Defines environment promotion paths
- [ProjectType](../platform/projecttype.md) / [ClusterProjectType](../platform/clusterprojecttype.md) - Infrastructure template referenced by `spec.type`
- [ProjectRelease](../runtime/projectrelease.md) - Immutable snapshot cut by the Project controller
- [ProjectReleaseBinding](../platform/projectreleasebinding.md) - Pins a release to an environment
