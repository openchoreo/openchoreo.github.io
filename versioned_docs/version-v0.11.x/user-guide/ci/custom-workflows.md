---
title: Custom Component Workflows
description: Guide to create custom ComponentWorkflows and ClusterWorkflowTemplates
sidebar_position: 3
---

# Custom ComponentWorkflows

Platform engineers can create custom ComponentWorkflows to support specific build strategies, languages, or organizational requirements. This guide walks through creating a complete custom workflow from scratch.

## Overview

Creating a custom ComponentWorkflow involves two main steps:

1. **Create ClusterWorkflowTemplate** in the build plane (defines the actual workflow steps)
2. **Create ComponentWorkflow** in the control plane (defines the schema and references the template)
3. Allow ComponentWorkflow in the Component Types

## Step 1: Create ClusterWorkflowTemplate

The ClusterWorkflowTemplate defines the actual Argo Workflow steps that will execute in the build plane.

### Basic Structure

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ClusterWorkflowTemplate
metadata:
  name: my-custom-workflow
spec:
  entrypoint: main
  volumeClaimTemplates:
    - metadata:
        name: work
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 2Gi

  templates:
    - name: main
      steps:
        - - name: clone-step
            template: clone
        - - name: build-step
            template: build
            arguments:
              parameters:
                - name: git-revision
                  value: "{{steps.clone-step.outputs.parameters.git-revision}}"
        - - name: push-step
            template: push
            arguments:
              parameters:
                - name: git-revision
                  value: "{{steps.clone-step.outputs.parameters.git-revision}}"
        - - name: workload-create-step
            template: workload-create
            arguments:
              parameters:
                - name: image
                  value: "{{steps.push-step.outputs.parameters.image}}"

    # Define individual step templates below
    - name: clone
      # ... clone implementation
    - name: build
      # ... build implementation
    - name: push
      # ... push implementation
    - name: workload-create
      # ... workload create implementation
```

### Required Steps

#### WorkloadCreate Step

**Responsibilities:**
- Generate Workload CR using openchoreo-cli
- Include built image reference
- Merge workload.yaml from repository if present

**inputs:**
```yaml
inputs:
  parameters:
    - name: image
```

**outputs:**
```yaml
outputs:
  parameters:
    - name: workload-cr
      valueFrom:
        path: /mnt/vol/workload-cr.yaml
