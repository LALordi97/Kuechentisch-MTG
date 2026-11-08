const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report2_cards.json', 'utf8')).map(([n, type, o]) => [n, {n, type, o}]));
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
  // Carpet of Flowers
  await reset(); ev('for(let i=0;i<3;i++) BOT.bf.push(newCard({n:"Island", type:"Basic Land — Island"})); botChanged()'); await wait(20);
  S().bf.push(C('Carpet of Flowers')); ev('commit()');
  ev('setTurn({active:me.id, n:21, starter:me.id, phase:0})'); ev('setTurn({active:me.id, n:21, starter:me.id, phase:2})'); await wait(60);
  await click('Ja'); await wait(30);
  [...d.querySelectorAll('#modalBox button')].find(b => /Grün/.test(b.textContent)).click(); await wait(40);
  check(S().pool.G === 3, `Carpet: 3 Inseln der KI → {G}{G}{G} (${ev('poolStr(S.pool)')})`);
  ev('setTurn({active:me.id, n:21, starter:me.id, phase:4})'); await wait(60);
  check(!open(), 'zweite Hauptphase: schon benutzt, keine Frage');
  // Delney
  await reset();
  const del = C('Delney, Streetwise Lookout', {pw:2, tg:2}); const small = N('Elf', 'Creature — Elf', 'When Elf enters, you gain 1 life.', {pw:1, tg:1});
  S().bf.push(del); ev('commit()');
  check(!ev('canBlock')(N('Giant', 'Creature', '', {pw:4, tg:4}), del) && ev('canBlock')(N('Bear', 'Creature', '', {pw:2, tg:2}), del), 'Delney: Stärke ≥3 kann nicht blocken, Stärke 2 schon');
  const sp = N('Spawner', 'Creature — Elf', 'When this creature enters, create a 1/1 green Squirrel creature token.', {pw:1, tg:1});
  S().hand.push(sp); ev('commit()'); await ev('play')(sp.u); await wait(80);
  check(S().bf.filter(c => c.n === 'Squirrel').length === 2, `Delney: Auslöser doppelt → 2 Eichhörnchen (${S().bf.filter(c => c.n === 'Squirrel').length})`);
  // Heliod, Serra Ascendant
  await reset();
  const hel = C('Heliod, Sun-Crowned', {mc:'{2}{W}', pw:5, tg:5}); S().bf.push(hel); ev('commit()');
  check(!ev('isCreature')(hel), 'Heliod: Hingabe 1 → keine Kreatur');
  S().bf.push(N('W', 'Enchantment', '', {mc:'{W}{W}{W}{W}'})); ev('commit()');
  check(ev('isCreature')(hel), 'Hingabe 5 → Kreatur');
  const sa = C('Serra Ascendant', {pw:1, tg:1}); S().bf.push(sa); ev('S.life = 20; commit()');
  check(ev('power')(sa) === 1 && !ev('kwHas')(sa, 'flying'), 'Serra Ascendant bei 20 Leben: 1/1');
  ev('S.life = 30; commit()');
  check(ev('power')(sa) === 6 && ev('kwHas')(sa, 'flying'), 'bei 30 Leben: 6/6 fliegend');
  // Necrodominance
  await reset(); ev('S.life = 20');
  S().bf.push(C('Necrodominance')); const tok = N('Bear', 'Creature', '', {pw:2, tg:2}); S().bf.push(tok); ev('commit()');
  ev('moveCard')(tok.u, 'gy'); await wait(20);
  check(S().ex.includes(tok) && !S().gy.length, 'Necrodominance: Kreatur stirbt → Exil statt Friedhof');
  for(let i = 0; i < 7; i++) S().hand.push(N('C' + i, 'Instant'));
  lib(...Array(5).fill(0).map(() => N('Island', 'Basic Land — Island')));
  ev('commit()'); ev('remindTriggers("end", true)'); await wait(60);
  await click('Nein'); await wait(40);
  check(/maximal 5/.test(title()), `Aufräumen: Handgrösse 5 (${title().slice(0, 60)})`);
  await clickCard('C0'); await clickCard('C1'); await click('Fertig'); await wait(40);
  check(S().hand.length === 5 && S().ex.some(c => c.n === 'C0'), 'zwei abgeworfen, ins Exil (Necrodominance)');
  // Necropotence: Abwerfen → Exil
  await reset(); S().bf.push(N('Necropotence', 'Enchantment', T['Necropotence'].o)); const dc = N('Junk', 'Instant'); S().hand.push(dc); ev('commit()');
  ev('moveCard')(dc.u, 'gy'); await wait(60);
  check(S().ex.includes(dc), 'Necropotence: abgeworfene Karte geht ins Exil');
  // Scurry Oak: Evolve + Eichhörnchen
  await reset();
  const oak = C('Scurry Oak', {pw:1, tg:1}); S().bf.push(oak); ev('commit()');
  const bigc = N('Troll', 'Creature — Troll', '', {pw:3, tg:3}); S().hand.push(bigc); ev('commit()'); await ev('play')(bigc.u); await wait(60);
  check(oak.c === 1, 'Scurry Oak entwickelt sich');
  await click('Ja'); await wait(40);
  check(S().bf.some(c => c.n === 'Squirrel'), 'und erzeugt ein Eichhörnchen');
  // Teferi's Protection
  await reset(); ev('S.life = 7; commit()');
  const tp = C("Teferi's Protection", {mc:'{2}{W}', cmc:3}); const myLand = N('Plains', 'Basic Land — Plains'); S().bf.push(myLand); S().hand.push(tp); ev('commit()');
  await ev('castSpell')(tp.u); await wait(80);
  ev('S.life -= 10; commit()'); await wait(60);
  check(S().life === 7, `Teferi's Protection: Leben bleibt bei 7 (${S().life})`);
  check(myLand.phased && ev('pub()').protect && S().ex.some(c => c.n === "Teferi's Protection"), 'Länder ausgephast, Schutz, Karte im Exil');
  ev('setTurn({active:"bot", n:22, starter:me.id, phase:0})'); ev('setTurn({active:me.id, n:23, starter:me.id, phase:0})'); await wait(60);
  ev('S.life -= 2; commit()'); await wait(40);
  check(!myLand.phased && S().life === 5 && !ev('pub()').protect, 'nächster Zug: alles wieder normal');
  // Flare of Fortitude: weisse Kreatur opfern
  await reset(); ev('S.life = 10; commit()');
  const wk = N('Knight', 'Creature — Human Knight', '', {mc:'{W}', pw:2, tg:2}); S().bf.push(wk);
  const fl = C('Flare of Fortitude', {mc:'{2}{W}{W}', cmc:4}); S().hand.push(fl); ev('commit()');
  const pf = ev('castSpell')(fl.u); await wait(40); await click('Stattdessen'); await wait(40); await clickCard('Knight'); await pf; await wait(60);
  ev('S.life -= 5; commit()'); await wait(40);
  check(S().gy.some(c => c.n === 'Knight') && S().life === 10, 'Flare: Ritter geopfert, Leben bleibt');
  // The One Ring: gewirkt → Schutz
  await reset();
  const ring = C('The One Ring', {mc:'{4}', cmc:4}); S().hand.push(ring); ev('commit()'); await ev('play')(ring.u); await wait(80);
  check(ev('pub()').protect, 'The One Ring gewirkt: Schutz vor allem');
  // Beseech the Mirror mit Bargain
  await reset(); lib(N('Opt', 'Instant', 'Draw a card.', {cmc:1, mc:'{U}'}), N('Big', 'Creature', '', {cmc:6}));
  S().bf.push(N('Treasure', 'Token Artifact — Treasure', '', {tok:true}));
  const bm = C('Beseech the Mirror', {mc:'{1}{B}{B}{B}', cmc:4}); S().hand.push(bm); ev('commit()');
  const pb = ev('castSpell')(bm.u); await wait(40);
  check(/Bargain/.test(title()), 'Beseech: fragt nach Bargain');
  await clickCard('Treasure'); await wait(60); await clickCard('Opt'); await wait(60);
  check(/gratis wirken/.test($('#modalBox').textContent), 'Bargain + Manawert 1: Opt gratis wirken?');
  await click('Ja'); await wait(80); await pb;
  check(S().gy.some(c => c.n === 'Opt'), 'Opt gratis gewirkt');
  // Bolas's Citadel
  await reset(); lib(N('Ponder', 'Sorcery', 'Draw a card.', {cmc:1, mc:'{U}'}), N('Swamp', 'Basic Land — Swamp'));
  const cit = C("Bolas's Citadel"); S().bf.push(cit); ev('S.life = 20; commit()');
  ev('cardMenu')(cit, 'bf').find(i => /Oberste Karte spielen/.test(i.l || '')).f(); await wait(100);
  check(S().life === 19 && S().gy.some(c => c.n === 'Ponder'), 'Citadel: Ponder von oben für 1 Leben');
  // Agatha teilt Fähigkeiten
  await reset();
  const druid = N('Devoted Druid', 'Creature — Elf Druid', '{T}: Add {G}.\nPut a -1/-1 counter on Devoted Druid: Untap Devoted Druid.', {pw:0, tg:2});
  S().gy.push(druid);
  const ag = C("Agatha's Soul Cauldron"), crt = N('Ballista', 'Artifact Creature — Construct', '', {pw:0, tg:0}); S().bf.push(ag, crt); ev('commit()');
  ev('cardMenu')(ag, 'bf').find(i => /^Fähigkeit: \{T\}/.test(i.l || '')).f(); await wait(60); await clickCard('Devoted'); await wait(60); await clickCard('Ballista'); await wait(60);
  const its = ev('cardMenu')(crt, 'bf').map(i => i.l || i.h || '');
  check(its.some(t => /Devoted Druid \(Agatha\): Put a -1\/-1/.test(t)) && its.some(t => /Devoted Druid \(Agatha\)/.test(t) && /ms-G/.test(t)), 'Ballista hat die Fähigkeiten von Devoted Druid');
  // Boseiju: Channel günstiger mit legendären Kreaturen
  await reset(); ev('LOOK.autoPay = true');
  S().bf.push(N('Ragavan', 'Legendary Creature — Monkey', '', {pw:2, tg:1}), N('Forest', 'Basic Land — Forest', '({T}: Add {G}.)'));
  ev('BOT.bf.push(newCard({n:"Urborg", type:"Legendary Land"})); botChanged()'); await wait(20);
  const bo = C('Boseiju, Who Endures'); S().hand.push(bo); ev('commit()');
  ev('cardMenu')(bo, 'hand').find(i => /Aus der Hand/.test(i.l || '')).f(); await wait(80);
  await clickCard('Urborg'); await wait(80);
  check(ev('BOT.gy.some(c => c.n === "Urborg")') && S().gy.some(c => c.n === 'Boseiju, Who Endures'), 'Boseiju Channel mit nur {G}: Urborg zerstört');
  ev('LOOK.autoPay = false');
  // Opposition Agent
  await reset(); ev('BOT.bf.push(newCard({n:"Opposition Agent", type:"Creature — Human Rogue", pw:3, tg:2})); botChanged()'); await wait(20);
  lib(N('Island', 'Basic Land — Island'), N('Swamp', 'Basic Land — Swamp'));
  const fetch = N('Polluted Delta', 'Land', '{T}, Pay 1 life, Sacrifice Polluted Delta: Search your library for an Island or Swamp card, put it onto the battlefield, then shuffle.');
  S().bf.push(fetch); ev('commit()');
  ev('cardMenu')(fetch, 'bf').find(i => /^Fähigkeit/.test(i.l || '')).f(); await wait(60); await clickCard('Island'); await wait(60);
  check(S().ex.some(c => c.n === 'Island') && !S().bf.some(c => c.n === 'Island'), 'Opposition Agent: gesuchte Insel geht ins Exil');
  // Allosaurus Shepherd
  await reset(); ev('LOOK.autoPay = false');
  const allo = C('Allosaurus Shepherd', {pw:1, tg:1}), elf2 = N('Llanowar Elves', 'Creature — Elf Druid', '', {pw:1, tg:1});
  S().bf.push(allo, elf2); ev('commit()');
  ev('cardMenu')(allo, 'bf').find(i => /^Fähigkeit/.test(i.l || '')).f(); await wait(60);
  check(ev('power')(elf2) === 5 && ev('tough')(allo) === 5, 'Allosaurus: Elfen sind 5/5');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
