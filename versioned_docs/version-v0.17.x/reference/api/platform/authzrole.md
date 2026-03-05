---
title: AuthzRole API Reference
---

# AuthzRole

An AuthzRole defines a namespace-scoped authorization role containing a set of permitted actions. Namespace roles are scoped to a single namespace and can only be referenced by `AuthzRoleBinding` resources within the same namespace.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

AuthzRoles are namespace-scoped resources.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: AuthzRole
metadata:
  name: <role-name>
  namespace: <namespace>
```

### Spec Fields

| Field         | Type     | Required | Default | Description                                                                 |
|---------------|----------|----------|---------|-----------------------------------------------------------------------------|
| `actions`     | []string | Yes      | -       | List of actions this role permits. Supports wildcards (`*`, `component:*`). Minimum 1 item |
| `description` | string   | No       | ""      | Human-readable description of the role's purpose                            |

### Actions Format

Actions follow the `resource:verb` format. Supported patterns:

| Pattern         | Meaning                          |
|-----------------|----------------------------------|
| `component:view` | A specific action                |
| `component:*`   | All actions for a resource type  |
| `*`             | All actions on all resources     |

## Examples

### Developer Role

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: AuthzRole
metadata:
  name: developer
  namespace: acme
spec:
  actions:
    - "component:*"
    - "project:view"
    - "workflow:view"
    - "workload:view"
    - "workload:create"
  description: "Developer access for the acme namespace"
```

### Namespace Viewer

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: AuthzRole
metadata:
  name: namespace-viewer
  namespace: acme
spec:
  actions:
    - "namespace:view"
    - "project:view"
    - "component:view"
  description: "Read-only access within the acme namespace"
```

## Related Resources

- [AuthzClusterRole](./authzclusterrole.md) - Cluster-scoped role
- [AuthzRoleBinding](./authzrolebinding.md) - Bind subjects to roles within a namespace
- [AuthzClusterRoleBinding](./authzclusterrolebinding.md) - Bind subjects to cluster roles cluster-wide
