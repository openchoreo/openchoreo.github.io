---
title: SecretReference API Reference
---

# SecretReference

A SecretReference defines a mapping between external secret store entries and Kubernetes Secrets. It allows platform
engineers to declaratively specify how secrets from external providers (like HashiCorp Vault, AWS Secrets Manager, etc.)
should be synchronized into Kubernetes Secrets for use by applications.

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

SecretReferences are namespace-scoped resources.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: SecretReference
metadata:
  name: <secret-reference-name>
  namespace: <namespace>  # Namespace for grouping secret references
```

### Spec Fields

| Field             | Type                                  | Required | Default | Description                                                    |
|-------------------|---------------------------------------|----------|---------|----------------------------------------------------------------|
| `template`        | [SecretTemplate](#secrettemplate)     | Yes      | -       | Defines the structure of the resulting Kubernetes Secret       |
| `data`            | [][SecretDataSource](#secretdatasource) | Yes    | -       | Mapping of secret keys to external secret references (min: 1)  |
| `refreshInterval` | [duration](https://pkg.go.dev/k8s.io/apimachinery/pkg/apis/meta/v1#Duration) | No | `1h` | How often to reconcile/refresh the secret from external stores |

### SecretTemplate

Defines the structure and metadata of the resulting Kubernetes Secret.

| Field      | Type                              | Required | Default  | Description                                        |
|------------|-----------------------------------|----------|----------|----------------------------------------------------|
| `type`     | string                            | No       | `Opaque` | Type of the Kubernetes Secret                      |
| `metadata` | [SecretMetadata](#secretmetadata) | No       | -        | Additional metadata to add to the generated secret |

#### Supported Secret Types

- `Opaque` - Arbitrary user-defined data (default)
- `kubernetes.io/dockerconfigjson` - Docker registry credentials
- `kubernetes.io/dockercfg` - Legacy Docker registry credentials
- `kubernetes.io/basic-auth` - Basic authentication credentials
- `kubernetes.io/ssh-auth` - SSH authentication credentials
- `kubernetes.io/tls` - TLS certificate and key
- `bootstrap.kubernetes.io/token` - Bootstrap token data

### SecretMetadata

Additional metadata to add to the generated Kubernetes Secret.

| Field         | Type              | Required | Default | Description                       |
|---------------|-------------------|----------|---------|-----------------------------------|
| `annotations` | map[string]string | No       | -       | Annotations to add to the secret  |
| `labels`      | map[string]string | No       | -       | Labels to add to the secret       |

### SecretDataSource

Maps a key in the Kubernetes Secret to a value from an external secret store.

| Field       | Type                              | Required | Default | Description                                      |
|-------------|-----------------------------------|----------|---------|--------------------------------------------------|
| `secretKey` | string                            | Yes      | -       | Key name in the resulting Kubernetes Secret      |
| `remoteRef` | [RemoteReference](#remotereference) | Yes    | -       | Reference to the external secret location        |

### RemoteReference

Points to a specific secret in an external secret store.

| Field      | Type   | Required | Default | Description                                                      |
|------------|--------|----------|---------|------------------------------------------------------------------|
| `key`      | string | Yes      | -       | Path in the external secret store (e.g., `secret/data/github/pat`) |
| `property` | string | No       | -       | Specific field within the secret (e.g., `token`)                 |
| `version`  | string | No       | -       | Version of the secret to fetch (provider-specific)               |

### Status Fields

| Field             | Type                                                                             | Default | Description                                            |
|-------------------|----------------------------------------------------------------------------------|---------|--------------------------------------------------------|
| `conditions`      | [][Condition](https://pkg.go.dev/k8s.io/apimachinery/pkg/apis/meta/v1#Condition) | []      | Standard Kubernetes conditions tracking the sync state |
| `lastRefreshTime` | [Time](https://pkg.go.dev/k8s.io/apimachinery/pkg/apis/meta/v1#Time)             | -       | When the secret reference was last processed/refreshed |
| `secretStores`    | [][SecretStoreReference](#secretstorereference)                                  | []      | Tracks which secret stores are using this reference    |

#### SecretStoreReference

Tracks where this SecretReference is being used.

| Field       | Type   | Description                                        |
|-------------|--------|----------------------------------------------------|
| `name`      | string | Name of the secret store                           |
| `namespace` | string | Namespace where the ExternalSecret was created     |
| `kind`      | string | Kind of resource (ExternalSecret, ClusterExternalSecret) |

#### Condition Types

Common condition types for SecretReference resources:

- `Ready` - Indicates if the secret has been successfully synchronized
- `SecretSynced` - Indicates if the secret data has been fetched from the external store

## Examples

### Basic Opaque Secret

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: SecretReference
metadata:
  name: github-credentials
  namespace: default
spec:
  template:
    type: Opaque
  data:
    - secretKey: token
      remoteRef:
        key: secret/data/github/pat
        property: token
```

### Docker Registry Credentials

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: SecretReference
metadata:
  name: docker-registry-creds
  namespace: default
spec:
  template:
    type: kubernetes.io/dockerconfigjson
    metadata:
      labels:
        app: my-service
  data:
    - secretKey: .dockerconfigjson
      remoteRef:
        key: secret/data/docker/registry
        property: config
  refreshInterval: 30m
```

### TLS Certificate

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: SecretReference
metadata:
  name: api-tls-cert
  namespace: default
spec:
  template:
    type: kubernetes.io/tls
    metadata:
      annotations:
        cert-manager.io/common-name: api.example.com
  data:
    - secretKey: tls.crt
      remoteRef:
        key: secret/data/certs/api
        property: certificate
    - secretKey: tls.key
      remoteRef:
        key: secret/data/certs/api
        property: private_key
```

### Database Credentials with Version

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: SecretReference
metadata:
  name: database-credentials
  namespace: default
spec:
  template:
    type: Opaque
    metadata:
      labels:
        app: backend
        component: database
  data:
    - secretKey: username
      remoteRef:
        key: secret/data/db/postgres
        property: username
        version: "2"
    - secretKey: password
      remoteRef:
        key: secret/data/db/postgres
        property: password
        version: "2"
  refreshInterval: 15m
```

### Multiple Secrets from Different Paths

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: SecretReference
metadata:
  name: app-secrets
  namespace: default
spec:
  template:
    type: Opaque
  data:
    - secretKey: API_KEY
      remoteRef:
        key: secret/data/external-api/credentials
        property: api_key
    - secretKey: JWT_SECRET
      remoteRef:
        key: secret/data/auth/jwt
        property: secret
    - secretKey: ENCRYPTION_KEY
      remoteRef:
        key: secret/data/encryption/keys
        property: primary
  refreshInterval: 1h
```

## Annotations

SecretReferences support the following annotations:

| Annotation                    | Description                                   |
|-------------------------------|-----------------------------------------------|
| `openchoreo.dev/display-name` | Human-readable name for UI display            |
| `openchoreo.dev/description`  | Detailed description of the secret reference  |

## Related Resources

- [Workload](../application/workload.md) - References SecretReference for injecting secrets into deployments
- [ReleaseBinding](./releasebinding.md) - References SecretReference for environment-specific secret configuration
