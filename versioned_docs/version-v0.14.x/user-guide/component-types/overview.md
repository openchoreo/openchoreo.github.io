---
title: Overview
description: Learn how to create ComponentTypes and Traits for OpenChoreo
---

# Authoring ComponentTypes and Traits

This guide covers how to create custom [ComponentTypes](../../reference/api/platform/componenttype.md) and [Traits](../../reference/api/platform/trait.md) in OpenChoreo.

## What is a ComponentType?

OpenChoreo ships with default component types for common cases—backend services, web applications, scheduled tasks. In most organizations, these defaults are a starting point, not the finish line.

A **ComponentType** provides platform operators with a declarative way to define the infrastructure created when a component is deployed. It builds on base workload types that map to Kubernetes (Deployment, StatefulSet, Job, CronJob), letting you customize what resources get created and how they're configured.

Platform operators can:

- Adjust defaults to match internal standards
- Add new component types for the team's specific patterns
- Enforce best practices and security policies

Developers keep working with a simple Component model without worrying about underlying Kubernetes details.

**Key concepts:**
- `workloadType` - The primary workload kind: `deployment`, `statefulset`, `cronjob`, or `job`
- `schema` - Defines parameters developers can configure and environment-specific overrides
- `resources` - Templates that generate Kubernetes resources using CEL expressions

### ComponentType Example

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ComponentType
metadata:
  name: web-service
  namespace: default
spec:
  # Primary workload type - must have a matching resource id
  workloadType: deployment

  # Schema defines what developers can configure
  schema:
    # Parameters set by developers in Component spec
    parameters:
      port: "integer | default=8080"
      replicas: "integer | default=1 minimum=1"
      exposed: "boolean | default=false"

    # Environment-specific values set in ReleaseBinding
    envOverrides:
      resources:
        cpu: "string | default=100m"
        memory: "string | default=256Mi"

  # Resources to generate - templates use CEL expressions
  resources:
    # Primary workload - id must match workloadType
    - id: deployment
      template:
        apiVersion: apps/v1
        kind: Deployment
        metadata:
          name: ${metadata.name}
          namespace: ${metadata.namespace}
          labels: ${metadata.labels}
        spec:
          replicas: ${parameters.replicas}
          selector:
            matchLabels: ${metadata.podSelectors}
          template:
            metadata:
              labels: ${metadata.podSelectors}
            spec:
              containers:
                - name: main
                  image: ${workload.containers["main"].image}
                  ports:
                    - containerPort: ${parameters.port}
                  resources:
                    requests:
                      cpu: ${envOverrides.resources.cpu}
                      memory: ${envOverrides.resources.memory}

    # Service for the deployment
    - id: service
      template:
        apiVersion: v1
        kind: Service
        metadata:
          name: ${metadata.name}
          namespace: ${metadata.namespace}
        spec:
          selector: ${metadata.podSelectors}
          ports:
            - port: ${parameters.port}
              targetPort: ${parameters.port}

    # Optional HTTPRoute - only created when exposed=true
    - id: httproute
      includeWhen: ${parameters.exposed}
      template:
        apiVersion: gateway.networking.k8s.io/v1
        kind: HTTPRoute
        metadata:
          name: ${metadata.name}
          namespace: ${metadata.namespace}
        spec:
          hostnames:
            - ${metadata.name}.${dataplane.publicVirtualHost}
          rules:
            - backendRefs:
                - name: ${metadata.name}
                  port: ${parameters.port}
