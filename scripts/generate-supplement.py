"""Generate offline national date tables only where the JavaScript rule catalogue has no country.
Optional data-maintenance step. No Python is used by the deployed app.
"""
import json,warnings,inspect,shutil
from pathlib import Path
import holidays
from importlib.metadata import distribution
warnings.filterwarnings('ignore')
root=Path(__file__).resolve().parents[1]
source=json.loads((root/'node_modules/date-holidays/data/holidays.json').read_text())['holidays']
flags=json.loads((root/'node_modules/flag-icons/country.json').read_text())
codes=sorted({c['code'].upper() for c in flags if c['iso']}|set(source))
missing=[c for c in codes if c not in source]
result={'version':holidays.__version__,'generated':'2026-11-01','countries':{}}
references={}
for code in missing:
 en=holidays.country_holidays(code,language='en_US')
 native=holidays.country_holidays(code,language=en.default_language)
 out={'years':{},'startYear':en.start_year,'endYear':en.end_year,'source':'https://github.com/vacanza/holidays/blob/v'+holidays.__version__+'/holidays/countries/'+en.__class__.__module__.split('.')[-1]+'.py'}
 references[code]=inspect.getdoc(en.__class__)
 for year in range(2000,2051):
  en._populate(year);native._populate(year)
  # Keep the original name and any upstream '(estimated)' qualifier intact.
  out['years'][str(year)]=[[d.isoformat(),name,native.get(d,name)] for d,name in sorted(en.items()) if d.year==year]
 result['countries'][code]=out
(root/'vendor/supplement-data.js').write_text('/* Local annual tables generated from Python holidays '+holidays.__version__+'; MIT. See ATTRIBUTION.md. */\nwindow.FestivalSupplement='+json.dumps(result,ensure_ascii=False,separators=(',',':'))+';\n')
(root/'vendor/python-holidays-sources.json').write_text(json.dumps(references,ensure_ascii=False,indent=2))
dist=distribution('holidays');licenses=[f for f in dist.files if f.name.upper()=='LICENSE'];assert licenses
shutil.copyfile(dist.locate_file(licenses[0]),root/'vendor/python-holidays-LICENSE.txt')
print('Supplement:',len(missing),'countries, 2000–2050;',sum(len(y) for c in result['countries'].values() for y in c['years'].values()),'dates')
