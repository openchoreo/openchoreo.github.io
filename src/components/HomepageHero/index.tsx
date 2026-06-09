import type { ReactNode } from "react";
import React from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import ThemedImage from "@theme/ThemedImage";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Button from "@site/src/components/common/Button";
import styles from "./styles.module.css";

/**
 * Homepage Hero Component
 * This is the hero section at the top of the homepage
 */
export default function HomepageHero(): ReactNode {
  const { siteConfig } = useDocusaurusContext();

  return (
    <section className={styles.hero}>
      <div className="container">
        {/* Logo that changes with theme */}
        <ThemedImage
          alt="OpenChoreo Logo"
          className={styles.heroLogo}
          sources={{
            light: useBaseUrl("/img/openchoreo-logo.svg"),
            dark: useBaseUrl("/img/openchoreo-logo-dark.svg"),
          }}
        />

        <h1 className={styles.heroTitle}>{siteConfig.title}</h1>

        <h2 className={styles.heroTagline}>
          A complete, open-source developer platform for Kubernetes
        </h2>
        <h3 className={styles.heroSubtitle}>
          Ready to use from day one, for humans and agents
        </h3>

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
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
}
