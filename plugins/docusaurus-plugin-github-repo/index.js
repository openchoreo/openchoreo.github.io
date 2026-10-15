// Fetches a GitHub repository's star count at build time and exposes it as
// global data, so the navbar GitHub widget renders it in the static HTML. The
// widget refreshes the count in the browser (see
// src/components/common/GitHubRepo), so it does not go stale between deploys.
//
// The build never fails on this: if GitHub is unreachable the count is null and
// the widget leaves it out. Set GITHUB_TOKEN to raise the API rate limit in CI.
module.exports = function pluginGitHubRepo(context, options) {
  const repo = options.repo ?? 'openchoreo/openchoreo';

  async function github(path) {
    const headers = { Accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const response = await fetch(`https://api.github.com/repos/${repo}${path}`, {
      headers,
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      throw new Error(`GitHub API responded ${response.status} for ${path || '/'}`);
    }
    return response.json();
  }

  return {
    name: 'docusaurus-plugin-github-repo',

    async loadContent() {
      const data = { repo, stars: null };

      try {
        const { stargazers_count: stars } = await github('');
        data.stars = typeof stars === 'number' ? stars : null;
      } catch (error) {
        console.warn(`[github-repo] Could not fetch the star count for ${repo}: ${error.message}`);
      }

      return data;
    },

    async contentLoaded({ content, actions }) {
      actions.setGlobalData(content);
    },
  };
};
