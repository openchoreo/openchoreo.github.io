---
layout: docs
title: Workload API Reference
---

# Workload

A Workload defines the runtime specification for a Component in OpenChoreo, including container configurations,
network endpoints, and connections to other services. It represents the actual deployment characteristics of a
component, specifying what containers to run, what ports to expose, and what dependencies to inject. Workloads are
created automatically by build processes or can be defined manually for pre-built images.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

Workloads are namespace-scoped resources that must be created within an Organization's namespace and belong to a
Component through the owner field.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workload
metadata:
  name: <workload-name>
  namespace: <org-namespace>  # Organization namespace
```

### Spec Fields

| Field         | Type                                                 | Required | Default | Description                                                                                            |
|---------------|------------------------------------------------------|----------|---------|--------------------------------------------------------------------------------------------------------|
| `owner`       | [WorkloadOwner](#workloadowner)                      | Yes      | -       | Ownership information linking the workload to a project and component                                  |
| `containers`  | map[string][Container](#container)                   | Yes      | -       | Container specifications keyed by container name. Must have at least one container with the key "main" |
| `endpoints`   | map[string][WorkloadEndpoint](#workloadendpoint)     | No       | {}      | Network endpoints for port exposure keyed by endpoint name                                             |
| `connections` | map[string][WorkloadConnection](#workloadconnection) | No       | {}      | Connections to internal/external resources keyed by connection name                                    |

### WorkloadOwner

| Field           | Type   | Required | Default | Description                                            |
|-----------------|--------|----------|---------|--------------------------------------------------------|
| `projectName`   | string | Yes      | -       | Name of the project that owns this workload (min: 1)   |
| `componentName` | string | Yes      | -       | Name of the component that owns this workload (min: 1) |

### Container

| Field     | Type                | Required | Default | Description                              |
|-----------|---------------------|----------|---------|------------------------------------------|
| `image`   | string              | Yes      | -       | OCI image to run (digest or tag, min: 1) |
| `command` | []string            | No       | []      | Container entrypoint                     |
| `args`    | []string            | No       | []      | Arguments for the entrypoint             |
| `env`     | [[EnvVar](#envvar)] | No       | []      | Environment variables                    |

### EnvVar

| Field   | Type   | Required | Default | Description                |
|---------|--------|----------|---------|----------------------------|
| `key`   | string | Yes      | -       | Environment variable name  |
| `value` | string | Yes      | -       | Environment variable value |

### WorkloadEndpoint

| Field    | Type                          | Required | Default | Description                              |
|----------|-------------------------------|----------|---------|------------------------------------------|
| `type`   | [EndpointType](#endpointtype) | Yes      | -       | Protocol/technology of the endpoint      |
| `port`   | int32                         | Yes      | -       | Port number for the endpoint (1-65535)   |
| `schema` | [Schema](#schema)             | No       | -       | Optional API definition for the endpoint |

### EndpointType

| Value       | Description            |
|-------------|------------------------|
| `HTTP`      | Standard HTTP endpoint |
| `REST`      | RESTful API endpoint   |
| `gRPC`      | gRPC service endpoint  |
| `GraphQL`   | GraphQL API endpoint   |
| `Websocket` | WebSocket endpoint     |
| `TCP`       | Raw TCP endpoint       |
| `UDP`       | UDP endpoint           |

### Schema

| Field     | Type   | Required | Default | Description                     |
|-----------|--------|----------|---------|---------------------------------|
| `content` | string | No       | ""      | Schema content (API definition) |

### WorkloadConnection

| Field    | Type                                                  | Required | Default | Description                                                           |
|----------|-------------------------------------------------------|----------|---------|-----------------------------------------------------------------------|
| `type`   | string                                                | Yes      | -       | Type of connection (currently only "api" supported)                   |
| `params` | map[string]string                                     | No       | {}      | Connection configuration parameters (depends on connection type)      |
| `inject` | [WorkloadConnectionInject](#workloadconnectioninject) | Yes      | -       | Defines how connection details are injected (currently only env vars) |

### WorkloadConnectionInject

| Field | Type                                                    | Required | Default | Description                     |
|-------|---------------------------------------------------------|----------|---------|---------------------------------|
| `env` | [[WorkloadConnectionEnvVar](#workloadconnectionenvvar)] | Yes      | -       | Environment variables to inject |

### WorkloadConnectionEnvVar

| Field   | Type   | Required | Default | Description                                                                          |
|---------|--------|----------|---------|--------------------------------------------------------------------------------------|
| `name`  | string | Yes      | -       | Environment variable name                                                            |
| `value` | string | Yes      | -       | Template value using connection properties (e.g., "{% raw %}{{ .url }}{% endraw %}") |

## Examples

### Basic Service Workload

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workload
metadata:
  name: customer-service-workload
  namespace: default
spec:
  owner:
    projectName: my-project
    componentName: customer-service
  containers:
    main:
      image: myregistry/customer-service:v1.0.0
      env:
        - key: LOG_LEVEL
          value: info
  endpoints:
    http:
      type: REST
      port: 8080
    metrics:
      type: HTTP
      port: 9090
```

### Workload with Connections

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workload
metadata:
  name: order-service-workload
  namespace: default
spec:
  owner:
    projectName: my-project
    componentName: order-service
  containers:
    main:
      image: myregistry/order-service:v2.1.0
      command: [ "/app/server" ]
      args: [ "--config", "/etc/config.yaml" ]
  endpoints:
    api:
      type: REST
      port: 8080
      schema:
        content: |
          openapi: 3.0.0
          info:
            title: Order API
            version: 1.0.0
  connections:
    database:
      type: api
      params:
        service: postgres-db
      inject:
        env:
          - name: DATABASE_URL
            value: "{% raw %}{{ .url }}{% endraw %}"
          - name: DB_HOST
            value: "{% raw %}{{ .host }}{% endraw %}"
          - name: DB_PORT
            value: "{% raw %}{{ .port }}{% endraw %}"
```

## Annotations

Workloads support the following annotations:

| Annotation                    | Description                          |
|-------------------------------|--------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display   |
| `openchoreo.dev/description`  | Detailed description of the workload |

## Related Resources

- [Component](/docs/reference/api/application/component/) - Components that own workloads
- [Service](/docs/reference/api/application/service/) - Service resources that reference workloads
- [WebApplication](/docs/reference/api/application/webapplication/) - WebApplication resources that reference workloads
- [ScheduledTask](/docs/reference/api/application/scheduledtask/) - ScheduledTask resources that reference workloads
- [Build](/docs/reference/api/application/build/) - Build jobs that create workloads
