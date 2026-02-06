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

## How It Differs from ComponentWorkflows

| Aspect | ComponentWorkflow | Generic Workflow |
|--------|-------------------|------------------|
| **Purpose** | Build and deploy component images | Run any automation task |
| **Tied to** | Component (project + component) | Standalone (no component binding) |
| **Schema** | `systemParameters` (fixed structure) + `parameters` (flexible) | `parameters` only (fully flexible) |
| **Template Variables** | `${metadata.*}`, `${systemParameters.*}`, `${parameters.*}` | `${metadata.*}`, `${parameters.*}` |
| **Outputs** | Requires `workload-cr` output parameter | No required outputs |
| **Governance** | Controlled via `allowedWorkflows` in ComponentType | Not restricted by ComponentType |

## Creating a Generic Workflow

Creating a Generic Workflow involves three resources:

1. **ClusterWorkflowTemplate** in the build plane — defines the actual execution steps
2. **Workflow** in the control plane — defines the parameter schema and references the template
3. **WorkflowRun** in the control plane — triggers an execution with specific parameter values

### Step 1: Create ClusterWorkflowTemplate

The ClusterWorkflowTemplate defines the Argo Workflow steps that execute in the build plane. Unlike ComponentWorkflows, there are no required output parameters — you can define any steps your workflow needs.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ClusterWorkflowTemplate
metadata:
  name: generic-workflow-docker-build
spec:
  entrypoint: build-workflow
  templates:
    - name: build-workflow
      steps:
        - - name: clone-step
            template: clone-step
        - - name: build-step
            template: build-step
            arguments:
              parameters:
                - name: git-revision
                  value: '{{steps.clone-step.outputs.parameters.git-revision}}'
        - - name: push-step
            template: push-step
            arguments:
              parameters:
                - name: git-revision
                  value: '{{steps.clone-step.outputs.parameters.git-revision}}'

    - name: clone-step
      container:
        image: alpine/git
        command: [sh, -c]
        args:
          - |-
            set -e
            BRANCH={{workflow.parameters.branch}}
            REPO={{workflow.parameters.git-repo}}
            COMMIT={{workflow.parameters.commit}}

            if [[ -n "$COMMIT" ]]; then
                echo "Cloning specific commit: $COMMIT"
                git clone --no-checkout --depth 1 "$REPO" /mnt/vol/source
                cd /mnt/vol/source
                git config --global advice.detachedHead false
                git fetch --depth 1 origin "$COMMIT"
                git checkout "$COMMIT"
                echo -n "$COMMIT" | cut -c1-8 > /tmp/git-revision.txt
            else
                echo "Cloning branch: $BRANCH with latest commit"
                git clone --single-branch --branch $BRANCH --depth 1 "$REPO" /mnt/vol/source
                cd /mnt/vol/source
                COMMIT_SHA=$(git rev-parse HEAD)
                echo -n "$COMMIT_SHA" | cut -c1-8 > /tmp/git-revision.txt
            fi
        volumeMounts:
          - mountPath: /mnt/vol
            name: workspace
      outputs:
        parameters:
          - name: git-revision
            valueFrom:
              path: /tmp/git-revision.txt

    - name: build-step
      inputs:
        parameters:
          - name: git-revision
      container:
        image: ghcr.io/openchoreo/podman-runner:v1.0
        command: [sh, -c]
        args:
          - |-
            set -e
            WORKDIR=/mnt/vol/source
            IMAGE="{{workflow.parameters.image-name}}:{{workflow.parameters.image-tag}}-{{inputs.parameters.git-revision}}"
            DOCKER_CONTEXT="{{workflow.parameters.docker-context}}"
            DOCKERFILE_PATH="{{workflow.parameters.dockerfile-path}}"

            mkdir -p /etc/containers
            cat > /etc/containers/storage.conf <<EOF
            [storage]
            driver = "overlay"
            runroot = "/run/containers/storage"
            graphroot = "/var/lib/containers/storage"
            [storage.options.overlay]
            mount_program = "/usr/bin/fuse-overlayfs"
            EOF

            podman build -t $IMAGE -f $WORKDIR/$DOCKERFILE_PATH $WORKDIR/$DOCKER_CONTEXT
            podman save -o /mnt/vol/app-image.tar $IMAGE
        securityContext:
          privileged: true
        volumeMounts:
          - mountPath: /mnt/vol
            name: workspace

    - name: push-step
      inputs:
        parameters:
          - name: git-revision
      container:
        image: ghcr.io/openchoreo/podman-runner:v1.0
        command: [sh, -c]
        args:
          - |-
            set -e
            GIT_REVISION={{inputs.parameters.git-revision}}
            IMAGE_NAME={{workflow.parameters.image-name}}
            IMAGE_TAG={{workflow.parameters.image-tag}}
            SRC_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}-${GIT_REVISION}"

            REGISTRY_ENDPOINT="host.k3d.internal:10082"

            mkdir -p /etc/containers
            cat <<EOF > /etc/containers/storage.conf
            [storage]
            driver = "overlay"
            runroot = "/run/containers/storage"
            graphroot = "/var/lib/containers/storage"
            [storage.options.overlay]
            mount_program = "/usr/bin/fuse-overlayfs"
            EOF

            podman load -i /mnt/vol/app-image.tar
            podman tag $SRC_IMAGE $REGISTRY_ENDPOINT/$SRC_IMAGE
            podman push --tls-verify=false $REGISTRY_ENDPOINT/$SRC_IMAGE

            echo -n "$REGISTRY_ENDPOINT/$SRC_IMAGE" > /tmp/image.txt
        securityContext:
          privileged: true
        volumeMounts:
          - mountPath: /mnt/vol
            name: workspace
      outputs:
        parameters:
          - name: image
            valueFrom:
              path: /tmp/image.txt

  ttlStrategy:
    secondsAfterCompletion: 3600
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

