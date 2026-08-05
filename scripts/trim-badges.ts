/* eslint-disable no-console */
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const rawDir = path.resolve(process.cwd(), "assets/raw-badges");
const trimmedDir = path.resolve(process.cwd(), "assets/trimmed-badges");
const canvasSize = 384;
const alphaThreshold = 8;

type BoundingBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type NormalizationProfile = {
  name: string;
  targetOccupancy: number;
  minOccupancy: number;
  maxOccupancy: number;
};

const normalizationProfiles: Record<string, NormalizationProfile> = {
  level: {
    name: "LEVEL",
    targetOccupancy: 0.9,
    minOccupancy: 0.86,
    maxOccupancy: 0.94,
  },
  pembaca: {
    name: "PEMBACA",
    targetOccupancy: 0.925,
    minOccupancy: 0.9,
    maxOccupancy: 0.95,
  },
  komik: {
    name: "KOMIK",
    targetOccupancy: 0.95,
    minOccupancy: 0.92,
    maxOccupancy: 0.98,
  },
  default: {
    name: "DEFAULT",
    targetOccupancy: 0.925,
    minOccupancy: 0.9,
    maxOccupancy: 0.95,
  },
};

function getNormalizationProfile(filePath: string): NormalizationProfile {
  const normalizedPath = filePath.toLowerCase();
  if (normalizedPath.includes("icon-level-")) return normalizationProfiles.level;
  if (normalizedPath.includes("badge-pembaca-")) return normalizationProfiles.pembaca;
  if (normalizedPath.includes("badge-komik-")) return normalizationProfiles.komik;
  return normalizationProfiles.default;
}

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

async function computeVisualBoundingBox(buffer: Buffer): Promise<BoundingBox> {
  const { data, info } = await sharp(buffer, { limitInputPixels: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * channels + 3] ?? 0;

      if (alpha > alphaThreshold) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (minX === width || minY === height) {
    return {
      left: 0,
      top: 0,
      width: Math.max(1, width),
      height: Math.max(1, height),
    };
  }

  return {
    left: minX,
    top: minY,
    width: Math.max(1, maxX - minX + 1),
    height: Math.max(1, maxY - minY + 1),
  };
}

async function normalizeBadge(file: string, outputPath: string) {
  const image = sharp(file, { limitInputPixels: false });
  const metadata = await image.metadata();

  const originalWidth = metadata.width ?? 0;
  const originalHeight = metadata.height ?? 0;

  const trimmedResult = await image
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ force: true })
    .toBuffer({ resolveWithObject: true });

  const trimmedWidth = trimmedResult.info.width;
  const trimmedHeight = trimmedResult.info.height;
  const boundingBox = await computeVisualBoundingBox(trimmedResult.data);

  const profile = getNormalizationProfile(file);
  const targetArea = canvasSize * canvasSize * profile.targetOccupancy;

  const visualWidth = Math.max(1, boundingBox.width);
  const visualHeight = Math.max(1, boundingBox.height);
  const visualArea = visualWidth * visualHeight;

  const scaleByArea = Math.sqrt(targetArea / visualArea);
  const maxScale = Math.min(canvasSize / visualWidth, canvasSize / visualHeight);
  const scaleFactor = Math.min(scaleByArea, maxScale);

  const finalWidth = Math.max(1, Math.round(visualWidth * scaleFactor));
  const finalHeight = Math.max(1, Math.round(visualHeight * scaleFactor));

  const occupancy = (finalWidth * finalHeight) / (canvasSize * canvasSize);
  const status = occupancy >= profile.minOccupancy && occupancy <= profile.maxOccupancy ? "PASS" : "WARNING";

  const cropped = await sharp(trimmedResult.data, { limitInputPixels: false })
    .extract({
      left: boundingBox.left,
      top: boundingBox.top,
      width: visualWidth,
      height: visualHeight,
    })
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
    .composite([{ input: cropped, left, top }])
    .png({ force: true })
    .toBuffer();

  await fs.writeFile(outputPath, canvas);

  return {
    originalWidth,
    originalHeight,
    trimmedWidth,
    trimmedHeight,
    boundingBox,
    scaleFactor,
    finalWidth,
    finalHeight,
    canvasSize,
    occupancy,
    status,
    profile,
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
    console.log(`Profile : ${result.profile.name}`);
    console.log(`Original Size : ${formatSize(result.originalWidth)} x ${formatSize(result.originalHeight)}`);
    console.log(`Trimmed Size : ${formatSize(result.trimmedWidth)} x ${formatSize(result.trimmedHeight)}`);
    console.log(`Bounding Box : x=${result.boundingBox.left} y=${result.boundingBox.top} w=${result.boundingBox.width} h=${result.boundingBox.height}`);
    console.log(`Scale Factor : ${result.scaleFactor.toFixed(4)}`);
    console.log(`Final Object Size : ${formatSize(result.finalWidth)} x ${formatSize(result.finalHeight)}`);
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
