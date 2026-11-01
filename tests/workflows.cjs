const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8').replace(/<script[^>]*src=[^>]+><\/script>/g,'');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const dom=new JSDOM(html,{url:'https://festival.test/',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window,d=w.document;
 w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};
 for(const f of ['icons.js','i18n.js','vendor/holiday-parser.js','vendor/world-data.js','vendor/country-names.js','vendor/supplement-data.js','engine.js','app.js'])w.eval(fs.readFileSync(f,'utf8'));
 const click=id=>d.getElementById(id).click();await delay(40);
 // Holiday glyphs contain their own geometry; a missing external sprite cannot hide them.
 for(const button of d.querySelectorAll('.holiday-cell button')){assert.ok(button.querySelector('svg path,svg circle,svg ellipse'));assert.equal(button.querySelector('use'),null);}
 assert.deepEqual(Array.from(d.querySelectorAll('thead th')).slice(1).map(th=>th.textContent),['PT','ES','FR','DE','GB']);
 assert.equal(d.querySelector('thead th[aria-label="Portugal"]').textContent,'PT');
 assert.equal(d.querySelectorAll('col')[1].style.width,'44px');
 click('language');d.querySelector('[data-lang="pt"]').click();await delay(40);assert.equal(d.documentElement.lang,'pt-PT');
 const select=(id,v)=>{d.getElementById(id).value=v;d.getElementById(id).dispatchEvent(new w.Event('change',{bubbles:true}));};
 select('month','12');await delay(40);click('mode-all');await delay(40);assert.equal(d.querySelectorAll('tbody tr[data-date]').length,31);
 click('countries');select('region-0','LIS');click('apply-countries');await delay(40);assert.equal(JSON.parse(w.localStorage.getItem('festival.preferences.v1')).preferences.countries[0].region,'LIS');
 const before=w.localStorage.getItem('festival.preferences.v1');click('countries');select('region-0','POR');click('cancel-countries');assert.equal(w.localStorage.getItem('festival.preferences.v1'),before);
 click('settings');click('export-backup');const exported=JSON.parse(w.localStorage.getItem('festival.preferences.v1'));assert.ok(exported.backup.time);assert.ok(exported.preferences.lang==='pt');
 const candidate={...exported.preferences,lang:'en',year:2027,month:0};
 async function importData(data){click('settings');const input=d.getElementById('backup-file'),file=new w.File([JSON.stringify(data)],'test.json',{type:'application/json'});Object.defineProperty(input,'files',{value:[file],configurable:true});input.dispatchEvent(new w.Event('change',{bubbles:true}));await delay(30);}
 const backup={application:'festival',schemaVersion:1,preferences:candidate};
 await importData(backup);assert.equal(d.getElementById('restore-preferences').checked,true);d.getElementById('restore-preferences').checked=false;click('confirm-import');assert.equal(JSON.parse(w.localStorage.getItem('festival.preferences.v1')).preferences.year,2026);
 await importData(backup);click('cancel-import');assert.equal(JSON.parse(w.localStorage.getItem('festival.preferences.v1')).preferences.year,2026);
 await importData(backup);click('confirm-import');await delay(40);assert.equal(JSON.parse(w.localStorage.getItem('festival.preferences.v1')).preferences.year,2027);assert.equal(d.documentElement.lang,'en');
 const intact=w.localStorage.getItem('festival.preferences.v1');await importData({...backup,schemaVersion:999});assert.equal(w.localStorage.getItem('festival.preferences.v1'),intact);assert.equal(d.getElementById('error').hidden,false);
 // Quota failure during restore must preserve both in-memory and stored preferences.
 await importData({...backup,preferences:{...candidate,year:2028}});const originalSet=w.Storage.prototype.setItem;w.Storage.prototype.setItem=function(){throw new Error('quota');};click('confirm-import');assert.equal(w.localStorage.getItem('festival.preferences.v1'),intact);assert.equal(d.getElementById('overlay').hidden,false);w.Storage.prototype.setItem=originalSet;click('cancel-import');click('dialog-close');click('settings');click('export-backup');assert.equal(JSON.parse(w.localStorage.getItem('festival.preferences.v1')).preferences.year,2027);
 // A stale tab must not silently overwrite another window's preference revision.
 const changed=JSON.parse(w.localStorage.getItem('festival.preferences.v1'));changed.revision='external';w.localStorage.setItem('festival.preferences.v1',JSON.stringify(changed));click('dialog-close');click('mode-holidays');assert.equal(JSON.parse(w.localStorage.getItem('festival.preferences.v1')).revision,'external');assert.match(d.getElementById('error').textContent,/another window/);
 console.log('PASS: preferences, country-edit cancellation, exported metadata, backup restore checked/unchecked/cancel, invalid schema, quota rollback and stale-window protection (DOM simulation).');dom.window.close();
})().catch(e=>{console.error(e.message,e.stack.split('\n').slice(1,5).join('\n'));process.exitCode=1;});
