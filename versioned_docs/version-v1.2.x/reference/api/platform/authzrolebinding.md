---
title: AuthzRoleBinding API Reference
description: Binds a subject to namespace-scoped roles with optional project or component scope
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

| Field          | Type                                  | Required | Default | Description                                  |
| -------------- | ------------------------------------- | -------- | ------- | -------------------------------------------- |
| `entitlement`  | [EntitlementClaim](#entitlementclaim) | Yes      | -       | Subject identification from JWT claims       |
| `roleMappings` | [RoleMapping[]](#rolemapping)         | Yes      | -       | List of role-scope pairs this binding grants |
| `effect`       | string                                | No       | `allow` | `allow` or `deny`                            |

### EntitlementClaim

| Field   | Type   | Required | Description                                     |
| ------- | ------ | -------- | ----------------------------------------------- |
| `claim` | string | Yes      | JWT claim name (e.g., `groups`, `sub`, `email`) |
| `value` | string | Yes      | JWT claim value to match (e.g., `dev-team`)     |

### RoleMapping

Each entry in the `roleMappings` array pairs a role reference with an optional scope and optional attribute-based conditions.

| Field        | Type                                | Required | Description                                                                                    |
| ------------ | ----------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `roleRef`    | [RoleRef](#roleref)                 | Yes      | Reference to the role to bind                                                                  |
| `scope`      | [TargetScope](#targetscope)         | No       | Narrows the mapping to a specific project or component. Omit for namespace-wide                |
| `conditions` | [AuthzCondition[]](#authzcondition) | No       | Attribute-based restrictions on specific actions granted by the role. Omit for no restrictions |

### RoleRef

| Field  | Type   | Required | Description                                        |
| ------ | ------ | -------- | -------------------------------------------------- |
| `kind` | string | Yes      | `AuthzRole` (same namespace) or `ClusterAuthzRole` |
| `name` | string | Yes      | Name of the role to bind                           |

### TargetScope

All fields are optional. Omitted fields mean "all" at that level.

| Field       | Type   | Required | Description                                        |
| ----------- | ------ | -------- | -------------------------------------------------- |
| `project`   | string | No       | Scope to a specific project within the namespace   |
| `component` | string | No       | Scope to a specific component (requires `project`) |

:::important
`scope.component` requires `scope.project` to be set. This is enforced by a validation rule on the resource.
:::

### AuthzCondition

Each entry in `conditions` gates a set of actions in the role mapping on a CEL expression evaluated against attributes of the request.

| Field        | Type     | Required | Description                                                                                                                                 |
| ------------ | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `actions`    | string[] | Yes      | Action patterns this condition applies to — the entry's expression is attached to each listed action. Supports exact matches and wildcards. |
| `expression` | string   | Yes      | A CEL expression that must evaluate to `true` for the action to be permitted by this role mapping.                                          |

Multiple entries on the same role mapping are combined with **OR** semantics — at least one entry whose `actions` cover the request action must evaluate to `true` for the action to be permitted. Entries whose `actions` do not match the request action do not contribute to the decision.

For the full list of attributes available to expressions and the evaluation model, see [Conditions on Role Bindings](../../../platform-engineer-guide/authorization/conditions.md).

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

### Restrict Component Deployments to Non-Production Environments

Use `conditions` on a role mapping to gate specific actions on request attributes. The binding below grants `developer` access to the `backend-team` group, but blocks release-binding mutations in production. See [Conditions](../../../platform-engineer-guide/authorization/conditions.md) for the full attribute model.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: AuthzRoleBinding
metadata:
  name: backend-team-binding
  namespace: acme
spec:
  entitlement:
    claim: groups
    value: backend-team
  roleMappings:
    - roleRef:
        kind: AuthzRole
        name: developer
      conditions:
        - actions:
            - releasebinding:create
            - releasebinding:update
            - releasebinding:delete
          expression: 'resource.environment != "acme/prod"'
  effect: allow
```

## Allow and Deny

Both `ClusterAuthzRoleBinding` and `AuthzRoleBinding` carry an **effect** field: either `allow` or `deny`. When multiple bindings match a request, the system follows a **deny-overrides** strategy:

- If **any** matching binding has effect `allow` **AND** **no** matching binding has effect `deny`: **ALLOW**
- If **any** matching binding has effect `deny`: **DENY** (deny always wins)
- If **no** bindings match: **DENY** (default deny)

A single `deny` binding can override any number of `allow` bindings, making it straightforward to revoke specific permissions without restructuring the entire role hierarchy.

## Related Resources

- [AuthzRole](./authzrole.md) - Namespace-scoped role definition
- [ClusterAuthzRole](./clusterauthzrole.md) - Cluster-scoped role definition
- [ClusterAuthzRoleBinding](./clusterauthzrolebinding.md) - Cluster-scoped role binding
