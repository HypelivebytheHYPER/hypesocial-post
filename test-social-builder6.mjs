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
    await new Promise(r => setTimeout(r, 1500));
    break;
  }
}

const info = await page.evaluate(() => {
  const artboard = document.getElementById('social-artboard');
  if (!artboard) return { error: 'no artboard' };
  const container = artboard.parentElement;
  return {
    artboardWidth: artboard.clientWidth,
    artboardHeight: artboard.clientHeight,
    containerWidth: container?.clientWidth,
    containerHeight: container?.clientHeight,
    texts: Array.from(artboard.querySelectorAll('*')).map(el => el.innerText).filter((t, i, a) => a.indexOf(t) === i).slice(0, 15),
  };
});

console.log(info);

await page.screenshot({ path: '/Users/mdch/hypelive/products/hype-social/social-builder-test/08-resize-fix.png', fullPage: false });
console.log('Done');
await browser.close();
