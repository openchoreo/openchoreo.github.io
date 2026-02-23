---
title: Authorization Configuration
description: Configure authorization settings, default roles, and subject types for OpenChoreo.
sidebar_position: 5
---

# Authorization Configuration

OpenChoreo includes a built-in authorization system that controls access to resources based on roles and bindings. This guide covers how to configure authorization settings, customize the default roles and mappings, and manage subject types through Helm values.

For an overview of how authorization works, see the [Authorization User Guide](../user-guide/authorization/overview.md).

## Enabling and Disabling Authorization

Authorization is enabled by default. To disable it (e.g., for development or testing), set the following Helm value:

```yaml
security:
  authz:
    enabled: false
```

When disabled, all requests are allowed without any policy evaluation.

:::warning
Disabling authorization removes all access control. Only disable it in development or testing environments.
:::

## Authorization Cache

Authorization decisions can be cached to improve performance. By default, caching is disabled.

```yaml
openchoreoApi:
  config:
    security:
      authorization:
        cache:
          enabled: false
          ttl: "5m"
```

| Field     | Type    | Default | Description                                   |
|-----------|---------|---------|-----------------------------------------------|
| `enabled` | boolean | `false` | Enable caching of authorization decisions      |
| `ttl`     | string  | `"5m"`  | How long to cache authorization decisions      |

## Policy Resync Interval

The authorization system maintains an in-memory policy store for fast evaluation. This store is kept in sync with Kubernetes CRDs through real-time watches — whenever a role or binding is created, updated, or deleted, the change is immediately reflected in memory. However, in rare cases (e.g., network disruptions or missed watch events), the in-memory store can drift from the actual CRD state. The resync interval acts as a safety net by periodically performing a full reload of all policies from the CRDs:

```yaml
openchoreoApi:
  config:
    security:
      authorization:
        resync_interval: "10m"
```

| Field              | Type   | Default  | Description                                                                 |
|--------------------|--------|----------|-----------------------------------------------------------------------------|
| `resync_interval`  | string | `"10m"`  | Interval for periodic full resync of authorization policies. Set to `"0"` to disable |

## Default Roles

OpenChoreo ships with three default cluster roles that are created automatically during installation:

:::warning
The `backstage-catalog-reader` and `rca-agent` roles and their bindings are required for internal integrations. Do not remove them unless you know what you are doing — removing them will break the Backstage catalog and RCA agent functionality.
:::

### super-admin

Full access to all resources. Intended for platform administrators.

```yaml
- name: super-admin
  actions:
    - "*"
```

### backstage-catalog-reader

Read-only access to catalog data. Used by the Backstage service account to read resources from the control plane.

```yaml
- name: backstage-catalog-reader
  actions:
    - "component:view"
    - "componenttype:view"
    - "namespace:view"
    - "project:view"
    - "dataplane:view"
    - "environment:view"
    - "trait:view"
    - "buildplane:view"
    - "componentworkflow:view"
    - "workflow:view"
    - "deploymentpipeline:view"
    - "observabilityplane:view"
```

### rca-agent

Observability and component read access. Used by the RCA (Root Cause Analysis) agent service account for troubleshooting and debugging.

```yaml
- name: rca-agent
  actions:
    - "component:view"
    - "project:view"
    - "namespace:view"
    - "componentrelease:view"
    - "releasebinding:view"
    - "componentworkflowrun:view"
    - "environment:view"
    - "logs:view"
    - "metrics:view"
    - "alerts:view"
    - "traces:view"
```

## Default Role Bindings

Three default role bindings are created to connect the default roles to their intended subjects:

| Binding Name | Role | Entitlement | Effect |
|---|---|---|---|
| `super-admin-binding` | `super-admin` | `groups:platformEngineer` | allow |
| `backstage-catalog-reader-binding` | `backstage-catalog-reader` | `sub:openchoreo-backstage-client` | allow |
| `rca-agent-binding` | `rca-agent` | `sub:openchoreo-rca-agent` | allow |

## Customizing Bootstrap Roles and Bindings

You can add, modify, or remove the default roles and bindings by overriding the bootstrap configuration in your Helm values.

### Adding a Custom Role

Add entries to the `bootstrap.roles` array. Omit `namespace` to create a cluster-scoped role, or specify it to create a namespace-scoped role:

```yaml
openchoreoApi:
  config:
    security:
      authorization:
        bootstrap:
          roles:
            # Include the defaults you want to keep
            - name: super-admin
              actions:
                - "*"

            # Add your custom roles
            - name: developer
              namespace: acme
              description: "Developer access"
              actions:
                - "component:*"
                - "project:view"
                - "workflow:view"

            - name: viewer
              description: "Read-only access"
              actions:
                - "namespace:view"
                - "project:view"
                - "component:view"
```

### Adding a Custom Role Binding

Add entries to the `bootstrap.mappings` array. Use the `hierarchy` field to scope namespace-level bindings:

