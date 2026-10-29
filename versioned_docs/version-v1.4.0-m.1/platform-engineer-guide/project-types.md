---
title: Authoring ProjectTypes
description: Learn how to author ProjectTypes and ClusterProjectTypes in OpenChoreo
---

# Authoring ProjectTypes

This guide covers how to create custom [ProjectTypes](../reference/api/platform/projecttype.md) and [ClusterProjectTypes](../reference/api/platform/clusterprojecttype.md) in OpenChoreo. A ProjectType is the platform-engineer-defined infrastructure template for a project: it declares the namespace-scoped Kubernetes resources the platform materializes in every environment the project is deployed to.

## What is a ProjectType?

A ProjectType plays the same role for project-scoped infrastructure that a ComponentType plays for code components and a ResourceType plays for managed infrastructure. Components and Resources describe things owned by a single deployable unit. A ProjectType describes what is shared by everything in a project within one environment: the data-plane namespace itself, NetworkPolicies, ResourceQuotas, baseline RBAC, ImagePullSecrets, and similar cross-cutting concerns.

Before project types, this shared infrastructure had no proper home. It had to be carried by a ComponentType's resource templates or a Trait, tying it to whichever component happened to include it. A ProjectType gives project-scoped infrastructure its own template, its own release lifecycle, and an explicit owner for the namespace.

Platform engineers use ProjectTypes to:

- Own the cell namespace (`dp-{ns}-{project}-{env}-{hash}`) for each project and environment pair
- Seed every cell namespace with baseline policies: default-deny NetworkPolicies, ResourceQuotas, RBAC, ImagePullSecrets
- Define what project authors can configure through a `parameters` schema
- Define per-environment knobs through an `environmentConfigs` schema
- Enforce invariants with CEL validation rules

Developers reference a ProjectType from `Project.spec.type` and supply parameter values. The Project controller cuts an immutable [ProjectRelease](../reference/api/runtime/projectrelease.md) that inlines the type's spec at that point in time, and each [ProjectReleaseBinding](../reference/api/platform/projectreleasebinding.md) renders the inlined templates per environment and applies the result to the data plane.

OpenChoreo ships a minimal `default` ClusterProjectType (under `samples/getting-started/cluster-project-types/`) that provisions only the cell namespace. When a project is created through the OpenChoreo API or the Backstage UI without an explicit type, it defaults to this ClusterProjectType. Projects applied directly with `kubectl` must set `spec.type` themselves, since the field is required on the CRD.

### ClusterProjectType

A **ClusterProjectType** is the cluster-scoped variant of ProjectType. Use it for templates intended to be shared platform-wide; namespace-scoped ProjectTypes are available when a template should only be visible within a specific namespace.

ClusterProjectTypes share the same spec structure as ProjectTypes; only scope differs.

**Key concepts:**

- `parameters` / `environmentConfigs`: define what project authors can configure on the Project, and what bindings can override per environment
- `validations`: CEL rules evaluated during rendering; all must pass for rendering to proceed
- `resources`: namespace-scoped Kubernetes manifest templates applied to the cell namespace (rendered through CEL)

## The Namespace Mandate

Every ProjectType's `spec.resources` must include a `v1/Namespace` entry whose `metadata.name` is the literal `${metadata.namespace}` placeholder. This is the cell namespace: the data-plane namespace where all of the project's components and resources run for a given environment. Making it a mandated template entry, rather than an implicit side effect, is what gives the namespace an explicit owner (the ProjectReleaseBinding) and a lifecycle tied to the project and environment rather than to whichever component deployed first.

```yaml
resources:
  - id: cell-namespace
    template:
      apiVersion: v1
      kind: Namespace
      metadata:
        name: ${metadata.namespace}
        labels: ${metadata.labels}
```

The mandate is enforced against the rendered output, not the spec. If the entry is missing, or an `includeWhen` guard suppresses it, the binding reports `Synced=False` with reason `NamespaceMissing` and nothing is applied.

## ProjectType Example

The example below defines a `standard-project` ClusterProjectType that owns the cell namespace, applies a default-deny-egress NetworkPolicy, and adds a conditional egress exception driven by a per-environment override.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterProjectType
metadata:
  name: standard-project
