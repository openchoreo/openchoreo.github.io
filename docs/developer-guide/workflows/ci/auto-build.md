---
title: Auto-Build
description: Trigger builds automatically when code is pushed to your Git repository

---

# Auto-Build

Auto-build triggers a CI workflow automatically whenever you push code to your Git repository. Instead of manually creating a WorkflowRun for each build, OpenChoreo creates one for you based on the workflow configuration in your Component.

:::info Platform Engineer Setup Required
Auto-build requires your platform engineer to set up a webhook secret and configure the webhook endpoint. See the [PE Auto Build guide](../../../platform-engineer-guide/workflows/auto-build.mdx) for infrastructure setup.
:::

## Enable Auto-Build on Your Component

Add `autoBuild: true` to your Component spec:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: patient-management-service
spec:
  owner:
    projectName: default
  componentType:
    kind: ClusterComponentType
    name: deployment/service
  autoBuild: true
  autoDeploy: true
  workflow:
    kind: ClusterWorkflow
    name: ballerina-buildpack-builder
    parameters:
      repository:
        url: "https://github.com/openchoreo/sample-workloads"
        revision:
          branch: "main"
        appPath: "/service-ballerina-patient-management"
```

Apply it:

```bash
kubectl apply -f component.yaml
```

## Key Fields

| Field                                            | Description                                                                                           |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `autoBuild: true`                                | Enables webhook-triggered builds. Pushes to the configured branch create a WorkflowRun automatically. |
| `autoDeploy: true`                               | Automatically deploys the generated Workload after a successful build.                                |
| `workflow.parameters.repository.revision.branch` | The branch that triggers builds on push.                                                              |
| `workflow.parameters.repository.appPath`         | Only pushes that change files within this path trigger builds.                                        |

## What Triggers a Build

When a push event is received, OpenChoreo matches it to Components by checking:

1. The **repository URL** matches the Component's `repository.url`
2. The **branch** matches the Component's `repository.revision.branch`
3. The push includes changes within the Component's `appPath`

If all conditions match, a WorkflowRun is created automatically with the commit SHA from the push event.

## Verify Auto-Build

After pushing a change to your repository:

```bash
# Check if a WorkflowRun was created
kubectl get workflowrun

# Watch the build progress
kubectl get workflowrun -w
```

## See Also

- [CI Overview](./overview.md) — How CI workflows work, monitoring builds, error conditions
- [Auto Build Setup](../../../platform-engineer-guide/workflows/auto-build.mdx) — Platform engineer guide for webhook infrastructure setup