```yaml
openchoreoApi:
  config:
    security:
      authorization:
        bootstrap:
          mappings:
            # Include the defaults you want to keep
            - name: super-admin-binding
              roleRef:
                name: super-admin
              entitlement:
                claim: groups
                value: platformEngineer
              effect: allow

            # Add your custom bindings
            - name: dev-team-binding
              roleRef:
                name: developer
                namespace: acme
              entitlement:
                claim: groups
                value: dev-team
              effect: allow
              hierarchy:
                namespace: acme

            - name: dev-team-crm-only
              roleRef:
                name: developer
                namespace: acme
              entitlement:
                claim: groups
                value: crm-team
              effect: allow
              hierarchy:
                namespace: acme
                project: crm
```

### Bootstrap Mapping Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Binding name |
| `roleRef.name` | string | Yes | Name of the role to bind |
| `roleRef.namespace` | string | No | Role namespace. Omit for cluster roles |
| `entitlement.claim` | string | Yes | JWT claim name (e.g., `groups`, `sub`, `email`) |
| `entitlement.value` | string | Yes | JWT claim value to match |
| `effect` | string | Yes | `allow` or `deny` |
| `hierarchy.namespace` | string | No | Namespace scope. Omit for cluster-wide binding |
| `hierarchy.project` | string | No | Project scope (requires `namespace`) |
| `hierarchy.component` | string | No | Component scope (requires `namespace` and `project`) |

:::important
When you override the `bootstrap.roles` or `bootstrap.mappings` arrays, the entire array is replaced. Make sure to include any default roles or bindings you want to keep.
:::

## Subject Types

When creating a role binding, you need to specify **who** the binding applies to. This is done by selecting a subject type (e.g., "User" or "Service Account") and providing an identifier value. Each subject type maps to a specific JWT claim — for example, the "User" type maps to the `groups` claim, so entering `platform-team` as the identifier means the binding matches any JWT token where `groups` contains `platform-team`.

Subject types control:
- **What options appear** in the Access Control UI when creating role bindings (the "Select Subject" step in the wizard)
- **Which JWT claim** is used to match the identifier value against incoming tokens
- **How the identifier field is labeled** in the UI (e.g., "User Group" or "Client ID")

This configuration bridges the gap between your identity provider's JWT token structure and OpenChoreo's authorization system. If your identity provider uses different claims or you need additional subject categories, you can customize this to match.

### Configuration

Subject types are configured under the `openchoreoApi.config.security.subjects` Helm value:

```yaml
openchoreoApi:
  config:
    security:
      subjects:
        user:
          display_name: "User"
          priority: 1
          mechanisms:
            jwt:
              entitlement:
                claim: "groups"
                display_name: "User Group"
        service_account:
          display_name: "Service Account"
          priority: 2
          mechanisms:
            jwt:
              entitlement:
                claim: "sub"
                display_name: "Client ID"
```

In the example above:
- A binding created with subject type **User** and identifier `platform-team` will match any request where the JWT `groups` claim contains `platform-team`
- A binding created with subject type **Service Account** and identifier `openchoreo-backstage-client` will match any request where the JWT `sub` claim equals `openchoreo-backstage-client`

### Fields

| Field | Type | Description |
|---|---|---|
| `display_name` | string | Human-readable name shown in the UI |
| `priority` | integer | Display order in the UI (lower = first) |
| `mechanisms.jwt.entitlement.claim` | string | The JWT claim that this subject type maps to |
| `mechanisms.jwt.entitlement.display_name` | string | Label shown in the UI for the identifier input field |

### Customizing Subject Configuration

You can modify any part of the subject configuration — change display names, reorder priorities, update claim mappings, or add entirely new subject types to match your identity provider. For example, if your identity provider issues tokens with a `roles` claim (e.g., `"roles": ["admin", "developer"]`) instead of `groups`, you can update the "User" subject type to map to it:

```yaml
openchoreoApi:
  config:
    security:
      subjects:
        user:
          display_name: "User"
          priority: 1
          mechanisms:
            jwt:
              entitlement:
                claim: "roles"
                display_name: "User Role"
        service_account:
          display_name: "Service Account"
          priority: 2
          mechanisms:
            jwt:
              entitlement:
                claim: "sub"
                display_name: "Client ID"
```

In this example, the "User" subject type now maps to the `roles` claim instead of `groups`, and the identifier input field in the UI is labeled "User Role" instead of "User Group". When creating a role binding with subject type "User" and identifier `admin`, it will match any JWT token where the `roles` claim contains `admin`.

## Verification

After configuring authorization, verify the setup:

1. **Check that authorization is enabled** in the API logs:

   ```bash
   kubectl logs <openchoreo-api-pod> -n openchoreo-control-plane --tail=50 | grep -i authz
   ```

2. **Verify default roles were created:**

   ```bash
   kubectl get authzclusterroles
   ```

3. **Verify default bindings were created:**

   ```bash
   kubectl get authzclusterrolebindings
   ```

4. **Test access** by logging into Backstage and navigating to **Access Control** to confirm roles and bindings appear correctly.

## See Also

- [Authorization Overview](../user-guide/authorization/overview.md) — How authorization works in OpenChoreo
- [Custom Roles and Bindings](../user-guide/authorization/custom-roles.mdx) — Creating roles and bindings via the UI
- [Identity Provider Configuration](./identity-configuration.mdx) — Configure authentication and identity providers
