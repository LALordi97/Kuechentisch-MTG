const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const ev = c => dom.window.eval(c);
const T = JSON.parse(fs.readFileSync(require('path').join(__dirname, process.argv[2] || 'report27_cards.json')));
for(const t of T){ dom.window.__t = {n:t[0], type:t[1], o:t[2]};
 console.log(t[0], JSON.stringify(ev('(() => { const c = newCard(window.__t); return parseAbilities(c).map(a => ({k:a.kind, c:a.cond, s:(a.steps||parseSteps(a.text||"", c)||[]).map(x=>x.t+(x.may?"?":""))})); })()'))); }
process.exit(0);
