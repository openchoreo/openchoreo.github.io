import type {ReactNode} from 'react';
import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import SectionHeader from '@site/src/components/common/SectionHeader';
import Button from '@site/src/components/common/Button';
import styles from './styles.module.css';

/**
 * TypeScript Interface for Installation Option
 * Each option has a title, description, list of features, and link
 */
interface InstallOption {
  title: string;
  subtitle: string;
  features: string[];
  buttonText: string;
  buttonLink: string;
  className: string;
}

/**
 * Installation options data
 * We define two ways to get started with OpenChoreo
 */
const installOptions: InstallOption[] = [
  {
    title: 'Quick Start',
    subtitle: 'Run OpenChoreo locally with a single command.',
    features: [
      'No config, no toolchain juggling.',
      'Comes with everything preinstalled.',
      'Safe to explore and easy to clean up when you\'re done.'
    ],
    buttonText: 'Quick Start Guide',
    buttonLink: '/docs/getting-started/quick-start-guide/',
    className: 'quickStart'
  },
  {
    title: 'Install on Your Cluster',
    subtitle: 'Set up OpenChoreo on your own Kubernetes cluster.',
    features: [
      'Use Helm to install the Control Plane and Data Plane.',
      'Works with k3d locally, or any Kubernetes cluster in the cloud.',
      'A good option if you want to understand how things are wired under the hood.'
    ],
    buttonText: 'Full Install Guide',
    buttonLink: '/docs/next/getting-started/try-it-out/locally/',
    className: 'fullInstall'
  }
];

/**
 * Individual Install Card Component
 * Renders a card with installation option details
 */
function InstallCard({option}: { option: InstallOption }) {
  return (
    <div className={`${styles.card} ${styles[option.className]}`}>
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{option.title}</h3>
        <p className={styles.cardSubtitle}>{option.subtitle}</p>

        {/* Features list */}
        <ul className={styles.featuresList}>
          {option.features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>

      {/* CTA Button - positioned at bottom */}
      <Button
        to={useBaseUrl(option.buttonLink)}>
        {option.buttonText}
      </Button>
    </div>
  );
}

/**
 * Main GetStarted Component
 * Renders the "Get Started with OpenChoreo" section
 */
export default function GetStarted(): ReactNode {
  return (
    <section className={styles.section}>
      <div className="container">
        <SectionHeader title="Get Started with OpenChoreo">
          <p>
            Skip the setup headaches. Pick what works for you and get hands-on.
          </p>
        </SectionHeader>

        {/* Installation Cards Grid */}
        <div className={styles.grid}>
          {installOptions.map((option, index) => (
            <InstallCard key={index} option={option}/>
          ))}
        </div>
      </div>
    </section>
  );
}
