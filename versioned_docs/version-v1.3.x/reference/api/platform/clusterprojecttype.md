---
title: ClusterProjectType API Reference
description: Cluster-scoped project infrastructure template available to projects in all namespaces
---

# ClusterProjectType

A ClusterProjectType is the cluster-scoped sibling of [ProjectType](./projecttype.md). Projects in any namespace can reference a ClusterProjectType through `Project.spec.type` with `kind: ClusterProjectType`. Use it for infrastructure templates intended to be shared platform-wide; use a namespace-scoped ProjectType when a template should only be visible within a single namespace.

The spec structure is identical to ProjectType; only the scope differs.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ClusterProjectTypes are cluster-scoped resources and carry no namespace.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterProjectType
metadata:
  name: <cluster-project-type-name>
```

**Short names:** `cpt`, `cpts`

### Spec Fields

The spec is field-for-field identical to [ProjectTypeSpec](./projecttype.md#spec-fields):

| Field                | Type                                                    | Required | Description                                                                                                                |
| -------------------- | ------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `parameters`         | [SchemaSection](./projecttype.md#schemasection)         | No       | Schema for the values project authors supply on `Project.spec.parameters`                                                  |
| `environmentConfigs` | [SchemaSection](./projecttype.md#schemasection)         | No       | Schema for the per-environment values on `ProjectReleaseBinding.spec.environmentConfigs`                                   |
| `validations`        | [[ValidationRule](./projecttype.md#validationrule)]     | No       | CEL rules evaluated during rendering; all must evaluate to true                                                            |
| `resources`          | [[ResourceTemplate](./projecttype.md#resourcetemplate)] | Yes      | Namespace-scoped manifest templates applied to the cell namespace (min: 1). Must include the mandated `v1/Namespace` entry |

### Status Fields

ClusterProjectType does not report status fields.

## The Default ClusterProjectType

OpenChoreo ships a `default` ClusterProjectType that provisions only the cell namespace. When a project is created through the OpenChoreo API or the Backstage UI without an explicit type, `spec.type` defaults to it. Its `environmentConfigs` schema accepts `namespaceLabels` and `namespaceAnnotations` maps, so per-environment labels and annotations can be added to the namespace through the binding:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterProjectType
metadata:
  name: default
spec:
  environmentConfigs:
    openAPIV3Schema:
      type: object
      properties:
        namespaceLabels:
          type: object
          additionalProperties:
            type: string
          default: {}
        namespaceAnnotations:
          type: object
          additionalProperties:
            type: string
          default: {}
  resources:
    - id: cell-namespace
      template:
        apiVersion: v1
        kind: Namespace
        metadata:
          name: ${metadata.namespace}
          labels: ${oc_merge(metadata.labels, environmentConfigs.namespaceLabels)}
          annotations: ${environmentConfigs.namespaceAnnotations}
```

## Examples

### Referencing a ClusterProjectType From a Project

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

## Usage

```bash
# List cluster project types
kubectl get cpt
occ clusterprojecttype list

# Inspect a cluster project type
kubectl describe clusterprojecttype default
occ clusterprojecttype get default

# Create or update from a manifest
occ apply -f clusterprojecttype.yaml
```

## Related Resources

- [ProjectType](./projecttype.md): namespace-scoped variant with the full field documentation
- [Project](../application/project.md): references the type through `spec.type`
- [ProjectRelease](../runtime/projectrelease.md): immutable snapshot that inlines the type spec
- [ProjectReleaseBinding](./projectreleasebinding.md): renders the inlined type per environment
- [Authoring ProjectTypes (PE Guide)](../../../platform-engineer-guide/project-types.md)
