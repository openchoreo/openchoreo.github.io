---
title: Deploy and Promote
description: Deploy components to environments and promote across the deployment pipeline
---

# Deploy and Promote

## Deploy to the First Environment

### Via Backstage UI

1. Navigate to your Component in the Backstage console
2. Go to the **Deploy** tab
3. The first environment card shows your deployment status

For components with `autoDeploy: true`, the deployment happens automatically when the Component and Workload are created. For manual deployment, use the CLI or configure overrides through the environment card settings.

### Via CLI

Deploy the latest release to the root (first) environment:

```bash
occ component deploy my-service --namespace default --project default
```

Deploy a specific release:

```bash
occ component deploy my-service --release my-service-5d7f658d9c
```

## Promote to the Next Environment

Promotion moves a deployment from one environment to the next in the pipeline (e.g., development to staging).

### Via Backstage UI

1. On the **Deploy** tab, find the environment card for the deployed environment
2. Click the **Promote** button
3. The deployment promotes to the next environment in the pipeline

### Via CLI

```bash
# Promote to staging
occ component deploy my-service --to staging

# Promote to production
occ component deploy my-service --to production
```

## View Deployment Status

### Via Backstage UI

The **Deploy** tab shows:

- Deployment status per environment (Ready, NotReady, Failed)
- Last deployed timestamp
- Container image reference
- Release name
- Endpoint URLs

Click **View K8s Artifacts** on an environment card to see the full resource tree, including Deployments, Pods, Services, and HTTPRoutes.

### Via CLI

```bash
# Check ReleaseBinding status
occ releasebinding list --namespace default --project default --component my-service

# Check component status
occ component get my-service --namespace default
```

## What's Next

- [Environment Overrides](./environment-overrides.md): customize configuration per environment
- [Logs and Troubleshooting](./logs-and-troubleshooting.md): view runtime logs and manage deployments
