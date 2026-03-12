---
title: Overview
description: Learn how to define Workloads in OpenChoreo to configure container runtime, endpoints, and dependencies
---

# Workload

A **Workload** defines the runtime specification for a [Component](../../reference/api/application/component.md) in OpenChoreo. It describes what container image to run, what network endpoints to expose, and what dependencies the component has on other components. The platform uses this specification to generate the appropriate Kubernetes resources, including Deployments, Services, HTTPRoutes, and NetworkPolicies.

Each component has exactly one Workload that is linked to it through the `owner` field. Workloads can be created manually for pre-built images or generated automatically by build workflows.

## Structure

A Workload spec has the following top-level fields:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workload
metadata:
  name: my-service-workload
  namespace: default
spec:
  owner:
    projectName: my-project
    componentName: my-service
  container:
    # Container specification
  endpoints:
    # Network endpoints
  dependencies:
    # Dependencies on other components
```

## Owner

The `owner` field links the Workload to its Component and Project. This field is **immutable** after creation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `projectName` | string | Yes | Name of the project that owns this workload |
| `componentName` | string | Yes | Name of the component that owns this workload |

## Container

The `container` field defines what to run. Only the `image` field is required.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | string | Yes | OCI image to run (digest or tag) |
| `command` | []string | No | Container entrypoint |
| `args` | []string | No | Arguments for the entrypoint |
| `env` | []EnvVar | No | Environment variables |
| `files` | []File | No | File configurations and secrets |

### Environment Variables

Environment variables can be set as literal values or referenced from secrets:

```yaml
container:
  image: myregistry/my-service:v1.0.0
  env:
    - key: LOG_LEVEL
      value: info
    - key: DB_PASSWORD
      valueFrom:
        secretRef:
          name: db-secrets
          key: password
```

Each `env` entry must have exactly one of `value` or `valueFrom` set.

### Files

Files can be mounted into the container from literal content or secrets:

```yaml
container:
  image: myregistry/my-service:v1.0.0
  files:
    - key: config.yaml
      mountPath: /etc/config
      value: |
        server:
          port: 8080
    - key: tls.crt
      mountPath: /etc/tls
      valueFrom:
        secretRef:
          name: tls-certs
          key: certificate
```

Each `file` entry requires `key` and `mountPath`, and must have exactly one of `value` or `valueFrom` set.

## Endpoints

Endpoints define the network interfaces that the component exposes. They are specified as a map where each key is the endpoint name:

```yaml
endpoints:
  http:
    type: HTTP
    port: 8080
    visibility:
      - external
    basePath: /api/v1
  grpc:
    type: gRPC
    port: 9090
    visibility:
      - namespace
```

### Endpoint Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Protocol type: `HTTP`, `REST`, `gRPC`, `GraphQL`, `Websocket`, `TCP`, `UDP` |
| `port` | int32 | Yes | Port number exposed by the endpoint (1-65535) |
| `targetPort` | int32 | No | Container port to forward to (defaults to `port`) |
| `visibility` | []string | No | Additional visibility scopes beyond the implicit `project` visibility |
| `basePath` | string | No | Base path of the API exposed via the endpoint |
| `displayName` | string | No | Human-readable name for the endpoint |
| `schema` | object | No | API schema definition (e.g., OpenAPI spec) |

### Endpoint Visibility

Every endpoint automatically gets **project** visibility, meaning it is accessible to other components within the same project and environment. The `visibility` array adds additional scopes:

| Visibility | Description |
|------------|-------------|
| `project` | Accessible within the same project and environment (implicit for all endpoints) |
| `namespace` | Accessible across all projects in the same namespace and environment |
| `internal` | Accessible across all namespaces in the deployment |
| `external` | Accessible from outside the deployment, including public internet |

Visibility levels control both routing (HTTPRoutes) and network access (NetworkPolicies). For example, an endpoint with `external` visibility gets an HTTPRoute on the external gateway and a NetworkPolicy allowing ingress from non-OpenChoreo namespaces, while `namespace` visibility allows cross-project traffic within the same namespace.

## Example

Here is a complete Workload example for a REST service with an external endpoint:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workload
metadata:
  name: greeter-service-workload
  namespace: default
spec:
  owner:
    projectName: default
    componentName: greeter-service
  container:
    image: ghcr.io/openchoreo/samples/greeter-service:latest
    args:
      - --port
      - "9090"
  endpoints:
    http:
      type: HTTP
      port: 9090
      visibility:
        - external
```

## Related Resources

- [Workload API Reference](../../reference/api/application/workload.md) - Full CRD specification
- [Component](../../reference/api/application/component.md) - Components that own workloads
- [Dependencies](../dependencies/endpoints.md) - How to define dependencies between components
