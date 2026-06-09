---
title: Conditions
description: Restrict role grants by request attributes using CEL expressions on AuthzRoleBindings
sidebar_position: 4
keywords:
  - ABAC
  - attribute-based access control
  - CEL
  - common expression language
  - policy
  - constraints
  - conditional access
  - environment restriction
  - request attributes
---

# Conditions

A role binding answers _who_, _what_, and _where_. **Conditions** add a fourth constraint — _under what circumstances_. This is attribute-based access control (ABAC), layered on top of OpenChoreo's RBAC and expressed through CEL (Common Expression Language) policy. For example, you can grant a developer permission to manage release bindings in the `crm` project, but only when the target environment is `dev` or `staging` — keeping production off-limits.

Conditions are optional. Omit them and the role mapping behaves like any other RBAC grant — every action the role grants applies within the binding's scope.

## Condition Structure

A condition has two parts: a list of **actions** it applies to, and an **expression** that decides whether those actions are permitted. You can attach conditions to a role mapping either in YAML (the `conditions` field on `AuthzRoleBinding` / `ClusterAuthzRoleBinding`) or through the Access Control UI in Backstage.

| Field        | Type     | Required | Description                                                                                                                                   |
| ------------ | -------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `actions`    | string[] | Yes      | Action patterns this condition applies to — the entry's `expression` is attached to each listed action. Supports exact matches and wildcards. |
| `expression` | string   | Yes      | A CEL expression that must evaluate to `true` for the action to be permitted by this role mapping.                                            |

Action patterns follow the same wildcard rules used elsewhere in OpenChoreo RBAC:

- `releasebinding:create` — a single concrete action
- `releasebinding:*` — every action on the `releasebinding` resource
- `*` — every action in the system

Only entries whose `actions` match the request contribute to the decision. If a mapping has conditions but none target the requested action, the condition check is skipped for that action.

## Available Attributes

CEL expressions reference a predefined set of attributes. Each attribute is registered against the specific actions where it is meaningful; a binding that references an attribute on an action that does not support it will be rejected at creation time.

Currently the following attributes are available — more will be added in future releases:

