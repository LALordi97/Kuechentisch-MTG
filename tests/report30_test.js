const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report30_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  const acts = c => ev("parseAbilities")(c).filter(a => a.kind === "act");
  const put = (...c) => { S().bf.push(...c); ev('commit()'); };
  // Price of Progress
  await reset(); put(N('Dorf', 'Land', '{T}: Add {G}.')); ev('BOT.bf.push(newCard({n:"Volcanic", type:"Land — Mountain Island", o:""}), newCard({n:"Tundra", type:"Land — Plains Island", o:""})); botChanged(); S.life = 20; BOT.life = 20');
  await cast(C('Price of Progress')); await wait(150); await drain();
  check(S().life === 18 && B() === 16, `Price of Progress: 2 an mich, 4 an KI (${S().life}/${B()})`);
  // Dread of Night
  await reset(); const wk = N('Weiss', 'Creature — Human', '', {mc:'{W}', pw:2, tg:2}); put(C('Dread of Night'), wk);
  check(ev('power')(wk) === 1 && ev('tough')(wk) === 1, 'Dread of Night: weisse Kreatur −1/−1');
  // Leyline of the Void (Gegner) – Bot-Karte ins Exil
  await reset(); put(C('Leyline of the Void')); ev('BOT.bf.push(newCard({n:"Bär", type:"Creature — Bear", o:"", pw:2, tg:2})); botChanged()'); ev('botToZone(BOT.bf[0], "gy")');
  check(ev('BOT.ex.some(c => c.n === "Bär") && !BOT.gy.some(c => c.n === "Bär")'), 'Leyline of the Void: Karte des Gegners ins Exil');
  // Scythecat Cub: zweite Auflösung verdoppelt
  await reset(); const cub = C('Scythecat Cub', {pw:2, tg:2}); put(cub); cub.c = 3;
  const cubAb = ev("parseAbilities")(cub).find(a => a.kind === "trig");
  for(let i = 0; i < 2; i++){ ev('runAbility')(cub, cubAb, {}); await wait(100); await clickCard('Scythecat'); await wait(100); await drain(); }
  check(cub.c === 8, `Scythecat Cub: 3 → 4 → 8 Marken (${cub.c})`);
  // Dark Depths
  await reset(); const dd = C('Dark Depths'); dd.c = 1; put(dd); ev("S.pool = emptyPoolObj(); S.pool.C = 3; commit()");
  ev("activateAbility")(dd, acts(dd)[0]); await wait(200); await drain();
  check(S().bf.some(c => c.n === 'Marit Lage' && c.pw === 20) && !S().bf.includes(dd), 'Dark Depths: letzte Eismarke → Marit Lage');
  // Terminus
  await reset(); const t1 = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(t1); ev('BOT.bf.push(newCard({n:"Ork", type:"Creature — Orc", o:"", pw:2, tg:2})); botChanged()');
  await cast(C('Terminus')); await wait(200); await drain();
  check(S().library[S().library.length - 1] === t1 && ev('!BOT.bf.length && BOT.library.some(c => c.n === "Ork")'), 'Terminus: alle Kreaturen unter die Bibliotheken');
  // Choke
  await reset(); const isl = N('Island', 'Basic Land — Island', '', {tap:true}); const mtn = N('Mountain', 'Basic Land — Mountain', '', {tap:true}); put(C('Choke'), isl, mtn); isl.tap = true; mtn.tap = true; ev('onMyTurnStart()'); await wait(150); await drain();
  check(isl.tap && !mtn.tap, 'Choke: Inseln enttappen nicht');
  // Maze of Ith
  await reset(); const atk = N('Angreifer', 'Creature — Bear', '', {pw:5, tg:5}); put(atk); atk.mazeKey = ev('turnKey()');
  check(/Maze of Ith/.test(JSON.stringify(ev('computeCombat')([atk], new Map(), {})) || ''), 'Maze of Ith: kein Kampfschaden');
  // Brazen Borrower
  { const bb = C('Brazen Borrower // Petty Theft', {pw:3, tg:1, kw:['Flash', 'Flying']}); check(!ev('canBlock')(bb, N('X', 'Creature', '', {pw:1, tg:1})) && ev('canBlock')(bb, N('F', 'Creature', 'Flying', {pw:1, tg:1, kw:['Flying']})), 'Brazen Borrower: blockt nur Flieger'); }
  // Planar Nexus
  check(ev('typeMatch')(C('Planar Nexus'), 'Desert') && ev('typeMatch')(C('Planar Nexus'), 'Gate'), 'Planar Nexus: alle Nicht-Standard-Landtypen');
  // Mycosynth Lattice
  await reset(); const bear = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(C('Mycosynth Lattice'), bear); ev('castWarn ? 0 : 0; commit()');
  ev('manaChoices')(bear); check(/Artifact/.test(bear.type), 'Mycosynth Lattice: Kreatur ist ein Artefakt');
  // It That Heralds the End
  await reset(); put(C('It That Heralds the End'));
  { const big = N('Gross', 'Creature — Eldrazi', '', {mc:'{7}', cmc:7}); const r = JSON.stringify(ev('costMods')(big)); check(/−1|"less":1/.test(r), `It That Heralds the End: farblos 7+ kostet 1 weniger (${r.slice(0, 80)})`); }
  // Containment Priest
  await reset(); put(C('Containment Priest', {pw:2, tg:2})); const reb = N('Wiederbelebt', 'Creature — Zombie', '', {pw:2, tg:2}); S().gy.push(reb); ev('commit()'); ev('moveCard')(reb.u, 'bf'); await wait(60);
  check(S().ex.includes(reb), 'Containment Priest: nicht gewirkte Kreatur ins Exil');
  // Emrakul
  await reset(); const em = C('Emrakul, the Aeons Torn'); S().hand.push(em); S().gy.push(N('Alt', 'Instant')); ev('commit()'); ev('moveCard')(em.u, 'gy'); await wait(60);
  check(!S().gy.length && S().library.length === 2, 'Emrakul: Friedhof in die Bibliothek gemischt');
  // Eumidian Hatchery
  await reset(); const eh = C('Eumidian Hatchery'); put(eh); eh.c = 2; ev('moveCard')(eh.u, 'gy'); await wait(250); await drain();
  check(S().bf.filter(c => c.tok && /Insect/.test(c.type)).length === 2, 'Eumidian Hatchery: zwei Insekten');
  // Eldrazi Linebreaker xExpr
  await reset(); put(N('E1', 'Creature — Eldrazi', '', {pw:1, tg:1}), N('E2', 'Creature — Eldrazi Drone', '', {pw:1, tg:1}));
  check(ev('xExpr')('the number of Eldrazi you control', {}, {}) === 2, 'Eldrazi Linebreaker: zählt Eldrazi');
  // Monarch: Zugende
  await reset(); lib(N('Z', 'Instant')); ev('S.monarch = true; commit()'); ev('remindTriggers')('end', true); await wait(250); await drain(); ev('S.monarch = false');
  check(S().hand.length === 1, 'Monarch: zieht am Zugende');
  // Kaito
  await reset(); const kai = C('Kaito, Bane of Nightmares'); kai.c = 4; put(kai);
  check(ev('isCreature')(kai) && kai.pw === 3, 'Kaito: im eigenen Zug 3/4-Ninja');
  // Aether Vial
  await reset(); const av = C('Aether Vial'); av.c = 2; put(av); const two = N('Zwei', 'Creature — Bear', '', {cmc:2, pw:2, tg:2}); S().hand.push(two); ev('commit()');
  ev("activateAbility")(av, acts(av)[0]); await wait(150); await clickCard('Zwei'); await wait(100);
  check(S().bf.includes(two), 'Aether Vial: Kreatur mit Manawert 2 ins Spiel');
  // Surgical Extraction (eigene Karten)
  await reset(); const s1 = N('Ziel', 'Instant'), s2 = N('Ziel', 'Instant'), s3 = N('Ziel', 'Instant'); S().gy.push(s1); S().hand.push(s2); S().library.push(s3); ev('commit()');
  await cast(C('Surgical Extraction', {mc:''})); await wait(150); await clickCard('Ziel'); await wait(150); await drain();
  check(S().ex.filter(c => c.n === 'Ziel').length === 3, `Surgical Extraction: alle 3 gleichnamigen verbannt (${S().ex.filter(c => c.n === 'Ziel').length})`);
  // Aluren
  await reset(); put(C('Aluren')); const al = N('Klein', 'Creature — Elf', '', {mc:'{2}{G}', cmc:3, pw:1, tg:1}); S().hand.push(al); ev('commit()'); ev('play')(al.u); await wait(100);
  console.log('Aluren:', title(), btns().join('|')); await click('Gratis'); await wait(150); await drain();
  check(S().bf.includes(al), 'Aluren: Kreatur gratis');
  console.log(fails ? `\n${fails} FEHLER` : "\nALLES OK"); process.exit(0);
})();
