---
title: Custom Workflows for Components
description: Guide to writing custom workflows for components
sidebar_position: 3
---

## Overview

Custom workflows allow Platform Engineers to define reusable build and deployment pipelines for components. These workflows leverage Argo Workflows in the build plane and are made available to developers through ComponentWorkflow resources.

To create custom workflows for a component, follow these steps:

1. **Create ClusterWorkflowTemplate** in the build plane (defines the actual workflow steps)
2. **Define Argo Workflow** structure that references the ClusterWorkflowTemplate (defines parameters and workflow configuration)
3. **Create ComponentWorkflow** in the control plane (defines the schema and embeds the Argo Workflow template)
4. **Allow ComponentWorkflow** in the ComponentType (enables developers to use the workflow)

## Step 1: Define Argo ClusterWorkflowTemplate

The ClusterWorkflowTemplate defines the actual Argo Workflow steps that will execute in the build plane. Our default ClusterWorkflowTemplates provide a good reference as a starting point. You can copy existing steps and add additional steps as needed.

Learn more about cluster workflow templates: https://argo-workflows.readthedocs.io/en/latest/cluster-workflow-templates/

- Platform Engineers can write individual steps including cloning source code, trivy scans, tests, etc.
    - For example, the `checkout-source` step includes the logic to detect the Git provider, authenticate to private repositories, and checkout specific commits or branches.
