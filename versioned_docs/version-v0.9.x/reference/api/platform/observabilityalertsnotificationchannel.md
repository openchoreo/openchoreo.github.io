---
title: ObservabilityAlertsNotificationChannel API Reference
---

# ObservabilityAlertsNotificationChannel

An `ObservabilityAlertsNotificationChannel` defines a destination for alert notifications. These resources are **environment-bound**, meaning each channel is associated with a specific OpenChoreo environment.

:::tip Default Notification Channel
In each environment, one `ObservabilityAlertsNotificationChannel` can be marked as the **default**. If an [ObservabilityAlertRule](./observabilityalertrule.md) is created without explicitly specifying a `notificationChannel`, it will automatically use the default channel for that environment.
:::

Currently, only email notifications are supported, but other types such as Slack or Webhooks will be added in the future.

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
| `type`         | [NotificationChannelType](#notificationchanneltype)     | Yes      | The type of notification channel (currently only `email`)                  |
| `config`       | [NotificationChannelConfig](#notificationchannelconfig) | Yes      | Channel-specific configuration                                             |

### NotificationChannelType

| Value   | Description               |
|---------|---------------------------|
| `email` | Email notification channel |

Other notification channel types (e.g., Slack, Webhooks) will be added in the future.

### NotificationChannelConfig

For `type: email`, the configuration includes the following fields:

| Field      | Type                          | Required | Description                                           |
|------------|-------------------------------|----------|-------------------------------------------------------|
| `from`     | string                        | Yes      | The sender email address                             |
| `to`       | string[]                      | Yes      | List of recipient email addresses (minimum 1)        |
| `smtp`     | [SMTPConfig](#smtpconfig)     | Yes      | SMTP server configuration                            |
| `template` | [EmailTemplate](#emailtemplate) | No       | Email subject and body templates using CEL expressions |

### SMTPConfig

| Field                | Type                          | Required | Description                                                         |
|----------------------|-------------------------------|----------|---------------------------------------------------------------------|
| `host`               | string                        | Yes      | SMTP server hostname                                               |
| `port`               | integer                       | Yes      | SMTP server port                                         |
| `auth`               | [SMTPAuth](#smtpauth)         | No       | SMTP authentication credentials                                    |
| `tls`                | [SMTPTLSConfig](#smtptlsconfig) | No       | TLS configuration for SMTP                                         |

### SMTPAuth

| Field      | Type                          | Required | Description                                              |
|------------|-------------------------------|----------|----------------------------------------------------------|
| `username` | [SecretValueFrom](#secretvaluefrom) | No       | Username for SMTP authentication (inline or secret ref) |
| `password` | [SecretValueFrom](#secretvaluefrom) | No       | Password for SMTP authentication (inline or secret ref) |

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
  config:
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
    template:
      subject: "[OpenChoreo] ${alert.severity}: ${alert.name}"
      body: "Alert ${alert.name} triggered at ${alert.startsAt}.\n\nDescription: ${alert.description}"
```

## Related Resources

- [ObservabilityAlertRule](./observabilityalertrule.md) - Rules that trigger notifications to these channels
- [Environment](./environment.md) - Notification channels are environment-specific
- [ObservabilityPlane](./observabilityplane.md) - Provides the underlying observability infrastructure
