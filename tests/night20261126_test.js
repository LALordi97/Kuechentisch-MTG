// Nacht 26.11.2026: Karten aus den Top-Decks – Text aus night20261126_cards.json (Scryfall)
const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync(require('path').join(__dirname, 'night20261126_cards.json'), 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
const C = (n, x = {}) => { if(!T[n]) throw new Error('Karte fehlt: ' + n); return ev('newCard')({...T[n], img:null, ...x}); };
const N = (n, type, o = '', x = {}) => ev('newCard')({n, type, o, img:null, ...x});
const open = () => !$('#modal').hidden;
const click = async t => { const b = [...d.querySelectorAll('#modalBox button')].find(b => b.textContent.trim().startsWith(t)); if(b){ b.click(); await wait(40); } return !!b; };
const clickCard = async t => { const el = [...d.querySelectorAll('#modalBox .card')].find(e => e.textContent.includes(t)); if(el){ el.click(); await wait(40); } return !!el; };
const cardsShown = () => [...d.querySelectorAll('#modalBox .card')].map(e => e.textContent);
const AUTO = ["Krenko, Tin Street Kingpin", "Kwain, Itinerant Meddler", "Mabel, Bitter Recluse", "Maddening Cacophony", "Kor Skyfisher", "Marcus, Mutant Mayor", "Leatherhead, Swamp Stalker", "Liliana the Faultless", "Masked Vandal", "Marauding Raptor", "Magebane Lizard", "Lyse Hext", "Mangara, the Diplomat", "Mauhúr, Uruk-hai Captain", "Knight of the Ebon Legion", "Luminarch Ascension", "Lunar Convocation", "Laboratory Maniac", "Liesa, Forgotten Archangel", "Malakir Rebirth // Malakir Mire", "Mana Echoes", "Klauth, Unrivaled Ancient", "Keen-Eyed Curator", "Kheru Goldkeeper", "Lord of the Void", "Lethal Scheme", "Liliana, Dreadhorde General", "Lord of the Nazgûl", "Kotis, Sibsig Champion", "Kefka, Court Mage // Kefka, Ruler of Ruin"];
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

  // Krenko, Tin Street Kingpin: Marke, dann Goblins in Höhe der Stärke
  await reset(); { const k = C('Krenko, Tin Street Kingpin', {pw:1, tg:2}); put(k); const pr = ev('runTrigger')(k, abil(k, /Krenko attacks/), {}); await wait(300); await drain(); await pr;
    const g = S().bf.filter(c => c.tok && /Goblin/.test(c.n + c.type)); check(k.c === 1 && g.length === 2, `Krenko: 1 Marke, 2 Goblins (${k.c}, ${g.length})`); }
  // Maddening Cacophony: 8 bzw. halbe Bibliothek
  await reset(); { await spell('Maddening Cacophony'); await drain(); check(ev('BOT.library.length') === 12 && ev('BOT.gy.length') === 8, `Maddening Cacophony: KI mahlt 8 (${ev('BOT.gy.length')})`); }
  await reset(); { w.__sp = C('Maddening Cacophony'); w.__sp.kicked = true; await ev('abilSpellResolve')(w.__sp); await wait(200); await drain(); check(ev('BOT.library.length') === 10 && ev('BOT.gy.length') === 10, `Maddening Cacophony mit Kicker: KI mahlt die Hälfte (${ev('BOT.gy.length')})`); }
  // Kor Skyfisher: eine eigene bleibende Karte auf die Hand
  await reset(); { const ks = C('Kor Skyfisher', {pw:2, tg:3}), l = N('Ebene', 'Basic Land — Plains'); put(ks, l); const pr = ev('runTrigger')(ks, abil(ks, /return a permanent you control/), {}); await wait(200); await clickCard('Ebene'); await wait(100); await drain(); await pr;
    check(S().hand.some(c => c.n === 'Ebene') && S().bf.includes(ks), 'Kor Skyfisher: Ebene geht auf die Hand'); }
  // Mabel: bis zu drei Marken von einer KI-Kreatur entfernen
  await reset(); { const mb = C('Mabel, Bitter Recluse', {pw:1, tg:1}); put(mb); const o = opp('Grosser', {pw:2, tg:2}); o.c = 4; ev('botChanged(); commit()');
    const pr = ev('runTrigger')(mb, abil(mb, /remove up to three counters/), {}); await wait(200); await clickCard('Grosser'); await wait(200); await drain(); await pr;
    check(ev('BOT.bf.find(c => c.n === "Grosser").c') === 1, `Mabel: von 4 Marken bleibt 1 (${ev('BOT.bf.find(c => c.n === "Grosser").c')})`); }
  // Marcus: mit Marke ziehen, ohne Marke eine Marke
  await reset(); { const mc = C('Marcus, Mutant Mayor', {pw:4, tg:4}), a = N('A', 'Creature — Bear', '', {pw:2, tg:2}), b = N('B', 'Creature — Bear', '', {pw:2, tg:2}); a.c = 1; put(mc, a, b); const h0 = S().hand.length;
    for(const x of [a, b]){ const pr = ev('runTrigger')(mc, abil(mc, /deals combat damage to a player/), {kind:"combatDamage", c:x, pid:"bot"}); await wait(200); await drain(); await pr; }
    check(S().hand.length === h0 + 1 && a.c === 1 && b.c === 1, `Marcus: A zieht, B bekommt Marke (${S().hand.length - h0}, ${a.c}, ${b.c})`); }
  // Leatherhead: kommt mit Fluchsicher-Marke, entfernt sie und zerstört ein Artefakt
  await reset(); { const lh = C('Leatherhead, Swamp Stalker', {pw:4, tg:4}); put(lh); ev('manaEnter')(lh); check(kw(lh, 'hexproof'), 'Leatherhead: kommt mit Fluchsicher-Marke');
    w.__o = N('Klotz', 'Artifact', ''); ev('BOT.bf.push(window.__o); botChanged(); commit()');
    const pr = ev('runTrigger')(lh, abil(lh, /remove a counter from her/), {kind:"combatDamage", c:lh, pid:"bot"}); await wait(200); await click('Ja'); await wait(200); await clickCard('Klotz'); await wait(200); await drain(); await pr;
    check(!kw(lh, 'hexproof') && ev('BOT.gy.some(c => c.n === "Klotz")'), `Leatherhead: Marke weg, Artefakt zerstört (${kw(lh, 'hexproof')})`); }
  // Liliana the Faultless: andere eigene Kreatur fluchsicher
  await reset(); { const li = C('Liliana the Faultless', {pw:1, tg:2}), b = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(li, b); const pr = run(li, /gains hexproof/); await wait(100); await clickCard('Bär'); await wait(200); await drain(); await pr;
    check(kw(b, 'hexproof') && !kw(li, 'hexproof'), 'Liliana the Faultless: Bär wird fluchsicher'); }
  // Kwain: ich ziehe und erhalte 1 Leben, KI auch
  await reset(); { const kq = C('Kwain, Itinerant Meddler', {pw:1, tg:3}); put(kq); const h0 = S().hand.length, b0 = ev('BOT.hand.length'), bl = ev('BOT.life');
    const pr = run(kq, /Each player may draw/); await wait(100); await click('Ja'); await wait(300); await drain(); await pr;
    check(S().hand.length === h0 + 1 && S().life === 21 && ev('BOT.hand.length') === b0 + 1 && ev('BOT.life') === bl + 1, `Kwain: beide ziehen und +1 Leben (${S().life}, ${ev('BOT.life')})`); }
  // Masked Vandal: Kreaturenkarte aus dem Friedhof, dann Verzauberung der KI ins Exil
  await reset(); { const mv = C('Masked Vandal', {pw:1, tg:3}); put(mv); S().gy.push(N('Tot', 'Creature — Bear', '', {pw:2, tg:2})); w.__o = N('Zauber', 'Enchantment', ''); ev('BOT.bf.push(window.__o); botChanged(); commit()');
    const pr = ev('runTrigger')(mv, abil(mv, /exile a creature card from your graveyard/), {}); await wait(200); await click('Ja'); await wait(100); await clickCard('Tot'); await wait(200); await clickCard('Zauber'); await wait(200); await drain(); await pr;
    check(S().ex.some(c => c.n === 'Tot') && ev('BOT.ex.some(c => c.n === "Zauber")'), 'Masked Vandal: Tot verbannt, Verzauberung der KI verbannt'); }
  await reset(); { const mv = C('Masked Vandal', {pw:1, tg:3}); put(mv); w.__o = N('Zauber', 'Enchantment', ''); ev('BOT.bf.push(window.__o); botChanged(); commit()');
    const pr = ev('runTrigger')(mv, abil(mv, /exile a creature card from your graveyard/), {}); await wait(200); await click('Ja'); await wait(200); await drain(); await pr;
    check(ev('BOT.bf.some(c => c.n === "Zauber")'), 'Masked Vandal: ohne Kreaturenkarte bleibt die Verzauberung'); }
  // Marauding Raptor: 2 Schaden an der neuen Kreatur, bei Dinosaurier +2/+0
  await reset(); { const mr = C('Marauding Raptor', {pw:2, tg:3}), dino = N('Dino', 'Creature — Dinosaur', '', {pw:4, tg:4}); put(mr, dino);
    const pr = ev('runTrigger')(mr, abil(mr, /deals 2 damage to it/), {kind:"enter", c:dino}); await wait(300); await drain(); await pr;
    check(S().bf.includes(dino) && pt(mr) === '4/3', `Marauding Raptor: Dino überlebt, Raptor 4/3 (${pt(mr)})`); }
  await reset(); { const mr = C('Marauding Raptor', {pw:2, tg:3}), el = N('Elf', 'Creature — Elf', '', {pw:1, tg:2}); put(mr, el);
    const pr = ev('runTrigger')(mr, abil(mr, /deals 2 damage to it/), {kind:"enter", c:el}); await wait(300); await drain(); await pr;
    check(!S().bf.includes(el) && S().gy.includes(el) && pt(mr) === '2/3', `Marauding Raptor: Elf stirbt, Raptor bleibt 2/3 (${pt(mr)})`); }
  // Magebane Lizard: Schaden an der KI je Nichtkreaturzauber
  await reset(); { const ml = C('Magebane Lizard', {pw:1, tg:4}); put(ml); w.__sp1 = N('Blitz', 'Instant', ''); w.__sp2 = N('Schock', 'Instant', ''); ev('noteOppNc("bot", window.__sp1); noteOppNc("bot", window.__sp2)');
    const pr = ev('runTrigger')(ml, abil(ml, /noncreature spells they've cast/), {kind:"oppCast", c:w.__sp2, opp:true, pid:"bot"}); await wait(300); await drain(); await pr;
    check(ev('BOT.life') === 18, `Magebane Lizard: KI nimmt 2 Schaden (${ev('BOT.life')})`); }
  // Lyse Hext: Doppelschlag ab zwei Nichtkreaturzaubern
  await reset(); { const ly = C('Lyse Hext', {pw:2, tg:2}); put(ly); check(!kw(ly, 'double strike'), 'Lyse Hext: zuerst kein Doppelschlag');
    ev('noteSpellCast(newCard({n:"A", type:"Instant", o:""})); noteSpellCast(newCard({n:"B", type:"Creature — Bear", o:""}))'); check(!kw(ly, 'double strike'), 'Lyse Hext: ein Nichtkreaturzauber reicht nicht');
    ev('noteSpellCast(newCard({n:"C", type:"Sorcery", o:""}))'); check(kw(ly, 'double strike'), 'Lyse Hext: zwei Nichtkreaturzauber → Doppelschlag'); }
  // Mangara: Angriff mit zwei Kreaturen → ziehen
  await reset(); { const mg = C('Mangara, the Diplomat', {pw:2, tg:4}); put(mg); const h0 = S().hand.length;
    w.eval('abilEvent({kind:"attackedYou", n:1, pid:"bot", opp:true})'); await wait(300); await drain(); const h1 = S().hand.length;
    w.eval('abilEvent({kind:"attackedYou", n:2, pid:"bot", opp:true})'); await wait(300); await drain();
    check(h1 === h0 && S().hand.length === h0 + 1, `Mangara: 1 Angreifer nichts, 2 Angreifer ziehen (${h1 - h0}, ${S().hand.length - h0})`); }
  // Mauhúr: eine Marke mehr auf Orks, nicht auf Bären
  await reset(); { const mu = C('Mauhúr, Uruk-hai Captain', {pw:2, tg:2}), ork = N('Ork', 'Creature — Orc Soldier', '', {pw:1, tg:1}), bär = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(mu, ork, bär);
    check(ev('plusCtrN')(ork, 1) === 2 && ev('plusCtrN')(bär, 1) === 1 && ev('plusCtrN')(mu, 2) === 3, 'Mauhúr: Orks +1 Marke, Bären nicht'); }
  // Lebensverlust-Bedingungen
  await reset(); { const kn = C('Knight of the Ebon Legion', {pw:1, tg:2}); put(kn); const iff = t => ev('interveningIf')(t, kn).ok; ev('S.lifeLost = null; S.lifeGainKey = null');
    check(iff("if a player lost 4 or more life this turn, x") === false && iff("if you didn't lose life this turn, x") === true, 'Bedingungen: noch kein Lebensverlust');
    ev('lifeChanged("bot", -4)'); check(iff("if a player lost 4 or more life this turn, x") === true && iff("if you didn't lose life this turn, x") === true, 'Bedingungen: KI verliert 4');
    ev('lifeChanged(me.id, -1)'); check(iff("if you didn't lose life this turn, x") === false && iff("if you gained and lost life this turn, x") === false, 'Bedingungen: ich verliere 1');
    ev('noteLifeGain(2)'); check(iff("if you gained and lost life this turn, x") === true, 'Bedingungen: gewonnen und verloren');
    const pr = ev('runTrigger')(kn, abil(kn, /lost 4 or more life/), {}); await wait(200); await drain(); await pr; check(kn.c === 1, `Knight of the Ebon Legion: +1/+1-Marke (${kn.c})`); }

  // Laboratory Maniac: Ziehen aus leerer Bibliothek gewinnt
  await reset(); { put(C('Laboratory Maniac', {pw:2, tg:2})); ev('S.library = []; draw(1)'); await wait(50);
    check(d.body.innerHTML.includes('Du gewinnst das Spiel'), 'Laboratory Maniac: Sieg gemeldet'); }
  // Liesa: KI-Kreatur stirbt → Exil; eigene Kreatur nicht
  await reset(); { put(C('Liesa, Forgotten Archangel', {pw:4, tg:5})); const o = opp('Opfer'); ev('botToZone(BOT.bf.find(c => c.n === "Opfer"), "gy"); botChanged(); commit()');
    check(ev('BOT.ex.some(c => c.n === "Opfer") && !BOT.gy.some(c => c.n === "Opfer")'), 'Liesa: sterbende KI-Kreatur wird verbannt'); }
  // Malakir Rebirth: Kreatur kehrt getappt zurück
  await reset(); { const b = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(b); const pr = spell('Malakir Rebirth // Malakir Mire'); await wait(100); await clickCard('Bär'); await wait(200); await drain(); await pr;
    check(S().life === 18 && b.rebirth, `Malakir Rebirth: 2 Leben bezahlt, Bär markiert (${S().life})`); ev(`moveCard("${b.u}", "gy")`); await wait(100);
    const bb = S().bf.find(c => c.n === 'Bär'); check(bb && bb.tap && !S().gy.some(c => c.n === 'Bär'), 'Malakir Rebirth: Bär stirbt und kommt getappt zurück'); }
  // Mana Echoes: {C} je Kreatur mit gemeinsamem Typ
  await reset(); { const me1 = C('Mana Echoes'), g1 = N('Gob1', 'Creature — Goblin Warrior', '', {pw:1, tg:1}), g2 = N('Gob2', 'Creature — Goblin', '', {pw:1, tg:1}), e1 = N('Elf', 'Creature — Elf Warrior', '', {pw:1, tg:1}), b1 = N('Bär', 'Creature — Bear', '', {pw:1, tg:1}); put(me1, g1, g2, e1, b1); ev('S.pool = emptyPoolObj()');
    const pr = ev('runTrigger')(me1, abil(me1, /share a creature type/), {kind:"enter", c:g1}); await wait(200); await click('Ja'); await wait(100); await drain(); await pr;
    check(ev('S.pool.C') === 3, `Mana Echoes: 3× {C} (Gob1, Gob2, Elf-Krieger) (${ev('S.pool.C')})`); }
  // Klauth: Mana in Höhe der Stärke der Angreifer
  await reset(); { const kl = C('Klauth, Unrivaled Ancient', {pw:3, tg:3}), b = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(kl, b); ev(`S.attacking = ["${kl.u}", "${b.u}"]; S.pool = emptyPoolObj()`);
    const pr = ev('runTrigger')(kl, abil(kl, /Klauth attacks/), {kind:"attack", c:kl}); await wait(200); { const b = [...d.querySelectorAll('#modalBox button')].find(b => / Rot/.test(b.textContent)); if(b) b.click(); } await wait(100); if(open()){ d.querySelector('#askN') && (d.querySelector('#askN').value = '5'); await click('Weiter'); } await wait(200); await drain(); await pr;
    check(ev('S.pool.R') === 5, `Klauth: 5 rotes Mana (${JSON.stringify(ev('S.pool'))})`); }

  // Keen-Eyed Curator: ab vier Kartentypen im Exil +4/+4 und Trampelschaden
  await reset(); { const kc = C('Keen-Eyed Curator', {pw:3, tg:3}); put(kc); S().gy.push(N('Ar', 'Artifact', ''), N('Kr', 'Creature — Bear', '', {pw:1, tg:1}), N('In', 'Instant', ''), N('La', 'Land', ''));
    for(const n of ['Ar', 'Kr', 'In']){ const pr = run(kc, /Exile target card from a graveyard/); await wait(100); await clickCard(n); await wait(150); await drain(); await pr; }
    check(pt(kc) === '3/3' && !kw(kc, 'trample'), `Keen-Eyed Curator: drei Typen – noch 3/3 (${pt(kc)})`);
    { const pr = run(kc, /Exile target card from a graveyard/); await wait(100); await clickCard('La'); await wait(150); await drain(); await pr; }
    check(pt(kc) === '7/7' && kw(kc, 'trample'), `Keen-Eyed Curator: vier Typen – 7/7 mit Trampelschaden (${pt(kc)})`); }
  // Kheru Goldkeeper Renew: zwei Marken und Flugmarke
  await reset(); { const kg = C('Kheru Goldkeeper', {pw:3, tg:3}), b = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(b); S().gy.push(kg);
    const st = ev('parseSteps')("Put two +1/+1 counters and a flying counter on target creature.", kg); const pr = ev('runSteps')(st, kg, {}); await wait(100); await clickCard('Bär'); await wait(200); await drain(); await pr;
    check(b.c === 2 && kw(b, 'flying'), `Kheru Goldkeeper: Bär 2 Marken und Fliegen (${b.c})`); }
  // Lord of the Void: sieben Karten der KI, eine Kreatur unter meiner Kontrolle
  await reset(); { const lv = C('Lord of the Void', {pw:7, tg:7}); put(lv); ev('BOT.library = [newCard({n:"Insel", type:"Basic Land — Island", o:""}), newCard({n:"Drache", type:"Creature — Dragon", o:"", pw:5, tg:5}), ...Array(8).fill(0).map(() => newCard({n:"Island", type:"Basic Land — Island", o:""}))]; botChanged()');
    const pr = ev('runTrigger')(lv, abil(lv, /exile the top seven/), {kind:"combatDamage", c:lv, pid:"bot"}); await wait(400); await drain(); await pr;
    check(S().bf.some(c => c.n === 'Drache') && ev('BOT.library.length') === 3 && S().ex.length === 6, `Lord of the Void: Drache unter meiner Kontrolle, 6 im Exil (${ev('BOT.library.length')}, ${S().ex.length})`); }
  // Lethal Scheme: Zerstören, mitbezahlende Kreatur connivt
  await reset(); { const e1 = N('Elf', 'Creature — Elf', '', {pw:1, tg:1, mc:'{B}'}); put(e1); ev('S.library = Array(5).fill(0).map(() => newCard({n:"Grizzly", type:"Creature — Bear", o:"", pw:2, tg:2}))'); const o = opp('Opfer');
    w.__sp = C('Lethal Scheme'); w.__sp.convokedBy = [e1.u]; const pr = ev('abilSpellResolve')(w.__sp); await wait(200); await clickCard('Opfer'); await wait(300); await clickCard('Grizzly'); await wait(200); await drain(); await pr;
    check(ev('BOT.gy.some(c => c.n === "Opfer")') && e1.c === 1 && S().gy.some(c => c.n === 'Grizzly'), `Lethal Scheme: Opfer zerstört, Elf connivt mit Marke (${e1.c})`); }
  // Liliana, Dreadhorde General −9: KI behält je Typ eine Karte
  await reset(); { const lg = C('Liliana, Dreadhorde General'); put(lg); ev('BOT.bf = [newCard({n:"L1", type:"Basic Land — Island", o:""}), newCard({n:"L2", type:"Basic Land — Island", o:""}), newCard({n:"K1", type:"Creature — Bear", o:"", pw:2, tg:2, cmc:2}), newCard({n:"K2", type:"Creature — Bear", o:"", pw:5, tg:5, cmc:5}), newCard({n:"AK", type:"Artifact Creature — Golem", o:"", pw:3, tg:3, cmc:4})]; botChanged(); commit()');
    const st = ev('parseSteps')("Each opponent chooses a permanent they control of each permanent type and sacrifices the rest.", lg); await ev('runSteps')(st, lg, {}); await wait(200); await drain();
    const left = ev('BOT.bf.map(c => c.n).sort().join(",")'); check(left === 'AK,K2,L1' || left === 'AK,L1' || left === 'K2,L1,AK', `Liliana −9: KI behält ${left}`); }
  // Lord of the Nazgûl: ab neun Geisterwesen 9/9
  await reset(); { const ln = C('Lord of the Nazgûl', {pw:4, tg:3}); put(ln); for(let i = 0; i < 7; i++) put(N('Wraith', 'Creature — Wraith', '', {pw:3, tg:3, tok:true}));
    const pr = ev('runTrigger')(ln, abil(ln, /Wraith creature token/), {kind:"cast", c:N('Blitz', 'Instant', '')}); await wait(300); await drain(); await pr;
    const wr = S().bf.filter(c => /Wraith/.test(c.type || '')); check(wr.length === 9 && wr.every(c => pt(c) === '9/9'), `Lord of the Nazgûl: 9 Wraiths sind 9/9 (${wr.length}, ${wr.map(pt).join(" ")})`); }

  // Kotis: Kreatur aus dem Friedhof → zwei Marken, aus der Hand nicht
  await reset(); { const ko = C('Kotis, Sibsig Champion', {pw:3, tg:3}); put(ko); const z = N('Zombie', 'Creature — Zombie', '', {pw:2, tg:2}), h = N('Handbär', 'Creature — Bear', '', {pw:2, tg:2}); S().gy.push(z); S().hand.push(h); ev('commit()');
    ev(`moveCard("${h.u}", "bf"); commit()`); await wait(400); await drain();
    check(!(ko.c > 0), `Kotis: aus der Hand keine Marken (${ko.c})`);
    ev(`moveCard("${z.u}", "bf"); commit()`); await wait(400); await drain();
    check(ko.c === 2, `Kotis: aus dem Friedhof zwei Marken (automatisch ausgelöst) (${ko.c})`); }

  // Kefka: jeder wirft ab, ich ziehe pro Kartentyp
  await reset(); { const kf = C('Kefka, Court Mage // Kefka, Ruler of Ruin', {pw:4, tg:5}); put(kf); S().hand.push(N('Hand-Golem', 'Artifact Creature — Golem', '', {pw:2, tg:2})); ev('BOT.hand = [newCard({n:"Blitz", type:"Instant", o:""})]; botChanged(); commit()');
    const pr = ev('runTrigger')(kf, abil(kf, /each player discards/), {kind:"enter", c:kf}); await wait(200); await clickCard('Hand-Golem'); await wait(300); await drain(); await pr;
    check(S().gy.some(c => c.n === 'Hand-Golem') && ev('BOT.gy.some(c => c.n === "Blitz")') && S().hand.length === 3, `Kefka: Artefakt, Kreatur, Spontanzauber → 3 Karten (${S().hand.length})`); }

  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