```

:::important
The workload-create-step must output a parameter named `workload-cr`. The ComponentWorkflowRun controller expects this exact parameter name to retrieve the generated Workload CR.
:::

### Example: Custom Google Cloud Buildpack Workflow Template

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ClusterWorkflowTemplate
metadata:
  name: google-cloud-buildpacks
spec:
  entrypoint: build-workflow
  templates:
    - name: build-workflow
      steps:
        - - name: clone-step
            template: clone-step
        - - arguments:
              parameters:
                - name: git-revision
                  value: '{{steps.clone-step.outputs.parameters.git-revision}}'
            name: build-step
            template: build-step
        - - arguments:
              parameters:
                - name: git-revision
                  value: '{{steps.clone-step.outputs.parameters.git-revision}}'
            name: push-step
            template: push-step
        - - arguments:
              parameters:
                - name: image
                  value: '{{steps.push-step.outputs.parameters.image}}'
            name: workload-create-step
            template: workload-create-step
    - container:
        args:
          - |-
            set -e

            #####################################################################
            # 1. Initialize variables
            #####################################################################
            BRANCH={{workflow.parameters.branch}}
            REPO_URL={{workflow.parameters.git-repo}}
            COMMIT={{workflow.parameters.commit}}

            #####################################################################
            # 2. Read authentication token
            #####################################################################
            TOKEN_FILE="/etc/secrets/git-secret/git-token"
            GIT_TOKEN=""
            if [ -f "$TOKEN_FILE" ]; then
              GIT_TOKEN="$(cat "$TOKEN_FILE")"
            fi

            #####################################################################
            # 3. Build authenticated repository URL
            #####################################################################
            CLONE_URL="$REPO_URL"
            if [ -n "$GIT_TOKEN" ]; then
              HOST=$(echo "$REPO_URL" | sed -E 's|https://([^/]+)/.*|\1|')
              REPO_PATH=$(echo "$REPO_URL" | sed -E 's|https://[^/]+/(.*)|\1|')

              # Map host to authentication prefix
              case "$HOST" in
                github.com)    AUTH_PREFIX="x-access-token" ;;
                gitlab.com)    AUTH_PREFIX="oauth2" ;;
                bitbucket.org) AUTH_PREFIX="x-token-auth" ;;
                *)             AUTH_PREFIX="" ;;
              esac

              if [ -n "$AUTH_PREFIX" ]; then
                CLONE_URL="https://${AUTH_PREFIX}:${GIT_TOKEN}@${HOST}/${REPO_PATH}"
              fi
            fi

            echo "Cloning repository..."

            #####################################################################
            # 4. Clone repository
            #####################################################################
            if [[ -n "$COMMIT" ]]; then
                echo "Cloning specific commit: $COMMIT"
                git clone --no-checkout --depth 1 "$CLONE_URL" /mnt/vol/source
                cd /mnt/vol/source
                git config --global advice.detachedHead false
                git fetch --depth 1 origin "$COMMIT"
                git checkout "$COMMIT"
                echo -n "$COMMIT" | cut -c1-8 > /tmp/git-revision.txt
            else
                echo "Cloning branch: $BRANCH with latest commit"
                git clone --single-branch --branch $BRANCH --depth 1 "$CLONE_URL" /mnt/vol/source
                cd /mnt/vol/source
                COMMIT_SHA=$(git rev-parse HEAD)
                echo -n "$COMMIT_SHA" | cut -c1-8 > /tmp/git-revision.txt
            fi
        command:
          - sh
          - -c
        image: alpine/git
        name: ""
        volumeMounts:
          - mountPath: /mnt/vol
            name: workspace
          - mountPath: /etc/secrets/git-secret
            name: git-secret
            readOnly: true
      name: clone-step
      outputs:
        parameters:
          - name: git-revision
            valueFrom:
              path: /tmp/git-revision.txt
      volumes:
        - name: git-secret
          secret:
            optional: true
            secretName: '{{workflow.parameters.git-secret}}'
    - container:
        args:
          - |-
            set -e

            WORKDIR=/mnt/vol/source

            IMAGE="{{workflow.parameters.image-name}}:{{workflow.parameters.image-tag}}-{{inputs.parameters.git-revision}}"
            APP_PATH="{{workflow.parameters.app-path}}"

            #####################################################################
            # 1. Podman daemon + storage.conf
            #####################################################################
            mkdir -p /etc/containers
            cat > /etc/containers/storage.conf <<EOF
            [storage]
            driver = "overlay"
            runroot = "/run/containers/storage"
            graphroot = "/var/lib/containers/storage"
            [storage.options.overlay]
            mount_program = "/usr/bin/fuse-overlayfs"
            EOF

            podman system service --time=0 &
            until podman info --format '{{.Host.RemoteSocket.Exists}}' 2>/dev/null | grep -q true; do sleep 1; done

            #####################################################################
            # 2. Registry configuration and pull pre-cached images
            #####################################################################
            REGISTRY_ENDPOINT="host.k3d.internal:10082"

            # Pull pre-cached buildpack images from registry
            BUILDER="${REGISTRY_ENDPOINT}/buildpacks-cache/google-builder:latest"
            RUN_IMG="${REGISTRY_ENDPOINT}/buildpacks-cache/google-run:latest"
            LIFECYCLE_IMG="${REGISTRY_ENDPOINT}/buildpacks-cache/lifecycle:0.20.5"

            echo "Pulling cached builder: $BUILDER"
            podman pull --tls-verify=false "$BUILDER"

            echo "Pulling cached run image: $RUN_IMG"
            podman pull --tls-verify=false "$RUN_IMG"

            echo "Pulling cached lifecycle: $LIFECYCLE_IMG"
            podman pull --tls-verify=false "$LIFECYCLE_IMG"

            # Tag lifecycle image to expected name (referenced by builder image metadata)
            podman tag "$LIFECYCLE_IMG" "docker.io/buildpacksio/lifecycle:0.20.5"

            #####################################################################
            # 3. Build with Google Buildpacks
            #####################################################################
            /usr/local/bin/pack build "$IMAGE" \
              --builder "$BUILDER" \
              --run-image "$RUN_IMG" \
              --docker-host inherit \
              --path "$WORKDIR/$APP_PATH" \
              --pull-policy if-not-present

            podman save -o /mnt/vol/app-image.tar "$IMAGE"
        command:
          - sh
          - -c
        image: ghcr.io/openchoreo/podman-runner:v1.0
        securityContext:
          privileged: true
        volumeMounts:
          - mountPath: /mnt/vol
            name: workspace
      inputs:
        parameters:
          - name: git-revision
      name: build-step
    - container:
        args:
          - |-
            set -e

            #####################################################################
            # 1. Inputs
            #####################################################################
            GIT_REVISION={{inputs.parameters.git-revision}}
            IMAGE_NAME={{workflow.parameters.image-name}}
            IMAGE_TAG={{workflow.parameters.image-tag}}
            SRC_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}-${GIT_REVISION}"

            #####################################################################
            # 2. Registry
            #####################################################################
            REGISTRY_ENDPOINT="host.k3d.internal:10082"

            #####################################################################
            # 3. Podman storage configuration
            #####################################################################
            mkdir -p /etc/containers
            cat <<EOF > /etc/containers/storage.conf
            [storage]
            driver = "overlay"
            runroot = "/run/containers/storage"
            graphroot = "/var/lib/containers/storage"
            [storage.options.overlay]
            mount_program = "/usr/bin/fuse-overlayfs"
            EOF

            #####################################################################
            # 4. Load the tarred image and push to registry
            #####################################################################
            podman load -i /mnt/vol/app-image.tar

            podman tag $SRC_IMAGE $REGISTRY_ENDPOINT/$SRC_IMAGE
            podman push --tls-verify=false $REGISTRY_ENDPOINT/$SRC_IMAGE

            #####################################################################
            # 5. Emit image reference (for later steps/kubelet pulls)
            #####################################################################
            echo -n "$REGISTRY_ENDPOINT/$SRC_IMAGE" > /tmp/image.txt
        command:
          - sh
          - -c
        image: ghcr.io/openchoreo/podman-runner:v1.0
        securityContext:
          privileged: true
        volumeMounts:
          - mountPath: /mnt/vol
            name: workspace
      inputs:
        parameters:
          - name: git-revision
      name: push-step
      outputs:
        parameters:
          - name: image
            valueFrom:
              path: /tmp/image.txt
    - container:
        args:
          - |-
            set -e

            #####################################################################
            # 1. Initialize variables
            #####################################################################
            IMAGE={{inputs.parameters.image}}
            PROJECT_NAME={{workflow.parameters.project-name}}
            COMPONENT_NAME={{workflow.parameters.component-name}}
            APP_PATH="{{workflow.parameters.app-path}}"

            DESCRIPTOR_PATH="/mnt/vol/source${APP_PATH:+/${APP_PATH#/}}"

            OUTPUT_PATH="/mnt/vol/workload-cr.yaml"

            echo "Creating workload with image: ${IMAGE}"
            echo "Using descriptor in: ${DESCRIPTOR_PATH}"

            #####################################################################
            # 2. Podman storage configuration
            #####################################################################
            mkdir -p /etc/containers
            cat <<EOF > /etc/containers/storage.conf
            [storage]
            driver = "overlay"
            runroot = "/run/containers/storage"
            graphroot = "/var/lib/containers/storage"
            [storage.options.overlay]
            mount_program = "/usr/bin/fuse-overlayfs"
            EOF

            #####################################################################
            # 3. Create workload CR and export to output
            #####################################################################
            # Check if workload.yaml exists and build the command accordingly
            if [ -f "${DESCRIPTOR_PATH}/workload.yaml" ]; then
              echo "Found workload.yaml descriptor, using it for workload creation"
              podman run --rm --network=none \
              -v $DESCRIPTOR_PATH:/app:rw -w /app \
              ghcr.io/openchoreo/openchoreo-cli:latest-dev \
                create workload \
                --project "${PROJECT_NAME}" \
                --component "${COMPONENT_NAME}" \
                --image "${IMAGE}" \
                --descriptor "workload.yaml" \
                -o "workload-cr.yaml"
            else
              echo "No workload.yaml descriptor found, creating workload without descriptor"
              podman run --rm --network=none \
              -v $DESCRIPTOR_PATH:/app:rw -w /app \
              ghcr.io/openchoreo/openchoreo-cli:latest-dev \
                create workload \
                --project "${PROJECT_NAME}" \
                --component "${COMPONENT_NAME}" \
                --image "${IMAGE}" \
                -o "workload-cr.yaml"
            fi

            # Copy output CR to the shared volume
            cp -f "${DESCRIPTOR_PATH}/workload-cr.yaml" "${OUTPUT_PATH}"
        command:
          - sh
          - -c
        image: ghcr.io/openchoreo/podman-runner:v1.0
        securityContext:
          privileged: true
        volumeMounts:
          - mountPath: /mnt/vol
            name: workspace
      inputs:
        parameters:
          - name: image
      name: workload-create-step
      outputs:
        parameters:
          - name: workload-cr
            valueFrom:
              path: /mnt/vol/workload-cr.yaml
  ttlStrategy:
    secondsAfterCompletion: 3600
  volumeClaimTemplates:
    - metadata:
        creationTimestamp: null
        name: workspace
      spec:
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: 2Gi
```

