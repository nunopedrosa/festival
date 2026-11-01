const fs=require('fs'),path=require('path'),esbuild=require('esbuild');
const source=JSON.parse(fs.readFileSync('node_modules/date-holidays/data/holidays.json'));
const flagCountries=require('flag-icons/country.json');
const codes=Array.from(new Set(flagCountries.filter(c=>c.iso).map(c=>c.code.toUpperCase()).concat(Object.keys(source.holidays)))).sort();
const iso=require('i18n-iso-countries');
iso.registerLocale(require('i18n-iso-countries/langs/en.json'));iso.registerLocale(require('i18n-iso-countries/langs/pt.json'));
const countryNames={};codes.forEach(code=>{const f=flagCountries.find(c=>c.code.toUpperCase()===code);countryNames[code]=[iso.getName(code,'pt')||(f&&f.name)||code,iso.getName(code,'en')||(f&&f.name)||code];});
countryNames.XK=['Kosovo','Kosovo'];countryNames.IC=['Ilhas Canárias · território','Canary Islands · territory'];
fs.writeFileSync('vendor/country-names.js','/* Generated from i18n-iso-countries and flag-icons; MIT. */\nwindow.FestivalCountryNames='+JSON.stringify(countryNames)+';\n');
fs.copyFileSync('node_modules/i18n-iso-countries/LICENSE','vendor/country-names-LICENSE.txt');
const data={version:source.version,license:source.license,holidays:{},names:source.names};
function add(code){if(data.holidays[code])return;let v=source.holidays[code];if(!v)throw Error('Missing '+code);data.holidays[code]=v;JSON.stringify(v, function(k,value){if(k==='_days'){const ref=Array.isArray(value)?value[0]:String(value).split('.')[0];if(source.holidays[ref])add(ref);}return value;});}
Object.keys(source.holidays).forEach(add);
// Versioned amendments are source-controlled and retain their legal context.
const pt=data.holidays.PT;
pt.days['easter -47'].type='optional';
pt.days['1st sunday in May'].name={pt:'Dia da Mãe',en:"Mother’s Day"};
pt.days['10-05'].name.en='Republic Day';pt.days['12-01'].name.en='Restoration of Independence';
['easter 60','10-05','11-01','12-01'].forEach(rule=>{pt.days[rule].disable=[2013,2014,2015].map(y=>rule==='easter 60'?({2013:'2013-05-30',2014:'2014-06-19',2015:'2015-06-04'})[y]:y+'-'+rule);});
pt.states={
 '20':{name:'Açores',days:{'easter 50':{name:{pt:'Dia dos Açores',en:'Azores Day'},type:'public'}}},
 '30':{name:'Madeira',days:{'07-01':{name:{pt:'Dia da Região Autónoma da Madeira',en:'Madeira Day'},type:'public'},'12-26':{name:{pt:'Primeira Oitava do Natal',en:'Christmas celebrations — Madeira'},type:'public'},'04-02 since 2025':{name:{pt:'Dia da Autonomia',en:'Autonomy Day'},type:'public'}}},
 LIS:{name:'Lisboa',days:{'06-13':{name:{pt:'Santo António — feriado municipal',en:'Saint Anthony — municipal holiday'},type:'optional'}}},
 POR:{name:'Porto',days:{'06-24':{name:{pt:'São João — feriado municipal',en:'Saint John — municipal holiday'},type:'optional'}}}
};
fs.writeFileSync('vendor/world-data.js','/* date-holidays Worldwide rule catalogue; CC BY-SA 3.0. See vendor/ATTRIBUTION.md. */\nwindow.FestivalData='+JSON.stringify(data)+';\n');
fs.writeFileSync('vendor/countries.json',JSON.stringify(codes));
const built=esbuild.buildSync({metafile:true,entryPoints:['scripts/parser-entry.js'],bundle:true,minify:true,target:['safari12'],supported:{destructuring:true},format:'iife',outfile:'vendor/holiday-parser.js',legalComments:'eof'});
const packages=new Set();
Object.keys(built.metafile.inputs).filter(p=>p.startsWith('node_modules/')).forEach(p=>{const parts=p.split('/');packages.add(parts[1].startsWith('@')?parts.slice(1,3).join('/'):parts[1]);});
let licenses='Third-party runtime dependency licenses\n';
for(const pkg of packages){const dir=path.join('node_modules',pkg);for(const file of fs.readdirSync(dir).filter(f=>/^licen[sc]e/i.test(f))){if(fs.statSync(path.join(dir,file)).isFile())licenses+='\n\n## '+pkg+' / '+file+'\n'+fs.readFileSync(path.join(dir,file),'utf8');}}
fs.writeFileSync('vendor/THIRD_PARTY_LICENSES.txt',licenses);
fs.copyFileSync('node_modules/date-holidays/LICENSE','vendor/date-holidays-LICENSE.txt');
fs.copyFileSync('node_modules/date-holidays-parser/LICENSE','vendor/parser-LICENSE.txt');
fs.mkdirSync('vendor/sources',{recursive:true});Object.keys(data.holidays).forEach(c=>fs.copyFileSync('node_modules/date-holidays/data/countries/'+c+'.yaml','vendor/sources/'+c+'.yaml'));
// Embed geometry directly: no external SVG <use> references at runtime.
const icons={};
const sprite=fs.readFileSync('assets/icons.svg','utf8');
for(const match of sprite.matchAll(/<symbol id="([^"]+)"[^>]*>([\s\S]*?)<\/symbol>/g))icons[match[1]]=match[2];
fs.writeFileSync('icons.js','/* Generated from assets/icons.svg. MIT. */\nwindow.FestivalIcons='+JSON.stringify(icons)+';\n');
let html=fs.readFileSync('index.html','utf8');
html=html.replace(/<svg data-icon="([^"]+)"[^>]*>[\s\S]*?<\/svg>/g,(_,id)=>'<svg data-icon="'+id+'" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+icons[id]+'</svg>');
fs.writeFileSync('index.html',html);
// Country flags are local, licensed SVG images and are included in the offline release.
fs.mkdirSync('assets/flags',{recursive:true});
const flagFiles=codes.map(code=>{const file='assets/flags/'+code.toLowerCase()+'.svg';fs.copyFileSync('node_modules/flag-icons/flags/4x3/'+code.toLowerCase()+'.svg',file);return './'+file;});
fs.copyFileSync('node_modules/flag-icons/LICENSE','vendor/flag-icons-LICENSE.txt');
// Build a complete offline manifest from runtime files only.
const files=['./shared-chevron.svg','./shared-controls.css','./shared-icons.svg','./','./index.html','./styles.css','./app.js','./icons.js','./engine.js','./i18n.js','./manifest.webmanifest','./version.json','./vendor/holiday-parser.js','./vendor/world-data.js','./vendor/country-names.js','./vendor/supplement-data.js','./vendor/python-holidays-LICENSE.txt','./vendor/python-holidays-sources.json','./vendor/country-names-LICENSE.txt','./vendor/ATTRIBUTION.md','./assets/icons.svg','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./assets/apple-touch-icon.png','./assets/pt.svg','./assets/gb.svg','./docs/DATA_SOURCES.md','./vendor/THIRD_PARTY_LICENSES.txt','./vendor/date-holidays-LICENSE.txt','./vendor/parser-LICENSE.txt','./vendor/flag-icons-LICENSE.txt'].concat(flagFiles);
fs.writeFileSync('precache.js','self.FESTIVAL_ASSETS='+JSON.stringify(files)+';\n');
fs.writeFileSync('deploy-files.txt',Array.from(new Set(files.filter(f=>f!=='./').map(f=>f.slice(2)).concat(['sw.js','precache.js','LICENSE']))).sort().join('\n')+'\n');
fs.mkdirSync('dist',{recursive:true});
for(const f of files){if(f==='./')continue;const src=f.slice(2);const dest=path.join('dist',src);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(src,dest);}
for(const f of ['sw.js','precache.js','LICENSE'])fs.copyFileSync(f,path.join('dist',f));
console.log('Worldwide picker:',codes.length,'entries; data version',data.version);
