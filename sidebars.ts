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
            'getting-started/try-it-out/on-k3d-locally',
            'getting-started/try-it-out/on-your-environment',
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
        'operations/external-ca-tls-setup',
        'operations/namespace-management',
        'operations/container-registry-configuration',
        'operations/identity-configuration',
        'operations/authorization',
        'operations/backstage-configuration',
        'operations/api-management',
        {
          type: 'category',
          label: 'API Gateway',
          items: [
            'operations/api-gateway/modules',
            'operations/api-gateway/topology',
          ],
        },
        'operations/auto-build',
        'operations/secret-management',
        'operations/cluster-agent-rbac',
        'operations/observability-alerting',
        'operations/rca-agent',
        'operations/cli-configuration',
        'operations/upgrades',
        {
          type: 'category',
          label: 'GitOps',
          items: [
            'operations/gitops/overview',
            {
              type: 'category',
              label: 'Flux CD',
              items: [
                'operations/gitops/fluxcd/getting-started',
                'operations/gitops/fluxcd/tutorial',
              ],
            },
          ],
        },
        {
          type: 'category',
          label: 'Modules',
          items: [
            'operations/modules/overview',
            {
              type: 'category',
              label: 'Building a Module',
              link: { type: 'doc', id: 'operations/modules/building-a-module' },
              items: [
                'operations/modules/observability-logging-adapter-api',
                'operations/modules/observability-tracing-adapter-api',
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
          label: 'CLI',
          items: [
            {type: 'doc', id: 'user-guide/cli-installation', label: 'Installation'},
          ],
        },
        {
          type: 'category',
          label: 'Workflows',
          items: [
            'user-guide/workflows/start-here',
            'user-guide/workflows/overview',
            'user-guide/workflows/creating-workflows',
            'user-guide/workflows/running-workflows',
            'user-guide/workflows/workflow-schema',
            {
              type: 'category',
              label: 'CI',
              items: [
                'user-guide/workflows/ci/overview',
                'user-guide/workflows/ci/workload-generation',
                'user-guide/workflows/ci/private-repository',
                'user-guide/workflows/ci/external-ci',
              ],
            },
          ],
        },
        {
          type: 'category',
          label: 'GitOps',
          items: [
            'user-guide/gitops/build-and-release-workflows',
            'user-guide/gitops/bulk-promote',
          ],
        },
        {
          type: 'category',
          label: 'Component Types',
          items: [
            'user-guide/component-types/overview',
            'user-guide/component-types/templating-syntax',
            'user-guide/component-types/schema-syntax',
            'user-guide/component-types/patching-syntax',
            'user-guide/component-types/validation-rules',
          ],
        },
        {
          type: 'category',
          label: 'Workload',
          items: [
            'user-guide/workload/overview',
          ],
        },
        {
          type: 'category',
          label: 'Dependencies',
          items: [
            {type: 'doc', id: 'user-guide/dependencies/endpoints', label: 'Endpoints'},
          ],
        },
        {
          type: 'category',
          label: 'Authorization',
          items: [
            'user-guide/authorization/overview',
            'user-guide/authorization/authorization-crds',
            {type: 'doc', id: 'user-guide/authorization/custom-roles', label: 'Custom Roles and Bindings'},
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
            'reference/helm/workflow-plane',
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
                {type: 'doc', id: 'reference/api/application/workflowrun', label: 'WorkflowRun'},
                {type: 'doc', id: 'reference/api/application/workload', label: 'Workload'},
                {type: 'doc', id: 'reference/api/application/componentdeployment', label: 'ComponentDeployment (Deprecated)'},
                {type: 'doc', id: 'reference/api/application/service', label: 'Service (Deprecated)'},
                {type: 'doc', id: 'reference/api/application/webapplication', label: 'WebApplication (Deprecated)'},
                {type: 'doc', id: 'reference/api/application/scheduledtask', label: 'ScheduledTask (Deprecated)'}
              ]
            },
            {
              type: 'category',
              label: 'Platform Resources',
              items: [
                {type: 'doc', id: 'reference/api/platform/dataplane', label: 'DataPlane'},
                {type: 'doc', id: 'reference/api/platform/clusterdataplane', label: 'ClusterDataPlane'},
                {type: 'doc', id: 'reference/api/platform/environment', label: 'Environment'},
                {type: 'doc', id: 'reference/api/platform/workflowplane', label: 'WorkflowPlane'},
                {type: 'doc', id: 'reference/api/platform/clusterworkflowplane', label: 'ClusterWorkflowPlane'},
                {type: 'doc', id: 'reference/api/platform/workflow', label: 'Workflow'},
                {type: 'doc', id: 'reference/api/platform/clusterworkflow', label: 'ClusterWorkflow'},
                {type: 'doc', id: 'reference/api/platform/observabilityplane', label: 'ObservabilityPlane'},
                {type: 'doc', id: 'reference/api/platform/clusterobservabilityplane', label: 'ClusterObservabilityPlane'},
                {type: 'doc', id: 'reference/api/platform/observabilityalertrule', label: 'ObservabilityAlertRule'},
                {type: 'doc', id: 'reference/api/platform/observabilityalertsnotificationchannel', label: 'ObservabilityAlertsNotificationChannel'},
                {type: 'doc', id: 'reference/api/platform/deployment-pipeline', label: 'DeploymentPipeline'},
                {type: 'doc', id: 'reference/api/platform/releasebinding', label: 'ReleaseBinding'},
                {type: 'doc', id: 'reference/api/platform/componenttype', label: 'ComponentType'},
                {type: 'doc', id: 'reference/api/platform/clustercomponenttype', label: 'ClusterComponentType'},
                {type: 'doc', id: 'reference/api/platform/trait', label: 'Trait'},
                {type: 'doc', id: 'reference/api/platform/clustertrait', label: 'ClusterTrait'},
                {type: 'doc', id: 'reference/api/platform/secretreference', label: 'SecretReference'},
                {type: 'doc', id: 'reference/api/platform/authzclusterrole', label: 'AuthzClusterRole'},
                {type: 'doc', id: 'reference/api/platform/authzrole', label: 'AuthzRole'},
                {type: 'doc', id: 'reference/api/platform/authzclusterrolebinding', label: 'AuthzClusterRoleBinding'},
                {type: 'doc', id: 'reference/api/platform/authzrolebinding', label: 'AuthzRoleBinding'},
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
                {type: 'doc', id: 'reference/api/runtime/renderedrelease', label: 'RenderedRelease'}
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
            {type: 'doc', id: 'reference/mcp-servers/mcp-servers-overview', label: 'Overview'},
            {type: 'doc', id: 'reference/mcp-servers/mcp-ai-configuration', label: 'Configure with AI Assistants'},
          ],
        },
        {type: 'doc', id: 'reference/cli-reference', label: 'CLI Reference'},
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
