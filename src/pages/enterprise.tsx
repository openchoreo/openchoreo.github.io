import type {ReactNode} from 'react';
import React from 'react';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';
import SectionHeader from '@site/src/components/common/SectionHeader';
import styles from './enterprise.module.css';

const features = [
  {
    label: '24/7 incident support.',
    detail: 'Global, round-the-clock support with aggressive SLAs for production-stopping issues.',
  },
  {
    label: 'Proactive security monitoring.',
    detail: '',
  },
  {
    label: 'Dedicated onboarding support',
    detail: 'to help you move from legacy CI/CD to a modern IDP.',
  },
  {
    label: "Direct access to OpenChoreo's core engineers and WSO2's customer success team",
    detail: 'for architectural advice, tuning, and best practices.',
  },
];

export default function Enterprise(): ReactNode {
  return (
    <Layout
      title="Enterprise"
      description="Enterprise support options for OpenChoreo, originally created by WSO2 and a CNCF Sandbox Project."
    >
      <div className={styles.root}>
        <main className="container margin-vert--xl">

          {/* HERO */}
          <section className="margin-bottom--lg">
            <SectionHeader title="Enterprise OpenChoreo Offerings">
              <p>
                OpenChoreo was originally created by WSO2 and is a CNCF Sandbox Project.<br />
                You can find enterprise support options for the project below.
              </p>
            </SectionHeader>
          </section>

          {/* OFFERING CARD */}
          <section>
            <div className={styles.offeringCard}>
              <div className={styles.offeringHeader}>
                <img
                  src={useBaseUrl('/img/logos/tech-logo-wso2.webp')}
                  alt="WSO2"
                  className={styles.providerLogo}
                />
<span className={styles.offeringHeaderText}>Developer Platform for OpenChoreo</span>
              </div>
              <p className={styles.offeringTagline}>
                Get open source flexibility with enterprise platform reliability. Direct access to
                architects and developers from the creators of OpenChoreo.
              </p>

              <ul className={styles.featureList}>
                {features.map((f, i) => (
                  <li key={i} className={styles.featureItem}>
                    <span className={styles.featureIcon}>✓</span>
                    <span>
                      <span className={styles.featureLabel}>{f.label}</span>
                      {f.detail && ` ${f.detail}`}
                    </span>
                  </li>
                ))}
              </ul>

              <div className={styles.buttonGroup}>
                <a
                  href="https://wso2.com/engineering-platform/openchoreo/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.cButton}
                >
                  Learn More
                </a>
              </div>
            </div>
          </section>

        </main>
      </div>
    </Layout>
  );
}
