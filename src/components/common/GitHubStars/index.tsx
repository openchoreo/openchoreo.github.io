import React from 'react';
import styles from './styles.module.css';

export default function GitHubStars() {

  return (
    <a
      href="https://github.com/openchoreo/openchoreo"
      className={styles.githubStars}
      target="_blank"
      rel="noopener noreferrer"
    >
      <svg className={styles.starIcon} viewBox="0 0 16 16" width="16" height="16">
        <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.31a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
      </svg>
      <span className={styles.label}>Star</span>
    </a>
  );
}
