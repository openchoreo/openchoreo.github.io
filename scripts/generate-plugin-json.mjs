import fs from "node:fs/promises";
import path from "node:path";

function toOwnerRepo(repo) {
  if (!repo) return null;

  let s = String(repo).trim().replace(/\/+$/, "");
  s = s.replace(/^https?:\/\/(www\.)?github\.com\//i, "");
  s = s.replace(/^(www\.)?github\.com\//i, "");

  const parts = s.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  return `${parts[0]}/${parts[1]}`;
}

function parseStarCount(message) {
  if (!message) return 0;

  const m = message.toLowerCase().trim();

  if (m.endsWith("k")) return Math.round(parseFloat(m) * 1000);
  if (m.endsWith("m")) return Math.round(parseFloat(m) * 1_000_000);

  const n = Number(m.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

async function getStars(ownerRepo) {
  const url = `https://img.shields.io/github/stars/${ownerRepo}.json`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "openchoreo-stars-generator",
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return parseStarCount(data?.message);
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
      console.warn(`⚠️ Invalid repo for "${p.name}"`);
      out.push({ ...p, stars: 0 });
      continue;
    }

    const stars = await getStars(ownerRepo);
    out.push({
      ...p,
      stars: stars ?? 0,
    });
  }

  await fs.writeFile(outputPath, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log("✅ marketplace-plugins.json generated using Shields.io");
}

main().catch((e) => {
  console.error("❌ Generation failed:", e);
  process.exit(1);
});
