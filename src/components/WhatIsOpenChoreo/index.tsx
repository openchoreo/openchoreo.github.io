import type {ReactNode} from 'react';
import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import SectionHeader from '@site/src/components/common/SectionHeader';
import styles from './styles.module.css';

/**
 * WhatIsOpenChoreo Component
 * This section explains what OpenChoreo is and includes a high-level diagram
 */
export default function WhatIsOpenChoreo(): ReactNode {
  return (
    <section className={styles.section}>
      <div className="container">

        <SectionHeader title="What is OpenChoreo?">
          <p>
            OpenChoreo is a developer platform for Kubernetes offering development and architecture abstractions,
            a Backstage-powered developer portal, application CI/CD, GitOps, and observability.
          </p>
        </SectionHeader>

        <div className={styles.imageContainer}>
          <img
            src={useBaseUrl('/img/homepage/openchoreo-high-level-diagram.webp')}
            alt="OpenChoreo high-level architecture diagram"
            className={styles.diagram}
          />
        </div>
      </div>
    </section>
  );
}
