// Schnellprüfung: Syntax, doppelte case-Labels pro switch, doppelte Funktionsnamen
const fs = require('fs'), acorn = require('acorn');
const html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let bad = 0;
for(const src of scripts){
  let ast;
  try{ ast = acorn.parse(src, {ecmaVersion:'latest', locations:true}); }
  catch(e){ console.log('SYNTAX', e.message); bad++; continue; }
  const fnNames = {};
  (function walk(n){
    if(!n || typeof n.type !== 'string') return;
    if(n.type === 'SwitchStatement'){
      const seen = {};
      n.cases.forEach(c => { if(c.test && c.test.type === 'Literal'){ const k = c.test.value; if(seen[k]){ console.log(`DOPPELT case "${k}" Zeilen ${seen[k]} und ${c.loc.start.line}`); bad++; } else seen[k] = c.loc.start.line; } });
    }
    if(n.type === 'FunctionDeclaration' && n.id){ const k = n.id.name; if(fnNames[k]){ console.log(`DOPPELT function ${k} Zeilen ${fnNames[k]} und ${n.loc.start.line}`); bad++; } else fnNames[k] = n.loc.start.line; }
    for(const key in n){ const v = n[key]; if(key === 'loc') continue; if(Array.isArray(v)) v.forEach(walk); else if(v && typeof v.type === 'string') walk(v); }
  })(ast);
}
console.log(bad ? `LINT: ${bad} Problem(e)` : 'LINT OK');
process.exit(bad ? 1 : 0);
