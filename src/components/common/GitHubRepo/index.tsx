import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { usePluginData } from '@docusaurus/useGlobalData';
import GitHubMark from '@site/static/img/icons/github-mark.svg';
import StarIcon from '@site/static/img/icons/octicon-star.svg';
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
      <GitHubMark className={styles.mark} aria-hidden="true" />
      {stars !== null && (
        <span className={styles.stars}>
          <StarIcon className={styles.starIcon} aria-hidden="true" />
          {formatStars(stars)}
        </span>
      )}
    </a>
  );

  return mobile ? <li className="menu__list-item">{link}</li> : link;
}
