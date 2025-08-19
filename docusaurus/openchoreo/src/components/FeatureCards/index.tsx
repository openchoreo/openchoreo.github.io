import type {ReactNode} from 'react';
import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import SectionHeader from '@site/src/components/common/SectionHeader';
import styles from './styles.module.css';

/**
 * TypeScript Interface
 * Defines the shape of a feature object
 * This ensures type safety - each feature must have these properties
 */
interface Feature {
  title: string;
  description: string;
  icon: string;
}

/**
 * Array of features data
 * In React, we often store data separately from the rendering logic
 * This makes it easy to add/remove/modify features
 */
const features: Feature[] = [
  {
    title: 'Golden Paths by Design',
    description: 'Define opinionated workflows that guide developers from idea to production—without writing pipelines from scratch.',
    icon: '/img/icons/feature-icon-golden-paths.webp'
  },
  {
    title: 'Zero Trust Security Built In',
    description: 'Every connection and endpoint is explicitly declared and enforced via mTLS and Cilium policies—no implicit access, ever.',
    icon: '/img/icons/feature-icon-zero-trust.webp'
  },
  {
    title: 'Observable by Default',
    description: 'Logs, metrics, and traces are automatically captured across gateways and services—no extra setup needed.',
    icon: '/img/icons/feature-icon-observable.webp'
  },
  {
    title: 'Composable and Extensible',
    description: 'Use just what you need. OpenChoreo integrates with your stack, supports GitOps, and adapts to your platform strategy.',
    icon: '/img/icons/feature-icon-composable.webp'
  },
  {
    title: 'Clear Separation of Concerns',
    description: 'Platform engineers define the guardrails. Developers focus on delivering value.',
    icon: '/img/icons/feature-icon-separation.webp'
  },
  {
    title: 'Service Catalog and Discoverability',
    description: 'APIs, events, and data streams are registered with metadata—making reuse and governance easy.',
    icon: '/img/icons/feature-icon-service-catalog.webp'
  },
  {
    title: 'Built-in API Management',
    description: 'Expose APIs through Envoy-based gateways with support for routing, rate limits, auth, and traffic control—no manual config needed.',
    icon: '/img/icons/feature-icon-api-management.webp'
  }
];

/**
 * Individual Feature Card Component
 * This is a smaller component used inside FeatureCards
 * Props: feature object with title, description, and icon
 */
function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div className={styles.card}>
      <img 
        src={useBaseUrl(feature.icon)} 
        alt={`${feature.title} icon`} 
        className={styles.icon} 
      />
      <h3 className={styles.cardTitle}>{feature.title}</h3>
      <p className={styles.cardDescription}>{feature.description}</p>
    </div>
  );
}

/**
 * Main FeatureCards Component
 * Renders the section with all feature cards
 */
export default function FeatureCards(): ReactNode {
  return (
    <section className={styles.section}>
      <div className="container">
        <SectionHeader title="What You Get with OpenChoreo">
          <p>
            OpenChoreo isn't just a toolkit—it's a full foundation for building your Internal Developer Platform. 
            It brings clarity, security, and self-service to every stage of your developer experience.
          </p>
        </SectionHeader>
        
        {/* Feature Cards Grid */}
        <div className={styles.grid}>
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
