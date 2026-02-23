---
title: ClusterTrait API Reference
---

# ClusterTrait

A ClusterTrait is a cluster-scoped variant of [Trait](./trait.md) that defines reusable cross-cutting concerns
available across namespaces. This enables platform engineers to define shared traits once — such as persistent
storage, observability, or security policies — and allow Components in any namespace to reference them, eliminating
duplication.

ClusterTraits share the same spec structure as Traits with the same `schema`, `creates`, and `patches` fields.
The only difference is scope: ClusterTraits are cluster-scoped (no namespace), while Traits are namespace-scoped.

:::note
Unlike namespace-scoped [Traits](./trait.md), ClusterTraits do not support the `validations` field.
:::

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ClusterTraits are cluster-scoped resources (no namespace).

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterTrait
metadata:
  name: <clustertrait-name>
```

:::note
ClusterTrait manifests must **not** include `metadata.namespace`. If you are copying from a namespace-scoped
Trait example, remove the `namespace` field.
:::

**Short names:** `ctrait`, `ctraits`

### Spec Fields

| Field     | Type                              | Required | Default | Description                                                                        |
|-----------|-----------------------------------|----------|---------|------------------------------------------------------------------------------------|
| `schema`  | [TraitSchema](#traitschema)       | No       | -       | Configurable parameters for this trait                                             |
| `creates` | [[TraitCreate](#traitcreate)]     | No       | []      | New Kubernetes resources to create when this trait is applied                       |
| `patches` | [[TraitPatch](#traitpatch)]       | No       | []      | Modifications to the rendered resources produced by the ComponentType template     |

### TraitSchema

Defines the configurable parameters that developers can set when attaching this trait to a component.

| Field          | Type   | Required | Default | Description                                       |
|----------------|--------|----------|---------|---------------------------------------------------|
| `types`        | object | No       | -       | Reusable type definitions referenced in parameters|
| `parameters`   | object | No       | -       | Developer-facing configuration options            |
| `envOverrides` | object | No       | -       | Parameters that can be overridden per environment |

#### Parameter Schema Syntax

Uses the same inline schema syntax as ComponentType: a single pipe after the type, then space-separated constraints:

```
fieldName: "type | default=value enum=val1,val2"
```

**Example:**

```yaml
schema:
  parameters:
    volumeName: "string"
    mountPath: "string"
    containerName: "string | default=app"

  envOverrides:
    size: "string | default=10Gi"
    storageClass: "string | default=standard"
