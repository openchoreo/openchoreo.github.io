---
title: Organization API Reference
---

# Organization

An Organization is the top-level grouping mechanism in OpenChoreo. It represents a logical boundary for users and
resources, typically aligned to a company, business unit, or team. Organizations provide namespace isolation and serve
as the container for all projects and platform resources.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

Organizations are cluster-scoped resources, meaning they exist at the cluster level rather than within a namespace.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Organization
metadata:
  name: <organization-name>
```

### Spec Fields

The Organization spec is currently empty. Organizations are provisioned based on their metadata alone.

| Field | Type | Required | Default | Description            |
|-------|------|----------|---------|------------------------|
| -     | -    | -        | -       | No spec fields defined |

### Status Fields

| Field                | Type        | Default | Description                                                    |
|----------------------|-------------|---------|----------------------------------------------------------------|
| `observedGeneration` | integer     | 0       | The generation observed by the controller                      |
| `namespace`          | string      | ""      | The namespace provisioned for this organization                |
| `conditions`         | []Condition | []      | Standard Kubernetes conditions tracking the organization state |

#### Condition Types

Common condition types for Organization resources:

- `Ready` - Indicates if the organization is fully provisioned and ready
- `NamespaceProvisioned` - Indicates if the organization namespace has been created

## Examples

### Basic Organization

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Organization
metadata:
  name: default-organization
  annotations:
    openchoreo.dev/display-name: Default Organization
    openchoreo.dev/description: This is the default organization for this setup
spec: { }
```

## Annotations

Organizations support the following annotations:

| Annotation                    | Description                              |
|-------------------------------|------------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display       |
| `openchoreo.dev/description`  | Detailed description of the organization |

## Related Resources

- [Project](/docs/reference/api/application/project/) - Cloud-native applications within an organization
- [DataPlane](/docs/reference/api/platform/dataplane/) - Kubernetes clusters managed by the organization
- [Environment](/docs/reference/api/platform/environment/) - Runtime environments for the organization
