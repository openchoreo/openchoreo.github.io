---
title: Additional Resources in Workflows
description: Learn how to define additional Kubernetes resources for ComponentWorkflows
sidebar_position: 4
---

# Additional Resources in Workflows

ComponentWorkflows can define additional Kubernetes resources that are needed for workflow execution. These resources are created in the Build Plane before the workflow runs and are automatically cleaned up when the workflow completes.

## Overview

When workflows need additional resources beyond the basic Argo Workflow definition—such as secrets for authentication, ConfigMaps for configuration, or ExternalSecrets for dynamic secret management—you can define them in the `resources` field of the ComponentWorkflow.

### Common Use Cases

- **ExternalSecrets**: Fetch secrets from external secret backends (AWS Secrets Manager, Vault, etc.)
- **ConfigMaps**: Provide configuration files or environment-specific settings
- **Secrets**: Store static credentials or tokens
- **Custom Resources**: Any Kubernetes resource needed by workflow steps

## How It Works

### Lifecycle

1. **Creation**: When a ComponentWorkflowRun is created, the controller:
   - Renders all resource templates by substituting template variables
   - Creates the resources in the Build Plane namespace

2. **Execution**: The Argo Workflow accesses these resources during execution.

3. **Cleanup**: When the ComponentWorkflowRun is deleted:
   - All resources defined in the `resources` field are automatically deleted

## Defining Resources

Resources are defined in the ComponentWorkflow's `spec.resources` field as a list of resource templates.

### Basic Structure

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentWorkflow
metadata:
  name: my-workflow
  namespace: default
spec:
  schema:
    # ... schema definition

  resources:
    - id: resource-identifier
      template:
        # Standard Kubernetes resource definition
        apiVersion: v1
        kind: ConfigMap
        metadata:
          name: ${metadata.workflowRunName}-config
          namespace: openchoreo-ci-${metadata.orgName}
        data:
          key: value

  runTemplate:
    # ... Argo Workflow template
```

### Multiple Resources

A workflow can define multiple resources:

```yaml
resources:
  # Git authentication
  - id: git-secret
    template:
      apiVersion: external-secrets.io/v1
      kind: ExternalSecret
      metadata:
        name: ${metadata.workflowRunName}-git-secret
        namespace: openchoreo-ci-${metadata.orgName}
      spec:
        # ... ExternalSecret spec

  # Registry authentication
  - id: registry-secret
    template:
      apiVersion: external-secrets.io/v1
      kind: ExternalSecret
      metadata:
        name: ${metadata.workflowRunName}-registry-secret
        namespace: openchoreo-ci-${metadata.orgName}
      spec:
        # ... ExternalSecret spec

  # Build configuration
  - id: build-config
    template:
      apiVersion: v1
      kind: ConfigMap
      metadata:
        name: ${metadata.workflowRunName}-config
        namespace: openchoreo-ci-${metadata.orgName}
      data:
        registry: "registry.example.com"

  # Custom webhook configuration
  - id: webhook-config
    template:
      apiVersion: v1
      kind: ConfigMap
      metadata:
        name: ${metadata.workflowRunName}-webhook
        namespace: openchoreo-ci-${metadata.orgName}
      data:
        notification.url: "https://slack.example.com/webhook"
```

## See Also

- [CI Overview](./overview.md) - Understand ComponentWorkflows architecture
- [Custom Workflows](./custom-workflows.md) - Create custom ComponentWorkflows
- [Component Workflow Schema](./component-workflow-schema.md) - Parameter system and schema definition
- [External Secrets Operator](https://external-secrets.io/) - Secret management documentation
