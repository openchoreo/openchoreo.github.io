import type { ReactNode } from "react";
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { useBaseUrlUtils } from "@docusaurus/useBaseUrl";
import SectionHeader from "@site/src/components/common/SectionHeader";
import styles from "./styles.module.css";
import BrowserShell from "../common/BrowserShell";
import TerminalShell from "../common/TerminalShell";
import ExpandableImage from "../common/ExpandableImage";

type FeatureTone = "ocean" | "teal" | "amber" | "coral" | "violet" | "slate";
type FeatureLayout = "feature" | "compact" | "standard" | "wide" | "half";

type FeatureMediaVariant = {
  label: string;
  image?: string;
  imageAlt?: string;
  aspectRatio?: string;
  expandableImage?: boolean;
  fullBleedMedia?: boolean;
  plainMedia?: boolean;
  terminal?: boolean;
};

type Feature = {
  title: string;
  description: string;
  eyebrow: string;
  highlights: string[];
  tone: FeatureTone;
  layout: FeatureLayout;
  image?: string;
  imageAlt?: string;
  aspectRatio?: string;
  expandableImage?: boolean;
  fullBleedMedia?: boolean;
  plainMedia?: boolean;
  mediaVariants?: FeatureMediaVariant[];
  hideHighlights?: boolean;
  docLink?: string;
  docLabel?: string;
  compactHighlightGrid?: boolean;
};

