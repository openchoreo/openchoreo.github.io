---
title: Release Lines
description: Build, deploy, and promote several lines of one component side by side
---

# Release Lines

A release line is a named series of releases of one component. Each line is built, deployed, and promoted on its own, so several versions of a component can run side by side in the same environment. For example, a `next` line built from the `next` branch can run in development and staging next to the component's current version.

## How Release Lines Work

- **Every component has a `default` line.** It is the component itself: its Workload, ComponentReleases, and ReleaseBindings, which leave `spec.owner.releaseLine` empty. A component without ReleaseLines works exactly as before.
- **A ReleaseLine adds another line.** Each line has its own Workload, its own ComponentReleases, and at most one ReleaseBinding per environment. Adding, deploying, or deleting a line never touches the component's other lines, so an existing component needs no change to get a line.
- **A line inherits the component.** It starts from the component's configuration and overrides only what differs. See [What a Line Can Override](#what-a-line-can-override).
- **Line names are unique within a namespace.** A ReleaseLine is a namespaced resource, so two components in a namespace cannot have lines with the same name. A name is a lowercase DNS label of at most 63 characters. `default` is reserved for the implicit line.

`occ`, the API, and the observability tools accept `default` to address the implicit line. In resources, leave `releaseLine` empty for it instead.

### What a Line Can Override

| ReleaseLine field     | Effect on the line                                                                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parameters`          | Deep-merged onto the component's `parameters`. Maps merge key by key. Scalars and lists replace                                                       |
| `traits`              | Merged onto the component's `traits` by `kind`, `name`, and `instanceName`. A matching trait has its parameters deep-merged, and a new trait is added |
| `workflow.parameters` | Deep-merged onto the component's workflow parameters, typically to build from a different branch                                                      |
| `autoDeploy`          | Replaces the component's `autoDeploy` for this line                                                                                                   |

The component type and the workflow are shared by every line. Environment-specific values are set on each line's ReleaseBindings.

### Resource Names

| Resource         | Name                               | Example                |
| ---------------- | ---------------------------------- | ---------------------- |
| ReleaseLine      | `<line>`                           | `next`                 |
| Workload         | `<component>-<line>-workload`      | `hello-next-workload`  |
| ComponentRelease | `<component>-<line>-<hash>`        | `hello-next-6fc987655` |
| ReleaseBinding   | `<component>-<line>-<environment>` | `hello-next-staging`   |

## Create a Line

A line names its component in `spec.owner` and holds only what it overrides. This `next` line, from the [release lines sample](https://github.com/openchoreo/openchoreo/tree/main/samples/release-lines), builds the `release-lines-next` branch and adds health probes:

```yaml
apiVersion: openchoreo.dev/v1alpha1
kind: ReleaseLine
metadata:
  name: next
  namespace: default
spec:
  owner:
    projectName: default
    componentName: hello
  workflow:
    parameters:
      repository:
        revision:
          branch: "release-lines-next"
  traits:
    - kind: ClusterTrait
      name: health-probes
      instanceName: health
      parameters:
        readiness:
          enabled: true
          handler:
            httpGet:
              path: /readyz
              port: 9090
```

Create or change lines with `occ apply`, which sends each ReleaseLine to the component named in its `spec.owner`. An update replaces the line's whole spec, and `spec.owner` cannot be changed.

```bash
occ apply -f release-lines.yaml
```

In the portal, use **Create Release Line** in the component's menu. Once a component has lines, its Overview lists them in a **Release Lines** card, and each line has its own page with the component's tabs scoped to that line. A line's **Definition** tab edits what the line overrides.

## Build a Line

```bash
occ component workflow run hello --release-line next --namespace default
```

The run uses the component's workflow with the line's `workflow.parameters` merged on top, and publishes the image to the line's Workload. Without `--release-line`, the run builds the default line. When [auto-build](../workflows/ci/auto-build.md) is enabled, a push builds the default line and every line whose repository and branch match the push.

## Deploy and Promote a Line

With `autoDeploy`, each new Workload of a line is released and bound to the first environment of the deployment pipeline. To deploy or promote a line by hand, name it with `--release-line`:

```bash
# Promote the line to staging
occ component deploy hello --release-line next --to staging --namespace default --project default

