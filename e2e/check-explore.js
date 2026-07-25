const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();

  const base = process.env.BASE_URL || 'http://localhost:3000';
  const objects = [
    { id: 'komik1-kubus', name: 'Kubus' },
    { id: 'komik1-balok', name: 'Balok' },
    { id: 'komik1-prisma', name: 'Prisma Segi Empat' },
    { id: 'komik1-limas', name: 'Limas Segi Empat' },
    { id: 'komik1-kerucut', name: 'Kerucut' },
  ];

  const results = [];

  for (const obj of objects) {
    const url = `${base}/viewer/object/${encodeURIComponent(obj.id)}?comicId=1`;
    const logs = [];
    page.on('console', (msg) => logs.push({ type: msg.type(), text: msg.text() }));
    page.on('pageerror', (err) => logs.push({ type: 'error', text: String(err) }));

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const title = await page.textContent('h1.text-2xl');
    const desc = await page.textContent('p.mt-3');
    const hasModelButton = await page.$('button:has-text("Lihat Model 3D")') !== null;
    const hasQrButton = await page.$('button:has-text("Lihat QR")') !== null;
    const hasClose = await page.$('button:has-text("Tutup Viewer")') !== null;
    const aiTutorVisible = await page.$('text=AI Tutor') !== null || await page.$('[aria-label="Buka AI Tutor"]') !== null;

    const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    const bodyOverflow = await page.evaluate(() => {
      const el = document.querySelector('body');
      return getComputedStyle(el).overflowX;
    });

    const networkFailures = [];
    // no direct network failure list available after load; but we can check failed requests via route events

    const screenshotPath = `./test-screenshots/explore-${obj.id}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });

    results.push({ id: obj.id, name: obj.name, url, title, desc: desc && desc.trim().slice(0, 300), hasModelButton, hasQrButton, hasClose, aiTutorVisible, overflowX, bodyOverflow, logs, screenshot: screenshotPath, networkFailures });
  }

  await browser.close();
  fs.writeFileSync('./test-screenshots/explore-results.json', JSON.stringify(results, null, 2));
  console.log('Done. Results saved to ./test-screenshots/explore-results.json');
})();