const features: Feature[] = [
  {
    title: "Modular multi-plane architecture",
    description:
      "Independent control, data, build, and observability planes with flexible deployment across single or multi-cluster environments.",
    eyebrow: "Scalable architecture",
    highlights: [],
    tone: "ocean",
    layout: "wide",
    image: "/img/homepage/openchoreo-architecture-diagram.svg",
    imageAlt: "OpenChoreo high-level architecture diagram",
    aspectRatio: "1999 / 1206",
    expandableImage: true,
    plainMedia: true,
    docLink: "/docs/overview/architecture",
    docLabel: "View Architecture Docs",
  },
  {
    title: "Built-in AI agents",
    description:
      "Built-in SRE and FinOps agents provide automated root cause analysis, remediation, and cost optimization.",
    eyebrow: "Embedded automation",
    highlights: [
      "Root cause analysis with the SRE agent",
      "Cost optimization based on budget alerts with the FinOps Agent",
    ],
    tone: "violet",
    layout: "half",
    aspectRatio: "1999 / 1206",
    expandableImage: true,
    fullBleedMedia: true,
    mediaVariants: [
      {
        label: "Root cause analysis with the SRE agent",
        image: "/img/homepage/rca-agent.png",
        imageAlt:
          "AI root cause analysis view showing built-in agent assistance for incident investigation",
        aspectRatio: "1999 / 1206",
        expandableImage: true,
        fullBleedMedia: true,
      },
      {
        label: "Cost optimization based on budget alerts with the FinOps Agent",
        image: "/img/homepage/finops-agent.png",
        imageAlt:
          "FinOps Agent view showing cost optimization based on budget alerts",
        aspectRatio: "3368 / 1988",
        expandableImage: true,
        fullBleedMedia: true,
      },
    ],
  },
  {
    title: "AI-assisted engineering",
    description:
      "Secure MCP servers and skills allow AI to assist in delivery and operations without bypassing platform guardrails.",
    eyebrow: "Agent interfaces",
    highlights: ["AI for Platform Engineers", "AI for Developers"],
    tone: "slate",
    layout: "half",
    imageAlt:
      "AI-assisted engineering and operations view showing the OpenChoreo agent interface",
    aspectRatio: "1999 / 1206",
    expandableImage: true,
    fullBleedMedia: true,
    mediaVariants: [
      {
        label: "AI for Platform Engineers",
        image: "/img/homepage/ai-for-platform-engineers.jpg",
        imageAlt:
          "Platform view exposing deeper operational capabilities and interfaces used by MCP and skills",
        aspectRatio: "1999 / 1206",
        expandableImage: true,
        fullBleedMedia: true,
      },
      {
        label: "AI for Developers",
        image: "/img/homepage/ai-for-developers.jpg",
        imageAlt:
          "Self-service actions view showing guardrailed AI-assisted platform operations",
        aspectRatio: "1999 / 1206",
        expandableImage: true,
        fullBleedMedia: true,
      },
    ],
  },
  {
    title: "Platform building blocks",
    description:
      "Declarative APIs standardize environments, component types, gateways, pipelines, and workflows across teams.",
    eyebrow: "Platform Topology",
    highlights: [
      "Visualize platform architecture",
      "Define your platform topology",
      "Build abstractions for developer self-service",
      "Utilize declarative APIs",
    ],
    tone: "amber",
    layout: "half",
    image: "/img/homepage/platform-graph.png",
    imageAlt:
      "Platform overview graph showing OpenChoreo platform abstractions",
    aspectRatio: "1999 / 1206",
    expandableImage: true,
    fullBleedMedia: true,
    mediaVariants: [
      {
        label: "Visualize platform architecture",
        image: "/img/homepage/visualize-platform.png",
        imageAlt:
          "Platform architecture graph showing service relationships and architecture visualization",
        aspectRatio: "1999 / 1206",
        expandableImage: true,
        fullBleedMedia: true,
      },
      {
        label: "Define your platform topology",
        image: "/img/homepage/platform-topology-overview.svg",
        imageAlt:
          "Platform topology overview diagram showing OpenChoreo planes and relationships",
        aspectRatio: "1999 / 1206",
        expandableImage: true,
        plainMedia: true,
      },
      {
        label: "Build abstractions for developer self-service",
        image: "/img/homepage/build-developer-abstractions.svg",
        imageAlt:
          "Diagram showing developer self-service abstractions and the APIs that define them",
        aspectRatio: "1999 / 1206",
        expandableImage: true,
        plainMedia: true,
      },
      {
        label: "Utilize declarative APIs",
        image: "/img/homepage/declarative-apis.png",
        imageAlt: "Design developer self-service with declarative APIs",
        aspectRatio: "1999 / 1206",
        expandableImage: true,
        fullBleedMedia: true,
      },
    ],
  },
  {
    title: "Developer self-service",
    description:
      "Higher-level Kubernetes-native abstractions and golden paths help developers ship faster without managing Kubernetes complexity.",
    eyebrow: "Developer experience",
    highlights: [
      "Visualize app architecture",
      "Create apps with golden paths",
      "Build from Git",
      "Configure and deploy",
      "Promote across environments",
      "Inspect Kubernetes resources",
    ],
    tone: "teal",
    layout: "half",
    compactHighlightGrid: true,
    aspectRatio: "3002 / 1608",
    expandableImage: true,
    fullBleedMedia: true,
    docLink: "/explore/backstage-powered-developer-portal/",
    docLabel: "Explore the Developer Portal",
    mediaVariants: [
      {
        label: "Visualize app architecture",
        image: "/img/homepage/visualize-application-architecture.png",
        imageAlt: "Cell diagram of a project",
        aspectRatio: "3002 / 1608",
        expandableImage: true,
        fullBleedMedia: true,
      },
      {
        label: "Create apps with golden paths",
        image: "/img/homepage/create-component.png",
        imageAlt:
          "Create resource view showing golden path templates for developers",
        aspectRatio: "3002 / 1608",
        expandableImage: true,
        fullBleedMedia: true,
      },
      {
        label: "Build from Git",
        image: "/img/homepage/build.png",
        imageAlt:
          "Build view showing CI pipeline status and build details for a component",
        aspectRatio: "3002 / 1608",
        expandableImage: true,
        fullBleedMedia: true,
      },
      {
        label: "Configure and deploy",
        image: "/img/homepage/deploy.png",
        imageAlt:
          "Deploy view showing environment configuration and deployment settings",
        aspectRatio: "3002 / 1608",
        expandableImage: true,
        fullBleedMedia: true,
      },
      {
        label: "Promote across environments",
        image: "/img/homepage/promote.png",
        imageAlt:
          "Promotion view showing deployment progression across environments",
        aspectRatio: "3002 / 1608",
        expandableImage: true,
        fullBleedMedia: true,
      },
      {
        label: "Inspect Kubernetes resources",
        image: "/img/homepage/inspect.png",
        imageAlt:
          "Inspect Kubernetes resources created by developer abstractions",
        aspectRatio: "1999 / 1224",
        expandableImage: true,
        fullBleedMedia: true,
      },
    ],
  },
  {
    title: "Integrated observability",
    description:
      "Unified telemetry that maps to the application model for faster debugging and operations.",
    eyebrow: "Observability",
    highlights: [
      "Self-service logs",
      "Metrics",
      "Traces",
      "Alerts",
      "Natural language queries with AI",
    ],
    tone: "coral",
    layout: "wide",
    docLink: "/explore/observability",
    docLabel: "Explore Observability",
    image:
      "/img/explore/backstage-powered-developer-portal/built-in-observability.png",
    imageAlt:
      "Observability view showing logs, metrics, traces, and alerts in the OpenChoreo portal",
    aspectRatio: "1999 / 1206",
    expandableImage: true,
    fullBleedMedia: true,
    mediaVariants: [
      {
        label: "Self-service logs",
        image: "/img/homepage/logs.png",
        imageAlt:
          "Observability view showing self-service logs in the OpenChoreo portal",
        aspectRatio: "1999 / 1206",
        expandableImage: true,
        fullBleedMedia: true,
      },
      {
        label: "Metrics",
        image: "/img/homepage/metrics.png",
        imageAlt:
          "Metrics view showing CPU, memory, and network telemetry for an OpenChoreo component",
        aspectRatio: "2000 / 1254",
        expandableImage: true,
        fullBleedMedia: true,
      },
      {
        label: "Traces",
        image: "/img/homepage/tracing.png",
        imageAlt:
          "OpenTelemetry traces view showing distributed tracing information",
        aspectRatio: "1999 / 1206",
        expandableImage: true,
        fullBleedMedia: true,
      },
      {
        label: "Alerts",
        image: "/img/homepage/alerts.png",
        imageAlt: "Developer self-service for application alerts",
        aspectRatio: "1999 / 1206",
        expandableImage: true,
        fullBleedMedia: true,
      },
      {
        label: "Natural language queries with AI",
        terminal: true,
      },
    ],
  },
  {
    title: "GitOps and declarative state",
    description:
      "Platform and application state can be managed entirely through Git for versioning and auditability with CLI and UI support.",
    eyebrow: "Git-backed operations",
    highlights: [],
    tone: "ocean",
    layout: "standard",
    hideHighlights: true,
    docLink: "/docs/platform-engineer-guide/gitops/overview",
    docLabel: "View GitOps Docs",
  },
  {
    title: "Multi-tenancy and access control",
    description:
      "RBAC and tenancy boundaries ensure safe, least-privilege self-service across teams and projects.",
    eyebrow: "Access model",
    highlights: [],
    tone: "teal",
    layout: "standard",
    hideHighlights: true,
    docLink: "/docs/platform-engineer-guide/authorization/overview",
    docLabel: "View Access Control Docs",
  },
];

