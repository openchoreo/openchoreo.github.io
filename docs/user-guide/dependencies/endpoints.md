---
title: Endpoint Dependencies
description: Learn how to define dependencies between components by consuming endpoints from other components
---

# Endpoint Dependencies

Components in OpenChoreo can consume endpoints exposed by other components by declaring **endpoint dependencies** in their Workload. When a dependency is declared, the platform automatically:

- Resolves the target component's endpoint address
- Injects connection details as environment variables into the consuming component's container
- Configures network policies to allow traffic between the components

## Defining a Dependency

Dependencies are defined in the `spec.dependencies.endpoints` array of a Workload. Each entry specifies which component endpoint to consume and how to inject the connection details:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Workload
metadata:
  name: frontend-workload
  namespace: default
spec:
  owner:
    projectName: my-project
    componentName: frontend
  container:
    image: myregistry/frontend:v1.0.0
  endpoints:
    http:
      type: HTTP
      port: 3000
      visibility:
        - external
  dependencies:
    endpoints:
      - component: backend-api
        name: http
        visibility: project
        envBindings:
          address: BACKEND_API_URL
```

In this example, the `frontend` component declares a dependency on the `backend-api` component's `http` endpoint. The platform resolves the endpoint address and injects it as the `BACKEND_API_URL` environment variable.

## Dependency Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `component` | string | Yes | Name of the target component |
| `name` | string | Yes | Name of the target endpoint on the component |
| `visibility` | string | Yes | Visibility level at which to consume the endpoint (`project` or `namespace`) |
| `project` | string | No | Target component's project name. Defaults to the same project as the consumer |
| `envBindings` | object | Yes | Maps connection details to environment variable names |

### Environment Bindings

The `envBindings` field controls which connection details are injected as environment variables:

| Field | Type | Description |
|-------|------|-------------|
| `address` | string | Env var name for the full connection string. For HTTP/HTTPS/WS/WSS: `scheme://host:port/basePath`. For gRPC/TCP/UDP: `host:port` |
| `host` | string | Env var name for just the hostname |
| `port` | string | Env var name for just the port number |
| `basePath` | string | Env var name for just the base path |

You can specify any combination of these bindings. At minimum, `address` is the most commonly used.

## Visibility

The `visibility` field determines at which network scope the dependency is consumed. Only `project` and `namespace` are supported for dependencies:

| Visibility | When to Use |
|------------|-------------|
| `project` | The target component is in the **same project**. Traffic stays within the project's data plane namespace. |
| `namespace` | The target component is in a **different project** but the same namespace. Requires the target endpoint to have `namespace` (or broader) visibility declared. |

:::note
The target endpoint must have a visibility level that is equal to or broader than the dependency's visibility. For example, if you consume an endpoint at `namespace` visibility, the target endpoint must include `namespace` (or `internal` or `external`) in its visibility array.
:::

## Same-Project Dependencies

When both components are in the same project, use `project` visibility. The `project` field can be omitted since it defaults to the consumer's project:

```yaml
dependencies:
  endpoints:
    - component: user-service
      name: http
      visibility: project
      envBindings:
        address: USER_SERVICE_URL
```

## Cross-Project Dependencies

When the target component is in a different project, you must specify the `project` field and use `namespace` visibility:

```yaml
dependencies:
  endpoints:
    - component: shared-auth-service
      name: http
      visibility: namespace
      project: platform-services
      envBindings:
        address: AUTH_SERVICE_URL
        host: AUTH_SERVICE_HOST
        port: AUTH_SERVICE_PORT
```

For cross-project dependencies to work, the target component's endpoint must have `namespace` (or broader) visibility declared in its Workload:

```yaml
# Target component's Workload (in the platform-services project)
spec:
  endpoints:
    http:
      type: HTTP
      port: 8080
      visibility:
        - namespace  # Required for cross-project access
```

If a cross-project dependency is failing with a connection refused error, verify that the target endpoint has the appropriate visibility level configured.

## Multiple Dependencies

A single Workload can declare up to 50 endpoint dependencies:

```yaml
dependencies:
  endpoints:
    - component: user-service
      name: http
      visibility: project
      envBindings:
        address: USER_SERVICE_URL
    - component: notification-service
      name: grpc
      visibility: project
      envBindings:
        address: NOTIFICATION_SERVICE_ADDR
    - component: analytics-api
      name: http
      visibility: namespace
      project: analytics
      envBindings:
        address: ANALYTICS_API_URL
        basePath: ANALYTICS_API_BASE_PATH
```

## Complete Example

Here is a full example with a `greeter-service` that depends on both a same-project component and a cross-project component:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: greeter-service
  namespace: default
spec:
  autoDeploy: true
  componentType:
    kind: ClusterComponentType
    name: deployment/service
  owner:
    projectName: default
---
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
  dependencies:
    endpoints:
      - component: hello-world-service
        name: http
        visibility: project
        envBindings:
          address: HELLO_WORLD_SERVICE_URL
      - component: bar-service
        name: http
        visibility: namespace
        project: test-project
        envBindings:
          address: BAR_SERVICE_URL
```

After deployment, you can verify the injected environment variables by exec-ing into the pod:

```bash
kubectl exec -n <data-plane-namespace> <pod-name> -- env | grep -E 'HELLO_WORLD|BAR_SERVICE'
```

You should see the resolved addresses:

```text
HELLO_WORLD_SERVICE_URL=http://hello-world-service.<namespace>.svc.cluster.local:9090
BAR_SERVICE_URL=http://bar-service.<namespace>.svc.cluster.local:9090
```

## Related Resources

- [Workload](../workload/overview.md) - How to define Workloads
- [Workload API Reference](../../reference/api/application/workload.md) - Full CRD specification
- [Component](../../reference/api/application/component.md) - Components that own workloads
