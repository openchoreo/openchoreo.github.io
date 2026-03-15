---
title: DeploymentPipeline API Reference
---

# DeploymentPipeline

A DeploymentPipeline defines the promotion paths for deploying applications across different
environments in OpenChoreo. It establishes the progression order from development to production environments.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

DeploymentPipelines are namespace-scoped resources.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: DeploymentPipeline
metadata:
  name: <pipeline-name>
  namespace: <namespace>  # Namespace for grouping pipelines
```

### Spec Fields

| Field            | Type                              | Required | Default | Description                                                    |
|------------------|-----------------------------------|----------|---------|----------------------------------------------------------------|
| `promotionPaths` | [[PromotionPath](#promotionpath)] | No       | []      | Defines the available paths for promotion between environments |

### PromotionPath

| Field                   | Type                                            | Required | Default | Description                                                 |
|-------------------------|-------------------------------------------------|----------|---------|-------------------------------------------------------------|
| `sourceEnvironmentRef`  | [EnvironmentRef](#environmentref)               | Yes      | -       | Reference to the source environment for promotion           |
| `targetEnvironmentRefs` | [[TargetEnvironmentRef](#targetenvironmentref)] | Yes      | -       | List of target environments for promotion |

### EnvironmentRef

| Field  | Type   | Required | Default       | Description                              |
|--------|--------|----------|---------------|------------------------------------------|
| `kind` | string | No       | `Environment` | Kind of the environment resource         |
| `name` | string | Yes      | -             | Name of the environment resource         |

### TargetEnvironmentRef

| Field                      | Type    | Required | Default       | Description                                                           |
|----------------------------|---------|----------|---------------|-----------------------------------------------------------------------|
| `kind`                     | string  | No       | `Environment` | Kind of the environment resource                                      |
| `name`                     | string  | Yes      | -             | Name of the target environment                                        |

### Status Fields

| Field                | Type        | Default | Description                                                           |
|----------------------|-------------|---------|-----------------------------------------------------------------------|
| `observedGeneration` | integer     | 0       | The generation observed by the controller                             |
| `conditions`         | []Condition | []      | Standard Kubernetes conditions tracking the deployment pipeline state |

#### Condition Types

Common condition types for DeploymentPipeline resources:

- `Available` - Indicates if the deployment pipeline is available and configured

## Examples

### Basic DeploymentPipeline

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: DeploymentPipeline
metadata:
  name: default-deployment-pipeline
  namespace: default
spec:
  promotionPaths:
    - sourceEnvironmentRef:
        name: development
      targetEnvironmentRefs:
        - name: staging
    - sourceEnvironmentRef:
        name: staging
      targetEnvironmentRefs:
        - name: production
```

## Annotations

DeploymentPipelines support the following annotations:

| Annotation                    | Description                                     |
|-------------------------------|-------------------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display              |
| `openchoreo.dev/description`  | Detailed description of the deployment pipeline |

## Related Resources

- [Project](../application/project.md) - Projects reference deployment pipelines for their promotion
  workflows
- [Environment](./environment.md) - Environments that are connected through promotion paths
