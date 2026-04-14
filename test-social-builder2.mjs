import puppeteer from 'puppeteer';
import fs from 'fs';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:3000/builder', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 2000));

const outDir = '/Users/mdch/hypelive/products/hype-social/social-builder-test';
fs.mkdirSync(outDir, { recursive: true });

async function screenshot(name) {
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: false });
  console.log('Screenshot:', name);
}

// Click the first "Load Template" button (Product Promo)
const loadButtons = await page.$$('button');
const productPromoBtn = loadButtons.find(async b => {
  const text = await b.evaluate(el => el.innerText);
  return text === 'Load Template';
});

// Actually let's just click by index since there are 4 Load Template buttons
for (let i = 0; i < loadButtons.length; i++) {
  const text = await loadButtons[i].evaluate(el => el.innerText);
  if (text === 'Load Template') {
    await loadButtons[i].click();
    await new Promise(r => setTimeout(r, 1000));
    await screenshot('02-product-promo-loaded');
    break;
  }
}

console.log('Done');
await browser.close();
