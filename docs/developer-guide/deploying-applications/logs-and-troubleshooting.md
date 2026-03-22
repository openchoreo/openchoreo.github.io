---
title: Logs and Troubleshooting
description: View runtime logs and manage deployments in OpenChoreo
---

# Logs and Troubleshooting

## Runtime Logs

### Via Backstage UI

1. Navigate to your Component
2. Click the **Logs** tab to search and filter logs by environment, time range, and keywords

When the observability plane is configured, additional tabs are available:

- **Metrics**: view metric graphs for your component
- **Alerts**: view triggered alerts

### Via CLI

```bash
# Get recent logs
occ component logs my-service --namespace default --project default

# Follow logs in real-time
occ component logs my-service -f

# Logs from a specific environment
occ component logs my-service --env production

# Last 100 lines
occ component logs my-service --tail 100

# Logs since a specific time
occ component logs my-service --since 1h
```

## Viewing Kubernetes Resources

### Via Backstage UI

Click **View K8s Artifacts** on any environment card to see the resource tree:

- Deployments and ReplicaSets
- Pods (with status and events)
- Services
- HTTPRoutes
- Kubernetes events

This view helps diagnose issues like pod crashes, image pull errors, or routing problems.

### Via CLI

```bash
# Check the underlying deployment
kubectl get deployment -A -l openchoreo.dev/component=my-service

# Check pod status
kubectl get pods -A -l openchoreo.dev/component=my-service

# View pod logs directly
kubectl logs -l openchoreo.dev/component=my-service -n <data-plane-namespace>

# Check events
kubectl get events -A --field-selector involvedObject.name=my-service
```

## Undeploy and Redeploy

### Undeploy

Undeploying removes the running workload from an environment without deleting the ReleaseBinding. This lets you redeploy later without reconfiguring.

In the Backstage UI, click **Undeploy** on the environment card.

### Redeploy

To restore an undeployed component, click **Redeploy** on the environment card. This reactivates the existing ReleaseBinding.

## Rollback

To roll back to a previous release, deploy an older ComponentRelease by name:

```bash
# List available releases
occ componentrelease list --namespace default --project default --component my-service

# Deploy a specific older release
occ component deploy my-service --release my-service-a1b2c3d4e5
```

This creates a new ReleaseBinding pointing to the older release, effectively rolling back the deployment.

## Common Issues

| Symptom                       | Possible Cause                                 | What to Check                                            |
| ----------------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| Component stuck in "NotReady" | Data plane connectivity                        | Check ClusterAgent pod logs in the data plane            |
| Pods in CrashLoopBackOff      | Application error                              | Check pod logs via Backstage or `kubectl logs`           |
| Image pull error              | Wrong image reference or missing credentials   | Verify container image URL and registry access           |
| No endpoints accessible       | HTTPRoute not created or gateway misconfigured | Check `kubectl get httproute -A` and gateway pod logs    |
| Deployment not appearing      | ReleaseBinding not created                     | Check `occ releasebinding list` and Component conditions |

## What's Next

- [Deploy and Promote](./deploy-and-promote.md): deploy and promote across environments
- [Environment Overrides](./environment-overrides.md): customize configuration per environment
