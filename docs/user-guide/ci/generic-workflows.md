---
title: Generic Workflows
description: Run standalone automation workflows independent of Components using Workflow and WorkflowRun resources
sidebar_position: 6
---

# Generic Workflows

Generic Workflows provide a way to run standalone automation tasks that are not tied to a Component's build lifecycle. While [ComponentWorkflows](./overview.md) are designed for building and deploying component images, Generic Workflows give platform engineers and developers a flexible mechanism to execute any type of workflow directly.

## Use Cases

Generic Workflows are useful for:
- **Infrastructure Provisioning** - Terraform, Pulumi, or cloud resource automation
- **Data Processing (ETL)** - Extract, transform, and load pipelines
- **End-to-End Testing** - Integration and acceptance test suites
- **Package Publishing** - Publishing libraries to npm, PyPI, Maven, etc.
- **Docker Builds** - Container image builds not tied to a Component

## Core Concepts

### ClusterWorkflowTemplate

A **ClusterWorkflowTemplate** is an [Argo Workflows](https://argo-workflows.readthedocs.io/en/latest/cluster-workflow-templates/) resource that defines reusable workflow steps at cluster scope in the build plane. It contains the actual execution logic — the containers to run, scripts to execute, and how data flows between steps.

ClusterWorkflowTemplates are referenced by Workflow CRs via `workflowTemplateRef` and are shared across all namespaces, making them reusable across multiple Workflows.

### Workflow

A **Workflow** is a platform engineer-defined template in the control plane that specifies what to execute. It consists of:

- **Schema**: Defines developer-facing parameters that can be configured when triggering an execution
- **RunTemplate**: An Argo Workflow template with template variables (`${metadata.*}`, `${parameters.*}`) that references a ClusterWorkflowTemplate and gets rendered for each execution

The Workflow acts as the bridge between the control plane and build plane — it defines the parameter interface for developers and maps those parameters to the ClusterWorkflowTemplate that performs the actual work.

### WorkflowRun

A **WorkflowRun** represents a single execution instance of a Workflow. When created, it:

- References the Workflow to use
- Provides actual values for the schema parameters
- Triggers the controller to render and execute the Argo Workflow in the build plane

## Creating a Generic Workflow

Creating a Generic Workflow involves three resources:

1. **ClusterWorkflowTemplate** in the build plane — defines the actual execution steps
2. **Workflow** in the control plane — defines the parameter schema and references the template
3. **WorkflowRun** in the control plane — triggers an execution with specific parameter values

### Step 1: Create ClusterWorkflowTemplate

The ClusterWorkflowTemplate defines the Argo Workflow steps that execute in the build plane. Unlike ComponentWorkflows, there are no required output parameters — you can define any steps your workflow needs.

This example fetches GitHub repository statistics, transforms the raw API response, and prints a formatted report.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ClusterWorkflowTemplate
metadata:
  name: github-stats-report
spec:
  entrypoint: pipeline
  templates:
    - name: pipeline
      steps:
        - - name: fetch
            template: fetch-step
        - - name: transform
            template: transform-step
        - - name: report
            template: report-step
            arguments:
              parameters:
                - name: output-format
                  value: "{{workflow.parameters.output-format}}"

    # Step 1: Fetch raw repository data from the GitHub API
    - name: fetch-step
      container:
        image: curlimages/curl:8.8.0
        command: [sh, -c]
        args:
          - |
            set -e
            ORG="{{workflow.parameters.org}}"
            REPO="{{workflow.parameters.repo}}"

            echo "Fetching stats for ${ORG}/${REPO} ..."
            curl -sf \
              -H "Accept: application/vnd.github+json" \
              -H "X-GitHub-Api-Version: 2022-11-28" \
              "https://api.github.com/repos/${ORG}/${REPO}" \
              -o /mnt/data/raw.json

            echo "Fetch complete. Response size: $(wc -c < /mnt/data/raw.json) bytes"
        volumeMounts:
          - name: data
            mountPath: /mnt/data

    # Step 2: Extract and reshape the fields we care about
    - name: transform-step
      container:
        image: alpine:3
        command: [sh, -c]
        args:
          - |
            set -e
            apk add --no-cache jq -q
            echo "Transforming raw data ..."
            jq '{
              name:        .full_name,
              description: (.description // "N/A"),
              language:    (.language // "N/A"),
              stars:       .stargazers_count,
              forks:       .forks_count,
              open_issues: .open_issues_count,
              license:     (.license.name // "None"),
              topics:      (.topics // []),
              created_at:  .created_at,
              updated_at:  .updated_at
            }' /mnt/data/raw.json > /mnt/data/stats.json

            echo "Transform complete."
        volumeMounts:
          - name: data
            mountPath: /mnt/data

    # Step 3: Format and print the final report
    - name: report-step
      inputs:
        parameters:
          - name: output-format
      container:
        image: alpine:3
        command: [sh, -c]
        args:
          - |
            set -e
            apk add --no-cache jq -q
            FORMAT="{{inputs.parameters.output-format}}"

            if [ "$FORMAT" = "json" ]; then
              cat /mnt/data/stats.json
            else
              jq -r '
                "=============================",
                "  GitHub Repository Report   ",
                "=============================",
                "Name:         \(.name)",
                "Description:  \(.description)",
                "Language:     \(.language)",
                "Stars:        \(.stars)",
                "Forks:        \(.forks)",
                "Open Issues:  \(.open_issues)",
                "License:      \(.license)",
                "Topics:       \(.topics | join(", "))",
                "Created:      \(.created_at)",
                "Updated:      \(.updated_at)",
                "============================="
              ' /mnt/data/stats.json
            fi
        volumeMounts:
          - name: data
            mountPath: /mnt/data

  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: 100Mi
```

### Step 2: Create Workflow

The Workflow CR defines the parameter schema and the run template that references the ClusterWorkflowTemplate. The `ttlAfterCompletion` field controls how long completed WorkflowRun records are retained.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workflow
metadata:
  name: github-stats-report
  namespace: default
  annotations:
    openchoreo.dev/description: "Fetch GitHub repository statistics, transform the data, and generate a formatted report"
spec:
  # Template Variable Reference (processed by controller):
  # ${metadata.workflowRunName}  - WorkflowRun CR name
  # ${metadata.namespaceName}    - Namespace name
  # ${parameters.*}              - Values from the schema below

  # Time-to-live for completed workflow runs
  ttlAfterCompletion: "1d"

  schema:
    parameters:
      source:
        org: string | default="openchoreo" description="GitHub organization name"
        repo: string | default="openchoreo" description="GitHub repository name"
      output:
        format: string | default="table" enum=table,json description="Report output format"

  runTemplate:
    apiVersion: argoproj.io/v1alpha1
    kind: Workflow
    metadata:
      name: ${metadata.workflowRunName}
      namespace: openchoreo-ci-${metadata.namespaceName}
    spec:
      arguments:
        parameters:
          - name: org
            value: ${parameters.source.org}
          - name: repo
            value: ${parameters.source.repo}
          - name: output-format
            value: ${parameters.output.format}
      serviceAccountName: workflow-sa
      workflowTemplateRef:
        clusterScope: true
        name: github-stats-report
```

### Step 3: Trigger with WorkflowRun

Create a WorkflowRun to execute the workflow with specific parameter values.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: github-stats-report-run-01
spec:
  workflow:
    name: github-stats-report
    parameters:
      source:
        org: "openchoreo"
        repo: "openchoreo"
      output:
        format: "table"
```

## Deploying the Resources

Deploy the resources in order:

```bash
# 1. Deploy the ClusterWorkflowTemplate to the Build Plane
kubectl apply -f cluster-workflow-template-github-stats-report.yaml

# 2. Deploy the Workflow CR to the Control Plane
kubectl apply -f workflow-github-stats-report.yaml

# 3. Trigger an execution by creating a WorkflowRun
kubectl apply -f workflow-run-github-stats-report.yaml
```

## See Also

- [CI Overview](./overview.md) - Understand ComponentWorkflows and CI architecture
- [Workflow API Reference](../../reference/api/platform/workflow.md) - Full Workflow resource specification
- [WorkflowRun API Reference](../../reference/api/application/workflowrun.md) - Full WorkflowRun resource specification
- [Argo Workflows Documentation](https://argo-workflows.readthedocs.io/en/latest/cluster-workflow-templates/) - ClusterWorkflowTemplate reference
