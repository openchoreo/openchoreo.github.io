import type { ReactNode } from "react";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import clsx from "clsx";
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from "./styles.module.css";

interface Technology {
  name: string;
  description: string;
  logo: string;
  link: string;
  className?: string;
}

const technologies: Technology[] = [
  {
    name: "Kubernetes",
    description:
      "The foundation for OpenChoreo. OpenChoreo's platform and developer APIs are Kubernetes-native and the control plane uses a controller-based architecture for resilient orchestration across all planes. OpenChoreo can run on any Kubernetes distribution.",
    logo: "/img/logos/tech-logo-kubernetes.webp",
    link: "https://kubernetes.io/",
  },
  {
    name: "Argo Workflows",
    description:
      "The default workflow module powering the OpenChoreo workflow plane — executes CI workflows and platform automation (generic) workflows as Kubernetes-native DAG workflows. Swappable with other workflow engines through OpenChoreo modules.",
    logo: "/img/logos/tech-logo-argo.webp",
    link: "https://argoproj.github.io/workflows/",
  },
  {
    name: "Podman",
    description:
      "Daemonless, rootless OCI container runtime used to build and run container images for OpenChoreo's CI and generic (e.g. IaC) workflows by default.",
    logo: "/img/logos/tech-logo-podman.svg",
    link: "https://podman.io/",
  },
  {
    name: "Cloud Native Buildpacks",
    description:
      "Converts source code into OCI images without a Dockerfile, enabling zero-config container builds in OpenChoreo's CI workflows.",
    logo: "/img/logos/tech-logo-buildpacks.webp",
    link: "https://buildpacks.io/",
  },
  {
    name: "OpenSearch",
    description:
      "The default distributed logs module for the observability plane — provides full-text search, alerting, and retention. Swappable with other backends through OpenChoreo modules.",
    logo: "/img/logos/tech-logo-opensearch.webp",
    link: "https://opensearch.org/",
  },
  {
    name: "Fluent Bit",
    description:
      "The default log collector — deployed on each plane to enrich and forward workload logs to the observability plane.",
    logo: "/img/logos/tech-logo-fluentbit.webp",
    link: "https://fluentbit.io/",
  },
  {
    name: "OpenTelemetry",
    description:
      "A vendor-neutral telemetry framework used by OpenChoreo to provide distributed tracing for deployed applications.",
    logo: "/img/logos/tech-logo-opentelemetry.svg",
    link: "https://opentelemetry.io/",
  },
  {
    name: "Prometheus",
    description:
      "The default metrics module powering OpenChoreo's observability APIs for distributed metrics collection and alerting capabilities.",
    logo: "/img/logos/tech-logo-prometheus.webp",
    link: "https://prometheus.io/",
  },
  {
    name: "Flux",
    description:
      "The default GitOps module — continuously reconciles OpenChoreo's desired platform and application state stored in Git with the control plane.",
    logo: "/img/logos/tech-logo-flux.svg",
    link: "https://fluxcd.io/",
  },
  {
    name: "cert-manager",
    description:
      "Automates TLS certificate provisioning and renewal for deployed components and also provides secure mTLS between the control plane and other planes.",
    logo: "/img/logos/tech-logo-cert-manager.svg",
    link: "https://cert-manager.io/",
  },
  {
    name: "External Secrets Operator",
    description:
      "Acts as an adapter for external secret stores (HashiCorp Vault, OpenBao, AWS Secrets Manager, Azure Key Vault, GCP Secret Manager, etc.) for the data and workflow planes.",
    logo: "/img/logos/tech-logo-eso.svg",
    link: "https://external-secrets.io/",
  },
  {
    name: "OpenBao",
    description:
      "The default secret store backend shipped with OpenChoreo. OpenChoreo can integrate with any secret management solution supported by the External Secrets Operator (ESO).",
    logo: "/img/logos/tech-logo-openbao.svg",
    link: "https://openbao.org/",
    className: styles.invertInDarkMode,
  },
  {
    name: "Backstage",
    description:
      "OpenChoreo uses an extended Backstage fork for its internal developer portal (UI), providing a seamless user experience and extensible plugin architecture.",
    logo: "/img/logos/tech-logo-backstage.webp",
    link: "https://backstage.io/",
    className: styles.invertInDarkMode,
  },
  {
    name: "WSO2",
    description:
      "OpenChoreo's battle-tested architecture and concepts were donated to the community by WSO2. WSO2 also provides optional modules for identity and API management in OpenChoreo.",
    logo: "/img/logos/tech-logo-wso2.webp",
    link: "https://wso2.com/choreo/",
    className: styles.invertInDarkMode,
  },
  {
    name: "ThunderID",
    description:
      "The default identity provider — an open-source, high-performance Go-based IAM server. OpenChoreo can use any OAuth2/OIDC-compatible identity provider for user authentication.",
    logo: "/img/logos/tech-logo-wso2-thunder.svg",
    link: "https://github.com/thunder-id/thunderid",
    className: styles.invertInDarkMode,
  },
  {
    name: "kgateway",
    description:
      "The default gateway module — an Envoy-based CNCF project implementing the Kubernetes Gateway API. OpenChoreo can support any Kubernetes gateway (including vendor-specific API-management solutions) through its modular architecture.",
    logo: "/img/logos/tech-logo-kgateway.svg",
    link: "https://kgateway.dev/",
  },
  {
    name: "Helm",
    description:
      "Kubernetes package manager used to install and lifecycle-manage OpenChoreo's Control, Data, Workflow, and Observability Plane charts.",
    logo: "/img/logos/tech-logo-helm.webp",
    link: "https://helm.sh/",
    className: styles.invertInDarkMode,
  },
  {
    name: "CEL",
    description:
      "The Common Expression Language (CEL) and related extensions power OpenChoreo's programmable component types, traits, workflows and other validation policies.",
    logo: "/img/logos/tech-logo-cel.svg",
    link: "https://cel.dev/",
  },
  {
    name: "Apache Casbin",
    description:
      "OpenChoreo's fine-grained RBAC, ABAC and instance-level authorization capabilities are powered by Apache Casbin, an efficient and powerful open-source authorization library.",
    logo: "/img/logos/tech-logo-casbin.svg",
    link: "https://casbin.org/",
  },
  {
    name: "KEDA",
    description:
      "Kubernetes Event-driven Autoscaler that powers OpenChoreo's Elastic module for scale-to-zero (this module is under development).",
    logo: "/img/logos/tech-logo-keda.svg",
    link: "https://keda.sh/",
    className: styles.invertInDarkMode,
  },
  {
    name: "Cilium",
    description:
      "eBPF-based CNI that enforces zero-trust network policies and kernel-level network observability in data planes (this module is under development).",
    logo: "/img/logos/tech-logo-cilium.webp",
    link: "https://cilium.io/",
  },
];

