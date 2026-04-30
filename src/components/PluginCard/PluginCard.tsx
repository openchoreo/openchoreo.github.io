import React, { useState } from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from "./PluginCard.module.css";

interface Plugin {
  id: string;
  group: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  logoUrl?: string;
  author: string;
  sourceUrl?: string;
  default?: boolean;
  released?: boolean;
}

interface PluginCardProps {
  plugin: Plugin;
}

const GROUP_LABELS: Record<string, string> = {
  module: "Module",
  integration: "Integration",
  agent: "Agent",
  skill: "Skill",
  "component-type": "Component Type",
  workflow: "Workflow",
};

const GROUP_CLASSES: Record<string, string> = {
  module: styles.groupModule,
  integration: styles.groupIntegration,
  agent: styles.groupAgent,
  skill: styles.groupSkill,
  "component-type": styles.groupComponentType,
  workflow: styles.groupWorkflow,
};

export const PluginCard: React.FC<PluginCardProps> = ({ plugin }) => {
  const groupName = GROUP_LABELS[plugin.group] ?? plugin.group;
  const groupClass = GROUP_CLASSES[plugin.group] ?? styles.groupModule;
  const defaultLogo = useBaseUrl("/img/openchoreo-logo.svg");
  const [logoFailed, setLogoFailed] = useState(false);
  const logoSrc = plugin.logoUrl && !logoFailed ? plugin.logoUrl : defaultLogo;

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.logoWrap}>
          <img
            src={logoSrc}
            alt={`${plugin.name} logo`}
            className={styles.logo}
            onError={() => setLogoFailed(true)}
          />
        </div>
        <div className={styles.titleStack}>
          <h3 className={styles.title}>{plugin.name}</h3>
          <span className={`${styles.groupBadge} ${groupClass}`}>
            {groupName}
          </span>
        </div>
      </div>

      <p className={styles.description}>{plugin.description}</p>

      <div className={styles.tags}>
        {plugin.tags.map((tag) => (
          <span key={tag} className={styles.tag}>
            #{tag}
          </span>
        ))}
      </div>

      <div className={styles.actions}>
        {plugin.released === false ? (
          <span className={styles.comingSoon}>Coming Soon</span>
        ) : (
          <Link
            to={`/ecosystem/item/?id=${plugin.id}`}
            aria-label={`View ${plugin.name}`}
            className={styles.viewButton}
          >
            View
          </Link>
        )}
      </div>
    </article>
  );
};
