---
title: WebApplicationBinding API Reference
---

# WebApplicationBinding

A WebApplicationBinding represents the deployment of a WebApplication to a specific Environment in OpenChoreo. It binds
a WebApplication component to an environment, creating the actual runtime instances. WebApplicationBindings contain
environment-specific configurations including the workload specification. They control the lifecycle of the deployed
web application.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

WebApplicationBindings are namespace-scoped resources that must be created within an Organization's namespace.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WebApplicationBinding
metadata:
  name: <webapplicationbinding-name>
  namespace: <org-namespace>  # Organization namespace
```

### Spec Fields

| Field          | Type                                          | Required | Default   | Description                                                            |
|----------------|-----------------------------------------------|----------|-----------|------------------------------------------------------------------------|
| `owner`        | [WebApplicationOwner](#webapplicationowner)   | Yes      | -         | Ownership information linking the binding to a project and component   |
| `environment`  | string                                        | Yes      | -         | Target environment for this binding                                    |
| `className`    | string                                        | No       | "default" | Name of the WebApplicationClass that provides deployment configuration |
| `workloadSpec` | [WorkloadTemplateSpec](#workloadtemplatespec) | Yes      | -         | Workload specification for this environment                            |
| `releaseState` | [ReleaseState](#releasestate)                 | No       | "Active"  | Controls the deployment state of the release                           |

### WebApplicationOwner

| Field           | Type   | Required | Default | Description                                                  |
|-----------------|--------|----------|---------|--------------------------------------------------------------|
| `projectName`   | string | Yes      | -       | Name of the project that owns this web application binding   |
| `componentName` | string | Yes      | -       | Name of the component that owns this web application binding |

### WorkloadTemplateSpec

The WorkloadTemplateSpec contains the same fields as the Workload spec, allowing environment-specific configuration.

| Field         | Type                                                                                          | Required | Default | Description                                                                                                                      |
|---------------|-----------------------------------------------------------------------------------------------|----------|---------|----------------------------------------------------------------------------------------------------------------------------------|
| `containers`  | map[string][Container](/docs/reference/api/application/workload/#container)                   | Yes      | -       | Container specifications keyed by container name. Must have at least one container with the key "main"                           |
| `endpoints`   | map[string][WorkloadEndpoint](/docs/reference/api/application/workload/#workloadendpoint)     | No       | {}      | Network endpoints for port exposure keyed by endpoint name                                                                       |
| `connections` | map[string][WorkloadConnection](/docs/reference/api/application/workload/#workloadconnection) | No       | {}      | Connections to internal/external resources keyed by connection name. Supports template variables provided by the connection type |

### ReleaseState

| Value      | Description                                        |
|------------|----------------------------------------------------|
| `Active`   | Resources are deployed normally to the data plane  |
| `Suspend`  | Resources are suspended (scaled to zero or paused) |
| `Undeploy` | Resources are removed from the data plane          |

### Status Fields

| Field        | Type                                | Default | Description                                               |
|--------------|-------------------------------------|---------|-----------------------------------------------------------|
| `conditions` | []Condition                         | []      | Standard Kubernetes conditions tracking the binding state |
| `endpoints`  | [[EndpointStatus](#endpointstatus)] | []      | Status information for each endpoint                      |

### EndpointStatus

| Field          | Type                              | Default | Description                                   |
|----------------|-----------------------------------|---------|-----------------------------------------------|
| `name`         | string                            | ""      | Endpoint identifier matching spec.endpoints   |
| `type`         | string                            | ""      | Type of the endpoint                          |
| `project`      | [EndpointAccess](#endpointaccess) | -       | Access info for project-level visibility      |
| `organization` | [EndpointAccess](#endpointaccess) | -       | Access info for organization-level visibility |
| `public`       | [EndpointAccess](#endpointaccess) | -       | Access info for public visibility             |

### EndpointAccess

| Field      | Type   | Default | Description                                                                         |
|------------|--------|---------|-------------------------------------------------------------------------------------|
| `host`     | string | ""      | Hostname or service name                                                            |
| `port`     | int32  | 0       | Port number                                                                         |
| `scheme`   | string | ""      | Connection scheme (http, https)                                                     |
| `basePath` | string | ""      | Base URL path (for HTTP-based endpoints)                                            |
| `uri`      | string | ""      | Computed URI for connecting to the endpoint (e.g., https://api.example.com:8080/v1) |

## Examples

### Basic WebApplicationBinding

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WebApplicationBinding
metadata:
  name: frontend-app-prod-binding
  namespace: default
spec:
  owner:
    projectName: my-project
    componentName: frontend
  environment: production
  className: default
  workloadSpec:
    containers:
      main:
        image: myregistry/frontend:v2.0.0
        env:
          - key: API_URL
            value: https://api.production.example.com
          - key: ENVIRONMENT
            value: production
    endpoints:
      http:
        type: HTTP
        port: 3000
```

### WebApplicationBinding with Connections

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WebApplicationBinding
metadata:
  name: admin-dashboard-staging-binding
  namespace: default
spec:
  owner:
    projectName: my-project
    componentName: admin-ui
  environment: staging
  className: production-webapp
  workloadSpec:
    containers:
      main:
        image: myregistry/admin-dashboard:v1.5.0-rc2
        env:
          - key: LOG_LEVEL
            value: debug
    endpoints:
      web:
        type: HTTP
        port: 8080
    connections:
      backend-api:
        type: api
        params:
          projectName: my-project
          componentName: admin-backend
          endpoint: http-endpoint
        inject:
          env:
            - name: BACKEND_URL
              value: "{{ .host }}:{{ .port }}"
      auth-service:
        type: api
        params:
          projectName: my-project
          componentName: auth-service
          endpoint: http-endpoint
        inject:
          env:
            - name: AUTH_HOST
              value: "{{ .host }}"
            - name: AUTH_PORT
              value: "{{ .port }}"
```

## Annotations

WebApplicationBindings support the following annotations:

| Annotation                    | Description                                         |
|-------------------------------|-----------------------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display                  |
| `openchoreo.dev/description`  | Detailed description of the web application binding |

## Related Resources

- [WebApplication](/docs/reference/api/application/webapplication/) - WebApplication resources that
  WebApplicationBindings deploy
- [Environment](/docs/reference/api/platform/environment/) - Environments where web applications are bound
- [Release](/docs/reference/api/runtime/release/) - Releases created by WebApplicationBindings
- [Workload](/docs/reference/api/application/workload/) - Workload specifications used in bindings
