// Nacht 27.11.2026: Karten aus den Top-Decks – Text aus night20261127_cards.json (Scryfall)
const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync(require('path').join(__dirname, 'night20261127_cards.json'), 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
const C = (n, x = {}) => { if(!T[n]) throw new Error('Karte fehlt: ' + n); return ev('newCard')({...T[n], img:null, ...x}); };
const N = (n, type, o = '', x = {}) => ev('newCard')({n, type, o, img:null, ...x});
const open = () => !$('#modal').hidden;
const click = async t => { const b = [...d.querySelectorAll('#modalBox button')].find(b => b.textContent.trim().startsWith(t)); if(b){ b.click(); await wait(40); } return !!b; };
const clickCard = async t => { const el = [...d.querySelectorAll('#modalBox .card')].find(e => e.textContent.includes(t)); if(el){ el.click(); await wait(40); } return !!el; };
const cardsShown = () => [...d.querySelectorAll('#modalBox .card')].map(e => e.textContent);
const AUTO = ["Night's Whisper", "Mindcrank", "Mirelurk Queen", "Nuclear Fallout", "Mossborn Hydra", "Mortuary Mire", "Mightform Harmonizer", "Muxus, Goblin Grandee", "Myojin of Night's Reach", "Nurturing Pixie", "Ob Nixilis, the Fallen", "Ob Nixilis, the Ascended", "Metamorphosis Fanatic", "Meren of Clan Nel Toth", "Moria Scavenger", "Moon-Circuit Hacker", "Monument to Endurance", "Nine-Lives Familiar", "Nazgûl", "Merry, Warden of Isengard", "Nowhere to Run", "Oath of Teferi", "Nightkin Ambusher", "Momo, Friendly Flier", "Nahiri's Lithoforming", "Monstrous Emergence", "Ninja Pizza", "Meltstrider's Resolve"];
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()'); ev('LOOK.autoPay = false');
  ev('startBot("Test", "Test", Array(30).fill(0).map(() => ({n:"Island", type:"Basic Land — Island", o:""})))'); ev('injectBot(); commit()'); await wait(30);
  const S = () => ev('S');
  const drain = async () => { for(let i = 0; i < 8 && open(); i++){ if(!(await click('Abbrechen')) && !(await click('Kein')) && !(await click('Nein')) && !(await click('Erledigt'))) break; await wait(40); } };
  const reset0 = () => ev('S.bf = []; S.hand = []; S.gy = []; S.ex = []; S.cz = []; S.delayed = []; S.library = Array(10).fill(0).map(() => newCard({n:"Swamp", type:"Basic Land — Swamp", o:""})); S.pool = emptyPoolObj(); S.attacking = []; S.life = 20; BOT.bf = []; BOT.gy = []; BOT.ex = []; BOT.life = 20; BOT.library = Array(20).fill(0).map(() => newCard({n:"Island", type:"Basic Land — Island", o:""})); botChanged(); TURN = {active:me.id, n:20, starter:me.id, phase:2}; commit()');
  const reset = async () => { await wait(80); await drain(); reset0(); await wait(20); };
  const put = (...c) => { S().bf.push(...c); ev('commit()'); };
  const opp = (n, x = {}) => { w.__o = N(n, 'Creature — Bear', '', {pw:2, tg:2, ...x}); ev('BOT.bf.push(window.__o); botChanged(); commit()'); return w.__o; };
  const abil = (c, re) => ev('parseAbilities')(c).find(a => re.test((a.line || '') + ' ' + (a.text || '')));
  const run = async (c, re, ctx = {}) => { const a = abil(c, re); if(!a) throw new Error('Fähigkeit fehlt: ' + c.n + ' ' + re); const pr = ev('runAbility')(c, a, ctx); await wait(150); return pr; };
  const pt = c => `${ev('power')(c)}/${ev('tough')(c)}`;
  const kw = (c, k) => ev('kwHas')(c, k);
  const spell = async (n, x = {}) => { w.__sp = C(n, x); const pr = ev('abilSpellResolve')(w.__sp); await wait(200); return pr; };


  // Fähigkeiten-Check

  // Fähigkeiten-Check
  for(const n of AUTO){ w.__c = T[n]; const st = ev('cardCheck(window.__c).status'); check(st === 'auto', `${n}: automatisch (${st})`); }

  // Night's Whisper: 2 ziehen, 2 Leben verlieren
  await reset(); { const h0 = S().hand.length; await spell("Night's Whisper"); await drain(); check(S().hand.length === h0 + 2 && S().life === 18, `Night's Whisper: +2 Karten, 18 Leben (${S().hand.length - h0}, ${S().life})`); }
  // Mindcrank: Gegner verliert 3 → mahlt 3
  await reset(); { const mc = C('Mindcrank'); put(mc); const pr = ev('runTrigger')(mc, abil(mc, /mills that many/), {kind:"oppLoseLife", much:3, pid:"bot", opp:true}); await wait(200); await drain(); await pr;
    check(ev('BOT.gy.length') === 3, `Mindcrank: KI mahlt 3 (${ev('BOT.gy.length')})`); }
  // Mirelurk Queen: zwei Strahlungsmarken an die KI
  await reset(); { const q = C('Mirelurk Queen', {pw:3, tg:4}); put(q); ev('BOT.rad = 0'); const pr = ev('runTrigger')(q, abil(q, /rad counters/), {kind:"enter", c:q}); await wait(150); await click('KI'); await wait(150); await drain(); await pr;
    check(ev('BOT.rad') === 2, `Mirelurk Queen: KI hat 2 Strahlung (${ev('BOT.rad')})`); }
  // Nuclear Fallout X=1: -2/-2 für alle, 1 Strahlung für jeden
  await reset(); { const b = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}), g = N('Riese', 'Creature — Giant', '', {pw:4, tg:4}); put(b, g); opp('KI-Bär'); ev('BOT.rad = 0; marksOf().RAD = 0');
    w.__sp = C('Nuclear Fallout'); w.__sp.lastX = 1; await ev('abilSpellResolve')(w.__sp); await wait(200); await drain();
    check(S().gy.includes(b) && pt(g) === '2/2' && ev('BOT.gy.some(c => c.n === "KI-Bär")') && ev('BOT.rad') === 1 && ev('marksOf().RAD') === 1, `Nuclear Fallout: Bär und KI-Bär sterben, Riese 2/2, je 1 Strahlung (${pt(g)}, ${ev('BOT.rad')}, ${ev('marksOf().RAD')})`); }
  // Mossborn Hydra: Marken verdoppeln
  await reset(); { const h = C('Mossborn Hydra', {pw:0, tg:0}); put(h); h.c = 3; const pr = ev('runTrigger')(h, abil(h, /double the number/), {kind:"enter"}); await wait(150); await drain(); await pr; check(h.c === 6, `Mossborn Hydra: 3 → 6 Marken (${h.c})`); }
  // Mortuary Mire: Kreatur aus dem Friedhof oben auf die Bibliothek
  await reset(); { const mm = C('Mortuary Mire'); put(mm); S().gy.push(N('Leiche', 'Creature — Zombie', '', {pw:2, tg:2})); const pr = ev('runTrigger')(mm, abil(mm, /on top of your library/), {kind:"enter", c:mm}); await wait(150); await clickCard('Leiche'); await wait(150); await drain(); await pr;
    check(S().library[0].n === 'Leiche', `Mortuary Mire: Leiche liegt oben (${S().library[0].n})`); }
  // Mightform Harmonizer: Stärke verdoppeln
  await reset(); { const mh = C('Mightform Harmonizer', {pw:4, tg:4}), b = N('Bär', 'Creature — Bear', '', {pw:3, tg:2}); put(mh, b); const pr = ev('runTrigger')(mh, abil(mh, /double the power/), {kind:"enter"}); await wait(150); await clickCard('Bär'); await wait(150); await drain(); await pr;
    check(pt(b) === '6/2', `Mightform Harmonizer: Bär 6/2 (${pt(b)})`); }
  // Muxus: +1/+1 pro anderem Goblin
  await reset(); { const mx = C('Muxus, Goblin Grandee', {pw:4, tg:4}); put(mx, N('G1', 'Creature — Goblin', '', {pw:1, tg:1}), N('G2', 'Creature — Goblin', '', {pw:1, tg:1}), N('Elf', 'Creature — Elf', '', {pw:1, tg:1}));
    const pr = ev('runTrigger')(mx, abil(mx, /for each other Goblin/), {kind:"attack", c:mx}); await wait(150); await drain(); await pr; check(pt(mx) === '6/6', `Muxus: 6/6 (${pt(mx)})`); }
  // Myojin: unzerstörbar nur mit Göttlichkeitsmarke, Marke nur beim Wirken
  await reset(); { const my = C("Myojin of Night's Reach", {pw:5, tg:2}); my.wasCast = true; put(my); ev('manaEnter')(my); check(my.divinity === 1 && !(my.c > 0) && pt(my) === '5/2' && kw(my, 'indestructible'), `Myojin: Göttlichkeitsmarke, unzerstörbar, 5/2 (${my.divinity}, ${pt(my)})`);
    my.sick = false; ev('BOT.hand = [newCard({n:"A", type:"Instant", o:""}), newCard({n:"B", type:"Instant", o:""})]; botChanged()'); { const pr = ev('activateAbility')(my, abil(my, /discards their hand/)); await wait(300); await drain(); await pr; } check(ev('BOT.hand.length') === 0 && my.divinity === 0, `Myojin: Marke entfernt, KI wirft Hand ab (${ev('BOT.hand.length')}, ${my.divinity})`); check(!kw(my, 'indestructible'), 'Myojin: ohne Marke nicht unzerstörbar');
    const my2 = C("Myojin of Night's Reach", {pw:5, tg:2}); put(my2); ev('manaEnter')(my2); check(!(my2.divinity > 0), `Myojin: nicht gewirkt – keine Marke (${my2.divinity})`); }
  // Nurturing Pixie: nur mit zurückgeschickter Karte eine Marke
  await reset(); { const px = C('Nurturing Pixie', {pw:1, tg:1}), en = N('Zauber', 'Enchantment', ''); put(px, en); const pr = ev('runTrigger')(px, abil(px, /return up to one target/), {kind:"enter", c:px}); await wait(150); await clickCard('Zauber'); await wait(200); await drain(); await pr;
    check(S().hand.includes(en) && px.c === 1, `Nurturing Pixie: Verzauberung auf der Hand, +1 Marke (${px.c})`); }
  await reset(); { const px = C('Nurturing Pixie', {pw:1, tg:1}); put(px); const pr = ev('runTrigger')(px, abil(px, /return up to one target/), {kind:"enter", c:px}); await wait(150); await drain(); await pr;
    check(!(px.c > 0), `Nurturing Pixie: ohne Ziel keine Marke (${px.c})`); }
  // Ob Nixilis, the Fallen: Gegner verliert 3, drei Marken
  await reset(); { const ob = C('Ob Nixilis, the Fallen', {pw:3, tg:3}); put(ob); const pr = ev('runTrigger')(ob, abil(ob, /lose 3 life/), {kind:"enter"}); await wait(150); await click('Ja'); await wait(150); await click('KI'); await wait(200); await drain(); await pr;
    check(ev('BOT.life') === 17 && ob.c === 3, `Ob Nixilis, the Fallen: KI 17, 3 Marken (${ev('BOT.life')}, ${ob.c})`); }
  await reset(); { const ob = C('Ob Nixilis, the Fallen', {pw:3, tg:3}); put(ob); const pr = ev('runTrigger')(ob, abil(ob, /lose 3 life/), {kind:"enter"}); await wait(150); await click('Nein'); await wait(200); await drain(); await pr;
    check(ev('BOT.life') === 20 && !(ob.c > 0), `Ob Nixilis, the Fallen: abgelehnt – nichts (${ev('BOT.life')}, ${ob.c})`); }
  // Ob Nixilis, the Ascended: getappte gegnerische Kreaturen zerstören, Leben pro Kreatur
  await reset(); { const oa = C('Ob Nixilis, the Ascended', {pw:5, tg:5}); put(oa); const a = opp('A'), b = opp('B'), c = opp('C'); a.tap = true; b.tap = true; ev('botChanged(); commit()');
    const pr = ev('runTrigger')(oa, abil(oa, /destroy all tapped creatures/), {kind:"enter", c:oa}); await wait(300); await drain(); await pr;
    check(ev('BOT.bf.length') === 1 && S().life === 22, `Ob Nixilis, the Ascended: 2 zerstört, +2 Leben (${ev('BOT.bf.length')}, ${S().life})`); }
  // Metamorphosis Fanatic: Kreatur mit Lebensverknüpfungs-Marke zurück
  await reset(); { const mf = C('Metamorphosis Fanatic', {pw:4, tg:4}); put(mf); const z = N('Toter', 'Creature — Zombie', '', {pw:2, tg:2}); S().gy.push(z);
    const pr = ev('runTrigger')(mf, abil(mf, /lifelink counter/), {kind:"enter", c:mf}); await wait(150); await clickCard('Toter'); await wait(200); await drain(); await pr;
    check(S().bf.includes(z) && kw(z, 'lifelink'), 'Metamorphosis Fanatic: Toter zurück mit Lebensverknüpfung'); }
  // Meren: Manawert ≤ Erfahrung → ins Spiel, sonst auf die Hand
  await reset(); { const mr = C('Meren of Clan Nel Toth', {pw:3, tg:4}); put(mr); ev('marksOf().XP = 2'); const a = N('Klein', 'Creature — Elf', '', {pw:1, tg:1, cmc:2}); S().gy.push(a);
    const pr = ev('runTrigger')(mr, abil(mr, /experience counters you have/), {kind:"phase"}); await wait(150); await clickCard('Klein'); await wait(200); await drain(); await pr; check(S().bf.includes(a), 'Meren: Manawert 2 bei 2 Erfahrung ins Spiel');
    const b = N('Gross', 'Creature — Giant', '', {pw:5, tg:5, cmc:5}); S().gy.push(b); const pr2 = ev('runTrigger')(mr, abil(mr, /experience counters you have/), {kind:"phase"}); await wait(150); await clickCard('Gross'); await wait(200); await drain(); await pr2;
    check(S().hand.includes(b), 'Meren: Manawert 5 auf die Hand'); ev('marksOf().XP = 0'); }
  // Moria Scavenger: Kreatur abgeworfen → Armee
  await reset(); { const ms = C('Moria Scavenger', {pw:2, tg:2}); put(ms); ms.sick = false; S().hand.push(N('Ork', 'Creature — Orc', '', {pw:1, tg:1}));
    const ab = abil(ms, /amass Orcs/); const pr = ev('activateAbility')(ms, ab); await wait(200); await clickCard('Ork'); await wait(300); await drain(); await pr;
    check(S().bf.some(c => /Army/.test(c.type || c.n)), `Moria Scavenger: Armee erschaffen (${S().bf.map(c => c.n).join(', ')})`); }
  await reset(); { const ms = C('Moria Scavenger', {pw:2, tg:2}); put(ms); ms.sick = false; S().hand.push(N('Land', 'Basic Land — Swamp', ''));
    const pr = ev('activateAbility')(ms, abil(ms, /amass Orcs/)); await wait(200); await clickCard('Land'); await wait(300); await drain(); await pr;
    check(!S().bf.some(c => /Army/.test(c.type || c.n)), 'Moria Scavenger: Land abgeworfen – keine Armee'); }
  // Moon-Circuit Hacker: diesen Zug gekommen – nur ziehen
  await reset(); { const mh = C('Moon-Circuit Hacker', {pw:2, tg:1}); put(mh); mh.enterKey = ev('turnKey()'); S().hand.push(N('Hk', 'Instant', '')); const h0 = S().hand.length;
    const pr = ev('runTrigger')(mh, abil(mh, /you may draw a card/), {kind:"combatDamage", c:mh, pid:"bot"}); await wait(150); await click('Ja'); await wait(200); await drain(); await pr;
    check(S().hand.length === h0 + 1, `Moon-Circuit Hacker: frisch – ziehen ohne Abwerfen (${S().hand.length - h0})`); }
  await reset(); { const mh = C('Moon-Circuit Hacker', {pw:2, tg:1}); put(mh); mh.enterKey = 'alt'; S().hand.push(N('Hk', 'Instant', '')); const h0 = S().hand.length;
    const pr = ev('runTrigger')(mh, abil(mh, /you may draw a card/), {kind:"combatDamage", c:mh, pid:"bot"}); await wait(150); await click('Ja'); await wait(200); await clickCard('Hk'); await wait(200); await drain(); await pr;
    check(S().hand.length === h0 && S().gy.some(c => c.n === 'Hk'), `Moon-Circuit Hacker: ziehen und abwerfen (${S().hand.length - h0})`); }
  // Monument to Endurance: jeder Modus nur einmal pro Zug
  await reset(); { const mo = C('Monument to Endurance'); put(mo); const ab = abil(mo, /hasn't been chosen this turn/); const h0 = S().hand.length;
    const pr = ev('runTrigger')(mo, ab, {kind:"youDiscard"}); await wait(150); await click('Draw a card'); await click('Ausführen'); await wait(200); await drain(); await pr;
    const pr2 = ev('runTrigger')(mo, ab, {kind:"youDiscard"}); await wait(150); const shown = [...d.querySelectorAll('#modalBox button')].map(b => b.textContent); await click('Create a Treasure'); await click('Ausführen'); await wait(200); await drain(); await pr2;
    check(S().hand.length === h0 + 1 && !shown.some(t => /^Draw a card/.test(t)) && S().bf.some(c => /Treasure/.test(c.n)), `Monument: ziehen, dann nur noch die anderen Modi (${shown.filter(t => /^(Draw|Create|Each)/.test(t)).join(' | ')})`); }
  // Nine-Lives Familiar: stirbt mit 8 Marken → kommt mit 7 zurück
  await reset(); { const nl = C('Nine-Lives Familiar', {pw:1, tg:1}); nl.wasCast = true; put(nl); ev('manaEnter')(nl); check(nl.revival === 8 && pt(nl) === '1/1', `Nine-Lives: 8 Wiederbelebungsmarken (${nl.revival}, ${pt(nl)})`);
    w.__nl = nl; ev('moveCard(window.__nl.u, "gy")'); const ab = abil(nl, /revival counter on it, return/); const ok = ev('interveningIf')(ab.text, nl).ok; const pr = ev('runTrigger')(nl, ab, {kind:"die", c:nl}); await wait(150); await drain(); await pr;
    const dl = ev('S.delayed').find(x => x.action === 'gyBackCtr'); check(ok === true && dl && dl.ctr === 7, `Nine-Lives: Rückkehr mit 7 geplant (${ok}, ${dl && dl.ctr})`); }
  // Nazgûl: der Ring führt in Versuchung → +1 Marke auf jeden Wraith
  await reset(); { const nz = C('Nazgûl', {pw:1, tg:2}), wr = N('Geist', 'Creature — Wraith', '', {pw:1, tg:1}); put(nz, wr); const ab = abil(nz, /^the Ring tempts you$|Ring tempts you\./);
    check(ev('trigMatches')(abil(nz, /put a \+1\/\+1 counter on each Wraith/), nz, {kind:"ringTempts"}), 'Nazgûl: Auslöser «the Ring tempts you»');
    const pr = ev('runTrigger')(nz, abil(nz, /put a \+1\/\+1 counter on each Wraith/), {kind:"ringTempts"}); await wait(150); await drain(); await pr; check(nz.c === 1 && wr.c === 1, `Nazgûl: beide Wraiths +1 (${nz.c}, ${wr.c})`); }
  // Merry: Pippin aus der Bibliothek
  await reset(); { S().library.push(N('Pippin, Warden of Isengard', 'Legendary Creature — Halfling', '')); const me1 = C('Merry, Warden of Isengard', {pw:2, tg:4}); put(me1); ev('manaEnter')(me1); await wait(200); await click('Ja'); await wait(200); await drain();
    check(S().hand.some(c => c.n === 'Pippin, Warden of Isengard'), 'Merry: Pippin auf die Hand'); }
  // Nowhere to Run: Ward gegnerischer Kreaturen zählt nicht
  await reset(); { const o = opp('Schutz', {kw:['Ward {2}']}); check(ev('wardCost')(o, 'bot') === '{2}', 'Ward {2} ohne Nowhere to Run'); put(C('Nowhere to Run')); check(ev('wardCost')(o, 'bot') === null, 'Nowhere to Run: Ward löst nicht aus'); }
  // Oath of Teferi: zwei Loyalitätsfähigkeiten pro Zug
  await reset(); { const pw = N('Walker', 'Legendary Planeswalker — Test', '+1: You gain 1 life.', {loy:3}); pw.c = 3; put(pw, C('Oath of Teferi')); const ab = ev('parseAbilities')(pw).find(a => a.kind === 'loyalty' || /\+1/.test(a.cost || ''));
    for(let i = 0; i < 3; i++){ const pr = ev('activateLoyalty')(pw, ab); await wait(200); await drain(); await pr; }
    check(pw.c === 5, `Oath of Teferi: zweimal, nicht dreimal (${pw.c})`); }

  // Nightkin Ambusher: unblockbar, solange der Verteidiger Strahlung hat
  await reset(); { const nk = C('Nightkin Ambusher', {pw:4, tg:2}); put(nk); const bl = opp('Wache'); ev('BOT.rad = 0'); check(ev('canBlock')(bl, nk), 'Nightkin: ohne Strahlung blockbar');
    ev('BOT.rad = 2'); check(!ev('canBlock')(bl, nk), 'Nightkin: mit Strahlung nicht blockbar'); ev('BOT.rad = 0'); }
  // Momo: erster fliegender Nicht-Lemur-Kreaturenzauber im eigenen Zug kostet 1 weniger
  await reset(); { put(C('Momo, Friendly Flier', {pw:1, tg:1})); const v = N('Vogel', 'Creature — Bird', 'Flying', {mc:'{2}{U}', cmc:3}), l = N('Lemur', 'Creature — Lemur', 'Flying', {mc:'{2}{U}', cmc:3}), g = N('Bär', 'Creature — Bear', '', {mc:'{1}{G}', cmc:2});
    w.__v = v; w.__l = l; w.__g = g; check(ev('costMods(window.__v).less') === 1 && ev('costMods(window.__l).less') === 0 && ev('costMods(window.__g).less') === 0, 'Momo: Vogel −1, Lemur und Bär nicht');
    ev('noteSpellCast(window.__v)'); check(ev('costMods(window.__v).less') === 0, 'Momo: zweiter fliegender Zauber kostet voll'); }
  // Nahiri's Lithoforming X=2: zwei Länder opfern, zwei ziehen, Länder kommen getappt
  await reset(); { const a = N('L1', 'Basic Land — Mountain'), b = N('L2', 'Basic Land — Mountain'), c = N('L3', 'Basic Land — Mountain'); put(a, b, c); const h0 = S().hand.length;
    w.__sp = C("Nahiri's Lithoforming"); w.__sp.lastX = 2; const pr = ev('abilSpellResolve')(w.__sp); await wait(200); await clickCard('L1'); await clickCard('L2'); await click('OK'); await click('Fertig'); await click('Weiter'); await wait(200); await drain(); await pr;
    check(S().bf.filter(x => /Land/.test(x.type)).length === 1 && S().hand.length === h0 + 2, `Nahiri: 2 Länder geopfert, 2 gezogen (${S().bf.filter(x => /Land/.test(x.type)).length}, ${S().hand.length - h0})`);
    const nl = N('Neu', 'Basic Land — Mountain'); put(nl); ev('manaEnter')(nl); check(nl.tap === true, 'Nahiri: neues Land kommt getappt'); ev('S.landsTappedKey = null'); }
  // Monstrous Emergence: Schaden in Höhe der Stärke der gewählten Kreatur
  await reset(); { const r = N('Riese', 'Creature — Giant', '', {pw:5, tg:5}); put(r); const o = opp('Opfer', {pw:3, tg:4});
    const pr = spell('Monstrous Emergence'); await wait(200); await clickCard('Riese'); await wait(200); await clickCard('Opfer'); await wait(300); await drain(); await pr;
    check(ev('BOT.gy.some(c => c.n === "Opfer")'), 'Monstrous Emergence: 5 Schaden töten das 3/4'); }
  // Ninja Pizza: Nahrung gibt Mana jeder Farbe durch Opfern
  await reset(); { const f = ev('newCard')({n:'Food', type:'Token Artifact — Food', o:'{2}, {T}, Sacrifice this token: You gain 3 life.', tok:true}); put(f); check(!(ev('manaChoices')(f) || []).length, 'Nahrung ohne Ninja Pizza: kein Mana');
    put(C('Ninja Pizza')); const o = ev('manaChoices')(f) || []; check(o.length >= 5 && o.every(x => x.sac), `Ninja Pizza: Nahrung gibt jede Farbe durch Opfern (${o.length})`); }

  // Meltstrider's Resolve: verzauberte Kreatur kämpft, +0/+2
  await reset(); { const b = N('Bär', 'Creature — Bear', '', {pw:3, tg:2}); const au = C("Meltstrider's Resolve"); put(b, au); au.eq = b.u; ev('commit()'); check(pt(b) === '3/4', `Meltstrider's Resolve: Bär 3/4 (${pt(b)})`);
    const o = opp('Gegner', {pw:2, tg:3}); const pr = ev('runTrigger')(au, abil(au, /fights up to one target/), {kind:"enter", c:au}); await wait(200); await clickCard('Gegner'); await wait(300); await drain(); await pr;
    check(ev('BOT.gy.some(c => c.n === "Gegner")') && S().bf.includes(b), 'Meltstrider\'s Resolve: Bär (3/4) besiegt 2/3 und überlebt'); }

  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
