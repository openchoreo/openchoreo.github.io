import React from 'react';
import styles from './PluginCard.module.css';

interface Plugin {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  icon: string;
  logoUrl?: string;
  author: string;
  stars: number;
  repo?: string; // NEW
}

interface PluginCardProps {
  plugin: Plugin;
}

export const PluginCard: React.FC<PluginCardProps> = ({ plugin }) => {
  return (
    <article className={`card ${styles.card}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <div className={styles.iconWrapper}>
            {plugin.logoUrl ? (
              <img
                src={plugin.logoUrl}
                alt={`${plugin.name} logo`}
                className={styles.logo}
              />
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
          <div className={styles.stars}>⭐ {plugin.stars.toLocaleString()}</div>
        </div>
      </div>

      {/* Body */}
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
          <button className={styles.exploreButton}>Explore</button>
        </div>
      </div>
    </article>
  );
};
