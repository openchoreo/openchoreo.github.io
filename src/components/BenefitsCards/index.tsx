import type { ReactNode } from "react";
import React from "react";
import SectionHeader from "@site/src/components/common/SectionHeader";
import styles from "./styles.module.css";

interface Benefit {
  title: string;
  description: string;
}

const benefits: Benefit[] = [
  {
    title: "One unified platform surface",
    description:
      "A single developer portal, API surface, CLI and operational context for building, delivering, and running software, without jumping between disconnected tools.",
  },
  {
    title: "Golden paths for developer self-service",
    description:
      "Define opinionated, reusable workflows and component types that guide developers from idea to production, with standardized delivery patterns instead of ad-hoc pipelines.",
  },
  {
    title: "Autonomous engineering",
    description:
      "Agent-ready interfaces (MCP + skills) and built-in agents automate common delivery and operational workflows—triage, remediation, RCA, and cost checks, within platform guardrails.",
  },
  {
    title: "Governance and security by design",
    description:
      "Policy enforcement, runtime isolation, and least-privilege access are embedded into platform and developer abstractions so self-service scales without governance and security becoming an afterthought.",
  },
  {
    title: "Composable and extensible",
    description:
      "Adopt only what you need and integrate your existing stack through marketplace or custom modules, external tools become part of a unified platform experience, not one-off ad-hoc integrations.",
  },
  {
    title: "Scale as you grow",
    description:
      "A modular, multi-plane architecture scales from a single small cluster to multi-cloud, hybrid, and on-prem fleets, letting you scale infrastructure as your teams and systems grow without re-architecting the platform.",
  },
];

function BenefitCard({ benefit }: { benefit: Benefit }) {
  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>{benefit.title}</h3>
      <p className={styles.cardDescription}>{benefit.description}</p>
    </div>
  );
}

export default function BenefitsCards(): ReactNode {
  return (
    <section className={styles.section}>
      <div className="container">
        <SectionHeader title="What You Get with OpenChoreo">
          <p>
            OpenChoreo isn't just a toolkit—it's a complete, modular foundation for building
            your Internal Developer Platform. It brings clarity, security, and
            self-service to every stage of your developer experience.
          </p>
        </SectionHeader>

        <div className={styles.grid}>
          {benefits.map((benefit, index) => (
            <BenefitCard key={index} benefit={benefit} />
          ))}
        </div>
      </div>
    </section>
  );
}
