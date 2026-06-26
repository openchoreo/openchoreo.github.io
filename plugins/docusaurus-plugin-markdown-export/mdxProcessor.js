const fs = require('fs');

/**
 * Load constants from _constants.mdx file
 */
async function loadConstants(constantsPath) {
  if (!fs.existsSync(constantsPath)) return {};

  const content = fs.readFileSync(constantsPath, 'utf-8');
  const constants = {};

  const blockRegex = /export\s+const\s+(\w+)\s*=\s*\{([^}]+)\}/gs;
  let block;
  while ((block = blockRegex.exec(content)) !== null) {
    const [, name, body] = block;
    const obj = {};
    const propRegex = /(\w+):\s*['"]([^'"]+)['"]/g;
    let prop;
    while ((prop = propRegex.exec(body)) !== null) {
      obj[prop[1]] = prop[2];
    }
    if (Object.keys(obj).length > 0) constants[name] = obj;
  }

  return constants;
}

function replaceConstantInterpolations(content, constants) {
  let result = content;
  for (const [name, obj] of Object.entries(constants)) {
    if (!obj || typeof obj !== 'object') continue;
    for (const [key, value] of Object.entries(obj)) {
      const pattern = new RegExp(`\\$?\\{${name}\\.${key}\\}`, 'g');
      // Function replacer avoids `$&` / `$1` / etc. being treated as
      // backreferences if a constant value happens to contain `$`.
      result = result.replace(pattern, () => String(value));
    }
  }
  return result;
}

/**
 * Process MDX content and convert to clean markdown.
 *
 * `linkContext`, when provided, is used to resolve relative doc links into
 * absolute URLs so the exported `.md` works when read in isolation by an
 * LLM or any consumer that doesn't have a base URL to resolve against.
 *   linkContext: { docUrlPath, siteUrl }
 *     docUrlPath: site-absolute URL of the current doc, no extension,
 *                 e.g. "/docs/v1.0.x/getting-started/try-it-out/on-k3d-locally"
 *     siteUrl:    e.g. "https://openchoreo.dev"
 */
async function processMarkdownFile(content, constants, sourceDir, linkContext) {
  let result = content;

  // Step 1: Remove import statements
  result = removeImports(result);

  // Step 2: Remove frontmatter (will be added back with minimal info)
  const { frontmatter, body } = extractFrontmatter(result);
  result = body;

  // Step 2.5: Drop the interactive agent callout and unwrap the install picker,
  // leaving a clean manual guide (and, on the k3d page, the one-command script).
  result = processInstallComponents(result);

  // Step 3: Process CodeBlock components
  result = processCodeBlocks(result, constants);

  // Step 4: Process step-card divs into proper markdown headings
  result = processStepCards(result);

  // Step 5: Process prerequisite cards
  result = processPrerequisiteCards(result);

  // Step 6: Process content-section-highlight divs
  result = processContentSections(result);

  // Step 7: Replace version interpolations
  result = replaceVersionInterpolations(result, constants);

  // Step 8: Process image tags
  result = processImageTags(result);

  // Step 9: Process Link components
  result = processLinks(result, constants);

  // Step 10: Rewrite relative doc links to absolute `.md` URLs so they
  // resolve when the file is fetched standalone.
  result = rewriteRelativeDocLinks(result, linkContext);

  // Step 11: Clean up remaining JSX/HTML artifacts
  result = cleanupArtifacts(result);

  // Step 11: Clean up excessive whitespace
  result = cleanupWhitespace(result);

  // Add back minimal frontmatter if title exists
  if (frontmatter.title) {
    result = `---\ntitle: ${frontmatter.title}\n---\n\n${result}`;
  }

  return result;
}

function extractFrontmatter(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatterMatch) {
    return { frontmatter: {}, body: content };
  }

  const frontmatterBlock = frontmatterMatch[1];
  const frontmatter = {};

  // Parse simple key: value pairs
  const titleMatch = frontmatterBlock.match(/title:\s*(.+)/);
  if (titleMatch) {
    frontmatter.title = titleMatch[1].trim();
  }

  const body = content.slice(frontmatterMatch[0].length);
  return { frontmatter, body };
}

function processInstallComponents(content) {
  let result = content;
  // Drop interactive agent panels (prompt builder, older callout) entirely.
  result = result.replace(/<SetupOption\b[^>]*\binteractive\b[^>]*>[\s\S]*?<\/SetupOption>/g, '');
  result = result.replace(/<AgentCallout\b[^>]*>[\s\S]*?<\/AgentCallout>/g, '');
  result = result.replace(/<AgentSetupBuilder\b[^>]*\/>/g, '');
  // Unwrap the picker containers, keeping the remaining panels' markdown so the
  // exported guide reads as plain markdown.
  result = result.replace(/<\/?SetupSwitch>/g, '');
  result = result.replace(/<SetupOption\b[^>]*>/g, '');
  result = result.replace(/<\/SetupOption>/g, '');
  return result;
}

