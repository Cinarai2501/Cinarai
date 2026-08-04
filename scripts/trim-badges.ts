/* eslint-disable no-console */
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const rawDir = path.resolve(process.cwd(), "assets/raw-badges");
const trimmedDir = path.resolve(process.cwd(), "assets/trimmed-badges");
const canvasSize = 384;
const minOccupancy = 0.9;
const maxOccupancy = 0.95;

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

function formatSize(value: number): string {
  return `${value.toLocaleString()} px`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function reductionPercentage(beforeWidth: number, beforeHeight: number, afterWidth: number, afterHeight: number) {
  if (!beforeWidth || !beforeHeight) return 0;
  const beforeArea = beforeWidth * beforeHeight;
  const afterArea = afterWidth * afterHeight;

  if (afterArea >= beforeArea) return 0;

  return Math.round(((beforeArea - afterArea) / beforeArea) * 100);
}

async function normalizeBadge(file: string, outputPath: string) {
  const image = sharp(file, { limitInputPixels: false });
  const metadata = await image.metadata();

  const originalWidth = metadata.width ?? 0;
  const originalHeight = metadata.height ?? 0;

  const trimmed = await image.trim().toBuffer({ resolveWithObject: true });
  const trimmedWidth = trimmed.info.width;
  const trimmedHeight = trimmed.info.height;

  const trimmedArea = trimmedWidth * trimmedHeight;
  const canvasArea = canvasSize * canvasSize;
  const idealOccupancy = 0.925;
  const targetArea = canvasArea * idealOccupancy;

  const scaleByArea = Math.sqrt(targetArea / trimmedArea);
  const maxScale = Math.min(canvasSize / trimmedWidth, canvasSize / trimmedHeight);
  const scale = Math.min(scaleByArea, maxScale);

  const finalWidth = Math.max(1, Math.round(trimmedWidth * scale));
  const finalHeight = Math.max(1, Math.round(trimmedHeight * scale));

  const occupancy = (finalWidth * finalHeight) / canvasArea;
  const status = occupancy >= minOccupancy && occupancy <= maxOccupancy ? "PASS" : "WARNING";

  const resized = await sharp(trimmed.data, { limitInputPixels: false })
    .resize(finalWidth, finalHeight, { fit: "fill" })
    .png({ force: true })
    .toBuffer();

  const left = Math.round((canvasSize - finalWidth) / 2);
  const top = Math.round((canvasSize - finalHeight) / 2);

  const canvas = await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, left, top }])
    .png({ force: true })
    .toBuffer();

  await fs.writeFile(outputPath, canvas);

  return {
    originalWidth,
    originalHeight,
    trimmedWidth,
    trimmedHeight,
    canvasSize,
    occupancy,
    status,
  };
}

async function trimBadges() {
  const files = await collectPngs(rawDir);

  if (files.length === 0) {
    console.log("No PNG files found in assets/raw-badges.");
    return;
  }

  await ensureDir(trimmedDir);

  for (const file of files) {
    const relativeFile = path.relative(rawDir, file);
    const outputPath = path.join(trimmedDir, relativeFile);
    await ensureDir(path.dirname(outputPath));

    const result = await normalizeBadge(file, outputPath);

    console.log(`✔ ${relativeFile}`);
    console.log(`Original Size : ${formatSize(result.originalWidth)} x ${formatSize(result.originalHeight)}`);
    console.log(`Trimmed Size : ${formatSize(result.trimmedWidth)} x ${formatSize(result.trimmedHeight)}`);
    console.log(`Final Canvas Size : ${formatSize(result.canvasSize)} x ${formatSize(result.canvasSize)}`);
    console.log(`Occupancy : ${formatPercent(result.occupancy * 100)}`);
    console.log(`Status : ${result.status}`);
    console.log(`Saved : ${outputPath}`);
    console.log("");
  }
}

trimBadges().catch((error) => {
  console.error("Error trimming badges:", error);
  process.exit(1);
});
