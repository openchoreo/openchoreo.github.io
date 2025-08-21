import type {ReactNode} from 'react';
import React from 'react';
import Button from '@site/src/components/common/Button';
import styles from './styles.module.css';

/**
 * FinalCTA Component
 * The final call-to-action section at the bottom of the homepage
 */
export default function FinalCTA(): ReactNode {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.content}>
          {/* Main heading */}
          <h2 className={styles.title}>
            Ready to build the platform you always wanted?
          </h2>

          {/* CTA Button */}
          <Button
            to="https://github.com/openchoreo/openchoreo"
            size="large"
            className={styles.ctaButton}
          >
            Explore OpenChoreo
          </Button>
        </div>
      </div>
    </section>
  );
}
