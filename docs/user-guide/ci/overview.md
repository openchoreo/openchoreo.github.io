---
title: Overview
description: Understand how CI works in OpenChoreo using ComponentWorkflows and Argo Workflows
sidebar_position: 1
---

# CI with OpenChoreo

OpenChoreo's CI capabilities enable platform engineers to define, manage, and execute build and automation workflows. By leveraging Kubernetes-native technologies like Argo Workflows, OpenChoreo provides a scalable and flexible CI solution that integrates seamlessly with existing DevOps toolchains.

:::note
OpenChoreo currently supports only Argo Workflows as the underlying engine for executing CI workflows. It can be extended to support more Kubernetes-native engines.
:::

## Core Concepts

### ComponentWorkflow

A **ComponentWorkflow** is a platform engineer-defined template that specifies *how* to build applications. It consists of:

- **Schema**: Defines system parameters (fixed structure for repository, branch, commit) and developer parameters (flexible, PE-defined fields like version, build options, resources)
- **RunTemplate**: An Argo Workflow template with template variables (`${metadata.*}`, `${systemParameters.*}`, `${parameters.*}`)
- **Resources**: Additional Kubernetes resources needed for the workflow (e.g., ExternalSecrets for Git credentials)

ComponentWorkflows live in the control plane and are referenced by Components. Platform engineers control which workflows are available and what parameters developers can configure.

### ComponentWorkflowRun

A **ComponentWorkflowRun** represents a single execution instance of a ComponentWorkflow. When created, it:

- References the Component being built (projectName, componentName)
- References the ComponentWorkflow to use
- Provides actual values for system and developer parameters
- Tracks execution state through conditions (WorkflowPending, WorkflowRunning, WorkflowSucceeded, WorkflowFailed, WorkloadUpdated)
- Stores outputs (image reference, resource references, workflow run reference)

ComponentWorkflowRuns are created either manually or automatically (e.g., via Git webhooks).

:::warning Imperative Resource
ComponentWorkflowRun is an **imperative** resource, it triggers an action (a build) rather than declaring a desired state. Each time a ComponentWorkflowRun is applied, it initiates a new build execution. For this reason, do not include ComponentWorkflowRuns in GitOps repositories. Instead, create them through Git webhooks, the UI, or direct `kubectl apply` commands.
:::

## Architecture

<img
src={require("./overview.png").default}
alt="CI Architecture"
width="100%"
/>

### Multi-Plane Separation

- **Control Plane**: Hosts ComponentWorkflow and ComponentWorkflowRun CRs, orchestrates workflow execution
- **Build Plane**: Executes Argo Workflows using ClusterWorkflowTemplates, performs compute-intensive build operations
- **Communication**: Control plane controller connects to build plane via a websocket connection

In Single Cluster Setup, both planes run in the same cluster.

## Execution Lifecycle

When a ComponentWorkflowRun is created, the following lifecycle occurs:

1. **Initialization**: ComponentWorkflowRun CR created (manually or via webhook)
2. **Template Rendering**: Controller fetches ComponentWorkflow and renders the runTemplate by substituting all template variables with values from ComponentWorkflowRun
3. **Build Plane Setup**: Controller creates namespace (`openchoreo-ci-{orgName}`), ServiceAccount, Role, and RoleBinding in build plane
4. **Resource Application**: Additional resources (ExternalSecrets, ConfigMaps, etc.) applied to build plane
5. **Workflow Execution**: Rendered Argo Workflow applied to build plane, execution begins
6. **Status Polling**: Controller polls workflow status and updates ComponentWorkflowRun conditions:
   - `WorkflowCompleted`: Workflow completed either successfully or with failure
   - `WorkflowRunning`: Argo Workflow executing
   - `WorkflowSucceeded`: Workflow completed successfully
   - `WorkflowFailed`: Workflow failed or errored
7. **Workload Creation**: On success, controller extracts image reference from publish-image output and creates/updates Workload CR
8. **Completion**: `WorkloadUpdated` condition set to true, reconciliation complete

### Resource Cleanup

When a ComponentWorkflowRun is deleted:
- Controller removes all resources created in build plane (ExternalSecrets, ConfigMaps, Workflow, etc.)

## Default ComponentWorkflows

OpenChoreo ships with four default ComponentWorkflows installed in the control plane:

- **docker**: Builds container images using Docker/Podman with a Dockerfile
- **google-cloud-buildpacks**: Builds container images using Google Cloud Buildpacks (auto-detects language)
- **ballerina-buildpack**: Builds Ballerina applications using Ballerina-specific buildpacks
- **react**: Builds React applications with optimized frontend build process

