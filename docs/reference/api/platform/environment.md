---
title: Environment API Reference
---

# Environment

An Environment represents a runtime context (e.g., dev, test, staging, production) where workloads are deployed and
executed. Environments define deployment targets within a DataPlane and control environment-specific configurations like
gateway settings and production flags.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

Environments are namespace-scoped resources that must be created within an Organization's namespace.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Environment
metadata:
  name: <environment-name>
  namespace: <org-namespace>  # Organization namespace
```

### Spec Fields

| Field          | Type                            | Required | Default   | Description                                                   |
|----------------|---------------------------------|----------|-----------|---------------------------------------------------------------|
| `dataPlaneRef` | string                          | No       | "default" | Reference to the DataPlane where this environment is deployed |
| `isProduction` | boolean                         | No       | false     | Indicates if this is a production environment                 |
| `gateway`      | [GatewayConfig](#gatewayconfig) | No       | -         | Gateway configuration specific to this environment            |

### GatewayConfig

| Field                     | Type   | Required | Default | Description                                                      |
|---------------------------|--------|----------|---------|------------------------------------------------------------------|
| `dnsPrefix`               | string | No       | ""      | DNS prefix for the environment (e.g., "dev" for dev.example.com) |
| `security.remoteJwks.uri` | string | No       | ""      | URI for remote JWKS endpoint for JWT validation                  |

### Status Fields

| Field                | Type        | Default | Description                                                   |
|----------------------|-------------|---------|---------------------------------------------------------------|
| `observedGeneration` | integer     | 0       | The generation observed by the controller                     |
| `conditions`         | []Condition | []      | Standard Kubernetes conditions tracking the environment state |

#### Condition Types

Common condition types for Environment resources:

- `Ready` - Indicates if the environment is fully provisioned and ready
- `DataPlaneConnected` - Indicates if the environment is connected to its DataPlane
- `GatewayConfigured` - Indicates if gateway configuration has been applied

## Examples

### Development Environment

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Environment
metadata:
  name: development
  namespace: default
spec:
  dataPlaneRef: dev-dataplane
  isProduction: false
  gateway:
    dnsPrefix: dev
    security:
      remoteJwks:
        uri: https://auth.example.com/.well-known/jwks.json
```

### Production Environment

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: Environment
metadata:
  name: production
  namespace: default
spec:
  dataPlaneRef: prod-dataplane
  isProduction: true
  gateway:
    dnsPrefix: api
    security:
      remoteJwks:
        uri: https://auth.example.com/.well-known/jwks.json
```

## Annotations

Environments support the following annotations:

| Annotation                    | Description                             |
|-------------------------------|-----------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display      |
| `openchoreo.dev/description`  | Detailed description of the environment |

## Related Resources

- [DataPlane](/docs/reference/api/platform/dataplane/) - Kubernetes cluster hosting the environment
- [DeploymentPipeline](/docs/reference/api/platform/deployment-pipeline/) - Defines promotion paths between environments
- [Organization](/docs/reference/api/platform/organization/) - Contains environment definitions
