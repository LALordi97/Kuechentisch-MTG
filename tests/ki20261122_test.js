// KI verbessern (22.11.2026): Kampftricks beim Blocken (Giant Growth u. ä.), Mana dafür aufheben
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
  const trick = (atk, blocks) => { w.__a = atk; w.__m = new w.Map(blocks); const r = ev('withBot("bot", () => botCombatTrick(window.__a, window.__m))'); return {r, m:w.__m}; };

  check(JSON.stringify(ev('pumpOf')(ev('newCard')({n:'X', type:'Instant', o:'Target creature gets +2/+2 and gains first strike until end of turn.'}))) === '{"p":2,"t":2,"kw":["first strike"]}', 'pumpOf: +2/+2 und Erstschlag erkannt');
  check(ev('pumpOf')(ev('newCard')({n:'X', type:'Sorcery', o:'Target creature gets +3/+3 until end of turn.'})) === null, 'pumpOf: Hexerei zählt nicht als Kampftrick');
  // 1: geblockter Bär stirbt sonst – mit Giant Growth überlebt er und tötet den Angreifer
  reset(); { const a = mine('Angreifer', 3, 3), b = theirs('Blocker', 2, 2); forest(); const g = growth();
    const {r} = trick([a], [[a.u, b]]); check(!!r && ev('BOT.gy').includes(g) && ev('power')(b) === 5, `Kampftrick: Giant Growth auf den Blocker (${ev('power')(b)}/${ev('tough')(b)})`); }
  // 2: Blocker überlebt ohnehin – kein Trick
  reset(); { const a = mine('Klein', 1, 1), b = theirs('Blocker', 2, 2); forest(); const g = growth();
    const {r} = trick([a], [[a.u, b]]); check(!r && ev('BOT.hand').includes(g), 'Kampftrick: unnötig, Karte bleibt auf der Hand'); }
  // 3: ohne Mana kein Trick
  reset(); { const a = mine('Angreifer', 3, 3), b = theirs('Blocker', 2, 2); growth();
    const {r} = trick([a], [[a.u, b]]); check(!r, 'Kampftrick: ohne Mana kein Trick'); }
  // 4: ungeblockter Angreifer – mit Trick lohnt sich ein neuer Block
  reset(); { const a = mine('Riese', 4, 4), b = theirs('Wache', 2, 2); forest(); growth();
    const {r, m} = trick([a], []); check(!!r && m.get(a.u) === b && ev('power')(b) === 5, 'Kampftrick: neuer Block mit Giant Growth (5/5 gegen 4/4)'); }
  // 5: Trick rettet den Blocker nicht (Angreifer 6/6) – kein Trick
  reset(); { const a = mine('Drache', 6, 6), b = theirs('Blocker', 2, 2); forest(); growth();
    const {r} = trick([a], [[a.u, b]]); check(!r, 'Kampftrick: hilft nicht gegen 6/6, kein Trick'); }
  // 6: ganzer Ablauf beim Verteidigen (botDefend)
  reset(); { const a = mine('Riese', 4, 4); const b = theirs('Wache', 2, 2); forest(); growth(); w.__a = [a];
    const m = await ev('withBot("bot", () => botDefend(window.__a, false))'); check(m.get(a.u) === b && ev('power')(b) === 5, 'botDefend: blockt mit Kampftrick'); }
  // 7: Mana dafür aufheben – heldInteraction zählt den Trick, solange die KI Kreaturen hat
  reset(); { theirs('Wache', 2, 2); const g = growth(); check(ev('withBot("bot", () => heldInteraction())').includes(g), 'heldInteraction: Kampftrick wird für den gegnerischen Zug aufgehoben');
    ev('BOT.bf = []'); check(!ev('withBot("bot", () => heldInteraction())').includes(g), 'heldInteraction: ohne eigene Kreaturen nicht'); }
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
