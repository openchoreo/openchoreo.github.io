---
title: Workload Descriptor
description: Customize what your CI build produces with a workload.yaml file
---

# Workload Descriptor

When a CI workflow builds your code, it produces a [Workload](../../workload/overview.md) CR that OpenChoreo deploys. By default, the build creates a minimal Workload with just the container image. To define endpoints, environment variables, dependencies, and configuration files, add a `workload.yaml` descriptor to your source repository.

## With vs Without a Descriptor

|                           | Without `workload.yaml`                   | With `workload.yaml`                                              |
| ------------------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| **Container image**       | Set from build output                     | Set from build output                                             |
| **Endpoints**             | None                                      | Defined in descriptor                                             |
| **Environment variables** | None                                      | Defined in descriptor                                             |
| **Configuration files**   | None                                      | Defined in descriptor                                             |
| **Dependencies**          | None                                      | Defined in descriptor                                             |
| **Use case**              | Simple services with no exposed endpoints | Services with HTTP/gRPC/WebSocket endpoints, custom configuration |

## Descriptor Format

Place a `workload.yaml` file in your application directory (the path specified by `repository.appPath` in your Component's workflow parameters):

```yaml
# workload.yaml
apiVersion: openchoreo.dev/v1alpha1

metadata:
  name: reading-list-service

endpoints:
  - name: reading-list-api
    visibility:
      - external
    port: 8080
    type: HTTP
    basePath: /api
    schemaFile: docs/openapi.yaml

configurations:
  env:
    - name: LOG_LEVEL
      value: info
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: password
  files:
    - name: app.json
      mountPath: /etc/config
      value: |
        {"feature_flags": {"new_feature": true}}
    - name: tls.conf
      mountPath: /etc/app
      valueFrom:
        path: configs/tls.conf

dependencies:
  endpoints:
    - component: postgres-db
      name: api
      visibility: project
      envBindings:
        host: DB_HOST
        port: DB_PORT
```

### Fields

#### `metadata`

| Field  | Required | Description                        |
| ------ | -------- | ---------------------------------- |
| `name` | Yes      | Name for the generated Workload CR |

#### `endpoints`

Define the network endpoints your service exposes:

| Field         | Required | Description                                                                                |
| ------------- | -------- | ------------------------------------------------------------------------------------------ |
| `name`        | Yes      | Unique name for the endpoint                                                               |
| `port`        | Yes      | Port your application listens on                                                           |
| `type`        | Yes      | `HTTP`, `gRPC`, `GraphQL`, `Websocket`, `TCP`, or `UDP`                                    |
| `visibility`  | No       | List of visibility levels: `project`, `namespace`, `internal`, `external`                  |
| `targetPort`  | No       | Container port to forward to (defaults to `port`)                                          |
| `basePath`    | No       | Base path prefix for the endpoint                                                          |
| `displayName` | No       | Human-readable name for the endpoint                                                       |
| `schemaFile`  | No       | Path to schema file (OpenAPI, Protobuf, GraphQL), relative to the `workload.yaml` location |

#### `configurations`

##### `configurations.env`

Environment variables injected into the container. Set either `value` or `valueFrom`, not both.

| Field       | Required | Description                                                       |
| ----------- | -------- | ----------------------------------------------------------------- |
| `name`      | Yes      | Environment variable name                                         |
| `value`     | No       | Literal value (mutually exclusive with `valueFrom`)               |
| `valueFrom` | No       | Reference to an external source (mutually exclusive with `value`) |

`valueFrom` supports:

| Field                         | Description                   |
| ----------------------------- | ----------------------------- |
| `valueFrom.secretKeyRef.name` | Name of the Kubernetes Secret |
| `valueFrom.secretKeyRef.key`  | Key within the Secret         |

##### `configurations.files`

Configuration files mounted into the container. Set exactly one of `value` or `valueFrom`.

| Field       | Required | Description                                                       |
| ----------- | -------- | ----------------------------------------------------------------- |
| `name`      | Yes      | File name (used as the file name within `mountPath`)              |
| `mountPath` | Yes      | Absolute directory path where the file is mounted                 |
| `value`     | No       | Inline file content (mutually exclusive with `valueFrom`)         |
| `valueFrom` | No       | Reference to an external source (mutually exclusive with `value`) |

`valueFrom` supports `path` or `secretKeyRef` (not both):

| Field                         | Description                                                             |
| ----------------------------- | ----------------------------------------------------------------------- |
| `valueFrom.path`              | Path to a local file, resolved relative to the `workload.yaml` location |
| `valueFrom.secretKeyRef.name` | Name of the Kubernetes Secret                                           |
| `valueFrom.secretKeyRef.key`  | Key within the Secret                                                   |

#### `dependencies`

Declare dependencies on other components' endpoints. See [Endpoint Dependencies](../../dependencies/endpoints.md) for details.

##### `dependencies.endpoints`

| Field         | Required | Description                                                      |
| ------------- | -------- | ---------------------------------------------------------------- |
| `component`   | Yes      | Name of the target component                                     |
| `name`        | Yes      | Name of the endpoint on the target component                     |
| `visibility`  | Yes      | Visibility scope (`project` or `namespace`)                      |
| `project`     | No       | Target component's project (defaults to same project)            |
| `envBindings` | Yes      | Maps connection address components to environment variable names |

`envBindings` fields:

| Field      | Required | Description                                        |
| ---------- | -------- | -------------------------------------------------- |
| `address`  | No       | Env var name for the full address (host:port/path) |
| `host`     | No       | Env var name for the host                          |
| `port`     | No       | Env var name for the port                          |
| `basePath` | No       | Env var name for the base path                     |

## File Placement

The CI workflow looks for `workload.yaml` at the root of your `appPath`. For example, if your Component specifies `appPath: "/service-go-greeter"`, place the descriptor at:

```
your-repo/
  service-go-greeter/
    workload.yaml        ← descriptor file
    Dockerfile
    main.go
    openapi.yaml         ← referenced by schemaFile
    configs/
      tls.conf           ← referenced by valueFrom.path
```

## See Also

- [Workload](../../workload/overview.md) — Full Workload CR specification (container, endpoints, dependencies)
- [Endpoint Dependencies](../../dependencies/endpoints.md) — How to declare service dependencies
- [CI Overview](./overview.md) — How CI workflows work
- [Workload API Reference](../../../reference/api/application/workload.md) — Complete Workload CRD specification
