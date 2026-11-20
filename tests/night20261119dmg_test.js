// Nacht 19.11.2026 (Zweig nacht/2026-11-19): einmalige Komplotte mit Schaden – Approach My Molten Realm, I Call for Slaughter, Delight in the Hunt (Text aus oracle_schemes.json)
const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const SCH = JSON.parse(fs.readFileSync(require('path').join(__dirname, 'oracle_schemes.json'), 'utf8')).map(([n, type, o]) => ({n, type, o}));
const N = (n, type, o = '', x = {}) => ev('newCard')({n, type, o, img:null, ...x});
const open = () => !$('#modal').hidden;
const click = async t => { const b = [...d.querySelectorAll('#modalBox button')].find(b => b.textContent.trim().startsWith(t)); if(b){ b.click(); await wait(40); } return !!b; };
const setNum = async v => { const i = d.querySelector('#askN'); if(!i) return false; i.value = String(v); return click('Weiter'); };
const clickCard = async t => { const el = [...d.querySelectorAll('#modalBox .card')].find(e => e.textContent.includes(t)); if(el){ el.click(); await wait(40); } return !!el; };
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()'); ev('LOOK.autoPay = false');
  ev('startBot("Test", "Test", Array(30).fill(0).map(() => ({n:"Island", type:"Basic Land — Island", o:""})))'); ev('injectBot(); commit()'); await wait(30);
  const S = () => ev('S');
  const drain = async () => { for(let i = 0; i < 8 && open(); i++){ if(!(await click('Abbrechen')) && !(await click('Kein')) && !(await click('Nein')) && !(await click('Erledigt')) && !(await click('OK'))) break; await wait(40); } };
  const reset0 = () => ev('S.bf = []; S.hand = []; S.gy = []; S.ex = []; S.emblems = []; S.library = Array(20).fill(0).map(() => newCard({n:"Swamp", type:"Basic Land — Swamp", o:""})); S.pool = emptyPoolObj(); S.life = 40; S.arch = {on:true, deck:[], n:0, last:null}; withBot("bot", () => { BOT.bf = []; BOT.hand = []; BOT.gy = []; BOT.ex = []; BOT.life = 20; BOT.library = Array(20).fill(0).map(() => newCard({n:"Island", type:"Basic Land — Island", o:""})); botChanged(); }); TURN = {active:me.id, n:20, starter:me.id, phase:2}; commit()');
  const reset = async () => { await wait(80); await drain(); reset0(); await wait(20); };
  const botSet = (zone, list) => { w.__c = list; ev(`withBot("bot", () => { BOT.${zone} = window.__c; botChanged(); }); commit()`); };
  const life = id => ev(`BOTS[${JSON.stringify(id)}].life`);
  const scheme = n => { const sc = SCH.find(x => x.n === n); if(!sc) throw new Error('Komplott fehlt: ' + n); return sc; };
  // steps: Liste von Aktionen, je eine pro offenem Dialog: "b:Text" Knopf, "c:Name" Karte, "n:5" Zahl, "f" Fertig, Funktion
  const runScheme = async (n, steps = []) => {
    w.__sc = scheme(n); steps = steps.slice();
    ev('window.__done = false; (async () => { const card = newCard(schemeAsSpell(window.__sc)); for(const ab of parseAbilities(card).filter(a => a.kind === "spell")) await runAbility(card, ab, {}); commit(); window.__done = true; })()');
    for(let i = 0; i < 80 && !w.__done; i++){ await wait(50);
      if(open() && steps.length){ const s = steps.shift();
        if(typeof s === 'function') await s(); else if(s.startsWith('b:')) await click(s.slice(2)); else if(s.startsWith('c:')) await clickCard(s.slice(2)); else if(s.startsWith('n:')) await setNum(+s.slice(2)); else if(s === 'f') await click('Fertig');
        await wait(60); } }
    await wait(150); await drain();
  };
  const cr = (n, cmc, x = {}) => N(n, 'Creature — Bear', '', {pw:2, tg:2, cmc, mc:`{${cmc}}`, ...x});
  const AUTO = ['Approach My Molten Realm', 'I Call for Slaughter', 'Delight in the Hunt'];
  for(const n of AUTO){ w.__sc = scheme(n); const st = ev('cardCheck(schemeAsSpell(window.__sc)).status'); check(st === 'auto', `${n}: automatisch (${st})`); }
  const orc = () => N('Orc', 'Creature — Orc', '', {pw:3, tg:3});
  w.__bolt = N('Blitz', 'Instant', 'Lightning Bolt deals 3 damage to any target.', {cmc:1, mc:'{R}'});

  // I Call for Slaughter: drei 1/1-Teufel mit Eile; meine Quellen +1 diesen Zug
  await reset(); await runScheme('I Call for Slaughter');
  const devils = S().bf.filter(c => c.tok && /Devil/.test(c.type || ''));
  check(devils.length === 3 && devils.every(c => ev(`kwHas(S.bf.find(x => x.u === ${JSON.stringify(c.u)}), "haste")`)), `Slaughter: drei Teufel mit Eile (${devils.length})`);
  ev('hitOpponent("bot", {kind:"damage", amount:2, src:"Test"})'); await wait(100);
  check(life('bot') === 17, `Slaughter: 2 Schaden von mir → 3 (${life('bot')})`);
  w.__d = devils[0]; check(ev('computeCombat([window.__d], new Map()).dmg') === 2, 'Slaughter: Teufel 1/1 trifft im Kampf für 2');
  w.__o = orc(); check(ev('computeCombat([window.__o], new Map()).dmg') === 3, 'Slaughter: Quelle der KI unverändert');
  w.__face = N('Brand', 'Instant', 'Brand deals 3 damage to target player.', {cmc:1, mc:'{R}'});
  ev('withBot("bot", () => heurResolve(window.__face))'); check(S().life === 37, `Slaughter: KI-Brand an mich bleibt 3 (${S().life})`);
  ev('TURN = {active:"bot", n:TURN.n + 1, starter:me.id, phase:2}'); ev('hitOpponent("bot", {kind:"damage", amount:2, src:"Test"})'); await wait(100);
  check(life('bot') === 15, `Slaughter: im nächsten Zug vorbei (${life('bot')})`);

  // Approach My Molten Realm: jede Quelle doppelt bis zu meinem nächsten Zug
  await reset(); ev('TURN = {active:me.id, n:30, starter:me.id, phase:2}'); await runScheme('Approach My Molten Realm');
  ev('hitOpponent("bot", {kind:"damage", amount:2, src:"Test"})'); await wait(100); check(life('bot') === 16, `Molten Realm: meine 2 → 4 (${life('bot')})`);
  ev('withBot("bot", () => heurResolve(window.__bolt))'); check(S().life === 34, `Molten Realm: KI-Blitz an mich 6 (${S().life})`);
  w.__o = orc(); check(ev('computeCombat([window.__o], new Map()).dmg') === 6, 'Molten Realm: Orc 3/3 trifft für 6');
  ev('S.bf.push(newCard({n:"Bär", type:"Creature — Bear", o:"", pw:2, tg:2})); commit()');
  w.__o = N('Riese', 'Creature — Giant', '', {pw:3, tg:3}); w.__bl = new w.Map([[w.__o.u, S().bf[0]]]);
  { const r = ev('computeCombat([window.__o], window.__bl)'); check(r.deadA.length === 1 && r.deadB.length === 1, 'Molten Realm: Bär 2/2 (4 Schaden) tötet blockend den Riesen 3/3'); }
  ev('receiveCombatResult({from:"anna", cid:"x", dmg:2, cmdDmg:0, hn:1, dead:[]})'); check(S().life === 30, `Molten Realm: Mitspieler-Kampfschaden 2 → 4 (${S().life})`);
  ev('TURN = {active:me.id, n:32, starter:me.id, phase:0}; onMyTurnStart()'); await wait(150); await drain();
  ev('hitOpponent("bot", {kind:"damage", amount:2, src:"Test"})'); await wait(100); check(life('bot') === 14 && !S().molten, `Molten Realm: ab meinem nächsten Zug vorbei (${life('bot')})`);

  // Delight in the Hunt: 3/3-Horror; Schaden an meinen Kreaturen diesen Zug verhindert
  await reset(); ev('TURN = {active:me.id, n:40, starter:me.id, phase:2}'); await runScheme('Delight in the Hunt');
  { const h = S().bf.find(c => c.tok && /Horror/.test(c.type || '')); check(!!h && ev(`power(S.bf.find(x => x.u === ${JSON.stringify(h && h.u)}))`) === 3, 'Delight: 3/3-Horror'); }
  ev('S.bf.push(newCard({n:"Bär", type:"Creature — Bear", o:"", pw:2, tg:2})); commit()');
  w.__a = S().bf.find(c => c.n === 'Bär'); w.__o = N('Riese', 'Creature — Giant', '', {pw:5, tg:5}); w.__bl = new w.Map([[w.__a.u, w.__o]]);
  { const r = ev('computeCombat([window.__a], window.__bl)'); check(r.deadA.length === 0, 'Delight: angreifender Bär überlebt den Block des 5/5-Riesen'); }
  check(ev('withBot("bot", () => applyRemovalToMe(window.__bolt, removalOf(window.__bolt)))') === false && S().bf.length === 2, 'Delight: KI-Blitz sucht sich keine meiner Kreaturen');
  ev(`receiveHit({from:"anna", kind:"damage", amount:4, card:${JSON.stringify(w.__a.u)}, src:"Feuer"})`); await wait(100);
  check(S().bf.some(c => c.n === 'Bär'), 'Delight: Mitspieler-Schaden am Bär verhindert');
  ev('TURN = {active:"bot", n:41, starter:me.id, phase:2}');
  { const r = ev('computeCombat([window.__a], window.__bl)'); check(r.deadA.length === 1, 'Delight: im nächsten Zug vorbei'); }
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
