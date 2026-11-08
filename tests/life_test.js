const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const C = (n, type, o, x = {}) => ev('newCard')({n, type, o, img:null, ...x});
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()');
  const S = ev('S');
  ev('startBot("Test", "Test", Array(30).fill(0).map(() => ({n:"Island", type:"Basic Land — Island", o:""})))'); ev('injectBot(); commit()'); await wait(30);
  const B = () => ev('BOT.life');
  const lt = c => JSON.stringify(ev('lifeTriggers')(c).map(t => [t.ev, t.fx.map(f => f.t + (f.n ? ':' + f.n : '')).join('+')]));
  const dina = C('Dina, Soul Steeper', 'Legendary Creature — Dryad Druid', 'Deathtouch\nWhenever you gain life, each opponent loses 1 life.\n{1}{B/G}, Sacrifice another creature: Dina gets +X/+0 until end of turn, where X is the sacrificed creature\'s power.', {pw:1, tg:3});
  check(lt(dina) === '[["gain","oppAll:1"]]', `Dina erkannt: ${lt(dina)}`);
  const cases = [
    ['Sanguine Bond', 'Enchantment', 'Whenever you gain life, target opponent loses that much life.', '[["gain","oppOne:that much"]]'],
    ['Exquisite Blood', 'Enchantment', 'Whenever an opponent loses life, you gain that much life.', '[["oppLose","gain:that much"]]'],
    ['Blood Artist', 'Creature — Vampire', 'Whenever Blood Artist or another creature dies, target player loses 1 life and you gain 1 life.', '[["die","oppOne:1+gain:1"]]'],
    ['Zulaport Cutthroat', 'Creature — Human Rogue Ally', 'Whenever this creature or another creature you control dies, each opponent loses 1 life and you gain life equal to the life lost this way.', '[["die","oppAll:1+gainLost"]]'],
    ["Ajani's Pridemate", 'Creature — Cat Soldier', 'Whenever you gain life, put a +1/+1 counter on this creature.', '[["gain","selfCounter:a"]]'],
    ['Cruel Celebrant', 'Creature — Vampire', 'Whenever this creature or another creature or planeswalker you control dies, each opponent loses 1 life and you gain 1 life.', '[["die","oppAll:1+gain:1"]]'],
    ['Soul Warden', 'Creature — Human Cleric', 'Whenever another creature enters, you gain 1 life.', '[["enter","gain:1"]]'],
    ['Heliod, Sun-Crowned', 'Legendary Enchantment Creature — God', 'Indestructible\nWhenever you gain life, put a +1/+1 counter on target creature or enchantment you control.', '[]'],
  ];
  cases.forEach(([n, t, o, want]) => { const r = lt(C(n, t, o)); check(r === want, `${n}: ${r}${r === want ? '' : ' (erwartet ' + want + ')'}`); });
  // Dina: Leben erhalten → KI verliert 1
  S.bf.push(dina); ev('commit()'); await wait(10);
  let b0 = B();
  ev('S.life += 3; commit()'); await wait(30);
  check(B() === b0 - 1, `Dina: 3 Leben erhalten, KI verliert 1 (KI ${b0} → ${B()})`);
  check(/Dina, Soul Steeper: jeder Gegner verliert 1 Leben/.test($('#log').textContent), 'Log nennt Dina');
  // Lebensknopf +1 auch
  b0 = B(); d.querySelector('[data-life="1"]').click(); await wait(30);
  check(B() === b0 - 1, `+1-Knopf löst Dina aus (KI ${B()})`);
  // Leben verlieren löst nicht aus
  b0 = B(); ev('S.life -= 2; commit()'); await wait(30);
  check(B() === b0, 'Leben verlieren: kein Auslöser');
  // Ajani's Pridemate
  const pride = C("Ajani's Pridemate", 'Creature — Cat Soldier', 'Whenever you gain life, put a +1/+1 counter on this creature.', {pw:2, tg:2});
  S.bf.push(pride); ev('commit()');
  ev('S.life += 1; commit()'); await wait(30);
  check(pride.c === 1, `Pridemate bekommt eine Marke (${pride.c})`);
  // Blood Artist: eigene Kreatur stirbt
  const artist = C('Blood Artist', 'Creature — Vampire', 'Whenever Blood Artist or another creature dies, target player loses 1 life and you gain 1 life.', {pw:0, tg:1});
  const bear = C('Grizzly Bears', 'Creature — Bear', '', {pw:2, tg:2});
  S.bf = S.bf.filter(c => c !== dina); S.bf.push(artist, bear); ev('commit()'); await wait(10);
  b0 = B(); const l0 = S.life;
  ev('moveCard')(bear.u, 'gy'); await wait(40);
  check(B() === b0 - 1 && S.life === l0 + 1, `Blood Artist: Bär stirbt, KI −1, du +1 (KI ${B()}, du ${S.life})`);
  check(pride.c === 2, 'und der Lebensgewinn trifft Pridemate');
  b0 = B(); ev('moveCard')(artist.u, 'gy'); await wait(40);
  check(B() === b0 - 1, 'Blood Artist stirbt selbst: löst auch aus');
  // Schleife: Sanguine Bond + Exquisite Blood
  ev('BOT.life = 500; botChanged()'); await wait(20);
  const bond = C('Sanguine Bond', 'Enchantment', 'Whenever you gain life, target opponent loses that much life.');
  const blood = C('Exquisite Blood', 'Enchantment', 'Whenever an opponent loses life, you gain that much life.');
  S.bf = [bond, blood]; ev('commit()'); await wait(20);
  b0 = B(); ev('S.life += 2; commit()'); await wait(1500);
  check(B() < b0 - 20, `Combo läuft: KI ${b0} → ${B()}`);
  check(/Endlosschleife/.test($('#log').textContent) && ev('LT_GUARD.stopped'), 'Endlosschleife erkannt und angehalten');
  const bStop = B(); await wait(300);
  check(B() === bStop, 'nach dem Anhalten passiert nichts mehr');
  // Ausschalten
  ev('LT_GUARD.stopped = false; LT_GUARD.stamps = []; LOOK.autoLife = false'); b0 = B();
  ev('S.life += 2; commit()'); await wait(50);
  check(B() === b0, 'Automatik aus: nichts');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
