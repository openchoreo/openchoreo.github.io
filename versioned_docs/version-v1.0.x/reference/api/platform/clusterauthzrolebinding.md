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

Each entry in the `roleMappings` array pairs a role reference with an optional scope.

| Field     | Type                                      | Required | Description                                                                               |
| --------- | ----------------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| `roleRef` | [RoleRef](#roleref)                       | Yes      | Reference to the cluster role to bind                                                     |
| `scope`   | [ClusterTargetScope](#clustertargetscope) | No       | Narrows the mapping to a specific namespace, project, or component. Omit for cluster-wide |

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

## Allow and Deny

Both `ClusterAuthzRoleBinding` and `AuthzRoleBinding` carry an **effect** field: either `allow` or `deny`. Evaluation runs once per entitlement value the caller presents, and each entitlement value is resolved independently using a **deny-overrides** strategy:

- If **any** binding matching that entitlement value has effect `allow` **AND** **no** binding matching that entitlement value has effect `deny`: **ALLOW**
- If **any** binding matching that entitlement value has effect `deny`: **DENY**
- If **no** bindings match: **DENY** (default deny)

The per-entitlement results are then **unioned**: the request is allowed if any one of the caller's entitlement values allows it.

A `deny` therefore overrides `allow` bindings carrying the **same** entitlement value, including across role kinds and down the resource hierarchy. It does **not** override access granted to a different entitlement value. If a user belongs to both `acme-developers` and `crm-developers`, a `deny` on `crm-developers` will not revoke access that `acme-developers` grants.

To revoke access, remove the binding that grants it or narrow its scope.

## Related Resources

- [ClusterAuthzRole](./clusterauthzrole.md) - Cluster-scoped role definition
- [AuthzRoleBinding](./authzrolebinding.md) - Namespace-scoped role binding with optional target scope
- [AuthzRole](./authzrole.md) - Namespace-scoped role definition