function removeImports(content) {
  // Remove all import statements (single and multi-line)
  return content.replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
}

function processCodeBlocks(content, constants) {
  // Match <CodeBlock language="...">...</CodeBlock>
  const codeBlockRegex = /<CodeBlock\s+language="([^"]+)">\s*([\s\S]*?)\s*<\/CodeBlock>/g;

  return content.replace(codeBlockRegex, (match, language, codeContent) => {
    let code = codeContent;

    // Handle String.raw template literals
    code = code.replace(/\{String\.raw`([\s\S]*?)`\}/g, '$1');

    // Handle template literals with version interpolation
    code = code.replace(/\{`([\s\S]*?)`\}/g, '$1');

    code = replaceConstantInterpolations(code, constants);

    // Clean up the code
    code = code.trim();

    return '```' + language + '\n' + code + '\n```';
  });
}

function processStepCards(content) {
  // Process step-card divs with step headers
  // This handles the nested div structure used for step cards

  // Pattern for step cards with numbered headers
  const stepCardRegex = /<div\s+className="step-card">\s*<div\s+className="step-header">\s*<div\s+className="step-header-icon">(\d+)<\/div>\s*<div\s+className="step-header-text">\s*([\s\S]*?)\s*<\/div>\s*<\/div>([\s\S]*?)<\/div>(?=\s*(?:<div\s+className="|$|\n\n[^<]|<div\s+className="content-section))/g;

  let result = content.replace(stepCardRegex, (match, number, title, innerContent) => {
    const cleanTitle = title.trim();
    const cleanContent = innerContent.trim();
    return `## ${number}. ${cleanTitle}\n\n${cleanContent}\n\n`;
  });

  return result;
}

function processPrerequisiteCards(content) {
  // Process prerequisite cards (step-card with prereq-header-text)
  const prereqRegex = /<div\s+className="step-card">\s*<div\s+className="prereq-header-text">([^<]*)<\/div>([\s\S]*?)<\/div>(?=\s*(?:<div\s+className="|$|\n\n[^<]))/g;

  return content.replace(prereqRegex, (match, header, innerContent) => {
    // Clean header - remove emojis and extra whitespace
    const cleanHeader = header.replace(/[^\w\s]/g, '').trim();
    const cleanContent = innerContent.trim();
    return `## ${cleanHeader}\n\n${cleanContent}\n\n`;
  });
}

function processContentSections(content) {
  // Remove content-section-highlight wrapper divs, keeping inner content
  // Use a loop to handle nested structures
  let result = content;
  let previousResult = '';

  while (result !== previousResult) {
    previousResult = result;
    result = result.replace(
      /<div\s+className="content-section-highlight">([\s\S]*?)<\/div>(?=\s*(?:<div\s+className="(?:step-card|content-section)"|$|\n\n[^<]|You have now))/g,
      (match, innerContent) => innerContent.trim() + '\n\n'
    );
  }

  return result;
}

function replaceVersionInterpolations(content, constants) {
  return replaceConstantInterpolations(content, constants);
}

function processImageTags(content) {
  // Convert <img src={require(...).default} /> to markdown images
  // Handle various attribute orders and optional attributes

  let result = content;

  // Pattern 1: src first, then alt
  result = result.replace(
    /<img\s+src=\{require\(['"]([^'"]+)['"]\)\.default\}\s+alt="([^"]*)"\s*[^>]*\/?>/g,
    (match, imgPath, alt) => `![${alt}](${imgPath})`
  );

  // Pattern 2: alt first (or other attributes), then src
  result = result.replace(
    /<img\s+[^>]*src=\{require\(['"]([^'"]+)['"]\)\.default\}[^>]*alt="([^"]*)"[^>]*\/?>/g,
    (match, imgPath, alt) => `![${alt}](${imgPath})`
  );

  // Pattern 3: Only src, no alt
  result = result.replace(
    /<img\s+src=\{require\(['"]([^'"]+)['"]\)\.default\}[^>]*\/?>/g,
    (match, imgPath) => `![](${imgPath})`
  );

  return result;
}

