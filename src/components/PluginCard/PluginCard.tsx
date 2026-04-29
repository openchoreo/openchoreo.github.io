import React from "react";
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

export const PluginCard: React.FC<PluginCardProps> = ({ plugin }) => {
  const exploreUrl = plugin.sourceUrl;
  const groupName = GROUP_LABELS[plugin.group] ?? plugin.group;

  return (
    <article className={`card ${styles.card}`}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <div className={styles.iconWrapper}>
            {plugin.logoUrl ? (
              <img src={plugin.logoUrl} alt={`${plugin.name} logo`} className={styles.logo} />
            ) : (
              <div className={styles.placeholder}>Logo</div>
            )}
          </div>

          <div>
            <h3 className={styles.title}>{plugin.name}</h3>
            <p className={styles.category}>{plugin.category}</p>
          </div>
        </div>

        <span className={styles.groupLabel}>{groupName}</span>
      </div>

      <div className={styles.body}>
        <p className={styles.author}>by {plugin.author}</p>
        <p className={styles.description}>{plugin.description}</p>

        <div className={styles.tags}>
          {plugin.tags.map((tag) => (
            <span key={tag} className={`badge badge--secondary ${styles.tag}`}>
              #{tag}
            </span>
          ))}
        </div>

        <div className={styles.actions}>
          {plugin.released === false ? (
            <span className={styles.comingSoon}>Coming Soon</span>
          ) : (
            exploreUrl && (
              <a
                href={exploreUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Explore ${plugin.name}`}
                className={styles.exploreButton}
              >
                Explore
              </a>
            )
          )}
        </div>
      </div>
    </article>
  );
};
