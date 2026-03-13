---
title: Authorization CRDs
description: Detailed reference for the four authorization Custom Resource Definitions in OpenChoreo
sidebar_position: 2
---

# Authorization CRDs

OpenChoreo defines four Custom Resource Definitions (CRDs) to manage authorization. Roles define **what actions** are permitted, and role bindings connect **who** (subjects) to those roles with a specific scope and effect.

## ClusterAuthzRole

A cluster-scoped role that defines a set of allowed actions. Cluster roles are available across all namespaces and can be referenced from any role binding.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterAuthzRole
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

## ClusterAuthzRoleBinding

A cluster-scoped binding that connects an entitlement to one or more cluster roles. By default a role mapping applies across all resources in the cluster, but the optional `scope` field can narrow it to a specific namespace, project, or component.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterAuthzRoleBinding
metadata:
  name: platform-admins-binding
spec:
  entitlement:
    claim: groups
    value: platform-admins
  roleMappings:
    - roleRef:
        kind: ClusterAuthzRole
        name: admin
  effect: allow
```

Multiple roles can be granted to the same entitlement in a single binding, each with an independent scope:

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

In the example above, `acme-admins` gets full `admin` access scoped to the `acme` namespace and cluster-wide read-only visibility into cluster-level resources — all in a single CR.

:::important
Cluster role bindings can only reference `ClusterAuthzRole` resources, not namespace-scoped `AuthzRole` resources.
:::

### Fields

| Field | Type | Description |
|---|---|---|
| `spec.entitlement.claim` | `string` | JWT claim name to match (e.g., `groups`, `sub`, `email`) |
| `spec.entitlement.value` | `string` | JWT claim value to match |
| `spec.roleMappings[].roleRef.kind` | `string` | Must be `ClusterAuthzRole` |
| `spec.roleMappings[].roleRef.name` | `string` | Name of the cluster role to bind |
| `spec.roleMappings[].scope.namespace` | `string` | *(Optional)* Restrict to a specific namespace |
| `spec.roleMappings[].scope.project` | `string` | *(Optional)* Restrict to a specific project (requires `namespace`) |
| `spec.roleMappings[].scope.component` | `string` | *(Optional)* Restrict to a specific component (requires `namespace` and `project`) |
| `spec.effect` | `string` | `allow` or `deny` |

## AuthzRoleBinding

A namespace-scoped binding that connects an entitlement to one or more roles. Each role mapping can optionally narrow permissions to a specific project or component via the `scope` field.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: AuthzRoleBinding
metadata:
  name: dev-team-binding
  namespace: acme-org
spec:
  entitlement:
    claim: groups
    value: dev-team
  roleMappings:
    - roleRef:
        kind: AuthzRole
        name: developer
      scope:
        project: crm
  effect: allow
```

Namespace role bindings can reference **either** an `AuthzRole` in the same namespace or a `ClusterAuthzRole`, providing flexibility to reuse cluster-wide role definitions with namespace-specific scoping.

When `scope` is omitted from a role mapping, that role applies to **all** resources within the namespace that the role's actions permit.

### Fields

| Field | Type | Description |
|---|---|---|
| `metadata.namespace` | `string` | The namespace this binding belongs to |
| `spec.entitlement.claim` | `string` | JWT claim name to match (e.g., `groups`, `sub`, `email`) |
| `spec.entitlement.value` | `string` | JWT claim value to match |
| `spec.roleMappings[].roleRef.kind` | `string` | `ClusterAuthzRole` or `AuthzRole` |
| `spec.roleMappings[].roleRef.name` | `string` | Name of the role to bind |
| `spec.roleMappings[].scope.project` | `string` | *(Optional)* Restrict to a specific project |
| `spec.roleMappings[].scope.component` | `string` | *(Optional)* Restrict to a specific component (requires `project` to be set) |
| `spec.effect` | `string` | `allow` or `deny` |

## Allow and Deny

Both `ClusterAuthzRoleBinding` and `AuthzRoleBinding` carry an **effect** field — either `allow` or `deny`. When multiple bindings match a request, the system follows a **deny-overrides** strategy:

- If **any** matching binding has effect `allow` **AND** **no** matching binding has effect `deny` → **ALLOW**
- If **any** matching binding has effect `deny` → **DENY** (deny always wins)
- If **no** bindings match → **DENY** (default deny)

This means a single `deny` binding can override any number of `allow` bindings, making it straightforward to revoke specific permissions without restructuring the entire role hierarchy.
