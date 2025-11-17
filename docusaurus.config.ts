import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'OpenChoreo',
  tagline: 'The IDP you can start using today',
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
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          lastVersion: 'v0.3.x', // TODO: Remove this when v0.5.x is released to mark it as the latest version
          versions: {
            'v0.4.x': {
              label: 'v0.4.x (edge)',
              banner: 'none',
            },
            'v0.3.x': {
              label: 'v0.3.x',
              banner: 'none',
            }
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
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    announcementBar: {
      id: 'release_v0_3_1',
      content:
        '🎉️ OpenChoreo <a target="_blank" rel="noopener noreferrer" href="https://github.com/openchoreo/openchoreo/releases/tag/v0.3.2">v0.3.2</a> is released! 🎉️',
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
    // Replace with your project's social card
    image: 'img/openchoreo-social-card.png',
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
        {to: '/blog', label: 'Blog', position: 'left'},
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
          href: 'https://discord.com/invite/asqDFC8suT',
          position: 'right',
          className: 'header-discord-link',
          'aria-label': 'Discord server',
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
              label: 'Discord',
              href: 'https://discord.com/invite/asqDFC8suT',
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
      copyright: `© ${new Date().getFullYear()} OpenChoreo Authors | Documentation Distributed under <a href="https://creativecommons.org/licenses/by/4.0">CC BY 4.0</a>`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
