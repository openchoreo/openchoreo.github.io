import type { ReactNode } from "react";
import React from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import SectionHeader from "@site/src/components/common/SectionHeader";
import styles from "./styles.module.css";
import ExpandableImage from "../common/ExpandableImage";

type Feature = {
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    title: "Modular, multi-plane platform architecture",
    description:
      "Independently deployable control, data, build, and observability planes separate concerns with clear boundaries and flexible deployment topologies, from a single Kubernetes cluster to massively distributed fleets.",
  },
  {
    title: "Platform abstractions (APIs) as building blocks",
    description:
      "Core platform concepts are exposed as declarative APIs (environments, gateways, pipelines/workflows, component types, modules, etc.), so topology and delivery behavior can be standardized across an organization.",
  },
  {
    title: "Programmable developer abstractions",
    description:
      "Developers use higher-level, extensible Kubernetes-native abstractions (projects, components, endpoints, dependencies) and golden paths to ship without dealing with the full surface area of the Kubernetes API.",
  },
  {
    title: "Intelligent, integrated observability",
    description:
      "Unified access to distributed logs, metrics, traces, and alerts and exposed via APIs. A unfied platform context enriched with observability data allows for faster debugging and operational actions for humans and AI.",
  },
  {
    title: "Built-in agents",
    description:
      "Agents are first-class platform citizens.\nIncludes an SRE agent for root cause analysis and remediation, a FinOps agent for cost optimization, and more.",
  },
  {
    title: "AI-assisted/driven engineering and operations",
    description:
      "A controlled agent interface with MCP servers, skills, and the CLI lets AI assistants and agents participate in development, delivery, and operations, without bypassing guardrails.",
  },
  {
    title: "Declarative platform + app state",
    description:
      "Platform and application state are reconciled from Git for auditability and drift resistance, with GUI and CLI support for imperative actions when speed matters (or if that's what you prefer).",
  },
  {
    title: "Multi-tenancy and access controls",
    description:
      "Built-in tenancy boundaries and role-based access control enable safe self-service across teams, projects, and environments with least-privilege access.",
  },
  {
    title: "Modules catalog",
    description:
      "Integrate external tools into OpenChoreo's unified platform experience using community-driven marketplace modules, or build your own.",
  },
];

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
            OpenChoreo is a developer platform for Kubernetes offering
            development and architecture abstractions, a Backstage-powered
            developer portal, application CI/CD, GitOps, and observability.
          </p>
        </SectionHeader>

        <ExpandableImage
          src={useBaseUrl("/img/homepage/openchoreo-architecture-diagram.svg")}
          alt="OpenChoreo high-level architecture diagram"
          className={styles.imageContainer}
        />

        <div className={styles.featuresGrid}>
          {features.map((feature) => (
            <article className={styles.featureCard} key={feature.title}>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
