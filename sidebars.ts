import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

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
      type: 'category',
      label: 'Overview',
      collapsed: false,
      items: [
        'overview/what-is-openchoreo',
        'overview/architecture'
      ],
    },
    {
      type: 'category',
      label: 'Get Started',
      collapsed: false,
      items: [
        'getting-started/quick-start-guide',
        {
          type: 'category',
          label: 'Try It Out',
          collapsed: false,
          items: [
            'getting-started/try-it-out/on-self-hosted-kubernetes',
            'getting-started/try-it-out/on-managed-kubernetes',
          ],
        },
        'getting-started/deploy-first-component',
        'learn-from-examples/examples-catalog'
      ]
    },
    {
      type: 'category',
      label: 'Operator Manual',
      items: [
        'operations/deployment-topology',
        'operations/multi-cluster-connectivity',
        'operations/identity-configuration',
        'operations/backstage-configuration',
        'operations/api-management',
        'operations/auto-build',
        'operations/container-registry',
        'operations/secret-management',
        'operations/component-workflow-secrets',
        'operations/cluster-agent-rbac',
        'operations/observability-alerting',
        'operations/rca-agent',
        'operations/upgrades',
        {
          type: 'category',
          label: 'GitOps',
          items: [
            'operations/gitops/overview',
            {
              type: 'category',
              label: 'FluxCD',
              items: [
                'operations/gitops/fluxcd/getting-started',
              ],
            },
          ],
        },
      ]
    },
    {
      type: 'category',
      label: 'Use Cases',
      items: [
        'use-cases/deploy-prebuilt-image',
        'use-cases/api-management',
      ]
    },
    {
      type: 'category',
      label: 'Concepts',
      link: {
        type: 'generated-index',
        title: 'Concepts',
        description: 'Understand the fundamental abstractions and relationships in OpenChoreo',
      },
      items: [
        'concepts/developer-abstractions',
        'concepts/platform-abstractions',
        'concepts/runtime-model',
        'concepts/resource-relationships'
      ]
    },
    {
      type: 'category',
      label: 'User Guide',
      items: [
        {
          type: 'category',
          label: 'Component Types',
          items: [
            'user-guide/component-types/overview',
            'user-guide/component-types/templating-syntax',
            'user-guide/component-types/schema-syntax',
            'user-guide/component-types/patching-syntax',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        {
          type: 'category',
          label: 'Helm Charts',
          items: [
            'reference/helm/control-plane',
            'reference/helm/data-plane',
            'reference/helm/build-plane',
            'reference/helm/observability-plane',
          ],
        },
        {
          type: 'category',
          label: 'API Reference',
          items: [
            {
              type: 'category',
              label: 'Application Resources',
              items: [
                {type: 'doc', id: 'reference/api/application/project', label: 'Project'},
                {type: 'doc', id: 'reference/api/application/component', label: 'Component'},
                {type: 'doc', id: 'reference/api/application/workload', label: 'Workload'},
                {type: 'doc', id: 'reference/api/application/componentdeployment', label: 'ComponentDeployment (Deprecated)'},
                {type: 'doc', id: 'reference/api/application/build', label: 'Build (Deprecated)'},
                {type: 'doc', id: 'reference/api/application/service', label: 'Service (Deprecated)'},
                {type: 'doc', id: 'reference/api/application/webapplication', label: 'WebApplication (Deprecated)'},
                {type: 'doc', id: 'reference/api/application/scheduledtask', label: 'ScheduledTask (Deprecated)'}
              ]
            },
            {
              type: 'category',
              label: 'Platform Resources',
              items: [
                {type: 'doc', id: 'reference/api/platform/organization', label: 'Organization'},
                {type: 'doc', id: 'reference/api/platform/dataplane', label: 'DataPlane'},
                {type: 'doc', id: 'reference/api/platform/environment', label: 'Environment'},
                {type: 'doc', id: 'reference/api/platform/buildplane', label: 'BuildPlane'},
                {type: 'doc', id: 'reference/api/platform/observabilityplane', label: 'ObservabilityPlane'},
                {type: 'doc', id: 'reference/api/platform/observabilityalertrule', label: 'ObservabilityAlertRule'},
                {type: 'doc', id: 'reference/api/platform/observabilityalertsnotificationchannel', label: 'ObservabilityAlertsNotificationChannel'},
                {type: 'doc', id: 'reference/api/platform/deployment-pipeline', label: 'DeploymentPipeline'},
                {type: 'doc', id: 'reference/api/platform/releasebinding', label: 'ReleaseBinding'},
                {type: 'doc', id: 'reference/api/platform/componenttype', label: 'ComponentType'},
                {type: 'doc', id: 'reference/api/platform/trait', label: 'Trait'},
                {type: 'doc', id: 'reference/api/platform/secretreference', label: 'SecretReference'},
                {type: 'doc', id: 'reference/api/platform/serviceclass', label: 'ServiceClass (Deprecated)'},
                {type: 'doc', id: 'reference/api/platform/webapplicationclass', label: 'WebApplicationClass (Deprecated)'},
                {type: 'doc', id: 'reference/api/platform/scheduledtaskclass', label: 'ScheduledTaskClass (Deprecated)'}
              ]
            },
            {
              type: 'category',
              label: 'Runtime Resources',
              items: [
                {type: 'doc', id: 'reference/api/runtime/componentrelease', label: 'ComponentRelease'},
                {type: 'doc', id: 'reference/api/runtime/release', label: 'Release'},
                {type: 'doc', id: 'reference/api/runtime/servicebinding', label: 'ServiceBinding (Deprecated)'},
                {type: 'doc', id: 'reference/api/runtime/webapplicationbinding', label: 'WebApplicationBinding (Deprecated)'},
                {type: 'doc', id: 'reference/api/runtime/scheduledtaskbinding', label: 'ScheduledTaskBinding (Deprecated)'}
              ]
            }
          ]
        },
        {
          type: 'category',
          label: 'CEL Reference',
          items: [
            {type: 'doc', id: 'reference/cel/context-variables', label: 'Context Variables'},
            {type: 'doc', id: 'reference/cel/built-in-functions', label: 'Built-in Functions'},
            {type: 'doc', id: 'reference/cel/configuration-helpers', label: 'Configuration Helpers'},
          ],
        },
        {
          type: 'category',
          label: 'MCP Servers',
          items: [
            {type: 'doc', id: 'reference/mcp-servers/mcp-configuration', label: 'MCP Configuration'},
          ],
        },
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
  ],
};

export default sidebars;
