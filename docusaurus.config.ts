import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import path from 'path';
import versions from './versions.json';

// The docs version served unprefixed at /docs/* — must match `lastVersion` in
// the docs preset below. This is NOT always versions[0]: a pre-release can be
// prepended to versions.json while a stable release stays the default.
const lastVersion = 'v1.1.x';
const latestVersion = lastVersion;

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'OpenChoreo',
  tagline:
    'A complete, open-source developer platform for Kubernetes, ready to use from day one, built to integrate with your stack.',
  favicon: 'img/favicon.ico',

  customFields: {
    // Stamped once per build (Node.js). The community events page reads this as
    // its initial "now" so the upcoming/past split renders identically during
    // SSR and the first client paint (no hydration mismatch); after mount it
    // switches to the real client clock. Refreshed on every build, so a
    // scheduled rebuild is all that's needed to keep the static HTML current.
    buildTimestamp: new Date().toISOString(),
  },

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://savisaluwadana.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/openchoreo.github.io/',
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
    '@docsearch/docusaurus-adapter',
    './plugins/docusaurus-plugin-swagger-dark-mode',
    './plugins/docusaurus-plugin-markdown-export',
    './plugins/docusaurus-plugin-llms-txt',
    './plugins/docusaurus-plugin-docs-scripts',
    [
      '@docusaurus/plugin-client-redirects',
      {
        // Docusaurus serves the latest docs version unprefixed (/docs/foo),
        // so /docs/<latestVersion>/foo 404s. For each real /docs/foo page,
        // register /docs/<latestVersion>/foo as an alias that redirects to it.
        // Reads latestVersion from versions.json, so no manual updates per release.
        createRedirects(existingPath: string) {
          const isDocsPath =
            existingPath === '/docs' || existingPath.startsWith('/docs/');
          const isVersionedDocsPath = versions.some((v) => {
            const versionedDocsPath = `/docs/${v}`;
            return (
              existingPath === versionedDocsPath ||
              existingPath.startsWith(`${versionedDocsPath}/`)
            );
          });
          const isLatestDocsPath = isDocsPath && !isVersionedDocsPath;

          if (!isLatestDocsPath) return undefined;

          const aliasWithLatestVersionPrefix = existingPath.replace(
            /^\/docs/,
            `/docs/${latestVersion}`,
          );
          return [aliasWithLatestVersionPrefix];
        },
      },
    ],
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
          lastVersion,
          versions: {
            'v1.2.0-m.1': {
              label: 'v1.2.0-m.1 (pre-release)',
              banner: 'unreleased',
              noIndex: true,
            },
            'v1.1.x': {
              label: 'v1.1.x',
            },
            'v1.0.x': {
              label: 'v1.0.x',
              banner: 'none',
              noIndex: true,
            },
            'v0.17.x': {
              label: 'v0.17.x',
              noIndex: true,
            },
            'v0.16.x': {
              label: 'v0.16.x',
              noIndex: true,
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
          postsPerPage: 'ALL',
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          blogSidebarTitle: 'All posts',
          blogSidebarCount: 'ALL',
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
        gtag: {
          trackingID: 'G-5EY968JNZT',
          anonymizeIP: true,
        },
      } satisfies Preset.Options,
    ],
  ],

  headTags: [
    {
      tagName: 'script',
      attributes: {},
      innerHTML: `
(function () {
  var latestDocsVersionPath = '/docs/${latestVersion}';
  var pathname = window.location.pathname;
  var normalizedPathname =
    pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  if (normalizedPathname === latestDocsVersionPath) {
    window.location.replace('/docs/' + window.location.search + window.location.hash);
  }
})();
`,
    },
  ],

  clientModules: [path.join(__dirname, 'src/clientModules/gtagGuard.ts')],

  themeConfig: {
    announcementBar: {
      id: 'release_v1_1_2',
      content:
        '🎉️ OpenChoreo <a target="_blank" rel="noopener noreferrer" href="https://github.com/openchoreo/openchoreo/releases/tag/v1.1.2">v1.1.2</a> has been released! 🎉',
      isCloseable: true,
    },
    docsearch: {
      appId: 'B8ST9KVWVJ',
      // Public API key: it is safe to commit it
      apiKey: '53ad1b2482e937fc0fa7b577236e6d1a',
      indexName: 'openchoreo',
      askAi: {
        assistantId: 'a5c29055-7164-4661-b4ac-8d5c28d4d593',
        // LLM-optimized index (paragraph-level markdown) used for Ask AI retrieval,
        // separate from the keyword-oriented DocSearch index above.
        indexName: 'openchoreo-llm-md',
        sidePanel: true,
        // Route chat through Agent Studio (the assistant above was created
        // under Generative AI → Agent Studio). Experimental per DocSearch docs.
        agentStudio: true,
      },
    },
    colorMode: {
      respectPrefersColorScheme: true,
    },
    image: 'img/openchoreo-opengraph.png',
    navbar: {
      title: 'OpenChoreo',
      logo: {
        alt: 'OpenChoreo',
        src: 'img/openchoreo-logo.svg',
        srcDark: 'img/openchoreo-logo-dark.svg',
      },
      items: [
        {
          label: 'Explore',
          position: 'left',
          items: [
            {
              to: '/explore/backstage-powered-developer-portal',
              label: 'Backstage-Powered Developer Portal',
            },
            {
              to: '/explore/observability',
              label: 'Observability',
            },
          ],
        },
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        { to: '/ecosystem', label: 'Ecosystem', position: 'left' },
        { to: '/blog', label: 'Blog', position: 'left' },
        { to: '/community', label: 'Community', position: 'left' },
        { to: '/enterprise', label: 'Enterprise', position: 'left' },
        {
          type: 'docsVersionDropdown',
          position: 'right',
        },
        {
          type: 'custom-gitHubStars',
          position: 'right',
        },
        {
          href: 'https://github.com/openchoreo/openchoreo',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
        {
          to: '/slack',
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
