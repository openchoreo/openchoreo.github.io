import type { ReactNode } from "react";
import React, { useState, useRef, useEffect } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import SectionHeader from "@site/src/components/common/SectionHeader";
import styles from "./styles.module.css";
import clsx from "clsx";

interface Technology {
  name: string;
  description: string;
  logo: string;
  link: string;
  className?: string; // Optional additional class for custom styling (e.g. OpenBao)
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
    className: styles.greyScaleAndInvertInDarkMode,
  },
  {
    name: "Backstage",
    description:
      "OpenChoreo uses an extended Backstage fork for its internal developer portal (UI), providing a seamless user experience and extensible plugin architecture.",
    logo: "/img/logos/tech-logo-backstage.webp",
    link: "https://backstage.io/",
    className: styles.greyScaleAndInvertInDarkMode,
  },
  {
    name: "WSO2",
    description:
      "OpenChoreo's battle-tested architecture and concepts were donated to the community by WSO2. WSO2 also provides optional modules for identity and API management in OpenChoreo.",
    logo: "/img/logos/tech-logo-wso2.webp",
    link: "https://wso2.com/choreo/",
    className: styles.greyScaleAndInvertInDarkMode,
  },
  {
    name: "WSO2 Thunder",
    description:
      "The default identity provider — an open-source, high-performance Go-based IAM server. OpenChoreo can use any OAuth2/OIDC-compatible identity provider for user authentication.",
    logo: "/img/logos/tech-logo-wso2-thunder.svg",
    link: "https://github.com/asgardeo/thunder",
    className: styles.greyScaleAndInvertInDarkMode,
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
    className: styles.greyScaleAndInvertInDarkMode,
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
      "Kubernetes Event-driven Autoscaler that powers OpenChoreo's Elastic module for scale-to-zero (this moduleis under development).",
    logo: "/img/logos/tech-logo-keda.svg",
    link: "https://keda.sh/",
    className: styles.greyScaleAndInvertInDarkMode,
  },
  {
    name: "Cilium",
    description:
      "eBPF-based CNI that enforces zero-trust network policies and kernel-level network observability in data planes (this module is under development).",
    logo: "/img/logos/tech-logo-cilium.webp",
    link: "https://cilium.io/",
  },
];

function TechLogo({
  tech,
  className,
}: {
  tech: Technology;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={containerRef}
      className={styles.logoContainer}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div
        className={clsx(styles.logoLink)}
        onClick={() => setIsOpen((prev) => !prev)}
        role="button"
        tabIndex={0}
        aria-label={`${tech.name} - click for more info`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setIsOpen((prev) => !prev);
        }}
      >
        <img
          src={useBaseUrl(tech.logo)}
          alt={`${tech.name} logo`}
          className={clsx(styles.logo, className)}
        />
      </div>

      {isOpen && (
        <div className={styles.tooltip}>
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

export default function TechStack(): ReactNode {
  return (
    <section className={styles.section}>
      <div className="container">
        <SectionHeader title="Built on the Cloud Native Stack">
          <p>
            OpenChoreo orchestrates Kubernetes and other complimentary CNCF and
            open-source projects to provide a production-grade IDP.
            <br />
          </p>
        </SectionHeader>

        <div className={styles.logosGrid}>
          {technologies.map((tech, index) => (
            <TechLogo key={index} tech={tech} className={tech.className} />
          ))}
        </div>

        <div className={styles.toolingNote}>
          <small>
            You can integrate other tools and vendors for identity, CI, observability,
            gateways and other platform services with
            OpenChoreo's modular architecture. The ones listed above are the
            default options that ship with OpenChoreo.
          </small>
        </div>
      </div>
    </section>
  );
}
