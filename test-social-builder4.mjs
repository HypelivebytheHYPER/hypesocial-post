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

const styles = await page.evaluate(() => {
  const artboard = document.getElementById('social-artboard');
  if (!artboard) return { error: 'no artboard' };
  
  // Find the button layer by looking for a button element inside the artboard
  const btn = artboard.querySelector('button');
  const price = Array.from(artboard.querySelectorAll('div')).find(el => el.innerText === '$49.00');
  
  return {
    artboardHeight: artboard.clientHeight,
    buttonBg: btn ? getComputedStyle(btn).backgroundColor : null,
    buttonDisplay: btn ? getComputedStyle(btn).display : null,
    buttonRect: btn ? btn.getBoundingClientRect() : null,
    priceColor: price ? getComputedStyle(price).color : null,
    priceRect: price ? price.getBoundingClientRect() : null,
  };
});

console.log(styles);

await browser.close();
