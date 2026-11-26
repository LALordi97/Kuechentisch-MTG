// KI verbessern (26.11.2026): Kampftricks im Fern-Kampf – combatInfo überträgt den Pump
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
  const mine = (n, pw, tg, x = {}) => { const c = ev('newCard')({n, type:'Creature — Test', o:'', pw, tg, img:null}); Object.assign(c, x); ev('S').bf.push(c); return c; };
  const theirs = (n, pw, tg, x = {}) => { const c = ev('newCard')({n, type:'Creature — Test', o:'', pw, tg, img:null}); Object.assign(c, x); ev('BOT').bf.push(c); return c; };
  const forest = () => { ev('BOT.bf.push(newCard({n:"Forest", type:"Basic Land — Forest", o:"({T}: Add {G}.)"}))'); };
  const growth = () => { const c = ev('newCard')({n:'Giant Growth', type:'Instant', o:'Target creature gets +3/+3 until end of turn.', mc:'{G}', cmc:1, img:null}); ev('BOT').hand.push(c); return c; };
  const reset = () => ev('S.bf = []; S.gy = []; S.hand = []; S.attacking = []; BOT.bf = []; BOT.hand = []; BOT.gy = []; botChanged()');
  // combatInfo/cleanInfo: Pump geht mit
  reset(); { const b = theirs('Blocker', 2, 2); b.pump = {p:3, t:3}; const info = ev('cleanInfo')(JSON.parse(JSON.stringify(ev('combatInfo')(b))));
    check(info.pump && info.pump.p === 3 && ev('power')(info) === 5 && ev('tough')(info) === 5, `combatInfo: Pump übertragen (${ev('power')(info)}/${ev('tough')(info)})`);
    const c0 = theirs('Ohne', 2, 2); const i0 = ev('cleanInfo')(JSON.parse(JSON.stringify(ev('combatInfo')(c0)))); check(!i0.pump && ev('power')(i0) === 2, 'combatInfo: ohne Pump kein Feld');
    check(!ev('cleanInfo')({u:'x', n:'X', pw:1, tg:1, pump:'böse'}).pump, 'cleanInfo: ungültiger Pump wird verworfen'); }
  // Fern-Kampf: ein Mitspieler greift die KI an; die KI blockt mit Giant Growth, die Blocks enthalten den Pump
  reset(); { const a = mine('Riese', 4, 4); const b = theirs('Wache', 2, 2); forest(); const g = growth();
    const sent = []; const route0 = w.route; w.eval('window.__sent = []; window.__route0 = route; route = m => { window.__sent.push(JSON.parse(JSON.stringify(m))); }');
    w.__msg = {t:'attack', from:'p2', by:'Mitspieler', cid:'c1', attackers:[JSON.parse(JSON.stringify(ev('combatInfo')(a)))]};
    await ev('withBot("bot", () => botReceiveAttack(window.__msg))'); await wait(50);
    const msg = w.__sent.find(m => m.t === 'blocks'); const bl = msg && msg.blocks[0];
    check(!!bl && bl.b.n === 'Wache' && bl.b.pump && bl.b.pump.p === 3 && ev('BOT.gy').includes(g), `Fern-Kampf: KI blockt mit Giant Growth, Pump in der Nachricht (${JSON.stringify(bl && bl.b.pump)})`);
    // Angreifer rechnet mit dem Pump: Riese stirbt, Wache überlebt
    w.__bl = bl; const r = ev('(() => { const m = new Map(); m.set(window.__bl.a, cleanInfo(window.__bl.b)); return computeCombat(S.bf.filter(c => c.n === "Riese"), m); })()');
    check(r.deadA.length === 1 && r.deadB.length === 0, `Fern-Kampf: Angreifer stirbt, Blocker überlebt (${r.deadA.length}, ${r.deadB.length})`);
    w.eval('route = window.__route0'); }
  // Fern-Kampf ohne Trick-Bedarf: kein Pump
  reset(); { const a = mine('Klein', 1, 1); theirs('Wache', 2, 2); forest(); const g = growth(); w.eval('window.__sent = []; window.__route0 = route; route = m => { window.__sent.push(JSON.parse(JSON.stringify(m))); }');
    w.__msg = {t:'attack', from:'p2', by:'Mitspieler', cid:'c2', attackers:[JSON.parse(JSON.stringify(ev('combatInfo')(a)))]};
    await ev('withBot("bot", () => botReceiveAttack(window.__msg))'); await wait(50);
    check(ev('BOT.hand').includes(g), 'Fern-Kampf: unnötiger Trick bleibt auf der Hand'); w.eval('route = window.__route0'); }
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
