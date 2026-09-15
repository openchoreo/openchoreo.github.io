#!/usr/bin/env node
/**
 * Search relevance smoke test for the openchoreo.dev DocSearch index.
 *
 * Replays the exact query the site's search modal sends (same contextual facet
 * filters, same hitsPerPage) and asserts two things per golden query:
 *
 *   1. relevance  - the expected page appears within RANK_LIMIT
 *   2. anti-flood - the 20 returned hits span at least MIN_DISTINCT_PAGES pages,
 *                   so a single doc can't monopolise the modal
 *
 * Read-only: uses the public search key already committed in docusaurus.config.ts.
 *
 *   node scripts/search-smoke.mjs
 *   node scripts/search-smoke.mjs --index openchoreo_ranktest
 */

import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const HITS_PER_PAGE = 20; // what the DocSearch modal requests
const DEFAULT_RANK_LIMIT = 3; // expected page must land in the top N unless a case overrides it
const MIN_DISTINCT_PAGES = 8; // of the 20 hits, at least N distinct pages
const RANK_SCAN_PAGES = 5; // how far to look when reporting an out-of-range rank

/**
 * Golden queries: terms real users type, mapped to the page they should reach.
 * Paths are matched against `url_without_anchor`, so a deep-link to the right
 * page still counts as a hit.
 */
const GOLDEN = [
  {query: 'authorization', path: '/docs/platform-engineer-guide/authorization/overview/'},
  {query: 'rbac', path: '/docs/platform-engineer-guide/authorization/overview/'},
  {query: 'custom roles', path: '/docs/platform-engineer-guide/authorization/custom-roles/'},
  {
    query: 'observability',
    path: '/docs/platform-engineer-guide/observability-alerting/',
    // Genuinely ambiguous term. ObservabilityAlertRule and
    // ObservabilityAlertsNotificationChannel match on their own page titles, so they
    // rank above the guide and no index setting demotes them. Held to top 5.
    rankLimit: 5,
  },
  {query: 'cel conditions', path: '/docs/platform-engineer-guide/authorization/conditions/'},
];

function readDocsearchConfig() {
  const src = readFileSync(resolve(ROOT, 'docusaurus.config.ts'), 'utf8');
  const pick = (key) => {
    const m = src.match(new RegExp(`${key}:\\s*'([^']+)'`));
    if (!m) throw new Error(`could not find algolia "${key}" in docusaurus.config.ts`);
    return m[1];
  };
  return {appId: pick('appId'), apiKey: pick('apiKey'), indexName: pick('indexName')};
}

/** The docs version served unprefixed at /docs/* — same source Docusaurus uses. */
function readPinnedVersion() {
  return JSON.parse(readFileSync(resolve(ROOT, 'versions.json'), 'utf8'))[0];
}

async function search({appId, apiKey, indexName}, query, {page = 0, facetFilters}) {
  const res = await fetch(`https://${appId}-dsn.algolia.net/1/indexes/${encodeURIComponent(indexName)}/query`, {
    method: 'POST',
    headers: {'X-Algolia-API-Key': apiKey, 'X-Algolia-Application-Id': appId},
    body: JSON.stringify({query, page, hitsPerPage: HITS_PER_PAGE, facetFilters, attributesToHighlight: []}),
  });
  if (!res.ok) throw new Error(`algolia ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

/** Rank of the first hit on `path`, scanning past page 1 so failures report a real number. */
async function rankOf(cfg, query, path, facetFilters) {
  let scanned = 0;
  for (let page = 0; page < RANK_SCAN_PAGES; page++) {
    const {hits, nbPages} = await search(cfg, query, {page, facetFilters});
    const idx = hits.findIndex((h) => new URL(h.url_without_anchor).pathname === path);
    if (idx !== -1) return {rank: scanned + idx + 1, firstPage: page === 0 ? hits : null};
    scanned += hits.length;
    if (page >= nbPages - 1) break;
  }
  return {rank: null, firstPage: null};
}

async function main() {
  const argIdx = process.argv.indexOf('--index');
  const cfg = readDocsearchConfig();
  if (argIdx !== -1) cfg.indexName = process.argv[argIdx + 1];

  const version = readPinnedVersion();
  // Mirrors @docsearch/docusaurus-adapter contextual search: locale + docs version tags.
  const facetFilters = ['language:en', ['docusaurus_tag:default', `docusaurus_tag:docs-default-${version}`]];

  console.log(`index: ${cfg.indexName}   docs version: ${version}\n`);
  console.log('query'.padEnd(16) + 'rank'.padStart(6) + 'pages/20'.padStart(10) + '  result');
  console.log('-'.repeat(64));

  let failures = 0;
  for (const {query, path: expected, rankLimit = DEFAULT_RANK_LIMIT} of GOLDEN) {
    const {rank} = await rankOf(cfg, query, expected, facetFilters);
    const {hits} = await search(cfg, query, {facetFilters});
    const distinct = new Set(hits.map((h) => h.url_without_anchor)).size;

    const problems = [];
    if (rank === null || rank > rankLimit) problems.push(`expected ${expected} at rank <= ${rankLimit}, got ${rank ?? 'not found'}`);
    if (distinct < MIN_DISTINCT_PAGES) problems.push(`only ${distinct} distinct pages in top ${HITS_PER_PAGE} (want >= ${MIN_DISTINCT_PAGES})`);
    if (problems.length) failures++;

    console.log(
      query.padEnd(16) +
        String(rank ?? '-').padStart(6) +
        String(distinct).padStart(10) +
        `  ${problems.length ? 'FAIL' : 'ok'}`,
    );
    for (const p of problems) console.log(' '.repeat(32) + `- ${p}`);
  }

  console.log('-'.repeat(64));
  console.log(`${GOLDEN.length - failures}/${GOLDEN.length} passed`);
  if (failures) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
