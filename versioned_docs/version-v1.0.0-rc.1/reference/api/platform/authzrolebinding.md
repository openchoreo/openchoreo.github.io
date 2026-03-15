---
title: AuthzRoleBinding API Reference
---

# AuthzRoleBinding

An AuthzRoleBinding connects a subject (identified by a JWT claim-value pair) to one or more roles within a namespace. Each role mapping can optionally narrow the binding's scope to a specific project or component within the resource hierarchy.

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

| Field                  | Type                                    | Required | Default | Description                                                          |
|------------------------|-----------------------------------------|----------|---------|----------------------------------------------------------------------|
| `entitlement`          | [EntitlementClaim](#entitlementclaim)   | Yes      | -       | Subject identification from JWT claims                                |
| `roleMappings`         | [RoleMapping[]](#rolemapping)          | Yes      | -       | List of role-scope pairs this binding grants                          |
| `effect`               | string                                  | No       | `allow` | `allow` or `deny`                                                    |

### EntitlementClaim

| Field   | Type   | Required | Description                                                |
|---------|--------|----------|------------------------------------------------------------|
| `claim` | string | Yes      | JWT claim name (e.g., `groups`, `sub`, `email`)            |
| `value` | string | Yes      | JWT claim value to match (e.g., `dev-team`)                |

### RoleMapping

Each entry in the `roleMappings` array pairs a role reference with an optional scope.

| Field     | Type                                  | Required | Description                                                                       |
|-----------|---------------------------------------|----------|-----------------------------------------------------------------------------------|
| `roleRef` | [RoleRef](#roleref)                   | Yes      | Reference to the role to bind                                                     |
| `scope`   | [TargetScope](#targetscope)           | No       | Narrows the mapping to a specific project or component. Omit for namespace-wide   |

### RoleRef

| Field  | Type   | Required | Description                                                                  |
|--------|--------|----------|------------------------------------------------------------------------------|
| `kind` | string | Yes      | `AuthzRole` (same namespace) or `ClusterAuthzRole`                           |
| `name` | string | Yes      | Name of the role to bind                                                     |

### TargetScope

All fields are optional. Omitted fields mean "all" at that level.

| Field       | Type   | Required | Description                                       |
|-------------|--------|----------|---------------------------------------------------|
| `project`   | string | No       | Scope to a specific project within the namespace   |
| `component` | string | No       | Scope to a specific component (requires `project`) |

:::important
`scope.component` requires `scope.project` to be set. This is enforced by a validation rule on the resource.
:::

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
  roleMappings:
    - roleRef:
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
  roleMappings:
    - roleRef:
        kind: AuthzRole
        name: developer
      scope:
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
  roleMappings:
    - roleRef:
        kind: ClusterAuthzRole
        name: viewer
      scope:
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
  roleMappings:
    - roleRef:
        kind: ClusterAuthzRole
        name: viewer
      scope:
        project: billing
  effect: deny
```

## Related Resources

- [AuthzRole](./authzrole.md) - Namespace-scoped role definition
- [ClusterAuthzRole](./clusterauthzrole.md) - Cluster-scoped role definition
- [ClusterAuthzRoleBinding](./clusterauthzrolebinding.md) - Cluster-scoped role binding
