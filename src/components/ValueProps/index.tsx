import type { ReactNode } from "react";
import React from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import {
  AppWindow,
  Blocks,
  Box,
  KeyRound,
  Layers,
  Route,
  type LucideIcon,
} from "lucide-react";
import Button from "@site/src/components/common/Button";
import styles from "./styles.module.css";

interface ValueProp {
  title: string;
  description: string;
  icon: LucideIcon;
}

const valueProps: ValueProp[] = [
  {
    title: "A single platform for your apps, agents, and resources",
    description:
      "Bring everything developers and AI agents need to build, deliver, and operate software into one unified platform experience.",
    icon: Layers,
  },
  {
    title: "A ready-to-use developer portal, with all the bells and whistles",
    description:
      "Get a Backstage-powered portal, CLI, APIs, and agent-ready MCP interfaces, with the developer experience and governance layer ready to go.",
    icon: AppWindow,
  },
  {
    title: "Design golden paths for humans and agents",
    description:
      "Turn platform best practices into reusable, governed, self-service workflows. Assemble OpenChoreo’s platform primitives and developer abstractions into golden paths for humans and AI agents.",
    icon: Route,
  },
  {
    title: "Make Kubernetes boring for developers",
    description:
      "Give developers intent-driven abstractions to ship safely and quickly without wrestling with infrastructure. Augment Kubernetes with a developer-friendly platform layer without hiding what’s underneath.",
    icon: Box,
  },
  {
    title: "A platform architecture that you can extend, scale and maintain",
    description:
      "Adopt OpenChoreo incrementally and integrate with what you already have. Its modular, API-first architecture lets you evolve your tooling and scale from a single cluster to multi-cloud and hybrid-cloud environments.",
    icon: Blocks,
  },
  {
    title: "Own your platform, on your terms",
    description:
      "Integrate, extend, customize, and self-host an open-source platform on any Kubernetes infrastructure, from cloud and on-premises to hybrid and edge. No vendor lock-in, no black boxes, just full control over how and where you run it.",
    icon: KeyRound,
  },
];

function ValuePropTile({ item }: { item: ValueProp }) {
  const Icon = item.icon;

  return (
    <article className={styles.tile}>
      <Icon
        className={styles.icon}
        size={32}
        strokeWidth={1.6}
        aria-hidden="true"
      />
      <div className={styles.text}>
        <h3 className={styles.tileTitle}>{item.title}</h3>
        <p className={styles.tileDescription}>{item.description}</p>
      </div>
    </article>
  );
}

export default function PlatformValueProps(): ReactNode {
  const quickStartUrl = useBaseUrl("/docs/getting-started/quick-start-guide/");

  return (
    <section className={styles.section} aria-label="Why OpenChoreo">
      <div className="container">
        <div className={styles.grid}>
          {valueProps.map((item) => (
            <ValuePropTile key={item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}