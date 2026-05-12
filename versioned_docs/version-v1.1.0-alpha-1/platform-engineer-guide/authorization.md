---
title: Authorization Configuration
description: Configure authorization settings, default roles, and subject types for OpenChoreo.
sidebar_position: 5
---

# Authorization Configuration

OpenChoreo includes a built-in authorization system that controls access to resources based on roles and bindings. This guide covers how to configure authorization settings, customize the default roles and mappings, and manage subject types through Helm values.

For an overview of how authorization works, see the [Authorization Overview](./authorization/overview.md).

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

## Subject Types

When creating a role binding, you need to specify **who** the binding applies to. This is done by selecting a subject type (e.g., "User" or "Service Account") and providing an identifier value. Each subject type maps to a specific JWT claim — for example, the "User" type maps to the `groups` claim, so entering `platform-team` as the identifier means the binding matches any JWT token where `groups` contains `platform-team`.

Subject types control:

- **What options appear** in the Access Control UI when creating role bindings (the "Select Subject" step in the wizard)
- **Which JWT claim** is used to match the identifier value against incoming tokens
- **How the identifier field is labeled** in the UI (e.g., "User Group" or "Client ID")

This configuration bridges the gap between your identity provider's JWT token structure and OpenChoreo's authorization system. If your identity provider uses different claims or you need additional subject categories, you can customize this to match.

### Configuration

Subject types must be configured in both the control plane and the observability plane Helm charts:

- **Control plane:** `openchoreoApi.config.security.subjects` in the `openchoreo-control-plane` chart
- **Observability plane:** `observer.security.subjectTypes` in the `openchoreo-observability-plane` chart

Both configurations must be kept in sync. The control plane configuration is shown below:

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

| Field                                     | Type    | Description                                                                                   |
| ----------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `display_name`                            | string  | Human-readable name shown in the UI                                                           |
| `priority`                                | integer | Subject type matching precedence — lower values are evaluated first during JWT authentication |
| `mechanisms.jwt.entitlement.claim`        | string  | The JWT claim that this subject type maps to                                                  |
| `mechanisms.jwt.entitlement.display_name` | string  | Label shown in the UI for the identifier input field                                          |

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

| Field     | Type    | Default | Description                               |
| --------- | ------- | ------- | ----------------------------------------- |
| `enabled` | boolean | `false` | Enable caching of authorization decisions |
| `ttl`     | string  | `"5m"`  | How long to cache authorization decisions |

## Policy Resync Interval

The authorization system maintains an in-memory policy store for fast evaluation. This store is kept in sync with Kubernetes CRDs through real-time watches — whenever a role or binding is created, updated, or deleted, the change is immediately reflected in memory. However, in rare cases (e.g., network disruptions or missed watch events), the in-memory store can drift from the actual CRD state. The resync interval acts as a safety net by periodically performing a full reload of all policies from the CRDs:

```yaml
openchoreoApi:
  config:
    security:
      authorization:
        resync_interval: "10m"
```

| Field             | Type   | Default | Description                                                                          |
| ----------------- | ------ | ------- | ------------------------------------------------------------------------------------ |
| `resync_interval` | string | `"10m"` | Interval for periodic full resync of authorization policies. Set to `"0"` to disable |

## Default Roles

OpenChoreo ships with several default cluster roles that are created automatically during installation. These roles are designed to cover common organizational personas and can be used as-is or as a starting point for customization.

:::warning
The `backstage-catalog-reader`, `rca-agent` (SRE Agent), `observer-resource-reader`, and `workload-publisher` roles and their bindings are required for internal integrations. Do not remove them unless you know what you are doing.
:::

### admin

Full access to all resources across all scopes. Intended for platform administrators.

```yaml
- name: admin
  actions:
    - "*"
```

### developer

Access for engineers who build, deploy, and iterate on components. Includes full CRUD on components, workloads, and observability read access, plus read-only access to all cluster- and namespace-scoped platform resources so developers can see the planes and pipelines their projects reference.

