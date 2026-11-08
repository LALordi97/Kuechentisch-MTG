const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report7_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  // Deafening Silence
  await reset(); ev('BOT.bf = [newCard({n:"Deafening Silence", type:"Enchantment"})]; botChanged()'); await wait(20);
  await cast(N('Opt', 'Instant', 'Scry 1.')); await drain();
  w.__c = N('Ponder', 'Sorcery'); ev('castWarn(window.__c, "hand")'); await wait(40);
  check(/Deafening Silence/.test(d.querySelector('#modalBox').textContent), 'Deafening Silence: zweiter Nicht-Kreatur-Zauber wird gewarnt');
  await click('Nicht wirken');
  // Marvin
  await reset(); lib(N('X', 'Instant'));
  const mv = C('Marvin, Murderous Mimic', {pw:2, tg:2}); const dr = N('Looter', 'Creature — Human', '{T}: Draw a card.', {pw:1, tg:1}); S().bf.push(mv, dr); ev('commit()');
  const mi = ev('cardMenu')(mv, 'bf').find(i => /Looter \(Marvin\)/.test(i.l || '')); check(!!mi, 'Marvin hat die Fähigkeit von Looter');
  if(mi) mi.f(); await wait(60);
  check(mv.tap && !dr.tap && S().hand.length === 1, 'Marvin tappt sich selbst und zieht');
  // Spellskite
  await reset();
  ev('net.role = "host"; net.order = [me.id]; net.players = {}; net.players[me.id] = {name:"Lukas"}; STACK = [{id:"s1", n:"Lightning Bolt", owner:"x", by:"Anna", passes:[], o:"Lightning Bolt deals 3 damage to any target."}]');
  const sk = C('Spellskite', {pw:0, tg:4}); S().bf.push(sk); ev('commit()');
  ev('runSteps(parseSteps("Change a target of target spell or ability to this creature.", S.bf[0]), S.bf[0])'); await wait(40); await click('Lightning Bolt'); await wait(40);
  check(/Spellskite/.test(ev('STACK[0].redirect') || ''), `Spellskite: Lightning Bolt zielt jetzt auf Spellskite (${ev('STACK[0].redirect')})`);
  ev('STACK = []; net.role = "solo"');
  // Deadpool
  await reset(); ev('BOT.hand = []; BOT.library = [newCard({n:"Plains", type:"Basic Land — Plains"})]; botChanged()');
  const bear = N('Bear', 'Creature — Bear', 'When this creature enters, you gain 1 life.', {pw:2, tg:2}); S().bf.push(bear); ev('commit()');
  const dp = C('Deadpool, Trading Card', {pw:3, tg:3}); S().hand.push(dp); ev('commit()'); ev('moveCard')(dp.u, 'bf'); await wait(80); await clickCard('Bear'); await wait(60);
  check(/you gain 1 life/.test(dp.o) && /Sacrifice this creature: Each other player/.test(bear.o), 'Deadpool tauscht die Textbox mit dem Bären');
  ev('runSteps(parseSteps("Each other player draws a card.", S.bf[0]), S.bf[0])'); await wait(60);
  check(ev('BOT.hand.length') === 1, 'Deadpool: jeder andere Spieler zieht');
  // Deathrite Shaman
  await reset(); S().gy.push(N('Wasteland', 'Land')); const ds = C('Deathrite Shaman', {pw:1, tg:2}); S().bf.push(ds); ev('commit()');
  ev('runSteps(parseSteps(parseAbilities(S.bf[0])[0].text, S.bf[0]), S.bf[0])'); await wait(40); await clickCard('Wasteland'); await wait(40);
  [...d.querySelectorAll('#modalBox button')].find(b => /Schwarz|Black|\{B\}|B/.test(b.textContent) && !/Schliessen/.test(b.textContent))?.click(); await wait(40);
  check(S().ex.some(c => c.n === 'Wasteland') && Object.values(ev('S.pool')).reduce((a, b) => a + b, 0) === 1, `Deathrite: Land verbannt, 1 Mana (${ev('poolStr(S.pool)')})`);
  // Derevi
  await reset(); const dv = C('Derevi, Empyrial Tactician', {pw:2, tg:3}); ev('S.cz = []'); S().cz.push(dv); ev('commit()');
  const czi = ev('cardMenu')(dv, 'cz').find(i => /Kommandozone ins Spiel/.test(i.l || '')); check(!!czi, 'Derevi: «aus der Kommandozone ins Spiel» im Menü');
  if(czi) czi.f(); await wait(80); await drain();
  check(S().bf.includes(dv), 'Derevi ist im Spiel');
  // Esika
  await reset(); const es = C('Esika, God of the Tree // The Prismatic Bridge', {pw:1, tg:4}); const lg = N('Thrasios', 'Legendary Creature — Merfolk', '', {pw:1, tg:3}); S().bf.push(es, lg); ev('commit()');
  check(ev('kwHas')(lg, 'vigilance') && (ev('manaChoices')(lg) || []).length === 5, 'Esika: Thrasios hat Wachsamkeit und tappt für jede Farbe');
  // Ioreth
  await reset(); const io = C('Ioreth of the Healing House', {pw:1, tg:4}); const l1 = N('A', 'Legendary Creature — Elf', '', {pw:1, tg:1}), l2 = N('B', 'Legendary Creature — Elf', '', {pw:1, tg:1}); l1.tap = l2.tap = true; S().bf.push(io, l1, l2); ev('commit()');
  ev('runSteps(parseSteps(parseAbilities(S.bf[0])[1].text, S.bf[0]), S.bf[0])'); await wait(60);
  check(!l1.tap && !l2.tap, 'Ioreth: zwei legendäre Kreaturen enttappt');
  // Legolas's Quick Reflexes
  await reset(); ev('BOT.bf = [newCard({n:"Goblin", type:"Creature — Goblin", pw:1, tg:1})]; botChanged()'); await wait(20);
  const big = N('Giant', 'Creature — Giant', '', {pw:4, tg:4}); big.tap = true; S().bf.push(big); ev('commit()');
  await cast(C("Legolas's Quick Reflexes", opt)); await clickCard('Giant'); await wait(60);
  check(!big.tap && ev('kwHas')(big, 'reach') && ev('kwHas')(big, 'hexproof'), 'Legolas: Riese enttappt, Reichweite und Fluchsicher');
  ev('toggleTap')(big); await wait(80); await clickCard('Goblin'); await wait(60);
  check(!ev('BOT.bf.length'), 'Riese getappt → 4 Schaden tötet den Goblin');
  ev('setTurn({active:"bot", n:60, starter:me.id, phase:0})'); await wait(30);
  check(!/becomes tapped/.test(big.o), 'Zugende: verliehene Fähigkeit weg');
  ev('setTurn({active:me.id, n:61, starter:me.id, phase:2})'); await wait(60); await drain();
  // Loki's Scepter
  await reset(); ev('BOT.bf = [newCard({n:"Dino", type:"Creature — Dinosaur", pw:6, tg:6})]; BOT.bf[0].tap = true; botChanged()'); await wait(20);
  const ls = C("Loki's Scepter"); S().hand.push(ls); ev('commit()'); ev('moveCard')(ls.u, 'bf'); await wait(80); await clickCard('Dino'); await wait(150);
  const dino = S().bf.find(c => c.n === 'Dino');
  check(dino && !dino.tap && ev('kwHas')(dino, 'haste'), 'Loki: Dino übernommen, enttappt, mit Eile');
  ev('setTurn({active:"bot", n:62, starter:me.id, phase:0})'); await wait(60);
  check(!S().bf.some(c => c.n === 'Dino') && ev('BOT.bf.some(c => c.n === "Dino")'), 'Zugende: Dino zurück zur KI');
  ev('setTurn({active:me.id, n:63, starter:me.id, phase:2})'); await wait(60); await drain();
  // Mount Doom
  await reset(); ev('BOT.bf = [newCard({n:"Dino", type:"Creature — Dinosaur", pw:6, tg:6}), newCard({n:"Goblin", type:"Creature — Goblin", pw:1, tg:1})]; botChanged()'); await wait(20);
  const md = C('Mount Doom'); const mine1 = N('Elf', 'Creature — Elf', '', {pw:1, tg:1}), mine2 = N('Bear', 'Creature — Bear', '', {pw:2, tg:2}); S().bf.push(md, mine1, mine2); ev('commit()');
  ev('runSteps(parseSteps(parseAbilities(S.bf[0])[0].text, S.bf[0]), S.bf[0])'); await wait(60);
  await clickCard('Elf'); await clickCard('Bear'); await click('Zerstören'); await wait(60);
  check(S().bf.includes(mine1) && S().bf.includes(mine2) && !ev('BOT.bf.length'), 'Mount Doom: eigene behalten, Kreaturen der KI zerstört');
  // Selvala
  await reset(); lib(N('X', 'Instant'));
  const sv = C('Selvala, Heart of the Wilds', {pw:2, tg:3}); S().bf.push(sv); ev('commit()');
  const gi = N('Giant', 'Creature — Giant', '', {pw:5, tg:5}); S().hand.push(gi); ev('commit()'); ev('moveCard')(gi.u, 'bf'); await wait(80); await click('Ja'); await wait(40);
  check(S().hand.length === 1, 'Selvala: stärkste Kreatur → du ziehst');
  // Sisay
  await reset(); const si = C('Sisay, Weatherlight Captain', {pw:2, tg:2}); S().bf.push(si, N('L1', 'Legendary Creature', '', {mc:'{G}{U}'}), N('L2', 'Legendary Artifact', '', {mc:'{B}'}), N('NL', 'Creature', '', {mc:'{R}'})); ev('commit()');
  check(ev('power')(si) === 5, `Sisay: drei Farben → 5/5 (${ev('power')(si)})`);
  // Teferi
  await reset(); ev('BOT.bf = [newCard({n:"Dino", type:"Creature — Dinosaur", pw:6, tg:6})]; botChanged()'); await wait(20);
  const te = C('Teferi, Who Slows the Sunset'); te.c = 3; const art = N('Sol Ring', 'Artifact'); art.tap = true; S().bf.push(te, art); ev('commit()');
  ev('activateLoyalty')(te, ev('parseAbilities')(te)[0]); await wait(60);
  await clickCard('Sol Ring'); await wait(40); await clickCard('Dino'); await wait(40); await click('Kein Ziel'); await wait(60);
  check(!art.tap && ev('BOT.bf[0].tap') && S().life === 22, 'Teferi +1: Sol Ring enttappt, Dino getappt, +2 Leben');
  // Touch the Spirit Realm (Channel)
  await reset(); ev('BOT.bf = [newCard({n:"Dino", type:"Creature — Dinosaur", pw:6, tg:6})]; BOT.ex = []; botChanged()'); await wait(20);
  const tr = C('Touch the Spirit Realm'); S().hand.push(tr); const myRock = N('Rock', 'Artifact'); S().bf.push(myRock); ev('commit()');
  const ch = ev('cardMenu')(tr, 'hand').find(i => /Aus der Hand/.test(i.l || '')); if(ch) ch.f(); await wait(80); await clickCard('Dino'); await wait(80);
  check(ev('BOT.ex.some(c => c.n === "Dino")'), 'Channel: Dino der KI im Exil');
  ev('remindTriggers("end", true)'); await wait(80);
  check(ev('BOT.bf.some(c => c.n === "Dino")'), 'Endphase: Dino kommt zurück');
  const tr2 = C('Touch the Spirit Realm'); S().hand.push(tr2); ev('commit()');
  const ch2 = ev('cardMenu')(tr2, 'hand').find(i => /Aus der Hand/.test(i.l || '')); if(ch2) ch2.f(); await wait(80); await clickCard('Rock'); await wait(80);
  check(S().ex.includes(myRock), 'eigener Rock im Exil'); ev('remindTriggers("end", true)'); await wait(80);
  check(S().bf.includes(myRock), 'und am Zugende zurück');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
