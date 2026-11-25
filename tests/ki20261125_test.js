// KI verbessern (25.11.2026): Mana für Kampftricks im ersten Hauptsegment aufheben (trickReserve)
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
  const forest = () => ev('BOT.bf.push(newCard({n:"Forest", type:"Basic Land — Forest", o:"({T}: Add {G}.)"}))');
  const card = (n, type, o, mc, cmc) => { w.__h = ev('newCard')({n, type, o, mc, cmc, img:null}); ev('BOT.hand.push(window.__h)'); return w.__h; };
  const growth = () => card('Giant Growth', 'Instant', 'Target creature gets +3/+3 until end of turn.', '{G}', 1);
  const kill = () => card('Kill', 'Sorcery', 'Destroy target creature.', '{1}{G}', 2);
  const mine = () => { w.__m = ev('newCard')({n:'Riese', type:'Creature — Giant', o:'', pw:3, tg:3, img:null}); ev('S.bf.push(window.__m); commit()'); return w.__m; };
  const reset = () => { ev('BOT.bf = []; BOT.hand = []; BOT.gy = []; BOT.life = 20; S.bf = []; S.hand = [newCard({n:"X", type:"Instant"})]; botChanged(); commit()'); };
  const pre = () => ev('withBot("bot", () => heurPrecombat())');

  // 1: 2 Länder, Angreifer, Giant Growth und Kill auf der Hand → Kill wartet
  reset(); { cr('Bär', 2, 2); forest(); forest(); const g = growth(), k = kill(); const r = mine(); pre();
    check(ev('BOT.hand').includes(k) && ev('S.bf').includes(r), 'mit Kampftrick und knappem Mana: Kill bleibt auf der Hand');
    check(ev('trickReserve()') === 1, `Reserve 1 Mana (${ev('trickReserve()')})`); }
  // 2: ohne Kampftrick wird gewirkt
  reset(); { cr('Bär', 2, 2); forest(); forest(); const k = kill(); const r = mine(); pre();
    check(ev('BOT.gy').includes(k) && !ev('S.bf').includes(r), 'ohne Kampftrick: Kill auf den Riesen'); }
  // 3: genug Mana für beides
  reset(); { cr('Bär', 2, 2); forest(); forest(); forest(); const g = growth(), k = kill(); const r = mine(); pre();
    check(ev('BOT.gy').includes(k) && ev('BOT.hand').includes(g), 'mit 3 Ländern: Kill gewirkt, Giant Growth bleibt'); }
  // 4: kein möglicher Angreifer → keine Reserve
  reset(); { const b = cr('Bär', 2, 2); b.sick = true; forest(); forest(); growth(); const k = kill(); mine(); pre();
    check(ev('BOT.gy').includes(k), 'ohne angriffsbereite Kreatur: Kill gewirkt'); }
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
