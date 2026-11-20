// Nacht 20.11.2026: Karten aus den neuen Top-Decks (Bracket 3/4, Standard, Pauper) – Text aus night20261120_cards.json (Scryfall)
const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync(require('path').join(__dirname, 'night20261120_cards.json'), 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
const C = (n, x = {}) => { if(!T[n]) throw new Error('Karte fehlt: ' + n); return ev('newCard')({...T[n], img:null, ...x}); };
const N = (n, type, o = '', x = {}) => ev('newCard')({n, type, o, img:null, ...x});
const open = () => !$('#modal').hidden;
const click = async t => { const b = [...d.querySelectorAll('#modalBox button')].find(b => b.textContent.trim().startsWith(t)); if(b){ b.click(); await wait(40); } return !!b; };
const clickCard = async t => { const el = [...d.querySelectorAll('#modalBox .card')].find(e => e.textContent.includes(t)); if(el){ el.click(); await wait(40); } return !!el; };
const cardsShown = () => [...d.querySelectorAll('#modalBox .card')].map(e => e.textContent);
const AUTO = ['Altar of the Brood', 'Arms of Hadar', 'Avenger of Zendikar', 'Bastion Protector', 'Angel of Vitality', 'Angelic Field Marshal', 'Anger', 'Beastmaster Ascension', 'Ancestral Mask',
  'Ancient Copper Dragon', 'Ancient Gold Dragon', 'Agent Frank Horrigan', 'Access Tunnel', 'Banquet Guests', "Assassin's Trophy", 'Anointed Procession', 'Archfiend of Ifnir', 'Alisaie Leveilleur',
  'Amalia Benavides Aguirre', 'Avacyn, Angel of Horror', 'Barret, Avalanche Leader', 'Anthropological Mission', 'Afterlife from the Loam', 'Akiri, Fearless Voyager', 'Academy Manufactor',
  "Agadeem's Awakening // Agadeem, the Undercrypt", 'Agent of the Iron Throne'];
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

  // Altar of the Brood: andere bleibende Karte kommt → jeder Gegner mahlt eine
  await reset(); { const al = C('Altar of the Brood'); put(al); const pr = run(al, /each opponent mills/); await pr; await wait(100);
    check(ev('BOT.library.length') === 19 && ev('BOT.gy.length') === 1, `Altar of the Brood: KI mahlt 1 (Bibliothek ${ev('BOT.library.length')}, Friedhof ${ev('BOT.gy.length')})`); }
  // Arms of Hadar: Kreaturen der KI -2/-2 → 2/2 sterben, meine bleiben
  await reset(); { const mine = N('Meins', 'Creature — Bear', '', {pw:2, tg:2}); put(mine); opp('Bär1'); opp('Riese', {pw:4, tg:4});
    const ah = C('Arms of Hadar'); const pr = ev('abilSpellResolve')(ah); await wait(150); await click('KI'); await wait(250); await drain(); await pr;
    check(!ev('BOT.bf.some(c => c.n === "Bär1")') && ev('BOT.bf.some(c => c.n === "Riese")') && S().bf.includes(mine) && pt(mine) === '2/2', `Arms of Hadar: Bär der KI stirbt, Riese bleibt, meine Kreatur unberührt (${pt(mine)})`); }
  await reset(); { const mine = N('Meins', 'Creature — Bear', '', {pw:3, tg:3}); put(mine); opp('Bär1');
    const ah = C('Arms of Hadar'); const pr = ev('abilSpellResolve')(ah); await wait(150); await click('Du'); await wait(250); await drain(); await pr;
    check(pt(mine) === '1/1' && ev('BOT.bf.some(c => c.n === "Bär1")'), `Arms of Hadar auf mich: nur meine Kreaturen -2/-2 (${pt(mine)})`); }
  // Avenger of Zendikar: eine Pflanze pro Land, Landfall +1/+1 auf jede Pflanze
  await reset(); { for(let i = 0; i < 3; i++) put(N('Forest', 'Basic Land — Forest')); const av = C('Avenger of Zendikar', {pw:5, tg:5}); put(av);
    await run(av, /Plant creature token for each land/); await wait(100); await drain();
    const plants = () => S().bf.filter(c => /Plant/.test(c.type || '') || /Plant/.test(c.n));
    check(plants().length === 3, `Avenger: 3 Pflanzen bei 3 Ländern (${plants().length})`);
    const pr = run(av, /counter on each Plant/); await wait(100); await click('Ja'); await wait(150); await pr; await drain();
    check(plants().every(c => (c.c || 0) === 1), `Avenger Landfall: jede Pflanze +1/+1 (${plants().map(c => c.c || 0).join(',')})`); }
  // Bastion Protector: Commander +2/+2 und unzerstörbar
  await reset(); { const cm = N('Chef', 'Legendary Creature — Human', '', {pw:3, tg:3, cmdr:true}), nb = N('Normal', 'Creature — Human', '', {pw:2, tg:2}); put(cm, nb, C('Bastion Protector', {pw:3, tg:3}));
    check(pt(cm) === '5/5' && ev('kwHas')(cm, 'indestructible') && pt(nb) === '2/2' && !ev('kwHas')(nb, 'indestructible'), `Bastion Protector: Commander 5/5 unzerstörbar, andere nicht (${pt(cm)}, ${pt(nb)})`); }
  // Angel of Vitality: +2/+2 ab 25 Leben
  await reset(); { const an = C('Angel of Vitality', {pw:2, tg:2}); put(an); check(pt(an) === '2/2', 'Angel of Vitality: 20 Leben → 2/2'); ev('S.life = 25'); check(pt(an) === '4/4', `Angel of Vitality: 25 Leben → 4/4 (${pt(an)})`); }
  // Angelic Field Marshal: mit Commander +2/+2, Kreaturen Wachsamkeit
  await reset(); { const fm = C('Angelic Field Marshal', {pw:3, tg:3}), nb = N('Normal', 'Creature — Human', '', {pw:2, tg:2}); put(fm, nb);
    check(pt(fm) === '3/3' && !ev('kwHas')(nb, 'vigilance'), 'Field Marshal: ohne Commander nichts');
    put(N('Chef', 'Legendary Creature — Human', '', {pw:3, tg:3, cmdr:true}));
    check(pt(fm) === '5/5' && ev('kwHas')(nb, 'vigilance'), `Field Marshal: mit Commander 5/5, andere wachsam (${pt(fm)})`); }
  // Anger: im Friedhof mit Berg → Eile
  await reset(); { const nb = N('Normal', 'Creature — Human', '', {pw:2, tg:2}); put(nb); S().gy.push(C('Anger'));
    check(!ev('kwHas')(nb, 'haste'), 'Anger: ohne Berg keine Eile'); put(N('Mountain', 'Basic Land — Mountain'));
    check(ev('kwHas')(nb, 'haste'), 'Anger: mit Berg Eile'); }
  // Beastmaster Ascension: ab 7 Marken +5/+5
  await reset(); { const ba = C('Beastmaster Ascension'), nb = N('Normal', 'Creature — Human', '', {pw:2, tg:2}); put(ba, nb); ba.c = 6; check(pt(nb) === '2/2', 'Beastmaster: 6 Marken → nichts'); ba.c = 7; check(pt(nb) === '7/7', `Beastmaster: 7 Marken → 7/7 (${pt(nb)})`); }
  // Ancestral Mask: +2/+2 je andere Verzauberung
  await reset(); { const nb = N('Normal', 'Creature — Human', '', {pw:2, tg:2}); put(nb); const am = C("Ancestral Mask"); am.eq = nb.u; put(am, N('Ench', 'Enchantment')); w.__e = N('Ench2', 'Enchantment'); ev('BOT.bf.push(window.__e); botChanged(); commit()');
    check(pt(nb) === '6/6', `Ancestral Mask: zwei andere Verzauberungen → 6/6 (${pt(nb)})`); }
  // Ancient Copper Dragon: W20, so viele Schätze
  await reset(); { const cd = C('Ancient Copper Dragon', {pw:6, tg:5}); put(cd); w.Math.random = () => 0.3; await run(cd, /roll a d20/); await wait(100); w.Math.random = Math.random;
    const tr = S().bf.filter(c => /Treasure/.test(c.n)).length; check(tr === 7, `Ancient Copper Dragon: W20 = 7 → 7 Schätze (${tr})`); }
  // Ancient Gold Dragon: Feendrachen in Höhe des Wurfs
  await reset(); { const gd = C('Ancient Gold Dragon', {pw:7, tg:10}); put(gd); w.Math.random = () => 0.1; await run(gd, /roll a d20/); await wait(100); w.Math.random = Math.random;
    const fd = S().bf.filter(c => /Faerie/.test((c.n || '') + (c.type || ''))); check(fd.length === 3 && fd.every(c => ev('kwHas')(c, 'flying')), `Ancient Gold Dragon: W20 = 3 → 3 fliegende Feendrachen (${fd.length})`); }
  // Agent Frank Horrigan: zweimal vermehren; unzerstörbar, wenn er diesen Zug angegriffen hat
  await reset(); { const fh = C('Agent Frank Horrigan', {pw:6, tg:6}), nb = N('Normal', 'Creature — Human', '', {pw:2, tg:2, c:1}); put(fh, nb);
    const steps = ev('parseSteps')('proliferate twice', fh); check(steps.filter(s => s.t === 'proliferate').length === 2, 'Frank Horrigan: zweimal vermehren');
    check(!ev('kwHas')(fh, 'indestructible'), 'Frank Horrigan: ohne Angriff nicht unzerstörbar');
    ev('markOnAttack')([fh]); check(ev('kwHas')(fh, 'indestructible'), 'Frank Horrigan: nach Angriff unzerstörbar');
    ev('TURN.n = 21'); check(!ev('kwHas')(fh, 'indestructible'), 'Frank Horrigan: nächster Zug wieder zerstörbar'); }
  // Access Tunnel: nur Kreaturen mit Stärke 3 oder weniger
  await reset(); { const at = C('Access Tunnel'); const kl = N('Klein', 'Creature — Human', '', {pw:3, tg:3}), gr = N('Gross', 'Creature — Giant', '', {pw:5, tg:5}); put(at, kl, gr);
    const pr = run(at, /can't be blocked/); await wait(150); const shown = cardsShown(); await clickCard('Klein'); await wait(150); await drain(); await pr;
    check(shown.some(t => t.includes('Klein')) && !shown.some(t => t.includes('Gross')) && ev('kwHas')(kl, 'unblockable') || (kl.tkw || []).some(k => /unblockable/i.test(k)), `Access Tunnel: nur Klein wählbar, wird unblockbar (${shown.length} Karten, ${JSON.stringify(kl.tkw || [])})`); }
  // Banquet Guests: doppelt X Marken
  await reset(); { const bg = C("Banquet Guests", {pw:0, tg:0}); bg.lastX = 2; S().bf.push(bg); ev('manaEnter')(bg); check(bg.c === 4, `Banquet Guests: X = 2 → 4 Marken (${bg.c})`); }
  // Assassin's Trophy: zerstört bleibende Karte der KI, KI sucht ein Standardland
  await reset(); { opp('Opfer'); ev('BOT.library.unshift(newCard({n:"Plains", type:"Basic Land — Plains", o:""})); botChanged()');
    const tr = C("Assassin's Trophy"); const pr = ev('abilSpellResolve')(tr); await wait(150); await clickCard('Opfer'); await wait(300); await drain(); await pr; await wait(100);
    check(!ev('BOT.bf.some(c => c.n === "Opfer")') && ev('BOT.bf.some(c => c.n === "Plains")'), `Assassin's Trophy: Opfer zerstört, KI holt Plains (${ev('BOT.bf.map(c => c.n).join()')})`); }
  // Anointed Procession: doppelt so viele Token
  await reset(); { const ap = C('Anointed Procession'); put(ap); const src = N('Quelle', 'Sorcery', 'Create two 1/1 white Soldier creature tokens.');
    await ev('runSteps')(ev('parseSteps')('Create two 1/1 white Soldier creature tokens.', src), src, {}); await wait(100);
    const k = S().bf.filter(c => c.tok).length; check(k === 4, `Anointed Procession: 2 → 4 Token (${k})`); }
  // Archfiend of Ifnir: Abwerfen → -1/-1 auf jede gegnerische Kreatur
  await reset(); { const af = C('Archfiend of Ifnir', {pw:5, tg:4}); put(af); opp('Klein', {pw:1, tg:1}); opp('Bär');
    const h = N('Weg', 'Instant'); S().hand.push(h); ev(`moveCard(${JSON.stringify(h.u)}, "gy")`); await wait(300); await drain();
    check(!ev('BOT.bf.some(c => c.n === "Klein")') && ev('BOT.bf.find(c => c.n === "Bär").c') === -1, `Archfiend of Ifnir: Abwerfen → Klein stirbt, Bär -1/-1 (${ev('BOT.bf.map(c => c.n + ":" + (c.c || 0)).join()')})`); }
  // Alisaie: zweiter Zauber pro Zug kostet {2} weniger
  await reset(); { put(C('Alisaie Leveilleur', {pw:2, tg:2})); w.__sp = N('Zauber', 'Sorcery', 'Draw a card.', {cmc:4, mc:'{3}{U}'});
    ev('S.spellsCast = 0; S.spellsKey = turnKey()'); const n0 = ev('spellsThisTurn()'); const l0 = ev('costMods(window.__sp).less');
    ev('noteSpellCast()'); const l1 = ev('costMods(window.__sp).less'); ev('noteSpellCast()'); const l2 = ev('costMods(window.__sp).less');
    check(l0 === 0 && l1 === 2 && l2 === 0, `Alisaie: erster 0, zweiter −2, dritter 0 (${n0}: ${l0}/${l1}/${l2})`); }
  // Amalia: erkundet (Land → Hand; sonst Marke)
  await reset(); { const am = C('Amalia Benavides Aguirre', {pw:2, tg:2}); put(am); S().library.unshift(N('Zauber', 'Sorcery'));
    const pr = run(am, /explores/); await wait(150); await click('Ja'); await wait(150); await pr; await drain();
    check(am.c === 1 && S().gy.some(c => c.n === 'Zauber'), `Amalia: Nichtland → +1/+1-Marke, Karte in den Friedhof (${am.c})`);
    const h0 = S().hand.length; await run(am, /explores/); await wait(100); await drain();
    check(S().hand.length === h0 + 1 && am.c === 1, 'Amalia: Land → auf die Hand'); }
  await reset(); { const am = C('Amalia Benavides Aguirre', {pw:19, tg:19}); const nb = N('Normal', 'Creature — Human', '', {pw:2, tg:2}); put(am, nb); opp('Bär'); S().library.unshift(N('Zauber', 'Sorcery'));
    const pr = run(am, /explores/); await wait(150); await click('Nein'); await wait(300); await pr; await drain();
    check(ev('power')(am) === 20 && !S().bf.includes(nb) && S().bf.includes(am) && !ev('BOT.bf.some(c => c.n === "Bär")'), `Amalia: Stärke genau 20 → alle anderen Kreaturen zerstört (${ev('power')(am)})`); }
  // Avacyn, Angel of Horror: gestorbene Kreatur kommt in der nächsten Endphase zurück
  await reset(); { const ah = C('Avacyn, Angel of Horror', {pw:8, tg:8}), nb = N('Normal', 'Creature — Human', '', {pw:2, tg:2}); put(ah, nb);
    ev(`moveCard(${JSON.stringify(nb.u)}, "gy")`); await wait(300); await drain();
    check(S().gy.includes(nb) && (S().delayed || []).some(x => x.action === 'gyReturnBf'), 'Avacyn: Rückkehr vorgemerkt');
    ev('runDelayed("end", true)'); await wait(100);
    check(S().bf.includes(nb), 'Avacyn: Kreatur kehrt in der Endphase zurück'); }

  // Barret: Avalanche! – Ausrüstung kommt → 2/2-Rebell; Kampfbeginn: Ausrüstung an Rebell
  await reset(); { const ba = C('Barret, Avalanche Leader', {pw:4, tg:3}); put(ba); const eq = N('Schwert', 'Artifact — Equipment', 'Equipped creature gets +1/+1.\nEquip {1}'); put(eq);
    const a = abil(ba, /Equipment you control enters/); check(!!a && a.kind === 'trig', 'Barret: Avalanche!-Auslöser erkannt');
    await run(ba, /Equipment you control enters/); await wait(100); const reb = S().bf.find(c => c.tok && /Rebel/.test((c.type || '') + c.n)); check(!!reb, 'Barret: 2/2-Rebell erzeugt');
    const pr = run(ba, /attach up to one target Equipment/); await wait(150); await clickCard('Schwert'); await wait(150); await clickCard('TOKEN'); await wait(150); await pr; await drain();
    check(reb && eq.eq === reb.u, `Barret: Schwert am Rebellen (${eq.eq === (reb || {}).u})`); }
  // Anthropological Mission: unter drei Marken abwerfen, ab drei nicht mehr
  await reset(); { const am = C('Anthropological Mission'); put(am); S().library.unshift(N('Z1', 'Sorcery'), N('Z2', 'Sorcery'), N('Z3', 'Sorcery'));
    S().hand.push(N('Alt', 'Instant')); let pr = run(am, /quest counter/); await wait(200); await clickCard('Alt'); await wait(80); await click('Weiter'); await click('OK'); await click('Abwerfen'); await wait(150); await pr; await drain();
    check(am.c === 1 && S().hand.length === 1 && S().gy.length === 1, `Mission: 1 Marke, gezogen und abgeworfen (Marken ${am.c}, Hand ${S().hand.length}, Friedhof ${S().gy.length})`);
    am.c = 2; pr = run(am, /quest counter/); await wait(200); await pr; await drain();
    check(am.c === 3 && S().hand.length === 2, `Mission: dritte Marke → nicht abwerfen (Hand ${S().hand.length})`); }
  // Afterlife from the Loam: je eine Kreatur aus jedem Friedhof, auch Zombie
  await reset(); { S().gy.push(N('Meine', 'Creature — Elf', '', {pw:1, tg:1})); w.__g = N('Seine', 'Creature — Giant', '', {pw:5, tg:5}); ev('BOT.gy.push(window.__g); botChanged(); commit()');
    const af = C('Afterlife from the Loam'); const pr = ev('abilSpellResolve')(af); await wait(150); await clickCard('Meine'); await wait(150); await clickCard('Seine'); await wait(300); await drain(); await pr; await wait(100);
    const a = S().bf.find(c => c.n === 'Meine'), b = S().bf.find(c => c.n === 'Seine');
    check(a && b && /Zombie/.test(a.type) && /Zombie/.test(b.type) && ev('BOT.gy.length') === 0, `Afterlife: beide Kreaturen bei mir, Zombies (${S().bf.map(c => c.n + ':' + c.type).join('; ')})`); }
  // Akiri: Ausrüstung lösen → Kreatur getappt und unzerstörbar
  await reset(); { const ak = C('Akiri, Fearless Voyager', {pw:3, tg:3}), cr = N('Träger', 'Creature — Human', '', {pw:2, tg:2}); const eq = N('Schwert', 'Artifact — Equipment', 'Equip {1}'); eq.eq = cr.u; put(ak, cr, eq);
    const pr = run(ak, /unattach an Equipment/); await wait(150); await click('Ja'); await wait(80); await clickCard('Schwert'); await wait(150); await pr; await drain();
    check(!eq.eq && cr.tap && ev('kwHas')(cr, 'indestructible'), `Akiri: Schwert gelöst, Träger getappt und unzerstörbar (${eq.eq}, ${cr.tap})`); }
  // Academy Manufactor: statt Schatz je einen Clue, Food und Treasure
  await reset(); { put(C('Academy Manufactor', {pw:1, tg:1})); const src = N('Quelle', 'Sorcery', 'Create a Treasure token.');
    await ev('runSteps')(ev('parseSteps')('Create a Treasure token.', src), src, {}); await wait(100);
    const ns = S().bf.filter(c => c.tok).map(c => c.n).sort().join(); check(/Clue/.test(ns) && /Food/.test(ns) && /Treasure/.test(ns) && S().bf.filter(c => c.tok).length === 3, `Academy Manufactor: Clue, Food, Treasure (${ns})`); }
  // Agadeem's Awakening: verschiedene Manawerte bis X
  await reset(); { S().gy.push(N('A2', 'Creature — X', '', {cmc:2}), N('B2', 'Creature — X', '', {cmc:2}), N('C3', 'Creature — X', '', {cmc:3}), N('D5', 'Creature — X', '', {cmc:5}));
    const ag = C("Agadeem's Awakening // Agadeem, the Undercrypt"); const steps = ev('parseSteps')(ag.o, ag); const pr = ev('runSteps')(steps, ag, {X:3}); await wait(150);
    check(!cardsShown().some(t => t.includes('D5')), 'Agadeem: Manawert über X nicht wählbar');
    await clickCard('A2'); await clickCard('B2'); await clickCard('C3'); await click('Weiter'); await click('OK'); await click('Fertig'); await click('Übernehmen'); await wait(150); await pr; await drain();
    check(S().bf.length === 2 && S().bf.some(c => c.n === 'C3') && S().gy.some(c => c.n === 'B2' || c.n === 'A2'), `Agadeem: zwei Karten mit verschiedenem Manawert (${S().bf.map(c => c.n).join()})`); }
  // Agent of the Iron Throne: mit Commander-Kreatur verliert jeder Gegner 1 Leben, wenn eine Kreatur stirbt
  await reset(); { put(C('Agent of the Iron Throne')); const nb = N('Normal', 'Creature — Human', '', {pw:2, tg:2}); put(nb);
    ev(`moveCard(${JSON.stringify(nb.u)}, "gy")`); await wait(150); check(ev('BOT.life') === 20, 'Iron Throne: ohne Commander nichts');
    put(N('Chef', 'Legendary Creature — Human', '', {pw:3, tg:3, cmdr:true})); const n2 = N('Normal2', 'Artifact', ''); put(n2);
    ev(`moveCard(${JSON.stringify(n2.u)}, "gy")`); await wait(200); check(ev('BOT.life') === 19, `Iron Throne: Artefakt stirbt → KI verliert 1 (${ev('BOT.life')})`); }

  // Ancient Brass Dragon: W20, Kreaturen aus allen Friedhöfen bis zum Gesamt-Manawert
  await reset(); { const bd = C('Ancient Brass Dragon', {pw:7, tg:6}); put(bd); S().gy.push(N('M3', 'Creature — X', '', {cmc:3}), N('M9', 'Creature — X', '', {cmc:9}));
    w.__g = N('S4', 'Creature — Y', '', {cmc:4}); ev('BOT.gy.push(window.__g); botChanged(); commit()');
    w.Math.random = () => 0.35; const pr = run(bd, /roll a d20/); await wait(200); w.Math.random = Math.random;
    const shown = cardsShown(); await clickCard('M3'); await clickCard('S4'); await click('Weiter'); await click('OK'); await click('Fertig'); await click('Übernehmen'); await wait(300); await pr; await drain(); await wait(100);
    check(!shown.some(t => t.includes('M9')) && S().bf.some(c => c.n === 'M3') && S().bf.some(c => c.n === 'S4') && ev('BOT.gy.length') === 0, `Ancient Brass Dragon: W20 = 8 → M3 und S4 ins Spiel (${S().bf.map(c => c.n).join()})`); }

  // A Display of My Dark Power (Archenemy): Länder geben ein Mana mehr bis zu meinem nächsten Zug, auch die KI plant mit mehr Mana
  await reset(); { const SCH = JSON.parse(fs.readFileSync(require('path').join(__dirname, 'oracle_schemes.json'), 'utf8')); const sc = SCH.find(x => x[0] === 'A Display of My Dark Power');
    w.__sc = {n:sc[0], o:sc[2]}; check(ev('cardCheck(schemeAsSpell(window.__sc)).status') === 'auto', 'A Display of My Dark Power: automatisch');
    const sw = N('Swamp', 'Basic Land — Swamp'); put(sw); ev('for(let i = 0; i < 3; i++) BOT.bf.push(newCard({n:"Island", type:"Basic Land — Island", o:""})); botChanged()');
    const u0 = ev('withBot("bot", () => manaUnits().length)');
    w.__card = ev('newCard(schemeAsSpell(window.__sc))'); await ev('runSteps(parseSteps(window.__card.o, window.__card), window.__card, {})'); await wait(80); await drain();
    const opt = ev('manaChoices')(sw)[0]; await ev('tapForMana')(sw, opt); await wait(50);
    check(ev('S.pool.B') === 2, `Dark Power: Swamp gibt {B}{B} (${ev('S.pool.B')})`);
    const u1 = ev('withBot("bot", () => manaUnits().length)'); check(u0 === 3 && u1 === 6, `Dark Power: KI plant mit 6 statt 3 Mana (${u0} → ${u1})`);
    const n0 = N('Normal', 'Artifact', '{T}: Add {C}.'); put(n0); check(ev('manaChoices')(n0)[0].add.length === 1, 'Dark Power: Nichtländer unverändert');
    ev('S.pool = emptyPoolObj(); onMyTurnStart()'); await wait(80); await drain(); sw.tap = false;
    check(!ev('S.darkPower') && ev('manaChoices')(sw)[0].add.length === 1, 'Dark Power: endet zu Beginn meines nächsten Zuges'); }

  // Abundant Growth: verzaubertes Land gibt Mana jeder Farbe
  await reset(); { const ld = N('Wastes', 'Basic Land — Wastes', '{T}: Add {C}.'); put(ld); const ag = C('Abundant Growth'); ag.eq = ld.u; put(ag);
    const opts = ev('manaChoices')(ld); check(opts.length >= 2 && opts.some(o => o.combo || (o.add || []).some(x => x !== 'C')), `Abundant Growth: Land hat zusätzlich «Mana jeder Farbe» (${opts.length} Möglichkeiten)`); }
  // Ashling: zweites Auflösen im Zug → 2 Schaden an jeden Gegner und seine Kreaturen; drittes → {R}{R}{R}{R}
  await reset(); { const as = C('Ashling, Flame Dancer', {pw:3, tg:3}); put(as); opp('Bär'); opp('Riese', {pw:4, tg:4});
    const once = async () => { S().hand.push(N('Weg' + Math.random(), 'Instant')); const pr = run(as, /Magecraft|discard a card, then draw/); await wait(200); const el = d.querySelector('#modalBox .card'); if(el){ el.click(); await wait(60); } await click('Weiter'); await click('OK'); await click('Abwerfen'); await wait(150); await pr; await drain(); };
    await once(); check(ev('BOTS.bot.life') === 20, 'Ashling: erstes Auflösen – kein Schaden');
    await once(); await wait(150);
    check(ev('BOTS.bot.life') === 18 && !ev('BOT.bf.some(c => c.n === "Bär")') && ev('BOT.bf.some(c => c.n === "Riese")'), `Ashling: zweites Auflösen – 2 Schaden an KI und ihre Kreaturen (Leben ${ev('BOTS.bot.life')})`);
    ev('S.pool = emptyPoolObj()'); await once();
    check(ev('S.pool.R') === 4 && ev('BOTS.bot.life') === 18, `Ashling: drittes Auflösen – {R}{R}{R}{R} (${ev('poolStr(poolOf())')})`); }
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
