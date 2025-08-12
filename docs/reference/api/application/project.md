---
layout: docs
title: Project API Reference
---

# Project

A Project represents a cloud-native application composed of multiple components in OpenChoreo. It serves as the
fundamental unit of isolation and provides a logical boundary for organizing related components, services, and
resources.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

Projects are namespace-scoped resources that must be created within an Organization's namespace.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Project
metadata:
  name: <project-name>
  namespace: <org-namespace>  # Organization namespace
```

### Spec Fields

| Field                   | Type   | Required | Default | Description                                                                                                                                                                     |
|-------------------------|--------|----------|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `deploymentPipelineRef` | string | Yes      | -       | Reference to the DeploymentPipeline that defines the promotion paths between environments for this project. Must reference an existing DeploymentPipeline in the same namespace |

### Status Fields

| Field                | Type        | Default | Description                                               |
|----------------------|-------------|---------|-----------------------------------------------------------|
| `observedGeneration` | integer     | 0       | The generation observed by the controller                 |
| `conditions`         | []Condition | []      | Standard Kubernetes conditions tracking the project state |

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
  deploymentPipelineRef: default-deployment-pipeline
```

## Annotations

Projects support the following annotations:

| Annotation                    | Description                         |
|-------------------------------|-------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display  |
| `openchoreo.dev/description`  | Detailed description of the project |

## Related Resources

- [Component](/docs/reference/api/application/component/) - Deployable units within projects
- [DeploymentPipeline](/docs/reference/api/platform/deployment-pipeline/) - Defines environment promotion paths
- [Organization](/docs/reference/api/platform/organization/) - Contains projects
