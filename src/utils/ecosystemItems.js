// URL helpers for ecosystem item pages, shared between the build-time route
// plugin (plugins/docusaurus-plugin-ecosystem-items), the redirect config in
// docusaurus.config.ts, and the components that link to item pages — so all of
// them agree on the URL of an entry. CommonJS because the route plugin is
// plain Node.

// Sub-paths under /ecosystem/ that are pages in their own right. An item slug
// must not collide with one of these, or the item route would shadow the page.
const RESERVED_ECOSYSTEM_SLUGS = ['item'];

// The URL slug for a marketplace entry. Defaults to the entry's id, but an
// entry may set an explicit `slug` to change its URL without changing its id —
// the id is the item's identity and is what the item page looks entries up by.
function itemSlug(entry) {
  return entry.slug || entry.id;
}

// The canonical path of an item page, e.g. /ecosystem/agentgateway.
function itemPath(entry) {
  return `/ecosystem/${itemSlug(entry)}`;
}

module.exports = { RESERVED_ECOSYSTEM_SLUGS, itemSlug, itemPath };
