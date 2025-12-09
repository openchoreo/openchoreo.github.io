import React, { JSX, useEffect, useState } from 'react';
import styles from './styles.module.css';

const GITHUB_API_URL = 'https://api.github.com/repos/openchoreo/openchoreo';
const GITHUB_REPO_URL = 'https://github.com/openchoreo/openchoreo';

/**
 * GitHubStarButton Component
 * Simple "Star us on GitHub" button with OpenChoreo branding
 */
function GitHubStarButton(): JSX.Element {
  return (
    <div className={styles.starButtonContainer}>
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.starLink}
        aria-label="Star OpenChoreo on GitHub"
      >
        <svg
          aria-hidden="true"
          height="20"
          viewBox="0 0 16 16"
          width="20"
          className={styles.starIcon}
        >
          <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.31a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
        </svg>
        Star us on GitHub
      </a>
    </div>
  );
}

// ============================================
// COMMENTED OUT: Original star counter code
// Keeping this for potential future reuse
// ============================================
/*
const formatStarCount = (count: number): string => {
  if (count === 0) return '—';
  return count.toLocaleString('en-US');
};

const fetchWithRetry = async (url: string, maxRetries = 3): Promise<number | null> => {
  let delay = 1000;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      if (typeof data.stargazers_count === 'number') {
        return data.stargazers_count;
      }
    } catch (error) {
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  }
  return null;
};

function GitHubStarButton(): JSX.Element {
  const [isClient, setIsClient] = useState(false);
  const [starCount, setStarCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    fetchWithRetry(GITHUB_API_URL).then(count => {
      setStarCount(count);
      setLoading(false);
    });
  }, [isClient]);
 

  return (
    <div className={styles.starButtonContainer}>
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.starLink}
        aria-label={`Star openchoreo on GitHub${starCount ? ` (${formatStarCount(starCount)} stars)` : ''}`}
      >
        <svg
          aria-hidden="true"
          height="20"
          viewBox="0 0 16 16"
          width="20"
          className={styles.starIcon}
        >
          <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.31a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
        </svg>
        Star
      </a>

      <div
        className={styles.starCount}
        title={loading ? 'Loading star count...' : starCount !== null ? `${formatStarCount(starCount)} stars` : 'Star count unavailable'}
      >
        {loading ? (
          <span className={styles.loadingPulse}>...</span>
        ) : (
          formatStarCount(starCount || 0)
        )}
      </div>
    </div>
  );
}
  */

export default GitHubStarButton;