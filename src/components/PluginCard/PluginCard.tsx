import React from "react";
import styles from "./PluginCard.module.css";

interface Plugin {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  icon: string;
  logoUrl?: string;
  author: string;
  repo?: string;
  moduleUrl?: string;
  stars?: number; // generated
  released?: boolean;
}

interface PluginCardProps {
  plugin: Plugin;
}

function getRepoUrl(repo?: string): string | null {
  if (!repo) return null;

  const r = repo.trim().replace(/\/+$/, "");
  if (/^https?:\/\//i.test(r)) return r;
  if (/^(www\.)?github\.com\//i.test(r)) return `https://${r}`;
  return `https://github.com/${r}`;
}

export const PluginCard: React.FC<PluginCardProps> = ({ plugin }) => {
  const repoUrl = React.useMemo(() => getRepoUrl(plugin.repo), [plugin.repo]);
  const exploreUrl = plugin.moduleUrl || repoUrl;
  const starsText = React.useMemo(
    () => String((plugin.stars ?? 0).toLocaleString()),
    [plugin.stars]
  );

  return (
    <article className={`card ${styles.card}`}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <div className={styles.iconWrapper}>
            {plugin.logoUrl ? (
              <img src={plugin.logoUrl} alt={`${plugin.name} logo`} className={styles.logo} />
            ) : plugin.icon ? (
              <span className={styles.icon}>{plugin.icon}</span>
            ) : (
              <div className={styles.placeholder}>Logo</div>
            )}
          </div>

          <div>
            <h3 className={styles.title}>{plugin.name}</h3>
            <p className={styles.category}>{plugin.category}</p>
          </div>
        </div>

        <div className={styles.meta}>
          <div className={styles.author}>{plugin.author}</div>
          <div className={styles.stars}>⭐ {starsText}</div>
        </div>
      </div>

      <div className={styles.body}>
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
