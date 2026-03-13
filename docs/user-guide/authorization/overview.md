---
title: Overview
description: Understand how authorization works in OpenChoreo using hierarchical RBAC
sidebar_position: 1
---

# Authorization in OpenChoreo

OpenChoreo provides a Kubernetes-native, **Hierarchical Role-Based Access Control (RBAC)** system that controls who can perform what actions on which resources. The authorization system is built on four Custom Resource Definitions (CRDs) that define roles, permissions, and bindings — all managed declaratively alongside your workloads.

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

Resources in OpenChoreo form a four-level ownership hierarchy:

```
Cluster (everything)
  └── Namespace
        └── Project
              └── Component
```

Every resource belongs to a specific point in this hierarchy. For example, a component belongs to a project, which belongs to a namespace. Cluster-scoped resources (like `ClusterAuthzRole` or `ClusterDataPlane`) sit at the top level and are not owned by any namespace.

### Scope

**Scope** is the boundary that controls *where* in the resource hierarchy a role's permissions apply. When a role binding includes a scope, only resources at or below that point in the hierarchy are affected. Resources outside the scope are invisible to that binding, as if it doesn't exist.

Scope is set via the `scope` field on each role mapping in a binding:

| Scope level | How to set | What it means |
|---|---|---|
| **Cluster-wide** | Omit `scope` on a `ClusterAuthzRoleBinding` | Permissions apply to all resources at every level of the hierarchy |
| **Namespace** | `scope.namespace: acme` | Permissions apply to the `acme` namespace and all resources within it — its projects, their components, and any other namespace-scoped resources |
| **Project** | `scope.namespace: acme`, `scope.project: crm` | Permissions apply to the `crm` project and all resources within it |
| **Component** | `scope.namespace: acme`, `scope.project: crm`, `scope.component: backend` | Permissions apply only to the `backend` component and its resources |

### Effective Permissions

A role defines *what* actions are permitted (e.g., `component:view`, `project:create`). Scope defines *where* those actions take effect. The **effective permissions** of a binding are the intersection of both — a user can only perform an action if the role grants that action **and** the target resource falls within the scope.

For example, a `developer` role that includes `component:create` and `project:view`:

- Scoped to `namespace: acme, project: crm` — the user can create components and view the project, but only within the `crm` project. Other projects in `acme` are unaffected.
- Scoped to `namespace: acme` — the user can create components and view projects across all projects in `acme`.
- No scope (cluster-wide) — the user can create components and view projects across the entire cluster.

Two key properties:

