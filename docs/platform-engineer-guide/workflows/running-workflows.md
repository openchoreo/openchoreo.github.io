---
title: Running Workflows
description: How to trigger and monitor WorkflowRuns

---

# Running Workflows

WorkflowRuns are how you trigger and track workflow executions. This guide covers creating, monitoring, and managing WorkflowRuns.

## Creating a WorkflowRun

A WorkflowRun references a Workflow and provides parameter values:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: my-workflow-run-01
  namespace: default
spec:
  workflow:
    kind: ClusterWorkflow
    name: github-stats-report
    parameters:
      source:
        org: "openchoreo"
        repo: "openchoreo"
```

Apply it:

```bash
kubectl apply -f workflowrun.yaml
```

### Parameter Defaults

If a Workflow schema defines default values, you can omit those parameters in the WorkflowRun:

```yaml
spec:
  workflow:
    kind: ClusterWorkflow
    name: github-stats-report
    parameters:
      source:
        org: "myorg"
        # repo defaults to "openchoreo"
```

## Monitoring Execution

```bash
# Watch WorkflowRun status
kubectl get workflowrun my-workflow-run-01 -w

# View detailed status
kubectl get workflowrun my-workflow-run-01 -o yaml
```

### Conditions

WorkflowRuns track execution through conditions:

| Condition           | Description                             |
| ------------------- | --------------------------------------- |
| `WorkflowRunning`   | Argo Workflow is currently executing    |
| `WorkflowCompleted` | Workflow completed (success or failure) |
| `WorkflowSucceeded` | Workflow completed successfully         |
| `WorkflowFailed`    | Workflow failed or errored              |

### Task Status

The `status.tasks` field provides a vendor-neutral view of individual workflow steps:

```yaml
status:
  tasks:
    - name: checkout-source
      phase: Succeeded
      startedAt: "2024-01-15T10:28:00Z"
      completedAt: "2024-01-15T10:28:30Z"
    - name: build-image
      phase: Running
      startedAt: "2024-01-15T10:28:30Z"
```

Task phases: `Pending`, `Running`, `Succeeded`, `Failed`, `Skipped`, `Error`.

## Cleanup

### Manual Deletion

```bash
kubectl delete workflowrun my-workflow-run-01
```

This automatically cleans up all resources created in the workflow plane (Argo Workflow, ExternalSecrets, ConfigMaps, etc.).

### Automatic TTL-based Cleanup

If the Workflow defines `ttlAfterCompletion`, completed runs are automatically deleted after the specified duration. The TTL is copied from the Workflow to the WorkflowRun at creation time.

## See Also

- [Creating Workflows](./creating-workflows.mdx) — How to define Workflows
- [CI Governance](./ci-governance.md) — CI workflow labels, governance, and configuration
- [WorkflowRun API Reference](../../reference/api/application/workflowrun.md) — Full resource specification
