import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'OpenChoreo',
  tagline: 'A complete, open-source developer platform for Kubernetes, ready to use from day one, built to integrate with your stack.',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://openchoreo.dev',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',
  // Set true for GitHub pages deployment.
  trailingSlash: true,

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'openchoreo', // Usually your GitHub org/user name.
  projectName: 'openchoreo.github.io', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  onDuplicateRoutes: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // Enable mermaid for markdown files
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  plugins: [
    './plugins/docusaurus-plugin-swagger-dark-mode',
    './plugins/docusaurus-plugin-markdown-export',
    './plugins/docusaurus-plugin-docs-scripts',
    function webpackPolyfillsPlugin() {
      const webpack = require('webpack');
      return {
        name: 'webpack-polyfills',
        configureWebpack() {
          return {
            resolve: {
              fallback: {
                stream: require.resolve('stream-browserify'),
                buffer: require.resolve('buffer/'),
              },
            },
            plugins: [
              new webpack.ProvidePlugin({
                Buffer: ['buffer', 'Buffer'],
              }),
            ],
          };
        },
      };
    },
  ],

  // Enable mermaid theme
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          lastVersion: 'v0.17.x',
          versions: {
            'v1.0.0-rc.1': {
              label: 'v1.0.0-rc.1 (pre-release)',
            },
            'v0.17.x': {
              label: 'v0.17.x',
            },
            'v0.16.x': {
              label: 'v0.16.x',
            },
            'v0.15.x': {
              label: 'v0.15.x',
            },
            'v0.14.x': {
              label: 'v0.14.x',
            },
          },
          sidebarPath: './sidebars.ts',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/openchoreo/openchoreo.github.io/edit/main/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/openchoreo/openchoreo.github.io/edit/main/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'throw',
          onInlineAuthors: 'throw',
          onUntruncatedBlogPosts: 'throw',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    announcementBar: {
      id: 'release_v0_17_0',
      content:
        '🎉️ OpenChoreo <a target="_blank" rel="noopener noreferrer" href="https://github.com/openchoreo/openchoreo/releases/tag/v0.17.0">v0.17.0</a> has been released! Explore what’s new. 🎉',
      isCloseable: true,
    },
    algolia: {
      appId: 'B8ST9KVWVJ',
      // Public API key: it is safe to commit it
      apiKey: '53ad1b2482e937fc0fa7b577236e6d1a',
      indexName: 'openchoreo',
    },
    colorMode: {
      respectPrefersColorScheme: true,
    },
    image: 'img/openchoreo-opengraph.png',
    navbar: {
      title: 'OpenChoreo',
      logo: {
        alt: 'OpenChoreo Logo',
        src: 'img/openchoreo-logo.svg',
        srcDark: 'img/openchoreo-logo-dark.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        { to: '/modules', label: 'Modules', position: 'left' },
        { to: '/blog', label: 'Blog', position: 'left' },
        {
          type: 'docsVersionDropdown',
          position: 'right',
        },
        // {
        //   type: 'custom-gitHubStars',
        //   position: 'right',
        // },
        {
          href: 'https://github.com/openchoreo/openchoreo',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
        {
          href: 'https://slack.cncf.io/',
          position: 'right',
          className: 'header-slack-link',
          'aria-label': 'Slack channel',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Overview',
              to: '/docs',
            },
            {
              label: 'Quick Start Guide',
              to: '/docs/getting-started/quick-start-guide',
            },
            {
              label: 'Concepts',
              to: '/docs/category/concepts',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'CNCF Slack (#openchoreo)',
              href: 'https://slack.cncf.io/',
            },
            {
              label: 'GitHub Discussions',
              href: 'https://github.com/openchoreo/openchoreo/discussions',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/openchoreo/openchoreo',
            },
          ],
        },
      ], 
      copyright: `Copyright © 2026 OpenChoreo Project Authors. All rights reserved.<br>The Linux Foundation has registered trademarks and uses trademarks. For a list of trademarks of The Linux Foundation, please see our <a href="https://www.linuxfoundation.org/trademark-usage">Trademark Usage page</a>.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
