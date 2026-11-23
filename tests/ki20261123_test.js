// KI verbessern (23.11.2026): Kampftricks beim Angreifen (nach meinen Blocks)
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
  const reset = () => ev('S.bf = []; S.gy = []; S.hand = []; S.attacking = []; S.life = 20; BOT.bf = []; BOT.hand = []; BOT.gy = []; botChanged()');
  const trick = (atk, blocks, life = 20) => { w.__a = atk; w.__m = new w.Map(blocks); w.__l = life; return ev('withBot("bot", () => botAttackTrick(window.__a, window.__m, window.__l))'); };

  // 1: Angreifer würde sterben – mit Giant Growth überlebt er und tötet den Blocker
  reset(); { const a = theirs('Angreifer', 2, 2), b = mine('Blocker', 3, 3); forest(); const g = growth();
    const r = trick([a], [[a.u, b]]); check(!!r && ev('BOT.gy').includes(g) && ev('power')(a) === 5, `Angriffstrick: Giant Growth auf den geblockten Angreifer (${ev('power')(a)})`); }
  // 2: Angreifer gewinnt ohnehin – kein Trick
  reset(); { const a = theirs('Gross', 4, 4), b = mine('Klein', 1, 1); forest(); const g = growth();
    const r = trick([a], [[a.u, b]]); check(!r && ev('BOT.hand').includes(g), 'Angriffstrick: unnötig, Karte bleibt auf der Hand'); }
  // 3: Trick reicht nicht (Blocker 7/7) – kein Trick
  reset(); { const a = theirs('Angreifer', 2, 2), b = mine('Riese', 7, 7); forest(); growth();
    const r = trick([a], [[a.u, b]]); check(!r, 'Angriffstrick: hilft nicht gegen 7/7'); }
  // 4: ungeblockt und tödlich
  reset(); { const a = theirs('Läufer', 2, 2); forest(); growth();
    const r = trick([a], [], 5); check(!!r && r.lethal && ev('power')(a) === 5, 'Angriffstrick: ungeblockter Angreifer wird tödlich (5 Schaden bei 5 Leben)'); }
  // 5: ungeblockt, aber nicht tödlich – kein Trick
  reset(); { const a = theirs('Läufer', 2, 2); forest(); growth();
    const r = trick([a], [], 20); check(!r, 'Angriffstrick: nicht tödlich, kein Trick'); }
  // 6: ohne Mana kein Trick
  reset(); { const a = theirs('Angreifer', 2, 2), b = mine('Blocker', 3, 3); growth();
    const r = trick([a], [[a.u, b]]); check(!r, 'Angriffstrick: ohne Mana kein Trick'); }
  // 7: Kampf am Tisch: Trick wirkt, Blocker stirbt, Pump danach weg
  reset(); { const a = theirs('Angreifer', 2, 2), b = mine('Blocker', 3, 3); forest(); growth(); w.__a = a; w.__b = b;
    ev('withBot("bot", () => { const trk = botAttackTrick([window.__a], new Map([[window.__a.u, window.__b]]), S.life); resolveCombat([window.__a], new Map([[window.__a.u, window.__b]]), true); if(trk && trk.a.pump){ trk.a.pump = {p:trk.a.pump.p - trk.pu.p, t:trk.a.pump.t - trk.pu.t}; if(!trk.a.pump.p && !trk.a.pump.t) delete trk.a.pump; } })'); await wait(100);
    check(ev('S.gy').includes(b) && ev('BOT.bf').includes(a), 'Kampf: Blocker stirbt, Angreifer überlebt');
    check(ev('power')(a) === 2, `Kampf: Pump nach dem Kampf weg (${ev('power')(a)})`); }
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
