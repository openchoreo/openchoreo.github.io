const fs = require('fs');
const path = require('path');

// Registers one static route per ecosystem/marketplace entry (e.g.
// /ecosystem/item/skill-openchoreo-platform-engineer/) so items get clean,
// shareable, crawlable URLs instead of /ecosystem/item/?id=<id>. All routes
// render the same page component, which reads the id from the URL path
// (falling back to the legacy ?id= query param for old links).
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

      await Promise.all(
        entries.map((entry) =>
          actions.addRoute({
            path: `/ecosystem/item/${entry.id}`,
            component: '@site/src/pages/ecosystem/item.tsx',
            exact: true,
          }),
        ),
      );
    },
  };
};
