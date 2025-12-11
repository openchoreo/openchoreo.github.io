import React from 'react';
import DocBreadcrumbs from '@theme-original/DocBreadcrumbs';
import type DocBreadcrumbsType from '@theme/DocBreadcrumbs';
import type { WrapperProps } from '@docusaurus/types';
import { useLocation } from '@docusaurus/router';
import MarkdownButton from './MarkdownButton';
import styles from './styles.module.css';

type Props = WrapperProps<typeof DocBreadcrumbsType>;

export default function DocBreadcrumbsWrapper(props: Props): JSX.Element {
  const location = useLocation();

  // Build the markdown URL
  // Current path: /docs/getting-started/quick-start-guide/
  // Markdown URL: /md/docs/getting-started/quick-start-guide.md
  const markdownUrl = '/md' + location.pathname.replace(/\/$/, '') + '.md';

  return (
    <div className={styles.breadcrumbsContainer}>
      <DocBreadcrumbs {...props} />
      <MarkdownButton markdownUrl={markdownUrl} />
    </div>
  );
}
