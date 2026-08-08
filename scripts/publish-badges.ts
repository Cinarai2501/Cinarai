/* eslint-disable no-console */
import fs from "fs/promises";
import path from "path";

const optimizedDir = path.resolve(process.cwd(), "assets/optimized-badges");
const publicLevelsDir = path.resolve(process.cwd(), "public/assets/dashboard/home/levels");
const publicBadgesDir = path.resolve(process.cwd(), "public/assets/dashboard/home/badges");

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

function getDestinationPath(file: string) {
  const fileName = path.basename(file);
  const lower = fileName.toLowerCase();

  if (lower.startsWith("icon-level-")) {
    return path.join(publicLevelsDir, fileName);
  }

  if (lower.includes("badge-pembaca-")) {
    return path.join(publicBadgesDir, "pembaca", fileName);
  }

  if (lower.includes("badge-komik-")) {
    return path.join(publicBadgesDir, "komik", fileName);
  }

  return path.join(publicBadgesDir, fileName);
}

async function publishBadges() {
  await fs.rm(publicLevelsDir, { recursive: true, force: true });
  await fs.rm(publicBadgesDir, { recursive: true, force: true });
  await ensureDir(publicLevelsDir);
  await ensureDir(publicBadgesDir);

  const files = await collectPngs(optimizedDir);

  if (files.length === 0) {
    console.log("No PNG files found in assets/optimized-badges.");
    return;
  }

  for (const file of files) {
    const relativeFile = path.relative(optimizedDir, file);
    const destination = getDestinationPath(file);
    await ensureDir(path.dirname(destination));
    await fs.copyFile(file, destination);
    console.log(`✔ ${relativeFile} → ${path.relative(process.cwd(), destination)}`);
  }

  console.log(`\nPublished ${files.length} badge(s) to public/assets/dashboard/home.`);
}

publishBadges().catch((error) => {
  console.error("Error publishing badges:", error);
  process.exit(1);
});
