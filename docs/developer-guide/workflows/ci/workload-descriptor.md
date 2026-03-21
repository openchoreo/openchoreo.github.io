---
title: Workload Descriptor
description: Customize what your CI build produces with a workload.yaml file

---

# Workload Descriptor

When a CI workflow builds your code, it produces a [Workload](../../workload/overview.md) CR that OpenChoreo deploys. By default, the build creates a minimal Workload with just the container image. To define endpoints, environment variables, and configuration files, add a `workload.yaml` descriptor to your source repository.

## With vs Without a Descriptor

|                           | Without `workload.yaml`                   | With `workload.yaml`                                              |
| ------------------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| **Container image**       | Set from build output                     | Set from build output                                             |
| **Endpoints**             | None                                      | Defined in descriptor                                             |
| **Environment variables** | None                                      | Defined in descriptor                                             |
| **Configuration files**   | None                                      | Defined in descriptor                                             |
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
    schemaFile: docs/openapi.yaml

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

### Fields

#### `metadata`

| Field  | Required | Description                        |
| ------ | -------- | ---------------------------------- |
| `name` | Yes      | Name for the generated Workload CR |

#### `endpoints`

Define the network endpoints your service exposes:

| Field        | Required | Description                                                                                |
| ------------ | -------- | ------------------------------------------------------------------------------------------ |
| `name`       | Yes      | Unique name for the endpoint                                                               |
| `port`       | Yes      | Port your application listens on                                                           |
| `type`       | Yes      | `HTTP`, `gRPC`, `GraphQL`, `Websocket`, `TCP`, or `UDP`                                    |
| `visibility` | No       | List of visibility levels: `project`, `namespace`, `internal`, `external`                  |
| `schemaFile` | No       | Path to schema file (OpenAPI, Protobuf, GraphQL), relative to the `workload.yaml` location |

#### `configurations`

##### `configurations.env`

Environment variables injected into the container:

| Field   | Required | Description                |
| ------- | -------- | -------------------------- |
| `name`  | Yes      | Environment variable name  |
| `value` | Yes      | Environment variable value |

##### `configurations.files`

Configuration files mounted into the container:

| Field       | Required | Description                             |
| ----------- | -------- | --------------------------------------- |
| `name`      | Yes      | Unique name for the file mount          |
| `mountPath` | Yes      | Absolute path where the file is mounted |
| `value`     | Yes      | File content (inline)                   |

## File Placement

The CI workflow looks for `workload.yaml` at the root of your `appPath`. For example, if your Component specifies `appPath: "/service-go-greeter"`, place the descriptor at:

```
your-repo/
  service-go-greeter/
    workload.yaml        ← descriptor file
    Dockerfile
    main.go
    openapi.yaml         ← referenced by schemaFile
```

## See Also

- [Workload](../../workload/overview.md) — Full Workload CR specification (container, endpoints, dependencies)
- [CI Overview](./overview.md) — How CI workflows work
- [Workload API Reference](../../../reference/api/application/workload.md) — Complete Workload CRD specification
