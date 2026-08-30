import { promises as fs } from 'fs';
import path from 'path';
import { createCanvas } from '@napi-rs/canvas';
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
    const data = new Uint8Array(await fs.readFile(pdfPath));
    const pdf = await getDocument({ data, disableFontFace: true, verbosity: 0 }).promise;
    const pdfPage = await pdf.getPage(page);
    const viewport = pdfPage.getViewport({ scale: 2 });
    const canvasFactory = {
      create(width, height) {
        const canvas = createCanvas(width, height);
        return { canvas, context: canvas.getContext('2d') };
      },
      reset(canvasAndContext, width, height) {
        canvasAndContext.canvas.width = width;
        canvasAndContext.canvas.height = height;
      },
      destroy(canvasAndContext) {
        canvasAndContext.canvas.width = 0;
        canvasAndContext.canvas.height = 0;
        canvasAndContext.canvas = null;
        canvasAndContext.context = null;
      },
    };
    const { canvas, context } = canvasFactory.create(viewport.width, viewport.height);

    await pdfPage.render({ canvasContext: context, viewport, canvasFactory }).promise;
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
