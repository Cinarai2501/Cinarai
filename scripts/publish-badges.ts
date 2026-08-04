/* eslint-disable no-console */
import fs from "fs/promises";
import path from "path";

const optimizedDir = path.resolve(process.cwd(), "assets/optimized-badges");
const publicDir = path.resolve(process.cwd(), "public/badges");

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function collectPngs(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectPngs(entryPath)));
      continue;
    }

    if (path.extname(entry.name).toLowerCase() === ".png") {
      files.push(entryPath);
    }
  }

  return files;
}

async function publishBadges() {
  await fs.rm(publicDir, { recursive: true, force: true });
  await ensureDir(publicDir);

  const files = await collectPngs(optimizedDir);

  if (files.length === 0) {
    console.log("No PNG files found in assets/optimized-badges.");
    return;
  }

  for (const file of files) {
    const relativeFile = path.relative(optimizedDir, file);
    const destination = path.join(publicDir, relativeFile);
    await ensureDir(path.dirname(destination));
    await fs.copyFile(file, destination);
    console.log(`✔ ${relativeFile} → public/badges/${relativeFile}`);
  }

  console.log(`\nPublished ${files.length} badge(s) to public/badges.`);
}

publishBadges().catch((error) => {
  console.error("Error publishing badges:", error);
  process.exit(1);
});
