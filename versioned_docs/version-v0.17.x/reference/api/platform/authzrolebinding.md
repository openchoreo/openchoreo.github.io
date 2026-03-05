---
title: AuthzRoleBinding API Reference
---

# AuthzRoleBinding

An AuthzRoleBinding connects a subject (identified by a JWT claim-value pair) to a role within a namespace. The optional `targetPath` field allows narrowing the binding's scope to a specific project or component within the resource hierarchy.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

AuthzRoleBindings are namespace-scoped resources.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: AuthzRoleBinding
metadata:
  name: <binding-name>
  namespace: <namespace>
```

### Spec Fields

| Field                  | Type                                  | Required | Default | Description                                                                    |
|------------------------|---------------------------------------|----------|---------|--------------------------------------------------------------------------------|
| `entitlement`          | [EntitlementClaim](#entitlementclaim) | Yes      | -       | Subject identification from JWT claims                                          |
| `roleRef`              | [RoleRef](#roleref)                   | Yes      | -       | Reference to the role to bind                                                   |
| `targetPath`           | [TargetPath](#targetpath)             | No       | -       | Narrows the scope to a specific project or component. Omit for namespace-wide   |
| `effect`               | string                                | No       | `allow` | `allow` or `deny`                                                              |

### EntitlementClaim

| Field   | Type   | Required | Description                                                |
|---------|--------|----------|------------------------------------------------------------|
| `claim` | string | Yes      | JWT claim name (e.g., `groups`, `sub`, `email`)            |
| `value` | string | Yes      | JWT claim value to match (e.g., `dev-team`)                |

### RoleRef

| Field  | Type   | Required | Description                                                                  |
|--------|--------|----------|------------------------------------------------------------------------------|
| `kind` | string | Yes      | `AuthzRole` (same namespace) or `AuthzClusterRole`                           |
| `name` | string | Yes      | Name of the role to bind                                                     |

### TargetPath

All fields are optional. Omitted fields mean "all" at that level.

| Field       | Type   | Required | Description                                       |
|-------------|--------|----------|---------------------------------------------------|
| `project`   | string | No       | Scope to a specific project within the namespace   |
| `component` | string | No       | Scope to a specific component within the project   |

## Examples

### Namespace-Wide Developer Access

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: AuthzRoleBinding
metadata:
  name: backend-team-dev-binding
  namespace: acme
spec:
  entitlement:
    claim: groups
    value: backend-team
  roleRef:
    kind: AuthzRole
    name: developer
  effect: allow
```

### Project-Scoped Access

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: AuthzRoleBinding
metadata:
  name: backend-team-crm-binding
  namespace: acme
spec:
  entitlement:
    claim: groups
    value: backend-team
  roleRef:
    kind: AuthzRole
    name: developer
  targetPath:
    project: crm
  effect: allow
```

### Component-Scoped Access

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: AuthzRoleBinding
metadata:
  name: api-team-gateway-binding
  namespace: acme
spec:
  entitlement:
    claim: groups
    value: api-team
  roleRef:
    kind: AuthzClusterRole
    name: viewer
  targetPath:
    project: crm
    component: api-gateway
  effect: allow
```

### Deny Access to a Specific Project

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: AuthzRoleBinding
metadata:
  name: block-billing-access
  namespace: acme
spec:
  entitlement:
    claim: groups
    value: backend-team
  roleRef:
    kind: AuthzClusterRole
    name: viewer
  targetPath:
    project: billing
  effect: deny
```

## Related Resources

- [AuthzRole](./authzrole.md) - Namespace-scoped role definition
- [AuthzClusterRole](./authzclusterrole.md) - Cluster-scoped role definition
- [AuthzClusterRoleBinding](./authzclusterrolebinding.md) - Cluster-scoped role binding