These workflows reference corresponding ClusterWorkflowTemplates in the build plane.

## ClusterWorkflowTemplate

ClusterWorkflowTemplates are an Argo Workflows concept used to define reusable workflow templates at cluster scope in the build plane. For more details, refer to the [Argo Workflows documentation](https://argo-workflows.readthedocs.io/en/latest/cluster-workflow-templates/).

OpenChoreo ships four default ClusterWorkflowTemplates in the build plane:

- **docker**: Docker-based builds using Dockerfile
- **google-cloud-buildpacks**: Google Cloud Buildpacks with automatic language detection
- **ballerina-buildpack**: Ballerina-specific buildpack builds
- **react**: React application builds

Each template defines a standard four-step build workflow:

## Build Workflow Steps

### 1. Checkout Source 

Clones the source repository (private or public) and supports both branch and specific commit checkout.

**Key features:**
- Automatic Git provider detection (GitHub, GitLab, Bitbucket)
- Private repository authentication
- Specific commit checkout or latest commit on branch

```bash
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
```
### 2. Build Image

The build image step executes the actual container image build process. The specific commands vary based on the selected build strategy.

**Example: Docker build image step**

```yaml
WORKDIR=/mnt/vol/source
IMAGE="{{workflow.parameters.image-name}}:{{workflow.parameters.image-tag}}-{{inputs.parameters.git-revision}}"
DOCKER_CONTEXT="{{workflow.parameters.docker-context}}"
DOCKERFILE_PATH="{{workflow.parameters.dockerfile-path}}"

#####################################################################
# 1.  Podman daemon + storage.conf
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

#####################################################################
# 2.  Docker Build
#####################################################################
podman build -t $IMAGE -f $WORKDIR/$DOCKERFILE_PATH $WORKDIR/$DOCKER_CONTEXT
podman save -o /mnt/vol/app-image.tar $IMAGE
```

### 3. Publish Image Step

Pushes the built container image to the container registry. OpenChoreo includes a default registry for development, but external registries can be configured.

**Process:**
- Loads the tarred image from the build image step
- Pushes to registry (with optional TLS verification)
- Outputs full image reference for subsequent steps

**Image naming convention:**
```
{registry-endpoint}/{project-name}-{component-name}-image:{version}-{git-revision}
```

```yaml
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
```

:::important
The publish-image step outputs a parameter named `image` containing the full image reference (registry endpoint, name, and tag). This output is consumed by the generate-workload-cr step to create the Workload CR with the correct container image. The ComponentWorkflowRun controller also stores this image reference in the workflow run status for tracking and debugging.
:::

### 4. Workload CR Creation

The Generate Workload CR step generates a Workload CR (Custom Resource) that defines the runtime specification for the Component. A Workload includes container configurations, network endpoints, and connections to other services.

**Process:**
1. Checks for `workload.yaml` descriptor in the repository at the specified `appPath`
2. Uses `openchoreo-cli` to create Workload CR
3. Outputs the Workload CR YAML

**Behavior:**
- **With workload.yaml**: Full workload specification with endpoints, connections, and configurations
- **Without workload.yaml**: Basic workload with just the container image (additional configurations can be added at deployment time)

The ComponentWorkflowRun controller retrieves this Workload CR from the workflow output and creates/updates the Workload resource in the control plane.

```bash
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
```
:::important
The workload CR is an output of the generate-workload-cr with the parameter name `workload-cr`. This name must remain consistent even when creating custom ClusterWorkflowTemplates, as the ComponentWorkflowRun controller expects this specific output parameter to retrieve the generated Workload CR.

```yaml
name: generate-workload-cr
outputs:
  parameters:
  - name: workload-cr
    valueFrom:
      path: /mnt/vol/workload-cr.yaml
```
:::

## Workflow Governance

### Allowing ComponentWorkflows for Components

Platform engineers control which ComponentWorkflows are available to developers by configuring the `allowedWorkflows` field in ComponentType CRs.

**Example configuration:**

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentType
metadata:
  name: service
  namespace: default
spec:
  workloadType: deployment
  allowedWorkflows:
    - google-cloud-buildpacks
    - ballerina-buildpack
    - docker
  # ... other ComponentType spec fields
```

**Benefits:**
- **Governance**: Only approved build strategies can be used
- **Consistency**: Enforces organizational build standards
- **Compliance**: Ensures security scanning and build policies are applied
- **Flexibility**: Different component types can have different allowed workflows

Components can only reference workflows from their component type's allowed list. This prevents developers from using unapproved or potentially insecure build processes.
