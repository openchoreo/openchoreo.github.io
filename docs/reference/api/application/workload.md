---
title: Workload API Reference
---

# Workload

A Workload defines the runtime specification for a Component in OpenChoreo, including container configuration,
network endpoints, and connections to other services. It represents the actual deployment characteristics of a
component, specifying the container to run, what ports to expose, and what dependencies to inject. Workloads are
created automatically by build processes or can be defined manually for pre-built images.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

Workloads are namespace-scoped resources and belong to a Component through the owner field.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workload
metadata:
  name: <workload-name>
  namespace: <namespace>  # Namespace for grouping workloads
```

### Spec Fields

| Field         | Type                                                 | Required | Default | Description                                                           |
|---------------|------------------------------------------------------|----------|---------|-----------------------------------------------------------------------|
| `owner`       | [WorkloadOwner](#workloadowner)                      | Yes      | -       | Ownership information linking the workload to a project and component |
| `container`   | [Container](#container)                              | Yes      | -       | Container specification for the workload                              |
| `endpoints`   | map[string][WorkloadEndpoint](#workloadendpoint)     | No       | {}      | Network endpoints for port exposure keyed by endpoint name            |
| `connections` | map[string][WorkloadConnection](#workloadconnection) | No       | {}      | Connections to internal/external resources keyed by connection name   |

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
| `files`   | [[File](#file)]     | No       | []      | File configurations and secrets          |

### EnvVar

| Field          | Type                            | Required | Default | Description                                             |
|----------------|---------------------------------|----------|---------|---------------------------------------------------------|
| `key`          | string                          | Yes      | -       | Environment variable name                               |
| `value`        | string                          | No       | -       | Environment variable value (required if secretRef is not set) |
| `secretRef` | [secretRef](#secretref)   | No       | -       | Reference to a secret key (required if value is not set) |

### File

| Field          | Type                            | Required | Default | Description                                             |
|----------------|---------------------------------|----------|---------|---------------------------------------------------------|
| `key`          | string                          | Yes      | -       | File name                                               |
| `mountPath`    | string                          | Yes      | -       | Path where the file should be mounted                   |
| `value`        | string                          | No       | -       | File content (required if secretRef is not set)      |
| `secretRef` | [secretRef](#secretref)   | No       | -       | Reference to a secret key (required if value is not set) |

### secretRef

| Field   | Type   | Required | Default | Description           |
|---------|--------|----------|---------|------------------------|
| `name`  | string | Yes      | -       | Name of the secret     |
| `key`   | string | Yes      | -       | Key within the secret  |

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

| Field   | Type   | Required | Default | Description                                                     |
|---------|--------|----------|---------|-----------------------------------------------------------------|
| `name`  | string | Yes      | -       | Environment variable name                                       |
| `value` | string | Yes      | -       | Template value using connection properties (e.g., `{{ .url }}`) |

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
  container:
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

### Workload with Environment Variables and Files

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workload
metadata:
  name: secure-service-workload
  namespace: default
spec:
  owner:
    projectName: my-project
    componentName: secure-service
  container:
    image: myregistry/secure-service:v1.0.0
    env:
      - key: LOG_LEVEL
        value: info
      - key: GIT_PAT
        secretRef:
          name: git-secrets
          key: pat
    files:
      - key: ssl.pem
        mountPath: /tmp
        secretRef:
          name: certificates
          key: privateKey
      - key: application.toml
        mountPath: /tmp
        value: |
          schema_generation:
            enable: true
  endpoints:
    api:
      type: REST
      port: 8080
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
  container:
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
            value: "{{ .url }}"
          - name: DB_HOST
            value: "{{ .host }}"
          - name: DB_PORT
            value: "{{ .port }}"
```

## Annotations

Workloads support the following annotations:

| Annotation                    | Description                          |
|-------------------------------|--------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display   |
| `openchoreo.dev/description`  | Detailed description of the workload |

## Related Resources

- [Component](./component.md) - Components that own workloads
- [Service](./service.md) - Service resources that reference workloads
- [WebApplication](./webapplication.md) - WebApplication resources that reference workloads
- [ScheduledTask](./scheduledtask.md) - ScheduledTask resources that reference workloads
- [Build](./build.md) - Build jobs that create workloads
