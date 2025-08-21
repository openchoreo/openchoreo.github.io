---
title: WebApplication API Reference
---

# WebApplication

A WebApplication represents a web application component in OpenChoreo. It defines the deployment configuration for
web application-type components by referencing a Workload and optionally a WebApplicationClass for platform-defined
policies. WebApplications are typically frontend applications or web services that serve HTTP content.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

WebApplications are namespace-scoped resources that must be created within an Organization's namespace and belong to a
Component through the owner field.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WebApplication
metadata:
  name: <webapplication-name>
  namespace: <org-namespace>  # Organization namespace
```

### Spec Fields

| Field          | Type                                              | Required | Default   | Description                                                                    |
|----------------|---------------------------------------------------|----------|-----------|--------------------------------------------------------------------------------|
| `owner`        | [WebApplicationOwner](#webapplicationowner)      | Yes      | -         | Ownership information linking the web application to a project and component   |
| `workloadName` | string                                            | Yes      | -         | Name of the workload that this web application references                      |
| `className`    | string                                            | No       | "default" | Name of the WebApplicationClass that provides deployment configuration         |

### WebApplicationOwner

| Field           | Type   | Required | Default | Description                                                     |
|-----------------|--------|----------|---------|----------------------------------------------------------------|
| `projectName`   | string | Yes      | -       | Name of the project that owns this web application (min: 1)    |
| `componentName` | string | Yes      | -       | Name of the component that owns this web application (min: 1)  |

## Examples

### Basic WebApplication

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WebApplication
metadata:
  name: frontend-app
  namespace: default
spec:
  owner:
    projectName: my-project
    componentName: frontend
  workloadName: frontend-workload
  className: default
```

### WebApplication with Custom Class

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: WebApplication
metadata:
  name: admin-dashboard
  namespace: default
spec:
  owner:
    projectName: my-project
    componentName: admin-ui
  workloadName: admin-ui-workload
  className: production-webapp
```

## Annotations

WebApplications support the following annotations:

| Annotation                    | Description                               |
|-------------------------------|-------------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display        |
| `openchoreo.dev/description`  | Detailed description of the web application |

## Related Resources

- [Component](/docs/reference/api/application/component/) - Components that own web applications
- [Workload](/docs/reference/api/application/workload/) - Workloads referenced by web applications
- [WebApplicationClass](/docs/reference/api/platform/webapplicationclass/) - Platform-defined web application templates
- [WebApplicationBinding](/docs/reference/api/runtime/webapplicationbinding/) - Environment-specific web application instances