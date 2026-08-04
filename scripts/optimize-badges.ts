/* eslint-disable no-console */
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const sourceDir = path.resolve(process.cwd(), "assets/trimmed-badges");
const outputDir = path.resolve(process.cwd(), "assets/optimized-badges");

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

function formatBytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

async function optimizeBadges() {
  const files = await collectPngs(sourceDir);

  if (files.length === 0) {
    console.log("No PNG files found in assets/trimmed-badges.");
    return;
  }

  await ensureDir(outputDir);

  for (const file of files) {
    const relativeFile = path.relative(sourceDir, file);
    const outputPath = path.join(outputDir, relativeFile);
    await ensureDir(path.dirname(outputPath));

    const beforeBuffer = await fs.readFile(file);
    const optimizedBuffer = await sharp(beforeBuffer, { limitInputPixels: false })
      .png({ compressionLevel: 9, adaptiveFiltering: true, force: true })
      .toBuffer();

    await fs.writeFile(outputPath, optimizedBuffer);

    const beforeSize = beforeBuffer.byteLength;
    const afterSize = optimizedBuffer.byteLength;
    const saved = beforeSize > 0 ? Math.round(((beforeSize - afterSize) / beforeSize) * 100) : 0;

    console.log(`✔ ${relativeFile}`);
    console.log(`Before : ${formatBytes(beforeSize)}`);
    console.log(`After : ${formatBytes(afterSize)}`);
    console.log(`Reduction : ${saved}%`);
    console.log(`Saved :`);
    console.log(outputPath);
    console.log("");
  }
}

optimizeBadges().catch((error) => {
  console.error("Error optimizing badges:", error);
  process.exit(1);
});
