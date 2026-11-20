// Mindslaver Etappe 3: ich steuere den Zug einer KI (Land, Zauber, Angriff, Zug beenden)
const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const open = () => !$('#modal').hidden;
const btns = () => [...d.querySelectorAll('#modalBox button')];
const click = async t => { const b = btns().find(b => b.textContent.trim().startsWith(t) && !b.disabled); if(b){ b.click(); await wait(60); } return !!b; };
const clickCard = async t => { const el = [...d.querySelectorAll('#modalBox .card')].find(e => e.textContent.includes(t)); if(el){ el.click(); await wait(40); } return !!el; };
const title = () => (($('#modalBox h2') || {}).textContent || '');
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()'); ev('LOOK.autoPay = false');
  ev('startBot("Test", "Test", Array(30).fill(0).map(() => ({n:"Island", type:"Basic Land — Island", o:""})))'); ev('injectBot(); commit()'); await wait(30);
  ev('S.bf = []; S.hand = []; S.life = 20; TURN = {active:me.id, n:5, starter:me.id, phase:2}; BOT.bf = []; BOT.hand = []; BOT.life = 20; botChanged(); commit()');
  // Mindslaver aktivieren: Ziel KI
  w.__ms = ev('newCard({n:"Mindslaver", type:"Legendary Artifact", o:"{4}, {T}, Sacrifice Mindslaver: You control target player during that player\'s next turn.", img:null})');
  const steps = ev('parseSteps("You control target player during that player\'s next turn.", window.__ms)');
  check(steps.some(s => s.t === 'slaver2'), `Mindslaver-Schritt erkannt (${steps.map(s => s.t).join()})`);
  const pr = ev('runSteps')(steps, w.__ms, {}); await wait(150); await click('KI'); await wait(150); await pr;
  check(!!ev('BOTS.bot.slaved') && ev('BOTS.bot.slaved.turn') === ev('BOTS.bot.turn') + 1, `KI ist für ihren nächsten Zug gesteuert (${JSON.stringify(ev('BOTS.bot.slaved'))})`);
  // KI-Zug: Hand und Kreaturen vorbereiten
  ev('withBot("bot", () => { BOT.hand = [newCard({n:"Mountain", type:"Basic Land — Mountain", o:"", img:null}), newCard({n:"Goblin", type:"Creature — Goblin", o:"", mc:"{R}", cmc:1, pw:1, tg:1, img:null}), newCard({n:"Teurer Drache", type:"Creature — Dragon", o:"Flying", mc:"{5}{R}{R}", cmc:7, pw:5, tg:5, img:null})]; BOT.bf = [newCard({n:"Bär", type:"Creature — Bear", o:"", pw:2, tg:2, img:null})]; BOT.library = Array(10).fill(0).map(() => newCard({n:"Island", type:"Basic Land — Island", o:"", img:null})); botChanged(); })');
  ev('TURN = {active:"bot", n:6, starter:me.id, phase:0}; window.__bt = false; withBot("bot", () => botTurn()).then(() => { window.__bt = true; })'); await wait(300);
  check(open() && /Mindslaver: du steuerst/.test(title()), `Steuer-Dialog erscheint (${title()})`);
  const dr = btns().find(b => /Teurer Drache/.test(b.textContent));
  check(dr && dr.disabled, 'zu teurer Zauber ist gesperrt');
  await click('Land: Mountain'); await wait(150);
  check(ev('BOTS.bot.bf.some(c => c.n === "Mountain")') && ev('BOTS.bot.landPlayed'), 'Land der KI gespielt');
  check(btns().every(b => !/Land: /.test(b.textContent) || b.disabled), 'kein zweites Land');
  await click('Goblin'); await wait(150);
  check(ev('BOTS.bot.bf.some(c => c.n === "Goblin")') && ev('BOTS.bot.bf.find(c => c.n === "Mountain").tap'), 'Goblin gewirkt, Mountain getappt');
  // Angriff mit dem Bären auf mich
  await click('Angreifen'); await wait(150);
  check(!btns().length || [...d.querySelectorAll('#modalBox .card')].every(e => !e.textContent.includes('Goblin')), 'Goblin (krank) kann nicht angreifen');
  await clickCard('Bär'); await click('Weiter'); await click('OK'); await click('Fertig'); await click('Übernehmen'); await wait(250);
  // Blockdialog bei mir: nicht blocken
  for(let i = 0; i < 4 && open() && !/Mindslaver: du steuerst/.test(title()); i++){ if(!(await click('Blocker bestätigen')) && !(await click('Nicht blocken')) && !(await click('Fertig')) && !(await click('OK'))) break; await wait(150); }
  check(ev('S.life') === 18, `Bär trifft mich für 2 (Leben ${ev('S.life')})`);
  await wait(150); if(!/Mindslaver: du steuerst/.test(title())) await wait(300);
  await click('Zug beenden'); await wait(400);
  check(w.__bt && !ev('BOTS.bot.slaved'), 'Zug der KI endet, Steuerung aufgehoben');
  // nächster KI-Zug läuft wieder normal (kein Dialog)
  ev('TURN = {active:"bot", n:8, starter:me.id, phase:0}; window.__bt = false; withBot("bot", () => botTurn()).then(() => { window.__bt = true; })'); await wait(900);
  check(!/Mindslaver: du steuerst/.test(title()), 'folgender KI-Zug ohne Steuer-Dialog');
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
