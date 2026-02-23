---
title: Authorization CRDs
description: Detailed reference for the four authorization Custom Resource Definitions in OpenChoreo
sidebar_position: 2
---

# Authorization CRDs

OpenChoreo defines four Custom Resource Definitions (CRDs) to manage authorization. Roles define **what actions** are permitted, and role bindings connect **who** (subjects) to those roles with a specific scope and effect.

## AuthzClusterRole

A cluster-scoped role that defines a set of allowed actions. Cluster roles are available across all namespaces and can be referenced from any role binding.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: AuthzClusterRole
metadata:
  name: platform-admin
spec:
  actions:
    - "*"
  description: "Full access to all resources"
```

### Fields

| Field | Type | Description |
|---|---|---|
| `spec.actions` | `[]string` | List of actions this role permits. Supports wildcards (`*`, `component:*`) |
| `spec.description` | `string` | Human-readable description of the role's purpose |

## AuthzRole

A namespace-scoped role that defines actions available within a single namespace. Useful for namespace-specific roles that should not apply across namespace boundaries.

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
  description: "Developer role for the namespace acme"
```

### Fields

| Field | Type | Description |
|---|---|---|
| `metadata.namespace` | `string` | The namespace this role belongs to |
| `spec.actions` | `[]string` | List of actions this role permits. Supports wildcards (`*`, `component:*`) |
| `spec.description` | `string` | Human-readable description of the role's purpose |

## AuthzClusterRoleBinding

A cluster-scoped binding that connects an entitlement to a cluster role. Applies across all resources in the cluster.

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

:::important
Cluster role bindings can only reference `AuthzClusterRole` resources, not namespace-scoped `AuthzRole` resources.
:::

### Fields

| Field | Type | Description |
|---|---|---|
| `spec.entitlement.claim` | `string` | JWT claim name to match (e.g., `groups`, `sub`, `email`) |
| `spec.entitlement.value` | `string` | JWT claim value to match |
| `spec.roleRef.kind` | `string` | Must be `AuthzClusterRole` |
| `spec.roleRef.name` | `string` | Name of the cluster role to bind |
| `spec.effect` | `string` | `allow` or `deny` |

## AuthzRoleBinding

A namespace-scoped binding that connects an entitlement to a role. The optional `targetPath` field allows narrowing permissions to a specific level in the resource hierarchy, such as a particular project or component.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: AuthzRoleBinding
metadata:
  name: dev-team-crm-binding
  namespace: acme-org
spec:
  entitlement:
    claim: groups
    value: dev-team
  roleRef:
    kind: AuthzRole
    name: developer
  targetPath:
    project: crm
  effect: allow
```

Namespace role bindings can reference **either** an `AuthzRole` in the same namespace or an `AuthzClusterRole`, providing flexibility to reuse cluster-wide role definitions with namespace-specific scoping.

When `targetPath` fields are omitted, the binding applies to **all** projects and components within the namespace.

### Fields

| Field | Type | Description |
|---|---|---|
| `metadata.namespace` | `string` | The namespace this binding belongs to |
| `spec.entitlement.claim` | `string` | JWT claim name to match (e.g., `groups`, `sub`, `email`) |
| `spec.entitlement.value` | `string` | JWT claim value to match |
| `spec.roleRef.kind` | `string` | `AuthzClusterRole` or `AuthzRole` |
| `spec.roleRef.name` | `string` | Name of the role to bind |
| `spec.targetPath.project` | `string` | *(Optional)* Restrict to a specific project |
| `spec.targetPath.component` | `string` | *(Optional)* Restrict to a specific component (requires `project` to be set) |
| `spec.effect` | `string` | `allow` or `deny` |

## Allow and Deny

Both `AuthzClusterRoleBinding` and `AuthzRoleBinding` carry an **effect** field — either `allow` or `deny`. When multiple bindings match a request, the system follows a **deny-overrides** strategy:

- If **any** matching binding has effect `allow` **AND** **no** matching binding has effect `deny` → **ALLOW**
- If **any** matching binding has effect `deny` → **DENY** (deny always wins)
- If **no** bindings match → **DENY** (default deny)

This means a single `deny` binding can override any number of `allow` bindings, making it straightforward to revoke specific permissions without restructuring the entire role hierarchy.
