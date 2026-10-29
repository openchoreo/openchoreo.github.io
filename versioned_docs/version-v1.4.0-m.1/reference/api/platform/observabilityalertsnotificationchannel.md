---
title: ObservabilityAlertsNotificationChannel API Reference
description: Environment-bound destination for delivering alert notifications via email or webhook
---

# ObservabilityAlertsNotificationChannel

An `ObservabilityAlertsNotificationChannel` defines a destination for alert notifications. These resources are **environment-bound**, meaning each channel is associated with a specific OpenChoreo environment.

:::tip Default Notification Channel
In each environment, one `ObservabilityAlertsNotificationChannel` can be marked as the **default**. The first notification channel created in an environment is automatically marked as the default channel. If an [ObservabilityAlertRule](./observabilityalertrule.md) is created without explicitly specifying `actions.notifications.channels`, it will automatically use the default channel for that environment.
:::

Currently, **email** and **webhook** notifications are supported. Email bodies can be sent as plain text (`text/plain`) or HTML (`text/html`).

## Secret Values

SMTP credentials and secret-backed webhook headers are referenced with a `secretKeyRef` (`name` and `key`). The `name` refers to a [SecretReference](./secretreference.md) in the channel's namespace and the `key` to one of its `spec.data[].secretKey` entries, the same way a Workload references secrets. The controller applies an `ExternalSecret` to the environment's observability plane, which syncs the values from that plane's external secret store into the Secret the observer reads when it sends a notification. While a channel's secret references can't be used, for example because a SecretReference is missing or points at a remote key the channel may not read, OpenChoreo removes the channel's `ExternalSecret`, so the values stop reaching the observability plane. The control plane never reads the values, and a changed value reaches the observability plane within the SecretReference's `refreshInterval`, without touching the channel.

For this to work:

- The environment's [ObservabilityPlane](./observabilityplane.md) or [ClusterObservabilityPlane](./clusterobservabilityplane.md) must have a `secretStoreRef`.
- The SecretReference must have no `targetPlane`, or target the channel's observability plane. The easiest way to create one is `occ secret create --target-plane ClusterObservabilityPlane/<name>` (or `ObservabilityPlane/<name>` for a namespaced plane), or the **Secrets** page in Backstage. See [Secret Management](../../../platform-engineer-guide/secret-management.mdx).
- The SecretReference's remote keys must be the key the Secret Management API writes for it: `<remoteKeyPrefix>/<namespace>/<type>/<name>` by default, from the channel's namespace and the SecretReference's `spec.template.type` (`generic`, `basic-auth`, `ssh-auth`, `registry` or `tls`) and name. Webhook channels send header values to a URL of the user's choosing, so a channel can't read any other key, such as secrets of other namespaces or of the platform. SecretReferences created through `occ secret create` or Backstage always use this key. A SecretReference you write by hand must have the same name and type as the secret it points at.
  - With the `-` key separator (`features.secretManagement.remoteKeySeparator`), which can also occur in namespace names, the key must also not be laid out as a key of any other namespace name, whether or not that namespace exists. For example, a channel in namespace `team` can't read `secret-team-generic-registry-creds` (its secret `registry-creds`), which a namespace `team-generic` could also own as its registry secret `creds`. So with `-`, a channel can't use secrets whose names have a type segment followed by `-` (such as `registry-creds`), and channels in a namespace with a type segment in its name (such as `team-generic`) can't use SecretReference-backed secrets. A separator that can't occur in namespace names, such as the default `/`, avoids this.

:::warning Deprecated: referencing Kubernetes Secrets
If no SecretReference has the referenced name, a Kubernetes Secret with that name and key in the channel's namespace on the control plane is used instead, and its values are copied to the observability plane. This is deprecated and will be removed in a future release. Such channels report the `DeprecatedKubernetesSecret` reason in their `SecretsReady` condition and get a warning event. All secret references of a channel must resolve the same way: either all to SecretReferences or all to Kubernetes Secrets.
:::

## API Version

`openchoreo.dev/v1alpha1`

## Resource Definition

### Metadata

`ObservabilityAlertsNotificationChannel` resources are namespace-scoped.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ObservabilityAlertsNotificationChannel
metadata:
  name: <channel-name>
  namespace: <org-namespace>
