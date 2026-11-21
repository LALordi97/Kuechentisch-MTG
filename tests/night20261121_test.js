// Nacht 21.11.2026: Karten aus den Top-Decks – Text aus night20261121_cards.json (Scryfall)
const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync(require('path').join(__dirname, 'night20261121_cards.json'), 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
const C = (n, x = {}) => { if(!T[n]) throw new Error('Karte fehlt: ' + n); return ev('newCard')({...T[n], img:null, ...x}); };
const N = (n, type, o = '', x = {}) => ev('newCard')({n, type, o, img:null, ...x});
const open = () => !$('#modal').hidden;
const click = async t => { const b = [...d.querySelectorAll('#modalBox button')].find(b => b.textContent.trim().startsWith(t)); if(b){ b.click(); await wait(40); } return !!b; };
const clickCard = async t => { const el = [...d.querySelectorAll('#modalBox .card')].find(e => e.textContent.includes(t)); if(el){ el.click(); await wait(40); } return !!el; };
const cardsShown = () => [...d.querySelectorAll('#modalBox .card')].map(e => e.textContent);
const AUTO = ["Bilbo, Fellow Conspirator", "Boggart Shenanigans", "Brokers Ascendancy", "Bruvac the Grandiloquent", "Chaos Warp", "Bender's Waterskin", "Bladewing the Risen", "Blighted Agent",
  "Bloodghast", "Bloodletter of Aclazotz", "Bonder's Ornament", "Bone Miser", "Camellia, the Seedmiser", "Campfire", "Captain Marvel, Earth's Protector", "Cavern-Hoard Dragon", "Champion's Helm",
  "Chandra, Torch of Defiance", "Changeling Outcast", "Chatterfang, Squirrel General", "Braids, Arisen Nightmare", "Bonehoard Dracosaur", "Captain James T. Kirk", "Captivating Vampire", "Chandra, Chill of Compliance", "Buster Sword", "Bringer of the Last Gift", "Call Damage Control", "Call the Spirit Dragons", "Case of the Crimson Pulse"];
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

  // Boggart Shenanigans: 1 Schaden an Zielspieler
  await reset(); { const bs = C('Boggart Shenanigans'); put(bs); const pr = run(bs, /deal 1 damage/); await wait(100); await click('Ja'); await wait(100); await click('KI'); await wait(150); await pr; await drain();
    check(ev('BOTS.bot.life') === 19, `Boggart Shenanigans: KI verliert 1 Leben (${ev('BOTS.bot.life')})`); }
  // Brokers Ascendancy: +1/+1 auf jede Kreatur, Loyalität auf jeden Planeswalker
  await reset(); { const cr = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}), pw = N("Walker", "Legendary Planeswalker — Test", ""); pw.c = 3; put(cr, pw); const ba = C('Brokers Ascendancy'); put(ba);
    await run(ba, /loyalty counter/); await drain();
    check(cr.c === 1 && pw.c === 4, `Brokers Ascendancy: Kreatur +1 (${cr.c}), Planeswalker 3 → 4 (${pw.c})`); }
  // Cavern-Hoard Dragon: Treasure pro Artefakt des getroffenen Spielers
  await reset(); { ev('BOT.bf.push(newCard({n:"Sol Ring", type:"Artifact", o:""}), newCard({n:"Mox", type:"Artifact", o:""}), newCard({n:"Island", type:"Basic Land — Island", o:""})); botChanged(); injectBot(); commit()');
    const cd = C('Cavern-Hoard Dragon', {pw:6, tg:6}); put(cd); await run(cd, /Treasure token for each artifact/, {ev:{kind:'combatDamage', c:cd, pid:'bot', much:6}}); await drain();
    check(toks(/Treasure/).length === 2, `Cavern-Hoard Dragon: 2 Treasure bei 2 Artefakten der KI (${toks(/Treasure/).length})`); }
  // Chaos Warp: eigene Kreatur in die Bibliothek, oberste Karte (Land) ins Spiel
  await reset(); { const cr = N('Opfer', 'Creature — Bear', '', {pw:2, tg:2}); put(cr); ev('S.library = Array(5).fill(0).map(() => newCard({n:"Swamp", type:"Basic Land — Swamp", o:""}))');
    const cw = C('Chaos Warp'); const pr = ev('abilSpellResolve')(cw); await wait(150); await clickCard('Opfer'); await wait(200); await pr; await drain();
    const inLib = S().library.includes(cr), sw = S().bf.filter(c => c.n === 'Swamp').length;
    // oberste Karte nach dem Mischen: ein Sumpf (kommt ins Spiel) oder die Kreatur selbst (kommt zurück)
    check((inLib && sw === 1 && S().library.length === 5) || (S().bf.includes(cr) && sw === 0 && S().library.length === 5), `Chaos Warp (eigene): Kreatur gemischt, oberste bleibende Karte ins Spiel (Bibliothek ${inLib}, Sümpfe ${sw}, Bibliothek ${S().library.length})`); }
  await reset(); { w.__o = N('Riese', 'Creature — Giant', '', {pw:4, tg:4}); ev('BOT.bf.push(window.__o); BOT.library = [newCard({n:"Forest", type:"Basic Land — Forest", o:""})]; botChanged(); injectBot(); commit()');
    const cw = C('Chaos Warp'); const pr = ev('abilSpellResolve')(cw); await wait(150); await clickCard('Riese'); await wait(300); await pr; await drain(); await wait(100);
    const bn = ev('BOT.bf.map(c => c.n).join()'); check(bn.includes('Forest') || bn.includes('Riese'), `Chaos Warp (KI): Riese gemischt, oberste Karte ins Spiel (${bn})`);
    check(ev('BOT.bf.length') === 1, `Chaos Warp (KI): genau eine Karte im Spiel (${bn})`); }
  // Bonder's Ornament: jeder mit einem Ornament zieht
  await reset(); { const bo = C("Bonder's Ornament"); put(bo); w.__o = N("Bonder's Ornament", 'Artifact', ''); ev('BOT.bf.push(window.__o); BOT.hand = []; botChanged(); injectBot(); commit()');
    await run(bo, /Each player who controls/); await wait(200); await drain();
    check(S().hand.length === 1 && ev('BOT.hand.length') === 1, `Bonder's Ornament: ich und die KI ziehen je 1 (${S().hand.length}/${ev('BOT.hand.length')})`); }
  // Campfire: Commander aus Kommandozone auf die Hand, Friedhof in die Bibliothek
  await reset(); { const cm = N('Chef', 'Legendary Creature — Human', '', {pw:3, tg:3, cmdr:true}); ev('S.cz = []'); S().cz.push(cm); S().gy.push(N('Alt1', 'Instant'), N('Alt2', 'Sorcery')); const cf = C('Campfire'); put(cf);
    const l0 = S().library.length; await run(cf, /commanders you own/); await drain();
    check(S().hand.includes(cm) && !S().cz.includes(cm), 'Campfire: Commander auf die Hand');
    check(S().gy.length === 0 && S().library.length === l0 + 2, `Campfire: Friedhof in die Bibliothek gemischt (${S().library.length})`); }
  // Chandra, Torch of Defiance +1: nicht wirken → 2 Schaden an jeden Gegner; wirken → Karte im Exil wirkbar
  await reset(); { const ch = C('Chandra, Torch of Defiance', {c:4}); put(ch); ev('S.library = [newCard({n:"Lightning Bolt", type:"Instant", o:"Lightning Bolt deals 3 damage to any target.", mc:"{R}", cmc:1}), ...S.library]');
    const pr = run(ch, /Exile the top card/); await wait(150); await click('Nein'); await wait(150); await pr; await drain();
    check(ev('BOTS.bot.life') === 18 && S().ex.some(c => c.n === 'Lightning Bolt'), `Chandra +1, nicht gewirkt: 2 Schaden an die KI (${ev('BOTS.bot.life')})`); }
  await reset(); { const ch = C('Chandra, Torch of Defiance', {c:4}); put(ch); ev('S.library = [newCard({n:"Lightning Bolt", type:"Instant", o:"Lightning Bolt deals 3 damage to any target.", mc:"{R}", cmc:1}), ...S.library]');
    const pr = run(ch, /Exile the top card/); await wait(150); await click('Ja'); await wait(150); await pr; await drain();
    const lb = S().ex.find(c => c.n === 'Lightning Bolt'); check(ev('BOTS.bot.life') === 20 && lb && lb.castKey, `Chandra +1, gewirkt: kein Schaden, Karte wirkbar (${ev('BOTS.bot.life')}, ${lb && lb.castKey})`); }
  // Bladewing the Risen: nur Drachen +1/+1
  await reset(); { const bw = C('Bladewing the Risen', {pw:4, tg:4}), dr = N('Drache', 'Creature — Dragon', '', {pw:2, tg:2}), hu = N('Mensch', 'Creature — Human', '', {pw:2, tg:2}); put(bw, dr, hu);
    await run(bw, /Dragon creatures get/); await drain();
    check(pt(bw) === '5/5' && pt(dr) === '3/3' && pt(hu) === '2/2', `Bladewing: Drachen +1/+1, Mensch nicht (${pt(bw)}, ${pt(dr)}, ${pt(hu)})`); }
  // Camellia: andere Eichhörnchen +1/+1, Camellia nicht
  await reset(); { const ca = C('Camellia, the Seedmiser', {pw:3, tg:3}), sq = N('Squirrel', 'Token Creature — Squirrel', '', {pw:1, tg:1, tok:true}), be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(ca, sq, be);
    await run(ca, /each other Squirrel/); await drain();
    check((sq.c || 0) === 1 && !(ca.c || 0) && !(be.c || 0), `Camellia: nur das andere Eichhörnchen +1 (${sq.c || 0}/${ca.c || 0}/${be.c || 0})`); }
  // Captain Marvel: +1/+1- und Unzerstörbar-Marke
  await reset(); { const cm = C("Captain Marvel, Earth's Protector", {pw:4, tg:4}); put(cm); await run(cm, /indestructible counter/); await drain();
    check(cm.c === 1 && ev('kwHas')(cm, 'indestructible'), `Captain Marvel: +1/+1-Marke und unzerstörbar (${cm.c}, ${(cm.kwc || []).join()})`); }
  // Blighted Agent / Changeling Outcast: unblockbar; Outcast kann nicht blocken
  await reset(); { const ag = C('Blighted Agent', {pw:1, tg:1}), oc = C('Changeling Outcast', {pw:1, tg:1}), bl = N('Blocker', 'Creature — Wall', '', {pw:0, tg:4}); put(ag, oc, bl);
    check(!ev('canBlock')(bl, ag) && !ev('canBlock')(bl, oc), 'Blighted Agent, Changeling Outcast: nicht blockbar');
    const at = N('Angreifer', 'Creature — Bear', '', {pw:2, tg:2}); check(!ev('canBlock')(oc, at) && ev('canBlock')(bl, at), 'Changeling Outcast kann nicht blocken, andere schon');
    const plain = N('Normal', 'Creature — Bear', 'Creatures you control can\'t be blocked.', {pw:2, tg:2}); check(ev('canBlock')(bl, plain), 'Text «Creatures you control can\'t be blocked» macht die Karte selbst nicht unblockbar'); }
  // Bloodghast: Eile ab 10 Leben eines Gegners
  await reset(); { const bg = C('Bloodghast', {pw:2, tg:1}); put(bg); check(!ev('kwHas')(bg, 'haste'), 'Bloodghast: KI 20 Leben → keine Eile');
    ev('BOT.life = 10; botChanged(); injectBot()'); check(ev('kwHas')(bg, 'haste'), 'Bloodghast: KI 10 Leben → Eile'); }
  // Champion's Helm: fluchsicher nur für legendäre
  await reset(); { const lg = N('Held', 'Legendary Creature — Human', '', {pw:2, tg:2}), nl = N('Kerl', 'Creature — Human', '', {pw:2, tg:2}); const h1 = C("Champion's Helm"), h2 = C("Champion's Helm"); h1.eq = lg.u; h2.eq = nl.u; put(lg, nl, h1, h2);
    check(ev('kwHas')(lg, 'hexproof') && !ev('kwHas')(nl, 'hexproof'), `Champion's Helm: legendär fluchsicher, sonst nicht (${ev('kwHas')(lg, 'hexproof')} ${ev('kwHas')(nl, 'hexproof')} ${ev('night21Kw')(lg, 'hexproof')})`); }
  // Bender's Waterskin: enttappt im Zug eines anderen Spielers
  await reset(); { const bw = C("Bender's Waterskin"); bw.tap = true; const ot = N('Anderes', 'Artifact', ''); ot.tap = true; put(bw, ot);
    ev('remindTriggers')('upkeep', false); await wait(50); check(!bw.tap && ot.tap, "Bender's Waterskin: enttappt im fremden Versorgungssegment, anderes Artefakt nicht");
    bw.tap = true; ev('remindTriggers')('upkeep', true); await wait(50); check(bw.tap, "Bender's Waterskin: nicht im eigenen Zug"); await drain(); }
  // Bloodletter of Aclazotz: doppelter Lebensverlust in meinem Zug
  await reset(); { put(C('Bloodletter of Aclazotz', {pw:2, tg:4})); ev('hitOpponent("bot", {kind:"loss", amount:2, src:"Test"})'); await wait(100);
    check(ev('BOTS.bot.life') === 16, `Bloodletter: 2 Lebensverlust → 4 in meinem Zug (${ev('BOTS.bot.life')})`);
    ev('TURN.active = "bot"'); ev('hitOpponent("bot", {kind:"damage", amount:2, src:"Test"})'); await wait(100); ev('TURN.active = me.id');
    check(ev('BOTS.bot.life') === 14, `Bloodletter: im fremden Zug nur 2 (${ev('BOTS.bot.life')})`);
    const at = N('Angreifer', 'Creature — Bear', '', {pw:3, tg:3}); put(at); const r = ev('computeCombat')([at], new w.Map()); check(r.dmg === 6, `Bloodletter: Kampfschaden 3 → 6 Lebensverlust (${r.dmg})`); }
  // Bruvac: Gegner mahlt doppelt
  await reset(); { put(C('Bruvac the Grandiloquent', {pw:1, tg:5})); await ev('requestOpp("bot", {kind:"mill", n:2, src:"Test"})'); await wait(50);
    check(ev('BOT.gy.length') === 4, `Bruvac: KI mahlt 4 statt 2 (${ev('BOT.gy.length')})`); }
  // Bone Miser: «noncreature, nonland card» als Auslöser
  await reset(); { const bm = C('Bone Miser', {pw:2, tg:2}); put(bm); const ab = abil(bm, /noncreature/);
    check(ab && /noncreature, nonland card/.test(ab.cond || ''), `Bone Miser: Auslöser «${ab && ab.cond}»`);
    const inst = N('Spruch', 'Instant'), crt = N('Wesen', 'Creature — Bear', '', {pw:1, tg:1});
    check(ev('trigMatches')(ab, bm, {kind:'youDiscard', c:inst}) && !ev('trigMatches')(ab, bm, {kind:'youDiscard', c:crt}), 'Bone Miser: löst bei Spontanzauber aus, nicht bei Kreatur'); }
  // Bilbo: Food → zusätzlich Treasure; Chatterfang: pro Token ein Eichhörnchen
  await reset(); { put(C('Bilbo, Fellow Conspirator', {pw:1, tg:3})); const src = N('Quelle', 'Sorcery'); await ev('makeTokens')({t:'token', n:'a', desc:'Food', extra:''}, src, {}); await drain();
    check(toks(/Food/).length === 1 && toks(/Treasure/).length === 1, `Bilbo: Food und Treasure (${toks(/./).map(c => c.n).join()})`); }
  await reset(); { put(C('Chatterfang, Squirrel General', {pw:3, tg:3})); const src = N('Quelle', 'Sorcery'); await ev('makeTokens')({t:'token', n:'two', desc:'Treasure', extra:''}, src, {}); await drain();
    check(toks(/Treasure/).length === 2 && toks(/Squirrel/).length === 2, `Chatterfang: 2 Treasure + 2 Eichhörnchen (${toks(/./).map(c => c.n).join()})`); }
  // Braids: ich opfere eine Kreatur; die KI opfert keine (Leben > 10) → verliert 2, ich ziehe
  await reset(); { const br = C('Braids, Arisen Nightmare', {pw:3, tg:3}), fo = N('Futter', 'Creature — Bear', '', {pw:1, tg:1}); put(br, fo); opp('KI-Bär');
    const pr = run(br, /you may sacrifice/); await wait(150); await click('Ja'); await wait(100); await clickCard('Futter'); await click('Weiter'); await click('OK'); await click('Opfern'); await wait(250); await pr; await drain();
    check(!S().bf.includes(fo) && ev('BOTS.bot.life') === 18 && S().hand.length === 1, `Braids: KI opfert nicht → 2 Leben, ich ziehe (${ev('BOTS.bot.life')}, Hand ${S().hand.length})`); }
  await reset(); { const br = C('Braids, Arisen Nightmare', {pw:3, tg:3}), fo = N('Futter', 'Creature — Bear', '', {pw:1, tg:1}); put(br, fo); opp('KI-Bär'); ev('BOT.life = 8; botChanged()');
    const pr = run(br, /you may sacrifice/); await wait(150); await click('Ja'); await wait(100); await clickCard('Futter'); await click('Weiter'); await click('OK'); await click('Opfern'); await wait(250); await pr; await drain();
    check(!ev('BOT.bf.some(c => c.n === "KI-Bär")') && ev('BOTS.bot.life') === 8 && S().hand.length === 0, `Braids: KI opfert eine Kreatur → kein Leben, keine Karte (${ev('BOTS.bot.life')}, Hand ${S().hand.length})`); }
  // Bonehoard Dracosaur: Land → Dinosaurier, Nichtland → Treasure
  await reset(); { const bd = C('Bonehoard Dracosaur', {pw:5, tg:5}); put(bd); ev('S.library = [newCard({n:"Mountain", type:"Basic Land — Mountain", o:""}), newCard({n:"Mountain", type:"Basic Land — Mountain", o:""}), ...S.library]');
    await run(bd, /exile the top two cards/); await drain();
    check(toks(/Dinosaur/).length === 1 && toks(/Treasure/).length === 0, `Bonehoard: zwei Länder → nur ein Dinosaurier (${toks(/./).map(c => c.n).join()})`); }
  await reset(); { const bd = C('Bonehoard Dracosaur', {pw:5, tg:5}); put(bd); ev('S.library = [newCard({n:"Mountain", type:"Basic Land — Mountain", o:""}), newCard({n:"Shock", type:"Instant", o:"Shock deals 2 damage to any target."}), ...S.library]');
    await run(bd, /exile the top two cards/); await drain();
    check(toks(/Dinosaur/).length === 1 && toks(/Treasure/).length === 1, `Bonehoard: Land und Spontanzauber → Dinosaurier und Treasure (${toks(/./).map(c => c.n).join()})`); }
  // Captain James T. Kirk: mit Handkarten ein Modus, ohne Handkarten mehrere; Auslöser beim Eintreten
  await reset(); { const ck = C('Captain James T. Kirk', {pw:3, tg:3}); put(ck); const ab = abil(ck, /enters or attacks/);
    check(ab && ev('trigMatches')(ab, ck, {kind:'enter', c:ck}), 'Captain Kirk: löst beim Eintreten aus');
    let pr = ev('runAbility')(ck, ab, {}); await wait(150); await click('Create a 1/1'); await click('Creatures you control'); await click('Ausführen'); await wait(200); await pr; await drain();
    check(toks(/Officer/).length === 1 && pt(ck) === '4/3', `Captain Kirk ohne Handkarten: zwei Modi (Officer ${toks(/Officer/).length}, ${pt(ck)})`);
    await reset(); const ck2 = C('Captain James T. Kirk', {pw:3, tg:3}); put(ck2); S().hand.push(N('Karte', 'Instant'));
    pr = ev('runAbility')(ck2, abil(ck2, /enters or attacks/), {}); await wait(150); await click('Create a 1/1'); await click('Creatures you control'); await click('Ausführen'); await wait(200); await pr; await drain();
    check(toks(/Officer/).length === 1 && pt(ck2) === '3/3', `Captain Kirk mit Handkarte: nur ein Modus (Officer ${toks(/Officer/).length}, ${pt(ck2)})`); }
  // Captivating Vampire: andere Vampire +1/+1; Kontrolle übernehmen, das Ziel wird ein Vampir
  await reset(); { const cv = C('Captivating Vampire', {pw:2, tg:2}), v2 = N('Blutsauger', 'Creature — Vampire', '', {pw:2, tg:2}); put(cv, v2); opp('KI-Bär');
    check(pt(v2) === '3/3' && pt(cv) === '2/2', `Captivating Vampire: anderer Vampir 3/3, selbst 2/2 (${pt(v2)}, ${pt(cv)})`);
    const pr = run(cv, /Gain control of target creature/); await wait(150); await clickCard('KI-Bär'); await wait(300); await pr; await drain();
    const got = S().bf.find(c => c.n === 'KI-Bär');
    check(got && /Vampire/.test(got.type) && pt(got) === '3/3' && !ev('BOT.bf.some(c => c.n === "KI-Bär")'), `Captivating Vampire: KI-Bär gehört mir, ist Vampir und 3/3 (${got && got.type}, ${got && pt(got)})`); }
  // Chandra, Chill of Compliance: Überwachen 1 – Nichtkreatur/Nichtland in den Friedhof → auf die Hand; −X: tappen und X Betäubungsmarken
  await reset(); { const cc = C('Chandra, Chill of Compliance'); cc.c = 5; put(cc); ev('S.library = [newCard({n:"Opt", type:"Instant", o:"Scry 1. Draw a card."}), ...S.library]');
    const pr = run(cc, /Surveil 1/); await wait(200); const sel = d.querySelector('#modalBox select'); if(sel){ const o = [...sel.options].find(o => /gy|Friedhof/i.test(o.value + o.textContent)); if(o){ sel.value = o.value; sel.dispatchEvent(new w.Event('change')); } }
    else { const b = [...d.querySelectorAll('#modalBox button')].find(b => /Friedhof/.test(b.textContent)); if(b) b.click(); }
    await wait(60); await click('Fertig'); await click('OK'); await click('Weiter'); await click('Übernehmen'); await wait(200); await pr; await drain();
    check(S().hand.some(c => c.n === 'Opt') && !S().gy.some(c => c.n === 'Opt'), `Chandra +1: Opt über den Friedhof auf die Hand (Hand ${S().hand.map(c => c.n).join()}, Friedhof ${S().gy.map(c => c.n).join()})`); }
  await reset(); { const cc = C('Chandra, Chill of Compliance'); cc.c = 5; put(cc); const ob = opp('KI-Bär');
    const pr = run(cc, /stun counters/); await wait(150); if(d.querySelector('#askN')){ d.querySelector('#askN').value = '3'; await click('Weiter'); } await wait(100); await clickCard('KI-Bär'); await wait(150); if(d.querySelector('#askN')){ d.querySelector('#askN').value = '3'; await click('Weiter'); } await wait(200); await pr; await drain();
    const b = ev('BOT.bf.find(c => c.n === "KI-Bär")'); check(b && b.tap && b.stun === 3, `Chandra −X: KI-Bär getappt mit 3 Betäubungsmarken (${b && b.tap}, ${b && b.stun})`); }
  // Buster Sword: Karte ziehen, dann gratis einen Zauber mit Manawert ≤ Schaden
  await reset(); { const bs = C('Buster Sword'), cr = N('Träger', 'Creature — Human', '', {pw:2, tg:2}); bs.eq = cr.u; put(cr, bs);
    S().hand.push(N('Klein', 'Sorcery', 'Draw a card.', {cmc:2, mc:'{1}{U}'}), N('Gross', 'Sorcery', 'Draw a card.', {cmc:6, mc:'{5}{U}'}));
    const pr = run(bs, /draw a card, then you may cast/, {much:5, ev:{kind:'combatDamage', c:cr, pid:'bot', much:5}}); await wait(200);
    const shown = cardsShown(); await click('Keinen'); await wait(100); await pr; await drain();
    check(shown.some(t => t.includes('Klein')) && !shown.some(t => t.includes('Gross')) && S().hand.length === 3, `Buster Sword: zieht 1, bietet nur Manawert ≤ 5 an (${shown.length} angeboten, Hand ${S().hand.length})`); }
  // Bringer of the Last Gift: alle anderen Kreaturen opfern, frühere Friedhofskreaturen zurück
  await reset(); { const bg = C('Bringer of the Last Gift', {pw:6, tg:6}); bg.wasCast = true; const mine = N('Meins', 'Creature — Bear', '', {pw:2, tg:2}), old = N('Alt', 'Creature — Zombie', '', {pw:3, tg:3}); put(bg, mine); S().gy.push(old);
    opp('KI-Bär'); w.__g = N('KI-Alt', 'Creature — Ghoul', '', {pw:1, tg:1}); ev('BOT.gy.push(window.__g); botChanged()');
    await run(bg, /each player sacrifices all other creatures/); await wait(150); await drain();
    check(S().bf.includes(bg) && S().gy.includes(mine) && S().bf.includes(old), `Bringer: meine Kreatur geopfert, alte zurück (${S().bf.map(c => c.n).join()})`);
    check(ev('BOT.bf.map(c => c.n).join()') === 'KI-Alt' && ev('BOT.gy.some(c => c.n === "KI-Bär")'), `Bringer: KI opfert und holt ihre alte Kreatur zurück (${ev('BOT.bf.map(c => c.n).join()')})`); }
  await reset(); { const bg = C('Bringer of the Last Gift', {pw:6, tg:6}); const mine = N('Meins', 'Creature — Bear', '', {pw:2, tg:2}); put(bg, mine);
    await run(bg, /each player sacrifices all other creatures/); await wait(100); await drain(); check(S().bf.includes(mine), 'Bringer: nicht gewirkt → nichts geschieht'); }
  // Call Damage Control: zwei Karten verschiedener Modi aus dem Friedhof
  await reset(); { const a = N('Ring', 'Artifact'), b = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}), c2 = N('Bär2', 'Creature — Bear', '', {pw:2, tg:2}), sp = N('Spruch', 'Instant'); S().gy.push(a, b, c2, sp);
    const cd = C('Call Damage Control'); let pr = ev('abilSpellResolve')(cd); await wait(150); const shown = cardsShown(); await clickCard('Ring'); await clickCard('Bär'); await click('Fertig'); await wait(150); await pr; await drain();
    check(!shown.some(t => t.includes('Spruch')) && S().hand.length === 2 && S().hand.includes(a) && S().hand.includes(b), `Call Damage Control: Artefakt und Kreatur auf die Hand, kein Spontanzauber angeboten (${S().hand.map(c => c.n).join()})`);
    await reset(); const b1 = N('BärA', 'Creature — Bear', '', {pw:2, tg:2}), b2 = N('BärB', 'Creature — Bear', '', {pw:2, tg:2}); S().gy.push(b1, b2);
    pr = ev('abilSpellResolve')(C('Call Damage Control')); await wait(150); await clickCard('BärA'); await clickCard('BärB'); await click('Fertig'); await wait(150); await pr; await drain();
    check(S().hand.length === 1, `Call Damage Control: zwei Kreaturen → nur eine (gleicher Modus) (${S().hand.map(c => c.n).join()})`); }
  // Call the Spirit Dragons: pro Farbe eine Marke auf einen Drachen dieser Farbe; fünf Drachen → Sieg
  await reset(); { const sd = C('Call the Spirit Dragons'); put(sd); const ds = ['W', 'U', 'B', 'R', 'G'].map(k => N('Drache' + k, 'Creature — Dragon', '', {pw:4, tg:4, mc:`{3}{${k}}`})); put(...ds);
    await run(sd, /for each color/); await wait(100); const won = /gewinnt das Spiel/.test(logT()) || /gewinnst/.test(d.body.textContent); await drain();
    check(ds.every(x => x.c === 1) && won, `Spirit Dragons: fünf Drachen je +1, Sieg (${ds.map(x => x.c || 0).join()}, ${won})`); }
  await reset(); { const sd = C('Call the Spirit Dragons'); put(sd); const dr = N('Bunt', 'Creature — Dragon', '', {pw:4, tg:4, mc:'{W}{U}{B}'}), hu = N('Mensch', 'Creature — Human', '', {pw:2, tg:2, mc:'{R}'}); put(dr, hu);
    await run(sd, /for each color/); await wait(100); await drain();
    check(dr.c === 3 && !(hu.c || 0) && ev('kwHas')(dr, 'indestructible'), `Spirit Dragons: dreifarbiger Drache +3, kein Drache bleibt leer, Drachen unzerstörbar (${dr.c}, ${hu.c || 0})`); }
  // Case of the Crimson Pulse: gelöst erst ohne Handkarten am Endsegment; «Solved —»-Auslöser erst dann
  await reset(); { const cp = C('Case of the Crimson Pulse'); put(cp); const up = ev('parseAbilities')(cp).find(a => /upkeep/.test(a.cond || '')); const upEv = {kind:'phase', phase:'upkeep', mine:true};
    check(up && !ev('trigMatches')(up, cp, upEv), 'Crimson Pulse: ungelöst kein Versorgungs-Auslöser');
    S().hand.push(N('Karte', 'Instant')); await ev('caseSolveCheck()'); await drain(); check(!cp.solved, 'Crimson Pulse: mit Handkarte nicht gelöst');
    S().hand.length = 0; await ev('caseSolveCheck()'); await drain(); check(cp.solved && ev('trigMatches')(up, cp, upEv), 'Crimson Pulse: ohne Handkarten gelöst, Auslöser aktiv');
    ev('moveCard')(cp.u, 'hand'); check(!cp.solved, 'Crimson Pulse: verlässt das Spiel → nicht mehr gelöst');
    S().hand.length = 0; put(cp); ev('remindTriggers')('end', true); await wait(150); await drain(); check(cp.solved, 'Crimson Pulse: Endsegment-Prüfung löst den Fall'); }
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
