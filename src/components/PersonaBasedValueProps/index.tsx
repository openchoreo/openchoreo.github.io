import type { ReactNode } from "react";
import React from "react";
import {
  Activity,
  Code,
  Compass,
  TrendingUp,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import SectionHeader from "@site/src/components/common/SectionHeader";
import styles from "./styles.module.css";

interface Persona {
  name: string;
  description: string;
  icon: LucideIcon;
  link?: { label: string; to: string };
}

const personas: Persona[] = [
  {
    name: "Platform engineers",
    description:
      "Build and evolve your internal developer platform with composable primitives, golden paths, guardrails, and self-service workflows.",
    icon: Wrench,
  },
  {
    name: "Software engineers",
    description:
      "Build and ship software faster through the developer portal, CLI, or coding agents without wrestling with infrastructure internals.",
    icon: Code,
  },
  {
    name: "Architects and technical leads",
    description:
      "Turn engineering standards into guardrails, connect architecture to production, and track compliance, health, and delivery performance.",
    icon: Compass,
  },
  {
    name: "SREs and operations teams",
    description:
      "Standardize observability and reliability while giving developers governed self-service and reducing operational toil across teams.",
    icon: Activity,
  },
  {
    name: "CxOs and technology leaders",
    description:
      "See engineering health, accelerate delivery, and adopt AI on an open platform without building critical capabilities around proprietary tools.",
    icon: TrendingUp,
  },
];

export default function PersonaBasedValueProps(): ReactNode {
  return (
    <section className={styles.section} data-section-bg="gray">
      <div className="container">
        <SectionHeader title="One Platform for Your Entire Engineering Organization">
          <p>
            Give every team the tools to build, deliver, and operate software
            on a shared platform with consistent abstractions, guardrails, and
            governance across your organization.
          </p>
        </SectionHeader>

        <div className={styles.grid}>
          {personas.map((persona) => {
              const Icon = persona.icon;

              return (
                <article
                  key={persona.name}
                  className={styles.card}
                >
                  <Icon
                    className={styles.icon}
                    size={24}
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />
                  <h3 className={styles.cardTitle}>{persona.name}</h3>
                  <p className={styles.description}>{persona.description}</p>
                </article>
              );
          })}
        </div>
      </div>
    </section>
  );
}
