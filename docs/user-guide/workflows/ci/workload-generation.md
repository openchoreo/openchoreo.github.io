---
title: Workload Generation
description: How build workflow outputs are used to create Workload CRs
sidebar_position: 5
---

# Workload Generation

When a CI workflow builds a container image, the next step is creating a Workload CR in the control plane. OpenChoreo provides a special-cased mechanism for this using a specific Argo Workflow step name and output parameter.

## How It Works

The WorkflowRun controller watches for a specific pattern in the Argo Workflow output:

1. If the Argo Workflow contains a step named **`generate-workload-cr`**
2. And that step has an output parameter named **`workload-cr`**
3. The controller reads the Workload CR YAML from that output
4. And creates/updates the Workload resource in the control plane

The controller also adds a dedicated condition to track this:
- `WorkloadUpdated: True` — Workload CR successfully created/updated
- `WorkloadUpdated: False` (reason: `WorkloadUpdateFailed`) — Failed to create/update

:::important
The step name `generate-workload-cr` and output parameter name `workload-cr` are required by convention. The controller specifically looks for these names.
:::

```yaml
# In the ClusterWorkflowTemplate
- name: generate-workload-cr
  outputs:
    parameters:
      - name: workload-cr
        valueFrom:
          path: /mnt/vol/workload-cr.yaml
```

## Alternatives to generate-workload-cr

The `generate-workload-cr` step is optional. There are other ways to create a Workload:

### Option 1: generate-workload-cr Step (Recommended)

Uses the `occ workload create` CLI command inside the Argo Workflow. The controller reads the output and creates the Workload in the control plane.

```yaml
# In ClusterWorkflowTemplate
- name: generate-workload-cr
  container:
    image: openchoreo-cli:latest
    command: [occ, workload, create]
    args:
      - --image={{steps.publish-image.outputs.parameters.image}}
      - --descriptor=workload.yaml
      - --output=/mnt/vol/workload-cr.yaml
  outputs:
    parameters:
      - name: workload-cr
        valueFrom:
          path: /mnt/vol/workload-cr.yaml
```

### Option 2: Call the OpenChoreo API Server

Create the Workload by calling the API server directly from your workflow step:

```bash
POST /api/v1/namespaces/{namespace}/projects/{project}/components/{component}/workloads
Authorization: Bearer <token>
Content-Type: application/json
```

This approach doesn't require the `generate-workload-cr` step name convention.

### Option 3: Manual Creation

Find the image reference in the WorkflowRun status and create the Workload CR manually or through GitOps.

## Workload Descriptor

When using `occ workload create` (Option 1), you can provide a workload descriptor YAML file in your source repository:

```yaml
# workload.yaml - place in your source repository
apiVersion: openchoreo.dev/v1alpha1

metadata:
  name: reading-list-service

endpoints:
  - name: reading-list-api
    port: 5000
    type: REST
    schemaFile: openapi.yaml

configurations:
  env:
    - name: LOG_LEVEL
      value: info
    - name: APP_ENV
      value: production
  files:
    - name: app-config
      mountPath: /etc/config/app.json
      value: |
        {"feature_flags": {"new_feature": true}}
```

- **With descriptor**: Full workload specification with endpoints, connections, and configurations
- **Without descriptor**: Basic workload with just the container image

## See Also

- [CI Workflows Overview](./overview.md) — How CI workflows work
- [Creating Workflows](../creating-workflows.mdx) — Full workflow creation guide
- [Workload API Reference](../../../reference/api/application/workload.md) — Full Workload specification
