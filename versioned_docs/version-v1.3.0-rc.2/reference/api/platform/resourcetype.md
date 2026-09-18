---
title: ResourceType API Reference
description: Platform-defined template that provisions managed infrastructure and declares the outputs consumers bind to
---

# ResourceType

A ResourceType is a platform-defined template that governs how managed infrastructure (databases, queues, caches, object stores) is provisioned on the data plane and exposed to consumers. It captures the manifests the platform emits, the parameters developers can supply, the environment-specific overrides bindings can apply, and the named outputs consumers wire into their containers.

Resources reference a ResourceType (or [ClusterResourceType](./clusterresourcetype.md)) by name; each [ResourceReleaseBinding](./resourcereleasebinding.md) then renders the template per environment and applies the manifests to the data plane.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ResourceTypes are namespace-scoped resources typically created in a namespace to be available for Resources in that namespace.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ResourceType
metadata:
  name: <resourcetype-name>
  namespace: <namespace>
```

**Short names:** `rt`, `rts`

### Spec Fields

| Field                | Type                                            | Required | Default  | Description                                                                                                                                            |
| -------------------- | ----------------------------------------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `parameters`         | [SchemaSection](#schemasection)                 | No       | -        | Schema for `Resource.spec.parameters` values. Validated by the Resource controller; failures surface via `status.conditions`                           |
| `environmentConfigs` | [SchemaSection](#schemasection)                 | No       | -        | Schema for `ResourceReleaseBinding.spec.resourceTypeEnvironmentConfigs` per-environment overrides                                                      |
| `retainPolicy`       | string                                          | No       | `Delete` | Default retention behavior for bindings of this type: `Delete` removes emitted DP-side state on binding delete; `Retain` holds the binding's finalizer |
| `outputs`            | [[ResourceTypeOutput](#resourcetypeoutput)]     | No       | []       | Named outputs that workloads consume through `Workload.spec.dependencies.resources[].envBindings` and `fileBindings`                                   |
| `resources`          | [[ResourceTypeManifest](#resourcetypemanifest)] | Yes      | -        | Kubernetes manifest templates the provisioner emits on the data plane. At least one entry is required                                                  |

### ResourceTypeOutput

Declares a single named output. Each output picks exactly one of `value`, `secretKeyRef`, or `configMapKeyRef`—setting more than one is a validation error.

| Field             | Type                                | Required | Default | Description                                                                                                                        |
| ----------------- | ----------------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `name`            | string                              | Yes      | -       | Unique output identifier within the ResourceType. Referenced by consumer `envBindings` / `fileBindings` keys (min: 1)              |
| `value`           | string                              | No       | -       | Literal value or `${...}` CEL expression evaluating to a string. Use for non-sensitive data; the resolved value transits to the CP |
| `secretKeyRef`    | [SecretKeyRef](#secretkeyref)       | No       | -       | Reference to a data-plane Secret. Use for sensitive credentials; only `{name, key}` transits to the CP                             |
| `configMapKeyRef` | [ConfigMapKeyRef](#configmapkeyref) | No       | -       | Reference to a data-plane ConfigMap. Both `name` and `key` support `${...}` CEL templating                                         |

`value`, `secretKeyRef.{name,key}`, and `configMapKeyRef.{name,key}` all accept `${...}` CEL expressions evaluated against `metadata.*`, `parameters.*`, `environmentConfigs.*`, `dataplane.*`, `gateway.*`, and `applied.<id>.status.*`.

### ResourceTypeManifest

Defines a single Kubernetes manifest the ResourceType emits on the data plane.

| Field         | Type   | Required | Default | Description                                                                                                                                                |
| ------------- | ------ | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | string | Yes      | -       | Unique identifier within the ResourceType. Referenced by `readyWhen` and `outputs` via `applied.<id>.status.*` (min: 1)                                    |
| `includeWhen` | string | No       | -       | `${...}`-wrapped CEL expression returning a boolean. When `false`, the entry is omitted from the render and any prior object is GC'd                       |
| `template`    | object | Yes      | -       | Kubernetes resource template with `${...}` CEL expressions for dynamic values                                                                              |
| `readyWhen`   | string | No       | -       | `${...}`-wrapped CEL expression evaluating after the manifest has been applied. When set, gates `ResourceReleaseBinding.status.conditions[ResourcesReady]` |

When `readyWhen` is unset, readiness falls back to the per-Kind health heuristic in `RenderedRelease.status.resources[].healthStatus`.

#### CEL Expression Surface

Templates use CEL expressions enclosed in `${...}`. The available context bindings depend on the field being evaluated:

| Context                | In `template` | In `includeWhen` | In `readyWhen` | In `outputs` | Description                                                                                           |
| ---------------------- | :-----------: | :--------------: | :------------: | :----------: | ----------------------------------------------------------------------------------------------------- |
| `metadata.*`           |      yes      |       yes        |      yes       |     yes      | Platform-injected naming, namespace, resource/project/env names + UIDs, labels, annotations           |
| `parameters.*`         |      yes      |       yes        |      yes       |     yes      | Values from `Resource.spec.parameters` with schema defaults applied                                   |
| `environmentConfigs.*` |      yes      |       yes        |      yes       |     yes      | Values from `ResourceReleaseBinding.spec.resourceTypeEnvironmentConfigs` with schema defaults applied |
| `environment.*`        |      yes      |       yes        |      yes       |     yes      | Per-environment surface including the merged effective gateway for this environment                   |
| `dataplane.*`          |      yes      |       yes        |      yes       |     yes      | DataPlane attributes (`secretStore`, raw gateway, observability reference)                            |
| `gateway.*`            |      yes      |       yes        |      yes       |     yes      | Effective gateway (Environment override merged onto DataPlane default)                                |
| `applied.<id>.*`       |      no       |        no        |      yes       |     yes      | Status of resources after they have been applied to the data plane—reference by manifest `id`         |

##### metadata

Platform-computed metadata for resource generation:

| Field                        | Type   | Description                                                                |
| ---------------------------- | ------ | -------------------------------------------------------------------------- |
| `metadata.name`              | string | Platform-computed base name `{resource}-{env}-{hash}` for rendered objects |
| `metadata.namespace`         | string | DP-side project-env mapped namespace                                       |
| `metadata.resourceNamespace` | string | CP namespace where the Resource CR lives                                   |
| `metadata.resourceName`      | string | Name of the owning Resource                                                |
| `metadata.resourceUID`       | string | UID of the owning Resource                                                 |
| `metadata.projectName`       | string | Name of the project                                                        |
| `metadata.projectUID`        | string | UID of the project                                                         |
| `metadata.environmentName`   | string | Name of the environment                                                    |
| `metadata.environmentUID`    | string | UID of the environment                                                     |
| `metadata.dataPlaneName`     | string | Name of the target data plane                                              |
| `metadata.dataPlaneUID`      | string | UID of the target data plane                                               |
| `metadata.labels`            | map    | Platform-injected standard labels propagated to every rendered object      |
| `metadata.annotations`       | map    | Annotations propagated from the Resource CR                                |

For the full CEL surface (built-in functions, helpers), see the [CEL Reference](../../cel/context-variables.md).

### SchemaSection

Both `parameters` and `environmentConfigs` use the `SchemaSection` type, which holds a schema in `openAPIV3Schema` format:

| Field             | Type   | Required | Default | Description                            |
| ----------------- | ------ | -------- | ------- | -------------------------------------- |
| `openAPIV3Schema` | object | No       | -       | Standard OpenAPI v3 JSON Schema format |

```yaml
parameters:
  openAPIV3Schema:
    type: object
    properties:
      version:
        type: string
        enum: ["7", "8"]
        default: "8"
