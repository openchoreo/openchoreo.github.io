---
title: Overview
description: Understand how authorization works in OpenChoreo
sidebar_position: 1
---

# Authorization in OpenChoreo

OpenChoreo RBAC controls who can perform what actions on which OpenChoreo resources. It is managed declaratively through Kubernetes Custom Resource Definitions alongside your workloads.

:::note
Authorization can be disabled for testing purposes. When disabled, a passthrough implementation allows all requests without any policy evaluation.
:::

## What can I do with OpenChoreo RBAC?

Here are some examples of what you can do with OpenChoreo RBAC:

- Allow one team to manage components in a single project, while another team has read-only access across the whole namespace.
- Give a developer permission to create and update components in the `crm` project, but not delete them.
- Grant a platform engineer cluster-wide permission to manage data planes, component types, and workflows.
- Allow a service account to view logs and metrics for a specific component, and nothing else.
- Restrict an auditor to read-only access across every namespace in the cluster.

## How OpenChoreo RBAC works

You control access in OpenChoreo RBAC by defining **roles** and creating **role bindings**. A role is a named collection of allowed actions. A role binding attaches a role to a subject at a specific scope, answering the question "who can do what, and where?"

- **Subject** — _who_ is being granted access.
- **Role** — _what_ actions are allowed.
- **Scope** — _where_ in the resource hierarchy the permissions apply.

The rest of this page walks through each of these in detail, followed by how OpenChoreo evaluates a request against them.

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

**Scope** is the boundary that controls _where_ in the resource hierarchy a role's permissions apply. When a role binding includes a scope, only resources at or below that point in the hierarchy are affected. Resources outside the scope are invisible to that binding, as if it doesn't exist.

Scope is set via the `scope` field on each role mapping in a binding:

| Scope level      | How to set                                                                | What it means                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Cluster-wide** | Omit `scope` on a `ClusterAuthzRoleBinding`                               | Permissions apply to all resources at every level of the hierarchy                                                                               |
| **Namespace**    | `scope.namespace: acme`                                                   | Permissions apply to the `acme` namespace and all resources within it — its projects, their components, and any other namespace-scoped resources |
| **Project**      | `scope.namespace: acme`, `scope.project: crm`                             | Permissions apply to the `crm` project and all resources within it                                                                               |
| **Component**    | `scope.namespace: acme`, `scope.project: crm`, `scope.component: backend` | Permissions apply only to the `backend` component and its resources                                                                              |

### Effective Permissions

A role defines _what_ actions are permitted (e.g., `component:view`, `project:create`). Scope defines _where_ those actions take effect. The **effective permissions** of a binding are the intersection of both — a user can only perform an action if the role grants that action **and** the target resource falls within the scope.

For example, a `developer` role that includes `component:create` and `project:view`:

- Scoped to `namespace: acme, project: crm` — the user can create components and view the project, but only within the `crm` project. Other projects in `acme` are unaffected.
- Scoped to `namespace: acme` — the user can create components and view projects across all projects in `acme`.
- No scope (cluster-wide) — the user can create components and view projects across the entire cluster.

Two key properties:

