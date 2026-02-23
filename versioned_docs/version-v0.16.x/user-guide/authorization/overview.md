---
title: Overview
description: Understand how authorization works in OpenChoreo using hierarchical RBAC
sidebar_position: 1
---

# Authorization in OpenChoreo

OpenChoreo provides a Kubernetes-native, hierarchical Role-Based Access Control (RBAC) system that controls who can perform what actions on which resources. The authorization system is built on four Custom Resource Definitions (CRDs) that define roles, permissions, and bindings — all managed declaratively alongside your workloads.

:::note
Authorization can be disabled for testing purposes. When disabled, a passthrough implementation allows all requests without any policy evaluation.
:::

## Core Concepts

### Subject

A **subject** represents the identity making a request. Subjects are identified by **entitlements** — claim-value pairs extracted from the caller's JWT/OIDC token. For example:

- `groups:platformEngineer` — user belongs to the "platformEngineer" group
- `sub:user-abc-123` — user's unique identifier
- `email:alice@acme.com` — user's email address

A single user can have multiple entitlements (e.g., belonging to several groups), and each entitlement is evaluated independently during authorization.

### Action

An **action** represents an operation that can be performed on a resource. Actions follow the format `resource:verb`. For example:

- `component:create` — create a new component
- `project:view` — view a project
- `componenttype:create` — create a new component type

Actions also support wildcards:
- `component:*` — all operations on components
- `*` — all operations on all resources

### Resource Hierarchy

Resources in OpenChoreo form a hierarchy that determines the scope of permissions:

```
Cluster (everything)
  └── Namespace
        └── Project
              └── Component
```

Permissions can be scoped to any level in this hierarchy:

| Scope | Example | Meaning |
|---|---|---|
| **Cluster-wide** | `"*"` | Permissions apply to all namespaces, projects, and components across the entire cluster |
| **Namespace** | `ns/acme` | Permissions are only exercisable within the `acme` namespace. Resources in other namespaces are unaffected |
| **Project** | `ns/acme/project/crm` | Permissions are restricted to the `crm` project inside the `acme` namespace. Other projects within the same namespace are unaffected |
| **Component** | `ns/acme/project/crm/component/backend` | Permissions apply only to the `backend` component within the `crm` project. Other components in the same project are unaffected |

A key design property: **permissions granted at a parent level automatically cascade to all children**. For example, granting `component:view` at the namespace level allows viewing components in every project within that namespace. However, a permission scoped to a specific project does **not** grant access to resources in other projects — the boundary is strictly defined by the scope.

## Authorization CRDs

OpenChoreo uses four CRDs to manage authorization. **Roles** define what actions are permitted, and **role bindings** connect subjects to those roles with a specific scope and effect.

| CRD | Scope | Purpose |
|---|---|---|
| [**AuthzClusterRole**](./authorization-crds.md#authzclusterrole) | Cluster | Define a set of allowed actions, available across all namespaces |
| [**AuthzRole**](./authorization-crds.md#authzrole) | Namespace | Define actions scoped to a single namespace |
| [**AuthzClusterRoleBinding**](./authorization-crds.md#authzclusterrolebinding) | Cluster | Bind an entitlement to a cluster role for all resources |
| [**AuthzRoleBinding**](./authorization-crds.md#authzrolebinding) | Namespace | Bind an entitlement to a role within a specific namespace |

For detailed field descriptions and YAML examples, see [Authorization CRDs](./authorization-crds.md).

## Available  Actions

The following actions are defined in the system:

| Resource | Actions |
|---|---|
| Namespace | `namespace:view` |
| Project | `project:view`, `project:create`, `project:delete` |
| Component | `component:view`, `component:create`, `component:update`, `component:deploy`, `component:delete` |
| Component Release | `componentrelease:view`, `componentrelease:create` |
| Release Binding | `releasebinding:view`, `releasebinding:update` |
| Component Type | `componenttype:view`, `componenttype:create` |
| Workflow | `workflow:view`, `componentworkflow:view`, `componentworkflow:create`, `componentworkflowrun:view` |
| Trait | `trait:view`, `trait:create` |
| Environment | `environment:view`, `environment:create` |
| Data Plane | `dataplane:view`, `dataplane:create` |
| Build Plane | `buildplane:view` |
| Observability | `observabilityplane:view`, `logs:view`, `metrics:view`, `traces:view`, `alerts:view` |
| Secrets | `secretreference:create`, `secretreference:view`, `secretreference:delete` |
| Workload | `workload:view`, `workload:create` |
| Roles | `role:view`, `role:create`, `role:update`, `role:delete`, `action:view` |
| Role Mappings | `rolemapping:view`, `rolemapping:create`, `rolemapping:update`, `rolemapping:delete` |
| Deployment Pipeline | `deploymentpipeline:view` |
| RCA Report | `rcareport:view`, `rcareport:update`, `rcareport:delete` |
