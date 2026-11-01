const fs=require('fs'),cp=require('child_process'),path=require('path');
const root=path.resolve(__dirname,'..'),out=path.resolve(root,'..','festival-pwa-v1.1.0.zip');
cp.execFileSync('python3',['-c',`from pathlib import Path
import zipfile,sys
root=Path(sys.argv[1]);out=Path(sys.argv[2])
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(root.rglob('*')):
  rel=p.relative_to(root)
  if any(x in ['node_modules','dist','.openai','.git','__pycache__'] for x in rel.parts):continue
  if p.is_file():z.write(p,Path('festival')/rel)
print(out)
`,root,out],{stdio:'inherit'});
