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

await screenshot('01-initial');

// Load Product Promo template
const promoBtn = await page.evaluateHandle(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  return buttons.find(b => b.innerText.includes('Product Promo')) || null;
});
if (promoBtn.asElement()) {
  await (await promoBtn.asElement()).click();
  await new Promise(r => setTimeout(r, 1000));
  await screenshot('02-product-promo');
}
await promoBtn.dispose();

// Click Theme panel
const themeBtn = await page.evaluateHandle(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  return buttons.find(b => b.innerText.includes('Theme')) || null;
});
if (themeBtn.asElement()) {
  await (await themeBtn.asElement()).click();
  await new Promise(r => setTimeout(r, 800));
  await screenshot('03-theme-panel');
}
await themeBtn.dispose();

// Change format to Story
const formatTrigger = await page.$('[role="combobox"]');
if (formatTrigger) {
  await formatTrigger.click();
  await new Promise(r => setTimeout(r, 500));
  const storyOption = await page.evaluateHandle(() => {
    const items = Array.from(document.querySelectorAll('[role="option"]'));
    return items.find(el => el.innerText.includes('Story')) || null;
  });
  if (storyOption.asElement()) {
    await (await storyOption.asElement()).click();
    await new Promise(r => setTimeout(r, 800));
    await screenshot('04-story-format');
  }
  await storyOption.dispose();
}

// Click on a text layer to select it
const textLayer = await page.evaluateHandle(() => {
  const spans = Array.from(document.querySelectorAll('span'));
  return spans.find(el => el.innerText.includes('New Collection'))?.parentElement?.parentElement || null;
});
if (textLayer.asElement()) {
  await (await textLayer.asElement()).click();
  await new Promise(r => setTimeout(r, 500));
  await screenshot('05-layer-selected');
}
await textLayer.dispose();

console.log('Done');
await browser.close();
