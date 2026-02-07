---
title: DeploymentPipeline API Reference
---

# DeploymentPipeline

A DeploymentPipeline defines the promotion paths and approval workflows for deploying applications across different
environments in OpenChoreo. It establishes the progression order from development to production environments and
specifies which promotions require approval.

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
| `sourceEnvironmentRef`  | string                                          | Yes      | -       | Reference to the source environment for promotion           |
| `targetEnvironmentRefs` | [[TargetEnvironmentRef](#targetenvironmentref)] | Yes      | -       | List of target environments and their approval requirements |

### TargetEnvironmentRef

| Field              | Type    | Required | Default | Description                                                  |
|--------------------|---------|----------|---------|--------------------------------------------------------------|
| `name`             | string  | Yes      | -       | Name of the target environment                               |
| `requiresApproval` | boolean | No       | false   | Indicates if promotion to this environment requires approval |

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
    - sourceEnvironmentRef: development
      targetEnvironmentRefs:
        - name: staging
          requiresApproval: false
    - sourceEnvironmentRef: staging
      targetEnvironmentRefs:
        - name: production
          requiresApproval: true
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
