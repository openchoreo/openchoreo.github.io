---
title: ResourceReleaseBinding API Reference
description: Binds a ResourceRelease to an environment and carries per-environment configuration overrides
---

# ResourceReleaseBinding

A ResourceReleaseBinding pins a specific [ResourceRelease](../runtime/resourcerelease.md) to an [Environment](./environment.md) and carries per-environment overrides for the referenced ResourceType template. It is the resource-side counterpart of [ReleaseBinding](./releasebinding.md): platform engineers (or GitOps tooling) author one binding per Resource per environment to control rollout and retention.

The Resource controller never creates or modifies ResourceReleaseBindings. The `spec.resourceRelease` pin is advanced manually—through `occ resource promote`, `kubectl edit`, or a GitOps commit.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ResourceReleaseBindings are namespace-scoped resources created in the same namespace as the Resource they deploy.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ResourceReleaseBinding
metadata:
  name: <resource-name>-<environment-name>
  namespace: <namespace>
```

**Short names:** `rrb`, `rrbs`

### Spec Fields

| Field                            | Type                                                        | Required | Default | Description                                                                                                                             |
| -------------------------------- | ----------------------------------------------------------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `owner`                          | [ResourceReleaseBindingOwner](#resourcereleasebindingowner) | Yes      | -       | Identifies the Resource this binding deploys (immutable)                                                                                |
| `environment`                    | string                                                      | Yes      | -       | Name of the target Environment (immutable; must match an existing Environment in the namespace)                                         |
| `resourceRelease`                | string                                                      | No       | -       | Name of the ResourceRelease pinned by this binding. Unset until promoted; the binding stays pending without it                          |
| `retainPolicy`                   | string                                                      | No       | -       | Per-environment override for retention. When unset, falls back to the ResourceType's `retainPolicy` (which itself defaults to `Delete`) |
| `resourceTypeEnvironmentConfigs` | object                                                      | No       | -       | Per-environment values for the referenced ResourceType's `environmentConfigs` schema. Validated by the binding controller               |

:::note
`owner` and `environment` are immutable after creation. To re-target a binding, delete and recreate it.
:::

### ResourceReleaseBindingOwner

Identifies the Resource this binding deploys.

| Field          | Type   | Required | Description                                         |
| -------------- | ------ | -------- | --------------------------------------------------- |
| `projectName`  | string | Yes      | Name of the project that owns the Resource (min: 1) |
| `resourceName` | string | Yes      | Name of the Resource (min: 1)                       |

### Status Fields

| Field        | Type                                                | Default | Description                                                                                    |
| ------------ | --------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `conditions` | []Condition                                         | []      | Standard Kubernetes conditions tracking binding state                                          |
| `outputs`    | [[ResolvedResourceOutput](#resolvedresourceoutput)] | []      | Resolved output values populated by the binding controller from the underlying RenderedRelease |

#### ResolvedResourceOutput

Each entry corresponds to a single output declared on the referenced ResourceType. Picks exactly one of `value`, `secretKeyRef`, or `configMapKeyRef`—matching the source kind on the ResourceType.

| Field             | Type                                                 | Required | Description                                                                                  |
| ----------------- | ---------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `name`            | string                                               | Yes      | Output name; matches the declared output on the ResourceType (min: 1)                        |
| `value`           | string                                               | No       | Resolved literal value (for `value`-kind outputs)                                            |
| `secretKeyRef`    | [SecretKeyRef](./resourcetype.md#secretkeyref)       | No       | Resolved `{name, key}` reference to a DP-side Secret (for `secretKeyRef`-kind outputs)       |
| `configMapKeyRef` | [ConfigMapKeyRef](./resourcetype.md#configmapkeyref) | No       | Resolved `{name, key}` reference to a DP-side ConfigMap (for `configMapKeyRef`-kind outputs) |

Sensitive material never appears in `status.outputs`. Only the `{name, key}` reference transits the control plane.

#### Condition Types

| Type              | Meaning                                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| `Synced`          | The binding has been rendered and a corresponding `RenderedRelease` is in sync with the pinned ResourceRelease |
| `ResourcesReady`  | All declared `resources[]` entries on the ResourceType report healthy (via `readyWhen` or per-Kind heuristic)  |
| `OutputsResolved` | Every declared output has been resolved against the applied data-plane state                                   |
| `Ready`           | Aggregate condition over `Synced`, `ResourcesReady`, and `OutputsResolved`                                     |
| `Finalizing`      | Surfaced during deletion. Reason is `RetainHold` when `retainPolicy: Retain` blocks the finalizer              |

## Examples

### Basic ResourceReleaseBinding

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ResourceReleaseBinding
metadata:
  name: doclet-postgres-development
  namespace: default
spec:
  owner:
    projectName: doclet
    resourceName: doclet-postgres
  environment: development
  resourceRelease: doclet-postgres-abc12345
```

