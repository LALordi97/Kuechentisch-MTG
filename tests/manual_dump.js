// Zeigt pro Karte die Teile, die die App noch nicht automatisch kann (Schritt «manual»)
const {JSDOM} = require('jsdom'); const fs = require('fs'), path = require('path');
let html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const T = JSON.parse(fs.readFileSync(path.join(__dirname, process.argv[2] || 'report28_cards.json')));
for(const t of T){ dom.window.__t = {n:t[0], type:t[1], o:t[2]};
  const r = dom.window.eval('(() => { const c = newCard(window.__t); return parseAbilities(c).map(a => (a.kind + (a.cond ? "[" + a.cond + "]" : "") + ": " + (a.steps || parseSteps(a.text || "", c) || []).filter(x => x.t === "manual").map(x => JSON.stringify(x.text || x.p || x)).join(" | "))).filter(x => /: ./.test(x)); })()');
  if(r.length) console.log(t[0] + "\n   " + r.join("\n   ")); }
process.exit(0);
