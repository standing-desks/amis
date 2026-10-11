const {chromium}=require('playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const dir=path.resolve(__dirname,'../docs');const artifacts=path.resolve(__dirname,'../test-results');fs.mkdirSync(artifacts,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1480,height:1100},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+dir+'/index.html');await page.waitForFunction(()=>window.agentMemoryDemo&&document.querySelector('.packet'));
 assert.equal(await page.evaluate(()=>window.agentMemoryDemo.getDocument().format),'amis.bundle');
 assert.equal(await page.evaluate(()=>window.agentMemoryDemo.getDocument().version),'0.4.0');
 assert.equal(await page.evaluate(()=>window.agentMemoryDemo.getNativeOutput().kind),'context');
 await page.screenshot({path:artifacts+'/amis-0.4-overview.png'});
 await page.locator('#playground').screenshot({path:artifacts+'/amis-0.4-pipeline.png'});
 await page.locator('[data-field="scope"].field-chip').click();assert.match(await page.locator('.field-inspector').innerText(),/independent of storage/);
 await page.locator('#route').selectOption('native');assert.equal(await page.evaluate(()=>window.agentMemoryDemo.getNativeOutput().kind),'blocked');
 await page.locator('#route').selectOption('context');
 await page.locator('#transform').click();await page.waitForFunction(()=>!document.getElementById('transform').disabled);
 for(const view of ['mapping','roundtrip','flow']){await page.locator('[data-view="'+view+'"]').click()}
 await page.locator('[data-view="mapping"]').click();assert.equal(await page.locator('.mapping-table tbody tr').first().locator('td').count(),4);assert.equal(await page.locator('#lab-view tbody tr').count(),11);
 await page.locator('#playground').screenshot({path:artifacts+'/amis-0.4-field-map.png'});
 await page.locator('[data-view="roundtrip"]').click();
 for(const [mode,value] of [['same','0'],['edited','+1'],['conflict','2'],['lost','?'],['withdrawn','×']]){await page.locator('[data-round="'+mode+'"]').click();assert.equal(await page.locator('.round-result .big').innerText(),value)}
 await page.locator('#playground').screenshot({path:artifacts+'/amis-0.4-round-trip.png'});
 const docs=[];let routeChecks=0;
 for(const source of ['claude','codex']){
  if(source==='codex')await page.locator('#reverse').click();
  for(const example of ['feedback','lesson','global','unknown']){
   await page.locator('#example').selectOption(example);
   await page.waitForFunction(({source,example})=>{const s=window.agentMemoryDemo.getState(),r=window.agentMemoryDemo.getDocument().records[0];return s.source===source&&s.example===example&&r.sources[0].provider===(source==='claude'?'claude_code':'codex')&&r.id===({feedback:'805b3b19-1266-4254-a5cc-2c4eb30428ec',lesson:'f5c8d1bb-7ae1-4e47-9071-758907ac73c1',global:'2cbe4e5b-f7c9-4e8a-a595-bbcaa84f94d9',unknown:'915f3c25-f859-45b5-8e1f-d917187542ab'})[example]}, {source,example});
   const d=await page.evaluate(()=>window.agentMemoryDemo.getDocument());docs.push(d);
   assert.equal(d.records[0].review,undefined);assert.ok(await page.evaluate(async()=>{const d=window.agentMemoryDemo.getDocument();return await window.agentMemoryDemo.integrityOK(d)&&await window.agentMemoryDemo.integrityOK(d.records[0])}));
   await page.locator('[data-view="flow"]').click();
   for(const route of ['native','context']){
    await page.locator('#route').selectOption(route);const out=await page.evaluate(()=>window.agentMemoryDemo.getNativeOutput());
    const blocked=example==='unknown'||(route==='native'&&((source==='claude'&&example!=='global')||(source==='codex'&&['global','lesson'].includes(example))));
    assert.equal(out.kind,blocked?'blocked':route,source+' '+example+' '+route);routeChecks++;
    if(!blocked)assert.ok(out.text.includes(d.records[0].body.text));
   }
  }
 }
 fs.writeFileSync(path.join(artifacts,'browser-bundles.json'),JSON.stringify(docs,null,2));assert.deepEqual(docs,JSON.parse(fs.readFileSync(path.resolve(__dirname,'fixtures/browser-bundles.json'),'utf8')),'canonical fixtures drifted');
 await page.locator('#reset').click();await page.waitForFunction(()=>window.agentMemoryDemo.getDocument().records[0].id==='805b3b19-1266-4254-a5cc-2c4eb30428ec');
 for(const field of ['identity','meaning','scope','provenance']){await page.locator('[data-passport="'+field+'"]').click();JSON.parse(await page.locator('#passport-code').innerText())}
 await page.locator('#show-full').click();assert.equal(JSON.parse(await page.locator('#passport-code').innerText()).format,'amis.bundle');
 for(const op of ['describe','scan','normalize','plan','apply','verify']){await page.locator('[data-op="'+op+'"]').click();assert.equal(JSON.parse(await page.locator('#op-code').innerText()).operation,op)}
 for(const design of ['library','packs','sync']){await page.locator('[data-design="'+design+'"]').click();assert.equal(await page.locator('.mini-app tbody tr').count(),3);await page.locator('#designs').screenshot({path:artifacts+'/amis-0.4-'+design+'.png'})}
 for(const profile of ['core','links','publication','sync']){await page.locator('[data-profile="'+profile+'"]').click();assert.ok((await page.locator('#profile-preview').innerText()).includes('amis.bundle'));}
 await page.locator('[data-profile="core"]').click();await page.locator('#architecture').screenshot({path:artifacts+'/amis-0.4-architecture.png'});
 for(const stress of ['fork','tamper','feature','expiry','crash','race']){await page.locator('[data-stress="'+stress+'"]').click();if(stress==='tamper')await page.waitForFunction(()=>document.querySelector('#stress-result').innerText.includes('MISMATCH'));assert.ok((await page.locator('#stress-result').innerText()).length>80);}
 await page.locator('[data-stress="fork"]').click();await page.locator('#resilience').screenshot({path:artifacts+'/amis-0.4-resilience.png'});
 await page.locator('#theme').click();await page.locator('#playground').screenshot({path:artifacts+'/amis-0.4-dark.png'});await page.locator('#theme').click();
 for(const width of [1024,768,390]){
  await page.setViewportSize({width,height:950});
  for(const view of ['flow','mapping','roundtrip']){await page.locator('[data-view="'+view+'"]').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,width+' '+view);assert.equal(await page.locator('.lab').evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'lab overflow')}
 }
 await page.locator('[data-view="flow"]').click();await page.locator('#playground').screenshot({path:artifacts+'/amis-0.4-mobile.png'});
 for(const file of ['index.html','spec.html']){
  await page.goto('file://'+dir+'/'+file);
  const links=await page.locator('a[href]').evaluateAll(a=>a.map(x=>x.getAttribute('href')));
  for(const link of links){if(link.startsWith('#'))assert.ok(await page.locator(link).count());else if(!link.startsWith('http'))assert.ok(fs.existsSync(path.resolve(dir,link.split('#')[0])),link)}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'document overflow '+file);

 }
 assert.deepEqual(errors,[]);await browser.close();console.log(JSON.stringify({result:'PASS',browser_errors:errors,fixture_documents:docs.length,route_outcomes:routeChecks,designs:3,roundtrip_states:5,profiles:4,failure_cases:6,responsive_widths:[1480,1024,768,390],screenshots:11},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