### Step 2: Create Workflow

The Workflow CR defines the parameter schema and the run template that references the ClusterWorkflowTemplate.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workflow
metadata:
  name: generic-workflow-docker-build
  namespace: default
  annotations:
    openchoreo.dev/description: "Generic Docker workflow for containerized workflows using Dockerfile"
spec:
  schema:
    parameters:
      repository:
        url: string | description="Git repository URL"
        revision:
          branch: string | default=main description="Git branch to checkout"
          commit: string | default="" description="Git commit SHA or reference (optional, defaults to latest)"
        appPath: string | default=. description="Path to the application directory within the repository"
      docker:
        context: string | default=. description="Docker build context path relative to the repository root"
        filePath: string | default=./Dockerfile description="Path to the Dockerfile relative to the repository root"

  runTemplate:
    apiVersion: argoproj.io/v1alpha1
    kind: Workflow
    metadata:
      name: ${metadata.workflowRunName}
      namespace: openchoreo-ci-${metadata.namespaceName}
    spec:
      arguments:
        parameters:
          - name: git-repo
            value: ${parameters.repository.url}
          - name: branch
            value: ${parameters.repository.revision.branch}
          - name: commit
            value: ${parameters.repository.revision.commit}
          - name: app-path
            value: ${parameters.repository.appPath}
          - name: docker-context
            value: ${parameters.docker.context}
          - name: dockerfile-path
            value: ${parameters.docker.filePath}
          - name: image-name
            value: generic-workflow-image
          - name: image-tag
            value: v1
      serviceAccountName: workflow-sa
      workflowTemplateRef:
        clusterScope: true
        name: generic-workflow-docker-build
```

### Step 3: Trigger with WorkflowRun

Create a WorkflowRun to execute the workflow with specific parameter values.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: generic-workflow-run-docker-build-01
spec:
  workflow:
    name: generic-workflow-docker-build
    parameters:
      repository:
        url: "https://github.com/openchoreo/sample-workloads"
        revision:
          branch: "main"
        appPath: "/service-go-greeter"
      docker:
        context: "/service-go-greeter"
        filePath: "/service-go-greeter/Dockerfile"
```

## Deploying the Resources

Deploy the resources in order:

```bash
# 1. Deploy the ClusterWorkflowTemplate to the Build Plane
kubectl apply -f cluster-workflow-template-docker-build.yaml

# 2. Deploy the Workflow CR to the Control Plane
kubectl apply -f workflow-docker-build.yaml

# 3. Trigger an execution by creating a WorkflowRun
kubectl apply -f workflow-run-docker-build.yaml
```

## See Also

- [CI Overview](./overview.md) - Understand ComponentWorkflows and CI architecture
- [Workflow API Reference](../../reference/api/platform/workflow.md) - Full Workflow resource specification
- [WorkflowRun API Reference](../../reference/api/application/workflowrun.md) - Full WorkflowRun resource specification
- [Argo Workflows Documentation](https://argo-workflows.readthedocs.io/en/latest/cluster-workflow-templates/) - ClusterWorkflowTemplate reference
