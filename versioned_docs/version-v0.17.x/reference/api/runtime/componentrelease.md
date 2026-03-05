---
title: ComponentRelease API Reference
---

# ComponentRelease

A ComponentRelease represents an immutable snapshot of a component's configuration at a specific point in time in OpenChoreo. It captures the complete component specification including the ComponentType, Traits, parameters, and Workload template with the built image. ComponentReleases ensure reproducibility and enable rollback by preserving the exact state of a component when it was released.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

ComponentReleases are namespace-scoped resources.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentRelease
metadata:
  name: <componentrelease-name>
  namespace: <namespace>  # Namespace for grouping component releases
```

### Spec Fields

| Field              | Type                                                                            | Required | Default | Description                                                           |
|--------------------|---------------------------------------------------------------------------------|----------|---------|-----------------------------------------------------------------------|
| `owner`            | [ComponentReleaseOwner](#componentreleaseowner)                                 | Yes      | -       | Ownership information linking the release to a project and component  |
| `componentType`    | [ComponentTypeSpec](../platform/componenttype.md#spec-fields)                   | Yes      | -       | Immutable snapshot of the ComponentType at release time               |
| `traits`           | map[string][TraitSpec](../platform/trait.md#spec-fields)                        | No       | {}      | Immutable snapshot of trait specifications at release time            |
| `componentProfile` | [ComponentProfile](#componentprofile)                                           | Yes      | -       | Immutable snapshot of parameter values and trait configurations       |
| `workload`         | [WorkloadTemplateSpec](#workloadtemplatespec)                                   | Yes      | -       | Immutable snapshot of the workload specification with the built image |

### ComponentReleaseOwner

| Field           | Type   | Required | Default | Description                                          |
|-----------------|--------|----------|---------|------------------------------------------------------|
| `projectName`   | string | Yes      | -       | Name of the project that owns this component release |
| `componentName` | string | Yes      | -       | Name of the component this release belongs to        |

### ComponentProfile

ComponentProfile contains the frozen parameter values and trait configurations at the time of release.

| Field        | Type                                                                                    | Required | Default | Description                                                       |
|--------------|-----------------------------------------------------------------------------------------|----------|---------|-------------------------------------------------------------------|
| `parameters` | [runtime.RawExtension](https://pkg.go.dev/k8s.io/apimachinery/pkg/runtime#RawExtension) | No       | -       | Merged schema of parameters + envOverrides from the ComponentType |
| `traits`     | [[ComponentTrait](#componenttrait)]                                                     | No       | []      | Trait instances with their configurations                         |

### ComponentTrait

| Field          | Type                                                                                    | Required | Default | Description                                                    |
|----------------|-----------------------------------------------------------------------------------------|----------|---------|----------------------------------------------------------------|
| `name`         | string                                                                                  | Yes      | -       | Name of the Trait resource                                     |
| `kind`         | string                                                                                  | No       | `Trait` | Kind of trait resource: `Trait` (namespace-scoped) or `ClusterTrait` (cluster-scoped) |
| `instanceName` | string                                                                                  | Yes      | -       | Unique identifier for this trait instance within the component |
| `parameters`   | [runtime.RawExtension](https://pkg.go.dev/k8s.io/apimachinery/pkg/runtime#RawExtension) | No       | -       | Trait parameter values conforming to the trait's schema        |

### WorkloadTemplateSpec

The WorkloadTemplateSpec contains the complete workload specification with the built container image.

| Field         | Type                                                                           | Required | Default | Description                                                                                      |
|---------------|--------------------------------------------------------------------------------|----------|---------|--------------------------------------------------------------------------------------------------|
| `container`   | [Container](../application/workload.md#container)                              | Yes      | -       | Container specification for the workload                                                         |
| `endpoints`   | map[string][WorkloadEndpoint](../application/workload.md#workloadendpoint)     | No       | {}      | Network endpoints for port exposure keyed by endpoint name                                       |
| `connections` | map[string][WorkloadConnection](../application/workload.md#workloadconnection) | No       | {}      | Connections to internal/external resources keyed by connection name. Supports template variables |

### Status Fields

Currently, ComponentRelease does not have any status fields defined.

## Examples

### Basic ComponentRelease for a Service Component

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentRelease
metadata:
  name: customer-service-v1.0.0
  namespace: default
spec:
  owner:
    projectName: my-project
    componentName: customer-service
  componentType:
    workloadType: deployment
    schema:
      parameters:
        runtime:
          port: "integer | default=8080"
    resources:
      - id: deployment
        template:
          apiVersion: apps/v1
          kind: Deployment
          metadata:
            name: "${metadata.name}"
          spec:
            replicas: 1
            template:
              spec:
                containers:
                  - name: main
                    image: "${workload.container.image}"
                    ports:
                      - containerPort: "${parameters.runtime.port}"
  componentProfile:
    parameters:
      runtime:
        port: 8080
  workload:
    container:
      image: myregistry/customer-service@sha256:abc123...
      env:
        - key: LOG_LEVEL
          value: info
    endpoints:
      api:
        type: REST
        port: 8080
```

