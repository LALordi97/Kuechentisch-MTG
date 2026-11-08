const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report_cards.json', 'utf8')).map(([n, type, o]) => [n, {n, type, o}]));
const C = (n, x = {}) => ev('newCard')({...(T[n] || {n, type:'Creature', o:''}), img:null, ...x});
const N = (n, type, o = '', x = {}) => ev('newCard')({n, type, o, img:null, ...x});
const title = () => ($('#modalBox h2') || {}).textContent || '';
const open = () => !$('#modal').hidden;
const click = async t => { const b = [...d.querySelectorAll('#modalBox button')].find(b => b.textContent.trim().startsWith(t)); if(b){ b.click(); await wait(40); } return !!b; };
const clickCard = async name => { const el = [...d.querySelectorAll('#modalBox .card')].find(e => !name || e.textContent.includes(name)); if(el){ el.click(); await wait(40); } return !!el; };
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()'); ev('LOOK.autoPay = false');
  ev('startBot("Test", "Test", Array(30).fill(0).map(() => ({n:"Island", type:"Basic Land — Island", o:""})))'); ev('injectBot(); commit()'); await wait(30);
  const S = () => ev('S'), B = () => ev('BOT.life');
  const reset = () => ev('S.bf = []; S.hand = []; S.gy = []; S.ex = []; S.library = []; S.pool = emptyPoolObj(); TURN = {active:me.id, n:7, starter:me.id, phase:2}; commit()');
  const lib = (...c) => { S().library.push(...c); ev('commit()'); };
  reset();
  // Länder
  const gs = C('Godless Shrine'); S().hand.push(gs); ev('commit()'); let l0 = S().life;
  await ev('play')(gs.u); await wait(40);
  check(/Godless Shrine kommt ins Spiel/.test(title()), 'Godless Shrine fragt: 2 Leben oder getappt');
  await click('2 Leben'); check(!gs.tap && S().life === l0 - 2, 'bezahlt: ungetappt, −2 Leben');
  const tri = C('Indatha Triome'); S().hand.push(tri); ev('commit()'); await ev('play')(tri.u); await wait(20);
  check(tri.tap, 'Triome kommt getappt');
  const pro = C('Bountiful Promenade'); S().hand.push(pro); ev('commit()'); await ev('play')(pro.u); await wait(20);
  check(pro.tap, 'Bountiful Promenade mit 1 Gegner: getappt');
  // Grim Monolith & Mana Vault
  reset(); lib(...Array(5).fill(0).map(() => N('Island', 'Basic Land — Island')));
  const gm = C('Grim Monolith'), mv = C('Mana Vault'); gm.tap = true; mv.tap = true; S().bf.push(gm, mv, N('Island', 'Basic Land — Island', '', {})); S().bf[2].tap = true; ev('commit()');
  l0 = S().life;
  ev('TURN = {active:"bot", n:8, starter:me.id, phase:2}; setTurn({active:me.id, n:9, starter:me.id, phase:0})'); await wait(60);
  check(gm.tap && mv.tap && !S().bf[2].tap, 'Enttappen: Monolith und Vault bleiben getappt, Insel nicht');
  check(/Mana Vault/.test(title()) && /\{4\}/.test($('#modalBox').textContent), 'Mana Vault fragt in der Versorgung nach {4}');
  await click('Nein'); await wait(60);
  check(S().life === l0 - 1, `Ziehschritt: Vault getappt → 1 Schaden (${l0 - S().life})`);
  // Eldritch Evolution
  reset(); ev('LOOK.autoPay = false');
  lib(N('Big', 'Creature — Giant', '', {cmc:6, pw:6, tg:6}), N('Four', 'Creature — Elf', '', {cmc:4, pw:4, tg:4}), N('Two', 'Creature — Elf', '', {cmc:2, pw:2, tg:2}));
  const fodder = N('Bear', 'Creature — Bear', '', {cmc:2, pw:2, tg:2}); S().bf.push(fodder);
  const ee = C('Eldritch Evolution', {mc:'{1}{G}{G}', cmc:3}); S().hand.push(ee); ev('commit()');
  const pe = ev('castSpell')(ee.u); await wait(40);
  check(/opfere/.test(title()), 'Eldritch Evolution: fragt zuerst, was geopfert wird');
  await clickCard('Bear'); await wait(60);
  const shown = [...d.querySelectorAll('#modalBox .card')].map(e => e.textContent);
  check(shown.length === 2 && !shown.some(t => /Big/.test(t)), `Suche bis Manawert 4: ${shown.length} Kreaturen`);
  await clickCard('Four'); await pe; await wait(40);
  check(S().bf.some(c => c.n === 'Four') && S().ex.some(c => c.n === 'Eldritch Evolution'), 'Four ins Spiel, Eldritch Evolution ins Exil');
  // Snuff Out: alternative Kosten
  reset(); ev('LOOK.autoPay = true');
  S().bf.push(N('Swamp', 'Basic Land — Swamp', '({T}: Add {B}.)')); ev('BOT.bf.push(newCard({n:"Goyf", type:"Creature — Lhurgoyf", pw:4, tg:5, mc:"{1}{G}"})); botChanged()');
  const so = C('Snuff Out', {mc:'{3}{B}', cmc:4}); S().hand.push(so); ev('commit()'); l0 = S().life;
  const ps = ev('castSpell')(so.u); await wait(40);
  check(/Snuff Out wirken/.test(title()) && /pay 4 life/.test($('#modalBox').textContent), 'Snuff Out: Wahl normal oder 4 Leben');
  await click('Stattdessen'); await wait(60); await clickCard('Goyf'); await ps; await wait(40);
  check(S().life === l0 - 4 && ev('BOT.gy.some(c => c.n === "Goyf")') && !S().bf[0].tap, 'Snuff Out: 4 Leben, Goyf zerstört, Sumpf ungetappt');
  ev('LOOK.autoPay = false');
  // Dina +X/+0, Vito Lebensverknüpfung
  reset();
  const dina = C('Dina, Soul Steeper', {pw:1, tg:3}); const elf = N('Elf', 'Creature — Elf', '', {pw:3, tg:1});
  S().bf.push(dina, elf); ev('commit()');
  ev('cardMenu')(dina, 'bf').find(i => /^Fähigkeit: \{1\}/.test(i.l || '')).f(); await wait(40); await clickCard('Elf'); await wait(60);
  check(ev('power')(dina) === 4 && S().gy.some(c => c.n === 'Elf'), `Dina: Elfe geopfert, Stärke ${ev('power')(dina)}`);
  const vito = C('Vito, Thorn of the Dusk Rose', {pw:1, tg:3}); S().bf.push(vito); ev('commit()');
  ev('cardMenu')(vito, 'bf').find(i => /^Fähigkeit: \{3\}/.test(i.l || '')).f(); await wait(60);
  check(ev('kwHas')(dina, 'lifelink') && ev('kwHas')(vito, 'lifelink'), 'Vito: alle Kreaturen haben Lebensverknüpfung');
  ev('setTurn({active:"bot", n:10, starter:me.id, phase:0})'); await wait(30);
  check(ev('power')(dina) === 1 && !ev('kwHas')(dina, 'lifelink'), 'nächster Zug: Pumpen und Lebensverknüpfung weg');
  // Beacon, Kwia, Niv-Mizzet, Treebeard
  reset(); ev('TURN = {active:me.id, n:11, starter:me.id, phase:2}');
  const be = C('Beacon of Immortality', {mc:'{5}{W}', cmc:6}); S().hand.push(be); ev('commit()'); l0 = S().life;
  const pb = ev('castSpell')(be.u); await wait(40); await click('Du'); await pb; await wait(40);
  check(S().life === l0 * 2 && S().library.some(c => c.n === 'Beacon of Immortality'), `Beacon: Leben ${l0} → ${S().life}, in die Bibliothek gemischt`);
  const kw = C('Kwia Vigorbloom'); S().bf.push(kw); ev('commit()');
  ev('S.life += 1; commit()'); await wait(60); ev('S.life += 1; commit()'); await wait(60);
  const lotus = S().bf.filter(c => c.n === 'Lotus');
  check(lotus.length === 1 && /Add three mana/.test(lotus[0].o), `Kwia: genau 1 Lotus pro Zug mit Manafähigkeit (${lotus.length})`);
  check(ev('manaChoices')(lotus[0]).length === 5, 'Lotus gibt 3 Mana einer Farbe');
  reset(); lib(...Array(5).fill(0).map(() => N('Island', 'Basic Land — Island')));
  const niv = C('Niv-Mizzet, Ghost Counsel'); S().bf.push(niv); ev('commit()'); l0 = S().life;
  ev('S.life += 3; commit()'); await wait(60); await click('Ja'); await wait(60);
  check(S().hand.length === 3 && S().life === l0, `Niv-Mizzet: 3 Leben bezahlt, 3 gezogen (Hand ${S().hand.length})`);
  reset();
  const tb = C('Treebeard, Gracious Host'), hob = N('Hobbit', 'Creature — Halfling', '', {pw:1, tg:1});
  S().bf.push(tb, hob); ev('commit()');
  ev('S.life += 2; commit()'); await wait(60); await clickCard('Hobbit'); await wait(40);
  check(hob.c === 2, `Treebeard: 2 Leben → 2 Marken auf den Halbling (${hob.c})`);
  // Black Market Connections
  reset(); lib(N('Island', 'Basic Land — Island'));
  const bmc = C('Black Market Connections'); S().bf.push(bmc); ev('commit()'); l0 = S().life;
  ev('setTurn({active:me.id, n:11, starter:me.id, phase:0})'); ev('setTurn({active:me.id, n:11, starter:me.id, phase:2})'); await wait(60);
  check(/Modus/.test(title()), 'Black Market: Modus-Auswahl in der ersten Hauptphase');
  [...d.querySelectorAll('#modalBox button')].find(b => /Sell Contraband/.test(b.textContent)).click();
  [...d.querySelectorAll('#modalBox button')].find(b => /Buy Information/.test(b.textContent)).click(); await click('Ausführen'); await wait(60);
  check(S().bf.some(c => c.n === 'Treasure') && S().hand.length === 1 && S().life === l0 - 3, 'Treasure + Karte, 3 Leben');
  // Smothering Tithe
  reset(); S().bf.push(C('Smothering Tithe')); ev('commit()');
  ev('BOT.hand.push(BOT.library.shift()); botChanged()'); await wait(60);
  check(/darf \{2\} bezahlen/.test($('#modalBox').textContent), 'Smothering Tithe: fragt, ob die KI {2} zahlt');
  await click('Nicht bezahlt'); await wait(40);
  check(S().bf.some(c => c.n === 'Treasure'), 'nicht bezahlt: Treasure');
  // Starscape Cleric kann nicht blocken, Great Henge
  reset();
  const sc = C('Starscape Cleric', {pw:2, tg:1}); 
  check(!ev('canBlock')(sc, N('X', 'Creature', '', {pw:1, tg:1})), 'Starscape Cleric kann nicht blocken');
  S().bf.push(N('Titan', 'Creature', '', {pw:6, tg:6})); ev('commit()');
  const gh = C('The Great Henge', {mc:'{7}{G}{G}', cmc:9});
  check(ev('costMods')(gh).less === 6, 'Great Henge kostet 6 weniger');
  // Enduring Tenacity
  reset();
  const et = C('Enduring Tenacity', {pw:4, tg:3}); S().bf.push(et); ev('commit()');
  ev('moveCard')(et.u, 'gy'); await wait(60);
  const et2 = S().bf.find(c => c.n === 'Enduring Tenacity');
  check(et2 && !ev('isCreature')(et2), 'Enduring Tenacity kommt als Verzauberung zurück');
  // Emiel: Blinken
  reset(); const em = C('Emiel the Blessed', {pw:4, tg:4}), sf = N('Stoneforge', 'Creature — Kor', '', {pw:1, tg:2});
  S().bf.push(em, sf); S().pool.C = 3; ev('LOOK.autoPay = true; commit()');
  ev('cardMenu')(em, 'bf').find(i => /^Fähigkeit: \{3\}/.test(i.l || '')).f(); await wait(60); await clickCard('Stoneforge'); await wait(80);
  check(S().bf.some(c => c.n === 'Stoneforge') && !S().ex.length, 'Emiel: Stoneforge verbannt und zurück');
  if(open() && /pay/.test($('#modalBox').textContent)) await click('Nein');
  ev('LOOK.autoPay = false');
  // Tyvar −2, Noxious Revival, Finale (Friedhof), Agatha
  reset(); lib(N('A', 'Instant'), N('B', 'Sorcery'), N('Rag', 'Creature — Monkey', '', {cmc:1, pw:2, tg:1}));
  const ty = C('Tyvar, Jubilant Brawler', {loy:3}); S().bf.push(ty); ty.c = 3; ev('commit()');
  ev('cardMenu')(ty, 'bf').find(i => /^−2:/.test(i.l || '')).f(); await wait(60); await click('Ja'); await wait(40); await clickCard('Rag'); await wait(40);
  check(S().bf.some(c => c.n === 'Rag') && S().gy.length === 2, 'Tyvar −2: 3 gemahlen, Rag zurück ins Spiel');
  const nr = C('Noxious Revival', {mc:'{B/P}', cmc:1}); S().hand.push(nr); ev('commit()');
  const pn = ev('castSpell')(nr.u); await wait(40); await clickCard('A'); await pn; await wait(30);
  check(S().library[0] && S().library[0].n === 'A', 'Noxious Revival: A oben auf die Bibliothek');
  reset(); ev('BOT.gy.push(newCard({n:"Griselbrand", type:"Creature — Demon", pw:7, tg:7})); botChanged()'); await wait(20);
  const ag = C("Agatha's Soul Cauldron"), myc = N('Ballista', 'Artifact Creature', '', {pw:0, tg:0});
  S().bf.push(ag, myc); ev('commit()');
  ev('cardMenu')(ag, 'bf').find(i => /^Fähigkeit: \{T\}/.test(i.l || '')).f(); await wait(60);
  await clickCard('Griselbrand'); await wait(60); await clickCard('Ballista'); await wait(40);
  check(ev('BOT.ex.some(c => c.n === "Griselbrand")') && myc.c === 1, 'Agatha: Griselbrand aus dem KI-Friedhof verbannt, +1/+1 auf Ballista');
  // Silence-Sperre und Grand Abolisher beim Gegner
  reset(); ev('others.bot.locks = [{key:turnKey(), noncreature:false, src:"Silence"}]');
  const op = N('Opt', 'Instant', 'Draw a card.', {mc:'{U}', cmc:1}); S().hand.push(op); ev('commit()');
  const po = ev('castSpell')(op.u); await wait(40);
  check(/eigentlich nicht erlaubt/.test(title()) && /Silence/.test($('#modalBox').textContent), 'Silence vom Gegner: Warnung beim Wirken');
  await click('Nicht wirken'); await po;
  check(S().hand.includes(op), 'nicht gewirkt, Karte bleibt auf der Hand');
  ev('others.bot.locks = []');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