```

## What is a Trait?

A **Trait** augments a Component with operational behavior without modifying the ComponentType. Think of it as a composable overlay—you can mix and match Traits to add capabilities like storage, autoscaling, or network policies to any component.

This lets platform operators define reusable operational patterns separately from the base component types, and lets developers attach only the capabilities they need.

**Examples of what Traits can do:**

- Add persistent storage (PVCs, volume mounts)
- Configure autoscaling rules
- Set network policies or ingress routing
- Inject sidecars for observability or service mesh

**Key concepts:**
- `schema` - Defines trait-specific parameters and environment overrides
- `creates` - New Kubernetes resources to create (e.g., PVC, ConfigMap)
- `patches` - Modifications to existing ComponentType resources (e.g., add volume mounts)

### Trait Example

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Trait
metadata:
  name: persistent-volume
  namespace: default
spec:
  # Schema for trait configuration
  schema:
    # Static parameters set in Component.spec.traits[].parameters
    parameters:
      volumeName: "string"
      mountPath: "string"
      containerName: "string | default=main"

    # Environment-specific values in ReleaseBinding.spec.traitOverrides
    envOverrides:
      size: "string | default=10Gi"
      storageClass: "string | default=standard"

  # Create new resources
  creates:
    - template:
        apiVersion: v1
        kind: PersistentVolumeClaim
        metadata:
          # Use trait.instanceName for unique naming
          name: ${metadata.name}-${trait.instanceName}
          namespace: ${metadata.namespace}
        spec:
          accessModes: ["ReadWriteOnce"]
          storageClassName: ${envOverrides.storageClass}
          resources:
            requests:
              storage: ${envOverrides.size}

  # Patch existing resources from ComponentType
  patches:
    - target:
        kind: Deployment
        group: apps
        version: v1
      operations:
        # Add volume to pod spec
        - op: add
          path: /spec/template/spec/volumes/-
          value:
            name: ${parameters.volumeName}
            persistentVolumeClaim:
              claimName: ${metadata.name}-${trait.instanceName}

        # Add volume mount to container
        - op: add
          path: /spec/template/spec/containers[?(@.name=='${parameters.containerName}')]/volumeMounts/-
          value:
            name: ${parameters.volumeName}
            mountPath: ${parameters.mountPath}
```

## How Components Use ComponentTypes and Traits

Developers create **Components** that reference a ComponentType and optionally attach Traits. The Component specifies parameter values defined in the ComponentType and Trait schemas:

- `componentType` references the ComponentType (format: `workloadType/name`)
- `parameters` provides values for the ComponentType schema
- `traits[]` attaches Traits with their instance-specific parameters

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Component
metadata:
  name: my-api
  namespace: default
spec:
  # Reference ComponentType as workloadType/name
  componentType: deployment/web-service

  # Set ComponentType parameters
  parameters:
    port: 3000
    replicas: 2
    exposed: true

  # Attach traits with instance-specific configuration
  traits:
    - name: persistent-volume
      instanceName: data-storage    # Unique name for this trait instance
      parameters:
        volumeName: data
        mountPath: /var/data
```

To deploy a Component, you first create a **ComponentRelease** that captures the Component, its Workload, ComponentType, and Traits as an immutable snapshot. Then you create a **ReleaseBinding** to deploy that release to a specific environment.

The ReleaseBinding is where environment-specific values are set—the `envOverrides` defined in ComponentType and Trait schemas. The same ComponentRelease can be deployed to multiple environments (dev → staging → prod), with each ReleaseBinding providing different override values:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ReleaseBinding
metadata:
  name: my-api-production
spec:
  # Required: identifies the component this binding belongs to
  owner:
    projectName: my-project
    componentName: my-api

  # Required: target environment
  environment: production

  # Optional: specific release to deploy (omit for auto-deploy)
  releaseName: my-api-release-v1

  # ComponentType environment overrides
  componentTypeEnvOverrides:
    resources:
      cpu: "500m"
      memory: "1Gi"

  # Trait environment overrides (keyed by instanceName)
  traitOverrides:
    data-storage:
      size: "100Gi"
      storageClass: "production-ssd"
```

## Syntax Systems

ComponentTypes and Traits use three interconnected syntax systems:

| Syntax | Purpose | Used In |
|--------|---------|---------|
| [Templating](./templating-syntax.md) | Dynamic value generation using CEL expressions | Resource templates |
| [Schema](./schema-syntax.md) | Parameter validation and defaults | `schema.parameters` and `schema.envOverrides` |
| [Patching](./patching-syntax.md) | Modifying existing resources | Trait `patches` section |

## CEL Reference

Templates use CEL expressions that have access to context variables and built-in functions:

- **[Context Variables](../../reference/cel/context-variables.md)** - `metadata`, `parameters`, `workload`, `configurations`, etc.
- **[Built-in Functions](../../reference/cel/built-in-functions.md)** - `oc_omit()`, `oc_merge()`, `oc_generate_name()`
- **[Configuration Helpers](../../reference/cel/configuration-helpers.md)** - Helper functions for working with configs and secrets

## Next Steps

- **[Templating Syntax](./templating-syntax.md)** - Learn CEL expression syntax and resource control fields
- **[Schema Syntax](./schema-syntax.md)** - Define parameters with validation and defaults
- **[Patching Syntax](./patching-syntax.md)** - Modify resources in Traits using JSON Patch

## Related Resources

- [ComponentType API Reference](../../reference/api/platform/componenttype.md) - Full CRD specification
- [Trait API Reference](../../reference/api/platform/trait.md) - Full CRD specification
- [Component API Reference](../../reference/api/application/component.md) - Full CRD specification