### ComponentRelease with Traits

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentRelease
metadata:
  name: order-service-v2.1.0
  namespace: default
spec:
  owner:
    projectName: my-project
    componentName: order-service
  componentType:
    workloadType: deployment
    schema:
      parameters:
        runtime:
          replicas: "integer | default=1"
    resources:
      - id: deployment
        template:
          apiVersion: apps/v1
          kind: Deployment
          metadata:
            name: "${metadata.name}"
          spec:
            replicas: "${spec.parameters.runtime.replicas}"
  traits:
    persistent-volume:
      schema:
        parameters:
          volumeName: "string | required=true"
          mountPath: "string | required=true"
        envOverrides:
          size: "string | default=10Gi"
      patches:
        - target:
            id: deployment
          operations:
            - op: add
              path: /spec/template/spec/volumes/-
              value:
                name: "${spec.traits.volumeName}"
  componentProfile:
    parameters:
      runtime:
        replicas: 3
    traits:
      - name: persistent-volume
        kind: Trait
        instanceName: data-volume
        parameters:
          volumeName: data
          mountPath: /var/data
          size: 20Gi
  workload:
    container:
      image: myregistry/order-service@sha256:def456...
      env:
        - key: DATA_DIR
          value: /var/data
    endpoints:
      order-api:
        type: REST
        port: 8080
    connections:
      database:
        type: api
        params:
          projectName: my-project
          componentName: postgres-db
          endpoint: tcp-endpoint
        inject:
          env:
            - name: DATABASE_HOST
              value: "{{ .host }}"
            - name: DATABASE_PORT
              value: "{{ .port }}"
```

## Immutability

ComponentRelease is designed to be immutable once created. All spec fields have validation rules that prevent modifications after creation:

- `spec.componentType` - Immutable
- `spec.traits` - Immutable
- `spec.componentProfile` - Immutable
- `spec.workload` - Immutable

This ensures that a ComponentRelease always represents the exact state of the component at a specific point in time, enabling reliable rollbacks and auditing.

## Annotations

ComponentReleases support the following annotations:

| Annotation                    | Description                                        |
|-------------------------------|----------------------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display                 |
| `openchoreo.dev/description`  | Detailed description of the component release      |
| `openchoreo.dev/version`      | Semantic version or tag for this release           |

## Related Resources

- [Component](../application/component.md) - Components that ComponentReleases are created from
- [ComponentType](../platform/componenttype.md) - Component type definitions captured in releases
- [Trait](../platform/trait.md) - Trait specifications captured in releases
- [Workload](../application/workload.md) - Workload specifications captured in releases
- [ReleaseBinding](../platform/releasebinding.md) - Binds a ComponentRelease to a target environment for deployment