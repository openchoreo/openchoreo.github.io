---
title: ClusterAuthzRoleBinding API Reference
description: Binds a subject to ClusterAuthzRoles with optional namespace or resource scope
---

# ClusterAuthzRoleBinding

A ClusterAuthzRoleBinding connects a subject (identified by a JWT claim-value pair) to one or more `ClusterAuthzRole` resources, granting or denying the roles' permissions. Each role mapping can optionally be scoped to a specific namespace, project, or component within the resource hierarchy.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ClusterAuthzRoleBindings are cluster-scoped resources.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterAuthzRoleBinding
metadata:
  name: <binding-name>
```

### Spec Fields

| Field          | Type                                        | Required | Default | Description                                      |
| -------------- | ------------------------------------------- | -------- | ------- | ------------------------------------------------ |
| `entitlement`  | [EntitlementClaim](#entitlementclaim)       | Yes      | -       | Subject identification from JWT claims           |
| `roleMappings` | [ClusterRoleMapping[]](#clusterrolemapping) | Yes      | -       | List of role-scope pairs this binding applies to |
| `effect`       | string                                      | No       | `allow` | `allow` or `deny`                                |

### EntitlementClaim

| Field   | Type   | Required | Description                                         |
| ------- | ------ | -------- | --------------------------------------------------- |
| `claim` | string | Yes      | JWT claim name (e.g., `groups`, `sub`, `email`)     |
| `value` | string | Yes      | JWT claim value to match (e.g., `platformEngineer`) |

### ClusterRoleMapping

Each entry in the `roleMappings` array pairs a role reference with an optional scope and optional attribute-based conditions.

| Field        | Type                                      | Required | Description                                                                                    |
| ------------ | ----------------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `roleRef`    | [RoleRef](#roleref)                       | Yes      | Reference to the cluster role to bind                                                          |
| `scope`      | [ClusterTargetScope](#clustertargetscope) | No       | Narrows the mapping to a specific namespace, project, or component. Omit for cluster-wide      |
| `conditions` | [AuthzCondition[]](#authzcondition)       | No       | Attribute-based restrictions on specific actions granted by the role. Omit for no restrictions |

### RoleRef

| Field  | Type   | Required | Description                            |
| ------ | ------ | -------- | -------------------------------------- |
| `kind` | string | Yes      | Must be `ClusterAuthzRole`             |
| `name` | string | Yes      | Name of the `ClusterAuthzRole` to bind |

### ClusterTargetScope

All fields are optional. Omitted fields mean "all" at that level.

| Field       | Type   | Required | Description                                                        |
| ----------- | ------ | -------- | ------------------------------------------------------------------ |
| `namespace` | string | No       | Scope to a specific namespace                                      |
| `project`   | string | No       | Scope to a specific project (requires `namespace`)                 |
| `component` | string | No       | Scope to a specific component (requires `namespace` and `project`) |

:::important

- `roleMappings[].roleRef.kind` must be `ClusterAuthzRole`. ClusterAuthzRoleBindings cannot reference namespace-scoped `AuthzRole` resources. This is enforced by a validation rule on the resource.
- `scope.project` requires `scope.namespace`, and `scope.component` requires `scope.project`.
  :::

### AuthzCondition

Each entry in `conditions` gates a set of actions in the role mapping on a CEL expression evaluated against attributes of the request.

| Field        | Type     | Required | Description                                                                                                                                 |
| ------------ | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `actions`    | string[] | Yes      | Action patterns this condition applies to — the entry's expression is attached to each listed action. Supports exact matches and wildcards. |
| `expression` | string   | Yes      | A CEL expression that must evaluate to `true` for the action to be permitted by this role mapping.                                          |

Multiple entries on the same role mapping are combined with **OR** semantics — at least one entry whose `actions` cover the request action must evaluate to `true` for the action to be permitted. Entries whose `actions` do not match the request action do not contribute to the decision.

For the full list of attributes available to expressions and the evaluation model, see [Conditions](../../../platform-engineer-guide/authorization/conditions.md).

## Examples

### Grant Admin Access Cluster-Wide

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterAuthzRoleBinding
metadata:
  name: platform-admins-binding
spec:
  entitlement:
    claim: groups
    value: platformEngineer
  roleMappings:
    - roleRef:
        kind: ClusterAuthzRole
        name: platform-admin
  effect: allow
```

### Grant Viewer Access to a Service Account

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterAuthzRoleBinding
metadata:
  name: backstage-reader-binding
spec:
  entitlement:
    claim: sub
    value: openchoreo-backstage-client
  roleMappings:
    - roleRef:
        kind: ClusterAuthzRole
        name: viewer
  effect: allow
```

### Namespace-Scoped Admin with Cluster-Wide Reader

Multiple role mappings can be combined in a single binding, each with an independent scope:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterAuthzRoleBinding
metadata:
  name: acme-admins-binding
spec:
  entitlement:
    claim: groups
    value: acme-admins
  roleMappings:
    - roleRef:
        kind: ClusterAuthzRole
        name: admin
      scope:
        namespace: acme
    - roleRef:
        kind: ClusterAuthzRole
        name: cluster-reader
  effect: allow
```

In this example, `acme-admins` gets full `admin` access scoped to the `acme` namespace and cluster-wide read-only visibility into cluster-level resources — all in a single CR.

### Restrict Observability Reads to Lower Environments

Use `conditions` on a role mapping to gate specific actions on request attributes. The binding below grants the `dashboard-readonly` service account `observability-reader` access cluster-wide, but limits log, metric reads to `dev` and `staging`. See [Conditions](../../../platform-engineer-guide/authorization/conditions.md) for the full attribute model.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterAuthzRoleBinding
metadata:
  name: lower-env-observability-binding
spec:
  entitlement:
    claim: sub
    value: dashboard-readonly
  roleMappings:
    - roleRef:
        kind: ClusterAuthzRole
        name: observability-reader
      conditions:
        - actions:
            - logs:view
            - metrics:view
          expression: 'resource.environment in ["acme/dev", "acme/staging"]'
  effect: allow
```

## Allow and Deny

Both `ClusterAuthzRoleBinding` and `AuthzRoleBinding` carry an **effect** field: either `allow` or `deny`. When multiple bindings match a request, the system follows a **deny-overrides** strategy:

- If **any** matching binding has effect `allow` **AND** **no** matching binding has effect `deny`: **ALLOW**
- If **any** matching binding has effect `deny`: **DENY** (deny always wins)
- If **no** bindings match: **DENY** (default deny)

A single `deny` binding can override any number of `allow` bindings, making it straightforward to revoke specific permissions without restructuring the entire role hierarchy.

## Related Resources

- [ClusterAuthzRole](./clusterauthzrole.md) - Cluster-scoped role definition
- [AuthzRoleBinding](./authzrolebinding.md) - Namespace-scoped role binding with optional target scope
- [AuthzRole](./authzrole.md) - Namespace-scoped role definition
