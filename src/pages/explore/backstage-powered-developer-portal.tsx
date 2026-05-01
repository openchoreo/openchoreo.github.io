import type { ReactNode } from 'react';
import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import Button from '@site/src/components/common/Button';

import portalPlatformView from '@site/blog/assets/joining-cncf-blog/portal_platform_view.png';

import styles from './backstage-powered-developer-portal.module.css';

type StorySection = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  alt: string;
};

const proofPoints = [
  {
    title: 'One tab for developers',
    description:
      'Catalog, architecture, observability, deployments, and operational workflows stay in one connected interface.',
  },
  {
    title: 'One platform for engineers',
    description:
      'OpenChoreo turns golden paths, policy, orchestration, and runtime control into a coherent internal platform.',
  },
  {
    title: 'One model behind both',
    description:
      'The same abstractions drive the portal view, the control plane, and the Kubernetes resources underneath.',
  },
];

const sections: StorySection[] = [
  {
    eyebrow: 'Control Plane',
    title: 'A Platform Behind the Portal',
    description:
      "The portal isn't just displaying information; there's a platform behind it. A control plane compiles developer intent into Kubernetes resources, enforces policies during compilation, continuously reconciles drift, and aggregates runtime state back to the portal. Intent flows down, reality flows up.",
    image: portalPlatformView,
    alt: 'OpenChoreo platform overview in the Backstage portal.',
  },
  {
    eyebrow: 'Catalog',
    title: 'Projects, Components, and More in the Catalog',
    description:
      "Projects, components, endpoints, resources, and dependencies aren't just static catalog entries. They carry runtime semantics: a project becomes an isolation boundary, an endpoint gets visibility-driven network policies, and a dependency becomes enforced traffic flow. What's in the catalog is what's running in the cluster.",
    image:
      '/img/explore/backstage-powered-developer-portal/catalog-runtime-semantics.png',
    alt: 'Catalog and platform runtime entities in the OpenChoreo portal.',
  },
  {
    eyebrow: 'Architecture',
    title: 'Visualize Your Application Architecture',
    description:
      "Your components, endpoints, and dependencies are rendered as a live graph that reflects actual permitted traffic flow, not just intended relationships. Developers declare the architecture. The platform enforces it. The portal shows it.",
    image:
      '/img/explore/backstage-powered-developer-portal/application-architecture-graph.png',
    alt: 'Application architecture graph in the developer portal.',
  },
  {
    eyebrow: 'Observability',
    title: 'Built-In Observability',
    description:
      'Logs, metrics, and traces feed back through the same abstractions developers already understand. The control plane compiled those abstractions to Kubernetes, so it can map runtime data back to the right component in the right environment without another context switch.',
    image:
      '/img/explore/backstage-powered-developer-portal/built-in-observability.png',
    alt: 'Observability views for a component in the OpenChoreo portal.',
  },
  {
    eyebrow: 'Platform AI Agents',
    title: 'AI-Powered Root Cause Analysis',
    description:
      "The built-in SRE Agent analyzes logs, metrics, and traces and uses LLMs to surface likely root causes. It works because it has access to the control plane's unified view, where abstractions, runtime state, and observability data are already connected.",
    image:
      '/img/explore/backstage-powered-developer-portal/ai-root-cause-analysis.png',
    alt: 'AI-assisted root cause analysis in the developer portal.',
  },
  {
    eyebrow: 'Shift-Down Self-Service',
    title: 'Developer Self-Service Actions',
    description:
      "Scaffold new components, trigger builds, and promote across environments from the portal. Golden paths aren't just templates that run once during scaffolding; they're enforced continuously by the control plane.",
    image:
      '/img/explore/backstage-powered-developer-portal/self-service-actions.png',
    alt: 'Self-service component creation and actions in the portal.',
  },
  {
    eyebrow: 'Developer Workflows',
    title: 'Build from the Portal',
    description:
      'Trigger builds and track their progress from the same interface where you manage your components. The workflow plane handles execution with Cloud Native Buildpacks and Argo Workflows. The portal is where developers interact.',
    image:
      '/img/explore/backstage-powered-developer-portal/build-from-the-portal.png',
    alt: 'Build workflow status displayed in the OpenChoreo portal.',
  },
  {
    eyebrow: 'Environments and Promotion',
    title: 'Build, Deploy, and Promote',
    description:
      "Deploy to any environment and promote across stages such as development, staging, and production from the portal. The control plane compiles your abstractions for each environment and reconciles the target state. Developers see what's deployed where without touching kubectl.",
    image:
      '/img/explore/backstage-powered-developer-portal/deploy-and-promote.png',
    alt: 'Deployment and promotion view across environments in the portal.',
  },
  {
    eyebrow: 'Authorization',
    title: 'Role-Based Access Control',
    description:
      'Define who can see, deploy, and manage what with scoped RBAC that works across the portal, the control plane, and your workload clusters. Permissions follow your namespace structure.',
    image:
      '/img/explore/backstage-powered-developer-portal/role-based-access-control.png',
    alt: 'Access control management in the OpenChoreo portal.',
  },
  {
    eyebrow: 'Ownership and Multi-Tenancy',
    title: 'Namespaces for Ownership and Isolation',
    description:
      'Namespaces provide a logical grouping of users and resources aligned to your organizational structure. They define ownership and access boundaries without exposing the underlying cluster topology.',
    image:
      '/img/explore/backstage-powered-developer-portal/namespaces-ownership-isolation.png',
    alt: 'Namespace view showing ownership and isolation in the portal.',
  },
  {
    eyebrow: 'Platform View',
    title: 'Platform at a Glance',
    description:
      'Namespaces, data planes, environments, component types, and traits are laid out in one view. This is the vocabulary you define as a platform engineer, and the portal makes it visible to everyone.',
    image:
      '/img/explore/backstage-powered-developer-portal/platform-at-a-glance.png',
    alt: 'Platform graph view in the OpenChoreo portal.',
  },
  {
    eyebrow: 'GitOps',
    title: 'YAML When You Want It',
    description:
      "Every portal action has a declarative equivalent. The portal and YAML aren't competing interfaces; they're two views of the same abstractions, which keeps the experience GitOps-friendly by design.",
    image:
      '/img/explore/backstage-powered-developer-portal/yaml-when-you-want-it.png',
    alt: 'Declarative YAML view alongside portal workflows in OpenChoreo.',
  },
  {
    eyebrow: 'Kubernetes Abstractions',
    title: 'Peek Under the Hood',
    description:
      "Kubernetes isn't hidden. Inspect pods, events, and resource states directly from the portal. The control plane compiles your abstractions into Kubernetes primitives and lets you see exactly what it produced. The abstraction helps, but never hides.",
    image:
      '/img/explore/backstage-powered-developer-portal/peek-under-the-hood.png',
    alt: 'Portal view exposing underlying Kubernetes resources and status.',
  },
];

