const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const C = (n, type, o, x = {}) => ev('newCard')({n, type, o, img:null, ...x});
const click = t => { const b = [...d.querySelectorAll('#modalBox button')].find(b => b.textContent.startsWith(t)); if(b) b.click(); return !!b; };
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()');
  const S = ev('S'); ev('LOOK.autoPay = false');
  ev('startBot("Test", "Test", Array(30).fill(0).map(() => ({n:"Island", type:"Basic Land — Island", o:""})))'); ev('injectBot(); commit()'); await wait(30);
  S.library.push(...Array(10).fill(0).map(() => C('Island', 'Basic Land — Island', '')));
  // Dr. Beverly Crusher
  const cr = C('Dr. Beverly Crusher', 'Legendary Creature — Human Doctor', 'If you gaining life causes a triggered ability of a permanent you control to trigger, that ability triggers an additional time.\nWhenever you gain life, put a +1/+1 counter on Dr. Crusher.', {pw:2, tg:2});
  check(JSON.stringify(ev('lifeTriggers')(cr).map(t => t.fx.map(f => f.t))) === '[["selfCounter"]]', '«Dr. Crusher» als Kurzname erkannt');
  S.bf.push(cr); ev('commit()');
  ev('S.life += 1; commit()'); await wait(40);
  check(cr.c === 2, `Crusher: 1 Leben → 2 Marken (Auslöser doppelt): ${cr.c}`);
  const dina = C('Dina, Soul Steeper', 'Legendary Creature — Dryad Druid', 'Whenever you gain life, each opponent loses 1 life.', {pw:1, tg:3});
  S.bf.push(dina); ev('commit()'); const b0 = ev('BOT.life');
  ev('S.life += 1; commit()'); await wait(40);
  check(ev('BOT.life') === b0 - 2 && cr.c === 4, `mit Dina: KI verliert 2 statt 1 (${b0} → ${ev('BOT.life')}), Crusher ${cr.c}`);
  S.bf = []; ev('commit()');
  // Urza's Saga
  const us = C("Urza's Saga", 'Enchantment Land — Urza’s Saga', '(As this Saga enters and after your draw step, add a lore counter. Sacrifice after III.)\nI — Urza\'s Saga gains "{T}: Add {C}."\nII — Urza\'s Saga gains "{2}, {T}: Create a 0/0 colorless Construct artifact creature token with \'This token gets +1/+1 for each artifact you control.\'"\nIII — Search your library for an artifact card with mana cost {0} or {1}, put it onto the battlefield, then shuffle.', {tk:[{id:'c1', n:'Construct'}]});
  check(JSON.stringify(Object.keys(ev('sagaChapters')(us))) === '["1","2","3"]', 'Urza\'s Saga: 3 Kapitel');
  S.hand.push(us); ev('commit()');
  await ev('play')(us.u); await wait(20);
  check(us.c === 1 && /Kapitel I(?!I)/.test($('#modalBox').textContent), `Eintreten: 1 Kapitelmarke, Kapitel I angezeigt`);
  click('Weiter'); await wait(5);
  check(JSON.stringify(ev('manaChoices')(us).map(o => o.add.join(''))) === '["C"]', 'Kapitel I: tappt für {C}');
  ev('TURN.active = me.id; onMyTurnStart()'); await wait(30);
  check(us.c === 2 && /Kapitel II/.test($('#modalBox').textContent), `nach dem Ziehen: 2 Marken, Kapitel II (${us.c})`);
  check([...d.querySelectorAll('#modalBox button')].some(b => /Token: Construct/.test(b.textContent)), 'Knopf: Construct-Token');
  check(/Create a 0\/0 colorless Construct/.test(us.o), 'Fähigkeit II steht jetzt auf der Karte');
  click('Weiter'); await wait(5);
  ev('onMyTurnStart()'); await wait(30);
  check(/Kapitel III \(letztes\)/.test($('#modalBox').textContent) && [...d.querySelectorAll('#modalBox button')].some(b => /Bibliothek/.test(b.textContent)), 'Kapitel III mit «Bibliothek durchsuchen»');
  click('Fertig, Saga opfern'); await wait(10);

  check(S.gy.some(c => c.n === us.n) && !S.bf.length && us.o0 === undefined && us.o.split("\n").length === 4, 'nach III geopfert, Kartentext wieder original');
  // Saga mit "I, II —"
  const hist = C('History of Benalia', 'Enchantment — Saga', '(As this Saga enters...)\nI, II — Create a 2/2 white Knight creature token with vigilance.\nIII — Knights you control get +2/+1 until end of turn.', {tk:[{id:'k', n:'Knight'}]});
  check(JSON.stringify(ev('sagaChapters')(hist)).includes('"2":"Create a 2/2'), 'History of Benalia: «I, II» erkannt');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
