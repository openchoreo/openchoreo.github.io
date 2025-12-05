import type {ReactNode} from 'react';
import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import ThemedImage from '@theme/ThemedImage';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Button from '@site/src/components/common/Button';
import styles from './styles.module.css';
import GitHubStarButton from '@site/src/components/common/GitHubStarButton'; 

/**
 * Homepage Hero Component
 * This is the hero section at the top of the homepage
 */
export default function HomepageHero(): ReactNode {
  const {siteConfig} = useDocusaurusContext();

  return (
    <section className={styles.hero}>
      <div className="container">
        {/* Logo that changes with theme */}
        <ThemedImage
          alt="OpenChoreo Logo"
          className={styles.heroLogo}
          sources={{
            light: useBaseUrl('/img/openchoreo-logo.svg'),
            dark: useBaseUrl('/img/openchoreo-logo-dark.svg'),
          }}
        />

        <h1 className={styles.heroTitle}>
          {siteConfig.title}
        </h1>

        <p className={styles.heroTagline}>
          {siteConfig.tagline}
        </p>

        <p className={styles.heroSubtitle}>
          A complete, open-source Internal Developer Platform—ready to use from day one,
          built to integrate with your stack.
        </p>

        <GitHubStarButton />

        {/* Call-to-action buttons */}
        <div className={styles.heroButtons}>
          <Button to={useBaseUrl('/docs/getting-started/quick-start-guide/')}>
            Quick Start
          </Button>
          <Button to={useBaseUrl('/docs/')}>
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
}
