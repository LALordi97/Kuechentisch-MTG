const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report10_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  // Lively Dirge
  await reset(); lib(N('Combo', 'Instant'), N('Other', 'Instant')); S().gy.push(N('A', 'Creature', '', {cmc:1, pw:1, tg:1}), N('B', 'Creature', '', {cmc:3, pw:3, tg:3}), N('C', 'Creature', '', {cmc:2, pw:2, tg:2}));
  await cast(C('Lively Dirge', opt)); console.log('   Dialog:', title());
  [...d.querySelectorAll('#modalBox button')].filter(b => /^(Search|Return)/.test(b.textContent)).forEach(b => b.click()); await click('Ausführen'); await wait(60);
  await clickCard('Combo'); await wait(60);
  await clickCard('A'); await clickCard('B'); await click('Fertig'); await wait(60);
  check(S().gy.some(c => c.n === 'Combo') && S().bf.some(c => c.n === 'A') && S().bf.some(c => c.n === 'B'), 'Lively Dirge: Combo in den Friedhof, A und B (Manawert 4) zurück');
  // Ruthless Technomancer
  await reset(); const big = N('Troll', 'Creature — Troll', '', {pw:3, tg:3}); S().bf.push(big); ev('commit()');
  const rt = C('Ruthless Technomancer', {pw:2, tg:4}); S().hand.push(rt); ev('commit()'); await ev('play')(rt.u); await wait(80);
  await click('Ja'); await wait(40); await clickCard('Troll'); await wait(80);
  check(S().gy.includes(big) && S().bf.filter(c => c.n === 'Treasure').length === 3, 'Technomancer: Troll geopfert → 3 Schätze');
  S().gy.push(N('Beast', 'Creature — Beast', '', {pw:2, tg:2})); ev('commit()');
  const ab = ev('parseAbilities')(rt).find(a => a.kind === 'act'); ev('activateAbility')(rt, ab); await wait(60);
  [...d.querySelectorAll('#modalBox .card')].slice(0, 2).forEach(e => e.click()); await click('Fertig'); await wait(60);
  console.log('   Dialog:', title(), [...d.querySelectorAll('#modalBox .card')].map(e => e.textContent.slice(0, 6)).join(','));
  await clickCard('Beast'); await wait(60);
  check(S().bf.some(c => c.n === 'Beast' && ev('kwHas')(c, 'haste')) && S().bf.filter(c => c.n === 'Treasure').length === 1 && !S().bf.some(c => c.n === 'Troll'), 'X = 2 Schätze geopfert: Beast (Stärke 2) zurück mit Eile, Troll (3) nicht');
  // Shambling Ghast
  await reset(); ev('BOT.bf = [newCard({n:"Elf", type:"Creature — Elf", pw:1, tg:1})]; botChanged()'); await wait(20);
  const sg = C('Shambling Ghast', {pw:1, tg:1}); S().bf.push(sg); ev('commit()'); ev('moveCard')(sg.u, 'gy'); await wait(60);
  [...d.querySelectorAll('#modalBox button')].find(b => /-1\/-1/.test(b.textContent)).click(); await click('Ausführen'); await wait(60); await clickCard('Elf'); await wait(60);
  check(!ev('BOT.bf.length'), 'Shambling Ghast: Elf der KI −1/−1 und stirbt');
  // Ajani
  await reset(); const aj = C('Ajani, Nacatl Pariah // Ajani, Nacatl Avenger', {pw:1, tg:2, back:'x'}); S().bf.push(aj); ev('commit()'); await drain();
  const cat = N('Cat Warrior', 'Token Creature — Cat Warrior', '', {pw:2, tg:1, tok:true}); S().bf.push(cat); ev('commit()');
  ev('moveCard')(cat.u, 'gy'); await wait(60); await click('Ja'); await wait(40);
  check(aj.flip === true, 'Ajani: Katze stirbt → Ajani verwandelt sich');
  // Cavern of Souls
  await reset(); const cv = C('Cavern of Souls'); S().hand.push(cv); ev('commit()'); ev('moveCard')(cv.u, 'bf'); await wait(60);
  d.querySelector('#askType').value = 'Elf'; await click('Weiter'); await wait(40);
  check(cv.chosen === 'Elf', 'Cavern of Souls: Kreaturentyp Elf gewählt');
  // Dragon's Rage Channeler
  await reset(); const drc = C("Dragon's Rage Channeler", {pw:1, tg:1}); S().bf.push(drc); S().gy.push(N('a', 'Instant'), N('b', 'Sorcery'), N('c', 'Land')); ev('commit()');
  check(ev('power')(drc) === 1, 'DRC: 3 Kartentypen → 1/1');
  S().gy.push(N('d', 'Artifact Creature')); ev('commit()');
  check(ev('power')(drc) === 3 && ev('kwHas')(drc, 'flying'), 'DRC: Delirium → 3/3 fliegend');
  // Hope of Ghirapur
  await reset(); const hg = C('Hope of Ghirapur', {pw:1, tg:1}); S().bf.push(hg); ev('commit()');
  ev('activateAbility')(hg, ev('parseAbilities')(hg)[0]); await wait(60); await kiBtn();
  const lk = ev('pub()').locks.find(l => l.pid === 'bot');
  check(lk && lk.noncreature, 'Hope of Ghirapur: KI darf keine Nicht-Kreatur-Zauber');
  ev('setTurn({active:"bot", n:70, starter:me.id, phase:0})'); await wait(30);
  check(ev('pub()').locks.some(l => l.pid === 'bot'), 'gilt auch im Zug der KI');
  ev('setTurn({active:me.id, n:71, starter:me.id, phase:0})'); await wait(60); await drain();
  check(!ev('pub()').locks.some(l => l.pid === 'bot'), 'bei deinem nächsten Zug vorbei');
  // Knuckles
  await reset(); const kn = C('Knuckles the Echidna', {pw:3, tg:3}); S().bf.push(kn); for(let i = 0; i < 5; i++) S().bf.push(N('A' + i, 'Artifact')); ev('commit()');
  ev('remindTriggers("upkeep", true)'); await wait(60);
  check(!/gewinnst/.test(d.querySelector('#toast').innerHTML), 'Knuckles: 5 Artefakte → kein Sieg');
  for(let i = 0; i < 25; i++) S().bf.push(N('B' + i, 'Artifact')); ev('commit()'); ev('remindTriggers("upkeep", true)'); await wait(60);
  check(/gewinnst/.test(d.querySelector('#toast').innerHTML), 'Knuckles: 30 Artefakte → Sieg');
  // Marionette Apprentice
  await reset(); const ma = C('Marionette Apprentice', {pw:1, tg:2}); S().hand.push(ma); ev('commit()'); ev('moveCard')(ma.u, 'bf'); await wait(60);
  await click('1 Servo'); await wait(60);
  check(S().bf.some(c => c.n === 'Servo'), 'Fabricate 1: Servo-Token');
  // Rakdos, the Muscle
  await reset(); ev('BOT.library = [newCard({n:"Bolt", type:"Instant"}), newCard({n:"Hill", type:"Land"}), newCard({n:"Ox", type:"Creature"})]; botChanged()');
  const rk = C('Rakdos, the Muscle', {pw:6, tg:5}); const fod = N('Goblin', 'Creature — Goblin', '', {pw:1, tg:1, cmc:2}); S().bf.push(rk, fod); ev('commit()');
  ev('activateAbility')(rk, ev('parseAbilities')(rk).find(a => a.kind === 'act')); await wait(60); await clickCard('Goblin'); await wait(80); await kiBtn(); await wait(100);
  const ex = S().ex.filter(c => c.ow);
  check(ex.length === 2 && ex.every(c => c.castKey === 'myEnd') && rk.tap && ev('kwHas')(rk, 'indestructible'), `Rakdos: Goblin geopfert → 2 Karten der KI im Exil, Rakdos getappt und unzerstörbar (${ex.map(c => c.n)})`);
  const hill = ex.find(c => c.n === 'Hill'); const pl = hill && ev('cardMenu')(hill, 'ex').find(i => /Spielen/.test(i.l || '')); check(!!pl, 'Land aus dem Exil spielbar');
  ev('remindTriggers("end", true)'); await wait(80); await drain();
  check(!S().ex.some(c => c.ow) && ev('BOT.ex.length') === 2, 'deine Endphase: zurück ins Exil der KI');
  // Static Prison
  await reset(); ev('S.marks.E = 0'); const sp = C('Static Prison'); S().bf.push(sp); ev('commit()');
  ev('setTurn({active:me.id, n:80, starter:me.id, phase:0})'); ev('setTurn({active:me.id, n:80, starter:me.id, phase:2})'); await wait(80); await drain();
  check(S().gy.includes(sp), 'Static Prison ohne Energie: geopfert');
  // The Jolly Balloon Man
  await reset(); const jb = C('The Jolly Balloon Man', {pw:1, tg:1}); const tr = N('Troll', 'Creature — Troll', '', {pw:4, tg:4}); S().bf.push(jb, tr); ev('commit()');
  ev('activateAbility')(jb, ev('parseAbilities')(jb)[0]); await wait(60); await clickCard('Troll'); await wait(60);
  const bal = S().bf.find(c => c.n === 'Troll' && c.tok);
  check(bal && ev('power')(bal) === 1 && /Balloon/.test(bal.type) && ev('kwHas')(bal, 'flying') && ev('kwHas')(bal, 'haste'), 'Balloon Man: 1/1-Ballon-Kopie mit Fliegen und Eile');
  ev('remindTriggers("end", true)'); await wait(60); await drain();
  check(!S().bf.includes(bal), 'am Ende geopfert');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