spec:
  # Project-author-facing values; captured in the ProjectRelease snapshot.
  parameters:
    openAPIV3Schema:
      type: object
      properties:
        tier:
          type: string
          enum: [standard, premium]
          default: standard

  # Per-environment overrides applied through ProjectReleaseBinding.
  environmentConfigs:
    openAPIV3Schema:
      type: object
      properties:
        cpuQuota:
          type: string
          default: "4"
        memoryQuota:
          type: string
          default: "8Gi"
        allowMonitoringEgress:
          type: boolean
          default: false

  # CEL rules evaluated during rendering. All must be true.
  validations:
    - rule: "${environmentConfigs.cpuQuota.matches('^[0-9]+$')}"
      message: 'cpuQuota must be an integer string (e.g. "4", "8")'

  resources:
    # Mandated cell-namespace entry. metadata.name MUST be the literal
    # ${metadata.namespace} placeholder.
    - id: cell-namespace
      template:
        apiVersion: v1
        kind: Namespace
        metadata:
          name: ${metadata.namespace}
          labels: ${metadata.labels}

    - id: resource-quota
      template:
        apiVersion: v1
        kind: ResourceQuota
        metadata:
          name: project-quota
          namespace: ${metadata.namespace}
          labels: ${metadata.labels}
        spec:
          hard:
            limits.cpu: ${environmentConfigs.cpuQuota}
            limits.memory: ${environmentConfigs.memoryQuota}

    - id: default-deny-egress
      template:
        apiVersion: networking.k8s.io/v1
        kind: NetworkPolicy
        metadata:
          name: default-deny-egress
          namespace: ${metadata.namespace}
          labels: ${metadata.labels}
        spec:
          podSelector: {}
          policyTypes: [Egress]
          egress: []

    # Conditional entry, included only when the per-env override flips
    # allowMonitoringEgress to true.
    - id: allow-monitoring-egress
      includeWhen: "${environmentConfigs.allowMonitoringEgress}"
      template:
        apiVersion: networking.k8s.io/v1
        kind: NetworkPolicy
        metadata:
          name: allow-monitoring-egress
          namespace: ${metadata.namespace}
          labels: ${metadata.labels}
        spec:
          podSelector: {}
          policyTypes: [Egress]
          egress:
            - to:
                - namespaceSelector:
                    matchLabels:
                      name: monitoring
```

Every non-namespace entry sets its own `metadata.namespace` from `${metadata.namespace}`, so all rendered objects land in the cell namespace the same template creates.

## Parameters and EnvironmentConfigs

ProjectTypes use the same two-schema approach as ComponentTypes and ResourceTypes:

**Parameters** capture values supplied by the project author on `Project.spec.parameters`. They are validated against the `parameters` schema and inlined into every ProjectRelease snapshot, so the same values apply wherever that release is deployed. Changing a parameter on the Project cuts a new release; existing releases are never modified.

**EnvironmentConfigs** capture per-environment values supplied on `ProjectReleaseBinding.spec.environmentConfigs`. They are validated against the schema on the pinned release by the binding controller, and validation failures surface through the binding's `status.conditions`. Because they live on the binding, the same release deployed to dev and production can use different quotas, labels, or feature flips while the snapshot itself is unchanged.

Both schemas use standard [OpenAPI V3 JSON Schema](https://swagger.io/specification/) (`openAPIV3Schema`) with support for defaults, enums, and validation constraints.

## Validations

The `validations` section holds CEL rules evaluated during rendering. Each rule is a `${...}`-wrapped boolean expression paired with an error message:

```yaml
validations:
  - rule: "${environmentConfigs.cpuQuota.matches('^[0-9]+$')}"
    message: "cpuQuota must be an integer string"