export default function BackstagePoweredDeveloperPortal(): ReactNode {
  return (
    <Layout
      title="Backstage-Powered Developer Portal"
      description="Explore how OpenChoreo combines a Backstage-powered portal with a real platform behind it."
    >
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroInner}>
              <div className={styles.heroCopy}>
                <div className={styles.eyebrow}>Explore</div>
                <h1 className={styles.heroTitle}>
                  Backstage-Powered Developer Portal
                </h1>
                <p className={styles.heroLead}>
                  Backstage gives developers one tab instead of 100.
                  OpenChoreo gives platform engineers one platform instead of
                  100 tools. Together, they turn an informational portal into
                  an actionable developer platform.
                </p>
                <div className={styles.heroActions}>
                  <Button
                    to={useBaseUrl('/docs/getting-started/quick-start-guide/')}
                    className={styles.filledButton}
                  >
                    Quick Start
                  </Button>
                  <Button to={useBaseUrl('/docs/')}>
                    Learn More
                  </Button>
                </div>
              </div>

              <div className={styles.heroVisualFrame}>
                <div className={styles.browserChrome}>
                  <div className={styles.browserDots} aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <img
                  src={useBaseUrl(
                    '/img/explore/backstage-powered-developer-portal/hero-home.png',
                  )}
                  alt="OpenChoreo portal home view powered by Backstage."
                  className={styles.heroVisual}
                />
              </div>
            </div>

            <div className={styles.proofGrid}>
              {proofPoints.map((point) => (
                <article key={point.title} className={styles.proofCard}>
                  <h2>{point.title}</h2>
                  <p>{point.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.storyBlock}>
          <div className="container">
            {sections.map((section, index) => {
              const reverse = index % 2 === 1;

              return (
                <div
                  key={section.title}
                  className={`${styles.storySection} ${
                    reverse ? styles.storySectionReverse : ''
                  }`}
                >
                  <div className={styles.storyCopy}>
                    <div className={styles.sectionNumber}>
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className={styles.sectionEyebrow}>
                      {section.eyebrow}
                    </div>
                    <h2 className={styles.sectionTitle}>{section.title}</h2>
                    <p className={styles.sectionDescription}>
                      {section.description}
                    </p>
                  </div>

                  <div className={styles.storyMedia}>
                    <div className={styles.mediaFrame}>
                      <div className={styles.browserChrome}>
                        <div className={styles.browserDots} aria-hidden="true">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                      <img
                        src={
                          section.image.startsWith('/img/')
                            ? useBaseUrl(section.image)
                            : section.image
                        }
                        alt={section.alt}
                        className={styles.sectionImage}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className="container">
            <div className={styles.ctaInner}>
              <div>
                <h2 className={styles.ctaTitle}>
                  One Tab. One Platform. Everything Connected.
                </h2>
                <p className={styles.ctaText}>
                  Backstage gives developers the portal. OpenChoreo gives
                  platform engineers the platform behind it.
                </p>
              </div>

              <div className={styles.ctaActions}>
                <Button
                  to={useBaseUrl('/docs/getting-started/quick-start-guide/')}
                  className={styles.filledButton}
                >
                  Quickstart
                </Button>
                <Button to={useBaseUrl('/docs/')}>
                  Read the Docs
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
