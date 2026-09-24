import type { ReactNode } from "react";
import React from "react";
import Layout from "@theme/Layout";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

// Import all homepage components
import HomepageHero from "@site/src/components/HomepageHero";
import WhatIsOpenChoreo from "@site/src/components/WhatIsOpenChoreo";
import GetStarted from "@site/src/components/GetStarted";
import Community from "@site/src/components/Community";
import CNCF from "@site/src/components/CNCF";
import ValueProps from '@site/src/components/ValueProps';
import Personas from '@site/src/components/Personas';

import styles from "./index.module.css";

/**
 * Main Homepage Component
 * This is the entry point for the homepage
 */
export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      title={siteConfig.tagline}
      description='Build your Internal Developer Platform with OpenChoreo. Go from zero to platform, or take what you have further. One IDP for humans and agents.'
    >
      <div className={styles.homepage}>
        <HomepageHero />
        <ValueProps />
        <WhatIsOpenChoreo />
        <Personas />
        <GetStarted />
        <Community />
        <CNCF />
      </div>
    </Layout>
  );
}
