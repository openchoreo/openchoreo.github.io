---
title: AuthzClusterRole API Reference
---

# AuthzClusterRole

An AuthzClusterRole defines a cluster-scoped authorization role containing a set of permitted actions. Cluster roles are available across all namespaces and can be referenced by both `AuthzClusterRoleBinding` and `AuthzRoleBinding` resources.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

AuthzClusterRoles are cluster-scoped resources.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: AuthzClusterRole
metadata:
  name: <role-name>
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

### Platform Admin (Full Access)

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: AuthzClusterRole
metadata:
  name: platform-admin
spec:
  actions:
    - "*"
  description: "Platform administrator with full access to all resources"
```

### Read-Only Viewer

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: AuthzClusterRole
metadata:
  name: viewer
spec:
  actions:
    - "namespace:view"
    - "project:view"
    - "component:view"
    - "environment:view"
    - "workflow:view"
    - "dataplane:view"
  description: "Read-only access to core resources"
```

## Related Resources

- [AuthzRole](./authzrole.md) - Namespace-scoped role
- [AuthzClusterRoleBinding](./authzclusterrolebinding.md) - Bind subjects to cluster roles cluster-wide
- [AuthzRoleBinding](./authzrolebinding.md) - Bind subjects to roles within a namespace