## Step 2: Create ComponentWorkflow

The ComponentWorkflow defines the schema and references the ClusterWorkflowTemplate.

### Example: Go ComponentWorkflow

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentWorkflow
metadata:
  name: google-cloud-buildpacks
  namespace: default
spec:
  schema:
    parameters: {}
    systemParameters:
      repository:
        appPath: string | default=. description="Path to the application directory
          within the repository"
        revision:
          branch: string | default=main description="Git branch to checkout"
          commit: string | description="Git commit SHA or reference (optional, defaults
            to latest)"
        url: string | description="Git repository URL"
  runTemplate:
    apiVersion: argoproj.io/v1alpha1
    kind: Workflow
    metadata:
      name: ${metadata.workflowRunName}
      namespace: openchoreo-ci-${metadata.orgName}
    spec:
      arguments:
        parameters:
          - name: component-name
            value: ${metadata.componentName}
          - name: project-name
            value: ${metadata.projectName}
          - name: git-repo
            value: ${systemParameters.repository.url}
          - name: branch
            value: ${systemParameters.repository.revision.branch}
          - name: commit
            value: ${systemParameters.repository.revision.commit}
          - name: app-path
            value: ${systemParameters.repository.appPath}
          - name: image-name
            value: ${metadata.projectName}-${metadata.componentName}-image
          - name: image-tag
            value: v1
          - name: git-secret
            value: ${metadata.workflowRunName}-git-secret
      serviceAccountName: workflow-sa
      workflowTemplateRef:
        clusterScope: true
        name: google-cloud-buildpacks
  resources:
    - id: git-secret
      template:
        apiVersion: external-secrets.io/v1
        kind: ExternalSecret
        metadata:
          name: ${metadata.workflowRunName}-git-secret
          namespace: openchoreo-ci-${metadata.orgName}
        spec:
          data:
            - remoteRef:
                key: git-token
              secretKey: git-token
          refreshInterval: 15s
          secretStoreRef:
            kind: ClusterSecretStore
            name: default
          target:
            creationPolicy: Owner
            name: ${metadata.workflowRunName}-git-secret
```

## Step 3: Allow ComponentWorkflow in ComponentType

After creating the ClusterWorkflowTemplate and ComponentWorkflow, the final step is to make the workflow available to developers by adding it to the `allowedWorkflows` list in ComponentType CRs.

### Why This Step is Required

ComponentTypes act as governance boundaries that control which build strategies developers can use. The `allowedWorkflows` field explicitly lists which ComponentWorkflows are permitted for components of that type.

### Update ComponentType CR

Add the custom workflow name to the `allowedWorkflows` array in the relevant ComponentType CR:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentType
metadata:
  name: service
  namespace: default
spec:
  workloadType: deployment
  allowedWorkflows:
    - google-cloud-buildpacks    # Existing workflow
    - ballerina-buildpack        # Existing workflow
    - docker                     # Existing workflow

  # Schema and resources configuration
  schema:
    # ... component schema definition
  resources:
    # ... resource templates
```
