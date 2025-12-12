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
            'getting-started/try-it-out/run-locally',
            'getting-started/try-it-out/run-on-your-cluster',
          ],
        },
        {
          type: 'category',
          label: 'Go to Production',
          collapsed: false,
          items: [
            'getting-started/production/deployment-planning',
            'getting-started/production/single-cluster',
            'getting-started/production/multi-cluster',
          ],
        },
        'getting-started/deploy-first-component',
        'learn-from-examples/examples-catalog'
      ]
    },
    {
      type: 'category',
      label: 'Operations Guide',
      items: [
        'operations/upgrades',
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
      label: 'Reference',
      items: [
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
                {type: 'doc', id: 'reference/api/application/workflowrun', label: 'WorkflowRun'},
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
                {type: 'doc', id: 'reference/api/platform/deployment-pipeline', label: 'DeploymentPipeline'},
                {type: 'doc', id: 'reference/api/platform/releasebinding', label: 'ReleaseBinding'},
                {type: 'doc', id: 'reference/api/platform/componenttype', label: 'ComponentType'},
                {type: 'doc', id: 'reference/api/platform/trait', label: 'Trait'},
                {type: 'doc', id: 'reference/api/platform/workflow', label: 'Workflow'},
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
