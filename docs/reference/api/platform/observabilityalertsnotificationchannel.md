---
title: ObservabilityAlertsNotificationChannel API Reference
---

# ObservabilityAlertsNotificationChannel

An `ObservabilityAlertsNotificationChannel` defines a destination for alert notifications. These resources are **environment-bound**, meaning each channel is associated with a specific OpenChoreo environment.

:::tip Default Notification Channel
In each environment, one `ObservabilityAlertsNotificationChannel` can be marked as the **default**. If an [ObservabilityAlertRule](./observabilityalertrule.md) is created without explicitly specifying a `notificationChannel`, it will automatically use the default channel for that environment.
:::

Currently, **email** and **webhook** notifications are supported.

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

| Field          | Type                                        | Required | Description                                                                 |
|----------------|---------------------------------------------|----------|-----------------------------------------------------------------------------|
| `environment`  | string                                      | Yes      | Name of the OpenChoreo environment this channel belongs to (Immutable)      |
| `isEnvDefault` | boolean                                     | No       | If `true`, this is the default channel for the environment. Default channels are used by alert rules that don't specify a channel. Defaults to `false`. First channel created in an environment will be marked as the default |
| `type`         | [NotificationChannelType](#notificationchanneltype)     | Yes      | The type of notification channel (`email` or `webhook`)                    |
| `emailConfig`       | [EmailConfig](#emailconfig) | Required if `type` is `email`      | Email configuration                                             |
| `webhookConfig`       | [WebhookConfig](#webhookconfig) | Required if `type` is `webhook`      | Webhook configuration                                             |

### NotificationChannelType

| Value     | Description                     |
|-----------|---------------------------------|
| `email`   | Email notification channel      |
| `webhook` | HTTP webhook notification channel |

### EmailConfig

| Field      | Type                            | Required | Description                                             |
|------------|---------------------------------|----------|---------------------------------------------------------|
| `from`     | string                          | Yes      | The sender email address                               |
| `to`       | string[]                        | Yes      | List of recipient email addresses (minimum 1)          |
| `smtp`     | [SMTPConfig](#smtpconfig)       | Yes      | SMTP server configuration                              |
| `template` | [EmailTemplate](#emailtemplate) | Yes      | Email subject and body templates using CEL expressions |

### WebhookConfig

| Field              | Type                                  | Required | Description                                                                 |
|--------------------|---------------------------------------|----------|-----------------------------------------------------------------------------|
| `url`              | string                                | Yes      | The HTTPS endpoint to which alert notifications are delivered via HTTP POST |
| `headers`          | map[string][WebhookHeaderValue](#webhookheadervalue) | No       | Optional HTTP headers to include in the webhook request. Each header value can be provided inline or via a secret reference. |
| `payloadTemplate`  | string                                | No       | JSON payload template to be sent in the webhook request. Can be templated using CEL expressions. If omitted, the full alert payload is sent. |

### WebhookHeaderValue

Defines a header value that can be provided inline or via a secret reference.

| Field       | Type                          | Required | Description                                                     |
|------------|-------------------------------|----------|-----------------------------------------------------------------|
| `value`    | string                        | No       | Inline header value                                             |
| `valueFrom`| [SecretValueFrom](#secretvaluefrom) | No   | Reference to a secret containing the header value              |

### SMTPConfig

| Field                | Type                          | Required | Description                                                         |
|----------------------|-------------------------------|----------|---------------------------------------------------------------------|
| `host`               | string                        | Yes      | SMTP server hostname                                               |
| `port`               | integer                       | Yes      | SMTP server port                                         |
| `auth`               | [SMTPAuth](#smtpauth)         | Yes      | SMTP authentication credentials                                    |
| `tls`                | [SMTPTLSConfig](#smtptlsconfig) | Yes     | TLS configuration for SMTP                                         |

### SMTPAuth

| Field      | Type                          | Required | Description                                              |
|------------|-------------------------------|----------|----------------------------------------------------------|
| `username` | [SecretValueFrom](#secretvaluefrom) | Yes      | Username for SMTP authentication (inline or secret ref) |
| `password` | [SecretValueFrom](#secretvaluefrom) | Yes      | Password for SMTP authentication (inline or secret ref) |

### SMTPTLSConfig

| Field                | Type    | Required | Description                                                                 |
|----------------------|---------|----------|-----------------------------------------------------------------------------|
| `insecureSkipVerify` | boolean | No       | If `true`, skips TLS certificate verification (not recommended for production) |

### EmailTemplate

Defines the email template using CEL expressions.

| Field     | Type   | Required | Description                                                                 |
|-----------|--------|----------|-----------------------------------------------------------------------------|
| `subject` | string | Yes      | CEL expression for the email subject (e.g., `"[${alert.severity}] - ${alert.name} Triggered"`) |
| `body`    | string | Yes      | CEL expression for the email body                                          |

### SecretValueFrom

Defines how to obtain a secret value.

| Field          | Type             | Required | Description                                     |
|----------------|------------------|----------|-------------------------------------------------|
| `secretKeyRef` | [SecretKeyRef](#secretkeyref) | No       | Reference to a key in a Kubernetes secret      |

### SecretKeyRef

| Field       | Type   | Required | Description             |
|-------------|--------|----------|-------------------------|
| `name`      | string | Yes      | Name of the secret      |
| `namespace` | string | Yes      | Namespace of the secret |
| `key`       | string | Yes      | Key within the secret   |

## Examples

### Email Notification Channel

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

## Related Resources

- [ObservabilityAlertRule](./observabilityalertrule.md) - Rules that trigger notifications to these channels
- [Environment](./environment.md) - Notification channels are environment-specific
- [ObservabilityPlane](./observabilityplane.md) - Provides the underlying observability infrastructure