```

### SecretKeyRef

References a key inside a Kubernetes Secret on the data plane.

| Field  | Type   | Required | Description                                                      |
| ------ | ------ | -------- | ---------------------------------------------------------------- |
| `name` | string | Yes      | Name of the Secret (supports `${...}` CEL templating; min: 1)    |
| `key`  | string | Yes      | Key within the Secret (supports `${...}` CEL templating; min: 1) |

### ConfigMapKeyRef

References a key inside a Kubernetes ConfigMap on the data plane.

| Field  | Type   | Required | Description                                                         |
| ------ | ------ | -------- | ------------------------------------------------------------------- |
| `name` | string | Yes      | Name of the ConfigMap (supports `${...}` CEL templating; min: 1)    |
| `key`  | string | Yes      | Key within the ConfigMap (supports `${...}` CEL templating; min: 1) |

### Status Fields

ResourceType currently has no status fields.

## Examples

### Simple Valkey Cache

A namespace-scoped ResourceType emitting a StatefulSet-backed Valkey cache with a Secret, Service, and a single output for each connection detail.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ResourceType
metadata:
  name: valkey-cache
  namespace: default
spec:
  parameters:
    openAPIV3Schema:
      type: object
      properties:
        version:
          type: string
          enum: ["7", "8"]
          default: "8"

  environmentConfigs:
    openAPIV3Schema:
      type: object
      properties:
        memory:
          type: string
          default: "128Mi"

  retainPolicy: Delete

  outputs:
    - name: host
      value: "${metadata.name}.${metadata.namespace}.svc.cluster.local"
    - name: port
      value: "6379"
    - name: password
      secretKeyRef:
        name: "${metadata.name}-creds"
        key: password

  resources:
    - id: password-secret
      template:
        apiVersion: v1
        kind: Secret
        metadata:
          name: ${metadata.name}-creds
          namespace: ${metadata.namespace}
          labels: ${metadata.labels}
        type: Opaque
        stringData:
          password: "change-me"

    - id: service
      template:
        apiVersion: v1
        kind: Service
        metadata:
          name: ${metadata.name}
          namespace: ${metadata.namespace}
        spec:
          selector:
            app: ${metadata.name}
          ports:
            - name: valkey
              port: 6379
              targetPort: 6379

    - id: statefulset
      readyWhen: "${applied.statefulset.status.readyReplicas == applied.statefulset.status.replicas && applied.statefulset.status.replicas > 0}"
      template:
        apiVersion: apps/v1
        kind: StatefulSet
        metadata:
          name: ${metadata.name}
          namespace: ${metadata.namespace}
          labels: ${metadata.labels}
        spec:
          serviceName: ${metadata.name}
          replicas: 1
          selector:
            matchLabels:
              app: ${metadata.name}
          template:
            metadata:
              labels:
                app: ${metadata.name}
            spec:
              containers:
                - name: valkey
                  image: valkey/valkey:${parameters.version}-alpine
                  resources:
                    limits:
                      memory: ${environmentConfigs.memory}
                  ports:
                    - containerPort: 6379
                      name: valkey
```

