---
title: Creating Workflows
description: Step-by-step guide for creating custom Workflows in OpenChoreo
sidebar_position: 3
---

# Custom Workflows

Custom workflows allow Platform Engineers to define reusable pipelines. This step by step guide walks you through creating a Workflow.


## Prerequisites

Before diving in, you'll need:

<div className="workflow-guide-grid">
  <div className="workflow-guide-card">
    <h3>Argo Workflows basics</h3>
    <p>
      Understanding of ClusterWorkflowTemplates and Workflows. https://argo-workflows.readthedocs.io/en/latest/
    </p>
  </div>
  <div className="workflow-guide-card">
    <h3>Kubernetes CRDs</h3>
    <p>
      Experience writing custom resources with <code>apiVersion</code>, <code>kind</code>, <code>metadata</code>, and <code>spec</code>.
    </p>
  </div>
  <div className="workflow-guide-card">
    <h3>OpenChoreo installed</h3>
    <p>
      BuildPlane installed with Argo Workflows.
    </p>
  </div>
</div>


## Overview

Custom workflows allow Platform Engineers to define reusable build and deployment pipelines for components. These workflows leverage Argo Workflows in the build plane and are made available to developers through Workflow resources.

<div className="workflow-guide-grid">
  <div className="workflow-guide-card">
    <h3>🏗️ Build Plane</h3>
    <dl>
      <dt>
        <span className="workflow-item-type template" title="Template"></span>
        <strong>Argo Cluster Workflow Template</strong>
        <span className="workflow-status-badge badge-authored">PE write</span>
      </dt>
      <dd>The step definitions (clone, scan, execute, push). This is where your actual workflow logic lives.</dd>

      <dt>
        <span className="workflow-item-type instance" title="Instance"></span>
        <strong>Argo Workflow</strong>
        <span className="workflow-status-badge badge-autogen">Auto-generated</span>
      </dt>
      <dd><strong>Rendered in Build Plane:</strong> Automatically generated at runtime when the control plane instantiates your Workflow. Created directly in the build plane cluster from the <code>Argo Workflow</code> defined in your Control Plane Workflow resource.</dd>
    </dl>
  </div>

  <div className="workflow-guide-card">
    <h3>🎛️ Control Plane</h3>
    <dl>
      <dt>
        <span className="workflow-item-type template" title="Template"></span>
        <strong>Workflow (Template)</strong>
        <span className="workflow-status-badge badge-authored">PE write</span>
      </dt>
      <dd>Defines what parameters exist, which are for developers vs. system-provided, and embeds an <code>Argo Workflow</code> that references your ClusterWorkflowTemplates.</dd>

      <dt>
        <span className="workflow-item-type instance" title="Instance"></span>
        <strong>Workflow Run (Instance)</strong>
        <span className="workflow-status-badge badge-developer">Developer create</span>
      </dt>
      <dd>Renders the argo workflow defined in the Workflow and applies it to the Build Plane.</dd>
    </dl>
  </div>
</div>

To create custom workflows for a component, follow these steps:

1. **Create ClusterWorkflowTemplate** in the build plane (defines the actual workflow steps)
2. **Define Argo Workflow** structure that references the ClusterWorkflowTemplate (defines parameters and workflow configuration)
3. **Create ComponentWorkflow** in the control plane (defines the schema and embeds the Argo Workflow template)


## Step 1: Create Argo ClusterWorkflowTemplate

The ClusterWorkflowTemplate defines the actual Argo Workflow steps that will execute in the build plane. Our default ClusterWorkflowTemplates provide a good reference as a starting point. You can copy existing steps and add additional steps as needed.

Learn more about cluster workflow templates: https://argo-workflows.readthedocs.io/en/latest/cluster-workflow-templates/

