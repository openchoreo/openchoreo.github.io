import type {ReactNode} from 'react';
import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

/**
 * CNCF Component
 * Displays OpenChoreo's CNCF incubation project status
 */
export default function CNCF(): ReactNode {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.content}>
          <p className={styles.text}>
            OpenChoreo is a{' '}
            <a href="https://www.cncf.io/" target="_blank" rel="noopener noreferrer">
              CNCF (Cloud Native Computing Foundation)
            </a>{' '} sandbox project.
          </p>
          <img
            src={useBaseUrl('/img/logos/cncf-color.svg')}
            alt="CNCF Logo"
            className={styles.logo}
          />
          <p className={styles.madeWith}>Made with ❤️ at <a href="https://wso2.com/open-source/" target="_blank" rel="noopener noreferrer">WSO2</a></p>
        </div>
      </div>
    </section>
  );
}
