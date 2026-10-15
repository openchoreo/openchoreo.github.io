import type { ReactNode } from "react";
import React from "react";
import Layout from "@theme/Layout";
import Head from "@docusaurus/Head";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

// Import all homepage components
import HomepageHero from "@site/src/components/HomepageHero";
import WhatIsOpenChoreo from "@site/src/components/WhatIsOpenChoreo";
import GetStarted from "@site/src/components/GetStarted";
import Community from "@site/src/components/Community";
import CNCF from "@site/src/components/CNCF";
import EntryVectors from '@site/src/components/EntryVectors';
import PersonaBasedValueProps from '@site/src/components/PersonaBasedValueProps';

import styles from "./index.module.css";

// The hero heading in HomepageHero, in title case. Set directly rather than
// through Layout's title prop, which would append " | OpenChoreo" and repeat
// the name.
const PAGE_TITLE = "Build Your Internal Developer Platform with OpenChoreo";

/**
 * Main Homepage Component
 * This is the entry point for the homepage
 */
export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  const definition = siteConfig.customFields.definition as string;

  // Structured data for search engines: names the project, its logo, and the
  // profiles that belong to it, so they are understood as one entity.
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: "OpenChoreo",
        description: definition,
        url: `${siteConfig.url}/`,
        logo: `${siteConfig.url}/img/openchoreo-logo.png`,
        sameAs: [
          "https://github.com/openchoreo",
          "https://www.linkedin.com/company/openchoreo/",
          "https://x.com/openchoreo",
          "https://www.youtube.com/channel/UCDbwm2OF2KI6C9awR9TnNEg",
          "https://www.cncf.io/projects/openchoreo/",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        name: "OpenChoreo",
        url: `${siteConfig.url}/`,
        publisher: { "@id": `${siteConfig.url}/#organization` },
      },
      {
        // The open-source project itself, as distinct from the organization.
        "@type": "SoftwareSourceCode",
        "@id": `${siteConfig.url}/#software`,
        name: "OpenChoreo",
        description: definition,
        url: `${siteConfig.url}/`,
        codeRepository: "https://github.com/openchoreo/openchoreo",
        license: "https://www.apache.org/licenses/LICENSE-2.0",
        programmingLanguage: "Go",
        runtimePlatform: "Kubernetes",
        author: { "@id": `${siteConfig.url}/#organization` },
      },
    ],
  };

  return (
    <Layout description={definition}>
      <Head>
        <title>{PAGE_TITLE}</title>
        <meta property="og:title" content={PAGE_TITLE} />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Head>
      <main className={styles.homepage}>
        <HomepageHero />
        <EntryVectors />
        <WhatIsOpenChoreo />
        <PersonaBasedValueProps />
        <GetStarted />
        <Community />
        <CNCF />
      </main>
    </Layout>
  );
}