```

All rules must evaluate to true for rendering to proceed. Rules have access to the same CEL context as resource templates, so they can validate combinations across `parameters` and `environmentConfigs` that a plain schema cannot express. A failing rule blocks the render and surfaces the message on the binding's conditions.

See [Validation Rules](./component-types/validation-rules.md) for the shared syntax.

## CEL Surface for Project Templates

Resource templates, `includeWhen` guards, and validation rules have access to the following CEL context:

| Context                | Description                                                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `metadata.*`           | Platform-injected surface: `namespace` (the cell namespace), `projectNamespace`, `projectName`, `environmentName`, `dataPlaneName`, project/environment/data-plane UIDs, `labels`, `annotations` |
| `parameters.*`         | Values from `Project.spec.parameters` after schema defaulting, as captured in the pinned ProjectRelease                                                                                          |
| `environmentConfigs.*` | Values from `ProjectReleaseBinding.spec.environmentConfigs` after schema defaulting                                                                                                              |
| `environment.*`        | Per-environment surface, including the merged effective gateway for this environment                                                                                                             |
| `dataplane.*`          | Target DataPlane attributes                                                                                                                                                                      |
| `gateway.*`            | Effective gateway (Environment-level override merged onto the DataPlane-level default)                                                                                                           |

A few notes:

- `${metadata.namespace}` is the platform-computed `dp-{ns}-{project}-{env}-{hash}` cell namespace. The mandated Namespace entry uses it as `metadata.name`; every other entry uses it as `metadata.namespace`.
- Templates that may evaluate against a missing gateway must guard with `has(environment.gateway)`; `has(gateway)` is invalid CEL because the top-level alias is omitted when no gateway is configured.
- There is no `applied.*` context and no `readyWhen` or `outputs` on project types. Readiness of the rendered objects is evaluated through the per-Kind health heuristics in `RenderedRelease` and surfaces on the binding's `ResourcesReady` condition.

## includeWhen and forEach

Each resource template entry supports the same conditional and iterative fields as ComponentTypes:

**`includeWhen`** is a boolean CEL expression evaluated at render time. When it returns `false`, the entry is omitted from the rendered output and any previously applied object is garbage-collected from the data plane. Do not guard the mandated Namespace entry; a suppressed namespace trips the `NamespaceMissing` check.

**`forEach`** iterates over a list to generate multiple objects from one template, with `var` naming the loop variable. Useful for emitting one object per item in a list-typed parameter, for example a NetworkPolicy per allowed egress target.

## How Developers Consume a ProjectType

Project authors reference the type from `Project.spec.type` and supply parameter values that conform to the declared schema:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Project
metadata:
  name: online-store
  namespace: default
spec:
  deploymentPipelineRef:
    name: default
  type:
    kind: ClusterProjectType
    name: standard-project
  parameters:
    tier: premium
```

`spec.type` is immutable: a project cannot be re-targeted to a different type after creation. The Project controller cuts a ProjectRelease named `<project>-<hash>` whenever the inlined type snapshot or the parameter values change, and records the newest one on `status.latestRelease`.

Each environment gets one ProjectReleaseBinding, which carries the per-environment values:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ProjectReleaseBinding
metadata:
  name: online-store-production
  namespace: default
spec:
  owner:
    projectName: online-store
  environment: production
  projectRelease: online-store-a1b2c3d4
  environmentConfigs:
    cpuQuota: "16"
    memoryQuota: "32Gi"
```

The binding controller creates the cell namespace, applies the rendered project-type resources to it, and reports readiness through `status.conditions`. Components and resources belonging to the project deploy into that namespace and wait for it to exist. See the [Project Releases developer guide](../developer-guide/deploying-applications/project-releases.md) for the binding and promotion workflow.

## Syntax Systems

ProjectTypes reuse the same syntax systems documented in the Component Types guide:

| Syntax                                                    | Purpose                                        | Used In                                                               |
| --------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------- |
| [Templating](./component-types/templating-syntax.md)      | Dynamic value generation using CEL expressions | `resources[].template`, `includeWhen`, `forEach`                      |
| [Schema](./component-types/schema-syntax.md)              | Parameter validation and defaults              | `parameters.openAPIV3Schema` and `environmentConfigs.openAPIV3Schema` |
| [Validation Rules](./component-types/validation-rules.md) | Cross-field CEL validation                     | `validations[]`                                                       |

Patching (Trait-only) and outputs (ResourceType-only) do not apply to ProjectTypes.

## CEL Reference

- **[Context Variables](../reference/cel/context-variables.md)**: `metadata`, `parameters`, `environmentConfigs`, `environment`, `dataplane`, `gateway`
- **[Built-in Functions](../reference/cel/built-in-functions.md)**: `oc_omit()`, `oc_merge()`, `oc_generate_name()`, `oc_dns_label()`

## Next Steps

- **[Project Releases (developer guide)](../developer-guide/deploying-applications/project-releases.md)**: how releases are cut, bound to environments, and promoted

## Related Resources

- [ProjectType API Reference](../reference/api/platform/projecttype.md): full CRD specification
- [ClusterProjectType API Reference](../reference/api/platform/clusterprojecttype.md): cluster-scoped variant
- [ProjectRelease API Reference](../reference/api/runtime/projectrelease.md): immutable snapshot
- [ProjectReleaseBinding API Reference](../reference/api/platform/projectreleasebinding.md): per-environment binding
- [Project API Reference](../reference/api/application/project.md): developer-facing CRD
