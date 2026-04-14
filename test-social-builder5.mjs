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

// Open Theme panel
const themeBtn = await page.evaluateHandle(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  return buttons.find(b => b.innerText.includes('Theme')) || null;
});
if (themeBtn.asElement()) {
  await (await themeBtn.asElement()).click();
  await new Promise(r => setTimeout(r, 800));
}
await themeBtn.dispose();

// Click the dark color swatch (#171717)
const darkBtn = await page.evaluateHandle(() => {
  const buttons = Array.from(document.querySelectorAll('button[aria-label^="Set primary color"]'));
  return buttons[7] || null;
});
if (darkBtn.asElement()) {
  await (await darkBtn.asElement()).click();
  await new Promise(r => setTimeout(r, 500));
}
await darkBtn.dispose();

// Change canvas background to dark
const bgInput = await page.evaluateHandle(() => {
  const inputs = Array.from(document.querySelectorAll('input[type="color"]'));
  return inputs[0] || null;
});
if (bgInput.asElement()) {
  await bgInput.asElement().evaluate(el => { el.value = '#1e293b'; });
  await bgInput.asElement().evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true })));
  await new Promise(r => setTimeout(r, 500));
}
await bgInput.dispose();

await page.screenshot({ path: '/Users/mdch/hypelive/products/hype-social/social-builder-test/07-dark-bg.png', fullPage: false });
console.log('Done');
await browser.close();