```

### TraitCreate

Defines a new Kubernetes resource to be created when the trait is applied.

| Field         | Type   | Required | Default     | Description                                                        |
|---------------|--------|----------|-------------|--------------------------------------------------------------------|
| `targetPlane` | string | No       | `dataplane` | Target plane: `dataplane` or `observabilityplane`                  |
| `includeWhen` | string | No       | -           | CEL expression determining if resource should be created           |
| `forEach`     | string | No       | -           | CEL expression for generating multiple resources from list         |
| `var`         | string | No       | -           | Variable name for `forEach` iterations (required if `forEach` is set) |
| `template`    | object | Yes      | -           | Kubernetes resource template with CEL expressions                  |

#### CEL Context Variables for Creates

CEL expressions in trait create templates have access to the following context variables:

##### metadata

Platform-computed metadata for resource generation (same as ComponentType):

| Field | Type | Description |
|-------|------|-------------|
| `metadata.name` | string | Base name for generated resources (e.g., `my-service-dev-a1b2c3d4`) |
| `metadata.namespace` | string | Target namespace for resources |
| `metadata.componentNamespace` | string | Target namespace of the component |
| `metadata.componentName` | string | Name of the component |
| `metadata.componentUID` | string | Unique identifier of the component |
| `metadata.projectName` | string | Name of the project |
| `metadata.projectUID` | string | Unique identifier of the project |
| `metadata.environmentName` | string | Name of the environment (e.g., `development`, `production`) |
| `metadata.environmentUID` | string | Unique identifier of the environment |
| `metadata.dataPlaneName` | string | Name of the data plane |
| `metadata.dataPlaneUID` | string | Unique identifier of the data plane |
| `metadata.labels` | map | Common labels to add to all resources |
| `metadata.annotations` | map | Common annotations to add to all resources |
| `metadata.podSelectors` | map | Platform-injected selectors for pod identity |

##### trait

Trait-specific metadata:

| Field | Type | Description |
|-------|------|-------------|
| `trait.name` | string | Name of the trait (e.g., `persistent-volume`) |
| `trait.instanceName` | string | Unique instance name within the component (e.g., `data-storage`) |

##### parameters

Trait instance parameters from `Component.spec.traits[].parameters` with schema defaults applied. Use for static configuration that doesn't change across environments.

##### envOverrides

Environment-specific overrides from `ReleaseBinding.spec.traitOverrides[instanceName]` with schema defaults applied. Use for values that vary per environment.

##### dataplane

Data plane configuration:

| Field | Type | Description |
|-------|------|-------------|
| `dataplane.secretStore` | string | Name of the ClusterSecretStore for external secrets |
| `dataplane.publicVirtualHost` | string | Public virtual host for external access |

##### Helper Functions

| Function | Description |
|----------|-------------|
| `oc_generate_name(args...)` | Generate valid Kubernetes names with hash suffix for uniqueness |
| `oc_hash(string)` | Generate 8-character FNV-32a hash from input string |
| `oc_merge(map1, map2, ...)` | Shallow merge maps (later maps override earlier ones) |
| `oc_omit()` | Remove field/key from output when used in conditional expressions |

### TraitPatch

Defines modifications to existing resources generated by the ComponentType.

| Field         | Type                                        | Required | Default     | Description                                                      |
|---------------|---------------------------------------------|----------|-------------|------------------------------------------------------------------|
| `forEach`     | string                                      | No       | -           | CEL expression for iterating over a list                         |
| `var`         | string                                      | No       | -           | Variable name for `forEach` iterations (required if `forEach` is set) |
| `target`      | [PatchTarget](#patchtarget)                 | Yes      | -           | Specifies which resource to patch                                |
| `targetPlane` | string                                      | No       | `dataplane` | Target plane: `dataplane` or `observabilityplane`                |
| `operations`  | [[JSONPatchOperation](#jsonpatchoperation)] | Yes      | -           | List of JSONPatch operations to apply                            |

### PatchTarget

Specifies which Kubernetes resource to modify.

| Field     | Type   | Required | Description                                                              |
|-----------|--------|----------|--------------------------------------------------------------------------|
| `group`   | string | Yes      | API group (e.g., `apps`, `batch`). Use empty string `""` for core resources |
| `version` | string | Yes      | API version (e.g., `v1`, `v1beta1`)                                      |
| `kind`    | string | Yes      | Resource type (e.g., `Deployment`, `StatefulSet`)                        |
| `where`   | string | No       | CEL expression to filter which resources to patch                        |

### JSONPatchOperation

Defines a modification using JSONPatch format (RFC 6902) with OpenChoreo extensions.

| Field   | Type   | Required | Description                                                        |
|---------|--------|----------|--------------------------------------------------------------------|
| `op`    | string | Yes      | Operation: `add`, `replace`, `remove`                              |
| `path`  | string | Yes      | JSON Pointer to the field (RFC 6901)                               |
| `value` | any    | No       | Value to set (not used for `remove`)                               |

#### Supported Operations

- **add**: Add a new field or array element
- **replace**: Replace an existing field value
- **remove**: Delete a field

#### Path Syntax

Supports array filters for targeting specific elements:

```
/spec/containers[?(@.name=='app')]/volumeMounts/-
```

## Examples

### Persistent Volume ClusterTrait

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterTrait
metadata:
  name: persistent-volume
spec:
  schema:
    parameters:
      volumeName: "string | required=true"
      mountPath: "string | required=true"
      containerName: "string | default=app"

    envOverrides:
      size: "string | default=10Gi"
      storageClass: "string | default=standard"

  creates:
    - targetPlane: dataplane
      template:
        apiVersion: v1
        kind: PersistentVolumeClaim
        metadata:
          name: ${metadata.name}-${parameters.volumeName}
          namespace: ${metadata.namespace}
        spec:
          accessModes:
            - ReadWriteOnce
          resources:
            requests:
              storage: ${envOverrides.size}
          storageClassName: ${envOverrides.storageClass}

  patches:
    - target:
        group: apps
        version: v1
        kind: Deployment
      targetPlane: dataplane
      operations:
        - op: add
          path: /spec/template/spec/volumes/-
          value:
            name: ${parameters.volumeName}
            persistentVolumeClaim:
              claimName: ${metadata.name}-${parameters.volumeName}
        - op: add
          path: /spec/template/spec/containers/[?(@.name=='${parameters.containerName}')]/volumeMounts/-
          value:
            name: ${parameters.volumeName}
            mountPath: ${parameters.mountPath}
```

