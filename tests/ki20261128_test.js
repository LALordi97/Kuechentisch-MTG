// KI verbessern (28.11.2026): Alpha-Schlag-Rechnung beachtet, wen meine Blocker blocken dürfen (Fliegen) und Trampelschaden
const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()');
  ev('startBot("Test", "Test", Array(30).fill(0).map(() => ({n:"Island", type:"Basic Land — Island", o:""})))'); ev('injectBot(); commit()'); await wait(30);
  const cr = (n, pw, tg, o = '') => { w.__c = ev('newCard')({n, type:'Creature — Test', o, pw, tg, img:null}); w.__c.sick = false; ev('BOT.bf.push(window.__c)'); return w.__c; };
  const mine = (n, o, pw, tg) => { w.__m = ev('newCard')({n, type:'Creature — Test', o, pw, tg, img:null}); ev('S.bf.push(window.__m); commit()'); return w.__m; };
  const reset = () => { ev('BOT.bf = []; BOT.hand = []; BOT.gy = []; BOT.life = 20; S.bf = []; S.life = 20; botChanged(); commit()'); };
  const atk = () => ev('withBot("bot", () => botChooseAttackers().map(c => c.n))');

  // 1: Flieger 5 + drei 3/3 am Boden gegen einen 4/4 – 14 Schaden, nur 3 blockbar → tödlich, alle greifen an
  reset(); { cr('Drache', 5, 5, 'Flying'); cr('A', 3, 3); cr('B', 3, 3); cr('C', 3, 3); mine('Wache', '', 4, 4); ev('S.life = 10');
    const r = atk(); check(r.length === 4, `tödlicher Alpha-Schlag trotz Blocker erkannt (${r.join(', ')})`); }
  // 2: gleiche Lage mit 12 Leben – nicht tödlich, die 3/3 bleiben zu Hause
  reset(); { cr('Drache', 5, 5, 'Flying'); cr('A', 3, 3); cr('B', 3, 3); cr('C', 3, 3); mine('Wache', '', 4, 4); ev('S.life = 12');
    const r = atk(); check(r.length === 1 && r[0] === 'Drache', `nicht tödlich: nur der Drache greift an (${r.join(', ')})`); }
  // 3: Trampler 8/8 gegen 1/1-Blocker, 7 Leben → tödlich
  reset(); { cr('Wurm', 8, 8, 'Trample'); mine('Eichhörnchen', '', 1, 1); ev('S.life = 7');
    check(ev('withBot("bot", () => alphaLethal(BOT.bf.slice(), myCreatures(), S.life))'), 'Trampler: 7 Schaden gehen durch, tödlich'); }
  // 4: ohne Trample nicht tödlich
  reset(); { cr('Ochse', 8, 8); mine('Eichhörnchen', '', 1, 1); ev('S.life = 7');
    check(!ev('withBot("bot", () => alphaLethal(BOT.bf.slice(), myCreatures(), S.life))'), 'ohne Trample: geblockt, nicht tödlich'); }
  // 5: wie bisher – zwei Blocker halten die zwei stärksten auf
  reset(); { cr('A', 4, 4); cr('B', 3, 3); cr('C', 2, 2); mine('X', '', 1, 1); mine('Y', '', 1, 1);
    check(ev('withBot("bot", () => alphaLethal(BOT.bf.slice(), myCreatures(), 2))') && !ev('withBot("bot", () => alphaLethal(BOT.bf.slice(), myCreatures(), 3))'), 'ohne Ausweichen: 2 Schaden kommen durch'); }

  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
