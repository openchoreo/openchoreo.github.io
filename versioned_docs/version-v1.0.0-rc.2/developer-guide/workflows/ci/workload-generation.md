---
title: Workload Generation
description: How CI workflows create Workload CRs via the OpenChoreo API server
sidebar_position: 5
---

# Workload Generation

When a CI workflow builds a container image, the next step is creating a Workload CR in the control plane. The ClusterWorkflowTemplate calls the OpenChoreo API server directly to create or update the Workload resource.

## How It Works

The workflow step handles workload creation end-to-end by calling the OpenChoreo API server:

1. The CI workflow builds and publishes a container image
2. The workflow step generates a workload payload (using `occ workload create` to produce a local file, or by constructing the JSON directly)
3. The step obtains an OAuth access token via client credentials grant
4. The step calls `POST /api/v1/namespaces/{namespaceName}/workloads` to create the Workload
5. If the Workload already exists (HTTP 409), the step falls back to `PUT /api/v1/namespaces/{namespaceName}/workloads/{workloadName}` to update it
6. The API server creates or updates the Workload CR in the control plane
7. The step annotates the WorkflowRun with the workload CR and source origin, so the UI can display build details such as the container image and workload configuration

## Workflow Step Details

### Authentication

The workflow step authenticates with the API server using OAuth 2.0 client credentials:

```bash
TOKEN_RESPONSE=$(curl -s --fail-with-body \
  -X POST "${OAUTH_TOKEN_URL}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}")

ACCESS_TOKEN=$(echo "${TOKEN_RESPONSE}" | jq -r '.access_token')
```

The OAuth parameters (token URL, client ID, client secret) are provided as input parameters to the ClusterWorkflowTemplate step.

By default, OpenChoreo ships with Thunder as the identity provider and a pre-configured OAuth client (`openchoreo-workload-publisher-client`) for development and testing. If you are using an external identity provider, refer to the [Workflow Workload Configuration](../../../platform-engineer-guide/workflow-workload-configuration.mdx) operations guide for setup instructions.

### Creating the Workload

After obtaining the token, the step calls the API server to create the Workload:

```bash
curl -s -X POST "${API_URL}/api/v1/namespaces/${NAMESPACE_NAME}/workloads" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d @workload-cr.json
```

If the Workload already exists (HTTP 409 Conflict), the step updates it instead:

```bash
curl -s -X PUT "${API_URL}/api/v1/namespaces/${NAMESPACE_NAME}/workloads/${WORKLOAD_NAME}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d @workload-cr.json
```

### Annotating the WorkflowRun

After creating or updating the Workload, the step annotates the WorkflowRun with the workload details. The UI uses these annotations to display build output such as the container image and workload configuration.

The step fetches the current WorkflowRun, adds the annotations, and updates it via `PUT`:

```bash
# Get the current WorkflowRun
WF_RUN_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X GET "${API_URL}/api/v1/namespaces/${NAMESPACE_NAME}/workflowruns/${RUN_NAME}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

# Add annotations and update
curl -s -X PUT "${API_URL}/api/v1/namespaces/${NAMESPACE_NAME}/workflowruns/${RUN_NAME}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d @workflowrun-updated.json
```

Two annotations are set on the WorkflowRun:

| Annotation                            | Description                                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openchoreo.dev/workload`             | The complete workload CR as a compact JSON string (contains the image, endpoints, configurations, etc.)                                                      |
| `openchoreo.dev/workload-from-source` | `"true"` if the workload was generated from a `workload.yaml` descriptor in the source repository, `"false"` if auto-generated with just the container image |

### ClusterWorkflowTemplate Configuration

The workflow template step accepts the following input parameters for API server and OAuth configuration:

```yaml
# In the ClusterWorkflowTemplate
- name: generate-workload-cr
  inputs:
    parameters:
      - name: image
      - name: run-name
      # OAuth configuration
      - name: oauth-token-url
        default: "http://host.k3d.internal:8080/oauth2/token"
      - name: oauth-host-header
        default: "thunder.openchoreo.localhost"
      - name: oauth-client-id
        default: "openchoreo-workload-publisher-client"
      - name: oauth-client-secret
        default: "openchoreo-workload-publisher-secret"
      # API server configuration
      - name: api-server-url
        default: "http://host.k3d.internal:8080"
      - name: api-server-host-header
        default: "api.openchoreo.localhost"
```

## Workload Descriptor

You can provide a workload descriptor YAML file in your source repository to define the full workload structure. The workflow step uses this descriptor when generating the workload payload that is sent to the API server.

```yaml
# workload.yaml - place in your source repository
apiVersion: openchoreo.dev/v1alpha1

metadata:
  name: reading-list-service

endpoints:
  - name: reading-list-api
    port: 5000
    type: HTTP
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

- **With descriptor**: Full workload specification with endpoints, dependencies, and configurations
- **Without descriptor**: Basic workload with just the container image

Using `occ workload create` is optional. You can use it inside the workflow step to read the descriptor and produce a Workload CR file, which is then converted to JSON and sent to the API server. Alternatively, you can skip the CLI and construct the JSON payload directly in the workflow step.

## See Also

- [CI Workflows Overview](./overview.md) — How CI workflows work
- [Creating Workflows](../creating-workflows.mdx) — Full workflow creation guide
- [Workload API Reference](../../../reference/api/application/workload.md) — Full Workload specification
- [Workflow Workload Configuration](../../../platform-engineer-guide/workflow-workload-configuration.mdx) — Configure workflow authentication for external identity providers
