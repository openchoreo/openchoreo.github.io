import type {ReactNode} from 'react';
import React, { useState } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import SectionHeader from '@site/src/components/common/SectionHeader';
import styles from './styles.module.css';

/**
 * TypeScript Interface for Technology
 * Each tech has a name, description, logo, and link
 */
interface Technology {
  name: string;
  description: string;
  logo: string;
  link: string;
}

/**
 * Array of technologies used in OpenChoreo
 * Order matches the original Jekyll site
 */
const technologies: Technology[] = [
  {
    name: 'Kubernetes',
    description: 'Orchestrates all components across environments. OpenChoreo workloads run natively as Kubernetes resources.',
    logo: '/img/logos/tech-logo-kubernetes.webp',
    link: 'https://kubernetes.io/'
  },
  {
    name: 'Helm',
    description: 'Manages the OpenChoreo installation.',
    logo: '/img/logos/tech-logo-helm.webp',
    link: 'https://helm.sh/'
  },
  {
    name: 'Argo Workflows',
    description: 'Powers OpenChoreo\'s built-in CI/CD. Automates build, test, and deploy pipelines across environments and tracks.',
    logo: '/img/logos/tech-logo-argo.webp',
    link: 'https://argoproj.github.io/workflows/'
  },
  {
    name: 'BuildPacks.io',
    description: 'Enables zero-config builds in OpenChoreo\'s built-in CI',
    logo: '/img/logos/tech-logo-buildpacks.webp',
    link: 'https://buildpacks.io/'
  },
  {
    name: 'eBPF',
    description: 'Enables low-level observability and security. OpenChoreo uses eBPF (via Cilium and Hubble) to monitor and trace network behavior.',
    logo: '/img/logos/tech-logo-ebpf.webp',
    link: 'https://ebpf.io/'
  },
  {
    name: 'Cilium',
    description: 'Provides zero-trust network policies and service connectivity between components.',
    logo: '/img/logos/tech-logo-cilium.webp',
    link: 'https://cilium.io/'
  },
  {
    name: 'OpenSearch',
    description: 'Stores structured logs and supports querying and alerting for all platform events.',
    logo: '/img/logos/tech-logo-opensearch.webp',
    link: 'https://opensearch.org/'
  },
  {
    name: 'FluentBit',
    description: 'Collects and ships logs from workloads to OpenSearch with low resource overhead.',
    logo: '/img/logos/tech-logo-fluentbit.webp',
    link: 'https://fluentbit.io/'
  },
  {
    name: 'Prometheus',
    description: 'Scrapes metrics from workloads and platform components for monitoring and autoscaling.',
    logo: '/img/logos/tech-logo-prometheus.webp',
    link: 'https://prometheus.io/'
  },
  {
    name: 'Thanos',
    description: 'Adds long-term storage and federation to Prometheus, enabling historical observability across clusters.',
    logo: '/img/logos/tech-logo-thanos.webp',
    link: 'https://thanos.io/'
  },
  {
    name: 'Hubble',
    description: 'Visualizes runtime network flows and helps debug service-to-service communication.',
    logo: '/img/logos/tech-logo-hubble.webp',
    link: 'https://github.com/cilium/hubble'
  },
  {
    name: 'Envoy Gateway',
    description: 'Exposes APIs and components securely. Forms the backbone of OpenChoreo ingress and egress.',
    logo: '/img/logos/tech-logo-envoy.webp',
    link: 'https://gateway.envoyproxy.io/'
  },
  {
    name: 'WSO2',
    description: 'Inspired the architecture and best practices behind OpenChoreo. Many concepts are battle-tested in WSO2 Choreo (IDP as a Service).',
    logo: '/img/logos/tech-logo-wso2.webp',
    link: 'https://wso2.com/choreo/'
  },
  {
    name: 'Backstage',
    description: 'OpenChoreo provides a Backstage plugin that integrates with its core APIs.',
    logo: '/img/logos/tech-logo-backstage.webp',
    link: 'https://backstage.io/'
  }
];

/**
 * Individual Tech Logo Component with Tooltip
 */
function TechLogo({ tech }: { tech: Technology }) {
  // State to track if this logo is being hovered
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={styles.logoContainer}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <a 
        href={tech.link} 
        target="_blank" 
        rel="noopener noreferrer"
        className={styles.logoLink}
      >
        <img 
          src={useBaseUrl(tech.logo)} 
          alt={`${tech.name} logo`}
          className={styles.logo}
        />
      </a>
      
      {/* Tooltip - only visible when hovered */}
      {isHovered && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipContent}>
            <h3 className={styles.tooltipTitle}>{tech.name}</h3>
            <p className={styles.tooltipDescription}>{tech.description}</p>
          </div>
          <div className={styles.tooltipArrow}></div>
        </div>
      )}
    </div>
  );
}

/**
 * Main TechStack Component
 * Displays all technology logos with interactive tooltips
 */
export default function TechStack(): ReactNode {
  return (
    <section className={styles.section}>
      <div className="container">
        <SectionHeader title="Built on the Cloud Native Stack">
          <p>
            OpenChoreo orchestrates CNCF and open-source tools like Kubernetes, Argo CD, 
            Cilium, Backstage, and more to provide a production-grade IDP.
          </p>
        </SectionHeader>
        
        {/* Logos Grid */}
        <div className={styles.logosGrid}>
          {technologies.map((tech, index) => (
            <TechLogo key={index} tech={tech} />
          ))}
        </div>
      </div>
    </section>
  );
}
