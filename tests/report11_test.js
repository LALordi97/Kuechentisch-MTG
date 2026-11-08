const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report11_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
const C = (n, x = {}) => ev('newCard')({...T[n], img:null, ...x});
const N = (n, type, o = '', x = {}) => ev('newCard')({n, type, o, img:null, ...x});
const title = () => ($('#modalBox h2') || {}).textContent || '';
const open = () => !$('#modal').hidden;
const click = async t => { const b = [...d.querySelectorAll('#modalBox button')].find(b => b.textContent.trim().startsWith(t)); if(b){ b.click(); await wait(40); } return !!b; };
const clickCard = async name => { const el = [...d.querySelectorAll('#modalBox .card')].find(e => !name || e.textContent.includes(name)); if(el){ el.click(); await wait(40); } return !!el; };
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()'); ev('LOOK.autoPay = false');
  ev('startBot("Test", "Test", Array(30).fill(0).map(() => ({n:"Island", type:"Basic Land — Island", o:""})))'); ev('injectBot(); commit()'); await wait(30);
  const S = () => ev('S'), B = () => ev('BOT.life');
  const drain = async () => { for(let i = 0; i < 6 && open(); i++){ if(!(await click('Abbrechen')) && !(await click('Kein')) && !(await click('Nein')) && !(await click('Erledigt'))) break; await wait(40); } };
  const reset0 = () => ev('S.bf = []; S.hand = []; S.gy = []; S.ex = []; S.library = []; S.pool = emptyPoolObj(); S.lifeLock = null; S.protect = null; BOT.bf = []; botChanged(); TURN = {active:me.id, n:20, starter:me.id, phase:2}; commit()');
  const reset = async () => { await wait(80); await drain(); reset0(); await wait(20); };
  const lib = (...c) => { S().library.push(...c); ev('commit()'); };
  const btns = () => [...d.querySelectorAll('#modalBox button')].map(b => b.textContent.trim());
  const M = n => ev('cardMenu')(n.c, n.z);
  const cast = async c => { S().hand.push(c); ev('commit()'); ev('castSpell')(c.u); await wait(80); };
  const opt = {mc:''};
  // Demonic Consultation
  await reset();
  const kiBtn = async () => { const b = [...d.querySelectorAll('#modalBox button')].find(b => /^KI/.test(b.textContent)); if(b){ b.click(); await wait(80); } return !!b; };
  // Doomsday
  await reset(); ev('S.life = 20'); lib(...['L1','L2','L3','L4','L5','L6','L7'].map(n => N(n, 'Instant'))); S().gy.push(N('G1', 'Instant'), N('Oracle', 'Creature'));
  await cast(C('Doomsday', opt));
  for(const n of ['Oracle','L3','G1','L1','L2']){ await clickCard(n); await wait(20); } await click('Fertig'); await wait(80);
  check(S().library.map(c => c.n).join() === 'Oracle,L3,G1,L1,L2' && S().life === 10 && S().ex.length === 5 && S().gy.every(c => c.n === 'Doomsday'), `Doomsday: Stapel ${S().library.map(c => c.n)}, Leben ${S().life}`);
  // Hide on the Ceiling
  await reset(); ev('BOT.bf = [newCard({n:"Dino", type:"Creature — Dinosaur", pw:6, tg:6}), newCard({n:"Sol Ring", type:"Artifact"})]; BOT.ex = []; botChanged()'); await wait(20);
  const myC = N('Bear', 'Creature — Bear', '', {pw:2, tg:2}); S().bf.push(myC); ev('commit()');
  const hc = C('Hide on the Ceiling', {mc:''}); hc.lastX = 3; S().hand.push(hc); ev('commit()'); ev('castSpell')(hc.u); await wait(80);
  console.log('   Dialog:', title());
  if(/Wert für X/.test(title())){ d.querySelector('#askN').value = '3'; await click('Weiter'); await wait(40); }
  await clickCard('Dino'); await wait(60); await clickCard('Sol Ring'); await wait(60); await clickCard('Bear'); await wait(60);
  check(ev('BOT.ex.length') === 2 && S().ex.includes(myC), 'Hide on the Ceiling: drei Ziele verbannt');
  ev('remindTriggers("end", true)'); await wait(80); await drain();
  check(ev('BOT.bf.length') === 2 && S().bf.includes(myC), 'am Ende alle zurück');
  // Barrowgoyf
  await reset(); ev('BOT.gy = [newCard({n:"x", type:"Instant"}), newCard({n:"y", type:"Land"})]; botChanged()'); await wait(20);
  S().gy.push(N('z', 'Artifact Creature')); lib(N('Spell', 'Sorcery'), N('Elf', 'Creature — Elf', '', {pw:1, tg:1}), N('Hill', 'Land'), N('More', 'Instant'));
  const bg = C('Barrowgoyf'); S().bf.push(bg); ev('commit()');
  check(ev('power')(bg) === 4 && ev('tough')(bg) === 5, `Barrowgoyf: 4 Typen → 4/5 (${ev('power')(bg)}/${ev('tough')(bg)})`);
  w.__b = bg; ev('abilEvent({kind:"combatDamage", c:window.__b, pid:"bot", much:3, first:true}, [window.__b])'); await wait(60);
  await click('Ja'); await wait(60); await clickCard('Elf'); await wait(60);
  check(S().hand.some(c => c.n === 'Elf') && S().gy.some(c => c.n === 'Spell') && S().library.length === 1, 'Barrowgoyf: 3 gemahlen, Elf auf die Hand');
  // Dauthi Voidwalker
  await reset(); ev('BOT.bf = [newCard({n:"Ox", type:"Creature", pw:2, tg:2})]; BOT.gy = []; BOT.ex = []; botChanged()'); await wait(20);
  const dv = C('Dauthi Voidwalker', {pw:3, tg:2}); S().bf.push(dv); ev('commit()');
  ev('hitOpponent("bot", {kind:"destroy", card:BOT.bf[0].u, src:"Test"})'); await wait(60);
  check(ev('BOT.ex.some(c => c.n === "Ox" && c.void)') && !ev('BOT.gy.length'), 'Dauthi: Kreatur der KI geht mit Leere-Marke ins Exil');
  ev('activateAbility')(dv, ev('parseAbilities')(dv).find(a => a.kind === 'act')); await wait(80); await clickCard('Ox'); await wait(100);
  const ox = S().ex.find(c => c.n === 'Ox');
  check(ox && ox.freeCast && ox.castKey, 'Dauthi geopfert: Ox in deinem Exil, gratis spielbar');
  const mi = ox && ev('cardMenu')(ox, 'ex').find(i => /Spielen|Wirken/.test(i.l || '')); if(mi) mi.f(); await wait(100);
  check(S().bf.some(c => c.n === 'Ox'), 'Ox gespielt');
  // Edge of Autumn
  await reset(); lib(N('Forest', 'Basic Land — Forest')); for(let i = 0; i < 5; i++) S().bf.push(N('Island', 'Basic Land — Island')); ev('commit()');
  await cast(C('Edge of Autumn', opt)); await wait(40);
  check(!open() && S().library.length === 1, 'Edge of Autumn: 5 Länder → nichts');
  S().bf.splice(0, 2); ev('commit()'); await cast(C('Edge of Autumn', opt)); await clickCard('Forest'); await wait(60);
  check(S().bf.some(c => c.n === 'Forest' && c.tap), '3 Länder → Wald getappt ins Spiel');
  // Fatal Push
  await reset(); ev('BOT.bf = [newCard({n:"Three", type:"Creature", cmc:3, pw:3, tg:3})]; botChanged(); S.leftKey = null'); await wait(20);
  await cast(C('Fatal Push', opt)); await clickCard('Three'); await wait(80);
  check(ev('BOT.bf.length') === 1, 'Fatal Push ohne Revolt: Manawert 3 bleibt');
  const fetch = N('Fetch', 'Land'); S().bf.push(fetch); ev('commit()'); ev('moveCard')(fetch.u, 'gy'); await wait(20);
  await cast(C('Fatal Push', opt)); await clickCard('Three'); await wait(80);
  check(!ev('BOT.bf.length'), 'mit Revolt: zerstört');
  // Murktide Regent
  await reset(); const mr = C('Murktide Regent', {pw:3, tg:3}); S().bf.push(mr); const ins = N('Bolt', 'Instant'), cr = N('Ox', 'Creature'); S().gy.push(ins, cr); ev('commit()');
  ev('moveCard')(ins.u, 'ex'); ev('moveCard')(cr.u, 'ex'); await wait(80);
  check(mr.c === 1, `Murktide: nur der Spontanzauber gibt eine Marke (${mr.c})`);
  // Quantum Riddler
  await reset(); lib(...Array(5).fill(0).map((_, i) => N('Q' + i, 'Instant'))); S().bf.push(C('Quantum Riddler', {pw:4, tg:6})); ev('commit()');
  ev('draw(1)'); check(S().hand.length === 2, 'Quantum Riddler: 0 Karten auf der Hand → zieht 2');
  ev('draw(1)'); check(S().hand.length === 3, 'mit 2 Karten: normal 1');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
