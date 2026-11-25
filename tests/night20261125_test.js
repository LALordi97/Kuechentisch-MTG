// Nacht 25.11.2026: Karten aus den Top-Decks – Text aus night20261125_cards.json (Scryfall)
const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync(require('path').join(__dirname, 'night20261125_cards.json'), 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
const C = (n, x = {}) => { if(!T[n]) throw new Error('Karte fehlt: ' + n); return ev('newCard')({...T[n], img:null, ...x}); };
const N = (n, type, o = '', x = {}) => ev('newCard')({n, type, o, img:null, ...x});
const open = () => !$('#modal').hidden;
const click = async t => { const b = [...d.querySelectorAll('#modalBox button')].find(b => b.textContent.trim().startsWith(t)); if(b){ b.click(); await wait(40); } return !!b; };
const clickCard = async t => { const el = [...d.querySelectorAll('#modalBox .card')].find(e => e.textContent.includes(t)); if(el){ el.click(); await wait(40); } return !!el; };
const cardsShown = () => [...d.querySelectorAll('#modalBox .card')].map(e => e.textContent);
const AUTO = ["Guardians' Pledge", "Infectious Inquiry", "Ichor Rats", "Infectious Bite", "Hard-Hitting Question", "Inspiring Call", "Howling Mine", "Kalonian Hydra", "Guiding Hydra", "Higure, the Still Wind",
  "Guardian Project", "Jadar, Ghoulcaller of Nephalia", "Hardened Scales", "Kami of Whispered Hopes", "Kami of the Crescent Moon",
  "Jaheira, Friend of the Forest", "Insidious Roots", "Hero's Blade", "Hammer of Nazahn", "Jolrael, Mwonvuli Recluse",
  "Hobgoblin Bandit Lord", "Hellkite Tyrant",
  "Isshin, Two Heavens as One", "Harmonic Prodigy", "Herald's Horn",
  "High Perfect Morcant", "Hazel of the Rootbloom", "Kaalia of the Vast", "Hedge Shredder", "Grishnákh, Brash Instigator"];
const T22 = Object.fromEntries(JSON.parse(fs.readFileSync(require('path').join(__dirname, 'night20261122_cards.json'), 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  for(const n of AUTO){ w.__c = T[n]; const st = ev('cardCheck(window.__c).status'); check(st === 'auto', `${n}: automatisch (${st})`); }

  // Guardians' Pledge: nur eigene weisse Kreaturen +2/+2
  await reset(); { const wc = N('Weiss', 'Creature — Human', '', {pw:2, tg:2, mc:'{1}{W}'}), gc = N('Grün', 'Creature — Elf', '', {pw:1, tg:1, mc:'{G}'}); put(wc, gc); const ow = opp('KIweiss', {mc:'{W}'});
    const pr = spell("Guardians' Pledge"); await pr; await drain();
    check(pt(wc) === '4/4' && pt(gc) === '1/1' && pt(ow) === '2/2', `Guardians' Pledge: weiss 4/4, grün 1/1, KI unverändert (${pt(wc)}, ${pt(gc)}, ${pt(ow)})`); }
  // Infectious Inquiry: 2 ziehen, 2 Leben, Gegner 1 Gift
  await reset(); { const h0 = S().hand.length; await spell('Infectious Inquiry'); await drain();
    check(S().hand.length === h0 + 2 && S().life === 18 && ev('BOT.poison') === 1 && (S().poison || 0) === 0, `Infectious Inquiry: +2 Karten, 18 Leben, KI 1 Gift (${S().hand.length - h0}, ${S().life}, ${ev('BOT.poison')})`); }
  // Ichor Rats: jeder Spieler 1 Gift
  await reset(); { ev('S.poison = 0; BOT.poison = 0'); const ir = C('Ichor Rats', {pw:2, tg:1}); put(ir); await run(ir, /each player gets a poison/); await drain();
    check(ev('BOT.poison') === 1 && S().poison === 1, `Ichor Rats: KI 1 Gift, ich 1 Gift (${ev('BOT.poison')}, ${S().poison})`); ev('S.poison = 0; BOT.poison = 0'); }
  // Infectious Bite: eigene Kreatur fügt Schaden in Höhe ihrer Stärke zu, Gegner 1 Gift
  await reset(); { const me1 = N('Grosser', 'Creature — Beast', '', {pw:4, tg:4}); put(me1); const o = opp('Opfer', {pw:3, tg:3}); ev('BOT.poison = 0');
    const pr = spell('Infectious Bite'); await clickCard('Grosser'); await wait(150); await clickCard('Opfer'); await wait(300); await pr; await drain();
    check(ev('BOT.gy.some(c => c.n === "Opfer")') && !S().gy.some(c => c.n === 'Grosser') && ev('BOT.poison') === 1, `Infectious Bite: KI-Kreatur stirbt, eigene bleibt, 1 Gift (${ev('BOT.poison')})`); ev('BOT.poison = 0'); }
  // Hard-Hitting Question
  await reset(); { const me1 = N('Grosser', 'Creature — Beast', '', {pw:3, tg:1}); put(me1); const o = opp('Opfer', {pw:3, tg:3});
    const pr = spell('Hard-Hitting Question'); await clickCard('Grosser'); await wait(150); await clickCard('Opfer'); await wait(300); await pr; await drain();
    check(ev('BOT.gy.some(c => c.n === "Opfer")') && S().bf.includes(me1), 'Hard-Hitting Question: 3 Schaden töten die KI-Kreatur, eigene bleibt (kein Kampf)'); }
  // Inspiring Call: Karten für Kreaturen mit Marken, diese unzerstörbar
  await reset(); { const a = N('A', 'Creature — Bear', '', {pw:2, tg:2}), b = N('B', 'Creature — Bear', '', {pw:2, tg:2}), z = N('Z', 'Creature — Bear', '', {pw:2, tg:2}); a.c = 1; b.c = 2; put(a, b, z); const h0 = S().hand.length;
    await spell('Inspiring Call'); await drain();
    check(S().hand.length === h0 + 2 && kw(a, 'indestructible') && kw(b, 'indestructible') && !kw(z, 'indestructible'), `Inspiring Call: 2 Karten, A und B unzerstörbar, Z nicht (${S().hand.length - h0})`); }
  // Howling Mine: ungetappt 1 zusätzliche Karte, getappt keine
  await reset(); { const hm = C('Howling Mine'); put(hm); check(ev('fontDraws()') === 1, `Howling Mine: 1 zusätzliche Karte (${ev('fontDraws()')})`); hm.tap = true; check(ev('fontDraws()') === 0, 'Howling Mine: getappt keine'); }
  // Kalonian Hydra: verdoppelt Marken
  await reset(); { const kh = C('Kalonian Hydra', {pw:0, tg:0}), b = N('B', 'Creature — Bear', '', {pw:2, tg:2}), z = N('Z', 'Creature — Bear', '', {pw:2, tg:2}); kh.c = 4; b.c = 1; put(kh, b, z);
    await run(kh, /double the number/); await drain(); check(kh.c === 8 && b.c === 2 && !z.c, `Kalonian Hydra: 4→8, 1→2, 0 bleibt (${kh.c}, ${b.c}, ${z.c})`); }
  // Guiding Hydra: Marke entfernen, jede andere Kreatur +1
  await reset(); { const gh = C('Guiding Hydra', {pw:0, tg:0}); gh.c = 3; const b = N('B', 'Creature — Bear', '', {pw:2, tg:2}); put(gh, b);
    const pr = run(gh, /remove a \+1\/\+1 counter/); await wait(100); await click('Ja'); await wait(200); await pr; await drain();
    check(gh.c === 2 && b.c === 1, `Guiding Hydra: Hydra 3→2, Bär +1 (${gh.c}, ${b.c})`); }
  // Higure: Ninja unblockbar
  await reset(); { const hi = C('Higure, the Still Wind', {pw:3, tg:4}), nj = N('Schatten', 'Creature — Human Ninja', '', {pw:1, tg:1}), be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(hi, nj, be);
    const pr = run(hi, /Target Ninja creature/); await wait(100); const shown = cardsShown(); await clickCard('Schatten'); await wait(200); await pr; await drain();
    check(!shown.some(t => t.includes('Bär')) && kw(nj, 'unblockable'), `Higure: nur Ninjas wählbar, Ninja unblockbar (${shown.length})`); }
  // Guardian Project: Name-Bedingung
  await reset(); { const gp = C('Guardian Project'); const x1 = N('Elf', 'Creature — Elf', '', {pw:1, tg:1}); put(gp, x1);
    check(ev('interveningIf')("if it doesn't have the same name as another creature you control or a creature card in your graveyard, draw a card", gp, {ev:{c:x1}}).ok === true, 'Guardian Project: neuer Name → ziehen');
    const x2 = N('Elf', 'Creature — Elf', '', {pw:1, tg:1}); put(x2); check(ev('interveningIf')("if it doesn't have the same name as another creature you control or a creature card in your graveyard, draw a card", gp, {ev:{c:x2}}).ok === false, 'Guardian Project: gleicher Name → nicht');
    const x3 = N('Ork', 'Creature — Orc', '', {pw:1, tg:1}); S().gy.push(N('Ork', 'Creature — Orc', '')); put(x3); check(ev('interveningIf')("if it doesn't have the same name as another creature you control or a creature card in your graveyard, draw a card", gp, {ev:{c:x3}}).ok === false, 'Guardian Project: Name im Friedhof → nicht'); }
  // Jadar: Zombie mit Decayed nur ohne Decayed-Kreatur
  await reset(); { const ja = C('Jadar, Ghoulcaller of Nephalia', {pw:1, tg:1}); put(ja); const trg = async () => { const pr = ev('runTrigger')(ja, abil(ja, /create a 2\/2 black Zombie/), {}); await wait(300); await drain(); await pr; }; await trg();
    const z = S().bf.filter(c => c.tok); check(z.length === 1 && kw(z[0], 'decayed'), `Jadar: 1 Zombie mit Decayed (${z.length})`);
    await trg(); check(S().bf.filter(c => c.tok).length === 1, `Jadar: mit Decayed-Zombie kein zweiter (${S().bf.filter(c => c.tok).length})`); }

  // Hardened Scales: +1 Marke mehr; mit Corpsejack Menace (1+1)·2
  await reset(); { const hs = C('Hardened Scales'), b = N('B', 'Creature — Bear', '', {pw:2, tg:2}); put(hs, b);
    await ev('runSteps(parseSteps("Put a +1/+1 counter on each creature you control.", window.__sp = newCard({n:"Q", type:"Sorcery"})), window.__sp, {})'); await drain();
    check(b.c === 2, `Hardened Scales: 1 → 2 Marken (${b.c})`);
    w.__cm = ev('newCard')({...T22['Corpsejack Menace'], img:null}); w.__cm.pw = 4; w.__cm.tg = 4; ev('S.bf.push(window.__cm)'); b.c = 0;
    await ev('runSteps(parseSteps("Put a +1/+1 counter on each creature you control.", window.__sp), window.__sp, {})'); await drain();
    check(b.c === 4, `Hardened Scales + Corpsejack Menace: 1 → 4 Marken (${b.c})`);
    w.__ce = ev('cardCheck')(w.__cm).status; check(w.__ce === 'auto', `Corpsejack Menace: automatisch (${w.__ce})`);
    const kh = C('Kalonian Hydra', {pw:0, tg:0}); ev('S.bf = S.bf.filter(c => c.n !== "Corpsejack Menace")'); put(kh); ev('manaEnter')(kh); check(kh.c === 5, `Hardened Scales: Kalonian Hydra kommt mit 5 Marken (${kh.c})`);
    w.__ops = N('Fremd', 'Creature — Bear', '', {pw:2, tg:2}); }
  // Kami of Whispered Hopes: auch auf andere bleibende Karten, nicht auf -1/-1
  await reset(); { const kw1 = C('Kami of Whispered Hopes', {pw:0, tg:0}), b = N('B', 'Creature — Bear', '', {pw:2, tg:2}); put(kw1, b);
    check(ev('plusCtrN')(b, 2) === 3 && ev('plusCtrN')(kw1, 1) === 2, 'Kami of Whispered Hopes: 2 → 3 und auf sich selbst 1 → 2');
    b.cn = '-1/-1'; check(ev('plusCtrN')(b, 1) === 1, 'Kami of Whispered Hopes: andere Marken unverändert'); }
  // Kami of the Crescent Moon: jeder zieht eine Karte mehr
  await reset(); { put(C('Kami of the Crescent Moon', {pw:1, tg:3})); check(ev('fontDraws()') === 1, `Kami of the Crescent Moon: 1 zusätzliche Karte (${ev('fontDraws()')})`); }

  // Jaheira: Token tappen für {G}; Insidious Roots: Kreaturen-Token für jede Farbe
  await reset(); { const tk = N('Schatz', 'Token Artifact — Treasure', '', {tok:true}), ct = N('Pflanze', 'Token Creature — Plant', '', {tok:true, pw:0, tg:1}); put(tk, ct);
    const has = (c, col) => ev('manaChoices')(c).some(o => o.add.join('') === col && !o.noTap);
    check(!has(ct, 'G'), 'ohne Jaheira: Pflanzen-Token gibt kein Mana');
    put(C('Jaheira, Friend of the Forest', {pw:3, tg:3})); check(has(ct, 'G') && has(tk, 'G'), 'Jaheira: beide Token geben {G}');
    ev('S.bf = S.bf.filter(c => !/Jaheira/.test(c.n))'); put(C('Insidious Roots')); check(has(ct, 'R') && has(ct, 'U') && !has(tk, 'R'), 'Insidious Roots: Kreaturen-Token jede Farbe, Schatz nicht'); }
  // Hero's Blade: an die eintretende legendäre Kreatur anlegen
  await reset(); { const hb = C("Hero's Blade"), lg = N('Held', 'Legendary Creature — Human', '', {pw:2, tg:2}); put(hb, lg);
    const a = abil(hb, /attach this Equipment to it/); const pr = ev('runTrigger')(hb, a, {kind:'enter', c:lg}); await wait(150); await click('Ja'); await wait(150); await drain(); await pr;
    check(hb.eq === lg.u && pt(lg) === '5/4', `Hero's Blade: an Held angelegt, 5/4 (${pt(lg)})`); }
  // Hammer of Nazahn: eintretende Ausrüstung anlegen
  await reset(); { const hn = C('Hammer of Nazahn'), eq2 = N('Schwert', 'Artifact — Equipment', 'Equipped creature gets +1/+1.'), be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(hn, eq2, be);
    const a = abil(hn, /attach that Equipment/); let pr = ev('runTrigger')(hn, a, {kind:'enter', c:eq2}); await wait(150); await click('Ja'); await wait(150); await clickCard('Bär'); await wait(150); await drain(); await pr;
    check(eq2.eq === be.u, 'Hammer of Nazahn: Schwert an Bär angelegt');
    pr = ev('runTrigger')(hn, a, {kind:'enter', c:hn}); await wait(150); await click('Ja'); await wait(150); await clickCard('Bär'); await wait(150); await drain(); await pr;
    check(hn.eq === be.u && kw(be, 'indestructible'), 'Hammer of Nazahn: sich selbst angelegt, Bär unzerstörbar'); }
  // Jolrael: Grundwerte X/X = Handkarten
  await reset(); { const jo = C('Jolrael, Mwonvuli Recluse', {pw:1, tg:2}), be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(jo, be); ev('S.hand = Array(4).fill(0).map(() => newCard({n:"Swamp", type:"Basic Land — Swamp"}))');
    await run(jo, /base power and toughness X\/X/); await drain(); check(pt(be) === '4/4' && pt(jo) === '4/4', `Jolrael: 4 Handkarten → 4/4 (${pt(be)}, ${pt(jo)})`); }

  // Hobgoblin Bandit Lord: Schaden = Goblins, die diesen Zug eingetreten sind
  await reset(); { const hb = C('Hobgoblin Bandit Lord', {pw:2, tg:3}), g1 = N('G1', 'Creature — Goblin', '', {pw:1, tg:1}), g2 = N('G2', 'Creature — Goblin', '', {pw:1, tg:1}), g3 = N('G3', 'Creature — Goblin', '', {pw:1, tg:1}); put(hb, g1, g2, g3);
    g1.enterKey = ev('turnKey()'); g2.enterKey = ev('turnKey()'); g3.enterKey = 'alt';
    const pr = run(hb, /deals damage equal to the number of Goblins/); await wait(150); await click('Test') || await click('KI'); await wait(300); await drain(); await pr;
    check(ev('BOT.life') === 18, `Hobgoblin Bandit Lord: 2 Schaden an die KI (${ev('BOT.life')})`); }
  // Hellkite Tyrant: alle Artefakte des getroffenen Spielers übernehmen
  await reset(); { const ht = C('Hellkite Tyrant', {pw:6, tg:5}); put(ht); w.__a1 = N('Ring', 'Artifact', ''); w.__a2 = N('Golem', 'Artifact Creature — Golem', '', {pw:3, tg:3}); ev('BOT.bf.push(window.__a1, window.__a2); botChanged()'); opp('Bär');
    const pr = ev('runTrigger')(ht, abil(ht, /gain control of all artifacts/), {kind:'combatDamage', pid:ev('BOT_ID'), much:6}); await wait(300); await drain(); await pr;
    check(S().bf.some(c => c.n === 'Ring') && S().bf.some(c => c.n === 'Golem') && ev('BOT.bf.length') === 1, `Hellkite Tyrant: Ring und Golem übernommen (KI hat noch ${ev('BOT.bf.length')})`); }

  // Isshin: Angriffs-Auslöser zweimal
  await reset(); { const x = N('Angreifer', 'Creature — Human', 'Whenever this creature attacks, you gain 1 life.', {pw:2, tg:2}); put(x);
    ev('S.life = 20'); w.__x = x; ev('abilEvent({kind:"attack", c:window.__x, first:true})'); await wait(400); await drain(); const l1 = S().life;
    put(C('Isshin, Two Heavens as One', {pw:3, tg:4})); ev('S.life = 20'); ev('abilEvent({kind:"attack", c:window.__x, first:true})'); await wait(500); await drain();
    check(l1 === 21 && S().life === 22, `Isshin: ohne 1, mit 2 Leben (${l1}, ${S().life})`); }
  // Harmonic Prodigy: Auslöser von Zauberern doppelt, andere nicht
  await reset(); { const wz = N('Magier', 'Creature — Human Wizard', 'Whenever this creature attacks, you gain 1 life.', {pw:1, tg:1}), be = N('Bär', 'Creature — Bear', 'Whenever this creature attacks, you gain 1 life.', {pw:2, tg:2}); put(C('Harmonic Prodigy', {pw:1, tg:3}), wz, be);
    ev('S.life = 20'); w.__x = wz; ev('abilEvent({kind:"attack", c:window.__x, first:true})'); await wait(500); await drain(); const l1 = S().life;
    ev('S.life = 20'); w.__x = be; ev('abilEvent({kind:"attack", c:window.__x, first:true})'); await wait(500); await drain();
    check(l1 === 22 && S().life === 21, `Harmonic Prodigy: Zauberer 2, Bär 1 Leben (${l1 - 20}, ${S().life - 20})`); }
  // Herald's Horn: Kosten −1 für den gewählten Typ, oberste Karte auf die Hand
  await reset(); { const hh = C("Herald's Horn"); hh.chosen = 'Elf'; put(hh); w.__e = N('Elfe', 'Creature — Elf Druid', '', {mc:'{2}{G}', cmc:3}); w.__g = N('Goblin', 'Creature — Goblin', '', {mc:'{2}{R}', cmc:3});
    check(ev('costMods(window.__e).less') === 1 && ev('costMods(window.__g).less') === 0, "Herald's Horn: Elf −1, Goblin −0");
    w.__t = N('Elfe2', 'Creature — Elf', '', {pw:1, tg:1}); ev('S.library.unshift(window.__t)'); const h0 = S().hand.length;
    const pr = run(hh, /look at the top card/); await wait(150); await click('Ja'); await wait(150); await drain(); await pr;
    check(S().hand.length === h0 + 1 && S().hand.some(c => c.n === 'Elfe2'), "Herald's Horn: Elfe auf die Hand");
    ev('S.library.unshift(window.__g)'); const pr2 = run(hh, /look at the top card/); await wait(200); await drain(); await pr2; check(S().library[0].n === 'Goblin', "Herald's Horn: Goblin bleibt oben"); }

  // High Perfect Morcant: KI legt eine -1/-1-Marke, lieber auf eine Kreatur, die überlebt
  await reset(); { const hm = C('High Perfect Morcant', {pw:3, tg:3}); put(hm); const b1 = opp('Bär', {pw:2, tg:2}); w.__tk = N('Spross', 'Token Creature — Saproling', '', {pw:1, tg:1, tok:true}); ev('BOT.bf.push(window.__tk); botChanged()');
    const pr = ev('runTrigger')(hm, abil(hm, /each opponent blights 1/), {kind:'enter', c:hm}); await wait(300); await drain(); await pr;
    check(b1.c === -1 && ev('BOT.bf.length') === 2 && ev('power')(b1) === 1, `High Perfect Morcant: Bär bekommt die Marke und überlebt (${b1.c}, ${ev('BOT.bf.length')})`); }
  // Hazel: Kopie eines Tokens, Eichhörnchen doppelt
  await reset(); { const hz = C('Hazel of the Rootbloom', {pw:2, tg:4}), sq = N('Squirrel', 'Token Creature — Squirrel', '', {pw:1, tg:1, tok:true}), so = N('Soldier', 'Token Creature — Soldier', '', {pw:1, tg:1, tok:true}); put(hz, sq, so);
    let pr = run(hz, /copy of target token/); await wait(150); await clickCard('Squirrel'); await wait(200); await drain(); await pr;
    check(S().bf.filter(c => c.n === 'Squirrel').length === 3, `Hazel: zwei Eichhörnchen-Kopien (${S().bf.filter(c => c.n === 'Squirrel').length})`);
    pr = run(hz, /copy of target token/); await wait(150); await clickCard('Soldier'); await wait(200); await drain(); await pr;
    check(S().bf.filter(c => c.n === 'Soldier').length === 2, `Hazel: eine Soldaten-Kopie (${S().bf.filter(c => c.n === 'Soldier').length})`); }

  // Kaalia: Engel/Dämon/Drache aus der Hand getappt und angreifend
  await reset(); { const ka = C('Kaalia of the Vast', {pw:2, tg:2}); put(ka); w.__dr = N('Drache', 'Creature — Dragon', '', {pw:5, tg:5}); w.__el = N('Elfe', 'Creature — Elf', '', {pw:1, tg:1}); ev('S.hand.push(window.__dr, window.__el)');
    w.__ka = ka; ev('S.atkJoin = []; markOnAttack([window.__ka])'); await wait(800); const shown = cardsShown(); await clickCard('Drache'); await wait(250); await drain(); await wait(100);
    const dr = S().bf.find(c => c.n === 'Drache'); check(dr && dr.tap && (S().atkJoin || []).some(j => j.u === dr.u) && !shown.some(t => t.includes('Elfe')), `Kaalia: Drache getappt und angreifend, Elfe nicht wählbar (${!!dr})`); }

  // Hedge Shredder: gemahlene Länder getappt ins Spiel
  await reset(); { const hs = C('Hedge Shredder'); put(hs); w.__f = N('Forest', 'Basic Land — Forest', ''); w.__b = N('Bolt', 'Instant', ''); ev('S.library.unshift(window.__f, window.__b)');
    const pr = run(hs, /you may mill two/); await wait(150); await click('Ja'); await wait(200); await drain(); await pr;
    const f = S().bf.find(c => c.n === 'Forest'); check(f && f.tap && S().gy.some(c => c.n === 'Bolt') && !S().gy.some(c => c.n === 'Forest'), `Hedge Shredder: Wald getappt im Spiel, Bolt im Friedhof (${!!f})`); }

  // Grishnákh: Armee 2, dann Kontrolle über eine nichtlegendäre Kreatur mit Stärke ≤ 2
  await reset(); { const gr = C('Grishnákh, Brash Instigator', {pw:1, tg:1}); put(gr); const b1 = opp('Bär', {pw:2, tg:2}); b1.tap = true; opp('Riese', {pw:3, tg:3}); w.__lg = N('Fürst', 'Legendary Creature — Human', '', {pw:1, tg:1}); ev('BOT.bf.push(window.__lg); botChanged()');
    const pr = ev('runTrigger')(gr, abil(gr, /amass Orcs 2/), {kind:'enter', c:gr}); await wait(300); const shown = cardsShown(); await clickCard('Bär'); await wait(300); await drain(); await pr;
    const mine = S().bf.find(c => c.n === 'Bär'); const army = S().bf.find(c => /Army/.test(c.type || ''));
    check(army && ev('power')(army) === 2 && !shown.some(t => t.includes('Riese')) && !shown.some(t => t.includes('Fürst')), `Grishnákh: Armee 2/2, Riese und Fürst nicht wählbar (${shown.length})`);
    check(mine && mine.threatKey === ev('turnKey()') && !mine.tap && kw(mine, 'haste'), `Grishnákh: Bär bis Zugende übernommen, enttappt, mit Eile (${!!mine})`); }

  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
