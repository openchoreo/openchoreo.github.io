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
| `dependencies` | [WorkloadDependencies](#workloaddependencies) | No       | -      | Dependencies on other workload endpoints                             |

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
| `value`        | string                          | No       | -       | Environment variable value (required if secretKeyRef is not set) |
| `secretKeyRef` | [secretKeyRef](#secretkeyref)   | No       | -       | Reference to a secret key (required if value is not set) |

### File

| Field          | Type                            | Required | Default | Description                                             |
|----------------|---------------------------------|----------|---------|---------------------------------------------------------|
| `key`          | string                          | Yes      | -       | File name                                               |
| `mountPath`    | string                          | Yes      | -       | Path where the file should be mounted                   |
| `value`        | string                          | No       | -       | File content (required if secretKeyRef is not set)      |
| `secretKeyRef` | [secretKeyRef](#secretkeyref)   | No       | -       | Reference to a secret key (required if value is not set) |

### secretKeyRef

| Field   | Type   | Required | Default | Description           |
|---------|--------|----------|---------|------------------------|
| `name`  | string | Yes      | -       | Name of the secret     |
| `key`   | string | Yes      | -       | Key within the secret  |

### WorkloadEndpoint

| Field         | Type                                    | Required | Default | Description                                                                |
|---------------|-----------------------------------------|----------|---------|----------------------------------------------------------------------------|
| `type`        | [EndpointType](#endpointtype)           | Yes      | -       | Protocol/technology of the endpoint                                        |
| `port`        | int32                                   | Yes      | -       | Port number exposed by the endpoint (1-65535)                             |
| `targetPort`  | int32                                   | No       | `port`  | Target port on the container (1-65535), defaults to `port` if not set     |
| `visibility`  | [][EndpointVisibility](#endpointvisibility) | No  | []      | Additional visibility scopes beyond the implicit `project` visibility     |
| `displayName` | string                                  | No       | -       | Human-readable name for the endpoint                                       |
| `basePath`    | string                                  | No       | -       | Base path of the API exposed via the endpoint                             |
| `schema`      | [Schema](#schema)                       | No       | -       | Optional API schema definition for the endpoint                            |

**Visibility Behavior:**
- Every endpoint automatically gets `project` visibility (accessible within the same project and environment)
- The `visibility` array adds **additional** scopes beyond the implicit project access
- Multiple visibility levels can be specified to create routes on different gateways

### EndpointVisibility

| Value       | Description                                                                          |
|-------------|--------------------------------------------------------------------------------------|
| `project`   | Accessible only within the same project and environment (implicit for all endpoints) |
| `namespace` | Accessible across all projects in the same namespace and environment                 |
| `internal`  | Accessible across all namespaces in the deployment (intranet)                       |
| `external`  | Accessible from outside the deployment, including public internet                    |

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

| Field     | Type   | Required | Default | Description                                    |
|-----------|--------|----------|---------|------------------------------------------------|
| `type`    | string | No       | ""      | Schema type (e.g., "openapi", "graphql", etc.) |
| `content` | string | No       | ""      | Schema content (API definition)                |

### WorkloadDependencies

| Field       | Type                                          | Required | Default | Description                                  |
|-------------|-----------------------------------------------|----------|---------|----------------------------------------------|
| `endpoints` | [[WorkloadConnection](#workloadconnection)]   | No       | []      | List of endpoint connections to depend on     |

### WorkloadConnection

| Field         | Type                                              | Required | Default | Description                                                        |
|---------------|---------------------------------------------------|----------|---------|--------------------------------------------------------------------|
| `project`     | string                                            | No       | -       | Name of the project that owns the target component                 |
| `component`   | string                                            | Yes      | -       | Name of the target component                                       |
| `name`        | string                                            | Yes      | -       | Name of the endpoint on the target component                       |
| `visibility`  | [EndpointVisibility](#endpointvisibility)         | Yes      | -       | Visibility scope of the target endpoint                            |
| `envBindings` | [ConnectionEnvBindings](#connectionenvbindings)   | Yes      | -       | Environment variable bindings for connection details               |

### ConnectionEnvBindings

| Field      | Type   | Required | Default | Description                                                      |
|------------|--------|----------|---------|------------------------------------------------------------------|
| `address`  | string | No       | -       | Environment variable name for the full address (host:port/path)  |
| `host`     | string | No       | -       | Environment variable name for the host                           |
| `port`     | string | No       | -       | Environment variable name for the port                           |
| `basePath` | string | No       | -       | Environment variable name for the base path                      |

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
      visibility: ["external"]
      basePath: "/api/v1"
      displayName: "Customer REST API"
    metrics:
      type: HTTP
      port: 9090
      targetPort: 9090
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
        secretKeyRef:
          name: git-secrets
          key: pat
    files:
      - key: ssl.pem
        mountPath: /tmp
        secretKeyRef:
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
      visibility: ["external"]
      basePath: "/api"
```

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
      visibility: ["external"]
      basePath: "/orders"
      displayName: "Order Management API"
      schema:
        content: |
          openapi: 3.0.0
          info:
            title: Order API
            version: 1.0.0
  dependencies:
    endpoints:
      - component: postgres-db
        name: api
        visibility: project
        envBindings:
          address: DATABASE_URL
          host: DB_HOST
          port: DB_PORT
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
