---
title: Release Lines
description: Make a component type's templates name objects and select pods per release line
---

# Release Lines for Component Types

[Release lines](../../developer-guide/deploying-applications/release-lines.md) let a developer run several lines of one component side by side. Any component can have release lines, whatever its type. Every line of a component renders into the same data plane namespace in an environment, so a type works with release lines only when its templates give each line its own objects. The default component types do.

A component's own objects make up its `default` line and keep the names they have without release lines. A type that is not line-safe never affects the default line: the line's ReleaseBinding reports `ReleaseLineNameCollision` or `ReleaseLinePodLabelOverlap` and is not deployed.

## Make a Type Line-Safe

The template context has what you need to name objects per line:

| Variable                   | Value for a release line                                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `metadata.name`            | Base name for generated resources. It already includes the line                                                              |
| `metadata.releaseLineName` | The line being rendered, for example `next`. Empty for the default line                                                      |
| `metadata.labels`          | Adds `openchoreo.dev/release-line` and `openchoreo.dev/release-line-uid`                                                     |
| `metadata.podSelectors`    | Adds the same two labels, and carries `openchoreo.dev/release-line-component-uid` in place of `openchoreo.dev/component-uid` |

Objects named from `metadata.name` need no change. For objects with a stable name, such as the Service and HTTPRoutes of a component, combine the component name and the line name. This expression gives `hello` for the default line and `hello-next` for the `next` line:

```yaml
'${metadata.releaseLineName == "" ? metadata.componentName : metadata.componentName + "-" + metadata.releaseLineName}'
```

Use it wherever the component name appears in a name, a gateway path, or a backend reference. This excerpt is from the default `service` component type:

```yaml
resources:
  - id: service
    template:
      apiVersion: v1
      kind: Service
      metadata:
        name: '${metadata.releaseLineName == "" ? metadata.componentName : metadata.componentName + "-" + metadata.releaseLineName}'
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
        name: '${oc_generate_name(metadata.releaseLineName == "" ? metadata.componentName : metadata.componentName + "-" + metadata.releaseLineName, endpoint.key)}'
      spec:
        # parentRefs and hostnames omitted
        rules:
          - matches:
              - path:
                  type: PathPrefix
                  value: '/${metadata.releaseLineName == "" ? metadata.componentName : metadata.componentName + "-" + metadata.releaseLineName}-${endpoint.key}'
            backendRefs:
              - name: '${metadata.releaseLineName == "" ? metadata.componentName : metadata.componentName + "-" + metadata.releaseLineName}'
                port: ${endpoint.value.port}
```

A line-safe type:

- Names every object from `metadata.name`, or from `metadata.componentName` together with `metadata.releaseLineName`, including gateway paths and hostnames.
- Labels pods and selects them with `metadata.podSelectors`, not `metadata.labels`. A line's pods must not carry `openchoreo.dev/component-uid`, which the default line's selectors match.
- Applies the same rules to the traits it embeds or allows. Trait templates receive the same `metadata` values.

OpenChoreo names the objects it generates itself per line, such as network policies and the ConfigMaps and Secrets derived from a Workload.

## Build Workflows

A build of a line publishes its image to that line's Workload, `<component>-<line>-workload`. The default build workflows do this. OpenChoreo labels the WorkflowRun of a line with `openchoreo.dev/release-line` and merges the line's `workflow.parameters` onto the component's before the run starts.

A custom workflow passes the label to the step that creates the Workload:

```yaml
- name: release-line
  value: "${'openchoreo.dev/release-line' in metadata.labels ? metadata.labels['openchoreo.dev/release-line'] : ''}"
```

That step then creates the Workload with `occ workload create --release-line`. An empty line publishes the default line's Workload, so the same workflow serves every line.

## Portal

Release lines are synced to the catalog as entities of kind `ReleaseLine`, part of their component. Anyone who can view the component can view its lines. They are not listed in the catalog or in search, and are reached from their component.

## Authorization and Audit

Release lines have their own actions: `releaseline:view`, `releaseline:create`, `releaseline:update`, and `releaseline:delete`, granted at component scope or above. The default `developer` and `platform-engineer` roles include all four, and the `sre`, `backstage-catalog-reader`, `rca-agent`, and `observer-resource-reader` roles include `releaseline:view`. See [Authorization](../authorization/overview.md#available-actions).

Audit records of actions on a line's resources carry `resource.release_line`. See [Audit Logging](../audit-logging.mdx).

## Related Documentation

- [Release Lines](../../developer-guide/deploying-applications/release-lines.md) for developers
- [ReleaseLine API Reference](../../reference/api/application/releaseline.md)
- [Context Variables](../../reference/cel/context-variables.md)
