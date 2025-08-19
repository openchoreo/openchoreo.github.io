import type {ReactNode} from 'react';
import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

// Import all homepage components
import HomepageHero from '@site/src/components/HomepageHero';
import WhatIsOpenChoreo from '@site/src/components/WhatIsOpenChoreo';
import FeatureCards from '@site/src/components/FeatureCards';
import GetStarted from '@site/src/components/GetStarted';
import TechStack from '@site/src/components/TechStack';
import Community from '@site/src/components/Community';
import FinalCTA from '@site/src/components/FinalCTA';

import styles from './index.module.css';

/**
 * Main Homepage Component
 * This is the entry point for the homepage
 */
export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();

  return (
    <Layout title={siteConfig.tagline} description={siteConfig.tagline}>

      <div className={styles.homepage}>
        <HomepageHero/>
        <WhatIsOpenChoreo/>
        <FeatureCards/>
        <GetStarted/>
        <TechStack/>
        <Community/>
        <FinalCTA/>
      </div>
    </Layout>
  );
}