- Platform Engineers can write individual steps including cloning source code, trivy scans, tests, etc.
- For example, the `checkout-source` step includes the logic to detect the Git provider, authenticate to private repositories, and checkout specific commits or branches.
- Platform Engineers can decide which parameters to expose in the ClusterWorkflowTemplate to make it more reusable. Common parameters include git-revision, image name, image tag, etc.
- You can use different parameter syntax in the ClusterWorkflowTemplate:
- `{{inputs.parameters.git-revision}}` - Accesses an input parameter passed to this template from another step.
- `{{workflow.parameters.component-name}}` - Accesses a global workflow parameter passed from the Argo Workflow (see [Argo Workflows documentation](https://argo-workflows.readthedocs.io/en/latest/walk-through/steps/)).
- `{{steps.checkout-source.outputs.parameters.git-revision}}` - Accesses an output parameter named `git-revision` from a previous step named `checkout-source`.

### Example: A Docker Build ClusterWorkflowTemplate

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ClusterWorkflowTemplate
metadata:
  name: docker  # CWT name referenced by your Workflow
spec:
  templates:
    - name: build-image  # Step template name
      inputs:
        parameters:
          - name: git-revision  # From previous step (checkout)
      container:
        image: ghcr.io/openchoreo/podman-runner:v1.0
        command:
          - sh
          - -c
        args:
          - |-
            set -e

            # Setup variables from workflow parameters
            WORKDIR="/mnt/vol/source"
            IMAGE="{{workflow.parameters.image-name}}:{{workflow.parameters.image-tag}}-{{inputs.parameters.git-revision}}"
            DOCKER_CONTEXT="{{workflow.parameters.docker-context}}"
            DOCKERFILE_PATH="{{workflow.parameters.dockerfile-path}}"

            # Configure container storage (podman)
            mkdir -p /etc/containers
            cat > /etc/containers/storage.conf <<EOF
            [storage]
            driver = "overlay"
            runroot = "/run/containers/storage"
            graphroot = "/var/lib/containers/storage"
            [storage.options.overlay]
            mount_program = "/usr/bin/fuse-overlayfs"
            EOF

            # Build container image using podman
            podman build -t $IMAGE -f $WORKDIR/$DOCKERFILE_PATH $WORKDIR/$DOCKER_CONTEXT

            # Save image as tar for pushing to registry
            podman save -o /mnt/vol/app-image.tar $IMAGE

        # Required for running container build tools (podman)
        securityContext:
          privileged: true

        # Mount shared workspace volume
        volumeMounts:
          - mountPath: /mnt/vol
            name: workspace
```

## Step 2: Define Argo Workflow

Once you have identified the parameters to expose in the ClusterWorkflowTemplates (CWT), you need to design an Argo Workflow structure that references these templates. This workflow definition will later be embedded in the Workflow CR in Step 3.

Here's an example of what the Argo Workflow structure looks like:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  name: ${metadata.workflowRunName}  # Unique name for each workflow run
  namespace: "openchoreo-ci-acme"    # Build plane namespace

spec:
  # Parameters passed to the Cluster Workflow Templates (CWTs)
  arguments:
    parameters:
      - name: component-name
        value: ""
      - name: git-repo
        value: ""
      - name: branch
        value: ""
      - name: dockerfile-path
        value: ""
      - name: image-name
        value: ""
      - name: git-secret
        value: git-secret
      - name: registry-push-secret
        value: registry-push-secret

  # Service account with build plane permissions
  # Don't change this - OpenChoreo automatically creates it in the build plane cluster
  serviceAccountName: workflow-sa

  entrypoint: build-workflow

  # Pipeline definition
  templates:
    - name: build-workflow
      steps:
        # Step 1: CWT for checkout source code
        - - name: checkout-source
            templateRef:
              name: checkout-source  # References a ClusterWorkflowTemplate
              clusterScope: true
              template: checkout

        # Step 2: CWT for build container image
        - - name: build-image
            templateRef:
              name: docker
              clusterScope: true
              template: build-image
            # Pass git-revision from checkout step to build step
            arguments:
              parameters:
                - name: git-revision
                  value: '{{steps.checkout-source.outputs.parameters.git-revision}}'

        # Step 3: CWT for publish image to registry
        - - name: publish-image
            ...

  # Shared workspace volume for all steps
  volumeClaimTemplates:
    - metadata:
        name: workspace
      spec:
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: 2Gi
```

From the workflow parameters defined above, you need to categorize them into three types based on their source:

<div className="workflow-guide-step-strip">
  <div className="workflow-guide-step-chip" style={{borderLeft: '4px solid #2B8CF7'}}>
    <div className="workflow-guide-step-number" style={{background: '#2B8CF7'}}>1️⃣</div>
    <div>
      <strong>Hard-coded Parameters</strong>
      <p><strong>Who:</strong> Platform Engineers</p>
      <p><strong>Example:</strong> <code>trivy-scan: "true"</code></p>
      <p>Values defined and locked in the Workflow definition. Used for consistent, non-negotiable settings.</p>
    </div>
  </div>

  <div className="workflow-guide-step-chip" style={{borderLeft: '4px solid #10B981'}}>
    <div className="workflow-guide-step-number" style={{background: '#10B981'}}>2️⃣</div>
    <div>
      <strong>Developer-provided Parameters</strong>
      <p><strong>Who:</strong> Developers</p>
      <p><strong>Examples:</strong> <code>repo-url</code>, <code>branch</code>, <code>timeout</code></p>
      <p>Values provided when creating or triggering workflows. Flexible inputs configured per workflow run.</p>
    </div>
  </div>

  <div className="workflow-guide-step-chip" style={{borderLeft: '4px solid #8B5CF6'}}>
    <div className="workflow-guide-step-number" style={{background: '#8B5CF6'}}>3️⃣</div>
    <div>
      <strong>System-generated Parameters</strong>
      <p><strong>Who:</strong> OpenChoreo</p>
      <p><strong>Examples:</strong> <code>workflowRunName</code>, <code>namespaceName</code>, <code>externalRefs</code></p>
      <p>Automatically injected from runtime context. Managed entirely by the platform.</p>
    </div>
  </div>
</div>

After identifying these three types of parameters, you can create the Workflow, which is an OpenChoreo Custom Resource (CR).



## Step 3: Define Workflow

### 3.1 Define the Schema with Parameters

The Workflow schema defines which parameters are exposed to developers.

:::tip
The schema uses a CEL syntax of the form `fieldName: type | metadata` (e.g., `url: string | description="Git repository URL"`). See the [Workflow Schema](./workflow-schema.md) documentation for full details and examples.
:::

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workflow
metadata:
  name: google-cloud-buildpacks
  namespace: acme

spec:
  schema:
  # Type 2: Developer-provided parameters (exposed to developers)
    parameters:
      repository:
        url: string | description="Git repository URL"
        secretRef: string | description="Secret reference name for Git credentials"
        revision:
          branch: string | default=main description="Git branch to checkout"
          commit: string | description="Git commit SHA (optional, defaults to latest)"
        appPath: string | default=. description="Path to application directory"
      timeout: string | default=30m description="Workflow execution timeout"
      resourceCpu: string | default=1 description="CPU resource request"
      trivyScan: boolean | default=true description="Enable security scanning"

    # Type 1: Hard-coded parameters (defined by Platform Engineers)
    # Note: These are defined in the runTemplate, not in the schema
```

### 3.2 Attach the Argo Workflow Template

Link the Argo Workflow from Step 2 to the ComponentWorkflow by embedding it in the `runTemplate` field.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workflow
metadata:
  name: google-cloud-buildpacks
  namespace: acme

spec:
  schema:
    # Type 2: Developer-provided parameters (exposed to developers)
    parameters:
      repository:
        url: string | description="Git repository URL"
        secretRef: string | description="Secret reference for Git credentials"
        revision:
          branch: string | default=main description="Git branch to checkout"
      timeout: string | default=30m description="Workflow execution timeout"
      resourceCpu: string | default=1 description="CPU resource request"

  # Embed the Argo Workflow from Step 2
  # Uses CEL expressions (${...}) to inject parameters
  runTemplate:
    apiVersion: argoproj.io/v1alpha1
    kind: Workflow

    metadata:
      # Type 3: System-generated - Unique workflow run name
      name: ${metadata.workflowRunName}
      # Type 3: System-generated - Build plane namespace
      namespace: ${metadata.namespace}
    spec:
      arguments:
        parameters:
          # Type 3: System-generated parameters from workflow run labels
          - name: component-name
            value: ${metadata.labels['openchoreo.dev/component']}
          - name: project-name
            value: ${metadata.labels['openchoreo.dev/project']}

          # Type 3: System-generated parameters
          - name: image-name
            value: ${metadata.namespaceName}-${metadata.workflowRunName}

          # Type 2: Developer-provided parameters
          - name: repo-url
            value: ${parameters.repository.url}
          - name: branch
            value: ${parameters.repository.revision.branch}
          - name: timeout
            value: ${parameters.timeout}
          - name: resource-cpu
            value: ${parameters.resourceCpu}
          - name: git-secret-name
            value: ${parameters.repository.secretRef}

          # Type 1: Hard-coded parameters (locked by Platform Engineers)
          - name: trivy-scan
            value: "true"
          - name: registry
            value: "ghcr.io"

      # Auto-created by OpenChoreo with necessary permissions
      serviceAccountName: workflow-sa

      # Entry point for the workflow execution
      entrypoint: build-workflow

      # Pipeline definition with steps
      templates:
        - name: build-workflow
          steps:
            # Step 1: Checkout source code from repository
            - - name: checkout-source
                templateRef:
                  name: checkout-source  # References ClusterWorkflowTemplate
                  clusterScope: true
                  template: checkout

            # Step 2: Build container image
            - - name: build-image
                ...
```
### 3.3 Define Additional Resources (Optional)

You might need Secrets, ConfigMaps, or other Custom Resources to be created in the build plane for your workflow steps. Define them in the `resources` field:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workflow
metadata:
  name: google-cloud-buildpacks
  namespace: acme

spec:
  schema:
    parameters:
      repository:
        url: string | description="Git repository URL"
        ...

  # Embed the Argo Workflow (from previous section)
  runTemplate:
    # ...

  # Additional resources created in build plane namespace
  # Available to Argo Workflow during execution
  resources:
    - id: git-secret
      # Create ExternalSecret for Git credentials
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
              type: Opaque
          data:
            - secretKey: username
              remoteRef:
                key: git-credentials
                property: username
            - secretKey: password
              remoteRef:
                key: git-credentials
                property: token
```

### 3.4 Define External References (Optional)

External references allow your Workflow to resolve and access external Custom Resources (like `SecretReference`) at runtime. This is useful for:
- **Dynamic credential resolution** - Reference secrets managed externally
- **Conditional resource creation** - Only create resources when needed
- **Reusable credential patterns** - Access secrets across multiple workflow runs

#### How External References Work

External references are resolved by OpenChoreo **before** the Workflow is instantiated. You can access the full referenced object and its fields in your expressions.

#### Example: Using a SecretReference

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workflow
metadata:
  name: docker-with-secrets
  namespace: acme

spec:
  schema:
    parameters:
      repository:
        secretRef: string | description="SecretReference for Git credentials"

  # Declare external references that will be resolved
  externalRefs:
    - id: git-secret-reference          # Unique identifier for this reference
      apiVersion: openchoreo.dev/v1alpha1
      kind: SecretReference             # Only SecretReference is supported currently
      name: ${parameters.repository.secretRef}  # Name comes from parameter

  # Use external refs in runTemplate resources
  runTemplate:
    ...

  # Additional resources using external reference data
  resources:
    - id: git-credentials
      # Only create if secretRef was provided
      includeWhen: ${has(parameters.repository.secretRef) && parameters.repository.secretRef != ""}
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
            name: default
          target:
            name: ${metadata.workflowRunName}-git-secret
            creationPolicy: Owner
            # Access the secret template type from external reference
            template:
              type: ${externalRefs['git-secret-reference'].spec.template.type}
          # Map secret data from external reference
          data: |
            ${externalRefs['git-secret-reference'].spec.data.map(secret, {
              "secretKey": secret.secretKey,
              "remoteRef": {
                "key": secret.remoteRef.key,
                "property": has(secret.remoteRef.property) ? secret.remoteRef.property : oc_omit()
              }
            })}
```

#### Accessing External Reference Data

Once resolved, you can access the external reference in your expressions:

```yaml
# Access the entire spec of the external reference
${externalRefs['git-secret-reference'].spec}

# Access specific fields
${externalRefs['git-secret-reference'].spec.template.type}

# Iterate over array fields
${externalRefs['git-secret-reference'].spec.data}

# Use in conditional logic
${has(externalRefs['git-secret-reference']) && externalRefs['git-secret-reference'].spec.enabled}
```

#### Key Points

- **ID is required** - Each external reference must have a unique `id`
- **Name can be parameterized** - Use `${parameters.*}` or `${metadata.*}` in the name
- **Graceful missing handling** - If the `name` evaluates to empty, the reference is silently skipped
- **Full object access** - Both the external reference object and its `.spec` are accessible
- **Conditional creation** - Use `includeWhen` to conditionally create resources based on external refs

:::info
For more details on external references and SecretReferences, see the [Workflow API Reference](../../reference/api/platform/workflow.md).
:::

## See Also

- [Running Workflows](./running-workflows.md) — How to trigger and monitor WorkflowRuns
- [Workflow API Reference](../../reference/api/platform/workflow.md) — Full resource specification
