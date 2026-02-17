import React from 'react';
import {useLocation} from '@docusaurus/router';
import Link from '@docusaurus/Link';

export default function VersionAwareModulesLink(): React.ReactNode {
  const {pathname} = useLocation();

  // Hide on released version docs (any /docs/ path except /docs/next/)
  const isReleasedDocs = pathname.startsWith('/docs/') && !pathname.startsWith('/docs/next/');
  // Also hide on the exact /docs/ path (latest version root)
  const isDocsRoot = pathname === '/docs/' || pathname === '/docs';

  if (isReleasedDocs || isDocsRoot) {
    return null;
  }

  return (
    <Link to="/modules" className="navbar__item navbar__link">
      Modules
    </Link>
  );
}
