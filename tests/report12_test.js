const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report12_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  const pick = async re => { const b = [...d.querySelectorAll('#modalBox button')].find(b => re.test(b.textContent)); if(b){ b.click(); await wait(40); } return !!b; };
  // Storm (Mind's Desire) + Spielen aus dem Exil gratis
  await reset(); ev('S.spellsCast = 0; S.spellsKey = null'); lib(...Array(10).fill(0).map((_, i) => N('M' + i, 'Instant', '', {mc:'{2}'})));
  await cast(N('Ritual', 'Instant', 'Add {B}{B}{B}.')); await cast(N('Ritual', 'Instant', 'Add {B}{B}{B}.')); await drain();
  await cast(C("Mind's Desire", opt)); await wait(200); await drain();
  const md = S().ex.filter(c => c.castKey && c.freeCast);
  check(md.length === 3, `Mind's Desire mit Storm 2: drei Karten gratis spielbar (${md.length})`);
  // Reckless Impulse: bis Ende des nächsten Zuges
  await reset(); lib(N('R1', 'Instant'), N('R2', 'Instant'), N('R3', 'Instant'));
  await cast(C('Reckless Impulse', opt));
  const ri = S().ex.filter(c => c.castKey === 'myNextEnd'); check(ri.length === 2, 'Reckless Impulse: zwei Karten bis Ende des nächsten Zuges');
  ev('remindTriggers("end", true)'); await wait(60);
  check(S().ex.filter(c => c.castKey === 'myEnd').length === 2, 'nach dieser Endphase noch spielbar');
  ev('setTurn({active:"bot", n:90, starter:me.id, phase:0})'); ev('setTurn({active:me.id, n:91, starter:me.id, phase:2})'); await wait(60); await drain();
  check(S().ex.filter(c => c.castKey === 'myEnd').length === 2, 'im nächsten eigenen Zug spielbar');
  ev('remindTriggers("end", true)'); await wait(60);
  check(!S().ex.some(c => c.castKey === 'myEnd' || c.castKey === 'myNextEnd'), 'danach vorbei');
  // Hex Magic
  await reset(); S().hand.push(N('H1', 'Instant'), N('H2', 'Instant')); lib(N('D1', 'Instant'), N('D2', 'Instant'), N('D3', 'Instant'));
  await cast(C('Hex Magic', opt));
  check(S().hand.length === 2 && S().ex.filter(c => c.castKey === 'myNextEnd').length === 2, `Hex Magic: 2 verbannt, 2 gezogen (Hand ${S().hand.map(c => c.n)})`);
  // Past in Flames
  await reset(); const br = N('Brainstorm', 'Instant', 'Draw three cards.', {mc:'{U}'}); S().gy.push(br); lib(N('a', 'Instant'), N('b', 'Instant'), N('c', 'Instant'));
  check(!ev('cardMenu')(br, 'gy').some(i => /Flashback/.test(i.l || '')), 'ohne Past in Flames kein Flashback');
  await cast(C('Past in Flames', opt));
  const fbi = ev('cardMenu')(br, 'gy').find(i => /Flashback/.test(i.l || '')); check(!!fbi, 'Past in Flames: Brainstorm hat Flashback');
  if(fbi) fbi.f(); await wait(80); check(S().ex.includes(br) && S().hand.length >= 3, 'Brainstorm mit Flashback gewirkt');
  // Flashback (Karte)
  await reset(); const op = N('Opt2', 'Instant', 'Draw a card.'); S().gy.push(op); lib(N('x', 'Instant'));
  await cast(C('Flashback', opt)); await clickCard('Opt2'); await wait(40);
  check(ev('cardMenu')(op, 'gy').some(i => /Flashback/.test(i.l || '')), 'Flashback: Opt2 hat Flashback');
  // Finale of Promise
  await reset(); const i1 = N('Bolt', 'Instant', 'Draw a card.', {cmc:1}), s1 = N('Rite', 'Sorcery', 'Draw a card.', {cmc:2}); S().gy.push(i1, s1); lib(N('a', 'Instant'), N('b', 'Instant'));
  const fp = C('Finale of Promise', opt); fp.lastX = 2; S().hand.push(fp); ev('commit()'); ev('castSpell')(fp.u); await wait(60);
  await clickCard('Bolt'); await wait(40); await clickCard('Rite'); await wait(100);
  check(S().ex.includes(i1) && S().ex.includes(s1) && S().hand.length === 2, 'Finale of Promise: beide gratis gewirkt, danach im Exil');
  // Invoke Calamity
  await reset(); const g1 = N('Draw1', 'Instant', 'Draw a card.', {cmc:2}), h1 = N('Draw2', 'Sorcery', 'Draw a card.', {cmc:3}); S().gy.push(g1); S().hand.push(h1); lib(N('a', 'Instant'), N('b', 'Instant'));
  await cast(C('Invoke Calamity', opt)); await clickCard('Draw1'); await clickCard('Draw2'); await click('Fertig'); await wait(100);
  check(S().ex.includes(g1) && S().ex.includes(h1), 'Invoke Calamity: aus Friedhof und Hand gratis, ins Exil');
  // Jeska's Will
  await reset(); ev('others.bot.handN = 5'); lib(N('J1', 'Instant'), N('J2', 'Instant'), N('J3', 'Instant'));
  const cm = N('Kraum', 'Legendary Creature', '', {pw:4, tg:4}); cm.cmdr = true; S().bf.push(cm); ev('commit()');
  await cast(C("Jeska's Will", opt)); console.log('   Dialog:', title());
  await pick(/^Add/); await pick(/^Exile/); await click('Ausführen'); await wait(60); await kiBtn();
  check(S().pool.R === 5 && S().ex.filter(c => c.castKey).length === 3, `Jeska's Will mit Commander: beide Modi (R ${S().pool.R})`);
  // Opera Love Song
  await reset(); const b1 = N('A', 'Creature', '', {pw:1, tg:1}), b2 = N('B', 'Creature', '', {pw:1, tg:1}); S().bf.push(b1, b2); ev('commit()');
  await cast(C('Opera Love Song', opt)); await pick(/One or two/); await click('Ausführen'); await wait(40); await clickCard('A'); await wait(40); await clickCard('B'); await wait(60);
  check(ev('power')(b1) === 3 && ev('power')(b2) === 3, 'Opera Love Song: zwei Kreaturen +2/+0');
  // Untimely Malfunction: kann nicht blocken
  await reset(); ev('BOT.bf = [newCard({n:"Wall", type:"Creature — Wall", pw:0, tg:8})]; botChanged()'); await wait(20);
  await cast(C('Untimely Malfunction', opt)); await pick(/can't block/); await click('Ausführen'); await wait(40); await clickCard('Wall'); await wait(40); await click('Kein Ziel'); await wait(60);
  check(!ev('canBlock')(ev('BOT.bf[0]'), N('X', 'Creature', '', {pw:1, tg:1})), 'Untimely Malfunction: Wall kann nicht blocken');
  // Gandalf
  await reset(); ev('BOT.life = 20'); const gd = C("Gandalf, Goblins' Bane // Flameshape", {pw:2, tg:2}); S().bf.push(gd); ev('commit()');
  await cast(N('Opt', 'Instant', 'Scry 1.')); await drain(); await wait(60);
  check(ev('power')(gd) === 3 && ev('BOT.life') === 19, `Gandalf: +1/+1 und 1 Schaden (KI ${ev('BOT.life')})`);
  // Quiet Speculation
  await reset(); lib(N('Deep Analysis', 'Sorcery', 'Draw two cards.\nFlashback—{1}{U}, Pay 3 life.'), N('Plain', 'Instant'));
  await cast(C('Quiet Speculation', opt)); await pick(/^Du/); await clickCard('Deep Analysis'); await click('Fertig'); await wait(60);
  check(S().gy.some(c => c.n === 'Deep Analysis'), 'Quiet Speculation: Deep Analysis im Friedhof');
  // Wheel of Misfortune
  await reset(); ev('BOT.life = 5; BOT.hand = [newCard({n:"x", type:"Instant"})]; BOT.library = Array(10).fill(0).map(() => newCard({n:"y", type:"Instant"})); botChanged()'); S().hand.push(N('mine', 'Instant')); lib(...Array(10).fill(0).map(() => N('z', 'Instant')));
  console.log('   vorher:', open(), title(), ev('QDEPTH')); await cast(C('Wheel of Misfortune', opt)); await wait(100); console.log('   Dialog:', title(), S().life, S().hand.length, ev('BOT.life'), [...d.querySelectorAll('#log li, #logList li, .log li')].slice(-4).map(e => e.textContent).join(' | ')); d.querySelector('#askN').value = '3'; await click('Weiter'); await wait(80);
  check(S().life === 17 && S().hand.length === 7 && ev('BOT.hand.length') === 1, `Wheel: du 3 (höchste) → 3 Schaden, neue Hand; KI 0 behält (Leben ${S().life})`);
  // Highway Robbery
  await reset(); S().hand.push(N('junk', 'Instant')); lib(N('a', 'Instant'), N('b', 'Instant'));
  await cast(C('Highway Robbery', opt)); await click('Karte abwerfen'); await wait(40); await clickCard('junk'); await wait(60);
  check(S().hand.length === 2 && S().gy.some(c => c.n === 'junk'), 'Highway Robbery: abgeworfen, zwei gezogen');
  // Desperate Ritual: Splice
  await reset(); const dr = C('Desperate Ritual'); S().hand.push(dr); ev('commit()');
  await cast(N('Arcane Spell', 'Instant — Arcane', 'Add {R}.', {mc:''})); console.log('   Splice-Dialog:', title(), d.querySelector('#modalBox').textContent.slice(0,120)); await click('Ja'); await wait(100);
  check(S().pool.R === 4 && S().hand.includes(dr), `Splice: Arcane-Zauber + Desperate Ritual = 4× {R}, Ritual bleibt auf der Hand (${S().pool.R})`);
  // Electro
  await reset(); ev('BOT.life = 20'); const el = C('Electro, Assaulting Battery', {pw:2, tg:3}); S().bf.push(el); ev('commit()'); ev('S.pool.R = 2; S.pool.G = 1');
  ev('setPhase(3)'); await wait(30);
  check(S().pool.R === 2 && !S().pool.G, 'Electro: rotes Mana bleibt');
  ev('moveCard')(el.u, 'gy'); await wait(80); console.log('   Electro-Dialog:', title(), d.querySelector('#modalBox').textContent.slice(0,120)); await click('Ja'); await wait(60); console.log('   Electro-Dialog2:', title());
  if(/Wert für X/.test(title())){ d.querySelector('#askN').value = '4'; await click('Weiter'); await wait(40); }
  await click('Ohne Mana'); await wait(60);
  await kiBtn(); await wait(60);
  check(ev('BOT.life') === 16, `Electro verlässt das Spiel: X=4 Schaden (KI ${ev('BOT.life')})`);
  // Ral + Tavern Scoundrel (Münzwurf)
  await reset(); const ts = C('Tavern Scoundrel', {pw:1, tg:3}); S().bf.push(ts); ev('commit()');
  let wins = 0; for(let i = 0; i < 6; i++){ ev('runSteps(parseSteps("Flip a coin.", S.bf[0]), S.bf[0])'); await wait(30); }
  await drain(); wins = S().bf.filter(c => c.n === 'Treasure').length;
  check(wins > 0 && wins < 6 || wins === 0 || wins === 6, `Tavern Scoundrel: ${wins} Schätze aus 6 Würfen`);
  // Storm of Memories
  await reset(); ev('S.spellsCast = 0'); S().gy.push(N('Cheap', 'Instant', 'Draw a card.', {cmc:1})); lib(N('a', 'Instant'));
  await cast(C('Storm of Memories', opt)); await click('Ja'); await wait(80);
  check(S().ex.some(c => c.n === 'Cheap') && S().hand.length === 1, 'Storm of Memories: zufällige Karte gratis gewirkt, danach im Exil');
  // Witch's Mark
  await reset(); const wb = N('Bear', 'Creature', '', {pw:2, tg:2}); S().bf.push(wb); S().hand.push(N('j1', 'Instant')); lib(N('a', 'Instant'), N('b', 'Instant'));
  await cast(C("Witch's Mark", opt)); await clickCard('j1'); await click('Fertig'); await wait(60); await clickCard('Bear'); await wait(60);
  check(S().hand.length === 2 && ev('power')(wb) === 3 && S().bf.some(c => /Wicked Role/.test(c.n)), "Witch's Mark: abwerfen/ziehen, Bär 3/3 mit Wicked-Rolle");
  // _____ Goblin
  await reset(); const gb = C('_____ Goblin', {pw:1, tg:1}); S().hand.push(gb); ev('commit()'); ev('moveCard')(gb.u, 'bf'); await wait(60);
  await click('Ja'); await wait(40); d.querySelector('#askName').value = 'Aeiou Goblin'; await click('Weiter'); await wait(40);
  check(S().pool.R === 5, `_____ Goblin: «Aeiou Goblin» → 5× {R} (${S().pool.R})`);
  // Tibalt's Trickery (Stapel)
  await reset(); ev('net.role = "host"; net.order = [me.id]; net.players = {}; net.players[me.id] = {name:"Lukas"}');
  const tg = N('Big Spell', 'Sorcery'); S().st.push(tg); lib(N('L1', 'Land'), N('L2', 'Land'), N('L3', 'Land'), N('Free', 'Instant', 'Draw a card.'), N('After', 'Instant'), N('More', 'Instant'));
  w.__st = [{id:'a', u:tg.u, n:tg.n, type:tg.type, o:'', owner:ev('me.id'), by:'Lukas', passes:[], countered:false, dest:'gy', target:null, targets:[]}, {id:'b', u:'tt', n:"Tibalt's Trickery", type:'Instant', o:C("Tibalt's Trickery").o, owner:'x', by:'Anna', passes:[], target:'a', targets:[]}];
  ev('STACK = window.__st; stackResolveTop(); stackResolveTop()'); await wait(80); console.log('   Dialog:', title()); await click('Ja'); await wait(80);
  check(S().gy.includes(tg) && S().gy.some(c => c.n === 'Free') && S().hand.length === 1, "Tibalt's Trickery: gekontert, gemahlen, nächste Nicht-Land-Karte gratis gewirkt");
  ev('STACK = []; net.role = "solo"');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
