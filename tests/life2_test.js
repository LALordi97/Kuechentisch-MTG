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
  const S = ev('S'); ev('LOOK.autoPay = false');
  ev('startBot("Test", "Test", Array(30).fill(0).map(() => ({n:"Island", type:"Basic Land — Island", o:""})))'); ev('injectBot(); commit()'); await wait(30);
  const B = () => ev('BOT.life');
  const lt = c => JSON.stringify(ev('lifeTriggers')(c).map(t => [t.ev, t.fx.map(f => f.t + (f.n ? ':' + f.n : '')).join('+')]));
  const cases = [
    ['Essence Warden', 'Creature — Elf Shaman', 'Whenever another creature enters, you gain 1 life.', '[["enter","gain:1"]]'],
    ['Soul Warden', 'Creature — Human Cleric', 'Whenever another creature enters, you gain 1 life.', '[["enter","gain:1"]]'],
    ["Soul's Attendant", 'Creature — Human Cleric', 'Whenever another creature enters, you may gain 1 life.', '[["enter","gain:1"]]'],
    ['Impact Tremors', 'Enchantment', 'Whenever a creature you control enters, this enchantment deals 1 damage to each opponent.', '[["enter","oppAllDmg:1"]]'],
    ['Thragtusk', 'Creature — Beast', 'When Thragtusk enters, you gain 5 life.\nWhen Thragtusk leaves the battlefield, create a 3/3 green Beast creature token.', '[["enter","gain:5"]]'],
    ['Scoured Barrens', 'Land', 'This land enters tapped.\nWhen this land enters, you gain 1 life.\n{T}: Add {W} or {B}.', '[["enter","gain:1"]]'],
    ['Suture Priest', 'Creature — Cleric', 'Whenever another creature you control enters, you may gain 1 life.\nWhenever a creature enters under an opponent\'s control, you may have that player lose 1 life.', '[["enter","gain:1"]]'],
  ];
  cases.forEach(([n, t, o, want]) => { const r = lt(C(n, t, o)); check(r === want, `${n}: ${r}${r === want ? '' : ' (erwartet ' + want + ')'}`); });
  const warden = C('Essence Warden', 'Creature — Elf Shaman', 'Whenever another creature enters, you gain 1 life.', {pw:1, tg:1});
  S.hand.push(warden); ev('commit()'); let l0 = S.life;
  await ev('play')(warden.u); await wait(30);
  check(S.life === l0, 'Essence Warden selbst: kein Leben (another)');
  const bear = C('Grizzly Bears', 'Creature — Bear', '', {mc:'{1}{G}', cmc:2, pw:2, tg:2});
  S.hand.push(bear); ev('commit()'); l0 = S.life;
  await ev('play')(bear.u); await wait(30);
  check(S.life === l0 + 1, `eigene Kreatur kommt ins Spiel: +1 (${S.life})`);
  l0 = S.life; ev('TOKCACHE')['t'] = {n:'Soldier', type:'Token Creature — Soldier', pw:1, tg:1, img:null}; ev('createTokenFromId')('t', 'Soldier', 3); await wait(40);
  check(S.life === l0 + 3, `3 Tokens: +3 (${S.life})`);
  l0 = S.life; const land = C('Forest', 'Basic Land — Forest', ''); S.hand.push(land); ev('commit()'); await ev('play')(land.u); await wait(20);
  check(S.life === l0, 'Land kommt ins Spiel: nichts');
  // Kreatur der KI kommt ins Spiel
  l0 = S.life;
  ev('BOT.bf.push(newCard({n:"Goblin Guide", type:"Creature — Goblin Scout", pw:2, tg:2})); botChanged()'); await wait(40);
  check(S.life === l0 + 1, `Kreatur der KI kommt ins Spiel: +1 (${S.life})`);
  // Impact Tremors nur bei eigenen
  const tremors = C('Impact Tremors', 'Enchantment', 'Whenever a creature you control enters, this enchantment deals 1 damage to each opponent.');
  S.bf.push(tremors); ev('commit()'); await wait(10);
  let b0 = B();
  ev('BOT.bf.push(newCard({n:"Goblin Guide", type:"Creature — Goblin Scout", pw:2, tg:2})); botChanged()'); await wait(40);
  check(B() === b0, 'Impact Tremors: Kreatur der KI löst nicht aus');
  const elf = C('Llanowar Elves', 'Creature — Elf Druid', '', {mc:'{G}', cmc:1, pw:1, tg:1}); S.hand.push(elf); ev('commit()');
  await ev('play')(elf.u); await wait(40);
  check(B() === b0 - 1, `Impact Tremors: eigene Kreatur, 1 Schaden an die KI (${B()})`);
  // Blood Artist: Kreatur der KI stirbt
  const artist = C('Blood Artist', 'Creature — Vampire', 'Whenever Blood Artist or another creature dies, target player loses 1 life and you gain 1 life.', {pw:0, tg:1});
  S.bf.push(artist); ev('commit()'); await wait(10);
  b0 = B(); l0 = S.life;
  ev('(() => { const g = BOT.bf.find(c => c.n === "Goblin Guide"); botToZone(g, "gy"); botChanged(); })()'); await wait(40);
  check(B() === b0 - 1 && S.life >= l0 + 1, `Blood Artist: Kreatur der KI stirbt, KI ${b0} → ${B()}, du ${l0} → ${S.life}`);
  // Thragtusk
  l0 = S.life; const tt = C('Thragtusk', 'Creature — Beast', 'When Thragtusk enters, you gain 5 life.', {mc:'{4}{G}', cmc:5, pw:5, tg:3});
  S.hand.push(tt); ev('commit()'); await ev('play')(tt.u); await wait(40);
  check(S.life >= l0 + 5, `Thragtusk: +5 (und Warden +1): ${l0} → ${S.life}`);
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
