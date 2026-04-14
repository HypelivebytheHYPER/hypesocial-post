import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:3000/builder', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 2000));

// Click first Load Template button
const buttons = await page.$$('button');
for (const btn of buttons) {
  const text = await btn.evaluate(el => el.innerText);
  if (text === 'Load Template') {
    await btn.click();
    await new Promise(r => setTimeout(r, 1000));
    break;
  }
}

const texts = await page.evaluate(() => {
  const artboard = document.getElementById('social-artboard');
  if (!artboard) return { error: 'no artboard' };
  const allText = Array.from(artboard.querySelectorAll('*')).map(el => el.innerText).filter(Boolean);
  return {
    childCount: artboard.children.length,
    texts: allText.slice(0, 20),
  };
});

console.log(texts);

await page.screenshot({ path: '/Users/mdch/hypelive/products/hype-social/social-builder-test/06-dom-check.png', fullPage: false });
await browser.close();
