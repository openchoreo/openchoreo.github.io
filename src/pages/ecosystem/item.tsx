import React, { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import Head from '@docusaurus/Head';
import { useLocation } from '@docusaurus/router';
import pluginsData from '@site/src/data/marketplace-plugins.json';
import { itemPath } from '@site/src/utils/ecosystemItems';

interface Entry {
  id: string;
  slug?: string;
}

const entries: Entry[] = pluginsData as Entry[];

// Ecosystem items used to live at /ecosystem/item/?id=<id>, and later at
// /ecosystem/item/<id>; they now live at /ecosystem/<slug>. The path-based old
// URLs are handled by static redirects (see createRedirects in
// docusaurus.config.ts), but a query string cannot be redirected statically —
// so this page stays behind to forward the ?id= links client-side.
export default function EcosystemItemLegacyRedirect(): ReactNode {
  const location = useLocation();

  const target = useMemo(() => {
    const id = new URLSearchParams(location.search).get('id');
    if (!id) return '/ecosystem/';
    const entry = entries.find((e) => e.id === id);
    return entry ? itemPath(entry) : null;
  }, [location.search]);

  // A full navigation rather than a client-side one: a router-only replace
  // swaps in the item's content but leaves this page's <head> in place, so the
  // item would be served under this page's title, canonical URL and noindex.
  // replace() also keeps the redirect out of the back-button history.
  useEffect(() => {
    if (target) window.location.replace(target);
  }, [target]);

  return (
    <Layout title="Ecosystem">
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="container margin-vert--xl text--center">
        {target ? <p>Redirecting…</p> : <p>Item not found.</p>}
        <Link to="/ecosystem/">← Back to Ecosystem</Link>
      </div>
    </Layout>
  );
}