| Attribute                                                                       | Type   | Available on                                                                                                                                                                                                                                                                                    | Description                                                          |
| ------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `resource.componentType`<br/>[(dual-scoped)](#resource-identifiers-dual-scoped) | string | `component:create`, `component:update`, `component:delete`                                                                                                                                                                                                                                      | ComponentType (or ClusterComponentType) referenced by the component. |
| `resource.environment`<br/>[(dual-scoped)](#resource-identifiers-dual-scoped)   | string | `releasebinding:create`, `releasebinding:view`, `releasebinding:update`, `releasebinding:delete`, `resourcereleasebinding:create`, `resourcereleasebinding:view`, `resourcereleasebinding:update`, `resourcereleasebinding:delete`, `logs:view`, `wirelogs:view`, `metrics:view`, `traces:view` | Environment associated with the resource (e.g., `acme/prod`).        |
| `resource.resourceType`<br/>[(dual-scoped)](#resource-identifiers-dual-scoped)  | string | `resource:create`, `resource:update`, `resource:delete`                                                                                                                                                                                                                                         | ResourceType (or ClusterResourceType) referenced by the resource.    |
| `resource.workflow`<br/>[(dual-scoped)](#resource-identifiers-dual-scoped)      | string | `workflowrun:create`, `workflowrun:update`, `workflowrun:delete`                                                                                                                                                                                                                                | Workflow (or ClusterWorkflow) referenced by the workflow run.        |

When a condition lists multiple actions — whether explicitly (`["releasebinding:create", "logs:view"]`) or via a wildcard pattern (`releasebinding:*`) — the expression may only reference attributes registered for **every** action the entry covers. An attribute supported by only some of those actions is not usable in the condition.

### Resource Identifiers (Dual-Scoped)

Some resource kinds in OpenChoreo come in two variants — one namespace-scoped, one cluster-scoped (for example, `ComponentType` and `ClusterComponentType`). In conditions, both variants share a single logical attribute — `environment`, `componentType`, `resourceType`, or `workflow`. Conditions don't pick the variant by kind; they pick it by the **shape of the identifier**.

These dual-scoped attributes carry one of two forms:

- For the namespace-scoped variant: `{namespace}/{name}` — for example, `acme/prod`.
- For the cluster-scoped variant: just `{name}` — for example, `prod`.

Match the same form in your CEL expression: `resource.environment == "acme/prod"` targets a namespace-scoped environment named `prod` in `acme`, while `resource.environment == "prod"` targets the cluster-scoped one. The same rule applies to `resource.componentType`, `resource.resourceType`, and `resource.workflow`.

Which form applies depends on the reference's `kind` in the resource being acted upon. Match the form the resource actually resolves to. When `kind` is omitted, it follows the CRD field's default.

For resources that exist in only one scope, the resource identifiers simply carry the resource name.

## How Conditions Affect the Authorization Decision

For a role mapping to permit a request, four things must all be true:

1. The subject matches the binding's entitlement.
2. The target resource is within the binding's scope.
3. The role lists the requested action (exactly or via a wildcard).
4. The condition (if any) evaluates to `true`.

A mapping with no `conditions` skips step four. A mapping with conditions that don't target the request action also skips step four — steps one through three still apply.

Aggregation across bindings is unchanged. A request is **allowed** only if at least one matching binding has `effect: allow` and no matching binding has `effect: deny`. See [How OpenChoreo RBAC determines access](./overview.md#how-openchoreo-rbac-determines-access) for the full algorithm.

:::note
If a condition expression cannot be evaluated cleanly at runtime, OpenChoreo treats it as failing closed — see [Fail-Closed Evaluation](./overview.md#fail-closed-evaluation).
:::

### Multiple Entries on the Same Mapping

A single role mapping can carry multiple `conditions` entries. Among the entries whose `actions` match the request action, the expressions are combined with **OR** — at least one entry must evaluate to `true` for the role mapping to permit the action:

```yaml
conditions:
  - actions: ["releasebinding:view"]
    expression: 'resource.environment == "dev"'
  - actions: ["releasebinding:view"]
    expression: 'resource.environment == "staging"'
```

This binding permits the `releasebinding:view` actions when the target environment is either `dev` or `staging`. Combining alternatives in one entry with CEL's `in` operator (`resource.environment in ["dev", "staging"]`) is equivalent and usually clearer.

## Examples

A platform engineer needs to give the `backend-team` group `developer` access — but with three safety rails: release-binding mutations must stay out of production, log access should be limited to `dev` and `staging`, and the team should only be able to create `service` and `cronjob` components. A single role mapping can carry all three rules, one condition per action group:

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
        - actions:
            - logs:view
          expression: 'resource.environment in ["acme/dev", "acme/staging"]'
        - actions:
            - component:create
          expression: 'resource.componentType in ["service", "cronjob"]'
  effect: allow
```

Read-only actions on `releasebinding` (e.g., `releasebinding:view`) and every other action in the `developer` role remain unrestricted — only the listed actions are gated. A `component:create` for any type other than the namespace-scoped `service` or `cronjob` (`acme/service`, `acme/cronjob`) fails its condition and is denied.

## Related Reading

- [Authorization Overview](./overview.md) — Subjects, scopes, actions, and the full evaluation model
- [Custom Roles and Bindings](./custom-roles.mdx) — Walkthrough of role and binding management in Backstage
- [AuthzRoleBinding API Reference](../../reference/api/platform/authzrolebinding.md) — Field reference for namespace-scoped role bindings
- [ClusterAuthzRoleBinding API Reference](../../reference/api/platform/clusterauthzrolebinding.md) — Field reference for cluster-scoped role bindings
