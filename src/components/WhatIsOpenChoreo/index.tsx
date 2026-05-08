import type { ReactNode } from "react";
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { useBaseUrlUtils } from "@docusaurus/useBaseUrl";
import SectionHeader from "@site/src/components/common/SectionHeader";
import styles from "./styles.module.css";
import BrowserShell from "../common/BrowserShell";
import ExpandableImage from "../common/ExpandableImage";

type FeatureTone = "ocean" | "teal" | "amber" | "coral" | "violet" | "slate";
type FeatureLayout = "feature" | "compact" | "standard" | "wide" | "half";

type FeatureMediaVariant = {
  label: string;
  image: string;
  imageAlt: string;
  aspectRatio?: string;
  expandableImage?: boolean;
  fullBleedMedia?: boolean;
  plainMedia?: boolean;
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
};

const features: Feature[] = [
  {
    title: "Modular, multi-plane platform architecture",
    description:
      "Independently deployable control, data, build, and observability planes separate concerns with clear boundaries and flexible deployment topologies. Scale from a single Kubernetes cluster to massively distributed fleet without re-architecting your platform.",
    eyebrow: "Scalable architecture",
    highlights: [],
    tone: "ocean",
    layout: "wide",
    image: "/img/homepage/openchoreo-architecture-diagram.svg",
    imageAlt: "OpenChoreo high-level architecture diagram",
    aspectRatio: "1999 / 1206",
    expandableImage: true,
    plainMedia: true,
  },
  {
    title: "Platform abstractions (APIs) as building blocks",
    description:
      "Core platform concepts are exposed as declarative APIs so topology and delivery behavior can be standardized across an organization.",
    eyebrow: "Platform Topology",
    highlights: [
      "Visualize platform architecture",
      "Define your platform topology",
      "Build abstractions for developer self-service",
      "Declarative APIs",
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
        label: "Declarative APIs",
        image: "/img/homepage/declarative-apis.png",
        imageAlt: "Design developer self-service with declarative APIs",
        aspectRatio: "1999 / 1206",
        expandableImage: true,
        fullBleedMedia: true,
      },
    ],
  },
  {
    title: "Programmable developer abstractions",
    description:
      "Developers use higher-level, extensible Kubernetes-native abstractions and golden paths to ship without dealing with the full surface area of the Kubernetes API and disconnected tools.",
    eyebrow: "Developer experience",
    highlights: [
      "Visualize application architecture",
      "Create",
      "Build",
      "Configure and deploy",
      "Promote",
      "Inspect Kubernetes",
    ],
    tone: "teal",
    layout: "half",
    aspectRatio: "3002 / 1608",
    expandableImage: true,
    fullBleedMedia: true,
    docLink: "/explore/backstage-powered-developer-portal/",
    docLabel: "Explore the Backstage-powered Developer Portal",
    mediaVariants: [
      {
        label: "Visualize application architecture",
        image: "/img/homepage/visualize-application-architecture.png",
        imageAlt: "Cell diagram of a project",
        aspectRatio: "3002 / 1608",
        expandableImage: true,
        fullBleedMedia: true,
      },
      {
        label: "Create",
        image: "/img/homepage/create-component.png",
        imageAlt:
          "Create resource view showing golden path templates for developers",
        aspectRatio: "3002 / 1608",
        expandableImage: true,
        fullBleedMedia: true,
      },
      {
        label: "Build",
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
        label: "Promote",
        image: "/img/homepage/promote.png",
        imageAlt:
          "Promotion view showing deployment progression across environments",
        aspectRatio: "3002 / 1608",
        expandableImage: true,
        fullBleedMedia: true,
      },
      {
        label: "Inspect Kubernetes",
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
    title: "Intelligent, integrated observability",
    description:
      "Unified access to logs, metrics, traces, and alerts creates faster debugging and operational actions for humans and AI.",
    eyebrow: "Observability",
    highlights: [
      "Self-service logs",
      "Metrics",
      "OTEL Traces",
      "Alerts",
      "Natural language queries with AI",
    ],
    tone: "coral",
    layout: "wide",
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
        label: "OTEL Traces",
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
        image: "/img/homepage/nlp-for-telemetry.png",
        imageAlt:
          "AI-assisted observability view showing alerts and natural language investigation workflows",
        aspectRatio: "1999 / 1206",
        expandableImage: true,
        fullBleedMedia: true,
      },
    ],
  },
  {
    title: "Built-in agents",
    description:
      "Agents are first-class platform citizens, including SRE and FinOps use cases for root cause analysis, remediation, and cost optimization.",
    eyebrow: "Embedded automation",
    highlights: ["Root cause analysis with the SRE agent"],
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
    ],
  },
  {
    title: "AI-assisted/driven engineering and operations",
    description:
      "A controlled agent interface with MCP servers, skills, and the CLI lets AI assistants participate in development, delivery, and operations without bypassing guardrails.",
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
    title: "Declarative platform + app state",
    description:
      "Platform and application state are reconciled from Git for auditability and drift resistance, with GUI and CLI support when imperative actions are needed.",
    eyebrow: "Git-backed operations",
    highlights: [],
    tone: "ocean",
    layout: "standard",
    hideHighlights: true,
    docLink: "/docs/platform-engineer-guide/gitops/overview",
    docLabel: "Learn more",
  },
  {
    title: "Multi-tenancy and access controls",
    description:
      "Built-in tenancy boundaries and role-based access control enable safe self-service across teams, projects, and environments.",
    eyebrow: "Access model",
    highlights: [],
    tone: "teal",
    layout: "standard",
    hideHighlights: true,
    docLink: "/docs/platform-engineer-guide/authorization/overview",
    docLabel: "Learn more",
  },
  {
    title: "OpenChoreo Ecosystem",
    description:
      "Integrate external tools into OpenChoreo's unified platform experience using community-driven marketplace modules, or build your own.",
    eyebrow: "Extensibility",
    highlights: [],
    tone: "amber",
    layout: "standard",
    hideHighlights: true,
    docLink: "/ecosystem/",
    docLabel: "Explore the Ecosystem",
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

  if (imageSrc) {
    if (plainMedia) {
      return (
        <div className={styles.plainMediaSurface}>
          {expandableImage ? (
            <ExpandableImage
              src={imageSrc}
              alt={imageAlt}
              className={clsx(styles.expandableMedia, styles.plainMedia)}
              hintText="Expand"
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
      <div className={styles.previewPlaceholder}>
        <div className={styles.previewGrid} />
        <div className={styles.previewGlow} />
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
          bodyClassName={clsx(
            styles.previewMediaFrame,
            fullBleedMedia && styles.previewMediaFrameBleed,
          )}
        >
          {expandableImage ? (
            <ExpandableImage
              src={imageSrc}
              alt={imageAlt}
              className={styles.expandableMedia}
              hintText="Expand"
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
      sources.add(variant.image);
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
        styles[`tone${feature.tone[0].toUpperCase()}${feature.tone.slice(1)}`],
        styles[
          `layout${feature.layout[0].toUpperCase()}${feature.layout.slice(1)}`
        ],
      )}
    >
      <div className={styles.featureContent}>
        <div className={styles.featureMeta}>
          <span className={styles.featureEyebrow}>{feature.eyebrow}</span>
        </div>
        <h3 className={styles.featureTitle}>{feature.title}</h3>
        <p className={styles.featureDescription}>{feature.description}</p>
        {!feature.hideHighlights && (
          <div className={styles.highlightList}>
            {feature.highlights.map((highlight) =>
              mediaVariants?.some((variant) => variant.label === highlight) ? (
                <button
                  key={highlight}
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
              ) : (
                <span key={highlight} className={styles.highlight}>
                  {highlight}
                </span>
              ),
            )}
          </div>
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
  return (
    <section className={styles.section}>
      <div className="container">
        <SectionHeader title="What is OpenChoreo?">
          <p>
            OpenChoreo is a developer platform for Kubernetes offering
            development and architecture abstractions, a Backstage-powered
            developer portal, application CI/CD, GitOps, and observability.
          </p>
        </SectionHeader>

        <div className={styles.featuresGrid}>
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
