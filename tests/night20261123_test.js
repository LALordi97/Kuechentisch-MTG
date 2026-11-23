// Nacht 23.11.2026: Karten aus den Top-Decks – Text aus night20261123_cards.json (Scryfall)
const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync(require('path').join(__dirname, 'night20261123_cards.json'), 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
const C = (n, x = {}) => { if(!T[n]) throw new Error('Karte fehlt: ' + n); return ev('newCard')({...T[n], img:null, ...x}); };
const N = (n, type, o = '', x = {}) => ev('newCard')({n, type, o, img:null, ...x});
const open = () => !$('#modal').hidden;
const click = async t => { const b = [...d.querySelectorAll('#modalBox button')].find(b => b.textContent.trim().startsWith(t)); if(b){ b.click(); await wait(40); } return !!b; };
const clickCard = async t => { const el = [...d.querySelectorAll('#modalBox .card')].find(e => e.textContent.includes(t)); if(el){ el.click(); await wait(40); } return !!el; };
const cardsShown = () => [...d.querySelectorAll('#modalBox .card')].map(e => e.textContent);
const AUTO = ["Dreadhorde Invasion", "Dredger's Insight", "Dwalin, Weaponmaster", "Dáin's Company", "Earthbender Ascension", "Edgar Markov", "Eerie Interlude", "Eladamri, Korvecdal",
  "Elanor Gardner", "Elderfang Venom", "Electrodominance", "Elven Chorus", "Elvish Champion", "Emeria Shepherd", "Enlightened Confidant", "Essence Burn", "Ethereal Armor", "Extract a Confession",
  "Ezuri, Renegade Leader", "Fandaniel, Telophoroi Ascian", "Feasting Hobbit", "Feed the Clan", "Feral Ghoul",
  "Elven Passage", "Etali, Primal Storm", "Fallen Shinobi", "Field-Tested Frying Pan", "Fire Lord Azula", "Drivnod, Carnage Dominus", "Evendo Brushrazer"];
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

  // Elvish Champion: andere Elfen +1/+1 und Waldlandwandel
  await reset(); { const ec = C('Elvish Champion', {pw:2, tg:2}), el = N('Elf', 'Creature — Elf Warrior', '', {pw:1, tg:1}), be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(ec, el, be);
    check(pt(el) === '2/2' && pt(ec) === '2/2' && pt(be) === '2/2', `Elvish Champion: Elf 2/2, selbst und Bär unverändert (${pt(el)}, ${pt(ec)}, ${pt(be)})`);
    check(kw(el, 'forestwalk') && !kw(ec, 'forestwalk'), 'Elvish Champion: Elf hat Waldlandwandel');
    const bl = opp('Blocker'); check(ev('canBlock')(bl, el), 'Waldlandwandel: KI ohne Wald kann blocken');
    w.__f = N('Forest', 'Basic Land — Forest', ''); ev('BOT.bf.push(window.__f); botChanged()'); check(!ev('canBlock')(bl, el) && ev('canBlock')(bl, be), 'Waldlandwandel: KI mit Wald kann den Elf nicht blocken, den Bär schon'); }
  // Dáin's Company: Lebensverknüpfung mit anderem Zwerg
  await reset(); { const dc = C("Dáin's Company", {pw:2, tg:2}); put(dc); check(!kw(dc, 'lifelink'), "Dáin's Company: allein keine Lebensverknüpfung");
    put(N('Zwerg', 'Creature — Dwarf', '', {pw:1, tg:1})); check(kw(dc, 'lifelink'), "Dáin's Company: mit anderem Zwerg Lebensverknüpfung"); }
  // Elderfang Venom: angreifende Elfen haben Todesberührung
  await reset(); { const ve = C('Elderfang Venom'), el = N('Elf', 'Creature — Elf', '', {pw:1, tg:1}), be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(ve, el, be);
    check(!kw(el, 'deathtouch'), 'Elderfang Venom: nicht angreifend keine Todesberührung'); ev('S.attacking = [' + JSON.stringify(el.u) + ', ' + JSON.stringify(be.u) + ']');
    check(kw(el, 'deathtouch') && !kw(be, 'deathtouch'), 'Elderfang Venom: angreifender Elf hat Todesberührung, Bär nicht'); ev('S.attacking = []'); }
  // Ethereal Armor: +1/+1 pro Verzauberung, Erstschlag
  await reset(); { const be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}), ea = C('Ethereal Armor'), en = N('Verzauberung', 'Enchantment', ''); put(be, ea, en); ea.eq = be.u; ev('commit()');
    check(pt(be) === '4/4' && kw(be, 'first strike'), `Ethereal Armor: 2 Verzauberungen → 4/4 mit Erstschlag (${pt(be)})`); }
  // Feasting Hobbit: Schwächere können nicht blocken
  await reset(); { const fh = C('Feasting Hobbit', {pw:1, tg:1}); fh.c = 3; put(fh); const a = opp('Klein', {pw:2, tg:2}), b = opp('Gross', {pw:5, tg:5});
    check(!ev('canBlock')(a, fh) && ev('canBlock')(b, fh), `Feasting Hobbit (${pt(fh)}): 2/2 kann nicht blocken, 5/5 schon`); }
  // Elven Chorus: Kreatur von oben wirken (Menüeintrag)
  await reset(); { const ch = C('Elven Chorus'); put(ch); w.__ch = ch; const items = ev('abilMenuItems(window.__ch, "bf")');
    check(!items || items.some(i => /Oberste Karte wirken \(Kreatur\)/.test(i.l || '')), 'Elven Chorus: Menü «Oberste Karte wirken (Kreatur)»'); }
  // Eladamri: Kreatur aus der Hand aufdecken → ins Spiel
  await reset(); { const ed = C('Eladamri, Korvecdal', {pw:3, tg:3}), cr = N('Riese', 'Creature — Giant', '', {pw:5, tg:5}); put(ed); S().hand.push(cr);
    const pr = run(ed, /Reveal a card from your hand/); await wait(150); await clickCard('Riese'); await wait(150); await pr; await drain();
    check(S().bf.includes(cr), 'Eladamri: Riese aus der Hand ins Spiel'); }
  // Feed the Clan: 5 oder 10 Leben
  await reset(); { await ev('abilSpellResolve')(C('Feed the Clan')); await drain(); check(S().life === 25, `Feed the Clan: ohne grosse Kreatur 5 Leben (${S().life})`); }
  await reset(); { put(N('Riese', 'Creature — Giant', '', {pw:4, tg:4})); await ev('abilSpellResolve')(C('Feed the Clan')); await drain(); check(S().life === 30, `Feed the Clan: mit Stärke 4 10 Leben (${S().life})`); }
  // Dreadhorde Invasion: 1 Leben, Amass 1
  await reset(); { const di = C('Dreadhorde Invasion'); put(di); await run(di, /amass Zombies 1/); await drain();
    const army = S().bf.find(c => /Army/.test(c.type || '')); check(S().life === 19 && army && army.c === 1, `Dreadhorde Invasion: 19 Leben, Armee mit 1 Marke (${S().life}, ${army && army.c})`); }
  // Ezuri: Elfen +3/+3 und Trampelschaden; Regeneration nur für andere Elfen
  await reset(); { const ez = C('Ezuri, Renegade Leader', {pw:2, tg:2}), el = N('Wicht', 'Creature — Elf', '', {pw:1, tg:1}), be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(ez, el, be);
    await run(ez, /get \+3\/\+3/); await drain(); check(pt(el) === '4/4' && kw(el, 'trample') && pt(be) === '2/2' && pt(ez) === '5/5', `Ezuri: Elfen +3/+3 Trampel, Bär nicht (${pt(el)}, ${pt(ez)}, ${pt(be)})`);
    const pr = run(ez, /Regenerate another target Elf/); await wait(150); await clickCard('Wicht'); await wait(150); await pr; await drain();
    check(el.regen === ev('turnKey()'), 'Ezuri: Elf hat einen Regenerationsschild'); }
  // Feral Ghoul: Strahlungsmarken an die Gegner
  await reset(); { const fg = C('Feral Ghoul', {pw:2, tg:2}); fg.c = 1; put(fg); ev('BOT.rad = 0'); ev(`moveCard(${JSON.stringify(fg.u)}, "gy")`); await wait(250); await drain();
    check(ev('BOT.rad') === 3, `Feral Ghoul: KI erhält 3 Strahlungsmarken (${ev('BOT.rad')})`); }
  // Electrodominance: Zauber mit Manawert ≤ X gratis
  await reset(); { const big = N('Gross', 'Sorcery', '', {cmc:5}), small = N('Klein', 'Sorcery', 'You gain 2 life.', {cmc:2}); S().hand.push(big, small);
    const ed = C('Electrodominance'); ed.lastX = 2; const pr = ev('abilSpellResolve')(ed); await wait(150); await click('KI') || await click('Test'); await wait(200);
    const shown = cardsShown(); check(shown.some(t => t.includes('Klein')) && !shown.some(t => t.includes('Gross')), 'Electrodominance: nur Manawert ≤ 2 zur Wahl'); await drain(); await pr; }
  // Dwalin: Schleifmarken auf Ausrüstungen
  await reset(); { const dw = C('Dwalin, Weaponmaster', {pw:2, tg:2}), be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}), eq = N('Schwert', 'Artifact — Equipment', ''); put(dw, be, eq); eq.eq = be.u;
    await run(dw, /hone counter/); await drain(); check(eq.hone === 1 && pt(be) === '3/2', `Dwalin: Schleifmarke → Bär 3/2 (${pt(be)})`);
    ev(`moveCard(${JSON.stringify(eq.u)}, "gy")`); check(!eq.hone, 'Dwalin: Marke weg, wenn die Ausrüstung das Spiel verlässt'); }
  // Edgar Markov: Eminence aus der Kommandozone
  await reset(); { const ed = C('Edgar Markov', {pw:4, tg:4}); ev('S.cz.push(' + 'newCard(window.__x = ' + JSON.stringify({}) + '))'); ev('S.cz = []'); S().cz.push(ed); w.__v = N('Vampir', 'Creature — Vampire', '', {pw:2, tg:2});
    ev('abilEvent({kind:"cast", c:window.__v})'); await wait(250); await drain();
    check(S().bf.some(c => c.tok && /Vampire/.test(c.type || '')), 'Edgar Markov: Vampir-Token aus der Kommandozone');
    const k = S().bf.length; w.__h = N('Mensch', 'Creature — Human', '', {pw:2, tg:2}); ev('abilEvent({kind:"cast", c:window.__h})'); await wait(250); await drain();
    check(S().bf.length === k, 'Edgar Markov: Nicht-Vampir löst nichts aus'); }
  // Elanor Gardner: nur wenn diesen Zug ein Essen geopfert
  await reset(); { const el = C('Elanor Gardner', {pw:3, tg:3}); put(el); S().library.unshift(N('Forest', 'Basic Land — Forest', ''));
    w.__el = el; const a = abil(el, /sacrificed a Food/); w.__a = a; check(ev('interveningIf(window.__a.text, window.__el).ok') === false, 'Elanor: ohne geopfertes Essen keine Bedingung');
    const fo = N('Food', 'Token Artifact — Food', '{2}, {T}, Sacrifice this artifact: You gain 3 life.', {tok:true}); put(fo); w.__fo = fo; ev('noteSac(window.__fo)');
    check(ev('interveningIf(window.__a.text, window.__el).ok') === true, 'Elanor: nach geopfertem Essen erfüllt'); }
  // Dredger's Insight: Artefakt/Kreatur/Land aus den gemahlenen Karten
  await reset(); { ev('S.library = [newCard({n:"Sorc", type:"Sorcery", o:""}), newCard({n:"Wald", type:"Basic Land — Forest", o:""}), newCard({n:"Spont", type:"Instant", o:""}), newCard({n:"Bär2", type:"Creature — Bear", o:""}), newCard({n:"Rest", type:"Instant", o:""})]');
    const dr = C("Dredger's Insight"); put(dr); const pr = run(dr, /mill four cards/); await wait(200);
    const shown = cardsShown(); check(shown.some(t => t.includes('Wald')) && shown.some(t => t.includes('Bär2')) && !shown.some(t => t.includes('Spont')), `Dredger's Insight: Land und Kreatur zur Wahl, Spontanzauber nicht`);
    await clickCard('Bär2'); await wait(150); await pr; await drain(); check(S().hand.some(c => c.n === 'Bär2'), "Dredger's Insight: Bär2 auf der Hand"); }
  // Essence Burn: stirbt → Exil
  await reset(); { const t = opp('Ziel', {pw:2, tg:2, mc:'{1}{G}'}); const eb = C('Essence Burn'); const pr = ev('abilSpellResolve')(eb); await wait(150); await clickCard('Ziel'); await wait(300); await pr; await drain();
    check(ev('BOT.ex.some(c => c.n === "Ziel")') && !ev('BOT.gy.some(c => c.n === "Ziel")'), 'Essence Burn: KI-Kreatur stirbt und wird verbannt'); }
  await reset(); { const mine = N('Meins', 'Creature — Elf', '', {pw:2, tg:2, mc:'{G}'}); put(mine); mine.dieEx = ev('turnKey()'); ev(`moveCard(${JSON.stringify(mine.u)}, "gy")`);
    check(S().ex.includes(mine) && !S().gy.includes(mine), 'Essence Burn: eigene markierte Kreatur geht ins Exil statt in den Friedhof'); }
  // Eerie Interlude: verbannen, am Zugende zurück
  await reset(); { const a = N('A', 'Creature — Bear', '', {pw:2, tg:2}), b = N('B', 'Creature — Bear', '', {pw:2, tg:2}); put(a, b);
    const pr = ev('abilSpellResolve')(C('Eerie Interlude')); await wait(150); await clickCard('A'); await wait(80); await click('OK') || await click('Fertig') || await click('Weiter') || await click('Übernehmen'); await wait(150); await pr; await drain();
    check(S().ex.includes(a) && S().bf.includes(b) && (S().delayed || []).some(d => d.u === a.u && d.action === 'returnBf'), 'Eerie Interlude: A verbannt, kommt am Zugende zurück'); }
  // Emeria Shepherd: Ebene → ins Spiel
  await reset(); { const es = C('Emeria Shepherd', {pw:4, tg:4}), dead = N('Totes Ding', 'Artifact', '', {}); put(es); S().gy.push(dead); const pl = N('Plains', 'Basic Land — Plains', ''); put(pl);
    const pr = run(es, /nonland permanent card/, {ev:{kind:'enter', c:pl}}); await wait(150); await clickCard('Totes Ding'); await wait(150); await click('Ins Spiel'); await wait(150); await pr; await drain();
    check(S().bf.includes(dead), 'Emeria Shepherd: mit Ebene direkt ins Spiel'); }
  await reset(); { const es = C('Emeria Shepherd', {pw:4, tg:4}), dead = N('Totes Ding', 'Artifact', '', {}); put(es); S().gy.push(dead); const fo = N('Forest', 'Basic Land — Forest', ''); put(fo);
    const pr = run(es, /nonland permanent card/, {ev:{kind:'enter', c:fo}}); await wait(150); await clickCard('Totes Ding'); await wait(150); await pr; await drain();
    check(S().hand.includes(dead), 'Emeria Shepherd: mit Wald auf die Hand'); }
  // Enlightened Confidant: Überwachen, Karte mit kleinem Manawert zurück auf die Hand
  await reset(); { ev('S.library.unshift(newCard({n:"Billig", type:"Instant", o:"", cmc:2}))'); ev('lifeEvent("gain", 3)'); const ec = C('Enlightened Confidant', {pw:2, tg:1}); put(ec);
    w.__ec = ec; w.__a = abil(ec, /surveil 1/); const pr = ev('runAbility(window.__ec, window.__a, {}, interveningIf(window.__a.text, window.__ec).text)'); await wait(200); await click('Friedhof'); await wait(80); await click('Fertig'); await wait(150); await pr; await drain();
    check(S().hand.some(c => c.n === 'Billig'), 'Enlightened Confidant: Karte (MW 2 ≤ 3 Leben) auf die Hand'); }
  // Extract a Confession: mit Beweisen opfert die KI ihre stärkste Kreatur
  await reset(); { opp('Klein', {pw:1, tg:1}); opp('Stark', {pw:6, tg:6}); const ex = C('Extract a Confession'); ex.evidence = true; await ev('abilSpellResolve')(ex); await wait(200); await drain();
    check(ev('BOT.gy.some(c => c.n === "Stark")') && ev('BOT.bf.some(c => c.n === "Klein")'), 'Extract a Confession (Beweise): KI opfert die Stärkste'); }
  await reset(); { opp('Klein', {pw:1, tg:1}); opp('Stark', {pw:6, tg:6}); const ex = C('Extract a Confession'); await ev('abilSpellResolve')(ex); await wait(200); await drain();
    check(ev('BOT.gy.length') === 1, `Extract a Confession (ohne): KI opfert eine Kreatur (${ev('BOT.gy.map(c => c.n).join()')})`); }
  // Fandaniel: KI opfert nicht (nur starke Kreaturen) → verliert Leben
  await reset(); { opp('Stark', {pw:6, tg:6}); S().gy.push(N('S1', 'Sorcery', ''), N('S2', 'Instant', '')); const fd = C('Fandaniel, Telophoroi Ascian', {pw:4, tg:4}); put(fd);
    await run(fd, /may sacrifice a nontoken creature/); await wait(200); await drain(); check(ev('BOT.life') === 16, `Fandaniel: KI verliert 4 Leben (${ev('BOT.life')})`); }
  // Earthbender Ascension: erst ab 4 Quest-Marken
  await reset(); { const ea = C('Earthbender Ascension'), be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(ea, be); ea.c = 1;
    await run(ea, /quest counter/); await drain(); check(ea.c === 2 && (be.c || 0) === 0, `Earthbender Ascension: 2 Marken, noch nichts (${ea.c}, ${be.c || 0})`);
    ea.c = 3; const pr = run(ea, /quest counter/); await wait(150); await clickCard('Bär'); await wait(150); await pr; await drain();
    check(ea.c === 4 && be.c === 1 && kw(be, 'trample'), `Earthbender Ascension: 4 Marken → +1/+1 und Trampel (${ea.c}, ${be.c})`); }
  // Elven Passage: Land suchen, mit Elf enttappt
  await reset(); { ev('S.library.unshift(newCard({n:"Forest", type:"Basic Land — Forest", o:""}))'); const ep = C('Elven Passage'); put(ep, N('Elf', 'Creature — Elf', '', {pw:1, tg:1}));
    const pr = run(ep, /behold an Elf/); await wait(200); await clickCard('Forest'); await wait(200); if(open() && cardsShown().some(t => t.includes('Elf'))){ await clickCard('Elf'); await wait(150); } await pr; await drain();
    const fo = S().bf.find(c => c.n === 'Forest'); check(fo && !fo.tap, `Elven Passage: Wald im Spiel und enttappt (${fo && fo.tap})`); }
  // Etali: oberste Karten aller Spieler, Zauber gratis
  await reset(); { ev('S.library.unshift(newCard({n:"Meins", type:"Sorcery", o:"You gain 2 life.", cmc:3}))'); ev('BOT.library.unshift(newCard({n:"Seins", type:"Sorcery", o:"You gain 3 life.", cmc:4})); botChanged()');
    const et = C('Etali, Primal Storm', {pw:6, tg:6}); put(et); const pr = run(et, /exile the top card of each player's library/); await wait(300);
    const shown = cardsShown(); check(shown.some(t => t.includes('Meins')) && shown.some(t => t.includes('Seins')), 'Etali: beide Zauber zur Wahl'); await clickCard('Meins'); await wait(60); await clickCard('Seins'); await wait(60); await click('OK') || await click('Fertig') || await click('Übernehmen') || await click('Wirken'); await wait(400); await pr; await drain();
    check(S().life === 25, `Etali: beide gratis gewirkt (+5 Leben, ${S().life})`); }
  // Fallen Shinobi: zwei Karten des Getroffenen bis Zugende gratis spielbar
  await reset(); { const fs = C('Fallen Shinobi', {pw:5, tg:4}); put(fs); await run(fs, /exiles the top two cards/, {pid:'bot', ev:{kind:'combatDamage', c:fs, pid:'bot'}}); await wait(300); await drain();
    const ex = S().ex.filter(c => c.freeCast && c.castKey === ev('turnKey()')); check(ex.length === 2 && ev('BOT.library.length') === 18, `Fallen Shinobi: 2 KI-Karten gratis spielbar (${ex.length})`); }
  // Field-Tested Frying Pan: Essen + Halbling, Ausrüstung angelegt; Lebensgewinn pumpt
  await reset(); { const fp = C('Field-Tested Frying Pan'); put(fp); await run(fp, /create a Food token/); await wait(200); await drain();
    const h = S().bf.find(c => c.tok && /Halfling/.test(c.type || '')); check(!!h && fp.eq === h.u && S().bf.some(c => c.tok && /Food/.test(c.type || '')), 'Field-Tested Frying Pan: Essen und Halbling, Pfanne angelegt');
    if(h){ ev('lifeChanged(me.id, 3)'); await wait(300); await drain(); check(pt(h) === '4/4', `Field-Tested Frying Pan: 3 Leben → Halbling 4/4 (${pt(h)})`); } }
  // Fire Lord Azula: Firebending beim Angriff, Zauber während des Angriffs kopieren
  await reset(); { const az = C('Fire Lord Azula', {pw:4, tg:4}); put(az); ev('S.pool = emptyPoolObj()'); ev('S.attacking = [' + JSON.stringify(az.u) + ']'); w.__az = az; ev('abilEvent({kind:"attack", c:window.__az, first:true})'); await wait(200); await drain();
    check(ev('S.pool.R') === 2, `Fire Lord Azula: Firebending 2 → {R}{R} (${ev('S.pool.R')})`);
    w.__ab = abil(az, /copy that spell/); w.__sp = N('Blitz', 'Instant', '');
    check(ev('trigMatches(window.__ab, window.__az, {kind:"cast", c:window.__sp})') === true, 'Fire Lord Azula: Auslöser beim Angriff');
    ev('S.attacking = []'); check(ev('trigMatches(window.__ab, window.__az, {kind:"cast", c:window.__sp})') === false, 'Fire Lord Azula: kein Auslöser ohne Angriff'); }
  // Drivnod: Sterbe-Auslöser doppelt
  await reset(); { const dv = C('Drivnod, Carnage Dominus', {pw:8, tg:3}), bl = N('Blutsauger', 'Creature — Bat', 'Whenever another creature you control dies, you gain 1 life.', {pw:1, tg:1}), vi = N('Opfer', 'Creature — Bear', '', {pw:2, tg:2}); put(dv, bl, vi);
    ev(`moveCard(${JSON.stringify(vi.u)}, "gy")`); await wait(300); await drain(); check(S().life === 22, `Drivnod: Sterbe-Auslöser zweimal (+2 Leben, ${S().life})`); }
  // Evendo Brushrazer: nach geopferter Nicht-Token-Karte die verbannten Karten spielen
  await reset(); { ev('S.library.unshift(newCard({n:"Verbannt", type:"Sorcery", o:"You gain 1 life.", cmc:1}))'); const eb = C('Evendo Brushrazer', {pw:3, tg:2}); put(eb); await run(eb, /exile the top card of your library/); await drain();
    const x = S().ex.find(c => c.n === 'Verbannt'); check(x && x.exWith === eb.u, 'Evendo Brushrazer: Karte mit ihm verbannt'); w.__x = x;
    const menuHas = () => ev('cardMenu(window.__x, "ex")').some(i => i.l === 'Spielen (Evendo Brushrazer)');
    ev('S.sacT = null'); check(!menuHas(), 'Evendo Brushrazer: ohne Opfer nicht spielbar');
    w.__ln = N('Wald', 'Basic Land — Forest', ''); ev('noteSac(window.__ln)'); check(menuHas(), 'Evendo Brushrazer: nach geopfertem Land spielbar (Exil-Menü)'); }
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
