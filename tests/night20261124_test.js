// Nacht 24.11.2026: Karten aus den Top-Decks – Text aus night20261124_cards.json (Scryfall)
const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync(require('path').join(__dirname, 'night20261124_cards.json'), 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
const C = (n, x = {}) => { if(!T[n]) throw new Error('Karte fehlt: ' + n); return ev('newCard')({...T[n], img:null, ...x}); };
const N = (n, type, o = '', x = {}) => ev('newCard')({n, type, o, img:null, ...x});
const open = () => !$('#modal').hidden;
const click = async t => { const b = [...d.querySelectorAll('#modalBox button')].find(b => b.textContent.trim().startsWith(t)); if(b){ b.click(); await wait(40); } return !!b; };
const clickCard = async t => { const el = [...d.querySelectorAll('#modalBox .card')].find(e => e.textContent.includes(t)); if(el){ el.click(); await wait(40); } return !!el; };
const cardsShown = () => [...d.querySelectorAll('#modalBox .card')].map(e => e.textContent);
const AUTO = ["Goblin King", "Goblin Chieftain", "Goblin Tomb Raider", "Gothmog, Morgul Lieutenant", "Goblin Anarchomancer", "Gisela, Blade of Goldnight", "Georgiou, Terran Emperor", "Ghostly Prison",
  "Grave Pact", "Fling", "Goblin War Strike", "Golgari Charm", "Grab the Prize", "Glowing One", "Goblin Piledriver", "Glint Hawk", "Ghalta, Stampede Tyrant", "Gishath, Sun's Avatar", "Flash of Defiance",
  "Font of Mythos", "Forced Fruition", "Gisela, the Broken Blade", "Fire Nation Palace", "Floodpits Drowner", "Forgotten Ancient", "Gollum, Obsessed Stalker", "G'raha Tia, Scion Reborn", "Fire Magic", "Goblin Lackey", "Forge Anew"];
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

  // Fähigkeiten-Check
  for(const n of AUTO){ w.__c = T[n]; const st = ev('cardCheck(window.__c).status'); check(st === 'auto', `${n}: automatisch (${st})`); }

  // Goblin King: andere Goblins +1/+1 und Gebirgswandel
  await reset(); { const gk = C('Goblin King', {pw:2, tg:2}), gb = N('Gob', 'Creature — Goblin', '', {pw:1, tg:1}), be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(gk, gb, be);
    check(pt(gb) === '2/2' && pt(gk) === '2/2' && pt(be) === '2/2', `Goblin King: Goblin 2/2, König und Bär unverändert (${pt(gb)}, ${pt(gk)}, ${pt(be)})`);
    check(kw(gb, 'mountainwalk') && !kw(gk, 'mountainwalk'), 'Goblin King: Goblin hat Gebirgswandel, der König nicht');
    const bl = opp('Blocker'); w.__m = N('Mountain', 'Basic Land — Mountain', ''); ev('BOT.bf.push(window.__m); botChanged()'); check(!ev('canBlock')(bl, gb) && ev('canBlock')(bl, be), 'Goblin King: KI mit Gebirge kann den Goblin nicht blocken'); }
  // Goblin Chieftain: nur eigene andere Goblins
  await reset(); { const gc = C('Goblin Chieftain', {pw:2, tg:2}), gb = N('Gob', 'Creature — Goblin', '', {pw:1, tg:1}); put(gc, gb); w.__og = N('Fremd', 'Creature — Goblin', '', {pw:1, tg:1}); ev('BOT.bf.push(window.__og); botChanged()');
    check(pt(gb) === '2/2' && kw(gb, 'haste') && pt(gc) === '2/2', `Goblin Chieftain: eigener Goblin 2/2 mit Eile (${pt(gb)})`); check(pt(w.__og) === '1/1', `Goblin Chieftain: KI-Goblin unverändert (${pt(w.__og)})`); }
  // Goblin Tomb Raider: mit Artefakt +1/+0 und Eile
  await reset(); { const tr = C('Goblin Tomb Raider', {pw:1, tg:1}); put(tr); check(pt(tr) === '1/1' && !kw(tr, 'haste'), `Goblin Tomb Raider: ohne Artefakt 1/1 ohne Eile (${pt(tr)})`);
    put(N('Ding', 'Artifact', '')); check(pt(tr) === '2/1' && kw(tr, 'haste'), `Goblin Tomb Raider: mit Artefakt 2/1 mit Eile (${pt(tr)})`); }
  // Gothmog: Token haben Todesberührung
  await reset(); { const go = C('Gothmog, Morgul Lieutenant', {pw:3, tg:3}), tk = N('Orc', 'Token Creature — Orc', '', {pw:1, tg:1, tok:true}); put(go, tk);
    check(kw(tk, 'deathtouch') && !kw(go, 'deathtouch'), 'Gothmog: Token mit Todesberührung, Gothmog selbst nicht'); }
  // Goblin Anarchomancer: rote/grüne Zauber kosten 1 weniger
  await reset(); { put(C('Goblin Anarchomancer', {pw:2, tg:2})); w.__r = N('Rot', 'Sorcery', '', {mc:'{2}{R}', cmc:3}); w.__u = N('Blau', 'Sorcery', '', {mc:'{2}{U}', cmc:3});
    check(ev('costMods(window.__r).less') === 1 && ev('costMods(window.__u).less') === 0, `Goblin Anarchomancer: rot −1, blau −0 (${ev('costMods(window.__r).less')}, ${ev('costMods(window.__u).less')})`); }
  // Gisela: doppelt an Gegner, halbiert an mich
  await reset(); { put(C('Gisela, Blade of Goldnight', {pw:5, tg:5})); check(ev('archDmg(3, true)') === 6 && ev('archDmg(3, false)') === 1, `Gisela: 3 → 6 an Gegner, 3 → 1 an mich (${ev('archDmg(3, true)')}, ${ev('archDmg(3, false)')})`); }
  // Georgiou: verliert nicht bei 0 Leben; Endschritt: bei 0 oder weniger zehn Offiziere
  await reset(); { const ge = C('Georgiou, Terran Emperor', {pw:4, tg:4}); put(ge); ev('S.lostAnnounced = false; S.life = 0; lostCheck()'); check(!ev('S.lostAnnounced'), 'Georgiou: 0 Leben, Spiel nicht verloren');
    ev('S.life = 3'); const h0 = S().hand.length; await run(ge, /you lose 3 life/); await wait(200); await drain();
    check(S().life === 0 && S().hand.length === h0 + 1 && S().bf.filter(c => c.tok && /Officer/.test(c.type || '')).length === 10, `Georgiou: 0 Leben, 1 Karte, 10 Offiziere (${S().life}, ${S().bf.filter(c => c.tok).length})`); }
  await reset(); { const ge = C('Georgiou, Terran Emperor', {pw:4, tg:4}); put(ge); await run(ge, /you lose 3 life/); await wait(200); await drain();
    check(S().life === 17 && !S().bf.some(c => c.tok), `Georgiou: bei 17 Leben keine Offiziere (${S().life})`); }
  // Ghostly Prison: KI zahlt {2} pro Angreifer
  await reset(); { put(C('Ghostly Prison')); const a = opp('A', {pw:3, tg:3}), b = opp('B', {pw:2, tg:2}); ev('BOT.bf.push(newCard({n:"Island", type:"Basic Land — Island", o:""}), newCard({n:"Island", type:"Basic Land — Island", o:""})); botChanged()');
    w.__atk = [a, b]; const r = ev('botPrisonTax(window.__atk)'); check(r.length === 1 && r[0].n === 'A' && ev('BOT.bf.filter(c => c.n === "Island" && c.tap).length') === 2, `Ghostly Prison: KI greift mit 1 an und zahlt {2} (${r.map(c => c.n)})`);
    w.__atk = [a]; check(ev('botPrisonTax(window.__atk)').length === 0, 'Ghostly Prison: ohne Mana kein Angriff'); }
  // Grave Pact: Gegner opfert
  await reset(); { const gp = C('Grave Pact'); put(gp); opp('Opfer'); await run(gp, /each other player sacrifices/); await wait(300); await drain();
    check(ev('BOT.gy.some(c => c.n === "Opfer")'), 'Grave Pact: KI opfert eine Kreatur'); }
  // Fling: Schaden = Stärke der geopferten Kreatur
  await reset(); { const fl = C('Fling'); fl.sacPow = 4; const pr = ev('abilSpellResolve')(fl); await wait(150); await click('Test') || await click('KI'); await wait(300); await pr; await drain();
    check(ev('BOT.life') === 16, `Fling: 4 Schaden an die KI (${ev('BOT.life')})`); }
  // Goblin War Strike: Schaden = Zahl der Goblins
  await reset(); { put(N('G1', 'Creature — Goblin', '', {pw:1, tg:1}), N('G2', 'Creature — Goblin Warrior', '', {pw:1, tg:1}), N('Bär', 'Creature — Bear', '', {pw:2, tg:2}));
    const pr = ev('abilSpellResolve')(C('Goblin War Strike')); await wait(150); await click('Test') || await click('KI'); await wait(300); await pr; await drain();
    check(ev('BOT.life') === 18, `Goblin War Strike: 2 Schaden (${ev('BOT.life')})`); }
  // Golgari Charm: alle eigenen Kreaturen regenerieren
  await reset(); { const a = N('A', 'Creature — Bear', '', {pw:2, tg:2}), b = N('B', 'Creature — Elf', '', {pw:1, tg:1}); put(a, b); w.__gc = C('Golgari Charm');
    await ev('runSteps(parseSteps("Regenerate each creature you control.", window.__gc), window.__gc, {})'); await drain();
    check(a.regen === ev('turnKey()') && b.regen === ev('turnKey()'), 'Golgari Charm: beide Kreaturen mit Regenerationsschild'); }
  // Grab the Prize: Schaden nur, wenn kein Land abgeworfen wurde
  await reset(); { const gp = C('Grab the Prize'); gp.discNonland = true; const h0 = S().hand.length; await ev('abilSpellResolve')(gp); await wait(300); await drain();
    check(ev('BOT.life') === 18 && S().hand.length === h0 + 2, `Grab the Prize (Nichtland): 2 Karten, 2 Schaden (${ev('BOT.life')})`); }
  await reset(); { const gp = C('Grab the Prize'); gp.discNonland = false; await ev('abilSpellResolve')(gp); await wait(300); await drain(); check(ev('BOT.life') === 20, `Grab the Prize (Land): kein Schaden (${ev('BOT.life')})`); }
  // Glowing One: vier Strahlungsmarken an den Getroffenen
  await reset(); { const g1 = C('Glowing One', {pw:2, tg:2}); put(g1); ev('BOT.rad = 0'); await run(g1, /four rad counters/, {pid:'bot', ev:{kind:'combatDamage', c:g1, pid:'bot'}}); await wait(200); await drain();
    check(ev('BOT.rad') === 4, `Glowing One: KI erhält 4 Strahlungsmarken (${ev('BOT.rad')})`); }
  // Goblin Piledriver: +2/+0 je anderem angreifendem Goblin
  await reset(); { const pd = C('Goblin Piledriver', {pw:1, tg:2}), g1 = N('G1', 'Creature — Goblin', '', {pw:1, tg:1}), g2 = N('G2', 'Creature — Goblin', '', {pw:1, tg:1}), be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(pd, g1, g2, be);
    ev('S.attacking = ' + JSON.stringify([pd.u, g1.u, g2.u, be.u])); await run(pd, /for each other attacking Goblin/); await drain(); check(pt(pd) === '5/2', `Goblin Piledriver: 2 andere Goblins → 5/2 (${pt(pd)})`); ev('S.attacking = []'); }
  // Glint Hawk: Artefakt zurück oder opfern
  await reset(); { const gh = C('Glint Hawk', {pw:2, tg:2}), ar = N('Ding', 'Artifact', ''); put(gh, ar); const pr = run(gh, /unless you return an artifact/); await wait(150); await clickCard('Ding'); await wait(150); await pr; await drain();
    check(S().hand.includes(ar) && S().bf.includes(gh), 'Glint Hawk: Artefakt auf die Hand, Falke bleibt'); }
  await reset(); { const gh = C('Glint Hawk', {pw:2, tg:2}); put(gh); await run(gh, /unless you return an artifact/); await wait(150); await drain(); check(S().gy.includes(gh), 'Glint Hawk: ohne Artefakt geopfert'); }
  // Ghalta: beliebig viele Kreaturen aus der Hand
  await reset(); { const gl = C('Ghalta, Stampede Tyrant', {pw:12, tg:12}), a = N('Alpha', 'Creature — Bear', '', {pw:2, tg:2}), b = N('Zeta', 'Creature — Elf', '', {pw:1, tg:1}), l = N('Forest', 'Basic Land — Forest', ''); put(gl); S().hand.push(a, b, l);
    const pr = run(gl, /any number of creature cards from your hand/); await wait(150); check(!cardsShown().some(t => t.includes('Forest')), 'Ghalta: Land nicht zur Wahl'); await clickCard('Alpha'); await wait(60); await clickCard('Zeta'); await wait(60); await click('OK') || await click('Fertig') || await click('Übernehmen') || await click('Weiter'); await wait(150); await pr; await drain();
    check(S().bf.includes(a) && S().bf.includes(b) && S().hand.includes(l), 'Ghalta: beide Kreaturen im Spiel'); }
  // Gishath: Dinosaurier unter den aufgedeckten Karten ins Spiel
  await reset(); { ev('S.library.unshift(newCard({n:"Dino", type:"Creature — Dinosaur", o:"", pw:5, tg:5}), newCard({n:"Elfe", type:"Creature — Elf", o:"", pw:1, tg:1}), newCard({n:"Spruch", type:"Instant", o:""}))');
    const gs = C("Gishath, Sun's Avatar", {pw:7, tg:6}); put(gs); const pr = run(gs, /reveal that many cards/, {much:3, ev:{kind:'combatDamage', c:gs, pid:'bot', much:3}}); await wait(150);
    check(cardsShown().some(t => t.includes('Dino')) && !cardsShown().some(t => t.includes('Elfe')), 'Gishath: nur der Dinosaurier zur Wahl'); await clickCard('Dino'); await wait(60); await click('OK') || await click('Fertig') || await click('Übernehmen') || await click('Weiter'); await wait(150); await pr; await drain();
    const lib = S().library.map(c => c.n); check(S().bf.some(c => c.n === 'Dino') && lib.slice(-2).sort().join() === 'Elfe,Spruch' && lib.length === 12, `Gishath: Dino im Spiel, Rest unten (${lib.slice(-2)})`); }
  // Flash of Defiance: grüne und weisse Kreaturen können nicht blocken
  await reset(); { await ev('abilSpellResolve')(C('Flash of Defiance')); await wait(150); await drain(); const g = opp('Grün', {mc:'{1}{G}'}), u = opp('Blau', {mc:'{1}{U}'}), at = N('Angreifer', 'Creature — Bear', '', {pw:2, tg:2}); put(at);
    check(!ev('canBlock')(g, at) && ev('canBlock')(u, at), 'Flash of Defiance: grüne KI-Kreatur kann nicht blocken, blaue schon'); w.__sp = N('Zauber', 'Sorcery', '', {mc:'{R}', cmc:1}); check(!ev('botCastLocked(window.__sp)'), 'Flash of Defiance: sperrt keine Zauber'); }
  // Font of Mythos: zwei zusätzliche Karten im Ziehschritt
  await reset(); { put(C('Font of Mythos')); check(ev('fontDraws()') === 2, `Font of Mythos: 2 zusätzliche Karten (${ev('fontDraws()')})`); }
  // Forced Fruition: zaubernder Gegner zieht sieben
  await reset(); { const ff = C('Forced Fruition'); put(ff); const h0 = ev('BOT.hand.length'); w.__z = N('KI-Zauber', 'Sorcery', ''); await run(ff, /that player draws seven cards/, {ev:{kind:'oppCast', c:w.__z, pid:'bot'}}); await wait(300); await drain();
    check(ev('BOT.hand.length') === h0 + 7, `Forced Fruition: KI zieht 7 (${ev('BOT.hand.length') - h0})`); }
  // Gisela, the Broken Blade: verschmilzt mit Bruna am Endsegment
  await reset(); { const gi = C('Gisela, the Broken Blade', {pw:4, tg:3}); put(gi); w.__gi = gi; w.__a = abil(gi, /meld them into/);
    await ev('runAbility(window.__gi, window.__a, {}, interveningIf(window.__a.text, window.__gi).text)'); await wait(200); await drain();
    check(S().bf.includes(gi), 'Gisela, the Broken Blade: ohne Bruna kein Verschmelzen');
    const br = N('Bruna, the Fading Light', 'Legendary Creature — Angel Horror', '', {pw:5, tg:7}); put(br);
    await ev('runAbility(window.__gi, window.__a, {}, interveningIf(window.__a.text, window.__gi).text)'); await wait(300); await drain();
    const m = S().bf.find(c => c.n === 'Brisela, Voice of Nightmares'); check(!!m && !S().bf.includes(gi) && !S().bf.includes(br), `Gisela + Bruna → Brisela (${S().bf.map(c => c.n).join(', ')})`); }
  // Fire Nation Palace: Firebending 4 bis Zugende
  await reset(); { const fp = C('Fire Nation Palace'), be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(fp, be); const pr = run(fp, /gains firebending 4/); await wait(150); await clickCard('Bär'); await wait(150); await pr; await drain();
    ev('S.pool = emptyPoolObj()'); w.__be = be; ev('abilEvent({kind:"attack", c:window.__be, first:true})'); await wait(200); await drain(); check(ev('S.pool.R') === 4, `Fire Nation Palace: Angriff → {R}{R}{R}{R} (${ev('S.pool.R')})`); }
  // Floodpits Drowner: mit betäubter Kreatur in die Bibliotheken mischen
  await reset(); { const fd = C('Floodpits Drowner', {pw:1, tg:1}); put(fd); const t = opp('Betäubt'); t.stun = 1; const l0 = ev('BOT.library.length');
    const pr = run(fd, /Shuffle this creature and target creature/); await wait(150); await clickCard('Betäubt'); await wait(250); await pr;  await drain();
    check(!S().bf.includes(fd) && S().library.includes(fd) && !ev('BOT.bf.some(c => c.n === "Betäubt")') && ev('BOT.library.length') === l0 + 1, 'Floodpits Drowner: beide in die Bibliotheken gemischt'); }
  await reset(); { const fd = C('Floodpits Drowner', {pw:1, tg:1}); put(fd); opp('Wach'); const pr = run(fd, /Shuffle this creature and target creature/); await wait(150); await clickCard('Wach'); await wait(250); await pr; await drain();
    check(S().bf.includes(fd) && ev('BOT.bf.some(c => c.n === "Wach")'), 'Floodpits Drowner: ohne Betäubungsmarke nichts'); }
  // Forgotten Ancient: Marken verschieben
  await reset(); { const fa = C('Forgotten Ancient', {pw:0, tg:3}); fa.c = 2; const be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(fa, be); const pr = run(fa, /move any number of \+1\/\+1 counters/); await wait(150);
    await clickCard('Bär'); await wait(150); await clickCard('Bär'); await wait(150); await pr; await drain(); check(fa.c === 0 && be.c === 2, `Forgotten Ancient: 2 Marken auf den Bär (${fa.c}, ${be.c})`); }
  ev('window.__log = []; sendLog = m => window.__log.push(m.text)');
  // Gollum: getroffene Gegner verlieren Leben in Höhe des Lebensgewinns
  await reset(); { const go = C('Gollum, Obsessed Stalker', {pw:1, tg:1}); put(go); ev('S.gollumHit = []; S.lifeGainTurn = 0'); await run(go, /loses life equal to the amount of life you gained/); await drain(); check(ev('BOT.life') === 20, 'Gollum: ohne Treffer nichts');
    w.__go = go; ev('abilEvent({kind:"combatDamage", c:window.__go, pid:"bot", much:1, first:true})'); await wait(150); await drain(); ev('noteLifeGain(3)');
    await run(go, /loses life equal to the amount of life you gained/); await wait(150); await drain(); check(ev('BOT.life') === 17, `Gollum: KI verliert 3 Leben (${ev('BOT.life')})`); }
  // G'raha Tia: X Leben zahlen → Held mit X Marken
  await reset(); { const gr = C("G'raha Tia, Scion Reborn", {pw:2, tg:3}); put(gr); w.__sp = N('Spruch', 'Sorcery', '', {cmc:3, mc:'{2}{U}'});
    const pr = run(gr, /pay X life/, {ev:{kind:'cast', c:w.__sp}}); await wait(200); await click('Ja') || await click('Zahlen') || await click('OK'); await wait(250);  await pr; await drain();
    const h = S().bf.find(c => c.tok && /Hero/.test(c.type || '')); check(S().life === 17 && h && h.c === 3, `G'raha Tia: 3 Leben bezahlt, Held mit 3 Marken (${S().life}, ${h && h.c})`); }
  // Fire Magic (Tiered): genau ein Modus
  await reset(); { const fm = C('Fire Magic'); w.__fm = fm; const ab = ev('parseAbilities(window.__fm)').find(a => a.modal && a.modal.tiered);
    check(ab && ab.modal.modes.length === 3 && ab.modal.costs.join('|') === '|{2}|{5}' && ab.modal.n === 'one', `Fire Magic: 3 Stufen mit Zusatzkosten (${ab && ab.modal.costs.join('|')})`);
    const be = N('Klein', 'Creature — Elf', '', {pw:1, tg:1}); put(be); const pr = ev('abilSpellResolve')(fm); await wait(200); const t = d.querySelector('#modalBox').textContent;
    await click('Fire Magic deals 1') || await clickCard('Fire Magic deals 1'); await wait(80); await click('Ausführen'); await wait(300); await drain(); await pr;
    check(S().gy.some(c => c.n === 'Klein'), `Fire Magic (Fire, {0}): 1 Schaden tötet die 1/1 (${t.slice(0, 160)})`); }
  // Goblin Lackey: Schaden an Spieler → Goblin aus der Hand
  await reset(); { const gl = C('Goblin Lackey', {pw:1, tg:1}), gb = N('Goblin Boss', 'Creature — Goblin', '', {pw:2, tg:2}), be = N('Bärchen', 'Creature — Bear', '', {pw:2, tg:2}); put(gl); S().hand.push(gb, be);
    w.__gl = gl; w.__ab = abil(gl, /Goblin permanent card/); check(ev('trigMatches(window.__ab, window.__gl, {kind:"combatDamage", c:window.__gl, pid:"bot", much:1})') === true, 'Goblin Lackey: Auslöser bei Kampfschaden');
    check(ev('trigMatches(window.__ab, window.__gl, {kind:"combatDamage", c:window.__be0 = newCard({n:"X", type:"Creature"}), pid:"bot", much:1})') === false, 'Goblin Lackey: kein Auslöser für andere Kreaturen');
    const pr = run(gl, /Goblin permanent card/, {ev:{kind:'combatDamage', c:gl, pid:'bot', much:1}}); await wait(150); check(!cardsShown().some(t => t.includes('Bärchen')), 'Goblin Lackey: nur Goblins zur Wahl');
    await clickCard('Goblin Boss'); await wait(150); await pr; await drain(); check(S().bf.includes(gb) && S().hand.includes(be), 'Goblin Lackey: Goblin ins Spiel'); }
  // Forge Anew: erstes Ausrüsten im eigenen Zug gratis
  await reset(); { put(C('Forge Anew')); const eq = N('Schwert', 'Artifact — Equipment', 'Equipped creature gets +2/+0.\nEquip {3}'), be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(eq, be); ev('S.forgeKey = null'); w.__eq = eq;
    const it = ev('abilMenuItems(window.__eq, "bf")').find(i => /^Ausrüsten/.test(i.l || '')); it.f(); await wait(150); await clickCard('Bär'); await wait(200); await drain();
    check(eq.eq === be.u && ev('S.forgeKey') === ev('turnKey()'), 'Forge Anew: erstes Ausrüsten ohne Bezahlen');
    check(!ev('forgeFree()'), 'Forge Anew: zweites Ausrüsten kostet wieder'); }
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
