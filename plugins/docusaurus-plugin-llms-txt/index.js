const fs = require('fs');
const path = require('path');

module.exports = function pluginLlmsTxt(context, options = {}) {
  const { siteConfig } = context;
  const sidebarName = options.sidebarName || 'docsSidebar';

  let loadedVersions = null;

  function fileNameForVersion(version) {
    if (version.versionName === 'current') return 'llms-next.txt';
    return `llms-${version.versionName}.txt`;
  }

  function absoluteUrl(permalink) {
    if (!permalink) return '';
    if (/^https?:\/\//.test(permalink)) return permalink;
    const host = (siteConfig.url || '').replace(/\/$/, '');
    return host + permalink;
  }

  // Mirror the URL convention from docusaurus-plugin-markdown-export:
  //   /docs/<prefix>/<slug>          → /docs/<prefix>/<slug>.md
  //   /docs/<prefix>/  (root slug)   → /docs/<prefix>.md
  //   /docs/                         → /docs.md
  function markdownUrl(permalink) {
    if (!permalink) return '';
    const trimmed = permalink.replace(/\/+$/, '');
    return absoluteUrl(trimmed + '.md');
  }

  function escapeInline(s) {
    if (!s) return '';
    return String(s).replace(/\s+/g, ' ').trim();
  }

  function formatBullet(doc, overrideLabel) {
    const title = escapeInline(overrideLabel || doc.title || doc.id);
    const url = markdownUrl(doc.permalink);
    return `- [${title}](${url})`;
  }

  function getDocByRef(ref, docsById) {
    return docsById.get(ref) || null;
  }

  // Render a category's body: direct doc/link bullets first, then nested
  // categories as deeper headings. `depth` is the heading level for nested
  // categories (e.g. 3 → "###").
  function renderCategoryBody(items, depth, lines, docsById) {
    const directBullets = [];
    const subcategories = [];

    for (const item of items) {
      if (typeof item === 'string') {
        const doc = getDocByRef(item, docsById);
        if (doc) directBullets.push(formatBullet(doc));
      } else if (!item || typeof item !== 'object') {
        continue;
      } else if (item.type === 'doc' || item.type === 'ref') {
        const doc = getDocByRef(item.id, docsById);
        if (doc) directBullets.push(formatBullet(doc, item.label));
      } else if (item.type === 'category') {
        subcategories.push(item);
      } else if (item.type === 'link' && item.href) {
        directBullets.push(
          `- [${escapeInline(item.label || item.href)}](${item.href})`
        );
      }
    }

    for (const b of directBullets) lines.push(b);
    if (directBullets.length) lines.push('');

    const heading = '#'.repeat(Math.min(depth, 6));
    for (const sub of subcategories) {
      lines.push(`${heading} ${escapeInline(sub.label)}`);
      lines.push('');
      if (sub.link?.type === 'doc') {
        const doc = getDocByRef(sub.link.id, docsById);
        if (doc) {
          lines.push(formatBullet(doc, sub.label));
          lines.push('');
        }
      }
      renderCategoryBody(sub.items || [], depth + 1, lines, docsById);
    }
  }

  function siteRootUrl() {
    const host = (siteConfig.url || '').replace(/\/$/, '');
    const base = siteConfig.baseUrl || '/';
    return host + (base.startsWith('/') ? base : '/' + base);
  }

  function appendVersionsFooter(lines, allVersions) {
    if (!allVersions || allVersions.length === 0) return;
    const root = siteRootUrl();
    lines.push('## Other versions');
    lines.push('');
    const lastVersion = allVersions.find((v) => v.isLast);
    if (lastVersion) {
      lines.push(
        `- [Latest stable (${lastVersion.label || lastVersion.versionName})](${root}llms.txt)`
      );
    }
    for (const v of allVersions) {
      if (v.versionName === 'current') {
        lines.push(`- [Bleeding edge (next)](${root}llms-next.txt)`);
      } else {
        lines.push(`- [${v.label || v.versionName}](${root}llms-${v.versionName}.txt)`);
      }
    }
    lines.push('');
  }

  function buildContent(version, allVersions) {
    const sidebar = version.sidebars?.[sidebarName];
    const docsById = new Map();
    for (const d of version.docs || []) {
      docsById.set(d.id, d);
      if (d.unversionedId && !docsById.has(d.unversionedId)) {
        docsById.set(d.unversionedId, d);
      }
    }

    const versionLabel = version.label || version.versionName;
    const lines = [];
    lines.push(`# ${siteConfig.title} Documentation (${versionLabel})`);
    lines.push('');
    if (siteConfig.tagline) {
      lines.push(`> ${siteConfig.tagline}`);
      lines.push('');
    }

    if (!sidebar) {
      lines.push(`_No sidebar named "${sidebarName}" found for this version._`);
      return lines.join('\n') + '\n';
    }

    for (const item of sidebar) {
      if (typeof item === 'string') {
        const doc = getDocByRef(item, docsById);
        if (!doc) continue;
        lines.push(`## ${escapeInline(doc.title || doc.id)}`);
        lines.push('');
        lines.push(formatBullet(doc));
        lines.push('');
      } else if (item.type === 'doc' || item.type === 'ref') {
        const doc = getDocByRef(item.id, docsById);
        if (!doc) continue;
        lines.push(`## ${escapeInline(item.label || doc.title || doc.id)}`);
        lines.push('');
        lines.push(formatBullet(doc, item.label));
        lines.push('');
      } else if (item.type === 'category') {
        lines.push(`## ${escapeInline(item.label)}`);
        lines.push('');
        if (item.link?.type === 'doc') {
          const doc = getDocByRef(item.link.id, docsById);
          if (doc) {
            lines.push(formatBullet(doc, item.label));
            lines.push('');
          }
        }
        renderCategoryBody(item.items || [], 3, lines, docsById);
      } else if (item.type === 'link' && item.href) {
        lines.push(`## ${escapeInline(item.label || item.href)}`);
        lines.push('');
        lines.push(`- [${escapeInline(item.label || item.href)}](${item.href})`);
        lines.push('');
      }
    }

    appendVersionsFooter(lines, allVersions);

    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
  }

  return {
    name: 'docusaurus-plugin-llms-txt',

    async allContentLoaded({ allContent }) {
      const docsPlugin = allContent?.['docusaurus-plugin-content-docs'];
      const docsContent = docsPlugin?.default;
      if (!docsContent?.loadedVersions) {
        console.warn('[llms-txt] docs plugin content not found; skipping');
        return;
      }
      loadedVersions = docsContent.loadedVersions;
    },

    async postBuild({ outDir }) {
      if (!loadedVersions) {
        console.warn('[llms-txt] no loaded versions; skipping');
        return;
      }

      let written = 0;
      let lastVersionContent = null;

      for (const version of loadedVersions) {
        const content = buildContent(version, loadedVersions);
        const fileName = fileNameForVersion(version);
        const outPath = path.join(outDir, fileName);
        fs.writeFileSync(outPath, content);
        written++;
        if (version.isLast) lastVersionContent = content;
      }

      if (lastVersionContent) {
        fs.writeFileSync(path.join(outDir, 'llms.txt'), lastVersionContent);
        written++;
      } else {
        console.warn('[llms-txt] no version flagged isLast; llms.txt not written');
      }

      console.log(`[llms-txt] Wrote ${written} llms*.txt files to build/`);
    },
  };
};
