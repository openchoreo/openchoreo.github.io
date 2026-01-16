---
title: Multiple Private Git Organizations
description: Configure workflows to authenticate with private repositories across multiple Git organizations, groups, or workspaces
sidebar_position: 6
---

# Configure Multiple Private Git Organizations

When your organization works with private repositories across multiple Git organizations, groups, or workspaces, you can configure ComponentWorkflows to let developers select which credentials to use for their builds. This eliminates the need to create separate workflows for each Git organization.

## Use Cases

- **Multiple GitHub Organizations**: Your company has separate GitHub organizations for different teams or projects
- **Multiple GitLab Groups**: Different GitLab groups for frontend, backend, and infrastructure repositories
- **Multiple Bitbucket Workspaces**: Separate Bitbucket workspaces for different business units
- **Mixed Providers**: Some projects in GitHub, others in GitLab or Bitbucket
- **Client Projects**: Building applications from different client organizations

## How It Works

Instead of hardcoding a single Git token:

1. **Add a parameter** to the ComponentWorkflow schema that lets developers select the Git organization
2. **Store multiple tokens** in your secret backend, one for each organization/group/workspace
3. **Dynamically reference** the appropriate token based on the developer's selection

## Configuration Steps

### Step 1: Create Git Tokens for Each Organization

Create a separate Personal Access Token (PAT) for each Git organization you want to support.

### Step 2: Switch to Build Plane Context

If your control plane and build plane are in **separate Kubernetes clusters**, switch to the build plane cluster context. This is where workflow execution and git cloning happens.

```bash
kubectl config use-context <build-plane-context>
```

### Step 3: Store Tokens in Secret Backend

Store each token in your secret backend using a naming convention like `<organization>-git-token`.

**For Development/Testing (Fake Provider):**

```bash
# Add token for organization A
kubectl patch clustersecretstore default --type='json' -p='[
  {
    "op": "add",
    "path": "/spec/provider/fake/data/-",
    "value": {
      "key": "github-acme-corp-git-token",
      "value": "ghp_xxxxxxxxxxxx"
    }
  }
]'

# Add token for organization B
kubectl patch clustersecretstore default --type='json' -p='[
  {
    "op": "add",
    "path": "/spec/provider/fake/data/-",
    "value": {
      "key": "github-acme-labs-git-token",
      "value": "ghp_yyyyyyyyyyyy"
    }
  }
]'

# Add token for organization C
kubectl patch clustersecretstore default --type='json' -p='[
  {
    "op": "add",
    "path": "/spec/provider/fake/data/-",
    "value": {
      "key": "github-open-source-git-token",
      "value": "ghp_zzzzzzzzzzzz"
    }
  }
]'
```

**For Production (AWS Secrets Manager, Vault, etc.):**

Store secrets with keys following the same pattern:
- `github-acme-corp-git-token`
- `github-acme-labs-git-token`
- `github-open-source-git-token`

### Step 4: Configure ComponentWorkflow with Selection Parameter

Add a parameter to your ComponentWorkflow schema that allows developers to select the Git organization:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentWorkflow
metadata:
  name: docker
  namespace: default
spec:
  schema:
    systemParameters:
      repository:
        url: string | description="Git repository URL"
        revision:
          branch: string | default=main description="Git branch to checkout"
          commit: string | description="Git commit SHA (optional)"
        appPath: string | default=. description="Path to application directory"

    parameters:
      # Parameter for selecting Git organization
      gitOrganization: string | default=github-acme-corp enum=github-acme-corp,github-acme-labs,github-open-source description="Git organization/group/workspace to use for authentication"
      docker:
        context: string | default=. description="Docker build context path relative to the repository root"
        filePath: string | default=./Dockerfile description="Path to the Dockerfile relative to the repository root"
        
  resources:
    - id: git-secret
      template:
        apiVersion: external-secrets.io/v1
        kind: ExternalSecret
        metadata:
          name: ${metadata.workflowRunName}-git-secret
          namespace: openchoreo-ci-${metadata.orgName}
        spec:
          refreshInterval: 15s
          secretStoreRef:
            name: default
            kind: ClusterSecretStore
          target:
            name: ${metadata.workflowRunName}-git-secret
            creationPolicy: Owner
          data:
            # Dynamically fetch token based on selected organization
            - secretKey: git-token
              remoteRef:
                key: ${parameters.gitOrganization}-git-token

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
        name: docker
```

**Key Points:**

1. **Parameter Definition**: `gitOrganization` parameter with enum constraining available options
2. **Default Value**: Set a sensible default (e.g., your primary organization)
3. **Dynamic Secret Key**: Use `${parameters.gitOrganization}-git-token` to fetch the correct token
4. **SecretKey**: Always use `git-token` as the secretKey (not the full key path) so the clone step works correctly

### Step 5: Use in Components

Developers can now select the Git organization when creating components:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: my-service
  namespace: default
spec:
  owner:
    projectName: my-project
  componentType: deployment/service

  workflow:
    name: docker
    systemParameters:
      repository:
        url: "https://github.com/acme-labs/private-repo"  # Repository in acme-labs org
        revision:
          branch: "main"
        appPath: "/"
    parameters:
      gitOrganization: "github-acme-labs"  # Select the corresponding organization
      docker:
        context: "/"
        filePath: "/Dockerfile"
```

## See Also

- [Private Repositories](./private-repository.mdx) - Basic private repository setup
- [Additional Resources](./additional-resources.md) - Working with ExternalSecrets and other resources
- [Component Workflow Schema](./component-workflow-schema.md) - Parameter system documentation