```yaml
- name: developer
  actions:
    - "clusterdataplane:view"
    - "clusterworkflowplane:view"
    - "clusterobservabilityplane:view"
    - "clustercomponenttype:view"
    - "clustertrait:view"
    - "clusterworkflow:view"
    - "namespace:view"
    - "environment:view"
    - "deploymentpipeline:view"
    - "dataplane:view"
    - "workflowplane:view"
    - "observabilityplane:view"
    - "componenttype:view"
    - "trait:view"
    - "workflow:view"
    - "project:view"
    - "component:view"
    - "component:create"
    - "component:update"
    - "component:delete"
    - "componentrelease:view"
    - "componentrelease:create"
    - "releasebinding:view"
    - "releasebinding:create"
    - "releasebinding:update"
    - "workflowrun:view"
    - "workflowrun:create"
    - "secretreference:view"
    - "secretreference:create"
    - "secretreference:update"
    - "secretreference:delete"
    - "workload:view"
    - "workload:create"
    - "workload:update"
    - "workload:delete"
    - "logs:view"
    - "metrics:view"
    - "traces:view"
    - "alerts:view"
    - "rcareport:view"
```

### sre

Access for operations engineers focused on reliability and incident response. Includes read-only access to components and releases, release binding management, observability and incident management, and read-only access to all cluster- and namespace-scoped platform resources.

```yaml
- name: sre
  actions:
    - "clusterdataplane:view"
    - "clusterworkflowplane:view"
    - "clusterobservabilityplane:view"
    - "clustercomponenttype:view"
    - "clustertrait:view"
    - "clusterworkflow:view"
    - "namespace:view"
    - "environment:view"
    - "deploymentpipeline:view"
    - "dataplane:view"
    - "workflowplane:view"
    - "observabilityplane:view"
    - "componenttype:view"
    - "trait:view"
    - "workflow:view"
    - "project:view"
    - "component:view"
    - "componentrelease:view"
    - "componentrelease:create"
    - "releasebinding:view"
    - "releasebinding:create"
    - "releasebinding:update"
    - "workflowrun:view"
    - "workflowrun:create"
    - "workload:view"
    - "workload:create"
    - "secretreference:view"
    - "secretreference:update"
    - "logs:view"
    - "metrics:view"
    - "traces:view"
    - "alerts:view"
    - "incidents:view"
    - "incidents:update"
    - "rcareport:view"
    - "rcareport:update"
```

### platform-engineer

Access for engineers managing OpenChoreo platform infrastructure. Includes full lifecycle management of environments, data planes, workflow planes, observability planes, deployment pipelines, and cluster-scoped resources.

