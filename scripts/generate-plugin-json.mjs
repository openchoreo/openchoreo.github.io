import fs from "node:fs/promises";
import path from "node:path";

async function main() {
  const inputPath = path.join("src", "data", "marketplace-plugins.source.json");
  const outputPath = path.join("src", "data", "marketplace-plugins.json");

  const raw = await fs.readFile(inputPath, "utf8");
  const plugins = JSON.parse(raw);

  // Simply copy the source data without fetching stars
  await fs.writeFile(outputPath, JSON.stringify(plugins, null, 2) + "\n", "utf8");
  console.log(`Generated: ${outputPath}`);
}

main().catch((e) => {
  console.error(" Failed generating plugin JSON:", e);
  process.exit(1);
});