type StackLogo = {
  name: string;
  logos: string[];
  x: number;
  y: number;
  lineX?: number;
  lineY?: number;
};

const stackLogos: StackLogo[] = [
  {
    name: "Identity providers",
    logos: [
      "/img/logos/ecosystem-logo-okta.webp",
      "/img/logos/ecosystem-logo-keycloak.webp",
      "/img/logos/ecosystem-logo-ory.webp",
    ],
    x: 50,
    y: 6,
    lineX: 50,
    lineY: 13,
  },
  {
    name: "CI systems",
    logos: [
      "/img/logos/tech-logo-argo.webp",
      "/img/logos/ecosystem-logo-githubactions.webp",
      "/img/logos/ecosystem-logo-jenkins.webp",
    ],
    x: 76,
    y: 18,
  },
  {
    name: "GitOps integrations",
    logos: [
      "/img/logos/tech-logo-flux.svg",
      "/img/logos/ecosystem-logo-weave.webp",
      "/img/logos/tech-logo-argo.webp",
    ],
    x: 91,
    y: 47,
  },
  {
    name: "API gateways",
    logos: [
      "/img/logos/ecosystem-logo-wso2.webp",
      "/img/logos/tech-logo-kgateway.svg",
      "/img/logos/ecosystem-logo-apisix.webp",
    ],
    x: 76,
    y: 78,
  },
  {
    name: "AI gateways",
    logos: [
      "/img/logos/ecosystem-logo-agentgateway.webp",
      "/img/logos/ecosystem-logo-wso2.webp",
      "/img/logos/ecosystem-logo-envoy.webp",
    ],
    x: 50,
    y: 92,
  },
  {
    name: "Observability",
    logos: [
      "/img/logos/tech-logo-opensearch.webp",
      "/img/logos/tech-logo-prometheus.webp",
      "/img/logos/tech-logo-opentelemetry.svg",
    ],
    x: 24,
    y: 78,
  },
  {
    name: "Network & Security",
    logos: [
      "/img/logos/tech-logo-cilium.webp",
      "/img/logos/ecosystem-logo-istio.webp",
      "/img/logos/ecosystem-logo-linkerd.webp",
    ],
    x: 9,
    y: 47,
  },
  {
    name: "Infrastructure provisioners",
    logos: [
      "/img/logos/ecosystem-logo-crossplane.webp",
      "/img/logos/ecosystem-logo-opentofu.webp",
      "/img/logos/ecosystem-logo-pulumi.webp",
    ],
    x: 24,
    y: 18,
  },
];