- Platform Engineers can decide which parameters to expose in the ClusterWorkflowTemplate to make it more reusable. Common parameters include git-revision, image name, image tag, etc.
    - You can use different parameter syntax in the ClusterWorkflowTemplate:
        - `{{inputs.parameters.git-revision}}` - Accesses an input parameter passed to this template from another step.
        - `{{workflow.parameters.component-name}}` - Accesses a global workflow parameter passed from the Argo Workflow (see [Argo Workflows documentation](https://argo-workflows.readthedocs.io/en/latest/walk-through/steps/)).
        - `{{steps.checkout-source.outputs.parameters.git-revision}}` - Accesses an output parameter named `git-revision` from a previous step named `checkout-source`.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ClusterWorkflowTemplate
metadata:
  name: google-cloud-buildpacks
spec:
  entrypoint: main

  templates:
    - name: main
      steps:
        - - name: checkout-source
            template: clone
        - - name: build-image
            template: build
            arguments:
              parameters:
                - name: git-revision
                  value: "{{steps.checkout-source.outputs.parameters.git-revision}}"
        - - name: publish-image
            template: push
            arguments:
              parameters:
                - name: git-revision
                  value: "{{steps.checkout-source.outputs.parameters.git-revision}}"
        - - name: generate-workload-cr
            template: workload-create
            arguments:
              parameters:
                - name: image
                  value: "{{steps.publish-image.outputs.parameters.image}}"

    # Define individual step templates below
    - name: checkout-source
      # ... clone implementation
    - name: trivy-scan
      # ... trivy scan implementation
    - name: build-image
      # ... build implementation
    - name: publish-image
      # ... push implementation
    - name: generate-workload-cr
      # ... workload create implementation
```

Once you define the Argo ClusterWorkflowTemplate, create it in the build plane.

## Step 2: Define Argo Workflow

Once you have identified the parameters to expose in the ClusterWorkflowTemplate, you need to design an Argo Workflow structure that references this template. This workflow definition will later be embedded in the ComponentWorkflow CR in Step 3.

Here's an example of what the Argo Workflow structure looks like:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  name: "acme-reading-list-service-workflow-run-1"
  namespace: "openchoreo-ci-acme"
spec:
  arguments:
    parameters:
      - name: repo-url
        value: ""
      - name: branch
        value: "main"
      - name: image-name
        value: ""
      - name: timeout
        value: "30m"
      - name: resource-cpu
        value: "1"
      - name: trivy-scan
        value: "true"
      - name: component-name
        value: "reading-list-service"
      - name: git-secret-name
        value: "acme-github-secret"
  # Must use workflow-sa as OpenChoreo automatically creates this service account
  # in the build plane with the necessary permissions to execute workflows
  serviceAccountName: workflow-sa
  # References the ClusterWorkflowTemplate created in Step 1
  workflowTemplateRef:
    clusterScope: true
    name: "<Name of the ClusterWorkflowTemplate created in Step 1>"
```

From the workflow parameters defined above, you need to categorize them into three types based on their source:

- **Type 1 - Hard-coded parameters**: Values that Platform Engineers define and hard-code in the workflow. For example, `trivy-scan: "true"` to always enable security scanning.
- **Type 2 - Developer-provided parameters**: Values that developers provide when creating or triggering workflows. For example, `repo-url`, `branch`, `timeout`, and `resource-cpu`.
- **Type 3 - System-generated parameters**: Values that OpenChoreo automatically injects from the Component CR and runtime context. For example, `componentName`, `projectName`, `namespaceName`, and `workflowRunName`.

After identifying these three types of parameters, you can create the ComponentWorkflow, which is an OpenChoreo Custom Resource (CR).

## Step 3: Write ComponentWorkflow

### 3.1 Define the Schema with System and Developer Parameters

The ComponentWorkflow schema defines which parameters are exposed to developers and which are provided by the system.

:::note
The schema uses a CEL syntax of the form `fieldName: type | metadata` (e.g., `url: string | description="Git repository URL"`). See the [Component Workflow Schema](./component-workflow-schema.md) documentation for full details and examples.
:::

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentWorkflow
metadata:
  name: google-cloud-buildpacks
  namespace: acme
spec:
  schema:
    # System parameters are required and provided by OpenChoreo
    systemParameters:
      repository:
        url: string | description="Git repository URL"
        secretRef: string | description="Secret reference name for Git credentials"
        revision:
          branch: string | default=main description="Git branch to checkout"
          commit: string | description="Git commit SHA or reference (optional, defaults to latest)"
        appPath: string | default=. description="Path to the application directory within the repository"
    # Developer parameters are optional and exposed to developers as needed (PE Task)
    parameters:
      timeout: string | default=30m description="Timeout for the workflow execution"
      resourceCpu: string | default=1 description="CPU resource request for the workflow steps"
```

### 3.2 Attach the Argo Workflow Template

Link the Argo Workflow from Step 2 to the ComponentWorkflow by embedding it in the `runTemplate` field.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentWorkflow
metadata:
  name: google-cloud-buildpacks
  namespace: acme
spec:
  schema:
    # System parameters are required and provided by OpenChoreo automatically
    systemParameters:
      # ...
    # Developer parameters are optional and exposed to developers when creating workflows
    parameters:
      # ...

  # Embed the Argo Workflow structure from Step 2
  # Use CEL expressions (${...}) to inject parameter values
  runTemplate:
    apiVersion: argoproj.io/v1alpha1
    kind: Workflow
    metadata:
      # Type 3: System-generated - Unique workflow run name for each execution
      name: ${metadata.workflowRunName}
      # Type 3: System-generated - Automatically set to "openchoreo-ci-<namespace>"
      namespace: ${metadata.namespace}
    spec:
      arguments:
        parameters:
          # Type 2: Developer-provided - Git repository URL from systemParameters
          - name: repo-url
            value: ${systemParameters.repository.url}
          # Type 2: Developer-provided - Git branch from systemParameters
          - name: branch
            value: ${systemParameters.repository.revision.branch}
          # Type 3: System-generated - Unique image name for this component
          - name: image-name
            value: ${metadata.namespaceName}-${metadata.projectName}-${metadata.componentName}
          # Type 2: Developer-provided - Workflow timeout from parameters
          - name: timeout
            value: ${parameters.timeout}
          # Type 2: Developer-provided - CPU resources from parameters
          - name: resource-cpu
            value: ${parameters.resourceCpu}
          # Type 1: Hard-coded - Always enable security scanning
          - name: trivy-scan
            value: "true"
          # Type 3: System-generated - Component name from metadata
          - name: component-name
            value: ${metadata.componentName}
          # Type 2: Developer-provided - Git secret reference from systemParameters
          - name: git-secret-name
            value: ${systemParameters.repository.secretRef}
      # Must use `workflow-sa` - automatically created by OpenChoreo with necessary permissions
      serviceAccountName: workflow-sa
      # Reference the ClusterWorkflowTemplate created in Step 1
      workflowTemplateRef:
        clusterScope: true
        name: "<Name of the ClusterWorkflowTemplate created in Step 1>"
```
### 3.3 Define Secrets, ConfigMaps, or Custom Resources

You might need Secrets, ConfigMaps, or other Custom Resources to be created in the build plane for your workflow steps. You can define these resources in the ComponentWorkflow CR and reference them in your ClusterWorkflowTemplate.
```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentWorkflow
metadata:
  name: google-cloud-buildpacks
  namespace: acme
spec:
  schema:
    # System parameters are required and provided by OpenChoreo automatically
    systemParameters:
      # ...
    # Developer parameters are optional and exposed to developers when creating workflows
    parameters:
      # ...

  # Embed the Argo Workflow structure from Step 2
  runTemplate:
    # ...

  # Additional resources to be created in the build plane namespace
  # These resources are available to the Argo Workflow during execution
  resources:
   - id: git-secret
     # Define the Custom Resource template
     template:
      apiVersion: external-secrets.io/v1
      kind: ExternalSecret
      metadata:
        name: ${metadata.workflowRunName}-git-secret
        namespace: ${metadata.namespace}
      spec:
        refreshInterval: 15s
        secretStoreRef:
          kind: ClusterSecretStore
          name: openbao
        target:
          name: ${metadata.workflowRunName}-git-secret
          creationPolicy: Owner
          template:
            type: ${secretRef.type}
        data:
          - secretKey: ${secretRef.key}
            remoteRef:
              key: ${secretRef.remoteKey}
              property: ${secretRef.property}
```

:::info
Learn more about how these CEL variables are accessed in the [Component Workflow Schema](./component-workflow-schema.md) documentation.
:::

## Step 4: Allow ComponentWorkflow in ComponentType

After creating the Argo ClusterWorkflowTemplate and ComponentWorkflow, you need to make the workflow available to developers by adding it to the `allowedWorkflows` list in the relevant ComponentType CR.

ComponentTypes act as governance boundaries that control which build strategies developers can use. The `allowedWorkflows` field explicitly lists which ComponentWorkflows are permitted for components of that type.

Add the custom workflow name to the `allowedWorkflows` array in the relevant ComponentType CR:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentType
metadata:
  name: service
  namespace: acme
spec:
  workloadType: deployment
  allowedWorkflows:
    - google-cloud-buildpacks    # The custom workflow created in previous steps
    - ballerina-buildpack        # Example of another allowed workflow
    - docker                     # Example of another allowed workflow

  # ComponentType schema and resource templates
  schema:
    # ... component schema definition
  resources:
    # ... resource templates
```

## Workload CR Overview

Once the build is complete, you need to create a Workload CR in the OpenChoreo control plane with the built container image. The Workload CR is required for deployment and includes the image reference, endpoints, and configurations (environment variables and file mounts).

There are multiple ways to create the Workload CR:

### Option 1: Create through OpenChoreo CLI
This is the approach used in our default cluster workflow templates in the `generate-workload-cr` step.
We use the `occ workload create` command to create the Workload CR.
We make it an output of that step, which stores it in the Argo Workflow status, allowing the OpenChoreo Control Plane to read and create it in the control plane.
```yaml
outputs:
    parameters:
      - name: workload-cr
        valueFrom:
          path: /mnt/vol/workload-cr.yaml
```
:::note
If you follow this approach, you must use `workload-cr` as the output parameter name and `generate-workload-cr` as the step name.
:::

### Option 2: Create Workload CR by Calling the OpenChoreo API Server

For this approach, you need to obtain an access token from your identity provider and then call the OpenChoreo API server to create the Workload CR.

```bash
POST /api/v1/namespaces/{namespace}/projects/{project}/components/{component}/workloads
Authorization: Bearer <token>
Content-Type: application/json
```

If you use this approach, you no longer need to ensure specific step names or output parameter names.

### Option 3: Create Workload CR Manually (Not Recommended)

You can find the image name in the ComponentWorkflowRun status and then provide the image name and other configurations at deployment time.

## Workload Descriptor Overview

If you use the `occ workload create` command (Option 1), you can provide a workload descriptor YAML file in the source code repository to define additional workload details.

This file can specify:
- Endpoints and ports
- Environment variables
- File mounts and configurations
- Schema files (OpenAPI, GraphQL, etc.)

If a workload descriptor file exists, the CLI will use it to create a complete Workload CR. Otherwise, it will create a basic Workload CR with just the container image reference.

```yaml
# OpenChoreo Workload Descriptor
# Place this file in your source code repository to define workload configuration
# The CLI will convert it to a Workload Custom Resource (CR)
apiVersion: openchoreo.dev/v1alpha1

metadata:
  name: reading-list-service  # Required: Name of the workload

# Optional: Define endpoints exposed by this workload
# These endpoints define the network interfaces for accessing your service
endpoints:
  - name: reading-list-api     # Required: Unique endpoint identifier
    port: 5000                  # Required: Port number
    type: REST                  # Required: REST, GraphQL, gRPC, TCP, UDP, HTTP, or Websocket
    schemaFile: openapi.yaml    # Optional: Path to schema file (relative to this file)

configurations:
  # Environment variables for the workload
  env:
    # Static environment variables
    - name: LOG_LEVEL
      value: info

    - name: APP_ENV
      value: production

    - name: MAX_CONNECTIONS
      value: "100"

    # Environment variables from Kubernetes Secrets
    - name: API_SECRET
      valueFrom:
        secretKeyRef:
          name: app-secrets
          key: api-secret

    - name: DATABASE_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: password

  # File mounts for the workload
  files:
    # Inline file content
    - name: app-config
      mountPath: /etc/config/app.json
      value: |
        {
          "feature_flags": {
            "new_feature": true
          }
        }

    # File content from repository (path relative to this file)
    - name: tls-cert
      mountPath: /etc/ssl/certs/app.crt
      valueFrom:
        path: ./certs/app.crt
```

:::note
The workload descriptor file doesn't need to be in the root directory. You can place it anywhere in the repository and provide the path to the CLI command.
:::
