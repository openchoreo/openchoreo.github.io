---
title: Troubleshooting
description: Inspect the Kubernetes resources and network flows of a component, and fix common deployment issues.
---

# Troubleshooting

Start with your component's [logs and events](./logs-and-events.md): most failures show up there first. When they don't explain it, look at the resources OpenChoreo created for the component and the traffic between them.

## Viewing Kubernetes Resources

### Via Backstage UI

Click **View K8s Artifacts** on any environment card to see the resource tree:

- Deployments and ReplicaSets
- Pods (with status and events)
- Services
- HTTPRoutes
- Kubernetes events

The tree also follows resources created beneath these, and platform engineers can [extend it to custom kinds](../../platform-engineer-guide/resource-tree-rules.mdx).

This view helps diagnose issues like pod crashes, image pull errors, or routing problems.

### Via CLI

```bash
# Stream the component's logs
occ component logs my-service --env development -f

# Check which release each environment runs and whether it is Ready
occ releasebinding list --component my-service

# Inspect the component's conditions
occ component get my-service
```

For Kubernetes-level inspection, use `kubectl` in the data plane:

```bash
# Check the underlying deployment
kubectl get deployment -A -l openchoreo.dev/component=my-service

# Check pod status
kubectl get pods -A -l openchoreo.dev/component=my-service

# Check events
kubectl get events -A --field-selector involvedObject.name=my-service
```

## Network Flows

The **Wirelogs** tab on the component streams the network flows to and from it, live, as Cilium's network observability (Hubble) sees them. Each flow shows its verdict (`FORWARDED` or `DROPPED`), its direction, its source and destination, and a summary such as the HTTP method, path and status. Select a flow for its headers and raw details.

A `DROPPED` flow usually means a network policy blocked the call, for example to a component that isn't declared as an [endpoint dependency](../dependencies/endpoints.md).

- Select an environment and start the stream. It stops after a time limit set by the platform, 15 minutes by default, and the tab keeps the newest 500 flows.
- Filter the flows by verdict, workload, IP, path or status, and download them as JSON.
- Wirelogs need the Cilium network module on the environment's data plane. Elsewhere the tab says they are unavailable.
- The default `developer` role can't stream wirelogs. Ask your platform engineer for access.

## Common Issues

| Symptom                       | Possible Cause                                 | What to Check                                            |
| ----------------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| Component stuck in "NotReady" | Data plane connectivity                        | Check ClusterAgent pod logs in the data plane            |
| Pods in CrashLoopBackOff      | Application error                              | Check pod logs via Backstage or `occ component logs`     |
| Image pull error              | Wrong image reference or missing credentials   | Verify container image URL and registry access           |
| No endpoints accessible       | HTTPRoute not created or gateway misconfigured | Check `kubectl get httproute -A` and gateway pod logs    |
| Deployment not appearing      | ReleaseBinding not created                     | Check `occ releasebinding list` and Component conditions |

## What's Next

- [Deploy and Promote](../deploying-applications/deploy-and-promote.md): deploy, promote, undeploy and roll back
- [Environment Overrides](../deploying-applications/environment-overrides.md): customize configuration per environment