- **Permissions cascade downward.** Granting `component:view` at the namespace scope allows viewing components in every project within that namespace.
- **Permissions do not cascade upward.** Even if a role includes actions for higher-level resources (e.g., `environment:view`), a binding scoped to a project will **not** grant access to namespace-level or cluster-level resources. If a user needs visibility into those, add supplementary role mappings at the appropriate scope — see [Scoping Roles Below Cluster Level](../authorization.md#scoping-roles-below-cluster-level).

Each role binding also carries an `effect` field — either `allow` or `deny` (default: `allow`). A `deny` binding is an explicit exception: it revokes access that would otherwise be granted by an `allow` binding at the same or a higher scope. See [How OpenChoreo RBAC determines access](#how-openchoreo-rbac-determines-access) for exactly how allow and deny bindings are combined.

## How OpenChoreo RBAC determines access

When a request arrives, OpenChoreo evaluates it against every role binding the subject matches. For each binding, all of the following must hold for the binding to apply:

1. **The subject matches.** One of the caller's entitlement values (e.g., `groups:platformEngineer`) equals the binding's subject.
2. **The resource is within scope.** The target resource lies at or below the binding's scope in the resource hierarchy. A binding at `namespace: acme` applies to everything inside `acme`; a `ClusterAuthzRoleBinding` with no scope applies cluster-wide.
3. **The role grants the action.** The role referenced by the binding lists the requested action, either exactly (`component:create`) or via a wildcard (`component:*`, `*`).

A request is **allowed** only if:

- **at least one** matching binding has `effect: allow`, **and**
- **no** matching binding has `effect: deny`.

A single matching `deny` is enough to block the request, even when multiple `allow` bindings would otherwise grant it. Deny applies across role kinds — a namespace-scoped `AuthzRoleBinding` with `effect: deny` can block access that a `ClusterAuthzRoleBinding` would otherwise allow.

Bindings default to `effect: allow`. Set `effect: deny` explicitly only when you need to create a targeted exception to a broader allow — for example, granting `developer` access across the `acme` namespace but denying it on the `secret` project within it.

## Authorization CRDs

OpenChoreo uses four CRDs to manage authorization. **Roles** define what actions are permitted, and **role bindings** connect subjects to those roles with a specific scope and effect.

| CRD                                                                                    | Scope     | Purpose                                                                                                   |
| -------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| [**ClusterAuthzRole**](../../reference/api/platform/clusterauthzrole.md)               | Cluster   | Define a set of allowed actions, available across all namespaces                                          |
| [**AuthzRole**](../../reference/api/platform/authzrole.md)                             | Namespace | Define actions scoped to a single namespace                                                               |
| [**ClusterAuthzRoleBinding**](../../reference/api/platform/clusterauthzrolebinding.md) | Cluster   | Bind an entitlement to one or more cluster roles, optionally scoped to a namespace, project, or component |
| [**AuthzRoleBinding**](../../reference/api/platform/authzrolebinding.md)               | Namespace | Bind an entitlement to one or more roles within a specific namespace                                      |

For detailed field descriptions and YAML examples, see the [Authorization API Reference](../../reference/api/platform/authzrole.md).

## Available Actions

The following actions are defined in the system:

| Resource                                 | Actions                                                                                                                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Namespace                                | `namespace:view`, `namespace:create`, `namespace:update`, `namespace:delete`                                                                                                                     |
| Project                                  | `project:view`, `project:create`, `project:update`, `project:delete`                                                                                                                             |
| Component                                | `component:view`, `component:create`, `component:update`, `component:delete`                                                                                                                     |
| Component Release                        | `componentrelease:view`, `componentrelease:create`                                                                                                                                               |
| Release Binding                          | `releasebinding:view`, `releasebinding:create`, `releasebinding:update`, `releasebinding:delete`                                                                                                 |
| Component Type                           | `componenttype:view`, `componenttype:create`, `componenttype:update`, `componenttype:delete`                                                                                                     |
| Cluster Component Type                   | `clustercomponenttype:view`, `clustercomponenttype:create`, `clustercomponenttype:update`, `clustercomponenttype:delete`                                                                         |
| Workflow                                 | `workflow:view`, `workflow:create`, `workflow:update`, `workflow:delete`                                                                                                                         |
| Workflow Run                             | `workflowrun:view`, `workflowrun:create`, `workflowrun:update`                                                                                                                                   |
| Cluster Workflow                         | `clusterworkflow:view`, `clusterworkflow:create`, `clusterworkflow:update`, `clusterworkflow:delete`                                                                                             |
| Trait                                    | `trait:view`, `trait:create`, `trait:update`, `trait:delete`                                                                                                                                     |
| Cluster Trait                            | `clustertrait:view`, `clustertrait:create`, `clustertrait:update`, `clustertrait:delete`                                                                                                         |
| Environment                              | `environment:view`, `environment:create`, `environment:update`, `environment:delete`                                                                                                             |
| Data Plane                               | `dataplane:view`, `dataplane:create`, `dataplane:update`, `dataplane:delete`                                                                                                                     |
| Cluster Data Plane                       | `clusterdataplane:view`, `clusterdataplane:create`, `clusterdataplane:update`, `clusterdataplane:delete`                                                                                         |
| Workflow Plane                           | `workflowplane:view`, `workflowplane:create`, `workflowplane:update`, `workflowplane:delete`                                                                                                     |
| Cluster Workflow Plane                   | `clusterworkflowplane:view`, `clusterworkflowplane:create`, `clusterworkflowplane:update`, `clusterworkflowplane:delete`                                                                         |
| Observability Plane                      | `observabilityplane:view`, `observabilityplane:create`, `observabilityplane:update`, `observabilityplane:delete`                                                                                 |
| Cluster Observability Plane              | `clusterobservabilityplane:view`, `clusterobservabilityplane:create`, `clusterobservabilityplane:update`, `clusterobservabilityplane:delete`                                                     |
| Deployment Pipeline                      | `deploymentpipeline:view`, `deploymentpipeline:create`, `deploymentpipeline:update`, `deploymentpipeline:delete`                                                                                 |
| Observability Alert Notification Channel | `observabilityalertsnotificationchannel:view`, `observabilityalertsnotificationchannel:create`, `observabilityalertsnotificationchannel:update`, `observabilityalertsnotificationchannel:delete` |
| Secrets                                  | `secretreference:view`, `secretreference:create`, `secretreference:update`, `secretreference:delete`                                                                                             |
| Workload                                 | `workload:view`, `workload:create`, `workload:update`, `workload:delete`                                                                                                                         |
| ClusterAuthzRole                         | `clusterauthzrole:view`, `clusterauthzrole:create`, `clusterauthzrole:update`, `clusterauthzrole:delete`                                                                                         |
| AuthzRole                                | `authzrole:view`, `authzrole:create`, `authzrole:update`, `authzrole:delete`                                                                                                                     |
| ClusterAuthzRoleBinding                  | `clusterauthzrolebinding:view`, `clusterauthzrolebinding:create`, `clusterauthzrolebinding:update`, `clusterauthzrolebinding:delete`                                                             |
| AuthzRoleBinding                         | `authzrolebinding:view`, `authzrolebinding:create`, `authzrolebinding:update`, `authzrolebinding:delete`                                                                                         |
| Observability                            | `logs:view`, `metrics:view`, `traces:view`, `alerts:view`                                                                                                                                        |
| Incidents                                | `incidents:view`, `incidents:update`                                                                                                                                                             |
| RCA Report                               | `rcareport:view`, `rcareport:update`                                                                                                                                                             |
