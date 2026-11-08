const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report20_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  const enter = async (c, ms = 80) => { S().hand.push(c); ev('commit()'); ev('moveCard')(c.u, 'bf'); await wait(ms); };
  const bf = (...c) => { S().bf.push(...c); ev('commit()'); };
  const actv = async (c, i = 0) => { ev('activateAbility')(c, ev('parseAbilities')(c).filter(a => a.kind === 'act')[i]); await wait(100); };
  // Eidolon of Rhetoric
  await reset(); bf(C('Eidolon of Rhetoric', {pw:1, tg:4})); ev('S.spellTurnKey = null; S.spellsCast = 0');
  await cast(N('Opt', 'Instant', 'Draw a card.', {mc:''})); await drain();
  S().hand.push(N('Opt2', 'Instant', '', {mc:''})); ev('commit()'); ev('castSpell')(S().hand[S().hand.length - 1].u); await wait(80);
  check(/nicht erlaubt/.test(title()) && /Eidolon/.test($('#modalBox').textContent), 'Eidolon of Rhetoric: zweiter Zauber wird gewarnt');
  await click('Nicht wirken');
  // Ethersworn Canonist
  await reset(); bf(C('Ethersworn Canonist', {pw:2, tg:2})); ev('S.naKey = null; S.naCount = 0');
  await cast(N('Opt', 'Instant', '', {mc:''})); await drain();
  S().hand.push(N('Bauble', 'Artifact', '', {mc:''})); ev('commit()'); ev('play')(S().hand[S().hand.length - 1].u); await wait(80);
  check(!/nicht erlaubt/.test(title()) && S().bf.some(c => c.n === 'Bauble'), 'Canonist: Artefakt geht noch');
  await drain(); S().hand.push(N('Opt3', 'Instant', '', {mc:''})); ev('commit()'); ev('castSpell')(S().hand[S().hand.length - 1].u); await wait(80);
  check(/nicht erlaubt/.test(title()) && /Canonist/.test($('#modalBox').textContent), 'Canonist: zweiter Nicht-Artefakt-Zauber wird gewarnt');
  await click('Nicht wirken');
  // Rishkar
  await reset(); const ra = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}), rb = N('Elch', 'Creature — Elk', '', {pw:3, tg:3}); bf(ra, rb);
  const rk = C('Rishkar, Peema Renegade', {pw:2, tg:2}); await enter(rk); await clickCard('Bär'); await wait(40); await clickCard('Elch'); await wait(80);
  check(ra.c === 1 && rb.c === 1, 'Rishkar: je eine Marke auf zwei Kreaturen');
  check((ev('manaChoices')(ra) || []).some(o => (o.add || []).includes('G')), 'Rishkar: Kreatur mit Marke hat {T}: Add {G}');
  check(!(ev('manaChoices')(N('X', 'Creature', '', {pw:1, tg:1})) || []).length, 'ohne Marke kein Mana');
  // White Plume Adventurer
  await reset(); lib(N('Plains', 'Basic Land — Plains'), N('Opt', 'Instant')); ev('BOT.initiative = true');
  const wp = C('White Plume Adventurer', {pw:3, tg:3}); await enter(wp, 120); console.log('   WP:', title());
  await clickCard('Plains'); await wait(80); await drain();
  check(S().initiative && !ev('BOT.initiative') && S().undercity === 'Secret Entrance' && S().hand.some(c => c.n === 'Plains'), 'White Plume: Initiative übernommen, Secret Entrance holt ein Standardland');
  wp.tap = true; const t2 = N('Bär', 'Creature — Bear', '', {pw:2, tg:2, tap:true}); bf(t2); t2.tap = true;
  ev('abilEvent({kind:"phase", phase:"upkeep", mine:false})'); await wait(80); await wait(200); console.log('   WPU:', title(), btns().join('|'), t2.tap, wp.tap, ev('S.bf.map(c=>c.n+c.tap).join()'), ev('S.dungeonDone'), ev('LOG_TAIL = (S.log||[]).slice(-3)')); await clickCard('Bär'); await wait(60);
  check(!t2.tap && wp.tap, 'White Plume: im gegnerischen Upkeep eine Kreatur enttappt');
  ev('S.dungeonDone = true'); t2.tap = true; ev('abilEvent({kind:"phase", phase:"upkeep", mine:false})'); await wait(80);
  check(!t2.tap && !wp.tap, 'nach abgeschlossenem Dungeon: alle enttappt');
  ev('S.dungeonDone = false; S.undercity = "Archives"'); lib(N('Z', 'Instant')); ev('remindTriggers("upkeep", true)'); await wait(120); await drain();
  check(S().undercity === 'Throne of the Dead Three' || S().dungeonDone, 'eigener Upkeep mit Initiative: weiter in die Undercity');
  // Abigale
  await reset(); ev('BOT.bf = [newCard({n:"Troll", type:"Creature — Troll", o:"Trample\\nWhenever Troll attacks, draw a card.", pw:4, tg:4, kw:["Trample"]})]; botChanged()'); await wait(40);
  const ab = C('Abigale, Eloquent First-Year', {pw:1, tg:1}); await enter(ab, 120); await clickCard('Troll'); await wait(120);
  const tr = ev('BOT.bf[0]'); console.log('   AB:', JSON.stringify(tr.kwc), tr.noAb, JSON.stringify(tr.o), title());
  check(tr.noAb && !tr.o && (tr.kwc || []).join() === 'flying,first strike,lifelink', 'Abigale: Troll der KI verliert Fähigkeiten und bekommt drei Marken');
  check(ev('kwHas')(tr, 'flying') && !ev('kwHas')(tr, 'trample'), 'Troll fliegt jetzt, hat aber kein Trample mehr');
  // Aven Interrupter: Aufpreis
  await reset(); ev(`others.bot = others.bot || {}; others.bot.bf = [{u:"av1", n:"Aven Interrupter", type:"Creature"}]`);
  const fb = N('Rückkehr', 'Sorcery', '', {mc:'{1}'}); fb._fromZone = 'gy'; await ev('castWarn')(fb, 'hand');
  check(fb.payMc === '{1}{2}', 'Aven Interrupter: Zauber aus dem Friedhof kostet {2} mehr');
  const fh = N('Hand', 'Sorcery', '', {mc:'{1}'}); await ev('castWarn')(fh, 'hand');
  check(fh.payMc == null, 'aus der Hand kein Aufpreis'); ev('others.bot.bf = []');
  // Aven Interrupter: Plot (Besitzerseite)
  await reset(); const pz = N('Bolt', 'Instant', '', {mc:'{R}'}); S().st.push(pz); ev('commit()');
  ev('stackResolveMine')({item:{u:pz.u, countered:true, cExile:true, plot:true}}); await wait(40);
  check(S().ex.includes(pz) && pz.castKey === 'plot', 'Aven Interrupter: verbannter Zauber ist geplant');
  check(!ev('cardMenu')(pz, 'ex').some(i => /Geplant/.test(i.l || '')), 'im gleichen Zug noch nicht wirkbar');
  pz.plotKey = 'alt'; check(ev('cardMenu')(pz, 'ex').some(i => /Geplant/.test(i.l || '')), 'in einem späteren Zug wirkbar');
  // Colonel Autumn: Exploit
  await reset(); const v1 = N('Opfer', 'Creature — Goblin', '', {pw:1, tg:1}), k1 = N('Krieger', 'Creature — Human', '', {pw:2, tg:2}); bf(v1, k1);
  const ca = C('Colonel Autumn', {pw:3, tg:3}); await enter(ca, 100); await clickCard('Opfer'); await wait(120);
  check(S().gy.includes(v1) && k1.c === 1 && ca.c === 1, 'Colonel Autumn: Exploit opfert, dann +1 Marke auf jede Kreatur');
  const lg = N('Legende', 'Legendary Creature — Elf', '', {pw:2, tg:2}); await enter(lg, 100); console.log('   Legende:', title());
  check(/Exploit/.test(title()), 'andere legendäre Kreaturen haben Exploit'); await click('Nicht opfern');
  // Command Beacon
  await reset(); const cmd = N('Boss', 'Legendary Creature — Human', '', {pw:3, tg:3}); ev('S.cz = []'); S().cz.push(cmd); const cb = C('Command Beacon'); bf(cb);
  await actv(cb, 0); await wait(60); await drain();
  check(S().hand.includes(cmd) && S().gy.includes(cb), 'Command Beacon: Kommandant auf die Hand');
  // Knight of the Reliquary
  await reset(); const kn = C('Knight of the Reliquary', {pw:2, tg:2}); bf(kn); S().gy.push(N('L1', 'Land'), N('L2', 'Basic Land — Forest'), N('S', 'Sorcery')); ev('commit()');
  check(ev('power')(kn) === 4 && ev('tough')(kn) === 4, 'Knight of the Reliquary: +1/+1 je Land im Friedhof');
  // Manglehorn
  check(ev('ENTER_TAPPED_OPP')['Manglehorn'] === 'artifact', 'Manglehorn: gegnerische Artefakte kommen getappt');
  // Moonshadow
  await reset(); const ms = C('Moonshadow', {pw:7, tg:7}); await enter(ms);
  check(ms.c === -6 && ev('power')(ms) === 1, 'Moonshadow: kommt mit sechs -1/-1-Marken (1/1)');
  const dd = N('Stein', 'Artifact', ''); bf(dd); ev('moveCard')(dd.u, 'gy'); await wait(100);
  check(ms.c === -5, 'bleibende Karte in den Friedhof: eine -1/-1-Marke weniger');
  const ii = N('Spruch', 'Instant', ''); S().hand.push(ii); ev('commit()'); ev('moveCard')(ii.u, 'gy'); await wait(100);
  check(ms.c === -5, 'Spontanzauber zählt nicht');
  // Nature's Chosen
  await reset(); const nb = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); bf(nb); nb.tap = true; const nc = C("Nature's Chosen"); nc.eq = nb.u; bf(nc);
  await actv(nc, 0); check(!nb.tap, "Nature's Chosen: verzauberte Kreatur enttappt");
  // Patrolling Peacemaker
  await reset(); const pp = C('Patrolling Peacemaker', {pw:3, tg:3}); await enter(pp); const pw = N('Jace', 'Legendary Planeswalker — Jace', '', {c:3}); bf(pw); pw.c = 3;
  check(pp.c === 2, 'Peacemaker kommt mit zwei Marken');
  ev('receiveHit')({kind:'damage', amount:1, src:'Bolt'}); await wait(120); console.log('   PP:', title());
  await clickCard('Patrolling'); await clickCard('Jace'); await click('OK') || await click('Fertig') || await click('Übernehmen'); await wait(80); console.log('   PP2:', btns().join('|'));
  check(pp.c === 3 && pw.c === 4, 'Peacemaker: Verbrechen eines Gegners → Proliferate');
  await drain();
  // Skyclave Apparition
  await reset(); ev('BOT.bf = [newCard({n:"Pfeil", type:"Artifact", cmc:3, mc:"{3}"})]; botChanged()'); await wait(40);
  const sk = C('Skyclave Apparition', {pw:2, tg:2}); await enter(sk, 120); await clickCard('Pfeil'); await wait(100);
  check(ev('BOT.ex.some(c => c.n === "Pfeil")'), 'Skyclave: Karte der KI verbannt');
  ev('moveCard')(sk.u, 'gy'); await wait(200);
  check(ev('BOT.bf.some(c => /Illusion/.test(c.n + c.type) && c.pw === 3)'), 'Skyclave verlässt das Spiel: KI erhält ein 3/3 Illusion');
  // Tayam
  await reset(); bf(C('Tayam, Luminous Enigma', {pw:3, tg:3})); const tb = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); await enter(tb);
  check((tb.kwc || []).includes('vigilance') && ev('kwHas')(tb, 'vigilance'), 'Tayam: andere Kreatur kommt mit Wachsamkeits-Marke');
  // Warden of the Grove
  await reset(); const wg = C('Warden of the Grove', {pw:2, tg:2}); bf(wg); wg.c = 2; const wb = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); await enter(wb, 100); console.log('   WG:', title());
  await click('2 +1/+1'); await wait(60);
  check(wb.c === 2, 'Warden: Endure 2 als Marken');
  const wc = N('Elch', 'Creature — Elk', '', {pw:3, tg:3}); await enter(wc, 100); await click('2/2'); await wait(80);
  check(S().bf.some(c => c.tok && c.pw === 2 && /Spirit/.test(c.n + c.type)), 'Warden: Endure 2 als 2/2 Spirit');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
