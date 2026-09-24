import React, { JSX, useEffect } from 'react';
import styles from './styles.module.css';

const GITHUB_REPO_URL = 'https://github.com/openchoreo/openchoreo';

/**
 * GitHubStarButton Component
 * Uses the official GitHub Buttons widget (buttons.github.io)
 */
function GitHubStarButton(): JSX.Element {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://buttons.github.io/buttons.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className={styles.starButtonContainer}>
      <a
        className="github-button"
        href={GITHUB_REPO_URL}
        data-icon="octicon-star"
        data-size="large"
aria-label="Star openchoreo/openchoreo on GitHub"
      >
        Star
      </a>
    </div>
  );
}

export default GitHubStarButton;
