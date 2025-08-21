---
title: ServiceBinding API Reference
---

# ServiceBinding

A ServiceBinding represents the deployment of a Service to a specific Environment in OpenChoreo. It binds a Service
component to an environment, creating the actual runtime instances. ServiceBindings contain environment-specific
configurations including the workload specification and API configurations. They control the lifecycle of the
deployed service.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ServiceBindings are namespace-scoped resources that must be created within an Organization's namespace.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ServiceBinding
metadata:
  name: <servicebinding-name>
  namespace: <org-namespace>  # Organization namespace
```

### Spec Fields

| Field          | Type                                          | Required | Default   | Description                                                                    |
|----------------|-----------------------------------------------|----------|-----------|--------------------------------------------------------------------------------|
| `owner`        | [ServiceOwner](#serviceowner)                 | Yes      | -         | Ownership information linking the binding to a project and component           |
| `environment`  | string                                        | Yes      | -         | Target environment for this binding                                            |
| `className`    | string                                        | No       | "default" | Name of the ServiceClass that provides deployment configuration                |
| `workloadSpec` | [WorkloadTemplateSpec](#workloadtemplatespec) | Yes      | -         | Workload specification for this environment                                    |
| `apis`         | map[string][ServiceAPI](#serviceapi)          | No       | {}        | API configuration for endpoints. Keys must match endpoint keys in the workload |
| `releaseState` | [ReleaseState](#releasestate)                 | No       | "Active"  | Controls the deployment state of the release                                   |

### ServiceOwner

| Field           | Type   | Required | Default | Description                                          |
|-----------------|--------|----------|---------|------------------------------------------------------|
| `projectName`   | string | Yes      | -       | Name of the project that owns this service binding   |
| `componentName` | string | Yes      | -       | Name of the component that owns this service binding |

### WorkloadTemplateSpec

The WorkloadTemplateSpec contains the same fields as the Workload spec, allowing environment-specific configuration.

| Field         | Type                                                                                          | Required | Default | Description                                                                                                                      |
|---------------|-----------------------------------------------------------------------------------------------|----------|---------|----------------------------------------------------------------------------------------------------------------------------------|
| `containers`  | map[string][Container](/docs/reference/api/application/workload/#container)                   | Yes      | -       | Container specifications keyed by container name. Must have at least one container with the key "main"                           |
| `endpoints`   | map[string][WorkloadEndpoint](/docs/reference/api/application/workload/#workloadendpoint)     | No       | {}      | Network endpoints for port exposure keyed by endpoint name                                                                       |
| `connections` | map[string][WorkloadConnection](/docs/reference/api/application/workload/#workloadconnection) | No       | {}      | Connections to internal/external resources keyed by connection name. Supports template variables provided by the connection type |

### ServiceAPI

| Field       | Type                                                                  | Required | Default   | Description                            |
|-------------|-----------------------------------------------------------------------|----------|-----------|----------------------------------------|
| `className` | string                                                                | No       | "default" | API class name for management policies |
| `type`      | [EndpointType](/docs/reference/api/application/service/#endpointtype) | Yes      | -         | Type of the API endpoint               |
| `rest`      | [RESTEndpoint](/docs/reference/api/application/service/#restendpoint) | No       | -         | REST-specific endpoint configuration   |

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

| Field          | Type                                                                  | Default | Description                                   |
|----------------|-----------------------------------------------------------------------|---------|-----------------------------------------------|
| `name`         | string                                                                | ""      | Endpoint identifier matching spec.endpoints   |
| `type`         | [EndpointType](/docs/reference/api/application/service/#endpointtype) | ""      | Type of the endpoint                          |
| `project`      | [EndpointAccess](#endpointaccess)                                     | -       | Access info for project-level visibility      |
| `organization` | [EndpointAccess](#endpointaccess)                                     | -       | Access info for organization-level visibility |
| `public`       | [EndpointAccess](#endpointaccess)                                     | -       | Access info for public visibility             |

### EndpointAccess

| Field      | Type   | Default | Description                                                                         |
|------------|--------|---------|-------------------------------------------------------------------------------------|
| `host`     | string | ""      | Hostname or service name                                                            |
| `port`     | int32  | 0       | Port number                                                                         |
| `scheme`   | string | ""      | Connection scheme (http, https, grpc, tcp)                                          |
| `basePath` | string | ""      | Base URL path (for HTTP-based endpoints)                                            |
| `uri`      | string | ""      | Computed URI for connecting to the endpoint (e.g., https://api.example.com:8080/v1) |

## Examples

### Basic ServiceBinding

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ServiceBinding
metadata:
  name: customer-service-prod-binding
  namespace: default
spec:
  owner:
    projectName: my-project
    componentName: customer-service
  environment: production
  className: default
  workloadSpec:
    containers:
      main:
        image: myregistry/customer-service:v1.0.0
        env:
          - key: LOG_LEVEL
            value: info
          - key: DB_HOST
            value: prod-db.example.com
    endpoints:
      api:
        type: REST
        port: 8080
```

### ServiceBinding with API Configuration

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ServiceBinding
metadata:
  name: order-service-staging-binding
  namespace: default
spec:
  owner:
    projectName: my-project
    componentName: order-service
  environment: staging
  className: production-service
  workloadSpec:
    containers:
      main:
        image: myregistry/order-service:v2.1.0-rc1
        env:
          - key: ENVIRONMENT
            value: staging
    endpoints:
      order-api:
        type: REST
        port: 8080
    connections:
      database:
        type: api
        params:
          projectName: my-project
          componentName: postgres-db
          endpoint: tcp-endpoint
        inject:
          env:
            - name: DATABASE_HOST
              value: "{{ .host }}"
            - name: DATABASE_PORT
              value: "{{ .port }}"
  apis:
    order-api:
      className: default
      type: REST
      rest:
        backend:
          port: 8080
          basePath: /api/v1
        exposeLevels:
          - Organization
```

## Annotations

ServiceBindings support the following annotations:

| Annotation                    | Description                                 |
|-------------------------------|---------------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display          |
| `openchoreo.dev/description`  | Detailed description of the service binding |

## Related Resources

- [Service](/docs/reference/api/application/service/) - Service resources that ServiceBindings deploy
- [Environment](/docs/reference/api/platform/environment/) - Environments where services are bound
- [Release](/docs/reference/api/runtime/release/) - Releases created by ServiceBindings
- [Workload](/docs/reference/api/application/workload/) - Workload specifications used in bindings
