const fs = require('fs');
const path = require('path');

module.exports = function pluginDocsScripts(context) {
  const { siteDir } = context;

  function getVersionConfig() {
    const versionsPath = path.join(siteDir, 'versions.json');
    let versions = [];

    if (fs.existsSync(versionsPath)) {
      try {
        versions = JSON.parse(fs.readFileSync(versionsPath, 'utf-8'));
      } catch (e) {
        console.warn('[docs-scripts] Could not parse versions.json:', e.message);
      }
    }

    const versionDirs = { current: 'docs' };
    for (const version of versions) {
      versionDirs[version] = `versioned_docs/version-${version}`;
    }

    return { versionDirs, lastVersion: versions[0] || null };
  }

  function getVersionPrefix(versionName, lastVersion) {
    if (versionName === 'current') return 'next/';
    if (versionName === lastVersion) return '';
    return `${versionName}/`;
  }

  function findScripts(dir) {
    const files = [];
    if (!fs.existsSync(dir)) return files;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...findScripts(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.sh')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  return {
    name: 'docusaurus-plugin-docs-scripts',

    async postBuild({ outDir }) {
      const { versionDirs, lastVersion } = getVersionConfig();
      let total = 0;

      for (const [versionName, versionDir] of Object.entries(versionDirs)) {
        const docsDir = path.join(siteDir, versionDir);
        const scripts = findScripts(docsDir);
        const prefix = getVersionPrefix(versionName, lastVersion);

        for (const scriptPath of scripts) {
          const relativePath = path.relative(docsDir, scriptPath);
          const outputPath = path.join(outDir, 'docs', prefix, relativePath);

          fs.mkdirSync(path.dirname(outputPath), { recursive: true });
          fs.copyFileSync(scriptPath, outputPath);
          total++;
        }
      }

      if (total > 0) {
        console.log(`[docs-scripts] Copied ${total} script(s) to build/`);
      }
    },
  };
};
