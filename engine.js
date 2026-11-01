/* Festival civil-date engine. No network calls. */
(function(root){
'use strict';
var countryText={AD:['Andorra','Andorra'],AL:['Albânia','Albania'],AM:['Arménia','Armenia'],AT:['Áustria','Austria'],AZ:['Azerbaijão','Azerbaijan'],BA:['Bósnia e Herzegovina','Bosnia and Herzegovina'],BE:['Bélgica','Belgium'],BG:['Bulgária','Bulgaria'],BY:['Bielorrússia','Belarus'],CH:['Suíça','Switzerland'],CY:['Chipre','Cyprus'],CZ:['Chéquia','Czechia'],DE:['Alemanha','Germany'],DK:['Dinamarca','Denmark'],EE:['Estónia','Estonia'],ES:['Espanha','Spain'],FI:['Finlândia','Finland'],FR:['França','France'],GB:['Reino Unido','United Kingdom'],GE:['Geórgia','Georgia'],GR:['Grécia','Greece'],HR:['Croácia','Croatia'],HU:['Hungria','Hungary'],IE:['Irlanda','Ireland'],IS:['Islândia','Iceland'],IT:['Itália','Italy'],KZ:['Cazaquistão','Kazakhstan'],LI:['Listenstaine','Liechtenstein'],LT:['Lituânia','Lithuania'],LU:['Luxemburgo','Luxembourg'],LV:['Letónia','Latvia'],MC:['Mónaco','Monaco'],MD:['Moldávia','Moldova'],ME:['Montenegro','Montenegro'],MK:['Macedónia do Norte','North Macedonia'],MT:['Malta','Malta'],NL:['Países Baixos','Netherlands'],NO:['Noruega','Norway'],PL:['Polónia','Poland'],PT:['Portugal','Portugal'],RO:['Roménia','Romania'],RS:['Sérvia','Serbia'],RU:['Rússia','Russia'],SE:['Suécia','Sweden'],SI:['Eslovénia','Slovenia'],SK:['Eslováquia','Slovakia'],SM:['São Marinho','San Marino'],TR:['Turquia','Türkiye'],UA:['Ucrânia','Ukraine'],VA:['Vaticano','Vatican City'],XK:['Kosovo','Kosovo'],AX:['Åland · território','Åland · territory'],FO:['Ilhas Faroé · território','Faroe Islands · territory'],GG:['Guernsey · dependência','Guernsey · dependency'],GI:['Gibraltar · território','Gibraltar · territory'],IM:['Ilha de Man · dependência','Isle of Man · dependency'],JE:['Jersey · dependência','Jersey · dependency'],SJ:['Svalbard e Jan Mayen · território','Svalbard and Jan Mayen · territory']};
Object.keys(root.FestivalCountryNames||{}).forEach(function(code){if(!countryText[code])countryText[code]=root.FestivalCountryNames[code];});
var cache={},queue=[];
function name(code,lang){return (countryText[code]||[code,code])[lang==='pt'?0:1];}
function instance(code,path,lang){var a=(path||'').split('/');return new root.FestivalHolidays(root.FestivalData,code,a[0]||undefined,a[1]||undefined,{languages:[lang==='pt'?'pt':'en','en'],timezone:'UTC'});}
// Expand multi-day public celebrations into one cell per civil date.
function events(reader,year,language){
 var raw=reader.getHolidays(year,language),out=[];
 if(raw.some(function(h){return h.end-h.start>86400000;}))raw=raw.concat(reader.getHolidays(year-1,language).filter(function(h){return h.end-h.start>86400000;}));
 raw.forEach(function(h){var span=Math.max(1,Math.min(366,Math.ceil((h.end-h.start)/86400000))),base=h.date.slice(0,10),day=new Date(base+'T12:00:00Z');
 for(var offset=0;offset<span;offset++){var civil=day.toISOString().slice(0,10);if(day.getUTCFullYear()===year){var entry=Object.assign({},h);entry.date=civil+h.date.slice(10);out.push(entry);}day.setUTCDate(day.getUTCDate()+1);}
 });return out;
}
function regions(code,lang){if(!root.FestivalData.holidays[code])return [];var h=instance(code,'',lang),states=h.getStates(code,lang)||{},out=[];Object.keys(states).forEach(function(s){out.push({id:s,name:states[s]});var rr=h.getRegions(code,s,lang)||{};Object.keys(rr).forEach(function(r){out.push({id:s+'/'+r,name:states[s]+' / '+rr[r]});});});return out;}
function icon(h){var r=h.rule.toLowerCase(),n=(h.english||h.name).toLowerCase();if(/christmas|natal|julian 12-25/.test(n+' '+r)||r==='12-25')return 'tree';if(/easter|orthodox/.test(r))return 'egg';if(/new year/.test(n)||r==='01-01')return 'spark';if(/independen|national day|republic|constitution|portugal day|liberty|liberdade|freedom|unification/.test(n))return 'flag';if(/ramadan|eid|shawwal|hijri|muharram|dhu al-hijjah/.test(n+' '+r))return 'moon';return 'holiday';}
function get(code,path,year,lang,includeOther){
 var key=[code,path,year,lang,includeOther].join('|');if(cache[key])return cache[key];
 if(!root.FestivalData.holidays[code]){
 var supplement=root.FestivalSupplement.countries[code],rows=supplement&&supplement.years[String(year)]||[],annual={};
 rows.forEach(function(row){var h={date:row[0],name:row[1],english:row[1],original:row[2],type:'public',rule:lang==='pt'?'Calendário local · '+year:'Local calendar · '+year,substitute:/observed|substitute/i.test(row[1]),scope:'national',regions:[],code:code,source:supplement.source,version:'Python holidays '+root.FestivalSupplement.version};h.icon=icon(h);annual[h.date]=[h];});
 cache[key]=annual;queue.push(key);if(queue.length>100)delete cache[queue.shift()];return annual;
 }
 var base=instance(code,'',lang),national=events(base,year),natKeys={};
 // A country-level rule is national only if retained by every listed top-level subdivision.
 var top=regions(code,lang).filter(function(r){return r.id.indexOf('/')<0;}), effective={};
 top.forEach(function(r){effective[r.id]=events(instance(code,r.id,lang),year);});
 national=national.filter(function(h){var k=h.date+'|'+h.rule+'|'+h.type;return top.every(function(r){return effective[r.id].some(function(e){return e.date+'|'+e.rule+'|'+e.type===k;});});});
 national.forEach(function(h){natKeys[h.date+'|'+h.rule+'|'+h.type]=true;});
 var scopes=path==='*'?regions(code,lang):path?[{id:path,name:(regions(code,lang).filter(function(r){return r.id===path;})[0]||{name:path}).name}]:[];
 var merged={},langIndex={};
 function append(list,region,source){var en=events(source,year,'en'),orig=events(source,year,(root.FestivalData.holidays[code].langs||['en'])[0]);
 list.forEach(function(h,i){if(!includeOther&&h.type!=='public'&&h.type!=='bank')return;var date=h.date.slice(0,10),k=h.date+'|'+h.rule+'|'+h.type;
 var isNat=!!natKeys[k];if(region&&isNat){return;}var id=k+'|'+h.name;
 if(!merged[id]){var matchEn=en.filter(function(e){return e.date===h.date&&e.rule===h.rule;})[0];var matchOrig=orig.filter(function(e){return e.date===h.date&&e.rule===h.rule;})[0];merged[id]={date:date,name:h.name,english:matchEn?matchEn.name:h.name,original:matchOrig?matchOrig.name:h.name,type:h.type,rule:h.rule,substitute:!!h.substitute,scope:isNat?'national':'regional',regions:[],code:code,source:code==='PT'?'docs/DATA_SOURCES.md':'https://github.com/commenthol/date-holidays/blob/master/data/countries/'+code+'.yaml',version:root.FestivalData.version};merged[id].icon=icon(merged[id]);}
 if(region&&merged[id].regions.indexOf(region.name)<0)merged[id].regions.push(region.name);
 });}
 append(national,null,base);scopes.forEach(function(s){var h=instance(code,s.id,lang);append(events(h,year),s,h);});
 var map={};Object.keys(merged).forEach(function(k){var h=merged[k];(map[h.date]||(map[h.date]=[])).push(h);});cache[key]=map;queue.push(key);if(queue.length>100)delete cache[queue.shift()];return map;
}
function days(year){var out=[],d=new Date(Date.UTC(year,0,1));while(d.getUTCFullYear()===year){out.push(d.toISOString().slice(0,10));d.setUTCDate(d.getUTCDate()+1);}return out;}
function validate(p){if(!p||typeof p!=='object'||Array.isArray(p))throw Error('preferences');var countries=p.countries;if(!Array.isArray(countries)||countries.length<1||countries.length>Object.keys(countryText).length)throw Error('countries');var used={};countries.forEach(function(c){if(!c||!countryText[c.code]||used[c.code]||typeof c.region!=='string'||c.region.length>30)throw Error('country');used[c.code]=true;if(c.region&&c.region!=='*'&&!regions(c.code,'en').some(function(r){return r.id===c.region;}))throw Error('region');});if(p.explicitLang!==undefined&&typeof p.explicitLang!=='boolean')throw Error('language preference');if(['pt','en'].indexOf(p.lang)<0||['all','holidays'].indexOf(p.mode)<0||['grid','agenda'].indexOf(p.view)<0||!Number.isInteger(p.year)||p.year<2000||p.year>2050||!Number.isInteger(p.month)||p.month<0||p.month>12||typeof p.other!=='boolean'||typeof p.coincide!=='boolean')throw Error('options');return JSON.parse(JSON.stringify(p));}
root.FestivalEngine={countries:countryText,name:name,regions:regions,get:get,days:days,validate:validate};
})(typeof window!=='undefined'?window:globalThis);
