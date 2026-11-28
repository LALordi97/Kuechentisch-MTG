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

  // 6: Rückschlag – meine zwei 3/3-Flieger töten die KI (6 Leben) ohnehin: die KI greift trotzdem an (zu Hause bleiben rettet nicht)
  reset(); { cr('A', 2, 2); cr('B', 2, 2); mine('F1', 'Flying\nThis creature can block only creatures with flying.', 3, 3); mine('F2', 'Flying\nThis creature can block only creatures with flying.', 3, 3); ev('BOT.life = 6; S.life = 20');
    const r = atk(); check(r.length === 2, `hoffnungslos: KI greift trotzdem an (${r.join(', ')})`); }
  // 7: Rückschlag am Boden – zwei 3/3 gegen KI mit 4 Leben: beide Blocker bleiben zu Hause
  reset(); { cr('A', 2, 2); cr('B', 2, 2); mine('X', '', 3, 3); mine('Y', '', 3, 3); ev('BOT.life = 4; S.life = 20');
    const r = atk(); check(r.length === 0, `Rückschlag 6 gegen 4 Leben: beide bleiben zu Hause (${r.join(', ')})`); }
  // 8: Trampler im Rückschlag – mein 6/6-Trampler gegen den 2/2 der KI (4 Leben): auch mit Blocker tödlich
  reset(); { cr('A', 2, 2); mine('T', 'Trample', 6, 6); ev('BOT.life = 4; S.life = 20');
    check(ev('withBot("bot", () => alphaLethal(myCreatures(), BOT.bf.slice(), BOT.life))'), 'Trampler-Rückschlag: auch mit Blocker tödlich'); }

  // 9: Blocken – Reichweite-Blocker für den Flieger aufsparen
  const blocks = a => { w.__a = a; return ev('withBot("bot", () => [...botChooseBlocks(window.__a).entries()].map(([u, b]) => [u, b.n]))'); };
  reset(); { cr('Netz', 4, 4, 'Reach'); cr('Wall', 4, 4); const g = mine('Boden', '', 3, 3), f = mine('Flieger', 'Flying', 3, 3); const r = blocks([g, f]);
    check(r.length === 2 && r.some(([u, n]) => u === f.u && n === 'Netz') && r.some(([u, n]) => u === g.u && n === 'Wall'), `Blocken: Netz gegen den Flieger, Wall gegen den Boden (${JSON.stringify(r.map(x => x[1]))})`); }
  // 10: Blocken – der kleinste genügende Blocker
  reset(); { cr('Gross', 6, 6); cr('Klein', 3, 3); const a = mine('Bär', '', 2, 2); const r = blocks([a]);
    check(r.length === 1 && r[0][1] === 'Klein', `Blocken: Klein (3/3) blockt den Bären, Gross bleibt frei (${JSON.stringify(r)})`); }

  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