### Sidecar Container ClusterTrait

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterTrait
metadata:
  name: logging-sidecar
spec:
  schema:
    parameters:
      logPath: "string | default=/var/log/app"
      sidecarImage: "string | default=fluent/fluent-bit:latest"

  patches:
    - target:
        group: apps
        version: v1
        kind: Deployment
      operations:
        - op: add
          path: /spec/template/spec/containers/-
          value:
            name: log-collector
            image: ${parameters.sidecarImage}
            volumeMounts:
              - name: logs
                mountPath: ${parameters.logPath}
        - op: add
          path: /spec/template/spec/volumes/-
          value:
            name: logs
            emptyDir: {}
```

### Resource Limits ClusterTrait

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterTrait
metadata:
  name: resource-limits
spec:
  schema:
    envOverrides:
      cpuLimit: "string | default=1000m"
      memoryLimit: "string | default=512Mi"

  patches:
    - target:
        group: apps
        version: v1
        kind: Deployment
      operations:
        - op: add
          path: /spec/template/spec/containers[?(@.name=='main')]/resources/limits/cpu
          value: ${envOverrides.cpuLimit}
        - op: add
          path: /spec/template/spec/containers[?(@.name=='main')]/resources/limits/memory
          value: ${envOverrides.memoryLimit}
```

### Multi-Volume ClusterTrait with forEach

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ClusterTrait
metadata:
  name: multi-volume
spec:
  schema:
    types:
      Mount:
        name: "string"
        path: "string"
    parameters:
      mounts: "[]Mount"

  patches:
    - target:
        group: apps
        version: v1
        kind: Deployment
      forEach: ${parameters.mounts}
      var: mount
      operations:
        - op: add
          path: /spec/template/spec/volumes/-
          value:
            name: ${mount.name}
            emptyDir: {}
        - op: add
          path: /spec/template/spec/containers[?(@.name=='app')]/volumeMounts/-
          value:
            name: ${mount.name}
            mountPath: ${mount.path}
```

## Usage

Developers attach ClusterTraits to components using `kind: ClusterTrait` in the Component specification:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: my-service
  namespace: default
spec:
  componentType:
    kind: ClusterComponentType
    name: deployment/service

  traits:
    - name: persistent-volume
      kind: ClusterTrait
      instanceName: data-storage
      parameters:
        volumeName: data
        mountPath: /var/data
        containerName: app
```

Platform engineers can set trait `envOverrides` in ReleaseBinding:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ReleaseBinding
metadata:
  name: my-service-production
  namespace: default
spec:
  environment: production
  owner:
    componentName: my-service
    projectName: default

  traitOverrides:
    data-storage:  # keyed by instanceName
      size: 100Gi
      storageClass: production-ssd
```

## Best Practices

1. **Use for shared concerns**: Define ClusterTraits for cross-cutting concerns shared across namespaces; use namespace-scoped Traits for namespace-specific concerns
2. **Single responsibility**: Each trait should address one cross-cutting concern
3. **Naming**: Use descriptive names that indicate the capability being added
4. **Parameters**: Provide sensible defaults for all non-required parameters
5. **Target specificity**: Use `where` clauses when needed to avoid unintended modifications
6. **Testing**: Test ClusterTraits with different ComponentTypes to ensure compatibility
7. **Idempotency**: Ensure traits can be safely applied multiple times

## ClusterTrait vs Trait

| Aspect           | Trait                                    | ClusterTrait                                     |
|------------------|------------------------------------------|--------------------------------------------------|
| Scope            | Namespace-scoped                         | Cluster-scoped                                   |
| Availability     | Only within its namespace                | Across all namespaces                            |
| Short names      | `trait`, `traits`                        | `ctrait`, `ctraits`                              |
| Validations      | Supports `validations` field             | Does **not** support `validations` field         |
| Used by          | ComponentType or ClusterComponentType    | ComponentType or ClusterComponentType            |

## Related Resources

- [Trait](./trait.md) - Namespace-scoped variant of ClusterTrait
- [ComponentType](./componenttype.md) - Defines the base deployment pattern that traits modify
- [ClusterComponentType](./clustercomponenttype.md) - Cluster-scoped variant of ComponentType (can only use ClusterTraits)
- [Component](../application/component.md) - Attaches traits to components
- [ReleaseBinding](releasebinding.md) - Binds a ComponentRelease to an environment with trait parameter overrides
