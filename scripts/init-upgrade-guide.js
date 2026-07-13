#!/usr/bin/env node

// Scaffold the upgrade guide for the next semantic version in docs/ (the "next",
// unreleased documentation).
//
// Run this AFTER cutting a versioned snapshot with
// `npm run docusaurus docs:version <vX.Y.x>` (see the "Documentation Versioning"
// section of README.md). At that point docs/ becomes the docs for the following
// minor version, so it needs the upgrade guide describing how to reach it.
//
// The script looks at the version that was just cut (the first entry in
// versions.json), computes the next minor, and creates
//   docs/platform-engineer-guide/upgrades/v<released>-to-v<next>.mdx
// from a template, then wires it into sidebars.ts (newest guide first) and the
// upgrades overview. Upgrade guides use concrete versions on both sides; there
// is no "latest" placeholder.
//
// It runs only for normal minor releases (vX.Y.x). If the most recent version is
// a milestone or rc pre-release (e.g. v1.2.0-m.1, v1.2.0-rc.1), it does nothing,
// so it is safe to wire into any release flow.
//
// Usage:
//   node scripts/init-upgrade-guide.js         # next = newest released minor + 1
//   node scripts/init-upgrade-guide.js v1.3    # override the target (next) version

const fs = require('fs');
const path = require('path');

const UPGRADES_REL = 'platform-engineer-guide/upgrades';
const UPGRADES_DIR = path.join('docs', UPGRADES_REL);
const SIDEBARS_TS = 'sidebars.ts';
const OVERVIEW = path.join(UPGRADES_DIR, 'overview.mdx');
const VERSIONS_JSON = 'versions.json';

function fail(msg) {
  console.error(`[ERROR] ${msg}`);
  process.exit(1);
}

function reEscape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// `docusaurus docs:version` prepends the new version to versions.json, so
// versions[0] is the version that was just cut. Return { major, minor, short }
// only when it is a stable minor (vX.Y.x). Return { skip: true, latest } when
// there is nothing to act on: an empty versions list (latest is null) or a
// milestone/rc pre-release (e.g. v1.2.0-m.1, v1.2.0-rc.1). Upgrade guides are
// initiated for normal minor releases only.
function justReleasedMinor() {
  const versions = JSON.parse(fs.readFileSync(VERSIONS_JSON, 'utf8'));
  const latest = versions[0];
  if (!latest) return { skip: true, latest: null };
  const m = latest.match(/^v(\d+)\.(\d+)\.x$/);
  if (!m) return { skip: true, latest };
  return { major: Number(m[1]), minor: Number(m[2]), short: `v${m[1]}.${m[2]}` };
}

function template(from, to) {
  return `---
title: ${from} to ${to}
description: Upgrade an OpenChoreo installation from ${from} to ${to}.
sidebar_position: 2
---

{/* Document any breaking changes and migration steps introduced in ${to} here before the release ships. */}

# Upgrading from ${from} to ${to}

There are no backward-incompatible changes to call out for this upgrade yet.
Follow the [standard upgrade process](./overview.mdx): apply each plane's updated
CRDs, then \`helm upgrade\` the control, data, workflow, and observability planes
in order.
`;
}

// Insert the new guide id at the top of the upgrades category items (right after
// the overview entry), so the newest guide is listed first.
function patchSidebars(from, to) {
  const overviewId = `${UPGRADES_REL}/overview`;
  const newId = `${UPGRADES_REL}/${from}-to-${to}`;
  let content = fs.readFileSync(SIDEBARS_TS, 'utf8');

  if (content.includes(`"${newId}"`)) return; // already wired

  const line = new RegExp(`^([ \\t]*)"${reEscape(overviewId)}",[ \\t]*$`, 'm');
  const m = content.match(line);
  if (!m) {
    console.warn(`[WARN] ${SIDEBARS_TS}: overview entry not found; add "${newId}" manually`);
    return;
  }
  content = content.replace(line, `${m[0]}\n${m[1]}"${newId}",`);
  fs.writeFileSync(SIDEBARS_TS, content);
  console.log(`  ${SIDEBARS_TS}: + ${newId} (after overview)`);
}

// Add a default bullet as the first entry of the overview's guide list.
function patchOverview(from, to) {
  if (!fs.existsSync(OVERVIEW)) return;
  let content = fs.readFileSync(OVERVIEW, 'utf8');
  if (content.includes(`(./${from}-to-${to}.mdx)`)) return; // already present

  const marker = '## Upgrade guides';
  const idx = content.indexOf(marker);
  if (idx === -1) {
    console.warn(`[WARN] ${OVERVIEW}: "${marker}" not found; add the guide bullet manually`);
    return;
  }
  const rel = content.slice(idx).search(/\n- \*\*\[/);
  if (rel === -1) {
    console.warn(`[WARN] ${OVERVIEW}: no existing guide bullet found; add one manually`);
    return;
  }
  const at = idx + rel; // position of the "\n- **[" of the first bullet
  const bullet = `\n- **[${from} to ${to}](./${from}-to-${to}.mdx)** — no backward-incompatible changes yet; follow the standard process.`;
  content = content.slice(0, at) + bullet + content.slice(at);
  fs.writeFileSync(OVERVIEW, content);
  console.log(`  ${OVERVIEW}: + guide-list bullet for ${from} to ${to}`);
}

function main() {
  const released = justReleasedMinor();
  if (released.skip) {
    if (released.latest === null) {
      console.log(`Skipping: ${VERSIONS_JSON} lists no released versions.`);
    } else {
      console.log(
        `Skipping: the most recent documentation version is "${released.latest}", not a stable minor (vX.Y.x).`,
      );
      console.log(
        'Upgrade guides are initiated for normal minor releases only, not milestone or rc pre-releases.',
      );
    }
    return;
  }
  const from = released.short; // e.g. v1.2

  let to = process.argv[2];
  if (to) {
    if (!/^v\d+\.\d+$/.test(to)) fail(`target version must look like "v1.3", got "${to}"`);
  } else {
    to = `v${released.major}.${released.minor + 1}`;
  }

  const fileName = `${from}-to-${to}.mdx`;
  const filePath = path.join(UPGRADES_DIR, fileName);
  if (fs.existsSync(filePath)) {
    console.log(`${filePath} already exists; nothing to do.`);
    return;
  }

  fs.writeFileSync(filePath, template(from, to));
  console.log(`Initiated upgrade guide for ${from} -> ${to}:`);
  console.log(`  created ${filePath}`);
  patchSidebars(from, to);
  patchOverview(from, to);

  console.log('\nDone. Fill in the breaking changes for the new release, then run `npm run build`.');
}

main();
