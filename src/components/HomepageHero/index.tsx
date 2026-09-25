import type { ReactNode } from "react";
import React from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import ThemedImage from "@theme/ThemedImage";
import Button from "@site/src/components/common/Button";
import styles from "./styles.module.css";

/**
 * Homepage Hero Component
 * This is the hero section at the top of the homepage
 */
export default function HomepageHero(): ReactNode {
  return (
    <section className={styles.hero} data-section-bg="white">
      <div className={`container ${styles.heroContent}`}>
        <ThemedImage
          alt="OpenChoreo Logo"
          className={styles.heroLogo}
          sources={{
            light: useBaseUrl("/img/openchoreo-logo.svg"),
            dark: useBaseUrl("/img/openchoreo-logo-dark.svg"),
          }}
        />

        <h1 className={styles.heroTagline}>
          Build Your Internal Developer Platform with OpenChoreo
        </h1>
        <h2 className={styles.heroSubtitle}>
          Go from zero to platform, or take what you have further.
          <br />
          One IDP for humans and agents.
        </h2>

        <a
          className={styles.heroCncf}
          href="https://www.cncf.io/projects/openchoreo/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>OpenChoreo is a</span>
          <ThemedImage
            alt="CNCF"
            className={styles.heroCncfLogo}
            sources={{
              light: useBaseUrl("/img/logos/cncf-color.svg"),
              dark: useBaseUrl("/img/logos/cncf-white.svg"),
            }}
          />
          <span>project</span>
        </a>

        {/* Call-to-action buttons */}
        <div className={styles.heroButtons}>
          <Button
            className={styles.heroButton}
            to="https://demo.openchoreo.wso2.com/"
          >
            Explore Playground
          </Button>
          <Button
            className={styles.heroButton}
            to="https://openchoreo.dev/docs/"
          >
            Documentation
          </Button>
        </div>
      </div>
    </section>
  );
}
