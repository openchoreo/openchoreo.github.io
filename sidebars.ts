import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: "category",
      label: "Overview",
      collapsed: false,
      items: ["overview/what-is-openchoreo", "overview/architecture"],
    },
    {
      type: "category",
      label: "Get Started",
      collapsed: false,
      items: [
        "getting-started/quick-start-guide",
        {
          type: "category",
          label: "Try It Out",
          collapsed: false,
          items: [
            "getting-started/try-it-out/on-k3d-locally",
            "getting-started/try-it-out/on-your-environment",
          ],
        },
        "getting-started/deploy-first-component",
        "getting-started/examples-catalog",
      ],
    },
    {
      type: "category",
      label: "Concepts",
      link: {
        type: "generated-index",
        title: "Concepts",
        description:
          "Understand the fundamental abstractions and relationships in OpenChoreo",
      },
      items: [
        "concepts/developer-abstractions",
        "concepts/platform-abstractions",
        "concepts/runtime-model",
        "concepts/resource-relationships",
      ],
    },
    {
      type: "category",
      label: "Platform Engineer Guide",
      items: [
        "platform-engineer-guide/deployment-topology",
        "platform-engineer-guide/multi-cluster-connectivity",
        "platform-engineer-guide/external-ca-tls-setup",
        "platform-engineer-guide/namespace-management",
        "platform-engineer-guide/container-registry-configuration",
        "platform-engineer-guide/identity-configuration",
        "platform-engineer-guide/authorization",
        "platform-engineer-guide/backstage-configuration",
        {
          type: "category",
          label: "API Gateway",
          items: [
            "platform-engineer-guide/api-gateway/modules",
            "platform-engineer-guide/api-gateway/topology",
          ],
        },
        "platform-engineer-guide/auto-build",
        "platform-engineer-guide/secret-management",
        "platform-engineer-guide/cluster-agent-rbac",
        "platform-engineer-guide/observability-alerting",
        "platform-engineer-guide/cli-configuration",
        "platform-engineer-guide/upgrades",
        {
          type: "category",
          label: "GitOps",
          items: [
            "platform-engineer-guide/gitops/overview",
            {
              type: "category",
              label: "Flux CD",
              items: [
                "platform-engineer-guide/gitops/fluxcd/getting-started",
                "platform-engineer-guide/gitops/fluxcd/tutorial",
              ],
            },
          ],
        },
        {
          type: "category",
          label: "Modules",
          items: [
            "platform-engineer-guide/modules/overview",
            {
              type: "category",
              label: "Building a Module",
              link: { type: "doc", id: "platform-engineer-guide/modules/building-a-module" },
              items: [
                "platform-engineer-guide/modules/observability-logging-adapter-api",
                "platform-engineer-guide/modules/observability-tracing-adapter-api",
              ],
            },
          ],
        },
      ],
    },
    {
      type: "category",
      label: "Developer Guide",
      items: [
        {
          type: "category",
          label: "CLI",
          items: [
            {
              type: "doc",
              id: "developer-guide/cli-installation",
              label: "Installation",
            },
          ],
        },
        {
          type: "category",
          label: "Workflows",
          items: [
            "developer-guide/workflows/start-here",
            "developer-guide/workflows/overview",
            "developer-guide/workflows/creating-workflows",
            "developer-guide/workflows/schema-syntax",
            "developer-guide/workflows/running-workflows",
            {
              type: "category",
              label: "CI",
              items: [
                "developer-guide/workflows/ci/overview",
                "developer-guide/workflows/ci/workload-generation",
                "developer-guide/workflows/ci/private-repository",
                "developer-guide/workflows/ci/external-ci",
              ],
            },
          ],
        },
        {
          type: "category",
          label: "GitOps",
          items: [
            "developer-guide/gitops/build-and-release-workflows",
            "developer-guide/gitops/bulk-promote",
          ],
        },
        {
          type: "category",
          label: "Component Types",
          items: [
            "developer-guide/component-types/overview",
            "developer-guide/component-types/templating-syntax",
            "developer-guide/component-types/schema-syntax",
            "developer-guide/component-types/patching-syntax",
            "developer-guide/component-types/validation-rules",
          ],
        },
        {
          type: "category",
          label: "Workload",
          items: ["developer-guide/workload/overview"],
        },
        {
          type: "category",
          label: "Dependencies",
          items: [
            {
              type: "doc",
              id: "developer-guide/dependencies/endpoints",
              label: "Endpoints",
            },
          ],
        },
        {
          type: "category",
          label: "Authorization",
          items: [
            "developer-guide/authorization/overview",
            "developer-guide/authorization/authorization-crds",
            {
              type: "doc",
              id: "developer-guide/authorization/custom-roles",
              label: "Custom Roles and Bindings",
            },
          ],
        },
      ],
    },
    {
      type: "category",
      label: "Tutorials",
      items: ["tutorials/deploy-prebuilt-image"],
    },
    {
      type: "category",
      label: "Working with AI",
      items: [
        { type: "doc", id: "ai/overview", label: "Overview" },
        {
          type: "category",
          label: "MCP Servers",
          items: ["ai/mcp-servers"],
        },
        {
          type: "category",
          label: "Built-in Agents",
          items: ["ai/rca-agent"],
        },
      ],
    },
    {
      type: "category",
      label: "References",
      items: [
        {
          type: "category",
          label: "Helm Charts",
          items: [
            "reference/helm/control-plane",
            "reference/helm/data-plane",
            "reference/helm/workflow-plane",
            "reference/helm/observability-plane",
          ],
        },
        {
          type: "category",
          label: "API Reference",
          items: [
            {
              type: "category",
              label: "Application Resources",
              items: [
                {
                  type: "doc",
                  id: "reference/api/application/project",
                  label: "Project",
                },
                {
                  type: "doc",
                  id: "reference/api/application/component",
                  label: "Component",
                },
                {
                  type: "doc",
                  id: "reference/api/application/workflowrun",
                  label: "WorkflowRun",
                },
                {
                  type: "doc",
                  id: "reference/api/application/workload",
                  label: "Workload",
                },
              ],
            },
            {
              type: "category",
              label: "Platform Resources",
              items: [
                {
                  type: "doc",
                  id: "reference/api/platform/dataplane",
                  label: "DataPlane",
                },
                {
                  type: "doc",
                  id: "reference/api/platform/clusterdataplane",
                  label: "ClusterDataPlane",
                },
                {
                  type: "doc",
                  id: "reference/api/platform/environment",
                  label: "Environment",
                },
                {
                  type: "doc",
                  id: "reference/api/platform/workflowplane",
                  label: "WorkflowPlane",
                },
                {
                  type: "doc",
                  id: "reference/api/platform/clusterworkflowplane",
                  label: "ClusterWorkflowPlane",
                },
                {
                  type: "doc",
                  id: "reference/api/platform/workflow",
                  label: "Workflow",
                },
                {
                  type: "doc",
                  id: "reference/api/platform/clusterworkflow",
                  label: "ClusterWorkflow",
                },
                {
                  type: "doc",
                  id: "reference/api/platform/observabilityplane",
                  label: "ObservabilityPlane",
                },
                {
                  type: "doc",
                  id: "reference/api/platform/clusterobservabilityplane",
                  label: "ClusterObservabilityPlane",
                },
                {
                  type: "doc",
                  id: "reference/api/platform/observabilityalertrule",
                  label: "ObservabilityAlertRule",
                },
                {
                  type: "doc",
                  id: "reference/api/platform/observabilityalertsnotificationchannel",
                  label: "ObservabilityAlertsNotificationChannel",
                },
                {
                  type: "doc",
                  id: "reference/api/platform/deployment-pipeline",
                  label: "DeploymentPipeline",
                },
                {
                  type: "doc",
                  id: "reference/api/platform/releasebinding",
                  label: "ReleaseBinding",
                },
                {
                  type: "doc",
                  id: "reference/api/platform/componenttype",
                  label: "ComponentType",
                },
                {
                  type: "doc",
                  id: "reference/api/platform/clustercomponenttype",
                  label: "ClusterComponentType",
                },
                {
                  type: "doc",
                  id: "reference/api/platform/trait",
                  label: "Trait",
                },
                {
                  type: "doc",
                  id: "reference/api/platform/clustertrait",
                  label: "ClusterTrait",
                },
                {
                  type: "doc",
                  id: "reference/api/platform/secretreference",
                  label: "SecretReference",
                },
                {
                  type: "doc",
                  id: "reference/api/platform/clusterauthzrole",
                  label: "ClusterAuthzRole",
                },
                {
                  type: "doc",
                  id: "reference/api/platform/authzrole",
                  label: "AuthzRole",
                },
                {
                  type: "doc",
                  id: "reference/api/platform/clusterauthzrolebinding",
                  label: "ClusterAuthzRoleBinding",
                },
                {
                  type: "doc",
                  id: "reference/api/platform/authzrolebinding",
                  label: "AuthzRoleBinding",
                },
              ],
            },
            {
              type: "category",
              label: "Runtime Resources",
              items: [
                {
                  type: "doc",
                  id: "reference/api/runtime/componentrelease",
                  label: "ComponentRelease",
                },
                {
                  type: "doc",
                  id: "reference/api/runtime/renderedrelease",
                  label: "RenderedRelease",
                },
              ],
            },
          ],
        },
        {
          type: "category",
          label: "CEL Reference",
          items: [
            {
              type: "doc",
              id: "reference/cel/context-variables",
              label: "Context Variables",
            },
            {
              type: "doc",
              id: "reference/cel/built-in-functions",
              label: "Built-in Functions",
            },
            {
              type: "doc",
              id: "reference/cel/configuration-helpers",
              label: "Configuration Helpers",
            },
          ],
        },
        { type: "doc", id: "reference/mcp-servers", label: "MCP Servers" },
        { type: "doc", id: "reference/cli-reference", label: "CLI Reference" },
      ],
    },
    {
      type: "doc",
      id: "reference/faq",
      label: "FAQ",
    },
    // {
    //   type: "doc",
    //   id: "reference/changelog",
    //   label: "Change Log",
    // },
    // {
    //   type: 'category',
    //   label: 'Contributor Guide',
    //   items: [],
    // },
  ],
};

export default sidebars;
