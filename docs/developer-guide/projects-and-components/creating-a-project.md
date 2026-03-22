---
title: Creating a Project
description: Set up a project to organize your components in OpenChoreo
---

# Creating a Project

A Project is a logical boundary that groups related components together. Each project is linked to a deployment pipeline that defines how components are promoted across environments (e.g., development, staging, production).

## What a Project Defines

A Project resource is intentionally minimal:

| Field                        | Description                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| `metadata.name`              | Unique name within the namespace (must be a valid Kubernetes name)                                  |
| `metadata.namespace`         | The namespace this project belongs to                                                               |
| `spec.deploymentPipelineRef` | Reference to a DeploymentPipeline that controls environment promotion                               |
| Annotations                  | Optional `openchoreo.dev/display-name` and `openchoreo.dev/description` for human-readable metadata |

## Creating via Backstage UI

1. Navigate to your namespace in the Backstage console
2. Click **Create Project**
3. Fill in the form:
   - **Namespace**: pre-selected from your current context
   - **Project Name**: a valid Kubernetes name
   - **Display Name**: optional human-readable name
   - **Description**: optional description
   - **Deployment Pipeline**: select from available pipelines in the namespace (defaults to `default`)
4. Click **Create**

The project appears immediately in the Backstage catalog.

## Creating via YAML

Create a `project.yaml` file:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Project
metadata:
  name: online-store
  namespace: default
  annotations:
    openchoreo.dev/display-name: "Online Store"
    openchoreo.dev/description: "E-commerce application components"
spec:
  deploymentPipelineRef:
    kind: DeploymentPipeline
    name: default
```

Apply it:

```bash
kubectl apply -f project.yaml
```

Or using the occ CLI:

```bash
occ apply -f project.yaml
```

:::tip Default Resources
When OpenChoreo is installed, a `default` project with a `default` deployment pipeline is created automatically. You only need to create additional projects if you want separate deployment pipelines or logical groupings.
:::

## Managing Projects

### List projects

```bash
occ project list --namespace default
```

### View project details

```bash
occ project get online-store --namespace default
```

### Delete a project

```bash
occ project delete online-store --namespace default
```

:::warning
Deleting a project also deletes all components within it.
:::

### Change deployment pipeline

In the Backstage UI, click the edit icon on the Deployment Pipeline card on the project page to select a different pipeline.

## What's Next

- [Creating a Component](./creating-a-component.md): deploy a service, web app, or scheduled task within your project
