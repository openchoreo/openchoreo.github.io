const fs = require('fs');
const path = require('path');
const { normalizeUrl } = require('@docusaurus/utils');

// Static, crawlable pagination for the blog index.
//
// The blog plugin runs with `postsPerPage: 'ALL'`, so it renders /blog/ with
// every post. The index mixes those posts with the external articles in
// src/data/externalArticles.ts, so the page count depends on both — something
// the blog plugin's own pagination can't account for. This plugin adds
// /blog/page/2/, /blog/page/3/, ... rendered by the same BlogListPage
// component, which slices the combined list by page. Every page is a real
// static route linked with <a href>, so search engines can crawl all of them.
module.exports = function pluginBlogPagination(context, options) {
  const { siteDir, baseUrl } = context;
  const postsPerPage = options.postsPerPage ?? 12;
  const blogRouteBasePath = options.blogRouteBasePath ?? 'blog';

  return {
    name: 'docusaurus-plugin-blog-pagination',

    async allContentLoaded({ allContent, actions }) {
      const blogContent = allContent['docusaurus-plugin-content-blog']?.default;
      if (!blogContent) return;

      // Same set and order the blog plugin passes to /blog/.
      const listedPosts = blogContent.blogPosts.filter((post) => !post.metadata.unlisted);

      // The pinned post is shown as the banner on page 1, not in the list.
      const listedCount = listedPosts.filter((post) => !post.metadata.frontMatter.pinned).length;
      const externalCount = countExternalArticles(siteDir);
      const totalPages = Math.max(1, Math.ceil((listedCount + externalCount) / postsPerPage));

      // BlogListPage reads these and fails the build if its own count differs.
      // The description is passed along because only /blog/ (the blog plugin's
      // route) receives the blog metadata as props.
      actions.setGlobalData({
        postsPerPage,
        totalPages,
        blogDescription: getBlogOptions(context).blogDescription ?? '',
      });

      const items = listedPosts.map((post) => ({
        content: {
          __import: true,
          path: post.metadata.source,
          query: { truncated: true },
        },
      }));

      // The post list shown in the mobile navbar menu. The blog plugin passes
      // the same data (toBlogSidebarProp) to /blog/ and its other routes.
      const { blogSidebarCount = 5 } = getBlogOptions(context);
      const sidebarPosts =
        blogSidebarCount === 'ALL'
          ? blogContent.blogPosts
          : blogContent.blogPosts.slice(0, blogSidebarCount);
      const sidebar = await actions.createData('blog-sidebar.json', {
        title: blogContent.blogSidebarTitle,
        items: sidebarPosts.map((post) => ({
          title: post.metadata.frontMatter.sidebar_label ?? post.metadata.title,
          permalink: post.metadata.permalink,
          unlisted: post.metadata.unlisted,
          date: post.metadata.date,
        })),
      });

      for (let page = 2; page <= totalPages; page++) {
        actions.addRoute({
          path: normalizeUrl([baseUrl, blogRouteBasePath, 'page', String(page), '/']),
          component: '@theme/BlogListPage',
          exact: true,
          modules: { items, sidebar },
          props: { page },
        });
      }
    },
  };
};

function getBlogOptions(context) {
  return (
    context.siteConfig.presets
      ?.flat()
      ?.map((preset) => (Array.isArray(preset) ? preset[1] : preset))
      ?.find((presetOptions) => presetOptions?.blog)?.blog ?? {}
  );
}

// Count entries in the externalArticles array. Each entry has exactly one
// `url: '...'` property; the interface declaration (`url: string;`) is skipped.
function countExternalArticles(siteDir) {
  const file = path.join(siteDir, 'src', 'data', 'externalArticles.ts');
  if (!fs.existsSync(file)) return 0;
  const source = fs.readFileSync(file, 'utf-8');
  return (source.match(/^\s+url:\s*['"`]/gm) || []).length;
}
