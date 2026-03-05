---
title: AuthzClusterRoleBinding API Reference
---

# AuthzClusterRoleBinding

An AuthzClusterRoleBinding connects a subject (identified by a JWT claim-value pair) to an `AuthzClusterRole`, granting or denying the role's permissions across all resources in the cluster.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

AuthzClusterRoleBindings are cluster-scoped resources.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: AuthzClusterRoleBinding
metadata:
  name: <binding-name>
```

### Spec Fields

| Field                  | Type                                  | Required | Default | Description                                        |
|------------------------|---------------------------------------|----------|---------|----------------------------------------------------|
| `entitlement`          | [EntitlementClaim](#entitlementclaim) | Yes      | -       | Subject identification from JWT claims              |
| `roleRef`              | [RoleRef](#roleref)                   | Yes      | -       | Reference to the cluster role to bind               |
| `effect`               | string                                | No       | `allow` | `allow` or `deny`                                  |

### EntitlementClaim

| Field   | Type   | Required | Description                                                |
|---------|--------|----------|------------------------------------------------------------|
| `claim` | string | Yes      | JWT claim name (e.g., `groups`, `sub`, `email`)            |
| `value` | string | Yes      | JWT claim value to match (e.g., `platformEngineer`)        |

### RoleRef

| Field  | Type   | Required | Description                                                         |
|--------|--------|----------|---------------------------------------------------------------------|
| `kind` | string | Yes      | Must be `AuthzClusterRole`                                          |
| `name` | string | Yes      | Name of the `AuthzClusterRole` to bind                              |

:::important
AuthzClusterRoleBindings can only reference `AuthzClusterRole` resources, not namespace-scoped `AuthzRole` resources. This is enforced by a validation rule on the resource.
:::

## Examples

### Grant Admin Access to a Group

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: AuthzClusterRoleBinding
metadata:
  name: platform-admins-binding
spec:
  entitlement:
    claim: groups
    value: platformEngineer
  roleRef:
    kind: AuthzClusterRole
    name: platform-admin
  effect: allow
```

### Grant Viewer Access to a Service Account

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: AuthzClusterRoleBinding
metadata:
  name: backstage-reader-binding
spec:
  entitlement:
    claim: sub
    value: openchoreo-backstage-client
  roleRef:
    kind: AuthzClusterRole
    name: viewer
  effect: allow
```

### Deny Access Cluster-Wide

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: AuthzClusterRoleBinding
metadata:
  name: block-contractors
spec:
  entitlement:
    claim: groups
    value: contractors
  roleRef:
    kind: AuthzClusterRole
    name: platform-admin
  effect: deny
```

## Related Resources

- [AuthzClusterRole](./authzclusterrole.md) - Cluster-scoped role definition
- [AuthzRoleBinding](./authzrolebinding.md) - Namespace-scoped role binding with optional target path
- [AuthzRole](./authzrole.md) - Namespace-scoped role definition
