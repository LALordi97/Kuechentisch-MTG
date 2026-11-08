const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report16_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  // Eldrazi Confluence: dreimal Token
  await reset(); await cast(C('Eldrazi Confluence', opt));
  const plus = [...d.querySelectorAll('#modalBox .row')].find(r => /Create a 3\/2/.test(r.textContent)).querySelector('button'); plus.click(); plus.click(); plus.click(); await click('Ausführen'); await wait(80);
  check(S().bf.filter(c => /Eldrazi Horror/.test(c.n) || /Horror/.test(c.type)).length === 3, 'Eldrazi Confluence: dreimal derselbe Modus → drei Horror-Token');
  // Flackern
  await reset(); ev('BOT.bf = [newCard({n:"Dino", type:"Creature", pw:6, tg:6})]; botChanged()'); await wait(20);
  await cast(C('Eldrazi Confluence', opt)); const pl2 = [...d.querySelectorAll('#modalBox .row')].find(r => /Exile target/.test(r.textContent)).querySelector('button'); pl2.click(); 
  const p3 = [...d.querySelectorAll('#modalBox .row')].find(r => /Create a 3\/2/.test(r.textContent)).querySelector('button'); p3.click(); p3.click(); await click('Ausführen'); await wait(60); await clickCard('Dino'); await wait(100);
  check(ev('BOT.bf.some(c => c.n === "Dino" && c.tap)'), 'Exil und getappt zurück: Dino der KI');
  // Geosurge
  await reset(); await cast(C('Geosurge', opt)); check(S().pool.R === 7, 'Geosurge: 7× {R}');
  // Improvisation Capstone + Paradigm
  await reset(); lib(N('A', 'Instant', 'Draw a card.', {cmc:1}), N('Hill', 'Land'), N('B', 'Sorcery', 'Draw a card.', {cmc:3}), N('C', 'Instant'), N('D', 'Instant'));
  const ic = C('Improvisation Capstone', opt); await cast(ic); await clickCard('A'); await clickCard('B'); await click('Fertig'); await wait(120);
  check(S().gy.some(c => c.n === 'A') && S().gy.some(c => c.n === 'B') && S().hand.length === 2 && S().ex.includes(ic) && S().paradigms.length === 1, 'Capstone: A und B gratis, Paradigm gemerkt');
  ev('setTurn({active:"bot", n:95, starter:me.id, phase:0})'); ev('setTurn({active:me.id, n:96, starter:me.id, phase:0})'); await wait(50); ev('setPhase(2)'); await wait(80); console.log('   Dialog:', title());
  await click('Nein'); await wait(40); await drain();
  // Rionya
  await reset(); ev('S.isKey = turnKey(); S.isCount = 2'); const ri = C('Rionya, Fire Dancer', {pw:3, tg:4}); const gob = N('Goblin', 'Creature — Goblin', '', {pw:1, tg:1}); S().bf.push(ri, gob); ev('commit()');
  ev('remindTriggers("combat", true)'); await wait(60); await clickCard('Goblin'); await wait(80);
  const gt = S().bf.filter(c => c.n === 'Goblin' && c.tok);
  check(gt.length === 3 && gt.every(c => ev('kwHas')(c, 'haste')), `Rionya: 1 + 2 Zauber = 3 Goblin-Kopien mit Eile (${gt.length})`);
  ev('remindTriggers("end", true)'); await wait(60); await drain();
  check(!S().bf.some(c => c.n === 'Goblin' && c.tok), 'am Ende verbannt');
  // Squee
  await reset(); const sq = C('Squee, the Immortal', {pw:2, tg:1}); S().gy.push(sq); ev('commit()');
  const si = ev('cardMenu')(sq, 'gy').find(i => /Wirken aus dem Friedhof/.test(i.l || '')); check(!!si, 'Squee: aus dem Friedhof wirkbar'); if(si) si.f(); await wait(80);
  check(S().bf.includes(sq), 'Squee im Spiel');
  // Twinflame mit Strive
  await reset(); const t1 = N('A', 'Creature', '', {pw:1, tg:1}), t2 = N('B', 'Creature', '', {pw:2, tg:2}); S().bf.push(t1, t2); ev('commit()');
  await cast(C('Twinflame', opt)); await clickCard('A'); await clickCard('B'); await click('Fertig'); await wait(80);
  check(S().bf.filter(c => c.tok).length === 2 && S().bf.filter(c => c.tok).every(c => ev('kwHas')(c, 'haste')), 'Twinflame: zwei Token-Kopien mit Eile');
  // Wandering Archaic
  await reset(); lib(N('a', 'Instant'), N('b', 'Instant'));
  const wa = C('Wandering Archaic // Explore the Vastlands', {pw:4, tg:4}); S().bf.push(wa); ev('commit()');
  ev('abilEvent({kind:"oppCast", c:{n:"Divination", type:"Sorcery", o:"Draw two cards."}, opp:true, pid:"bot"})'); await wait(60);
  await click('Nicht bezahlt'); await wait(40); await click('Ja'); await wait(80);
  check(S().hand.length === 2, 'Wandering Archaic: KI zahlt nicht → Kopie von Divination zieht 2');
  // Cursed Mirror
  await reset(); const bigc = N('Troll', 'Creature — Troll', '', {pw:4, tg:4}); S().bf.push(bigc); ev('commit()');
  const cm = C('Cursed Mirror'); S().hand.push(cm); ev('commit()'); ev('moveCard')(cm.u, 'bf'); await wait(60); await clickCard('Troll'); await wait(60);
  check(cm.n === 'Troll' && ev('kwHas')(cm, 'haste'), 'Cursed Mirror: Troll mit Eile');
  ev('setTurn({active:"bot", n:97, starter:me.id, phase:0})'); await wait(30);
  check(cm.n === 'Cursed Mirror', 'nach dem Zug wieder Cursed Mirror');
  ev('setTurn({active:me.id, n:98, starter:me.id, phase:2})'); await wait(60); await drain();
  // Etali
  await reset(); ev('BOT.library = [newCard({n:"Hill", type:"Land"}), newCard({n:"Ox", type:"Creature", pw:2, tg:2})]; BOT.ex = []; botChanged()'); lib(N('Mine', 'Creature', '', {pw:1, tg:1}));
  const et = C('Etali, Primal Conqueror // Etali, Primal Sickness', {pw:7, tg:7}); S().hand.push(et); ev('commit()'); ev('moveCard')(et.u, 'bf'); await wait(100);
  await clickCard('Mine'); await clickCard('Ox'); await click('Fertig'); await wait(120);
  check(S().bf.some(c => c.n === 'Mine') && S().bf.some(c => c.n === 'Ox' && c.ow), 'Etali: eigene Kreatur und Ox der KI gratis gewirkt');
  // Fear of Missing Out
  await reset(); const fm = C('Fear of Missing Out', {pw:2, tg:3}); const tapped = N('Elf', 'Creature', '', {pw:1, tg:1}); tapped.tap = true; S().bf.push(fm, tapped); S().gy.push(N('i', 'Instant'), N('s', 'Sorcery'), N('l', 'Land'), N('a', 'Artifact')); ev('commit()');
  w.__f = fm; ev('abilEvent({kind:"attack", c:window.__f, first:true})'); await wait(60); await clickCard('Elf'); await wait(60);
  check(!tapped.tap, 'Fear of Missing Out: Delirium → Elf enttappt');
  ev('abilEvent({kind:"attack", c:window.__f, first:true})'); await wait(60);
  check(!open(), 'nur beim ersten Angriff pro Zug');
  // Hellkite Courser
  await reset(); const cmd = N('Kraum', 'Legendary Creature', '', {pw:4, tg:4}); cmd.cmdr = true; ev('S.cz = []'); S().cz.push(cmd); ev('commit()');
  const hc = C('Hellkite Courser', {pw:6, tg:5}); S().hand.push(hc); ev('commit()'); ev('moveCard')(hc.u, 'bf'); await wait(60); await click('Ja'); await wait(60);
  check(S().bf.includes(cmd) && ev('kwHas')(cmd, 'haste'), 'Hellkite Courser: Commander im Spiel mit Eile');
  ev('remindTriggers("end", true)'); await wait(60);
  check(S().cz.includes(cmd), 'am Ende zurück in die Kommandozone');
  // Hunting Velociraptor: Prowl
  await reset(); const hv = C('Hunting Velociraptor', {pw:3, tg:2}); S().bf.push(hv); ev('commit()');
  w.__h = hv; ev('abilEvent({kind:"combatDamage", c:window.__h, pid:"bot", much:3, first:true}, [window.__h])'); await wait(40);
  const dino = N('Big Dino', 'Creature — Dinosaur', '', {pw:8, tg:8, mc:'{6}{R}{R}'}); w.__c = dino; ev('castCosts(window.__c)'); await wait(40);
  await click('Mit Prowl'); await wait(30);
  check(dino.payMc === '{2}{R}', `Prowl: Dino kostet ${dino.payMc}`);
  // Jaxis
  await reset(); lib(N('d', 'Instant')); S().hand.push(N('junk', 'Instant')); const jx = C('Jaxis, the Troublemaker', {pw:3, tg:3}); const og = N('Ogre', 'Creature — Ogre', '', {pw:3, tg:3}); S().bf.push(jx, og); ev('commit()');
  ev('activateAbility')(jx, ev('parseAbilities')(jx)[0]); await wait(60); await clickCard('junk'); await wait(40); await clickCard('Ogre'); await wait(60);
  const ot = S().bf.find(c => c.n === 'Ogre' && c.tok);
  check(ot && ev('kwHas')(ot, 'haste') && /When this token dies, draw a card/.test(ot.o), 'Jaxis: Ogre-Kopie mit Eile und Ziehen beim Sterben');
  // Metamorphosis
  await reset(); const vic = N('Six', 'Creature', '', {pw:6, tg:6, cmc:6}); S().bf.push(vic); ev('commit()');
  await cast(C('Metamorphosis', opt)); await wait(40); await clickCard('Six'); await wait(60); console.log('   Dialog2:', title(), [...d.querySelectorAll('#modalBox button')].map(b=>b.textContent).join('|')); await pick(/Grün|Green|\{G\}|^G$/); await wait(40);
  check(S().pool.G === 7, `Metamorphosis: 1 + 6 = 7× {G} (${ev('poolStr(S.pool)')})`);
  // Emrakul
  await reset(); const em = C('Emrakul, the Promised End', {pw:13, tg:13}); w.__e = em; ev('markOnCast(window.__e)'); await wait(60); await kiBtn(); await wait(60);
  console.log('   EM:', d.querySelector('#toast').innerHTML.slice(0,300), [...d.querySelectorAll('#log > div')].slice(-3).map(x => x.textContent).join(' || '));
  check(/steuerst den nächsten Zug/.test(d.querySelector('#toast').innerHTML), 'Emrakul: Hinweis zum gesteuerten Zug');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
