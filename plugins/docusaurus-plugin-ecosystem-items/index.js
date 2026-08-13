const fs = require('fs');
const path = require('path');
const {
  RESERVED_ECOSYSTEM_SLUGS,
  itemSlug,
  itemPath,
} = require('../../src/utils/ecosystemItems');

// Slugs are a single URL path segment, so they may not be empty or contain
// characters that would split or escape the path.
const VALID_SLUG = /^[A-Za-z0-9._~-]+$/;

// Fails the build rather than shipping an item that is unreachable or that
// shadows another page, since either only shows up as a 404 in production.
function validate(entries, jsonPath) {
  const seen = new Map();

  for (const entry of entries) {
    if (!entry || typeof entry.id !== 'string' || entry.id === '') {
      throw new Error(
        `[ecosystem-items] every entry in ${jsonPath} needs a non-empty "id": ` +
          `got ${JSON.stringify(entry)}`,
      );
    }

    const slug = itemSlug(entry);

    if (!VALID_SLUG.test(slug)) {
      throw new Error(
        `[ecosystem-items] "${slug}" is not a usable URL segment (entry "${entry.id}"). ` +
          `Slugs may only contain letters, digits, "-", "_", "." and "~".`,
      );
    }

    if (RESERVED_ECOSYSTEM_SLUGS.includes(slug)) {
      throw new Error(
        `[ecosystem-items] entry "${entry.id}" resolves to the reserved path ` +
          `${itemPath(entry)}, which is an existing page. Give the entry a "slug" ` +
          `that is not one of: ${RESERVED_ECOSYSTEM_SLUGS.join(', ')}.`,
      );
    }

    const clash = seen.get(slug);
    if (clash) {
      throw new Error(
        `[ecosystem-items] entries "${clash}" and "${entry.id}" both resolve to ` +
          `${itemPath(entry)}. Give one of them a distinct "slug".`,
      );
    }
    seen.set(slug, entry.id);
  }
}

// Registers one static route per ecosystem/marketplace entry (e.g.
// /ecosystem/skill-openchoreo-platform-engineer/) so items get clean,
// shareable, crawlable URLs. All routes render the same page component, which
// reads the slug from the URL path. Items used to live under /ecosystem/item/;
// those URLs are kept alive by createRedirects in docusaurus.config.ts.
module.exports = function pluginEcosystemItems(context) {
  const { siteDir } = context;

  return {
    name: 'docusaurus-plugin-ecosystem-items',

    async contentLoaded({ actions }) {
      const jsonPath = path.join(siteDir, 'src', 'data', 'marketplace-plugins.json');
      let entries;
      try {
        entries = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      } catch (e) {
        throw new Error(`[ecosystem-items] could not read ${jsonPath}: ${e.message}`);
      }

      if (!Array.isArray(entries)) {
        throw new Error(`[ecosystem-items] expected ${jsonPath} to contain an array`);
      }

      validate(entries, jsonPath);

      await Promise.all(
        entries.map((entry) =>
          actions.addRoute({
            path: itemPath(entry),
            component: '@site/src/components/EcosystemItem',
            exact: true,
          }),
        ),
      );
    },
  };
};