# Roll the line back to an earlier release in staging
occ component deploy hello --release-line next --to staging --release hello-next-7978978bc9 --namespace default --project default
```

Promotion binds the release that the line runs in the previous environment. The other lines are not touched. Each line's ReleaseBinding in an environment holds that line's [environment overrides](./environment-overrides.md).

## Depend on a Line

A dependency without `releaseLine` targets the component's default line, and keeps doing so when the component adds lines. To depend on another line, name it:

```yaml
dependencies:
  endpoints:
    - component: hello
      releaseLine: next
      name: greeter-api
      visibility: project
      envBindings:
        address: HELLO_URL
```

A dependency never follows the consumer's own line. [`occ remote`](../local-development.md) follows the same rule, and `--local hello@next=127.0.0.1:9092` wires a dependency to a line running on your machine.

## View, Debug, and Delete Lines

```bash
# List the lines of a component, default first, per environment
occ component releaseline list hello --namespace default

# Show one line and its status per environment
occ component releaseline get hello next --namespace default

# Logs and a shell of one line
occ component logs hello --release-line next --namespace default --project default
occ component exec hello --release-line next --namespace default --project default

# Delete a line
occ component releaseline delete hello next --namespace default
```

Without `--release-line`, `logs` shows the default line's logs and `exec` opens a pod of the default line. `logs --all-release-lines` shows every line. Deleting a line undeploys it from every environment and removes its ComponentReleases and Workload. Deleting the component deletes all of its lines.

Logs, events, metrics, traces, alerts, incidents, [delivery metrics](../../platform-engineer-guide/delivery-insights.mdx), and [costs](../../platform-engineer-guide/cost-insights.mdx) of a component cover its default line, as they do for a component without lines. They can also be read for one line or for every line. The Observer API takes a `releaseLine` or `allReleaseLines` next to the component, the observability MCP tools take `release_line` or `all_release_lines`, and the portal's views have a Release line filter. Metrics, traces, and costs of one line need observability modules that support release lines. Otherwise the Observer answers `501 Not Implemented`.

In a GitOps repository, `occ componentrelease generate` and `occ releasebinding generate` cover every line of each component, and `--release-line` picks one line of `--component`. See the [CLI Reference](../../reference/cli-reference.md#componentrelease-generate).

## Permissions

Release lines have their own actions: `releaseline:view`, `releaseline:create`, `releaseline:update`, and `releaseline:delete`, granted at component scope or above. The default `developer` and `platform-engineer` roles include all four. Building and deploying a line use the same actions as for the component.

## Troubleshooting

| Where          | Reason or error                                          | Cause and fix                                                                                                                        |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| ReleaseLine    | `ComponentNotFound`                                      | The component in `spec.owner` does not exist                                                                                         |
| ReleaseLine    | `WorkloadNotFound`                                       | The line has not been built yet. Run its workflow                                                                                    |
| ReleaseLine    | `TraitNotFound`                                          | A trait that the line adds does not exist                                                                                            |
| ReleaseLine    | `InvalidConfiguration`                                   | The line's overrides, merged onto the component, are not valid for the component type                                                |
| ReleaseBinding | `ReleaseLineNotFound`                                    | The binding names a line that does not exist                                                                                         |
| ReleaseBinding | `ReleaseLineNameCollision`, `ReleaseLinePodLabelOverlap` | The component type does not name its objects or label its pods per line, so the line is not deployed. Contact your platform engineer |
| API or `occ`   | `release line "v9" not found for component "hello"`      | The line does not exist or belongs to another component                                                                              |

## Related Documentation

- [ReleaseLine API Reference](../../reference/api/application/releaseline.md)
- [Release Lines for Component Types](../../platform-engineer-guide/component-types/release-lines.md)
- [Deploy and Promote](./deploy-and-promote.md)
