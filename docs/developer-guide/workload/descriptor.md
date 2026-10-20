---
title: Workload Descriptor
description: Define endpoints, configuration and dependencies for a source build with a workload.yaml file
---

# Workload Descriptor

When a CI workflow builds your code, it produces a [Workload](./overview.md) CR that OpenChoreo deploys. By default, the build creates a minimal Workload with just the container image. To define endpoints, environment variables, dependencies, and configuration files, add a workload descriptor to your source repository. The workload descriptor is a YAML file as defined below.

:::info The descriptor is not the Workload CR
The workload descriptor is a YAML file. The workload CR is produced from it
:::

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
  resources:
    - ref: reading-list-postgres
      envBindings:
        host: PG_HOST
        port: PG_PORT
        username: PG_USER
        password: PG_PASSWORD
        database: PG_DATABASE
```

### Fields

#### `metadata`

| Field  | Required | Description                        |
| ------ | -------- | ---------------------------------- |
| `name` | Yes      | Name for the generated Workload CR |

#### `endpoints`

Define the network endpoints your service exposes. For what each visibility level means, see [Endpoint Visibility](./overview.md#endpoint-visibility).

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

`valueFrom.path` is read at build time and inlined into the generated CR. It is available for files only, not for environment variables.

#### `dependencies`

Declare what your component consumes from the rest of the platform. Both kinds of dependency carry over to the generated Workload CR unchanged, so the full field reference is the same as for a hand-written Workload: [Endpoint Dependencies](../dependencies/endpoints.md) and [Resource Dependencies](../dependencies/resources.md).

##### `dependencies.endpoints`

Endpoints exposed by other components.

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

##### `dependencies.resources`

Outputs of a project-bound [Resource](../dependencies/resources.md), such as a database, queue or cache.

| Field          | Required | Description                                                              |
| -------------- | -------- | ------------------------------------------------------------------------ |
| `ref`          | Yes      | Name of the target Resource, in the same project as your component       |
| `envBindings`  | No       | Maps a ResourceType output name to a container environment variable name |
| `fileBindings` | No       | Maps a ResourceType output name to a container mount path                |

At least one of `envBindings` or `fileBindings` is required.

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

- [Workload](./overview.md) — The Workload CR: container, endpoints, dependencies
- [Endpoint Dependencies](../dependencies/endpoints.md) — How to declare service dependencies
- [Resource Dependencies](../dependencies/resources.md) — How to consume managed infrastructure
- [CI Overview](../workflows/ci/overview.md) — How CI workflows work
- [Workload API Reference](../../reference/api/application/workload.md) — Complete Workload CRD specification