function ToolchainLogo({ tech }: { tech: Technology }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const logoSrc = useBaseUrl(tech.logo);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keep the tooltip inside the viewport.
  useLayoutEffect(() => {
    if (!isOpen || !tooltipRef.current) return;
    const tooltip = tooltipRef.current;
    const arrow = tooltip.querySelector<HTMLElement>(`.${styles.tooltipArrow}`);
    tooltip.style.transform = "";
    if (arrow) arrow.style.left = "";

    const rect = tooltip.getBoundingClientRect();
    const margin = 8;
    let shift = 0;
    if (rect.left < margin) {
      shift = margin - rect.left;
    } else if (rect.right > window.innerWidth - margin) {
      shift = window.innerWidth - margin - rect.right;
    }
    if (shift !== 0) {
      tooltip.style.transform = `translateX(calc(-50% + ${shift}px))`;
      if (arrow) arrow.style.left = `calc(50% - ${shift}px)`;
    }
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={styles.tile}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div
        className={styles.tileButton}
        onClick={() => setIsOpen(true)}
        role="button"
        tabIndex={0}
        aria-label={`${tech.name} - click for more info`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setIsOpen(true);
          if (e.key === "Escape") setIsOpen(false);
        }}
      >
        <img
          src={logoSrc}
          alt={`${tech.name} logo`}
          className={clsx(styles.tileImage, tech.className)}
          loading="lazy"
        />
      </div>

      {isOpen && (
        <div className={styles.tooltip} ref={tooltipRef}>
          <div className={styles.tooltipContent}>
            <h3 className={styles.tooltipTitle}>{tech.name}</h3>
            <p className={styles.tooltipDescription}>{tech.description}</p>
            <a
              href={tech.link}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.tooltipLink}
              onClick={(e) => e.stopPropagation()}
            >
              View project website →
            </a>
          </div>
          <div className={styles.tooltipArrow}></div>
        </div>
      )}
    </div>
  );
}

/** Compact grid of the cloud native stack logos, ending with a "more" tile. */
export function ToolchainLogoGrid({
  moreHref = "/ecosystem/",
}: {
  moreHref?: string;
}): ReactNode {
  const moreUrl = useBaseUrl(moreHref);
  return (
    <div
      className={styles.logoGrid}
      aria-label="Projects OpenChoreo is built on"
    >
      {technologies.map((tech) => (
        <ToolchainLogo key={tech.name} tech={tech} />
      ))}
      <a
        href={moreUrl}
        className={clsx(styles.tileButton, styles.moreTile)}
        aria-label="See the full OpenChoreo ecosystem"
      >
        …
      </a>
    </div>
  );
}

/** Ecosystem orbit: integration categories around the OpenChoreo logo. */
export function ToolchainOrbit(): ReactNode {
  const centerLogo = useBaseUrl("/img/openchoreo-logo.svg");
  return (
    <div
      className={styles.graphic}
      aria-label="OpenChoreo ecosystem integrations"
    >
      <div className={styles.orbitOuter} />
      <div className={styles.orbitInner} />

      <svg className={styles.lines} viewBox="0 0 100 100" aria-hidden="true">
        {stackLogos.map((item) => (
          <line
            key={item.name}
            x1="50"
            y1="50"
            x2={item.lineX ?? item.x}
            y2={item.lineY ?? item.y}
          />
        ))}
      </svg>

      <div className={styles.center}>
        <img src={centerLogo} alt="OpenChoreo" />
      </div>

      {stackLogos.map((item) => (
        <div
          key={item.name}
          className={styles.node}
          style={
            {
              "--x": `${item.x}%`,
              "--y": `${item.y}%`,
            } as React.CSSProperties
          }
        >
          <span className={styles.logoCluster}>
            {item.logos.map((logo) => (
              <span key={logo} className={styles.orbitLogo}>
                <img src={logo} alt="" loading="lazy" />
              </span>
            ))}
          </span>
          <span className={styles.label}>{item.name}</span>
        </div>
      ))}
    </div>
  );
}

export const toolchainCardClassName = styles.card;
export const toolchainMediaClassName = styles.media;