function FeatureVisual({
  feature,
  media,
}: {
  feature: Feature;
  media?: FeatureMediaVariant;
}) {
  const { withBaseUrl } = useBaseUrlUtils();
  const imageSrc = media?.image
    ? withBaseUrl(media.image)
    : feature.image
      ? withBaseUrl(feature.image)
      : undefined;
  const imageAlt = media?.imageAlt || feature.imageAlt || feature.title;
  const aspectRatio = media?.aspectRatio ?? feature.aspectRatio;
  const expandableImage = media?.expandableImage ?? feature.expandableImage;
  const fullBleedMedia = media?.fullBleedMedia ?? feature.fullBleedMedia;
  const plainMedia = media?.plainMedia ?? feature.plainMedia;

  if (media?.terminal) {
    return (
      <div className={styles.terminalMedia}>
        <TerminalShell bodyClassName={styles.terminalLargeText}>
          <div className={styles.terminalContent}>
            <div className={styles.terminalPrompt}>
              <span className={styles.terminalPromptSymbol}>$</span>
              <span>
                We have user reported failures in the ads-frontend component,
                find out what went wrong
              </span>
            </div>
            <div className={styles.terminalPrompt}>
              <span className={styles.terminalPromptSymbol}>$</span>
              <span>
                How many 500 error codes has the core-api service returned in
                the last 6 hours? Investigate the reason for each failure as
                well
              </span>
            </div>
            <div className={styles.terminalPrompt}>
              <span className={styles.terminalPromptSymbol}>$</span>
              <span>
                What caused the request with {"{uuid}"} to fail last Thursday at
                3.00pm in the analytics project?
              </span>
            </div>
            <div className={styles.terminalPrompt}>
              <span className={styles.terminalPromptSymbol}>$</span>
              <span>
                What caused the memory spike and resulting OOM kill for the
                streaming service today?
              </span>
            </div>
            <div className={styles.terminalPrompt}>
              <span className={styles.terminalPromptSymbol}>$</span>
              <span>
                Add a log-based alert trait to the &apos;pdf-processor&apos;
                component for any logs that match the string &apos;* failed to
                render *&apos;
              </span>
            </div>
          </div>
        </TerminalShell>
      </div>
    );
  }

  if (imageSrc) {
    if (plainMedia) {
      return (
        <div className={styles.plainMediaSurface}>
          {expandableImage ? (
            <ExpandableImage
              src={imageSrc}
              alt={imageAlt}
              className={clsx(styles.expandableMedia, styles.plainMedia)}
              fillContainer
              gutterBottom={false}
            />
          ) : (
            <img
              src={imageSrc}
              alt={imageAlt}
              className={clsx(styles.mediaImage, styles.plainMedia)}
              loading="lazy"
              decoding="async"
            />
          )}
        </div>
      );
    }

    return (
      <div className={styles.mediaImageContainer}>
        <BrowserShell
          className={clsx(
            styles.previewBrowserShell,
            styles.previewWindowMedia,
          )}
          style={
            aspectRatio
              ? ({
                  "--feature-media-aspect-ratio": aspectRatio,
                } as React.CSSProperties)
              : undefined
          }
          bodyClassName={clsx(fullBleedMedia && styles.previewMediaFrameBleed)}
        >
          {expandableImage ? (
            <ExpandableImage
              src={imageSrc}
              alt={imageAlt}
              className={styles.expandableMedia}
              fillContainer
              fullBleed={fullBleedMedia}
              wrapToImage={fullBleedMedia}
              gutterBottom={false}
            />
          ) : (
            <img
              src={imageSrc}
              alt={imageAlt}
              className={clsx(
                styles.mediaImage,
                fullBleedMedia && styles.mediaImageBleed,
              )}
              loading="lazy"
              decoding="async"
            />
          )}
        </BrowserShell>
      </div>
    );
  }

  return (
    <div className={styles.previewPlaceholder} aria-hidden="true">
      <div className={styles.previewGrid} />
      <div className={styles.previewGlow} />
      <BrowserShell
        className={styles.previewBrowserShell}
        bodyClassName={styles.previewBrowserBody}
      >
        <span className={styles.previewEyebrow}>{feature.eyebrow}</span>
        <strong className={styles.previewTitle}>{feature.title}</strong>
        <div className={styles.previewMetricRow}>
          {feature.highlights.map((highlight) => (
            <span key={highlight} className={styles.previewMetric}>
              {highlight}
            </span>
          ))}
        </div>
        <div className={styles.previewBars}>
          <span className={styles.previewBarLong} />
          <span className={styles.previewBarMedium} />
          <span className={styles.previewBarShort} />
        </div>
      </BrowserShell>
    </div>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const { withBaseUrl } = useBaseUrlUtils();
  const mediaVariants = feature.mediaVariants;
  const [activeVariantLabel, setActiveVariantLabel] = useState(
    mediaVariants?.[0]?.label,
  );
  const activeVariant =
    mediaVariants?.find((variant) => variant.label === activeVariantLabel) ??
    mediaVariants?.[0];
  const hasMedia = Boolean(feature.image || activeVariant?.image);
  const isMinimalCard = !hasMedia && feature.hideHighlights;
  const docHref = feature.docLink ? withBaseUrl(feature.docLink) : undefined;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const sources = new Set<string>();

    if (feature.image) {
      sources.add(feature.image);
    }

    mediaVariants?.forEach((variant) => {
      if (variant.image) {
        sources.add(variant.image);
      }
    });

    sources.forEach((src) => {
      const img = new window.Image();
      img.src = withBaseUrl(src);
    });
  }, [feature.image, mediaVariants, withBaseUrl]);

  return (
    <article
      className={clsx(
        styles.featureCard,
        isMinimalCard && styles.featureCardMinimal,
        hasMedia && styles.featureCardWithMedia,
        styles[`tone${feature.tone[0].toUpperCase()}${feature.tone.slice(1)}`],
        styles[
          `layout${feature.layout[0].toUpperCase()}${feature.layout.slice(1)}`
        ],
      )}
    >
      <div className={styles.featureContent}>
        <h3 className={styles.featureTitle}>{feature.title}</h3>
        <p className={styles.featureDescription}>{feature.description}</p>
        {!feature.hideHighlights && (
          <ul
            className={clsx(
              styles.highlightList,
              feature.compactHighlightGrid && styles.highlightListCompactGrid,
            )}
          >
            {feature.highlights.map((highlight) =>
              mediaVariants?.some((variant) => variant.label === highlight) ? (
                <li key={highlight} className={styles.highlightItem}>
                  <button
                    type="button"
                    className={clsx(
                      styles.highlight,
                      styles.highlightButton,
                      activeVariant?.label === highlight &&
                        styles.highlightActive,
                    )}
                    onClick={() => setActiveVariantLabel(highlight)}
                    aria-pressed={activeVariant?.label === highlight}
                  >
                    {highlight}
                  </button>
                </li>
              ) : (
                <li key={highlight} className={styles.highlightItem}>
                  <span className={styles.highlight}>{highlight}</span>
                </li>
              ),
            )}
          </ul>
        )}
        {docHref && (
          <div className={styles.linkRow}>
            <a
              href={docHref}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.learnMoreLink}
            >
              {feature.docLabel ?? "Learn more"}
            </a>
          </div>
        )}
      </div>
      {hasMedia && (
        <div className={styles.mediaShell}>
          {mediaVariants && mediaVariants.length > 0 ? (
            <div className={styles.mediaVariantStack}>
              {mediaVariants.map((variant) => (
                <div
                  key={variant.label}
                  className={clsx(
                    styles.mediaVariantLayer,
                    activeVariant?.label === variant.label &&
                      styles.mediaVariantLayerActive,
                  )}
                  aria-hidden={activeVariant?.label !== variant.label}
                >
                  <FeatureVisual feature={feature} media={variant} />
                </div>
              ))}
            </div>
          ) : (
            <FeatureVisual feature={feature} media={activeVariant} />
          )}
        </div>
      )}
    </article>
  );
}

/**
 * WhatIsOpenChoreo Component
 * This section explains what OpenChoreo is and highlights the core platform capabilities
 */
export default function WhatIsOpenChoreo(): ReactNode {
  const primaryFeatures = features.filter(
    (feature) => feature.layout !== "standard",
  );
  const supportingFeatures = features.filter(
    (feature) => feature.layout === "standard",
  );

  return (
    <section className={styles.section}>
      <div className="container">
        <SectionHeader title="What is OpenChoreo?">
          <p>
            OpenChoreo is a developer platform for Kubernetes that lets
            developers and AI agents build, deploy, and operate apps, resources,
            and agentic workloads. It provides development and platform
            abstractions, a Backstage-powered developer portal, CI/CD, GitOps,
            and observability.
          </p>
        </SectionHeader>

        <div className={styles.featuresGrid}>
          {primaryFeatures.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>

        <div className={styles.supportingSection}>
          <div className={styles.supportingGrid}>
            {supportingFeatures.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
