import React from 'react';
import type { ReactNode } from 'react';
import Head from '@docusaurus/Head';
import Original from '@theme-original/Blog/Pages/BlogAuthorsListPage';
import type OriginalType from '@theme/Blog/Pages/BlogAuthorsListPage';
import type { WrapperProps } from '@docusaurus/types';

type Props = WrapperProps<typeof OriginalType>;

// Listing page with little content of its own: keep it out of the index but
// let crawlers follow its links to the posts.
export default function BlogAuthorsListPageWrapper(props: Props): ReactNode {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <Original {...props} />
    </>
  );
}
