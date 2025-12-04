import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your JSON file
const jsonPath = path.join(__dirname, '..', 'src', 'data', 'marketplace-plugins.json');

// Read JSON
const raw = fs.readFileSync(jsonPath, 'utf8');
const plugins = JSON.parse(raw);

// Optionally use a token to avoid low rate limits.
// Set GITHUB_TOKEN in your env or CI if you want.
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function fetchStars(repo) {
  const res = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: {
      'User-Agent': 'openchoreo-marketplace',
      ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {})
    }
  });

  if (!res.ok) {
    console.warn(`⚠️  Failed to fetch ${repo}: ${res.status} ${res.statusText}`);
    return null;
  }

  const data = await res.json();
  return typeof data.stargazers_count === 'number' ? data.stargazers_count : null;
}

async function main() {
  console.log('🔄 Updating stars from GitHub...');

  for (const plugin of plugins) {
    if (!plugin.repo) {
      continue;
    }

    try {
      const stars = await fetchStars(plugin.repo);
      if (stars != null) {
        console.log(`⭐ ${plugin.repo}: ${stars}`);
        plugin.stars = stars;
      } else {
        console.warn(`⚠️ No stars value for ${plugin.repo}, keeping existing: ${plugin.stars}`);
      }
    } catch (err) {
      console.error(`❌ Error fetching ${plugin.repo}`, err);
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(plugins, null, 2));
  console.log('✅ marketplace-plugins.json updated with latest stars');
}

main().catch((err) => {
  console.error('❌ fetch-stars script failed:', err);
  process.exit(1);
});
