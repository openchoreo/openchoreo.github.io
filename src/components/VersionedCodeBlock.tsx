import React from 'react';
import CodeBlock from '@theme/CodeBlock';
import { useDocsVersion } from '@docusaurus/plugin-content-docs/client';

function getDocsPrefix(versionMetadata: { isLast: boolean; version: string }): string {
  if (versionMetadata.isLast) return '/docs';
  if (versionMetadata.version === 'current') return '/docs/next';
  return `/docs/${versionMetadata.version}`;
}

export default function VersionedCodeBlock({
  script,
  language = 'bash',
}: {
  script: (docsPrefix: string) => string;
  language?: string;
}) {
  const version = useDocsVersion();
  const docsPrefix = getDocsPrefix(version);

  return <CodeBlock language={language}>{script(docsPrefix)}</CodeBlock>;
}
