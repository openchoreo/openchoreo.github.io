---
title: Release Lines
description: Make a component type's templates name objects and select pods per release line
---

# Release Lines for Component Types

[Release lines](../../developer-guide/deploying-applications/release-lines.md) let a developer run several lines of one component side by side. Any component can have release lines, whatever its type. Every line of a component renders into the same data plane namespace in an environment, so a type works with release lines only when its templates give each line its own objects. The default component types do.

An installation upgraded from v1.3 keeps the v1.3 default component types and build workflows, which are not line-safe. To use release lines, upgrade them as [Upgrading from v1.3 to v1.4](../upgrades/v1.3-to-v1.4.mdx#release-lines) describes.

A component's own objects make up its `main` line and keep the names they have without release lines. A line's ReleaseBinding reports `ReleaseLineNameCollision` and is not deployed when the line would render an object with the same kind, namespace, and name as another line's object. It reports `ReleaseLinePodLabelOverlap` when the line's pods or selectors would overlap the main line's. These checks run on a line's binding only. They don't block a main line deployed to an environment after such a line, and they don't compare gateway paths or hostnames. Make a type line-safe before its components add lines.

## Make a Type Line-Safe

The template context has what you need to name objects per line:

| Variable                     | Value for a release line                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `metadata.name`              | Base name for generated resources. It already includes the line                                                                             |
| `metadata.releaseLineName`   | The line being rendered, for example `next`. Empty for the main line                                                                        |
| `metadata.componentLineName` | A name for the line's component-level objects, such as its Service, for example `hello-next-4833a175`. The component name for the main line |
| `metadata.labels`            | Adds `openchoreo.dev/release-line` and `openchoreo.dev/release-line-uid`                                                                    |
| `metadata.podSelectors`      | Adds the same two labels, and carries `openchoreo.dev/release-line-component-uid` in place of `openchoreo.dev/component-uid`                |

Objects named from `metadata.name` need no change. For objects with a stable name, such as the Service and HTTPRoutes of a component, and for gateway paths and hostnames, use `metadata.componentLineName` for a line. This expression gives `hello` for the main line and `hello-next-<hash>` for the `next` line:

```yaml
'${metadata.releaseLineName == "" ? metadata.componentName : metadata.componentLineName}'
```

The hash keeps a line's names and URLs apart from those of other lines and other components, such as a component named `hello-next`. It depends only on the component and the line, so a line's URLs don't change between releases. Use the expression wherever the component name appears in a name, a gateway path, a hostname, or a backend reference. This excerpt is from the default `service` component type:

```yaml
resources:
  - id: service
    template:
      apiVersion: v1
      kind: Service
      metadata:
        name: '${metadata.releaseLineName == "" ? metadata.componentName : metadata.componentLineName}'
        namespace: ${metadata.namespace}
        labels: ${metadata.labels}
      spec:
        selector: ${metadata.podSelectors}
        ports: ${workload.toServicePorts()}
  - id: httproute-external
    forEach: '${workload.endpoints.transformMap(name, ep, "external" in ep.visibility && ep.type in ["HTTP", "GraphQL", "Websocket"], ep)}'
    var: endpoint
    template:
      apiVersion: gateway.networking.k8s.io/v1
      kind: HTTPRoute
      metadata:
        name: '${oc_generate_name(metadata.releaseLineName == "" ? metadata.componentName : metadata.componentLineName, endpoint.key)}'
      spec:
        # parentRefs and hostnames omitted
        rules:
          - matches:
              - path:
                  type: PathPrefix
                  value: '/${metadata.releaseLineName == "" ? metadata.componentName : metadata.componentLineName}-${endpoint.key}'
            backendRefs:
              - name: '${metadata.releaseLineName == "" ? metadata.componentName : metadata.componentLineName}'
                port: ${endpoint.value.port}
```

A line-safe type:

- Names every object, gateway path and hostname from `metadata.name` or `metadata.componentLineName`.
- Labels pods and selects them with `metadata.podSelectors`, not `metadata.labels`. A line's pods must not carry `openchoreo.dev/component-uid`, which the main line's selectors match.
- Applies the same rules to the traits it embeds or allows. Trait templates receive the same `metadata` values.

OpenChoreo names the objects it generates itself the same way, such as network policies, the ConfigMaps and Secrets derived from a Workload, and a line's Workload, ComponentReleases and ReleaseBindings.

## Build Workflows

A build of a line publishes its image to that line's Workload, `hello-next-<hash>-workload` for the `next` line of `hello`. The default build workflows do this, and tag a line's images with the line, for example `v1-next-f8ab4c8c`, so lines that build the same commit don't overwrite each other's images. A run started through `occ`, the API, the MCP tools, the portal, or auto-build labels the WorkflowRun of a line with `openchoreo.dev/release-line` and merges the line's `workflow.parameters` onto the component's. A WorkflowRun you apply yourself needs both, the label and the merged parameters.

A custom workflow passes the label to the step that creates the Workload:

```yaml
- name: release-line
  value: "${'openchoreo.dev/release-line' in metadata.labels ? metadata.labels['openchoreo.dev/release-line'] : ''}"
```

That step then creates the Workload with `occ workload create --release-line`. An empty line publishes the main line's Workload, so the same workflow serves every line. The default workflows tag images the same way:

```yaml
- name: image-tag
  value: "${'openchoreo.dev/release-line' in metadata.labels ? 'v1-' + metadata.labels['openchoreo.dev/release-line'] : 'v1'}"
```

## Portal

Release lines are synced to the catalog as entities of kind `ReleaseLine`, part of their component. They are not listed in the catalog or in search, and are reached from their component. A line's entity is visible to anyone who can view its component. The component's release lines view and a line's details need `releaseline:view`.

## Authorization and Audit

Release lines have their own actions: `releaseline:view`, `releaseline:create`, `releaseline:update`, and `releaseline:delete`, granted at component scope or above. The default `developer` and `platform-engineer` roles include all four, and the `sre`, `backstage-catalog-reader`, `rca-agent`, and `observer-resource-reader` roles include `releaseline:view`. See [Authorization](../authorization/overview.md#available-actions).

Audit records of actions on a line's resources carry `resource.release_line`. See [Audit Logging](../audit-logging.mdx).

## Related Documentation

- [Release Lines](../../developer-guide/deploying-applications/release-lines.md) for developers
- [ReleaseLine API Reference](../../reference/api/application/releaseline.md)
- [Context Variables](../../reference/cel/context-variables.md)
