---
title: ProjectType API Reference
description: Platform template defining the project-scoped infrastructure materialized in each environment's cell namespace
---

# ProjectType

A ProjectType is the platform-engineer-defined infrastructure template for a project. It declares the namespace-scoped Kubernetes resources (the cell namespace itself, NetworkPolicies, ResourceQuotas, baseline RBAC, ImagePullSecrets) that the platform materializes in every environment a project is deployed to, along with the schemas for project-level parameters and per-environment overrides.

Developers reference a ProjectType from [`Project.spec.type`](../application/project.md). The Project controller inlines the type's spec into every [ProjectRelease](../runtime/projectrelease.md) it cuts, and each [ProjectReleaseBinding](./projectreleasebinding.md) renders the inlined templates for its environment.

For the cluster-scoped variant, see [ClusterProjectType](./clusterprojecttype.md).

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ProjectTypes are namespace-scoped resources. Projects in the same namespace reference them by name.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ProjectType
metadata:
  name: <project-type-name>
  namespace: <namespace>
```

**Short names:** `pt`, `pts`

### Spec Fields

| Field                | Type                                    | Required | Default | Description                                                                                                                |
| -------------------- | --------------------------------------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `parameters`         | [SchemaSection](#schemasection)         | No       | -       | Schema for the values project authors supply on `Project.spec.parameters`                                                  |
| `environmentConfigs` | [SchemaSection](#schemasection)         | No       | -       | Schema for the per-environment values supplied on `ProjectReleaseBinding.spec.environmentConfigs`                          |
| `validations`        | [[ValidationRule](#validationrule)]     | No       | -       | CEL rules evaluated during rendering; all must evaluate to true for rendering to proceed                                   |
| `resources`          | [[ResourceTemplate](#resourcetemplate)] | Yes      | -       | Namespace-scoped manifest templates applied to the cell namespace (min: 1). Must include the mandated `v1/Namespace` entry |

:::note
The rendered output of `resources` must include a `v1/Namespace` object whose `metadata.name` is the literal `${metadata.namespace}` placeholder. The check runs against the rendered output, so an `includeWhen` that suppresses the entry also fails it. A missing namespace surfaces on the binding as `Synced=False` with reason `NamespaceMissing`.
:::

### SchemaSection

| Field             | Type   | Required | Description                                                                                                      |
| ----------------- | ------ | -------- | ---------------------------------------------------------------------------------------------------------------- |
| `openAPIV3Schema` | object | No       | Schema in standard OpenAPI V3 / JSON Schema format, with support for defaults, enums, and validation constraints |

### ValidationRule

| Field     | Type   | Required | Description                                                                                                           |
| --------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------- |
| `rule`    | string | Yes      | A CEL expression wrapped in `${...}` that must evaluate to true. Has access to the same context as resource templates |
| `message` | string | Yes      | Error message surfaced when the rule evaluates to false (min: 1)                                                      |

### ResourceTemplate

| Field         | Type   | Required | Default     | Description                                                                                                                         |
| ------------- | ------ | -------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | string | Yes      | -           | Unique identifier for this entry within the type (min: 1)                                                                           |
| `template`    | object | Yes      | -           | The Kubernetes manifest with `${...}` CEL expressions evaluated at render time                                                      |
| `includeWhen` | string | No       | -           | Boolean CEL expression wrapped in `${...}`; when false, the entry is omitted and any previously applied object is garbage-collected |
| `forEach`     | string | No       | -           | CEL expression wrapped in `${...}` yielding a list to iterate over; generates one object per item                                   |
| `var`         | string | No       | -           | Loop variable name for `forEach` (required when `forEach` is set)                                                                   |
| `targetPlane` | string | No       | `dataplane` | Target plane for the rendered object: `dataplane` or `observabilityplane`                                                           |

Templates have access to `${metadata.*}`, `${parameters.*}`, `${environmentConfigs.*}`, `${environment.*}`, `${dataplane.*}`, and `${gateway.*}`. See the [Authoring ProjectTypes guide](../../../platform-engineer-guide/project-types.md#cel-surface-for-project-templates) for the full CEL surface.

### Status Fields

ProjectType does not report status fields. Schema validation failures surface on the referencing Project, and rendering or validation failures surface on the ProjectReleaseBinding's `status.conditions`.

## Examples

### Minimal ProjectType

The smallest valid ProjectType carries only the mandated cell-namespace entry:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ProjectType
metadata:
  name: minimal
  namespace: default
spec:
  resources:
    - id: cell-namespace
      template:
        apiVersion: v1
        kind: Namespace
        metadata:
          name: ${metadata.namespace}
          labels: ${metadata.labels}
```

### ProjectType With Quotas and Policies

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ProjectType
metadata:
  name: quota-managed
  namespace: default
spec:
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
  validations:
    - rule: "${environmentConfigs.cpuQuota.matches('^[0-9]+$')}"
      message: "cpuQuota must be an integer string"
  resources:
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
```

## Usage

```bash
# List project types in a namespace
kubectl get pt -n default
occ projecttype list

# Inspect a project type
kubectl describe projecttype quota-managed -n default
occ projecttype get quota-managed

# Create or update from a manifest
occ apply -f projecttype.yaml
```

## Best Practices

1. Always propagate `${metadata.labels}` onto every rendered object so data-plane objects carry consistent platform labels
2. Set `metadata.namespace: ${metadata.namespace}` on every non-namespace entry so all objects land in the cell namespace
3. Keep developer-facing choices in `parameters` and operational per-environment knobs in `environmentConfigs`
4. Use `validations` for cross-field constraints the schema cannot express
5. Prefer a ClusterProjectType for templates intended to be shared platform-wide

## Related Resources

- [ClusterProjectType](./clusterprojecttype.md): cluster-scoped variant
- [Project](../application/project.md): references the type through `spec.type`
- [ProjectRelease](../runtime/projectrelease.md): immutable snapshot that inlines the type spec
- [ProjectReleaseBinding](./projectreleasebinding.md): renders the inlined type per environment
- [Authoring ProjectTypes (PE Guide)](../../../platform-engineer-guide/project-types.md)
