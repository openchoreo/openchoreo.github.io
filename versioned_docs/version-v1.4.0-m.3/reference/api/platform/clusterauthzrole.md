---
title: ClusterAuthzRole API Reference
description: Cluster-scoped authorization role available across all namespaces
---

# ClusterAuthzRole

A ClusterAuthzRole defines a cluster-scoped authorization role containing a set of permitted actions. Cluster roles are available across all namespaces and can be referenced by both `ClusterAuthzRoleBinding` and `AuthzRoleBinding` resources.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ClusterAuthzRoles are cluster-scoped resources.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterAuthzRole
metadata:
  name: <role-name>
```

### Spec Fields

| Field         | Type     | Required | Default | Description                                                                                |
| ------------- | -------- | -------- | ------- | ------------------------------------------------------------------------------------------ |
| `actions`     | []string | Yes      | -       | List of actions this role permits. Supports wildcards (`*`, `component:*`). Minimum 1 item |
| `description` | string   | No       | ""      | Human-readable description of the role's purpose                                           |

### Actions Format

Actions follow the `resource:verb` format. Supported patterns:

| Pattern          | Meaning                         |
| ---------------- | ------------------------------- |
| `component:view` | A specific action               |
| `component:*`    | All actions for a resource type |
| `*`              | All actions on all resources    |

## Examples

### Platform Admin (Full Access)

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterAuthzRole
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
kind: ClusterAuthzRole
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
- [ClusterAuthzRoleBinding](./clusterauthzrolebinding.md) - Bind subjects to cluster roles with optional per-mapping scope
- [AuthzRoleBinding](./authzrolebinding.md) - Bind subjects to roles within a namespace
