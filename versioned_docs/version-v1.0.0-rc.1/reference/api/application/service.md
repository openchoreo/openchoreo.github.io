---
title: Service API Reference (Deprecated)
---

# Service

:::warning Deprecated
Service is deprecated as of OpenChoreo v0.4.0 and will be removed in a future version.
Use [Component](component.md) with [ComponentType](../platform/componenttype.md) and [ComponentDeployment](componentdeployment.md) instead for a more flexible deployment model.
:::

A Service represents a long-running service component in OpenChoreo. It defines the deployment configuration for
service-type components by referencing a Workload and optionally a ServiceClass for platform-defined policies.
Services can expose APIs with different access levels and integrate with OpenChoreo's API management capabilities.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

Services are namespace-scoped resources and belong to a Component through the owner field.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Service
metadata:
  name: <service-name>
  namespace: <namespace>  # Namespace for grouping services
```

### Spec Fields

| Field          | Type                                    | Required | Default   | Description                                                                       |
|----------------|-----------------------------------------|----------|-----------|-----------------------------------------------------------------------------------|
| `owner`        | [ServiceOwner](#serviceowner)          | Yes      | -         | Ownership information linking the service to a project and component              |
| `workloadName` | string                                  | Yes      | -         | Name of the workload that this service references                                 |
| `className`    | string                                  | No       | "default" | Name of the ServiceClass that provides deployment configuration                   |
| `apis`         | map[string][ServiceAPI](#serviceapi)   | No       | {}        | API configuration for endpoints. Keys must match endpoint keys in the workload    |

### ServiceOwner

| Field           | Type   | Required | Default | Description                                            |
|-----------------|--------|----------|---------|--------------------------------------------------------|
| `projectName`   | string | Yes      | -       | Name of the project that owns this service (min: 1)    |
| `componentName` | string | Yes      | -       | Name of the component that owns this service (min: 1)  |

### ServiceAPI

| Field         | Type                                | Required | Default   | Description                                            |
|---------------|-------------------------------------|----------|-----------|--------------------------------------------------------|
| `className`   | string                              | No       | "default" | API class name for management policies                 |
| `type`        | [EndpointType](#endpointtype)      | Yes      | -         | Type of the API endpoint                               |
| `rest`        | [RESTEndpoint](#restendpoint)      | No       | -         | REST-specific endpoint configuration                   |

### EndpointType

| Value       | Description                                    |
|-------------|------------------------------------------------|
| `HTTP`      | Standard HTTP endpoint                        |
| `REST`      | RESTful API endpoint                          |
| `gRPC`      | gRPC service endpoint                         |
| `GraphQL`   | GraphQL API endpoint                          |
| `Websocket` | WebSocket endpoint                            |
| `TCP`       | Raw TCP endpoint                              |
| `UDP`       | UDP endpoint                                  |

### RESTEndpoint

| Field          | Type                                                        | Required | Default | Description                                    |
|----------------|-------------------------------------------------------------|----------|---------|------------------------------------------------|
| `backend`      | [HTTPBackend](#httpbackend)                                | No       | -       | Backend configuration for the REST endpoint    |
| `exposeLevels` | [[RESTOperationExposeLevel](#restoperationexposelevel)]    | No       | []      | Access levels for the REST API                 |

### HTTPBackend

| Field      | Type   | Required | Default | Description                                            |
|------------|--------|----------|---------|--------------------------------------------------------|
| `port`     | int32  | Yes      | -       | Port number where the backend service is listening     |
| `basePath` | string | No       | ""      | Base path for the API (e.g., "/api/v1")               |

### RESTOperationExposeLevel

| Value          | Description                                                      |
|----------------|------------------------------------------------------------------|
| `Project`      | API accessible only within the same project                      |
| `Organization` | API accessible within the organization                           |
| `Public`       | API publicly accessible (subject to authentication/authorization) |

## Examples

### Basic Service

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Service
metadata:
  name: customer-service
  namespace: default
spec:
  owner:
    projectName: my-project
    componentName: customer-service
  workloadName: customer-service-workload
  className: default
```

### Service with API Configuration

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Service
metadata:
  name: order-service
  namespace: default
spec:
  owner:
    projectName: my-project
    componentName: order-service
  workloadName: order-service-workload  # References workload with endpoint "order-api"
  className: production-service
  apis:
    order-api:  # Must match endpoint key "order-api" in the workload
      className: default
      type: REST
      rest:
        backend:
          port: 8080
          basePath: /api/v1
        exposeLevels:
          - Organization
          - Public
```

## Annotations

Services support the following annotations:

| Annotation                    | Description                         |
|-------------------------------|-------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display  |
| `openchoreo.dev/description`  | Detailed description of the service |

## Related Resources

- [Component](./component.md) - Components that own services
- [Workload](./workload.md) - Workloads referenced by services
- [ServiceClass](../platform/serviceclass.md) - Platform-defined service templates