```yaml
- name: platform-engineer
  actions:
    - "namespace:view"
    - "namespace:create"
    - "namespace:update"
    - "namespace:delete"
    - "project:view"
    - "project:create"
    - "project:update"
    - "project:delete"
    - "component:view"
    - "component:create"
    - "component:update"
    - "component:delete"
    - "componentrelease:view"
    - "componentrelease:create"
    - "releasebinding:view"
    - "releasebinding:create"
    - "releasebinding:update"
    - "releasebinding:delete"
    - "environment:view"
    - "environment:create"
    - "environment:update"
    - "environment:delete"
    - "dataplane:view"
    - "dataplane:create"
    - "dataplane:update"
    - "dataplane:delete"
    - "workflowplane:view"
    - "workflowplane:create"
    - "workflowplane:update"
    - "workflowplane:delete"
    - "observabilityplane:view"
    - "observabilityplane:create"
    - "observabilityplane:update"
    - "observabilityplane:delete"
    - "componenttype:view"
    - "componenttype:create"
    - "componenttype:update"
    - "componenttype:delete"
    - "trait:view"
    - "trait:create"
    - "trait:update"
    - "trait:delete"
    - "workflow:view"
    - "workflow:create"
    - "workflow:update"
    - "workflow:delete"
    - "workflowrun:view"
    - "workflowrun:create"
    - "deploymentpipeline:view"
    - "deploymentpipeline:create"
    - "deploymentpipeline:update"
    - "deploymentpipeline:delete"
    - "secretreference:view"
    - "secretreference:create"
    - "secretreference:update"
    - "secretreference:delete"
    - "workload:view"
    - "workload:create"
    - "workload:update"
    - "workload:delete"
    - "logs:view"
    - "metrics:view"
    - "traces:view"
    - "alerts:view"
    - "incidents:view"
    - "rcareport:view"
    - "rcareport:update"
    - "observabilityalertsnotificationchannel:view"
    - "observabilityalertsnotificationchannel:create"
    - "observabilityalertsnotificationchannel:update"
    - "observabilityalertsnotificationchannel:delete"
    - "clusterdataplane:view"
    - "clusterdataplane:create"
    - "clusterdataplane:update"
    - "clusterdataplane:delete"
    - "clusterworkflowplane:view"
    - "clusterworkflowplane:create"
    - "clusterworkflowplane:update"
    - "clusterworkflowplane:delete"
    - "clusterobservabilityplane:view"
    - "clusterobservabilityplane:create"
    - "clusterobservabilityplane:update"
    - "clusterobservabilityplane:delete"
    - "clustercomponenttype:view"
    - "clustercomponenttype:create"
    - "clustercomponenttype:update"
    - "clustercomponenttype:delete"
    - "clustertrait:view"
    - "clustertrait:create"
    - "clustertrait:update"
    - "clustertrait:delete"
    - "clusterworkflow:view"
    - "clusterworkflow:create"
    - "clusterworkflow:update"
    - "clusterworkflow:delete"
```

### cluster-reader

