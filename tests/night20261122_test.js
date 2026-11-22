// Nacht 22.11.2026: Karten aus den Top-Decks – Text aus night20261122_cards.json (Scryfall)
const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync(require('path').join(__dirname, 'night20261122_cards.json'), 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
const C = (n, x = {}) => { if(!T[n]) throw new Error('Karte fehlt: ' + n); return ev('newCard')({...T[n], img:null, ...x}); };
const N = (n, type, o = '', x = {}) => ev('newCard')({n, type, o, img:null, ...x});
const open = () => !$('#modal').hidden;
const click = async t => { const b = [...d.querySelectorAll('#modalBox button')].find(b => b.textContent.trim().startsWith(t)); if(b){ b.click(); await wait(40); } return !!b; };
const clickCard = async t => { const el = [...d.querySelectorAll('#modalBox .card')].find(e => e.textContent.includes(t)); if(el){ el.click(); await wait(40); } return !!el; };
const cardsShown = () => [...d.querySelectorAll('#modalBox .card')].map(e => e.textContent);
const AUTO = ["Chitterspitter", "Cid, Freeflier Pilot", "Circle of Power", "Clever Concealment", "Clockwork Percussionist", "Cloud, Ex-SOLDIER", "Codsworth, Handy Helper", "Colorstorm Stallion",
  "Colossus Hammer", "Contagion Engine", "Contaminant Grafter", "Contaminated Drink", "Corsairs of Umbar", "Court of Grace", "Cover of Darkness", "Crackle with Power", "Crypt Incursion", "Cryogen Relic",
  "Damn", "Dark Deal", "Dawn's Truce", "Day of Black Sun", "Daydream", "Deem Inferior", "Deep Forest Hermit", "Deglamer", "Demolition Field", "Den of the Bugbear", "Dispatch", "Dracogenesis"];
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()'); ev('LOOK.autoPay = false');
  ev('startBot("Test", "Test", Array(30).fill(0).map(() => ({n:"Island", type:"Basic Land — Island", o:""})))'); ev('injectBot(); commit()'); await wait(30);
  const S = () => ev('S');
  const drain = async () => { for(let i = 0; i < 8 && open(); i++){ if(!(await click('Abbrechen')) && !(await click('Kein')) && !(await click('Nein')) && !(await click('Erledigt'))) break; await wait(40); } };
  const reset0 = () => ev('S.bf = []; S.hand = []; S.gy = []; S.ex = []; S.delayed = []; S.library = Array(10).fill(0).map(() => newCard({n:"Swamp", type:"Basic Land — Swamp", o:""})); S.pool = emptyPoolObj(); S.attacking = []; S.life = 20; BOT.bf = []; BOT.gy = []; BOT.life = 20; BOT.library = Array(20).fill(0).map(() => newCard({n:"Island", type:"Basic Land — Island", o:""})); botChanged(); TURN = {active:me.id, n:20, starter:me.id, phase:2}; commit()');
  const reset = async () => { await wait(80); await drain(); reset0(); await wait(20); };
  const put = (...c) => { S().bf.push(...c); ev('commit()'); };
  const opp = (n, x = {}) => { w.__o = N(n, 'Creature — Bear', '', {pw:2, tg:2, ...x}); ev('BOT.bf.push(window.__o); botChanged(); commit()'); return w.__o; };
  const abil = (c, re) => ev('parseAbilities')(c).find(a => re.test((a.line || '') + ' ' + (a.text || '')));
  const run = async (c, re, ctx = {}) => { const a = abil(c, re); if(!a) throw new Error('Fähigkeit fehlt: ' + c.n + ' ' + re); const pr = ev('runAbility')(c, a, ctx); await wait(150); return pr; };
  const logT = () => d.querySelector('#log') ? d.querySelector('#log').textContent : '';
  const pt = c => `${ev('power')(c)}/${ev('tough')(c)}`;

  // Fähigkeiten-Check
  for(const n of AUTO){ w.__c = T[n]; const st = ev('cardCheck(window.__c).status'); check(st === 'auto', `${n}: automatisch (${st})`); }
  const toks = re => S().bf.filter(c => c.tok && re.test(c.n + ' ' + (c.type || '')));
  const btns = () => [...d.querySelectorAll('#modalBox button')].map(b => b.textContent.trim());
  const botBf = () => ev('BOT.bf');

  // Deep Forest Hermit / Chitterspitter: Eichhörnchen-Lords
  await reset(); { const h = C('Deep Forest Hermit', {pw:1, tg:1}), sq = N('Squirrel', 'Token Creature — Squirrel', '', {pw:1, tg:1, tok:true}), be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(h, sq, be);
    check(pt(sq) === '2/2' && pt(be) === '2/2', `Deep Forest Hermit: Eichhörnchen +1/+1, Bär nicht (${pt(sq)}, ${pt(be)})`); }
  await reset(); { const cs = C('Chitterspitter'), sq = N('Squirrel', 'Token Creature — Squirrel', '', {pw:1, tg:1, tok:true}); cs.c = 2; put(cs, sq);
    check(pt(sq) === '3/3', `Chitterspitter: 2 Eichel-Marken → Eichhörnchen +2/+2 (${pt(sq)})`);
    const t2 = N('Token', 'Token Artifact — Clue', '', {tok:true}); put(t2); const pr = run(cs, /sacrifice a token/); await wait(150); await click('Ja'); await wait(100); await clickCard('Token'); await wait(150); await pr; await drain();
    check(cs.c === 3, `Chitterspitter: Token geopfert → 3 Eichel-Marken (${cs.c})`); }
  // Cid: fliegt nur im eigenen Zug
  await reset(); { const cid = C('Cid, Freeflier Pilot', {pw:2, tg:2}); put(cid);
    check(ev('kwHas')(cid, 'flying'), 'Cid: fliegt in meinem Zug'); ev('TURN.active = "bot"'); check(!ev('kwHas')(cid, 'flying'), 'Cid: fliegt nicht im Zug der KI'); ev('TURN.active = me.id'); }
  // Colossus Hammer: +10/+10, verliert Fliegen
  await reset(); { const fl = N('Vogel', 'Creature — Bird', 'Flying', {pw:1, tg:1, kw:['Flying']}), ch = C('Colossus Hammer'); put(fl, ch); check(ev('kwHas')(fl, 'flying'), 'Colossus Hammer: vorher fliegt der Vogel');
    ch.eq = fl.u; ev('commit()'); check(pt(fl) === '11/11' && !ev('kwHas')(fl, 'flying'), `Colossus Hammer: 11/11 und kein Fliegen (${pt(fl)})`); }
  // Cover of Darkness: gewählter Typ hat Furcht
  await reset(); { const cd = C('Cover of Darkness'); cd.chosen = 'Zombie'; const z = N('Zombie', 'Creature — Zombie', '', {pw:2, tg:2}), b = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(cd, z, b);
    check(ev('kwHas')(z, 'fear') && !ev('kwHas')(b, 'fear'), 'Cover of Darkness: Zombie hat Furcht, Bär nicht'); }
  // Codsworth: Commander hat Ward 2; Ausrüstung umhängen
  await reset(); { const cw = C('Codsworth, Handy Helper', {pw:2, tg:2}), cm = N('Chef', 'Legendary Creature — Human', '', {pw:3, tg:3, cmdr:true}); put(cw, cm);
    check(ev('myWard')(cm) === 2 && ev('myWard')(cw) === 0, `Codsworth: Commander Ward 2 (${ev('myWard')(cm)})`);
    const eq = N('Schwert', 'Artifact — Equipment', 'Equipped creature gets +2/+0.', {}); put(eq);
    const pr = run(cw, /Attach target Aura or Equipment/); await wait(150); await clickCard('Schwert'); await wait(150); await clickCard('Chef'); await wait(150); await pr; await drain();
    check(eq.eq === cm.u && pt(cm) === '5/3', `Codsworth: Schwert an Chef (${pt(cm)})`); }
  // Circle of Power: Zauberer +1/+0 und Lebensverknüpfung
  await reset(); { const wz = N('Zauberer', 'Token Creature — Wizard', '', {pw:0, tg:1, tok:true}), be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(wz, be); const cp = C('Circle of Power');
    await run(cp, /Wizards you control get/); await drain();
    check(pt(wz) === '1/1' && ev('kwHas')(wz, 'lifelink') && pt(be) === '2/2' && !ev('kwHas')(be, 'lifelink'), `Circle of Power: Zauberer 1/1 mit Lebensverknüpfung, Bär nicht (${pt(wz)}, ${pt(be)})`); }
  // Clever Concealment: gewählte Nichtländer phasen aus
  await reset(); { const a = N('Artefakt', 'Artifact', ''), b = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}), l = N('Forest', 'Basic Land — Forest', ''); put(a, b, l); const cc = C('Clever Concealment');
    const pr = ev('abilSpellResolve')(cc); await wait(150); check(!cardsShown().some(t => t.includes('Forest')), 'Clever Concealment: Länder stehen nicht zur Wahl');
    await clickCard('Bär'); await wait(60); await click('Fertig'); await wait(150); await pr; await drain();
    check(b.phased && !a.phased && !l.phased, 'Clever Concealment: nur der Bär phast aus'); }
  // Clockwork Percussionist: stirbt → oberste Karte bis Ende des nächsten Zuges spielbar
  await reset(); { const cp = C('Clockwork Percussionist', {pw:1, tg:1}); put(cp); ev('S.library.unshift(newCard({n:"Shock", type:"Instant", o:"Shock deals 2 damage to any target.", mc:"{R}", cmc:1}))');
    await run(cp, /exile the top card/); await drain(); const sh = S().ex.find(c => c.n === 'Shock');
    check(sh && sh.castKey, `Clockwork Percussionist: Shock im Exil und spielbar (${sh && sh.castKey})`); }
  // Contagion Engine: -1/-1 auf jede Kreatur der KI
  await reset(); { opp('Riese', {pw:3, tg:3}); opp('Zwerg', {pw:1, tg:1}); ev('injectBot(); commit()'); const ce = C('Contagion Engine'); put(ce);
    const pr = run(ce, /-1\/-1 counter on each creature/); await wait(150); await click('KI') || await click('Test'); await wait(250); await pr; await drain(); await wait(100);
    const r = botBf().find(c => c.n === 'Riese'); check(r && r.c === -1 && !botBf().some(c => c.n === 'Zwerg'), `Contagion Engine: Riese -1/-1, Zwerg stirbt (${botBf().map(c => c.n + ':' + c.c).join()})`); }
  // Contaminant Grafter: Bedingung Giftmarken
  await reset(); { const cg = C('Contaminant Grafter', {pw:5, tg:5}); put(cg); const ab = abil(cg, /poison counters/);
    ev('BOTS.bot.poison = 2'); check(ev('interveningIf')(ab.text, cg).ok === false, 'Contaminant Grafter: 2 Giftmarken → nicht erfüllt');
    ev('BOTS.bot.poison = 3'); check(ev('interveningIf')(ab.text, cg).ok === true, 'Contaminant Grafter: 3 Giftmarken → erfüllt'); ev('BOTS.bot.poison = 0'); }
  // Contaminated Drink: X = 3 → 3 Karten, 2 Strahlung
  await reset(); { ev('S.marks.RAD = 0'); const cd = C('Contaminated Drink'); cd.lastX = 3; await ev('abilSpellResolve')(cd); await drain();
    check(S().hand.length === 3 && ev('S.marks.RAD') === 2, `Contaminated Drink: 3 gezogen, 2 Strahlung (${S().hand.length}, ${ev('S.marks.RAD')})`); }
  // Corsairs of Umbar: Pirat unblockbar
  await reset(); { const co = C('Corsairs of Umbar', {pw:3, tg:3}), be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(co, be);
    const pr = run(co, /can't be blocked this turn/); await wait(150); const shown = cardsShown(); await clickCard('Corsairs'); await wait(150); await pr; await drain();
    check(!shown.some(t => t.includes('Bär')) && ev('kwHas')(co, 'unblockable'), `Corsairs of Umbar: nur Goblin/Ork/Pirat wählbar, Korsaren unblockbar (${shown.length})`); }
  // Court of Grace: Geist oder als Monarch Engel
  await reset(); { const cg = C('Court of Grace'); put(cg); ev('S.monarch = false'); await run(cg, /beginning of your upkeep/); await drain();
    check(toks(/Spirit/).length === 1 && !toks(/Angel/).length, `Court of Grace: ohne Monarch 1/1-Geist (${S().bf.map(c => c.n).join()})`);
    S().bf.splice(0); put(cg); ev('S.monarch = true'); await run(cg, /beginning of your upkeep/); await drain();
    check(toks(/Angel/).length === 1 && !toks(/Spirit/).length, `Court of Grace: als Monarch 4/4-Engel (${S().bf.map(c => c.n).join()})`); ev('S.monarch = false'); }
  // Crackle with Power: X = 1 → 5 Schaden an die KI
  await reset(); { const cw = C('Crackle with Power'); cw.lastX = 1; const pr = ev('abilSpellResolve')(cw); await wait(150); await click('KI') || await click('Test'); await wait(150); await pr; await drain();
    check(ev('BOTS.bot.life') === 15, `Crackle with Power: X=1 → 5 Schaden (${ev('BOTS.bot.life')})`); ev('BOTS.bot.life = 20'); }
  // Crypt Incursion: Kreaturenkarten aus meinem Friedhof, 3 Leben je Karte
  await reset(); { S().gy.push(N('Tot1', 'Creature — Zombie', '', {pw:2, tg:2}), N('Tot2', 'Creature — Zombie', '', {pw:2, tg:2}), N('Blitz', 'Instant', '')); const ci = C('Crypt Incursion');
    const pr = ev('abilSpellResolve')(ci); await wait(150); await click('Lukas') || await click('Du') || await click('Ich'); await wait(150); await pr; await drain();
    check(S().gy.length === 1 && S().life === 26, `Crypt Incursion: 2 verbannt, +6 Leben (${S().gy.length}, ${S().life})`); }
  await reset(); { w.__g = [N('KT1', 'Creature — Bear', '', {pw:2, tg:2}), N('KT2', 'Creature — Bear', '', {pw:2, tg:2}), N('KB', 'Sorcery', '')]; ev('BOT.gy.push(...window.__g); botChanged(); injectBot(); commit()'); const ci = C('Crypt Incursion');
    const pr = ev('abilSpellResolve')(ci); await wait(150); await click('KI') || await click('Test'); await wait(300); await pr; await drain();
    check(ev('BOT.gy.length') === 1 && S().life === 26, `Crypt Incursion (KI): 2 verbannt, +6 Leben (${ev('BOT.gy.length')}, ${S().life})`); }
  // Cryogen Relic: Betäubung auf getappte Kreatur
  await reset(); { const cr = C('Cryogen Relic'), a = N('Getappt', 'Creature — Bear', '', {pw:2, tg:2}), b = N('Wach', 'Creature — Bear', '', {pw:2, tg:2}); a.tap = true; put(cr, a, b);
    const pr = run(cr, /stun counter/); await wait(150); const shown = cardsShown(); await clickCard('Getappt'); await wait(150); await pr; await drain();
    check(a.stun === 1 && !shown.some(t => t.includes('Wach')), `Cryogen Relic: Betäubung auf die getappte Kreatur, ungetappte nicht wählbar (${a.stun})`); }
  // Damn: normal ein Ziel, mit Overload alle
  await reset(); { const a = N('A', 'Creature — Bear', '', {pw:2, tg:2}), b = N('B', 'Creature — Bear', '', {pw:2, tg:2}); put(a, b); const dm = C('Damn'); dm.overloaded = true;
    await ev('abilSpellResolve')(dm); await drain(); check(!S().bf.includes(a) && !S().bf.includes(b), 'Damn mit Overload: alle Kreaturen zerstört'); }
  await reset(); { const a = N('A', 'Creature — Bear', '', {pw:2, tg:2}), b = N('B', 'Creature — Bear', '', {pw:2, tg:2}); put(a, b); const dm = C('Damn');
    const pr = ev('abilSpellResolve')(dm); await wait(150); await clickCard('A'); await wait(150); await pr; await drain(); check(!S().bf.includes(a) && S().bf.includes(b), 'Damn: ein Ziel zerstört'); }
  // Dark Deal: Hand abwerfen, eine weniger ziehen (auch KI)
  await reset(); { S().hand.push(N('H1', 'Instant'), N('H2', 'Instant'), N('H3', 'Instant')); ev('BOT.hand = Array(4).fill(0).map(() => newCard({n:"Mountain", type:"Basic Land — Mountain", o:""})); botChanged()');
    const dd = C('Dark Deal'); await ev('abilSpellResolve')(dd); await wait(200); await drain();
    check(S().hand.length === 2 && S().gy.length === 3 && !S().hand.some(c => /^H\d/.test(c.n)), `Dark Deal: 3 abgeworfen, 2 gezogen (${S().hand.length})`);
    check(ev('BOT.hand.length') === 3 && ev('BOT.gy.length') >= 4, `Dark Deal (KI): 4 abgeworfen, 3 gezogen (${ev('BOT.hand.length')})`); }
  // Dawn's Truce: mit Geschenk unzerstörbar
  await reset(); { const be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(be); const dt = C("Dawn's Truce"); dt.gift = {done:true};
    await ev('abilSpellResolve')(dt); await drain(); check(ev('kwHas')(be, 'hexproof') && ev('kwHas')(be, 'indestructible'), "Dawn's Truce mit Geschenk: fluchsicher und unzerstörbar"); }
  await reset(); { const be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(be); const dt = C("Dawn's Truce");
    await ev('abilSpellResolve')(dt); await drain(); check(ev('kwHas')(be, 'hexproof') && !ev('kwHas')(be, 'indestructible'), "Dawn's Truce ohne Geschenk: nur fluchsicher"); }
  // Daydream: verbannen und mit +1/+1-Marke zurück
  await reset(); { const be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(be); const dd = C('Daydream'); const pr = ev('abilSpellResolve')(dd); await wait(150); await clickCard('Bär'); await wait(150); await pr; await drain();
    check(S().bf.includes(be) && be.c === 1, `Daydream: Bär zurück mit Marke (${be.c})`); }
  // Day of Black Sun: X = 2
  await reset(); { const a = N('Klein', 'Creature — Bear', '', {pw:2, tg:2, cmc:2}), b = N('Gross', 'Creature — Giant', '', {pw:5, tg:5, cmc:5}), i = N('Unzerstörbar', 'Creature — God', 'Indestructible', {pw:5, tg:5, cmc:1, kw:['Indestructible']}); put(a, b, i);
    opp('KIKlein', {cmc:1}); opp('KIGross', {cmc:4}); ev('injectBot(); commit()');
    const ds = C('Day of Black Sun'); ds.lastX = 2; await ev('abilSpellResolve')(ds); await wait(200); await drain();
    check(!S().bf.includes(a) && !S().bf.includes(i) && S().bf.includes(b), 'Day of Black Sun: eigene Kreaturen mit MW ≤ 2 zerstört (auch unzerstörbare)');
    check(!botBf().some(c => c.n === 'KIKlein') && botBf().some(c => c.n === 'KIGross'), `Day of Black Sun: KI-Kreatur MW 1 zerstört, MW 4 nicht (${botBf().map(c => c.n).join()})`); }
  // Deem Inferior: als zweite Karte in die Bibliothek
  await reset(); { const ar = N('Artefakt', 'Artifact', ''); put(ar); const di = C('Deem Inferior'); const pr = ev('abilSpellResolve')(di); await wait(150); await clickCard('Artefakt'); await wait(150); await click('Als zweitoberste'); await wait(150); await pr; await drain();
    check(S().library[1] === ar, `Deem Inferior: Artefakt ist die zweite Karte (${S().library.indexOf(ar)})`); }
  await reset(); { opp('Ziel'); ev('injectBot(); commit()'); const di = C('Deem Inferior'); const pr = ev('abilSpellResolve')(di); await wait(150); await clickCard('Ziel'); await wait(250); await pr; await drain();
    check(!botBf().some(c => c.n === 'Ziel') && ev('BOT.library[1].n') === 'Ziel', `Deem Inferior (KI): Karte als zweite in der Bibliothek (${ev('BOT.library.slice(0,2).map(c=>c.n).join()')})`); }
  // Deglamer: eigene Verzauberung in die Bibliothek gemischt
  await reset(); { const en = N('Verzauberung', 'Enchantment', ''); put(en); const dg = C('Deglamer'); const l0 = S().library.length; const pr = ev('abilSpellResolve')(dg); await wait(150); await clickCard('Verzauberung'); await wait(150); await pr; await drain();
    check(!S().bf.includes(en) && S().library.includes(en) && S().library.length === l0 + 1, 'Deglamer: Verzauberung in die Bibliothek gemischt'); }
  await reset(); { w.__o = N('KI-Artefakt', 'Artifact', ''); ev('BOT.bf.push(window.__o); botChanged(); injectBot(); commit()'); const dg = C('Deglamer'); const l0 = ev('BOT.library.length');
    const pr = ev('abilSpellResolve')(dg); await wait(150); await clickCard('KI-Artefakt'); await wait(250); await pr; await drain();
    check(!botBf().some(c => c.n === 'KI-Artefakt') && ev('BOT.library.length') === l0 + 1, 'Deglamer (KI): Artefakt in ihre Bibliothek gemischt'); }
  // Demolition Field: Nichtstandardland der KI zerstören, sie sucht ein Standardland
  await reset(); { w.__o = N('Tempel', 'Land', '{T}: Add {C}.'); ev('BOT.bf.push(window.__o); BOT.library.unshift(newCard({n:"Plains", type:"Basic Land — Plains", o:""})); botChanged(); injectBot(); commit()');
    const df = C('Demolition Field'); put(df); const pr = run(df, /Destroy target nonbasic land/); await wait(150); await clickCard('Tempel'); await wait(300); await drain(); await pr; await drain();
    check(!botBf().some(c => c.n === 'Tempel') && botBf().some(c => /Basic Land/.test(c.type || '')), `Demolition Field: Tempel zerstört, KI sucht Standardland (${botBf().map(c => c.n).join()})`); }
  // Den of the Bugbear: wird 3/2-Goblin mit Angriffs-Auslöser, danach wieder Land
  await reset(); { const db = C('Den of the Bugbear'); put(db); await run(db, /becomes a 3\/2/); await drain();
    check(ev('isCreature')(db) && pt(db) === '3/2' && ev('parseAbilities')(db).some(a => a.kind === 'trig' && /attacks/.test(a.cond || '')), `Den of the Bugbear: 3/2-Kreatur mit Angriffs-Auslöser (${pt(db)})`);
    ev('clearPumps()'); check(!ev('isCreature')(db) && db.o === T['Den of the Bugbear'].o, 'Den of the Bugbear: am Zugende wieder nur Land mit dem eigenen Text'); }
  // Dispatch: tappen, mit drei Artefakten verbannen
  await reset(); { opp('Opfer'); ev('injectBot(); commit()'); put(N('A1', 'Artifact', ''), N('A2', 'Artifact', ''), N('A3', 'Artifact', '')); const dp = C('Dispatch');
    const pr = ev('abilSpellResolve')(dp); await wait(150); await clickCard('Opfer'); await wait(250); await pr; await drain();
    check(!botBf().some(c => c.n === 'Opfer'), `Dispatch mit Metalcraft: Ziel verbannt (${botBf().map(c => c.n).join()})`); }
  await reset(); { opp('Opfer'); ev('injectBot(); commit()'); put(N('A1', 'Artifact', '')); const dp = C('Dispatch');
    const pr = ev('abilSpellResolve')(dp); await wait(150); await clickCard('Opfer'); await wait(250); await pr; await drain();
    const o = botBf().find(c => c.n === 'Opfer'); check(o && o.tap, 'Dispatch ohne Metalcraft: Ziel nur getappt'); }
  // Cloud, Ex-SOLDIER: Treasure nur mit Stärke 7
  await reset(); { const cl = C('Cloud, Ex-SOLDIER', {pw:7, tg:7}); put(cl); ev('S.attacking = []'); await run(cl, /Whenever Cloud attacks/); await drain();
    check(toks(/Treasure/).length === 2, `Cloud: Stärke 7 → 2 Treasure (${toks(/Treasure/).length})`); }
  await reset(); { const cl = C('Cloud, Ex-SOLDIER', {pw:4, tg:4}); put(cl); await run(cl, /Whenever Cloud attacks/); await drain(); check(toks(/Treasure/).length === 0, 'Cloud: Stärke 4 → keine Treasure'); }
  await reset(); { const cl = C('Cloud, Ex-SOLDIER', {pw:4, tg:4}), eq = N('Schwert', 'Artifact — Equipment', 'Equipped creature gets +3/+0.'); put(cl, eq); const pr = run(cl, /When Cloud enters/); await wait(150); await clickCard('Schwert'); await wait(150); await pr; await drain();
    check(eq.eq === cl.u && pt(cl) === '7/4', `Cloud: legt beim Eintreten die Ausrüstung an (${pt(cl)})`); }
  // Colorstorm Stallion: Kopie nur bei 5 Mana
  await reset(); { const cs = C('Colorstorm Stallion', {pw:2, tg:2}); put(cs); w.__sp = N('Grosser Zauber', 'Sorcery', '', {cmc:5}); w.__sp.spent = {R:2, C:3}; ev('LAST_CAST = window.__sp');
    await run(cs, /gets \+1\/\+1 until end of turn/, {ev:{kind:'cast', c:w.__sp}}); await drain(); check(S().bf.filter(c => c.n === 'Colorstorm Stallion').length === 2 && pt(cs) === '3/3', `Colorstorm Stallion: 5 Mana → Token-Kopie (${S().bf.length}, ${pt(cs)})`); }
  await reset(); { const cs = C('Colorstorm Stallion', {pw:2, tg:2}); put(cs); w.__sp = N('Kleiner Zauber', 'Instant', '', {cmc:2}); w.__sp.spent = {R:2}; ev('LAST_CAST = window.__sp');
    await run(cs, /gets \+1\/\+1 until end of turn/, {ev:{kind:'cast', c:w.__sp}}); await drain(); check(S().bf.filter(c => c.n === 'Colorstorm Stallion').length === 1, 'Colorstorm Stallion: 2 Mana → keine Kopie'); }
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
