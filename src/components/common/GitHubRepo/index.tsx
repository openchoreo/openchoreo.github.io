import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { usePluginData } from '@docusaurus/useGlobalData';
import styles from './styles.module.css';

type RepoData = { repo: string; stars: number | null };

// The live count is cached for the browser session, so navigating between
// pages does not call the GitHub API (60 unauthenticated requests per hour).
const CACHE_KEY = 'openchoreo:github-stars';
const CACHE_TTL_MS = 60 * 60 * 1000;

const formatStars = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
}).format;

// Reads the cached count, refreshing it from the GitHub API when the cache is
// empty or older than CACHE_TTL_MS. Resolves to null if neither works.
async function liveStars(repo: string): Promise<number | null> {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? 'null');
    if (cached?.repo === repo && Date.now() - cached.at < CACHE_TTL_MS) {
      return cached.stars;
    }
  } catch {
    // Storage unavailable or corrupt: fall through to the API.
  }
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`);
    if (!response.ok) return null;
    const { stargazers_count: stars } = await response.json();
    if (typeof stars !== 'number') return null;
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ repo, stars, at: Date.now() }));
    } catch {
      // Ignore storage errors; the count is still shown.
    }
    return stars;
  } catch {
    return null;
  }
}

/**
 * Navbar link to the GitHub repository: the GitHub mark followed by the star
 * count. The count comes from the build (docusaurus-plugin-github-repo) and is
 * refreshed in the browser. In the mobile sidebar it is the same widget,
 * styled as a menu link.
 */
export default function GitHubRepo({ mobile }: { mobile?: boolean }) {
  const { repo, stars: buildStars } = usePluginData(
    'docusaurus-plugin-github-repo',
  ) as RepoData;
  const [stars, setStars] = useState(buildStars);

  useEffect(() => {
    let active = true;
    liveStars(repo).then((live) => {
      if (active && live !== null) setStars(live);
    });
    return () => {
      active = false;
    };
  }, [repo]);

  const repoUrl = `https://github.com/${repo}`;

  const link = (
    <a
      href={repoUrl}
      className={clsx(
        mobile ? ['menu__link', styles.mobileRepo] : ['navbar__item', styles.repo],
      )}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={
        stars === null
          ? 'GitHub repository'
          : `GitHub repository, ${stars.toLocaleString('en')} stars`
      }
    >
      <svg className={styles.mark} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
      {stars !== null && (
        <span className={styles.stars}>
          {/* Octicon star (16px) */}
          <svg className={styles.starIcon} viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.31a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z" />
          </svg>
          {formatStars(stars)}
        </span>
      )}
    </a>
  );

  return mobile ? <li className="menu__list-item">{link}</li> : link;
}