function processLinks(content, constants) {
  let result = content;

  // Convert <Link to={`...`}>text</Link> to markdown links (template literals)
  result = result.replace(
    /<Link\s+to=\{`([^`]+)`\}>([^<]+)<\/Link>/g,
    (match, url, text) => `[${text}](${replaceConstantInterpolations(url, constants)})`
  );

  // Convert <Link to="...">text</Link> to markdown links (static strings)
  result = result.replace(/<Link\s+to="([^"]+)">([^<]+)<\/Link>/g, '[$2]($1)');

  return result;
}

// Rewrite relative doc links so they resolve when the .md is fetched
// standalone by an LLM or any consumer that has no base URL to resolve
// against. Handles:
//   - `./foo`, `../foo`, `foo/bar` (relative paths) → absolute `https://…/<dir>/foo.md`
//   - `/docs/foo` (site-absolute docs paths)        → absolute `https://…/docs/foo.md`
//   - `.mdx` → `.md`, missing extension → `.md`
//   - preserves `#anchor` and `?query`
//   - leaves external URLs, anchor-only links, and asset links untouched
//   - skips inside fenced code blocks and inline code spans
function rewriteRelativeDocLinks(content, linkContext) {
  if (!linkContext || !linkContext.docUrlPath || !linkContext.siteUrl) {
    return content;
  }
  const parts = content.split(/(```[\s\S]*?```)/g);
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) continue; // odd indices are fenced code blocks
    parts[i] = parts[i].replace(
      /(`[^`\n]*`)|(!?)\[([^\]]+)\]\(([^)\s]+)(\s+"[^"]*")?\)/g,
      (match, codeSpan, bang, text, url, title) => {
        if (codeSpan !== undefined) return codeSpan;
        if (bang === '!') return match; // image
        const newUrl = rewriteDocLinkUrl(url, linkContext);
        return `[${text}](${newUrl}${title || ''})`;
      }
    );
  }
  return parts.join('');
}

function rewriteDocLinkUrl(url, { docUrlPath, siteUrl }) {
  // External URL or scheme (https://, mailto:, tel:, etc.) — leave alone.
  if (/^([a-z][a-z0-9+.\-]*:|\/\/)/i.test(url)) return url;
  // Pure anchor — leave alone.
  if (url.startsWith('#')) return url;

  const hashIdx = url.indexOf('#');
  const queryIdx = url.indexOf('?');
  let cutIdx = url.length;
  if (hashIdx !== -1) cutIdx = Math.min(cutIdx, hashIdx);
  if (queryIdx !== -1) cutIdx = Math.min(cutIdx, queryIdx);

  let pathPart = url.slice(0, cutIdx);
  const tail = url.slice(cutIdx);

  if (!pathPart) return url;

  // Normalize extension first.
  if (/\.mdx$/i.test(pathPart)) {
    pathPart = pathPart.replace(/\.mdx$/i, '.md');
  } else if (!/\.md$/i.test(pathPart)) {
    // Skip asset-like paths (e.g., .png, .yaml, .sh) — link to assets, not docs.
    if (/\.[a-z0-9]{1,5}$/i.test(pathPart)) return url;
    pathPart = pathPart.replace(/\/$/, '') + '.md';
  }

  // Resolve to a site-absolute path.
  let absPath;
  if (pathPart.startsWith('/')) {
    absPath = pathPart;
  } else {
    // Relative — resolve against the current doc's directory.
    const baseDir = docUrlPath.replace(/\/[^/]*$/, ''); // strip filename
    absPath = resolvePath(baseDir + '/' + pathPart);
  }

  return siteUrl.replace(/\/$/, '') + absPath + tail;
}

// Posix-style path normalization: collapse '.', '..', and '//'.
function resolvePath(p) {
  const segments = p.split('/');
  const out = [];
  for (const seg of segments) {
    if (seg === '' || seg === '.') {
      // keep leading empty (root) but skip others
      if (out.length === 0 && seg === '') out.push('');
      continue;
    }
    if (seg === '..') {
      if (out.length > 1) out.pop();
      continue;
    }
    out.push(seg);
  }
  return out.join('/') || '/';
}

function cleanupArtifacts(content) {
  let result = content;

  // Remove remaining div tags with classNames (iteratively to handle nesting)
  let previousResult = '';
  while (result !== previousResult) {
    previousResult = result;
    // Remove opening tags
    result = result.replace(/<div\s+className="[^"]*">\s*/g, '');
    // Remove closing tags
    result = result.replace(/<\/div>/g, '');
  }

  // Remove JSX-style className attributes from any remaining tags
  result = result.replace(/\s+className="[^"]*"/g, '');

  // Remove width/style attributes from remaining tags
  result = result.replace(/\s+width="[^"]*"/g, '');
  result = result.replace(/\s+style=\{\{[^}]*\}\}/g, '');

  // Clean up empty JSX expressions
  result = result.replace(/\{['"][^'"]*['"]\}/g, '');

  return result;
}

function cleanupWhitespace(content) {
  let result = content;

  // Remove excessive blank lines (more than 2 consecutive)
  result = result.replace(/\n{4,}/g, '\n\n\n');

  // Remove trailing whitespace from lines
  result = result.replace(/[ \t]+$/gm, '');

  // Trim leading/trailing whitespace
  result = result.trim();

  // Ensure file ends with single newline
  result += '\n';

  return result;
}

module.exports = {
  loadConstants,
  processMarkdownFile,
};