### ResourceType With Conditional Resources

`includeWhen` lets a single template handle both bare and admin-UI variants without duplicating templates:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ResourceType
metadata:
  name: redis-with-admin
  namespace: default
spec:
  environmentConfigs:
    openAPIV3Schema:
      type: object
      properties:
        adminEnabled:
          type: boolean
          default: false

  resources:
    # ... bare cache resources omitted ...

    - id: admin-deployment
      includeWhen: "${environmentConfigs.adminEnabled && has(gateway.ingress.external)}"
      template:
        # ... admin UI Deployment ...

    - id: admin-route
      includeWhen: "${environmentConfigs.adminEnabled && has(gateway.ingress.external)}"
      template:
        # ... HTTPRoute exposing the admin UI ...
```

## Usage

Developers reference a ResourceType from a Resource:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Resource
metadata:
  name: order-cache
  namespace: default
spec:
  owner:
    projectName: order-service
  type:
    kind: ResourceType
    name: valkey-cache
  parameters:
    version: "8"
```

To deploy the Resource into an environment, a platform engineer creates a [ResourceReleaseBinding](./resourcereleasebinding.md) pinning a specific [ResourceRelease](../runtime/resourcerelease.md).

## Best Practices

1. **Generate credentials on the data plane.** Use ExternalSecret + a generator (Password, ECDSAKey, etc.) so secret material never enters the control plane. Surface credentials through `secretKeyRef` outputs.
2. **Match `readyWhen` to the provisioner.** For Crossplane claims, check the claim's `Ready` condition. For StatefulSets, check `readyReplicas == replicas`. Leave `readyWhen` unset only when the per-Kind health heuristic captures provisioner semantics correctly.
3. **Set `retainPolicy: Retain` on stateful templates.** Defaults are inherited by every binding of this type; per-environment overrides remain available.
4. **Keep outputs developer-friendly.** Compose useful values like full connection URLs through `value:` CEL when possible (for example, using `parameters.*` and `applied.<id>.status.*`)—but render credential-bearing values on the data plane via ExternalSecret templating so secret material does not transit the control plane.
5. **Document outputs.** Use `openchoreo.dev/description` annotations on the ResourceType to document the contract.

## Related Resources

- [ClusterResourceType](./clusterresourcetype.md) — Cluster-scoped variant of ResourceType
- [Resource](../application/resource.md) — Developer-facing CRD that references a ResourceType
- [ResourceRelease](../runtime/resourcerelease.md) — Immutable snapshot cut by the Resource controller
- [ResourceReleaseBinding](./resourcereleasebinding.md) — Per-environment binding that renders this template
- [Workload](../application/workload.md) — Consumes ResourceType outputs via `dependencies.resources[]`
- [Authoring ResourceTypes (PE Guide)](../../../platform-engineer-guide/resource-types.md)
