import type { ReactNode } from "react";
import React, { useId, useState } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
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
      "Build and evolve your internal developer platform using composable primitives, APIs, and extensible abstractions. Define golden paths, establish guardrails, and give teams self-service without becoming a ticketing bottleneck.",
    icon: Wrench,
  },
  {
    name: "Software engineers",
    description:
      "Spend more time building software and less time wrestling with infrastructure internals and support tickets. Whether you work from the developer portal, CLI, or through coding agents, OpenChoreo meets you where you work and gives you a highway from code to production.",
    icon: Code,
  },
  {
    name: "Architects and technical leads",
    description:
      "Close the gap between architecture on paper and software running in production. Turn engineering standards into enforceable guardrails, continuously understand compliance, and see whether what you designed is what actually got deployed. Track engineering health and delivery performance across your organization from a single platform.",
    icon: Compass,
  },
  {
    name: "SREs and operations teams",
    description:
      "Give developers more autonomy without giving up operational control. Standardize observability, reliability, and operational practices across teams, with a unified view of what’s running, how it’s connected, and how it’s performing. Turn common operational tasks into governed self-service instead of tickets and toil.",
    icon: Activity,
  },
  {
    name: "CxOs and technology leaders",
    description:
      "Get immediate visibility into your engineering organization simply by asking your AI agents. Drive AI adoption across the software delivery lifecycle with a governed platform to build and run AI workloads safely alongside your apps and resources, cutting platform build time to weeks of ROI through faster delivery and higher developer productivity. Avoid building critical capabilities around proprietary tools; integrate them behind a battle-tested, open-source platform that keeps you in control.",
    icon: TrendingUp,
  },
];

/** Matches the mobile breakpoint in styles.module.css */
const MOBILE_QUERY = "(max-width: 768px)";

function PersonaContent({ persona }: { persona: Persona }) {
  return (
    <>
      <p className={styles.description}>{persona.description}</p>
      {persona.link && (
        <Link to={persona.link.to} className={styles.link}>
          {persona.link.label} →
        </Link>
      )}
    </>
  );
}

/**
 * Desktop/tablet: persona list on the left, selected persona in a panel on the right.
 * Mobile: the same list becomes an accordion; each persona opens in place.
 */
export default function EngineeringPersonas(): ReactNode {
  const [active, setActive] = useState<number | null>(0);
  const baseId = useId();

  const handleSelect = (index: number) => {
    const isMobile =
      typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches;
    // On mobile, tapping the open item collapses it; on desktop one is always selected.
    setActive((current) => (isMobile && current === index ? null : index));
  };

  const panelPersona = personas[active ?? 0];
  const PanelIcon = panelPersona.icon;

  return (
    <section className={styles.section}>
      <div className="container">
        <SectionHeader title="One platform for your entire engineering organization">
          <p>
            Give every team the capabilities they need while keeping your
            engineering organization aligned around a shared platform,
            abstractions, and governance.
          </p>
        </SectionHeader>

        <div className={styles.layout}>
          <ul className={styles.list}>
            {personas.map((persona, index) => {
              const Icon = persona.icon;
              const isActive = active === index;
              const regionId = `${baseId}-persona-${index}`;

              return (
                <li
                  key={persona.name}
                  className={clsx(styles.item, isActive && styles.itemActive)}
                >
                  <button
                    type="button"
                    className={styles.trigger}
                    aria-expanded={isActive}
                    aria-controls={regionId}
                    onClick={() => handleSelect(index)}
                  >
                    <Icon
                      className={styles.icon}
                      size={22}
                      strokeWidth={1.7}
                      aria-hidden="true"
                    />
                    <span className={styles.triggerLabel}>{persona.name}</span>
                    <span className={styles.chevron} aria-hidden="true" />
                  </button>

                  {/* Inline content: only displayed on mobile (accordion) */}
                  <div
                    id={regionId}
                    className={styles.inlineContent}
                    hidden={!isActive}
                  >
                    <PersonaContent persona={persona} />
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Side panel: only displayed on tablet/desktop */}
          <div className={styles.panel} aria-live="polite">
            <PanelIcon
              className={styles.icon}
              size={32}
              strokeWidth={1.6}
              aria-hidden="true"
            />
            <h3 className={styles.panelTitle}>{panelPersona.name}</h3>
            <PersonaContent persona={panelPersona} />
          </div>
        </div>
      </div>
    </section>
  );
}