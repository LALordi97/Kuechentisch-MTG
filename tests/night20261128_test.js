// Nacht 28.11.2026: Karten aus den Top-Decks – Text aus night20261128_cards.json (Scryfall)
const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync(require('path').join(__dirname, 'night20261128_cards.json'), 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
const C = (n, x = {}) => { if(!T[n]) throw new Error('Karte fehlt: ' + n); return ev('newCard')({...T[n], img:null, ...x}); };
const N = (n, type, o = '', x = {}) => ev('newCard')({n, type, o, img:null, ...x});
const open = () => !$('#modal').hidden;
const click = async t => { const b = [...d.querySelectorAll('#modalBox button')].find(b => b.textContent.trim().startsWith(t)); if(b){ b.click(); await wait(40); } return !!b; };
const clickCard = async t => { const el = [...d.querySelectorAll('#modalBox .card')].find(e => e.textContent.includes(t)); if(el){ el.click(); await wait(40); } return !!el; };
const cardsShown = () => [...d.querySelectorAll('#modalBox .card')].map(e => e.textContent);
const AUTO = ["Raffine's Informant", "Olivia's Wrath", "Peer into the Abyss", "Phyresis Outbreak", "Plaguecrafter", "Rakdos Charm", "Okiba-Gang Shinobi", "Patron of the Vein", "Practiced Offense", "Prize Pig", "Papalymo Totolymo", "Rakdos, Patron of Chaos", "Obsessive Pursuit", "Planetary Annihilation", "Otepec Huntmaster", "Plunder the Trollshaws", "Orcish Siegemaster", "Quirion Ranger", "Peregrin Took", "Puresteel Paladin", "Pyrrhic Strike", "Quest for Renewal", "Oracle of Mul Daya", "Oko, Thief of Crowns", "Palantír of Orthanc", "Promise of Loyalty", "Oblivious Bookworm", "Pick Your Poison"];
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

  for(const n of AUTO){ w.__c = T[n]; const st = ev('cardCheck(window.__c).status'); check(st === 'auto', `${n}: automatisch (${st})`); }
  const steps = async (src, st, ctx = {}) => { w.__src = src; w.__st = st; w.__ctx = ctx; const pr = ev('runSteps(window.__st, window.__src, window.__ctx)'); await wait(150); return pr; };

  // Raffine's Informant: ziehen, Nichtland abwerfen → +1/+1
  await reset(); { const ri = C("Raffine's Informant", {pw:2, tg:1}); put(ri); S().hand.push(N('Zauber', 'Instant', '')); const pr = ev('runTrigger')(ri, abil(ri, /connives/), {kind:"enter", c:ri}); await wait(200); await clickCard('Zauber'); await wait(150); await drain(); await pr;
    check(ri.c === 1 && S().gy.some(c => c.n === 'Zauber'), `Raffine's Informant: Zauber abgeworfen, +1 Marke (${ri.c})`); }
  // Olivia's Wrath: X = 2 Vampire
  await reset(); { const v1 = N('V1', 'Creature — Vampire', '', {pw:2, tg:2}), v2 = N('V2', 'Creature — Vampire', '', {pw:2, tg:2}), b = N('Bär', 'Creature — Bear', '', {pw:3, tg:3}); put(v1, v2, b); const o = opp('KI-Riese', {pw:4, tg:4});
    await spell("Olivia's Wrath"); await drain(); check(pt(v1) === '2/2' && pt(b) === '1/1' && pt(o) === '2/2', `Olivia's Wrath: Vampire bleiben, Bär 1/1, KI-Riese 2/2 (${pt(v1)}, ${pt(b)}, ${pt(o)})`); }
  // Peer into the Abyss gegen die KI
  await reset(); { ev('BOT.hand = []; botChanged()'); const pr = spell('Peer into the Abyss'); await wait(200); await click('KI'); await wait(300); await drain(); await pr;
    check(ev('BOT.hand.length') === 10 && ev('BOT.life') === 10, `Peer into the Abyss: KI zieht 10, hat 10 Leben (${ev('BOT.hand.length')}, ${ev('BOT.life')})`); }
  await reset(); { const h0 = S().hand.length; S().life = 15; const pr = spell('Peer into the Abyss'); await wait(200); await click('Du'); await wait(300); await drain(); await pr;
    check(S().hand.length - h0 === 5 && S().life === 7, `Peer into the Abyss: ich ziehe 5, 15 → 7 Leben (${S().hand.length - h0}, ${S().life})`); }
  // Phyresis Outbreak: KI hat dann 2 Gift → -2/-2
  await reset(); { const o = opp('KI-Riese', {pw:4, tg:4}); ev('BOT.poison = 1'); await spell('Phyresis Outbreak'); await drain();
    check(ev('BOT.poison') === 2 && pt(o) === '2/2', `Phyresis Outbreak: KI 2 Gift, Riese 2/2 (${ev('BOT.poison')}, ${pt(o)})`); }
  // Plaguecrafter: ich opfere ihn selbst, die KI ohne Kreatur wirft ab
  await reset(); { const pc = C('Plaguecrafter', {pw:3, tg:2}); put(pc); ev('BOT.hand = [newCard({n:"A", type:"Instant", o:""})]; botChanged()');
    const pr = ev('runTrigger')(pc, abil(pc, /each player sacrifices/), {kind:"enter", c:pc}); await wait(200); await clickCard('Plaguecrafter'); await wait(300); await drain(); await pr;
    check(S().gy.includes(pc) && ev('BOT.hand.length') === 0 && ev('BOT.gy.length') === 1, `Plaguecrafter: geopfert, KI wirft ab (${ev('BOT.hand.length')})`); }
  await reset(); { const pc = C('Plaguecrafter', {pw:3, tg:2}); put(pc); const o = opp('KI-Bär'); ev('BOT.hand = [newCard({n:"A", type:"Instant", o:""})]; botChanged()');
    const pr = ev('runTrigger')(pc, abil(pc, /each player sacrifices/), {kind:"enter", c:pc}); await wait(200); await clickCard('Plaguecrafter'); await wait(300); await drain(); await pr;
    check(ev('BOT.gy.some(c => c.n === "KI-Bär")') && ev('BOT.hand.length') === 1, 'Plaguecrafter: KI opfert den Bären und behält die Hand'); }
  // Rakdos Charm, Modus 3
  await reset(); { const rc = C('Rakdos Charm'); put(N('B1', 'Creature — Bear', '', {pw:2, tg:2}), N('B2', 'Creature — Bear', '', {pw:2, tg:2})); opp('K1'); opp('K2'); opp('K3');
    await steps(rc, ev('parseSteps')('Each creature deals 1 damage to its controller.', rc)); await drain(); check(S().life === 18 && ev('BOT.life') === 17, `Rakdos Charm: ich 18, KI 17 (${S().life}, ${ev('BOT.life')})`); }
  // Okiba-Gang Shinobi: Spieler wirft zwei ab
  await reset(); { const ok = C('Okiba-Gang Shinobi', {pw:3, tg:2}); put(ok); ev('BOT.hand = ["A","B","C"].map(n => newCard({n, type:"Instant", o:""})); botChanged()');
    const pr = ev('runTrigger')(ok, abil(ok, /discards two cards/), {kind:"combatDamage", c:ok, pid:"bot", much:3}); await wait(300); await drain(); await pr; check(ev('BOT.hand.length') === 1, `Okiba-Gang Shinobi: KI wirft 2 ab (${ev('BOT.hand.length')})`); }
  // Patron of the Vein: gestorbene KI-Kreatur ins Exil, Marken auf Vampire
  await reset(); { const pv = C('Patron of the Vein', {pw:4, tg:4}), v = N('V', 'Creature — Vampire', '', {pw:1, tg:1}), b = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(pv, v, b); w.__d = N('Tot', 'Creature — Bear', '', {pw:2, tg:2}); ev('BOT.gy.push(window.__d); botChanged(); commit()');
    const pr = ev('runTrigger')(pv, abil(pv, /exile it and put/), {kind:"die", c:w.__d, opp:true, pid:"bot"}); await wait(300); await drain(); await pr;
    check(ev('BOT.ex.some(c => c.n === "Tot")') && pv.c === 1 && v.c === 1 && !(b.c > 0), `Patron of the Vein: verbannt, Vampire +1 (${pv.c}, ${v.c}, ${b.c})`); }
  // Practiced Offense: Marken auf meine Kreaturen
  await reset(); { const po = C('Practiced Offense'), b1 = N('B1', 'Creature — Bear', '', {pw:2, tg:2}), b2 = N('B2', 'Creature — Bear', '', {pw:2, tg:2}); put(b1, b2);
    const pr = steps(po, [{t:"practicedCtr"}]); await wait(200); await click('Du'); await wait(200); await drain(); await pr; check(b1.c === 1 && b2.c === 1, `Practiced Offense: je +1 Marke (${b1.c}, ${b2.c})`); }
  // Prize Pig: Bandmarken, ab drei enttappen
  await reset(); { const pp = C('Prize Pig', {pw:2, tg:3}); put(pp); pp.tap = true;
    let pr = ev('runTrigger')(pp, abil(pp, /ribbon counters/), {kind:"youGain", much:2}); await wait(200); await drain(); await pr; check(pp.ribbon === 2 && pp.tap, `Prize Pig: 2 Bandmarken, noch getappt (${pp.ribbon})`);
    pr = ev('runTrigger')(pp, abil(pp, /ribbon counters/), {kind:"youGain", much:1}); await wait(200); await drain(); await pr; check(!pp.ribbon && !pp.tap && !(pp.c > 0), `Prize Pig: Marken weg, enttappt (${pp.ribbon}, ${pp.tap})`); }
  // Papalymo: nur Gegner, die diesen Zug Leben verloren haben
  await reset(); { const pa = C('Papalymo Totolymo', {pw:1, tg:3}); put(pa); opp('Klein', {pw:1, tg:1}); opp('Gross', {pw:5, tg:5}); ev('S.oppLost = {}');
    await steps(pa, ev('parseSteps')('Each opponent who lost life this turn sacrifices a creature with the greatest power among creatures they control.', pa)); await drain(); check(ev('BOT.bf.length') === 2, 'Papalymo: KI ohne Lebensverlust opfert nichts');
    ev('S.oppLost = {bot: turnKey()}'); await steps(pa, ev('parseSteps')('Each opponent who lost life this turn sacrifices a creature with the greatest power among creatures they control.', pa)); await drain();
    check(ev('BOT.gy.some(c => c.n === "Gross")') && ev('BOT.bf.length') === 1, 'Papalymo: KI opfert die stärkste Kreatur'); }
  // Rakdos, Patron of Chaos: KI opfert nichtfreiwillig nicht → ich ziehe zwei
  await reset(); { const rp = C('Rakdos, Patron of Chaos', {pw:6, tg:6}); put(rp); opp('Wertvoll', {pw:4, tg:4, cmc:4}); opp('Wertvoll2', {pw:4, tg:4, cmc:4}); const h0 = S().hand.length;
    const pr = ev('runTrigger')(rp, abil(rp, /may sacrifice two/), {kind:"phase", phase:"end", mine:true}); await wait(300); await click('KI'); await wait(300); await drain(); await pr;
    check(S().hand.length - h0 === 2 && ev('BOT.bf.length') === 2, `Rakdos, Patron of Chaos: KI opfert nicht, ich ziehe 2 (${S().hand.length - h0})`); }
  // Obsessive Pursuit: X = geopferte bleibende Karten, ab drei Lebensverknüpfung
  await reset(); { const op = C('Obsessive Pursuit'), b = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(op, b); ev('S.attacking = [S.bf[1].u]; S.attackKey = turnKey(); S.bf[1].atkKey = turnKey(); S.sacT = {k:turnKey(), l:[{n:"a"}, {n:"b"}, {n:"c"}]}');
    const pr = ev('runTrigger')(op, abil(op, /target attacking creature/), {kind:"attack"}); await wait(200); await clickCard('Bär'); await wait(200); await drain(); await pr;
    check(b.c === 3 && kw(b, 'lifelink'), `Obsessive Pursuit: 3 Marken und Lebensverknüpfung (${b.c})`); }
  // Planetary Annihilation: sechs Länder bleiben, 6 Schaden an jede Kreatur
  await reset(); { for(let i = 0; i < 8; i++) put(N('Wald' + i, 'Basic Land — Forest', '')); const g = N('Riese', 'Creature — Giant', '', {pw:7, tg:7}), b = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(g, b);
    ev('for(let i = 0; i < 9; i++) BOT.bf.push(newCard({n:"KI-Insel" + i, type:"Basic Land — Island", o:""})); botChanged(); commit()');
    const pr = spell('Planetary Annihilation'); await wait(300); await click('Erste sechs'); await wait(400); await drain(); await pr;
    check(S().bf.filter(c => /Land/.test(c.type)).length === 6 && ev('BOT.bf.filter(c => /Land/.test(c.type)).length') === 6 && S().gy.includes(b) && S().bf.includes(g), `Planetary Annihilation: je 6 Länder, Bär tot, Riese lebt (${S().bf.filter(c => /Land/.test(c.type)).length}, ${ev('BOT.bf.filter(c => /Land/.test(c.type)).length')})`); }
  // Otepec Huntmaster: Dinosaurier erhält Eile
  await reset(); { const oh = C('Otepec Huntmaster', {pw:1, tg:2}), d = N('Dino', 'Creature — Dinosaur', '', {pw:4, tg:4}), b = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(oh, d, b); d.sick = true;
    const pr = run(oh, /Target Dinosaur gains haste/); await wait(200); const shown = cardsShown(); await clickCard('Dino'); await wait(200); await drain(); await pr;
    check(kw(d, 'haste') && !shown.some(t => t.includes('Bär')), `Otepec Huntmaster: nur Dinosaurier wählbar, Dino hat Eile (${shown.length})`); }
  // Plunder the Trollshaws: aus dem Friedhof 2, sonst 1
  await reset(); { const h0 = S().hand.length; await spell('Plunder the Trollshaws'); await drain(); check(S().hand.length - h0 === 1, `Plunder the Trollshaws: aus der Hand 1 Karte (${S().hand.length - h0})`); }
  await reset(); { const h0 = S().hand.length; w.__sp = C('Plunder the Trollshaws'); w.__sp.fromGy = true; await ev('abilSpellResolve')(w.__sp); await wait(200); await drain(); check(S().hand.length - h0 === 2, `Plunder the Trollshaws: aus dem Friedhof 2 Karten (${S().hand.length - h0})`); }
  // Orcish Siegemaster: andere Orks und Goblins haben Trampelschaden
  await reset(); { const os = C('Orcish Siegemaster', {pw:2, tg:2}), g = N('Gob', 'Creature — Goblin', '', {pw:1, tg:1}), o = N('Ork', 'Creature — Orc Warrior', '', {pw:1, tg:1}), e = N('Elf', 'Creature — Elf', '', {pw:1, tg:1}); put(os, g, o, e);
    check(kw(g, 'trample') && kw(o, 'trample') && !kw(e, 'trample') && kw(os, 'trample'), 'Orcish Siegemaster: Goblin und Ork trampeln, Elf nicht'); }
  // Quirion Ranger: Wald zurück auf die Hand, Kreatur enttappen, nur einmal pro Zug
  await reset(); { const qr = C('Quirion Ranger', {pw:1, tg:1}), f = N('Wald', 'Basic Land — Forest', ''), b = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(qr, f, b); b.tap = true;
    let pr = ev('activateAbility')(qr, abil(qr, /Untap target creature/)); await wait(200); await clickCard('Wald'); await wait(200); await clickCard('Bär'); await wait(200); await drain(); await pr;
    check(S().hand.includes(f) && !b.tap, `Quirion Ranger: Wald auf der Hand, Bär enttappt (${b.tap})`);
    const f2 = N('Wald2', 'Basic Land — Forest', ''); put(f2); b.tap = true; pr = ev('activateAbility')(qr, abil(qr, /Untap target creature/)); await wait(200); await drain(); await pr;
    check(S().bf.includes(f2) && b.tap, 'Quirion Ranger: zweites Mal im selben Zug gesperrt'); }
  // Peregrin Took: dazu ein Food-Token
  await reset(); { put(C('Peregrin Took', {pw:2, tg:3})); const src = N('Quelle', 'Sorcery', ''); await steps(src, ev('parseSteps')('Create two 1/1 white Soldier creature tokens.', src)); await drain();
    check(S().bf.filter(c => c.tok && /Soldier/.test(c.type)).length === 2 && S().bf.filter(c => c.tok && /Food/.test(c.type)).length === 1, `Peregrin Took: 2 Soldaten und 1 Food (${S().bf.filter(c => c.tok).map(c => c.n).join(", ")})`); }
  // Puresteel Paladin: Ausrüsten für {0} mit drei Artefakten
  await reset(); { put(C('Puresteel Paladin', {pw:2, tg:2})); check(!ev('puresteelOn()'), 'Puresteel Paladin: ohne drei Artefakte nicht aktiv');
    put(N('A1', 'Artifact', ''), N('A2', 'Artifact', ''), N('Schwert', 'Artifact — Equipment', 'Equipped creature gets +2/+0.\nEquip {3}')); check(ev('puresteelOn()'), 'Puresteel Paladin: mit drei Artefakten Ausrüsten {0}'); }
  // Pyrrhic Strike: mit Blight beide Modi
  await reset(); { const ps = C('Pyrrhic Strike'); ps.blighted = true; const a = ev('parseAbilities')(ps).find(x => x.modal); w.__ps = ps; w.__md = a.modal; const r = await ev('chooseModes(window.__ps, window.__md)');
    check(Array.isArray(r) && r.length === 2, `Pyrrhic Strike: Zusatzkosten bezahlt – beide Modi (${r && r.length})`); }
  // Quest for Renewal: mit vier Questmarken im fremden Enttappsegment enttappen
  await reset(); { const q = C('Quest for Renewal'); q.c = 4; const b = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(q, b); b.tap = true; ev('TURN = {active:"bot", n:21, starter:me.id, phase:0}'); ev('remindTriggers("upkeep", false)'); await wait(100);
    check(!b.tap, 'Quest for Renewal: Bär im Zug der KI enttappt'); }
  // Oracle of Mul Daya: Land von oben spielen
  await reset(); { const om = C('Oracle of Mul Daya', {pw:2, tg:2}); put(om); w.__om = om; const items = ev('abilMenuItems(window.__om, "bf")') || []; const it = items.find(i => /Oberstes Land spielen/.test(i.l || ''));
    check(!!it, 'Oracle of Mul Daya: Menü «Oberstes Land spielen»');
    if(it){ const top = S().library[0]; it.f(); await wait(300); await drain(); check(S().bf.includes(top), `Oracle of Mul Daya: ${top.n} von oben gespielt`); } }

  // Oko: +1 macht einen KI-Drachen zum 3/3-Elch; −5 tauscht
  await reset(); { const ok = C('Oko, Thief of Crowns'); put(ok); const o = opp('Drache', {pw:5, tg:5}); o.o = 'Flying'; o.kw = ['Flying']; ev('botChanged(); commit()');
    const pr = steps(ok, ev('parseSteps')('Target artifact or creature loses all abilities and becomes a green Elk creature with base power and toughness 3/3.', ok)); await wait(200); await clickCard('Drache'); await wait(200); await drain(); await pr;
    w.__o = o; check(pt(o) === '3/3' && /Elk/.test(o.type) && !ev('kwHas(window.__o, "flying")'), `Oko +1: Drache ist ein 3/3-Elch ohne Flugfähigkeit (${pt(o)}, ${o.type})`); }
  await reset(); { const ok = C('Oko, Thief of Crowns'); const fd = N('Food', 'Token Artifact — Food', '', {tok:true}); put(ok, fd); const o = opp('Kleiner', {pw:2, tg:2});
    const pr = steps(ok, ev('parseSteps')('Exchange control of target artifact or creature you control and target creature an opponent controls with power 3 or less.', ok)); await wait(200); await clickCard('Food'); await wait(200); await clickCard('Kleiner'); await wait(300); await drain(); await pr;
    check(S().bf.some(c => c.n === 'Kleiner') && !S().bf.includes(fd) && ev('BOT.bf.some(c => c.n === "Food")'), 'Oko −5: Food gegen den 2/2 getauscht'); }

  // Palantír of Orthanc: KI lässt bei 3 Marken ziehen, bei 1 Marke mahlen
  await reset(); { const pl = C('Palantír of Orthanc'); pl.c = 2; put(pl); const h0 = S().hand.length;
    const pr = ev('runTrigger')(pl, abil(pl, /influence counter/), {kind:"phase", phase:"end", mine:true}); await wait(300); await click('Fertig'); await wait(200); await click('KI'); await wait(300); await drain(); await pr;
    check(pl.c === 3 && S().hand.length - h0 === 1, `Palantír: 3 Marken, KI lässt ziehen (${pl.c}, ${S().hand.length - h0})`); }
  await reset(); { const pl = C('Palantír of Orthanc'); put(pl); ev('S.library = Array(5).fill(0).map(() => newCard({n:"Teuer", type:"Sorcery", o:"", cmc:4}))'); const h0 = S().hand.length;
    const pr = ev('runTrigger')(pl, abil(pl, /influence counter/), {kind:"phase", phase:"end", mine:true}); await wait(300); await click('Fertig'); await wait(200); await click('KI'); await wait(300); await drain(); await pr;
    check(pl.c === 1 && S().hand.length === h0 && S().gy.length === 1 && ev('BOT.life') === 16, `Palantír: 1 Marke, KI lässt mahlen und verliert 4 (${S().gy.length}, ${ev('BOT.life')})`); }

  // Promise of Loyalty: je eine Kreatur bleibt mit Gelöbnismarke; die der KI greift mich nicht an
  await reset(); { const a = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}), b = N('Wolf', 'Creature — Wolf', '', {pw:3, tg:3}); put(a, b); const o1 = opp('K1', {pw:2, tg:2}), o2 = opp('K2', {pw:5, tg:5}); o1.sick = false; o2.sick = false;
    const pr = spell('Promise of Loyalty'); await wait(200); await clickCard('Wolf'); await wait(300); await drain(); await pr;
    const kept = ev('BOT.bf.filter(c => isCreature(c))');
    check(S().gy.includes(a) && b.vow === 1 && kept.length === 1 && kept[0].vow === 1, `Promise of Loyalty: Wolf bleibt, KI behält eine Kreatur mit Gelöbnismarke (${kept.length})`);
    check(ev('botChooseAttackers({id:me.id, blk:[], life:20}).length') === 0, 'Promise of Loyalty: KI greift mit der Gelöbnis-Kreatur nicht an'); }

  // Oblivious Bookworm: ziehen und abwerfen – ausser nach einer verdeckten Karte diesen Zug
  await reset(); { const ob = C('Oblivious Bookworm', {pw:2, tg:3}); put(ob); S().hand.push(N('Alt', 'Instant', '')); const h0 = S().hand.length;
    const pr = ev('runTrigger')(ob, abil(ob, /you may draw a card/), {kind:"phase", phase:"end", mine:true}); await wait(200); await click('Ja'); await wait(200); await clickCard('Alt'); await wait(200); await drain(); await pr;
    check(S().hand.length === h0 && S().gy.some(c => c.n === 'Alt'), `Oblivious Bookworm: gezogen und abgeworfen (${S().hand.length - h0})`); }
  await reset(); { const ob = C('Oblivious Bookworm', {pw:2, tg:3}); put(ob); w.__m = N('Verdeckt', 'Creature — Bear', '', {pw:2, tg:2}); S().hand.push(w.__m); await ev('play(window.__m.u, true)'); await wait(100); const h0 = S().hand.length;
    const pr = ev('runTrigger')(ob, abil(ob, /you may draw a card/), {kind:"phase", phase:"end", mine:true}); await wait(200); await click('Ja'); await wait(300); await drain(); await pr;
    check(S().hand.length === h0 + 1, `Oblivious Bookworm: nach verdeckter Karte kein Abwerfen (${S().hand.length - h0})`); }

  // Pick Your Poison: Modi mit Summe 4
  await reset(); { const pr = spell('Pick Your Poison'); await wait(200); const bs = [...d.querySelectorAll('#modalBox button')].map(b => b.textContent);
    check(bs.filter(t => /×/.test(t)).length === 4, `Pick Your Poison: vier Kombinationen (${bs.filter(t => /×/.test(t)).join(' | ')})`);
    await click('2× Create'); await wait(300); await drain(); await pr; check(S().bf.filter(c => c.tok && /Snake/.test(c.type)).length === 2, `Pick Your Poison: zwei Schlangen (${S().bf.filter(c => c.tok).length})`); }
  await reset(); { const b = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(b); const o = opp('KI-Riese', {pw:4, tg:4}); const pr = spell('Pick Your Poison'); await wait(200); await click('1× All creatures'); await wait(300); await drain(); await pr;
    check(S().gy.includes(b) && pt(o) === '2/2', `Pick Your Poison: -2/-2 für alle (${pt(o)})`); }

  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