- **Permissions cascade downward.** Granting `component:view` at the namespace scope allows viewing components in every project within that namespace.
- **Permissions do not cascade upward.** Even if a role includes actions for higher-level resources (e.g., `environment:view`), a binding scoped to a project will **not** grant access to namespace-level or cluster-level resources. If a user needs visibility into those, add supplementary role mappings at the appropriate scope — see [Scoping Roles Below Cluster Level](../../operations/authorization.md#scoping-roles-below-cluster-level).

## Authorization CRDs

OpenChoreo uses four CRDs to manage authorization. **Roles** define what actions are permitted, and **role bindings** connect subjects to those roles with a specific scope and effect.

| CRD | Scope | Purpose |
|---|---|---|
| [**ClusterAuthzRole**](./authorization-crds.md#clusterauthzrole) | Cluster | Define a set of allowed actions, available across all namespaces |
| [**AuthzRole**](./authorization-crds.md#authzrole) | Namespace | Define actions scoped to a single namespace |
| [**ClusterAuthzRoleBinding**](./authorization-crds.md#clusterauthzrolebinding) | Cluster | Bind an entitlement to one or more cluster roles, optionally scoped to a namespace, project, or component |
| [**AuthzRoleBinding**](./authorization-crds.md#authzrolebinding) | Namespace | Bind an entitlement to a role within a specific namespace |

For detailed field descriptions and YAML examples, see [Authorization CRDs](./authorization-crds.md).

## Available  Actions

The following actions are defined in the system:

| Resource | Actions |
|---|---|
| Namespace | `namespace:view`, `namespace:create`, `namespace:update`, `namespace:delete` |
| Project | `project:view`, `project:create`, `project:update`, `project:delete` |
| Component | `component:view`, `component:create`, `component:update`, `component:delete` |
| Component Release | `componentrelease:view`, `componentrelease:create` |
| Release Binding | `releasebinding:view`, `releasebinding:create`, `releasebinding:update`, `releasebinding:delete` |
| Component Type | `componenttype:view`, `componenttype:create`, `componenttype:update`, `componenttype:delete` |
| Cluster Component Type | `clustercomponenttype:view`, `clustercomponenttype:create`, `clustercomponenttype:update`, `clustercomponenttype:delete` |
| Workflow | `workflow:view`, `workflow:create`, `workflow:update`, `workflow:delete` |
| Workflow Run | `workflowrun:view`, `workflowrun:create`, `workflowrun:update` |
| Cluster Workflow | `clusterworkflow:view`, `clusterworkflow:create`, `clusterworkflow:update`, `clusterworkflow:delete` |
| Trait | `trait:view`, `trait:create`, `trait:update`, `trait:delete` |
| Cluster Trait | `clustertrait:view`, `clustertrait:create`, `clustertrait:update`, `clustertrait:delete` |
| Environment | `environment:view`, `environment:create`, `environment:update`, `environment:delete` |
| Data Plane | `dataplane:view`, `dataplane:create`, `dataplane:update`, `dataplane:delete` |
| Cluster Data Plane | `clusterdataplane:view`, `clusterdataplane:create`, `clusterdataplane:update`, `clusterdataplane:delete` |
| Workflow Plane | `workflowplane:view`, `workflowplane:create`, `workflowplane:update`, `workflowplane:delete` |
| Cluster Workflow Plane | `clusterworkflowplane:view`, `clusterworkflowplane:create`, `clusterworkflowplane:update`, `clusterworkflowplane:delete` |
| Observability Plane | `observabilityplane:view`, `observabilityplane:create`, `observabilityplane:update`, `observabilityplane:delete` |
| Cluster Observability Plane | `clusterobservabilityplane:view`, `clusterobservabilityplane:create`, `clusterobservabilityplane:update`, `clusterobservabilityplane:delete` |
| Deployment Pipeline | `deploymentpipeline:view`, `deploymentpipeline:create`, `deploymentpipeline:update`, `deploymentpipeline:delete` |
| Observability Alert Notification Channel | `observabilityalertsnotificationchannel:view`, `observabilityalertsnotificationchannel:create`, `observabilityalertsnotificationchannel:update`, `observabilityalertsnotificationchannel:delete` |
| Secrets | `secretreference:view`, `secretreference:create`, `secretreference:update`, `secretreference:delete` |
| Workload | `workload:view`, `workload:create`, `workload:update`, `workload:delete` |
| ClusterAuthzRole | `clusterauthzrole:view`, `clusterauthzrole:create`, `clusterauthzrole:update`, `clusterauthzrole:delete` |
| AuthzRole | `authzrole:view`, `authzrole:create`, `authzrole:update`, `authzrole:delete` |
| ClusterAuthzRoleBinding | `clusterauthzrolebinding:view`, `clusterauthzrolebinding:create`, `clusterauthzrolebinding:update`, `clusterauthzrolebinding:delete` |
| AuthzRoleBinding | `authzrolebinding:view`, `authzrolebinding:create`, `authzrolebinding:update`, `authzrolebinding:delete` |
| Observability | `logs:view`, `metrics:view`, `traces:view`, `alerts:view` |
| Incidents | `incidents:view`, `incidents:update` |
| RCA Report | `rcareport:view`, `rcareport:update` |
