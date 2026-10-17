const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const docs = path.resolve(__dirname, '../docs');
const artifacts = path.resolve(__dirname, '../test-results');
fs.mkdirSync(artifacts, {recursive:true});
(async () => {
 const browser = await chromium.launch({headless:true});
 try {
  const page = await browser.newPage({viewport:{width:1480,height:1100}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(path.join(docs,'index.html')).href);
  await page.waitForFunction(() => document.querySelector('#passport-code').textContent);
  const example = JSON.parse(await page.locator('#canonical-example').textContent());
  assert.deepEqual(example, JSON.parse(fs.readFileSync(path.join(docs,'../examples/project-feedback.amis.json'))));
  for (const group of ['identity','meaning','scope','provenance']) {
   await page.locator('[data-passport="'+group+'"]').click();
   JSON.parse(await page.locator('#passport-code').innerText());
  }
  await page.locator('#show-full').click();
  assert.deepEqual(JSON.parse(await page.locator('#passport-code').innerText()),example);
  await page.locator('#show-full').click();
  for (const profile of ['core','links','publication','sync']) {
   await page.locator('[data-profile="'+profile+'"]').click();
   assert.match(await page.locator('#profile-preview').innerText(),/amis.bundle/);
  }
  for (const name of ['fork','tamper','feature','withdrawal']) {
   await page.locator('[data-stress="'+name+'"]').click();
   if (name === 'tamper') assert.match(await page.locator('#stress-result').innerText(),/Changing the scope/);
   assert.ok((await page.locator('#stress-result').innerText()).length > 80);
  }
  await page.screenshot({path:path.join(artifacts,'spec-guide.png')});
  await page.locator('#theme').click();
  await page.screenshot({path:path.join(artifacts,'spec-guide-dark.png')});
  await page.locator('#theme').click();
  for (const width of [1024,768,390]) {
   await page.setViewportSize({width,height:950});
   assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth+1),false,'guide overflow at '+width);
  }
  await page.screenshot({path:path.join(artifacts,'spec-guide-mobile.png')});
  for (const file of ['index.html','spec.html','brand.html']) {
   await page.goto(pathToFileURL(path.join(docs,file)).href);
   await page.waitForFunction(() => Array.from(document.images).every(image => image.complete && image.naturalWidth > 0));
   for (const link of await page.locator('a[href]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))) {
    if (link.startsWith('#')) assert.ok(await page.locator(link).count(),link);
    else if (!link.startsWith('http')) assert.ok(fs.existsSync(path.resolve(docs,link.split('#')[0])),link);
   }
   assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth+1),false,file);
  }
  assert.deepEqual(errors,[]);
  const report={result:'PASS',scope:'Documentation presentation only; no AMIS semantic validation',field_groups:4,profiles:4,explanatory_examples:4,responsive_widths:[1480,1024,768,390],browser_errors:errors};
  fs.writeFileSync(path.join(artifacts,'browser-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
