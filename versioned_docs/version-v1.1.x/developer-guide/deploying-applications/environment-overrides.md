---
title: Environment Overrides
description: Customize component configuration per environment using overrides
---

# Environment Overrides

The same ComponentRelease is deployed to all environments, but each environment can have different configuration. Environment overrides let you customize parameters, trait settings, and workload configuration per environment without creating separate releases.

## Types of Overrides

| Override Type                     | What It Configures            | Example                            |
| --------------------------------- | ----------------------------- | ---------------------------------- |
| `componentTypeEnvironmentConfigs` | ComponentType parameters      | Replicas, resource limits, port    |
| `traitEnvironmentConfigs`         | Trait parameters per instance | Alert thresholds, storage class    |
| `workloadOverrides`               | Workload-level settings       | Environment variables, file mounts |

## Configuring Overrides via Backstage UI

1. Navigate to your Component's **Deploy** tab
2. Click the **gear icon** on an environment card header
3. The Overrides page shows tabs for:
   - **Workload**: edit environment variables, file mounts, and endpoints
   - **Component**: edit parameters defined by the ComponentType schema
   - **Traits**: edit parameters for each attached trait instance

## Configuring Overrides via CLI

Use `--set` with `occ component deploy` to apply overrides during deployment or promotion:

```bash
# Set replicas for production
occ component deploy my-service --to production \
  --set spec.componentTypeEnvironmentConfigs.replicas=3

# Set resource limits
occ component deploy my-service --to production \
  --set spec.componentTypeEnvironmentConfigs.resources.requests.cpu=500m \
  --set spec.componentTypeEnvironmentConfigs.resources.requests.memory=512Mi
```

The `--set` flag uses dot-notation paths to target specific fields in the ReleaseBinding spec.

## Configuring Overrides via YAML

You can also create or edit a ReleaseBinding directly:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ReleaseBinding
metadata:
  name: my-service-production
  namespace: default
spec:
  owner:
    projectName: default
    componentName: my-service
  environment: production
  releaseName: my-service-5d7f658d9c
  state: Active
  componentTypeEnvironmentConfigs:
    replicas: 3
    resources:
      requests:
        cpu: "500m"
        memory: "512Mi"
  traitEnvironmentConfigs:
    high-error-rate:
      enabled: true
      threshold: 50
```

## Common Override Patterns

### Different replicas per environment

```bash
# Development: 1 replica
occ component deploy my-service --set spec.componentTypeEnvironmentConfigs.replicas=1

# Production: 3 replicas
occ component deploy my-service --to production \
  --set spec.componentTypeEnvironmentConfigs.replicas=3
```

### Environment-specific environment variables

Environment variables can be overridden at the workload level:

```bash
occ component deploy my-service --to production \
  --set spec.workloadOverrides.env.LOG_LEVEL=warn
```

### Disable a trait in development

```bash
occ component deploy my-service \
  --set spec.traitEnvironmentConfigs.high-error-rate.enabled=false
```

## What's Next

- [Logs and Troubleshooting](./logs-and-troubleshooting.md): view runtime logs and manage deployments
- [ReleaseBinding API Reference](../../reference/api/platform/releasebinding.md): full spec for ReleaseBinding overrides
