import { promises as fs } from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';

const publicDir = path.join(process.cwd(), 'public');
const generationRoot = path.join(publicDir, 'comics', 'generated');
const comics = [
  { slug: 'komik-1', pdfPath: path.join(publicDir, 'comics', 'komik-1', 'comic.pdf'), page: 1 },
  { slug: 'komik-2', pdfPath: path.join(publicDir, 'comics', 'komik-2', 'comic.pdf'), page: 7 },
  { slug: 'komik-3', pdfPath: path.join(publicDir, 'comics', 'komik-3', 'comic.pdf'), page: 1 },
];

const workerPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs');
GlobalWorkerOptions.workerSrc = workerPath;

async function ensureDirectory(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function exportPage({ slug, pdfPath, page }) {
  const outputDir = path.join(generationRoot, slug);
  await ensureDirectory(outputDir);
  const outputPath = path.join(outputDir, `page-${page}.png`);

  try {
    const data = await fs.readFile(pdfPath);
    const pdf = await getDocument({ data }).promise;
    const pdfPage = await pdf.getPage(page);
    const viewport = pdfPage.getViewport({ scale: 2 });
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    await pdfPage.render({ canvas, canvasContext: context, viewport }).promise;
    const buffer = canvas.toBuffer('image/png');
    const temporaryPath = `${outputPath}.tmp`;
    await fs.writeFile(temporaryPath, buffer);
    await fs.rename(temporaryPath, outputPath);
  } catch (error) {
    throw new Error(`Failed to export ${slug} page ${page}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main() {
  await ensureDirectory(generationRoot);
  await Promise.all(comics.map((entry) => exportPage(entry)));
}

void main();
