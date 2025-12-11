const fs = require('fs');
const path = require('path');
const { processMarkdownFile, loadConstants } = require('./mdxProcessor');

module.exports = function pluginMarkdownExport(context, options = {}) {
  const { siteDir } = context;

  // Version configuration matching docusaurus.config.ts
  const LAST_VERSION = 'v0.7.x';
  const VERSION_DIRS = {
    'current': 'docs',  // Maps to /docs/next/ in URL
    'v0.7.x': 'versioned_docs/version-v0.7.x',
    'v0.6.x': 'versioned_docs/version-v0.6.x',
    'v0.5.x': 'versioned_docs/version-v0.5.x',
    'v0.4.x': 'versioned_docs/version-v0.4.x',
    'v0.3.x': 'versioned_docs/version-v0.3.x',
  };

  // Get URL prefix for a version
  function getVersionPrefix(versionName) {
    if (versionName === 'current') return 'next/';
    if (versionName === LAST_VERSION) return '';  // lastVersion has no prefix
    return `${versionName}/`;
  }

  // Recursively find all .md and .mdx files
  function findMarkdownFiles(dir, baseDir = dir) {
    const files = [];
    if (!fs.existsSync(dir)) return files;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...findMarkdownFiles(fullPath, baseDir));
      } else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
        // Skip _constants.mdx and category files
        if (entry.name.startsWith('_') || entry.name === 'category.json') continue;

        const relativePath = path.relative(baseDir, fullPath);
        // Convert to slug (remove extension, use forward slashes)
        const slug = relativePath.replace(/\.(md|mdx)$/, '').split(path.sep).join('/');
        files.push({ fullPath, slug });
      }
    }
    return files;
  }

  // Export markdown files for all versions
  async function exportAllVersions(outputBaseDir) {
    let totalExported = 0;

    for (const [versionName, versionDir] of Object.entries(VERSION_DIRS)) {
      const docsDir = path.join(siteDir, versionDir);
      if (!fs.existsSync(docsDir)) {
        console.log(`[markdown-export] Skipping ${versionName}: ${versionDir} not found`);
        continue;
      }

      // Load constants for this version
      const constantsPath = path.join(docsDir, '_constants.mdx');
      const constants = await loadConstants(constantsPath);

      // Find all markdown files
      const files = findMarkdownFiles(docsDir);
      console.log(`[markdown-export] Processing ${versionName}: ${files.length} docs`);

      const versionPrefix = getVersionPrefix(versionName);

      for (const { fullPath, slug } of files) {
        const outputPath = path.join(outputBaseDir, 'docs', versionPrefix, slug + '.md');

        try {
          const sourceContent = fs.readFileSync(fullPath, 'utf-8');
          const cleanMarkdown = await processMarkdownFile(
            sourceContent,
            constants,
            path.dirname(fullPath)
          );

          fs.mkdirSync(path.dirname(outputPath), { recursive: true });
          fs.writeFileSync(outputPath, cleanMarkdown);
          totalExported++;
        } catch (error) {
          console.error(`[markdown-export] Error processing ${fullPath}:`, error.message);
        }
      }
    }

    return totalExported;
  }

  return {
    name: 'docusaurus-plugin-markdown-export',

    // Generate markdown files when content is loaded (works in both dev and build)
    async contentLoaded({ actions }) {
      console.log('[markdown-export] Generating markdown files...');

      // Generate to static/md directory so files are served in dev mode
      // Using /md/ prefix to avoid conflicts with Docusaurus internals
      const staticDir = path.join(siteDir, 'static', 'md');
      const totalExported = await exportAllVersions(staticDir);

      console.log(`[markdown-export] Generated ${totalExported} markdown files to static/md/`);
    },

    // Also generate during build to ensure files are in the build output
    async postBuild({ outDir }) {
      console.log('[markdown-export] Generating markdown files for build...');

      // Use /md/ prefix in build output too for consistency
      const mdOutDir = path.join(outDir, 'md');
      const totalExported = await exportAllVersions(mdOutDir);

      console.log(`[markdown-export] Exported ${totalExported} markdown files to build/md/`);
    },
  };
};