Read-only access to cluster-scoped platform resources (data planes, workflow planes, observability planes, component types, traits, and workflows at the cluster level). This is a supplementary role — see [Scoping Roles Below Cluster Level](#scoping-roles-below-cluster-level) for when to use it.

```yaml
- name: cluster-reader
  actions:
    - "clusterdataplane:view"
    - "clusterworkflowplane:view"
    - "clusterobservabilityplane:view"
    - "clustercomponenttype:view"
    - "clustertrait:view"
    - "clusterworkflow:view"
```

### namespace-reader

Read-only access to namespace-scoped platform resources (namespaces, environments, deployment pipelines, planes, component types, traits, and workflows at the namespace level). This is a supplementary role — see [Scoping Roles Below Cluster Level](#scoping-roles-below-cluster-level) for when to use it.

```yaml
- name: namespace-reader
  actions:
    - "namespace:view"
    - "environment:view"
    - "deploymentpipeline:view"
    - "dataplane:view"
    - "workflowplane:view"
    - "observabilityplane:view"
    - "componenttype:view"
    - "trait:view"
    - "workflow:view"
    - "secretreference:view"
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
    - "workload:view"
    - "workflowplane:view"
    - "clusterworkflowplane:view"
    - "workflow:view"
    - "deploymentpipeline:view"
    - "observabilityplane:view"
    - "clusterobservabilityplane:view"
    - "clusterdataplane:view"
    - "clustercomponenttype:view"
    - "clustertrait:view"
    - "clusterworkflow:view"
```

### rca-agent

Observability and component read access. Used by the SRE Agent service account for root cause analysis, troubleshooting, and debugging.

```yaml
- name: rca-agent
  actions:
    - "component:view"
    - "project:view"
    - "namespace:view"
    - "componentrelease:view"
    - "releasebinding:view"
    - "workflowrun:view"
    - "environment:view"
    - "workload:view"
    - "trait:view"
    - "logs:view"
    - "metrics:view"
    - "alerts:view"
    - "incidents:view"
    - "incidents:update"
    - "traces:view"
```

### workload-publisher

Minimal access for publishing workloads from CI workflows. Used by the workload publisher service account.

```yaml
- name: workload-publisher
  actions:
    - "workload:create"
    - "workload:update"
    - "workflowrun:view"
    - "workflowrun:update"
```

### observer-resource-reader

Read-only access to core resources needed for the observability plane. Used by the observer service account to read resource metadata from the control plane.

```yaml
- name: observer-resource-reader
  actions:
    - "component:view"
    - "project:view"
    - "namespace:view"
    - "environment:view"
```

## Default Role Bindings

The following default role bindings are created to connect the default roles to their intended subjects. The `admins`, `developers`, `platform-engineers`, and `sres` groups are also pre-created in the default identity provider(Thunder) with a sample user in each, giving you a quick way to experience the platform with different permission levels.

| Binding Name                       | Role                       | Entitlement                                      | Effect |
| ---------------------------------- | -------------------------- | ------------------------------------------------ | ------ |
| `admin-binding`                    | `admin`                    | `groups:admins`                                  | allow  |
| `developer-binding`                | `developer`                | `groups:developers`                              | allow  |
| `platform-engineer-binding`        | `platform-engineer`        | `groups:platform-engineers`                      | allow  |
| `sre-binding`                      | `sre`                      | `groups:sres`                                    | allow  |
| `backstage-catalog-reader-binding` | `backstage-catalog-reader` | `sub:openchoreo-backstage-client`                | allow  |
| `rca-agent-binding`                | `rca-agent`                | `sub:openchoreo-rca-agent`                       | allow  |
| `workload-publisher-binding`       | `workload-publisher`       | `sub:openchoreo-workload-publisher-client`       | allow  |
| `observer-resource-reader-binding` | `observer-resource-reader` | `sub:openchoreo-observer-resource-reader-client` | allow  |
| `mcp-tryout-client-binding`        | `admin`                    | `sub:service_mcp_client`                         | allow  |

## Scoping Roles Below Cluster Level

OpenChoreo's authorization hierarchy spans four levels: **Cluster → Namespace → Project → Component**. Permissions granted at a higher level cascade down, but permissions granted at a lower level do **not** grant access to resources at a higher level.

This matters when you assign a role at the namespace or project level: the user will only have access to resources within that scope and will not be able to see cluster-scoped resources such as `ClusterDataPlane`, `ClusterWorkflowPlane`, `ClusterObservabilityPlane`, `ClusterTrait`, and similar resources. These resources live at the cluster level and are not visible through a namespace-scoped binding alone.

For example, if a user needs `admin` access scoped to the `acme` namespace but also needs to see cluster-level resources, both can be expressed in a single `ClusterAuthzRoleBinding` using per-mapping `scope`:

```yaml
# Namespace-scoped admin + cluster-wide reader visibility in one CR
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

The `admin` mapping is scoped to the `acme` namespace, so it does not grant access to any other namespace. The `cluster-reader` mapping has no scope, so it grants read-only visibility into cluster-level resources (data planes, workflow planes, cluster traits, etc.) cluster-wide — exactly what is needed for the user to see the infrastructure their namespace depends on.

Similarly, if a user has a project-scoped role, they will also not see namespace-scoped resources (environments, deployment pipelines, namespace-level planes, etc.). In this case, add both `cluster-reader` and `namespace-reader` to the same binding:

```yaml
# Project-scoped role + namespace and cluster visibility in one CR
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterAuthzRoleBinding
metadata:
  name: acme-devs-binding
spec:
  entitlement:
    claim: groups
    value: acme-devs
  roleMappings:
    - roleRef:
        kind: ClusterAuthzRole
        name: developer
      scope:
        namespace: acme
        project: crm
    - roleRef:
        kind: ClusterAuthzRole
        name: namespace-reader
      scope:
        namespace: acme
    - roleRef:
        kind: ClusterAuthzRole
        name: cluster-reader
  effect: allow
```

The `cluster-reader` and `namespace-reader` roles exist precisely for this purpose — use them as supplementary role mappings whenever you assign roles below the cluster level and need cross-scope visibility.

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
            - name: admin
              actions:
                - "*"

            # Add your custom roles
            - name: viewer
              description: "Read-only access"
              actions:
                - "namespace:view"
                - "project:view"
                - "component:view"
```

### Adding a Custom Role Binding

Add entries to the `bootstrap.mappings` array. Use `kind` to select the binding type and `roleMappings[].scope` to narrow the scope:

```yaml
openchoreoApi:
  config:
    security:
      authorization:
        bootstrap:
          mappings:
            # Include the defaults you want to keep
            - name: admin-binding
              kind: ClusterAuthzRoleBinding
              roleMappings:
                - roleRef:
                    kind: ClusterAuthzRole
                    name: admin
              entitlement:
                claim: groups
                value: admins
              effect: allow

            # Add your custom bindings
            - name: dev-team-binding
              kind: ClusterAuthzRoleBinding
              roleMappings:
                - roleRef:
                    kind: ClusterAuthzRole
                    name: developer
                  scope:
                    namespace: acme
              entitlement:
                claim: groups
                value: dev-team
              effect: allow

            # Namespace-scoped binding with project scope
            - name: dev-team-crm-only
              kind: AuthzRoleBinding
              namespace: acme
              roleMappings:
                - roleRef:
                    kind: AuthzRole
                    name: developer
                  scope:
                    project: crm
              entitlement:
                claim: groups
                value: crm-team
              effect: allow
```

### Bootstrap Mapping Fields

| Field                            | Type   | Required | Description                                                             |
| -------------------------------- | ------ | -------- | ----------------------------------------------------------------------- |
| `name`                           | string | Yes      | Binding name                                                            |
| `kind`                           | string | No       | `ClusterAuthzRoleBinding` (default) or `AuthzRoleBinding`               |
| `namespace`                      | string | No       | Namespace for the binding. Required when `kind` is `AuthzRoleBinding`   |
| `roleMappings[].roleRef.kind`    | string | Yes      | `ClusterAuthzRole` or `AuthzRole`                                       |
| `roleMappings[].roleRef.name`    | string | Yes      | Name of the role to bind                                                |
| `roleMappings[].scope.namespace` | string | No       | Namespace scope (`ClusterAuthzRoleBinding` only). Omit for cluster-wide |
| `roleMappings[].scope.project`   | string | No       | Project scope (requires `namespace` for cluster bindings)               |
| `roleMappings[].scope.component` | string | No       | Component scope (requires `project`)                                    |
| `entitlement.claim`              | string | Yes      | JWT claim name (e.g., `groups`, `sub`, `email`)                         |
| `entitlement.value`              | string | Yes      | JWT claim value to match                                                |
| `effect`                         | string | Yes      | `allow` or `deny`                                                       |

:::important
When you override the `bootstrap.roles` or `bootstrap.mappings` arrays, the entire array is replaced. Make sure to include any default roles or bindings you want to keep.
:::

## Verification

After configuring authorization, verify the setup:

1. **Check that authorization is enabled** in the API logs:

   ```bash
   kubectl logs <openchoreo-api-pod> -n openchoreo-control-plane --tail=50 | grep -i authz
   ```

2. **Verify default roles were created:**

   ```bash
   kubectl get clusterauthzroles
   ```

3. **Verify default bindings were created:**

   ```bash
   kubectl get clusterauthzrolebindings
   ```

4. **Test access** by logging into Backstage and navigating to **Access Control** to confirm roles and bindings appear correctly.

## See Also

- [Authorization Overview](./authorization/overview.md) — How authorization works in OpenChoreo
- [Custom Roles and Bindings](./authorization/custom-roles.mdx) — Creating roles and bindings via the UI
- [Identity Provider Configuration](./identity-configuration.mdx) — Configure authentication and identity providers
