import { chromium } from 'playwright';

(async () => {
  const url = 'http://localhost:3000/viewer/object/komik1-kubus?comicId=1';
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => {
    try {
      logs.push({ type: msg.type(), text: msg.text() });
    } catch (e) {
      logs.push({ type: 'error', text: String(msg) });
    }
  });

  console.log('Opening', url);

  // retry navigation a few times if the dev server is still starting
  let lastErr = null;
  for (let i = 0; i < 30; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      process.stdout.write('.');
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  if (lastErr) {
    console.error('\nFailed to open page:', lastErr);
    await browser.close();
    process.exit(2);
  }

  // wait a bit for client scripts to run
  await page.waitForTimeout(1200);

  // capture the Deskripsi label and the following <p>
  const label = await page.locator('text=Deskripsi').first();
  let renderedHtml = null;
  let renderedText = null;
  try {
    const handle = await label.evaluateHandle(el => el.nextElementSibling);
    if (handle) {
      renderedHtml = await handle.evaluate(el => el ? el.outerHTML : null);
      renderedText = await handle.evaluate(el => el ? el.textContent : null);
    }
  } catch (e) {
    // ignore
  }

  console.log('\n--- Browser console messages (captured) ---');
  for (const l of logs) {
    console.log(l.type + ':', l.text);
  }

  console.log('\n--- Rendered description element outerHTML ---');
  console.log(renderedHtml || 'NOT FOUND');

  console.log('\n--- Rendered description element textContent ---');
  console.log(renderedText || 'NOT FOUND');

  // Also print any <p> elements that contain 'kubus' to be extra sure
  const paras = await page.$$eval('p', ps => ps.map(p => ({outerHTML: p.outerHTML, text: p.textContent})).filter(x => x.text && x.text.toLowerCase().includes('kubus')));
  console.log('\n--- <p> elements containing "kubus" ---');
  console.log(JSON.stringify(paras, null, 2));

  await browser.close();
  process.exit(0);
})();
