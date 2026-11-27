// KI verbessern (27.11.2026): KI blockt Angreifer mit Menace nicht mit einer einzelnen Kreatur (regelwidrig)
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
  const cr = (n, pw, tg) => { w.__c = ev('newCard')({n, type:'Creature — Test', o:'', pw, tg, img:null}); w.__c.sick = false; ev('BOT.bf.push(window.__c)'); return w.__c; };
  const mine = (n, o, pw, tg) => { w.__m = ev('newCard')({n, type:'Creature — Test', o, pw, tg, img:null}); ev('S.bf.push(window.__m); commit()'); return w.__m; };
  const reset = () => { ev('BOT.bf = []; BOT.hand = []; BOT.gy = []; BOT.life = 20; S.bf = []; botChanged(); commit()'); };
  const blocks = atk => { w.__a = atk; return ev('withBot("bot", () => [...botChooseBlocks(window.__a).entries()].map(([a, b]) => [a.n || a, b.n || b]))'); };

  // 1: Angreifer ohne Menace wird geblockt, wenn der Blocker überlebt und tötet
  reset(); { cr('Wand', 1, 5); cr('Riese', 4, 4); const a = mine('Bär', '', 2, 2); const r = blocks([a]);
    check(r.length === 1, `ohne Menace: KI blockt den Bären (${JSON.stringify(r)})`); }
  // 2: derselbe Angreifer mit Menace wird nicht einzeln geblockt
  reset(); { cr('Wand', 1, 5); cr('Riese', 4, 4); const a = mine('Schläger', 'Menace', 2, 2); check(ev('kwHas')(a, 'menace'), 'Schläger hat Menace'); const r = blocks([a]);
    check(r.length === 0, `mit Menace: kein Einzelblock (${JSON.stringify(r)})`); }
  // 3: gemischt – nur der Angreifer ohne Menace wird geblockt
  reset(); { cr('Wand', 1, 5); cr('Riese', 4, 4); const a = mine('Schläger', 'Menace', 2, 2), b = mine('Bär', '', 2, 2); const r = blocks([a, b]);
    check(r.length === 1 && r[0][0] === b.u, `gemischt: nur der Bär wird geblockt (${JSON.stringify(r)})`); }
  // 4: Notblock gegen tödlichen Schaden auch nicht gegen Menace
  reset(); { ev('BOT.life = 3'); cr('Wand', 0, 1); const a = mine('Schläger', 'Menace', 5, 5); const r = blocks([a]);
    check(r.length === 0, `tödlicher Menace-Angreifer: trotzdem kein Einzelblock (${JSON.stringify(r)})`); }

  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