```

### Spec Fields

| Field           | Type                                                | Required                        | Description                                                                                                                                                                                                                   |
| --------------- | --------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `environment`   | string                                              | Yes                             | Name of the OpenChoreo environment this channel belongs to (Immutable)                                                                                                                                                        |
| `isEnvDefault`  | boolean                                             | No                              | If `true`, this is the default channel for the environment. Default channels are used by alert rules that don't specify a channel. Defaults to `false`. First channel created in an environment will be marked as the default |
| `type`          | [NotificationChannelType](#notificationchanneltype) | Yes                             | The type of notification channel (`email` or `webhook`)                                                                                                                                                                       |
| `emailConfig`   | [EmailConfig](#emailconfig)                         | Required if `type` is `email`   | Email configuration                                                                                                                                                                                                           |
| `webhookConfig` | [WebhookConfig](#webhookconfig)                     | Required if `type` is `webhook` | Webhook configuration                                                                                                                                                                                                         |

### NotificationChannelType

| Value     | Description                       |
| --------- | --------------------------------- |
| `email`   | Email notification channel        |
| `webhook` | HTTP webhook notification channel |

### EmailConfig

| Field      | Type                            | Required | Description                                                                        |
| ---------- | ------------------------------- | -------- | ---------------------------------------------------------------------------------- |
| `from`     | string                          | Yes      | The sender email address                                                           |
| `to`       | string[]                        | Yes      | List of recipient email addresses (minimum 1)                                      |
| `smtp`     | [SMTPConfig](#smtpconfig)       | Yes      | SMTP server configuration                                                          |
| `template` | [EmailTemplate](#emailtemplate) | Yes      | Email subject and body templates using CEL expressions, plus the body content type |

### WebhookConfig

| Field             | Type                                                 | Required | Description                                                                                                                                                                                                                                                                                                                                          |
| ----------------- | ---------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`             | string                                               | Yes      | The webhook endpoint URL where alerts will be sent (must be a valid URI)                                                                                                                                                                                                                                                                             |
| `headers`         | map[string][WebhookHeaderValue](#webhookheadervalue) | No       | Optional HTTP headers to include in the webhook request. Each header value can be provided inline or via a secret reference.                                                                                                                                                                                                                         |
| `payloadTemplate` | string                                               | No       | Optional JSON payload template using CEL expressions. If not provided, the raw alertDetails object will be sent as JSON. CEL expressions use `${...}` syntax and have access to alert fields: `${alertName}`, `${alertDescription}`, `${alertSeverity}`, `${alertValue}`, etc. Example for Slack: `{"text": "Alert: ${alertName}", "blocks": [...]}` |

### WebhookHeaderValue

Defines a header value that can be provided inline or via a secret reference.

:::note Mutually Exclusive Fields
Exactly one of `value` or `valueFrom` must be set (not both, not neither).
:::

| Field       | Type                                | Required | Description                                                                         |
| ----------- | ----------------------------------- | -------- | ----------------------------------------------------------------------------------- |
| `value`     | string                              | No       | Inline header value (mutually exclusive with `valueFrom`)                           |
| `valueFrom` | [SecretValueFrom](#secretvaluefrom) | No       | Reference to a secret containing the header value (mutually exclusive with `value`) |

### SMTPConfig

| Field  | Type                            | Required | Description                     |
| ------ | ------------------------------- | -------- | ------------------------------- |
| `host` | string                          | Yes      | SMTP server hostname            |
| `port` | integer                         | Yes      | SMTP server port                |
| `auth` | [SMTPAuth](#smtpauth)           | Yes      | SMTP authentication credentials |
| `tls`  | [SMTPTLSConfig](#smtptlsconfig) | Yes      | TLS configuration for SMTP      |

### SMTPAuth

| Field      | Type                                | Required | Description                                               |
| ---------- | ----------------------------------- | -------- | --------------------------------------------------------- |
| `username` | [SecretValueFrom](#secretvaluefrom) | Yes      | Username for SMTP authentication, from a secret reference |
| `password` | [SecretValueFrom](#secretvaluefrom) | Yes      | Password for SMTP authentication, from a secret reference |

### SMTPTLSConfig

| Field                | Type    | Required | Description                                                                    |
| -------------------- | ------- | -------- | ------------------------------------------------------------------------------ |
| `insecureSkipVerify` | boolean | No       | If `true`, skips TLS certificate verification (not recommended for production) |

### EmailTemplate

Defines the email template using CEL expressions.

| Field         | Type   | Required | Description                                                                                                    |
| ------------- | ------ | -------- | -------------------------------------------------------------------------------------------------------------- |
| `subject`     | string | Yes      | CEL expression for the email subject (e.g., `"[${alert.severity}] - ${alert.name} Triggered"`)                 |
| `body`        | string | Yes      | CEL expression for the email body                                                                              |
| `contentType` | string | No       | MIME type of the rendered email body. Valid values are `text/plain` and `text/html`. Defaults to `text/plain`. |

Set `contentType` to `text/html` to send an HTML email. The body can contain HTML markup and inline CSS; it is rendered from its CEL expression before the email is sent and is not HTML-escaped.

### SecretValueFrom

Defines how to obtain a secret value.

| Field          | Type                          | Required | Description                                                      |
| -------------- | ----------------------------- | -------- | ---------------------------------------------------------------- |
| `secretKeyRef` | [SecretKeyRef](#secretkeyref) | No       | Reference to a secret value. See [Secret Values](#secret-values) |

### SecretKeyRef

| Field  | Type   | Required | Description                                                                                                                       |
| ------ | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `name` | string | Yes      | Name of a SecretReference in the channel's namespace (deprecated: or of a Kubernetes Secret, if no SecretReference has this name) |
| `key`  | string | Yes      | A `spec.data[].secretKey` of the SecretReference (deprecated: or a key of the Kubernetes Secret)                                  |

## Status

| Field                | Type                                                                             | Description                           |
| -------------------- | -------------------------------------------------------------------------------- | ------------------------------------- |
| `observedGeneration` | integer                                                                          | Generation observed by the controller |
| `conditions`         | [][Condition](https://pkg.go.dev/k8s.io/apimachinery/pkg/apis/meta/v1#Condition) | `Ready` and `SecretsReady` conditions |

`Ready` reports whether the channel's configuration and secret values are applied to the observability plane. `SecretsReady` reports whether its secret values are available there. When either is not `True`, the reason and message explain why:

| Reason                          | Condition               | Meaning                                                                                                                                                                                                                    |
| ------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Reconciled`                    | `Ready`                 | The channel is applied to the observability plane                                                                                                                                                                          |
| `ExternalSecretSynced`          | `SecretsReady`          | The values are synced from the secret store. The channel is checked again every few minutes, so a later sync failure also shows                                                                                            |
| `NoSecretsReferenced`           | `SecretsReady`          | The channel references no secret values                                                                                                                                                                                    |
| `DeprecatedKubernetesSecret`    | `SecretsReady`          | The values are copied from Kubernetes Secrets, which is deprecated                                                                                                                                                         |
| `ExternalSecretPending`         | `SecretsReady`, `Ready` | Waiting for the `ExternalSecret` to sync the channel's current secret references                                                                                                                                           |
| `ExternalSecretNotSynced`       | `SecretsReady`, `Ready` | The `ExternalSecret` failed to sync; the message includes its error                                                                                                                                                        |
| `ReplacingSecret`               | `SecretsReady`, `Ready` | The channel switched from SecretReferences to Kubernetes Secrets and the previously synced Secret is being removed                                                                                                         |
| `SecretNotFound`                | `SecretsReady`, `Ready` | Neither a SecretReference nor a Kubernetes Secret has the referenced name                                                                                                                                                  |
| `SecretKeyNotFound`             | `SecretsReady`, `Ready` | The SecretReference or Secret has no entry for the referenced key                                                                                                                                                          |
| `MixedSecretSources`            | `SecretsReady`, `Ready` | Some references resolve to SecretReferences and others to Kubernetes Secrets                                                                                                                                               |
| `SecretStoreNotConfigured`      | `SecretsReady`, `Ready` | The environment's observability plane has no `secretStoreRef`. The channel is checked again every few minutes, so it recovers once the plane is fixed                                                                      |
| `SecretStoreUnreachable`        | `SecretsReady`, `Ready` | A SecretReference targets a plane other than the channel's observability plane. The channel is checked again every few minutes                                                                                             |
| `ExternalSecretConflict`        | `SecretsReady`, `Ready` | An `ExternalSecret` with the channel's name that OpenChoreo didn't create already exists in the channel's namespace on the observability plane. OpenChoreo leaves it alone. The channel is checked again every few minutes |
| `RemoteKeyNotAllowed`           | `SecretsReady`, `Ready` | A SecretReference points at a remote key other than the one the Secret Management API writes for it                                                                                                                        |
| `ObservabilityPlaneUnavailable` | `Ready`                 | The environment's observability plane could not be resolved or reached                                                                                                                                                     |
| `ApplyFailed`                   | `Ready`                 | Applying the channel's resources to the observability plane failed                                                                                                                                                         |

## Examples

### Email Notification Channel

Create the SMTP credentials as a SecretReference in the observability plane's secret store:

```bash
occ secret create generic smtp-credentials \
  --namespace my-org \
  --target-plane ClusterObservabilityPlane/default \
  --from-literal=username=<smtp-username> \
  --from-literal=password=<smtp-password>
```

Then reference it from the channel:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ObservabilityAlertsNotificationChannel
metadata:
  name: prod-email-notifications
  namespace: my-org
spec:
  environment: production
  isEnvDefault: true
  type: email
  emailConfig:
    from: "alerts@example.com"
    to:
      - "admin@example.com"
      - "devops@example.com"
    smtp:
      host: "smtp.example.com"
      port: 587
      auth:
        username:
          secretKeyRef:
            name: smtp-credentials
            key: username
        password:
          secretKeyRef:
            name: smtp-credentials
            key: password
      tls:
        insecureSkipVerify: false
    template:
      subject: "[OpenChoreo] ${alert.severity}: ${alert.name}"
      body: "Alert ${alert.name} triggered at ${alert.startsAt}.\n\nDescription: ${alert.description}"
```

### HTML Email Notification Channel

Set `template.contentType` to `text/html` and use HTML markup in the body to send an HTML email. Inline CSS is supported.

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ObservabilityAlertsNotificationChannel
metadata:
  name: prod-html-email-notifications
  namespace: my-org
spec:
  environment: production
  isEnvDefault: false
  type: email
  emailConfig:
    from: "alerts@example.com"
    to:
      - "admin@example.com"
    smtp:
      host: "smtp.example.com"
      port: 587
      auth:
        username:
          secretKeyRef:
            name: smtp-credentials
            key: username
        password:
          secretKeyRef:
            name: smtp-credentials
            key: password
      tls:
        insecureSkipVerify: false
    template:
      contentType: text/html
      subject: "[OpenChoreo] ${alertSeverity}: ${alertName}"
      body: |
        <html>
          <body>
            <h2 style="color: #d9534f;">Alert: ${alertName}</h2>
            <p><strong>Severity:</strong> ${alertSeverity}</p>
            <p><strong>Description:</strong> ${alertDescription}</p>
            <p><strong>Component:</strong> ${component}</p>
            <p><strong>Environment:</strong> ${environment}</p>
          </body>
        </html>
```

### Webhook Notification Channel

Create the token as a SecretReference in the observability plane's secret store:

```bash
occ secret create generic webhook-token \
  --namespace my-org \
  --target-plane ClusterObservabilityPlane/default \
  --from-literal=token=<webhook-token>
```

Then reference it from the channel:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ObservabilityAlertsNotificationChannel
metadata:
  name: prod-webhook-notifications
  namespace: my-org
spec:
  environment: production
  isEnvDefault: false
  type: webhook
  webhookConfig:
    url: https://alerts.example.com/webhook
    headers:
      X-OpenChoreo-Source:
        value: observer
      Authorization:
        valueFrom:
          secretKeyRef:
            name: webhook-token
            key: token
    payloadTemplate: |
      {
        "text": "Alert: ${alertName}",
        "severity": "${alertSeverity}",
        "description": "${alertDescription}",
        "value": "${alertValue}"
      }
```

## Related Resources

- [ObservabilityAlertRule](./observabilityalertrule.md) - Rules that trigger notifications to these channels
- [SecretReference](./secretreference.md) - Holds the secret values channels reference
- [Environment](./environment.md) - Notification channels are environment-specific
- [ObservabilityPlane](./observabilityplane.md) - Provides the underlying observability infrastructure
- [ClusterObservabilityPlane](./clusterobservabilityplane.md) - Provides the underlying observability infrastructure for cluster-scoped resources
