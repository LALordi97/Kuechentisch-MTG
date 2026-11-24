// KI verbessern (24.11.2026): Kampftricks auch zwischen zwei KI (botVsBotCombat)
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
  ev('BOTS.bot2 = Object.assign(freshBot(), {active:true, deckName:"Zwei", library:Array(20).fill(0).map(() => newCard({n:"Island", type:"Basic Land — Island", o:""}))})');
  const cr = (id, n, pw, tg) => { w.__c = ev('newCard')({n, type:'Creature — Test', o:'', pw, tg, img:null}); w.__c.sick = false; ev(`BOTS.${id}.bf.push(window.__c)`); return w.__c; };
  const forest = id => ev(`BOTS.${id}.bf.push(newCard({n:"Forest", type:"Basic Land — Forest", o:"({T}: Add {G}.)"}))`);
  const growth = id => { w.__g = ev('newCard')({n:'Giant Growth', type:'Instant', o:'Target creature gets +3/+3 until end of turn.', mc:'{G}', cmc:1, img:null}); ev(`BOTS.${id}.hand.push(window.__g)`); return w.__g; };
  const reset = () => ev('["bot", "bot2"].forEach(id => { BOTS[id].bf = []; BOTS[id].hand = []; BOTS[id].gy = []; BOTS[id].life = 20; }); botChanged()');
  const fight = (atk, def) => { w.__atk = atk; return ev(`withBot("bot", () => botVsBotCombat(window.__atk, "${def}"))`); };

  // 1: Angreifer (KI 1) wird geblockt und rettet sich mit Giant Growth
  reset(); { const a = cr('bot', 'Angreifer', 2, 2), b = cr('bot2', 'Blocker', 3, 3); forest('bot'); const g = growth('bot');
    const r = fight([a], 'bot2'); check(r.blocks.get(a.u) === b, 'KI 2 blockt den Angreifer');
    check(!!r.trk && ev('BOTS.bot.gy').includes(g) && ev('BOTS.bot.bf').includes(a) && ev('BOTS.bot2.gy').includes(b), 'Angriffstrick gegen KI: Angreifer überlebt, Blocker stirbt');
    check(ev('power')(a) === 2, `Pump nach dem Kampf weg (${ev('power')(a)})`); }
  // 2: Verteidiger (KI 2) rettet seinen Blocker
  reset(); { const a = cr('bot', 'Angreifer', 3, 3), b = cr('bot2', 'Blocker', 2, 3); forest('bot2'); const g = growth('bot2');
    const r = fight([a], 'bot2'); const bl = r.blocks.get(a.u);
    check(!!r.dtrk && ev('BOTS.bot2.gy').includes(g), `Verteidiger-Trick: KI 2 wirkt Giant Growth (${bl && bl.n})`);
    check(ev('BOTS.bot2.bf').includes(b) && ev('BOTS.bot.gy').includes(a), 'Verteidiger-Trick: Blocker überlebt, Angreifer stirbt');
    check(ev('power')(b) === 2, `Pump des Blockers nach dem Kampf weg (${ev('power')(b)})`); }
  // 3: ohne Tricks normaler Kampf
  reset(); { const a = cr('bot', 'Angreifer', 2, 2); const r = fight([a], 'bot2'); check(!r.trk && !r.dtrk && ev('BOTS.bot2.life') === 18, `ohne Tricks: KI 2 nimmt 2 Schaden (${ev('BOTS.bot2.life')})`); }
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