### Binding With Environment-Specific Overrides

Use `resourceTypeEnvironmentConfigs` to apply per-environment values declared in the ResourceType's `environmentConfigs` schema. Combine with a `retainPolicy` override for environments where the type-level default does not apply.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ResourceReleaseBinding
metadata:
  name: doclet-postgres-production
  namespace: default
spec:
  owner:
    projectName: doclet
    resourceName: doclet-postgres
  environment: production
  resourceRelease: doclet-postgres-abc12345
  retainPolicy: Retain
  resourceTypeEnvironmentConfigs:
    memory: "2Gi"
    storage: "100Gi"
```

### Pending Binding (No Release Pinned Yet)

A binding can be created before any ResourceRelease has been cut. The binding stays `Synced=False, Reason=ResourceReleaseNotSet` until `spec.resourceRelease` is set:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ResourceReleaseBinding
metadata:
  name: doclet-postgres-development
  namespace: default
spec:
  owner:
    projectName: doclet
    resourceName: doclet-postgres
  environment: development
  # resourceRelease intentionally unset; promote with:
  #   occ resource promote --env development doclet-postgres
```

## Promoting a Release

Advance `spec.resourceRelease` manually when ready to roll a new release into the target environment. The `occ` CLI bundles the read-current-then-patch step:

```bash
# Pin the binding to the Resource's latest release
occ resource promote --env development doclet-postgres

# Equivalent kubectl flow
kubectl get resource doclet-postgres -o jsonpath='{.status.latestRelease.name}'
kubectl patch resourcereleasebinding doclet-postgres-development \
  --type merge -p '{"spec":{"resourceRelease":"<release-name>"}}'
```

There is no auto-advance in v1.1. Auto-advance is tracked as a forward-compatible additive `releasePolicy` field for a later release.

## Retention and Deletion

`retainPolicy` controls what happens to the emitted data-plane state on binding deletion:

- **`Delete`** (default-via-fallback) — finalizer removes the emitted manifests as part of deletion
- **`Retain`** — finalizer holds; the binding stays in `Terminating` with `Finalizing` condition `Reason=RetainHold` and the data-plane state persists

When unset on the binding, the effective policy is inherited from the referenced ResourceType's `spec.retainPolicy` (which itself defaults to `Delete`).

To finalize a `Retain` binding, flip the policy and the controller's next reconcile will run the cascade:

```bash
kubectl patch rrb doclet-postgres-production \
  --type merge -p '{"spec":{"retainPolicy":"Delete"}}'
```

See [Authoring ResourceTypes](../../../platform-engineer-guide/resource-types.md#retainpolicy) for the full retention pattern.

## Authorization Context

The binding controller checks RBAC against `{projectName, resourceName, environment}` for every operation. Cross-project access is rejected: a binding's `spec.owner.projectName` must match the Resource's `spec.owner.projectName`. A request that claims a different project in the body is rejected as a defense-in-depth check.

## Related Resources

- [Resource](../application/resource.md) — Owns the binding through `spec.owner.{projectName, resourceName}`
- [ResourceRelease](../runtime/resourcerelease.md) — Immutable snapshot pinned by `spec.resourceRelease`
- [ResourceType](./resourcetype.md) — Source of `resourceTypeEnvironmentConfigs` schema and `retainPolicy` default
- [Environment](./environment.md) — Target environment for the binding
- [RenderedRelease](../runtime/renderedrelease.md) — Final manifests produced by the binding controller
- [ReleaseBinding](./releasebinding.md) — Component-side counterpart
- [Authoring ResourceTypes (PE Guide)](../../../platform-engineer-guide/resource-types.md)
