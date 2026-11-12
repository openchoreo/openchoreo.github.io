import type {ReactNode} from 'react';
import React from 'react';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';
import SectionHeader from '@site/src/components/common/SectionHeader';
import styles from './enterprise.module.css';
import useBrokenLinks from '@docusaurus/useBrokenLinks';

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
    label:
      "Direct access to OpenChoreo's core engineers and WSO2's customer success team",
    detail: 'for architectural advice, tuning, and best practices.',
  },
];

const courses = [
  {
    label: 'OC-201: Cloud Native PE: The OpenChoreo Throughline',
    detail:
      '(intermediate to advanced). Install OpenChoreo, set up identity and governance, define platform APIs with ComponentTypes and Traits, and build golden paths developers can deploy through.',
  },
  {
    label: 'OC-210: Developer Portals & Self-Service Onboarding on OpenChoreo',
    detail:
      '(intermediate). Onboard a new team through the Backstage-based portal, the Developer API, and the occ CLI.',
  },
  {
    label: 'Two-day live online workshops,',
    detail:
      'each ending with a capstone that applies what you learned end to end.',
  },
  {
    label: 'Taught by platform engineering practitioners,',
    detail: 'in collaboration with the team behind OpenChoreo.',
  },
];
/**
 * Enterprise page (/enterprise)
 *
 * Lists enterprise support offerings for OpenChoreo.
 * Currently features the WSO2 Developer Platform for OpenChoreo offering,
 * including a feature list and a CTA linking to the WSO2 product page.
 */
export default function Enterprise(): ReactNode {
  useBrokenLinks().collectAnchor('training');
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
                You can find enterprise support and training options for the project below.
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

          {/* TRAINING */}
          <section id='training' className={styles.trainingSection}>
            <div className={styles.offeringCard}>
              <div className={styles.offeringHeader}>
                <div className={styles.logoRow}>
                  <img
                    src={useBaseUrl('/img/logos/tech-logo-wso2.webp')}
                    alt='WSO2'
                    className={styles.providerLogo}
                  />
                  <span className={styles.logoSeparator} aria-hidden='true'>
                    ×
                  </span>
                  <img
                    src={useBaseUrl('/img/logos/platformetrics-logo.png')}
                    alt='Platformetrics'
                    className={styles.providerLogo}
                  />
                </div>
                <span className={styles.offeringHeaderText}>
                  Hands-on OpenChoreo courses
                </span>
              </div>
              <p className={styles.offeringTagline}>
                Live, hands-on workshops for platform teams, from WSO2 in
                collaboration with Platformetrics. Every lab runs on a live
                OpenChoreo environment, and you leave with working
                configurations you can take back to your team.
              </p>

              <ul className={styles.featureList}>
                {courses.map((c, i) => (
                  <li key={i} className={styles.featureItem}>
                    <span className={styles.featureIcon}>✓</span>
                    <span>
                      <span className={styles.featureLabel}>{c.label}</span>
                      {c.detail && ` ${c.detail}`}
                    </span>
                  </li>
                ))}
              </ul>

              <div className={styles.buttonGroup}>
                <a
                  href='https://platformetrics.com/openchoreo'
                  target='_blank'
                  rel='noopener noreferrer'
                  className={styles.cButton}
                >
                  View courses and register
                </a>
              </div>
            </div>
          </section>

          {/* PARTNER CONTACT */}
          <section className={styles.listingSection}>
            <h2 className={styles.listingTitle}>Partner with OpenChoreo</h2>
            <p className={styles.listingText}>
              If your organization would like to partner on OpenChoreo, whether
              through integrations, enterprise support, training, consulting, or
              co-marketing, email the OpenChoreo maintainers at{' '}
              <a href='mailto:cncf-openchoreo-contact@lists.cncf.io'>
                cncf-openchoreo-contact@lists.cncf.io
              </a>
              .
            </p>
          </section>
          
        </main>
      </div>
    </Layout>
  );
}
