import fs from "node:fs/promises";
import path from "node:path";

function toOwnerRepo(repo) {
  if (!repo) return null;

  let s = String(repo).trim().replace(/\/+$/, "");

  // strip github prefixes
  s = s.replace(/^https?:\/\/(www\.)?github\.com\//i, "");
  s = s.replace(/^(www\.)?github\.com\//i, "");

  // remove /tree/... or /blob/... if pasted
  const parts = s.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  return `${parts[0]}/${parts[1]}`;
}

async function getStars(ownerRepo) {
  const res = await fetch(`https://api.github.com/repos/${ownerRepo}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "openchoreo-stars-generator",
      ...(process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {}),
    },
  });

  if (!res.ok) {
    let body = "";
    try {
      body = await res.text();
    } catch {
      // ignore
    }
    return { ok: false, status: res.status, body };
  }

  const data = await res.json();
  const count = data?.stargazers_count;
  return { ok: true, stars: typeof count === "number" ? count : 0 };
}

async function main() {
  const inputPath = path.join("src", "data", "marketplace-plugins.source.json");
  const outputPath = path.join("src", "data", "marketplace-plugins.json");

  const raw = await fs.readFile(inputPath, "utf8");
  const plugins = JSON.parse(raw);

  const out = [];
  for (const p of plugins) {
    const ownerRepo = toOwnerRepo(p.repo);

    if (!ownerRepo) {
      console.warn(` Invalid repo for "${p.name}": ${p.repo}`);
      out.push({ ...p, stars: 0 });
      continue;
    }

    const result = await getStars(ownerRepo);

    if (!result.ok) {
      console.warn(
        ` Stars fetch failed for ${ownerRepo} (${result.status}). Setting stars=0.`
      );
      // uncomment next line if you want full error text
      // console.warn(result.body);
      out.push({ ...p, stars: 0 });
      continue;
    }

    out.push({ ...p, stars: result.stars });
  }

  await fs.writeFile(outputPath, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`Generated: ${outputPath}`);
}

main().catch((e) => {
  console.error(" Failed generating plugin JSON:", e);
  process.exit(1);
});
