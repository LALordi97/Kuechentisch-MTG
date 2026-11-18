// Nacht 17.11.2026: einmalige Komplotte (Archenemy) – Text aus oracle_schemes.json (Scryfall), wie schemeAsSpell ihn zuschneidet
const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const SCH = JSON.parse(fs.readFileSync(require('path').join(__dirname, 'oracle_schemes.json'), 'utf8')).map(([n, type, o]) => ({n, type, o}));
const N = (n, type, o = '', x = {}) => ev('newCard')({n, type, o, img:null, ...x});
const open = () => !$('#modal').hidden;
const click = async t => { const b = [...d.querySelectorAll('#modalBox button')].find(b => b.textContent.trim().startsWith(t)); if(b){ b.click(); await wait(40); } return !!b; };
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()'); ev('LOOK.autoPay = false');
  ev('startBot("Test", "Test", Array(30).fill(0).map(() => ({n:"Island", type:"Basic Land — Island", o:""})))'); ev('injectBot(); commit()'); await wait(30);
  const S = () => ev('S');
  const drain = async () => { for(let i = 0; i < 8 && open(); i++){ if(!(await click('Abbrechen')) && !(await click('Kein')) && !(await click('Nein')) && !(await click('Erledigt')) && !(await click('OK'))) break; await wait(40); } };
  const reset0 = () => ev('S.bf = []; S.hand = []; S.gy = []; S.ex = []; S.library = Array(20).fill(0).map(() => newCard({n:"Swamp", type:"Basic Land — Swamp", o:""})); S.pool = emptyPoolObj(); S.life = 40; S.costLessTurn = null; S.arch = {on:true, deck:[], n:0, last:null}; withBot("bot", () => { BOT.bf = []; BOT.hand = []; BOT.gy = []; BOT.life = 20; botChanged(); }); TURN = {active:me.id, n:20, starter:me.id, phase:2}; commit()');
  const reset = async () => { await wait(80); await drain(); reset0(); await wait(20); };
  const put = (...c) => { S().bf.push(...c); ev('commit()'); };
  const botPut = (id, ...c) => { w.__c = c; ev(`withBot(${JSON.stringify(id)}, () => { BOT.bf.push(...window.__c); botChanged(); })`); };
  const botHand = (id, k) => ev(`withBot(${JSON.stringify(id)}, () => { BOT.hand = Array(${k}).fill(0).map(() => newCard({n:"Island", type:"Basic Land — Island", o:""})); botChanged(); })`);
  const life = id => ev(`BOTS[${JSON.stringify(id)}].life`);
  const scheme = n => { const sc = SCH.find(x => x.n === n); if(!sc) throw new Error('Komplott fehlt: ' + n); return sc; };
  const runScheme = async (n, pick) => {
    w.__sc = scheme(n);
    ev('window.__done = false; (async () => { const card = newCard(schemeAsSpell(window.__sc)); for(const ab of parseAbilities(card).filter(a => a.kind === "spell")) await runAbility(card, ab, {}); commit(); window.__done = true; })()');
    for(let i = 0; i < 60 && !w.__done; i++){ await wait(50); if(pick && open()){ const b = [...d.querySelectorAll('#modalBox button, #modalBox .card, #modalBox .opt')].find(e => e.textContent.includes(pick)); if(b){ b.click(); pick = null; } } }
    await wait(150); await drain();
  };
  const bear = (x = {}) => N('Bär', 'Creature — Bear', '', {pw:2, tg:2, ...x});
  // alle einmaligen Komplotte dieser Nacht werden als automatisch erkannt
  const AUTO = ['Feed the Machine', 'May Civilization Collapse', 'Surrender Your Thoughts', 'The Fate of the Flammable', 'Know Naught but Fire', 'Mortal Flesh Is Weak', 'This World Belongs to Me', 'The Pieces Are Coming Together', 'Plots That Span Centuries', 'All in Good Time', 'Time Bends to My Will', 'My Wealth Will Bury You', 'Evil Comes to Fruition', 'Rot Like the Scum You Are', 'Make Yourself Useful',
    'You Will Know True Suffering', 'I Am Never Alone', 'Only Blood Ends Your Nightmares', 'No One Will Hear Your Cries', 'Your Nightmares Are Delicious', 'My Followers Ascend', 'Rotted Ones, Lay Siege', 'For Each of You, a Gift', 'Embrace My Diabolical Vision', 'Every Hope Shall Vanish', 'Every Dream a Nightmare', 'Your Mistake Is My Triumph', 'I Call on the Ancient Magics'];
  for(const n of AUTO){ w.__sc = scheme(n); const st = ev('cardCheck(schemeAsSpell(window.__sc)).status'); check(st === 'auto', `${n}: automatisch (${st})`); }

  // Ein Gegner: «chooses self or others» – die KI wählt die anderen (es gibt keine)
  await reset(); await runScheme('The Fate of the Flammable');
  check(life('bot') === 20, `Fate of the Flammable (1 Gegner): KI wählt «die anderen», kein Schaden (${life('bot')})`);
  // Know Naught but Fire: Schaden = Handkarten
  await reset(); botHand('bot', 5); await runScheme('Know Naught but Fire'); await wait(100);
  check(life('bot') === 15, `Know Naught but Fire: 5 Handkarten → 5 Schaden (${life('bot')})`);
  // This World Belongs to Me: zwei Karten
  await reset(); await runScheme('This World Belongs to Me');
  check(S().hand.length === 2, `This World Belongs to Me: zieht 2 (${S().hand.length})`);
  // The Pieces Are Coming Together: Artefakte kosten {2} weniger, nur diesen Zug
  await reset(); await runScheme('The Pieces Are Coming Together');
  { const art = N('Golem', 'Artifact Creature — Golem', '', {mc:'{4}', cmc:4}), cr = N('Bär', 'Creature — Bear', '', {mc:'{1}{G}', cmc:2});
    check(S().hand.length === 2 && ev('costMods')(art).less === 2 && ev('costMods')(cr).less === 0, `The Pieces Are Coming Together: Artefakt −2, Kreatur −0 (${ev('costMods')(art).less}/${ev('costMods')(cr).less})`);
    ev('TURN = {...TURN, n:21}'); check(ev('costMods')(art).less === 0, 'The Pieces Are Coming Together: im nächsten Zug vorbei'); }
  // Plots That Span Centuries: nächstes Mal drei Komplotte
  await reset(); await runScheme('Plots That Span Centuries');
  ev('S.arch.deck = [{n:"A1", o:"Draw a card."}, {n:"A2", o:"Draw a card."}, {n:"A3", o:"Draw a card."}, {n:"A4", o:"Draw a card."}]; S.arch.lastKey = null');
  ev('queued(() => schemeMotion())'); for(let i = 0; i < 20; i++){ await wait(60); await click('In Gang setzen'); }
  check(ev('S.arch.n') === 3 && S().hand.length === 3 && !ev('S.arch.triple'), `Plots That Span Centuries: drei Komplotte in Gang gesetzt (${ev('S.arch.n')}, Hand ${S().hand.length})`);
  // All in Good Time: Zusatzzug, darin kein Komplott
  await reset(); await runScheme('All in Good Time');
  check(S().extraTurns === 1 && ev('S.arch.skipNext') === true, 'All in Good Time: Zusatzzug, kein Komplott darin');
  ev('S.arch.deck = [{n:"A1", o:"Draw a card."}]; S.arch.lastKey = null; S.extraTurns = 0'); ev('queued(() => schemeMotion())'); await wait(200); await click('In Gang setzen'); await wait(100);
  check(ev('S.arch.n') === 0 && !ev('S.arch.skipNext'), `All in Good Time: im Zusatzzug kein Komplott (${ev('S.arch.n')})`);
  // Time Bends to My Will: Zusatzzug ohne Enttappen
  await reset(); { const l = N('Swamp', 'Basic Land — Swamp', '', {tap:true}); put(l); l.tap = true; await runScheme('Time Bends to My Will');
    check(S().extraTurns === 1 && S().skipUntapNext === true, 'Time Bends to My Will: Zusatzzug, Enttappen wird übersprungen');
    ev('S.arch.on = false; onMyTurnStart()'); await wait(150); await drain();
    check(l.tap && !S().skipUntapNext, 'Time Bends to My Will: im Zusatzzug bleibt das Land getappt');
    ev('onMyTurnStart()'); await wait(150); await drain(); check(!l.tap, 'Time Bends to My Will: danach wird wieder enttappt'); }
  // My Wealth Will Bury You: mindestens vier Treasure
  await reset(); botPut('bot', N('Ring', 'Artifact', ''), N('Aura', 'Enchantment', '')); await runScheme('My Wealth Will Bury You');
  check(S().bf.filter(c => /Treasure/.test(c.n)).length === 4, `My Wealth Will Bury You: 2 Artefakte/Verzauberungen → 4 Treasure (${S().bf.filter(c => /Treasure/.test(c.n)).length})`);
  await reset(); botPut('bot', ...Array(6).fill(0).map(() => N('Ring', 'Artifact', ''))); await runScheme('My Wealth Will Bury You');
  check(S().bf.filter(c => /Treasure/.test(c.n)).length === 6, `My Wealth Will Bury You: 6 Artefakte → 6 Treasure (${S().bf.filter(c => /Treasure/.test(c.n)).length})`);
  // Evil Comes to Fruition
  await reset(); await runScheme('Evil Comes to Fruition');
  check(S().bf.filter(c => c.tok && /Plant/.test(c.n + c.type)).length === 7 && ev('S.bf.filter(c => c.tok).every(c => power(c) === 0 && tough(c) === 1)'), `Evil Comes to Fruition: sieben 0/1 Pflanzen (${S().bf.map(c => c.n).join(', ')})`);
  await reset(); put(...Array(10).fill(0).map(() => N('Swamp', 'Basic Land — Swamp', ''))); await runScheme('Evil Comes to Fruition');
  check(S().bf.filter(c => c.tok && /Elemental/.test(c.n + c.type)).length === 7 && !S().bf.some(c => c.tok && /Plant/.test(c.n + c.type)), 'Evil Comes to Fruition: mit zehn Ländern sieben 3/3 Elementare statt Pflanzen');
  // Rot Like the Scum You Are: Ooze mit Marken = Länder der Gegner
  await reset(); botPut('bot', ...Array(3).fill(0).map(() => N('Island', 'Basic Land — Island', ''))); await runScheme('Rot Like the Scum You Are');
  { const oz = S().bf.find(c => c.tok && /Ooze/.test(c.n + c.type)); check(oz && oz.c === 3 && ev('power')(oz) === 5, `Rot Like the Scum You Are: 2/2 Ooze mit 3 Marken (${oz && oz.c})`); }
  // Make Yourself Useful: zerstören, Leben = Widerstand
  await reset(); { const b = bear({pw:3, tg:4}); botPut('bot', b); await runScheme('Make Yourself Useful', 'Bär');
    check(ev('BOTS.bot.gy.some(c => c.n === "Bär")') && S().life === 44, `Make Yourself Useful: Kreatur zerstört, +4 Leben (${S().life})`); }

  // You Will Know True Suffering: Schaden = Manawert des Commanders an Nicht-Commander-Kreaturen
  await reset(); ev('S.cz = [newCard({n:"Chef", type:"Legendary Creature — Human", o:"", mc:"{2}{B}", cmc:3, pw:3, tg:3})]; commit()');
  botPut('bot', bear(), bear({n:'Gross', tg:5}), bear({n:'Boss', cmdr:true})); await runScheme('You Will Know True Suffering'); await wait(150);
  check(ev('BOTS.bot.gy.map(c => c.n).join()') === 'Bär' && ev('BOTS.bot.bf.length') === 2, `You Will Know True Suffering: 3 Schaden töten nur den Bären (Friedhof: ${ev('BOTS.bot.gy.map(c => c.n).join()')})`);
  // I Am Never Alone
  await reset(); ev('S.cz = [newCard({n:"Chef", type:"Legendary Creature — Human", o:"", mc:"{2}{B}", cmc:3, pw:3, tg:3})]; commit()'); await runScheme('I Am Never Alone');
  { const tk = S().bf.find(c => c.n === 'Chef'); check(tk && tk.tok && !/Legendary/.test(tk.type) && ev('power')(tk) === 3, `I Am Never Alone: nicht legendäre Token-Kopie des Commanders (${tk && tk.type})`); }
  // Only Blood Ends Your Nightmares
  await reset(); botHand('bot', 3); await runScheme('Only Blood Ends Your Nightmares'); await wait(150);
  check(ev('BOTS.bot.hand.length') === 1, `Only Blood Ends Your Nightmares: ohne Kreatur zwei Karten abwerfen (Hand ${ev('BOTS.bot.hand.length')})`);
  await reset(); botHand('bot', 3); botPut('bot', bear()); await runScheme('Only Blood Ends Your Nightmares'); await wait(150);
  check(ev('BOTS.bot.hand.length') === 3 && ev('BOTS.bot.bf.length') === 0, 'Only Blood Ends Your Nightmares: Kreatur geopfert, kein Abwerfen');
  // No One Will Hear Your Cries
  await reset(); botPut('bot', bear({pw:1}), bear({n:'Stark', pw:4}), bear({pw:2}), N('Island', 'Basic Land — Island', '')); await runScheme('No One Will Hear Your Cries'); await wait(150);
  check(ev('BOTS.bot.bf.map(c => c.n).sort().join()') === 'Island,Stark', `No One Will Hear Your Cries: eine Kreatur bleibt (${ev('BOTS.bot.bf.map(c => c.n).join()')})`);
  // Your Nightmares Are Delicious
  await reset(); botHand('bot', 8); await runScheme('Your Nightmares Are Delicious'); await wait(150);
  check(ev('BOTS.bot.hand.length') === 5 && S().hand.length === 0, `Your Nightmares Are Delicious: 8 → 5 Handkarten, drei abgeworfen, ich ziehe nicht (${ev('BOTS.bot.hand.length')}/${S().hand.length})`);
  await reset(); botHand('bot', 6); await runScheme('Your Nightmares Are Delicious'); await wait(150);
  check(ev('BOTS.bot.hand.length') === 5 && S().hand.length === 3, `Your Nightmares Are Delicious: nur eine abgeworfen → ich ziehe drei (${S().hand.length})`);
  // My Followers Ascend
  await reset(); await runScheme('My Followers Ascend');
  { const sc = S().bf.find(c => c.tok && /Scarecrow/.test(c.n + c.type)); check(sc && ev('power')(sc) === 4 && ev('kwHas')(sc, 'vigilance'), 'My Followers Ascend: ohne Kreatur eine 4/4 Vogelscheuche mit Wachsamkeit'); }
  await reset(); { const b = bear(); put(b); await runScheme('My Followers Ascend');
    check(b.c === 5 && ev('kwHas')(b, 'flying') && ev('kwHas')(b, 'vigilance') && ev('power')(b) === 7, `My Followers Ascend: fünf Marken, Flugfähigkeit und Wachsamkeit (${b.c})`); }
  // Rotted Ones, Lay Siege
  await reset(); await runScheme('Rotted Ones, Lay Siege');
  { const z = S().bf.filter(c => c.tok && /Zombie/.test(c.n + c.type)); check(z.length === 1 && /attacks KI each combat if able/.test(z[0].o), `Rotted Ones, Lay Siege: ein Zombie pro Gegner, greift diesen an (${z.length})`); }
  // Embrace My Diabolical Vision
  await reset(); ev('S.hand = [newCard({n:"A", type:"Instant", o:""}), newCard({n:"B", type:"Instant", o:""})]; S.gy = [newCard({n:"C", type:"Instant", o:""})]; commit()'); botHand('bot', 2); ev('withBot("bot", () => { BOT.library = Array(10).fill(0).map(() => newCard({n:"Island", type:"Basic Land — Island", o:""})); BOT.gy = [newCard({n:"G", type:"Instant", o:""})]; botChanged(); })');
  await runScheme('Embrace My Diabolical Vision'); await wait(150);
  check(S().hand.length === 7 && !S().gy.length && S().library.length === 16, `Embrace My Diabolical Vision: ich ziehe sieben (Hand ${S().hand.length}, Bibliothek ${S().library.length})`);
  check(ev('BOTS.bot.hand.length') === 4 && ev('BOTS.bot.gy.length') === 0 && ev('BOTS.bot.library.length') === 9, `Embrace My Diabolical Vision: KI mischt alles ein und zieht vier (${ev('BOTS.bot.hand.length')}/${ev('BOTS.bot.library.length')})`);
  // Every Hope Shall Vanish
  await reset(); ev('withBot("bot", () => { BOT.hand = [newCard({n:"Island", type:"Basic Land — Island", o:""}), newCard({n:"Zauberbär", type:"Creature — Bear", o:"", mc:"{1}{G}", cmc:2})]; botChanged(); })');
  await runScheme('Every Hope Shall Vanish', 'Zauberbär'); await wait(150);
  check(ev('BOTS.bot.gy.map(c => c.n).join()') === 'Zauberbär' && ev('BOTS.bot.hand.length') === 1, `Every Hope Shall Vanish: gewählte Nichtland-Karte abgeworfen (${ev('BOTS.bot.gy.map(c => c.n).join()')})`);
  // Every Dream a Nightmare
  await reset(); botHand('bot', 2); await runScheme('Every Dream a Nightmare'); await wait(150);
  check(ev('BOTS.bot.hand.length') === 1 && S().hand.length === 1, `Every Dream a Nightmare: Land abgeworfen → ich ziehe eine (${S().hand.length})`);
  await reset(); ev('withBot("bot", () => { BOT.hand = [newCard({n:"Zauberbär", type:"Creature — Bear", o:"", mc:"{1}{G}", cmc:2})]; botChanged(); })'); await runScheme('Every Dream a Nightmare'); await wait(150);
  check(ev('BOTS.bot.hand.length') === 0 && S().hand.length === 0, 'Every Dream a Nightmare: kein Land → kein Ziehen');

  // Your Mistake Is My Triumph: bleibende Karte aus einem gemahlenen Stapel
  await reset(); ev('withBot("bot", () => { BOT.library = [newCard({n:"Zauberbär", type:"Creature — Bear", o:"", mc:"{1}{G}", cmc:2, pw:2, tg:2}), newCard({n:"Blitz", type:"Instant", o:""}), newCard({n:"Island", type:"Basic Land — Island", o:""}), newCard({n:"Island", type:"Basic Land — Island", o:""})]; botChanged(); })');
  await runScheme('Your Mistake Is My Triumph', 'Zauberbär'); await wait(200); await click('Fertig'); await wait(150);
  check(S().gy.length === 3 && ev('BOTS.bot.gy.length') === 2 && S().bf.some(c => c.n === 'Zauberbär') && ev('BOTS.bot.library.length') === 1, `Your Mistake Is My Triumph: alle mahlen drei, Zauberbär der KI kommt zu mir (${S().bf.map(c => c.n).join(', ')} | KI-Friedhof ${ev('BOTS.bot.gy.map(c => c.n).join()')})`);
  // I Call on the Ancient Magics
  await reset(); ev('withBot("bot", () => { BOT.library = [...Array(5).fill(0).map(() => newCard({n:"Island", type:"Basic Land — Island", o:""})), newCard({n:"Riese", type:"Creature — Giant", o:"", mc:"{5}{R}", cmc:6, pw:6, tg:6})]; BOT.hand = []; botChanged(); })');
  ev('S.library.push(newCard({n:"Ziel A", type:"Sorcery", o:""}), newCard({n:"Ziel B", type:"Instant", o:""})); commit()');
  w.__sc = scheme('I Call on the Ancient Magics'); ev('window.__done = false; (async () => { const card = newCard(schemeAsSpell(window.__sc)); for(const ab of parseAbilities(card).filter(a => a.kind === "spell")) await runAbility(card, ab, {}); commit(); window.__done = true; })()');
  for(let i = 0; i < 20 && !open(); i++) await wait(50);
  for(const n of ['Ziel A', 'Ziel B']){ const el = [...d.querySelectorAll('#modalBox .card')].find(e => e.textContent.includes(n)); if(el) el.click(); await wait(40); }
  await click('Fertig'); for(let i = 0; i < 40 && !w.__done; i++) await wait(50); await drain();
  check(ev('BOTS.bot.hand.map(c => c.n).join()') === 'Riese', `I Call on the Ancient Magics: KI sucht eine Karte auf die Hand (${ev('BOTS.bot.hand.map(c => c.n).join()')})`);
  check(S().hand.map(c => c.n).sort().join() === 'Ziel A,Ziel B' && S().library.length === 20, `I Call on the Ancient Magics: ich suche zwei Karten (${S().hand.map(c => c.n).join(', ')})`);

  // Zweiter KI-Gegner
  ev('startBot("Zwei", "Test", Array(30).fill(0).map(() => ({n:"Island", type:"Basic Land — Island", o:""})), "bot2"); useBot("bot"); injectBot(); commit()'); await wait(50);
  const reset2 = async () => { await reset(); ev('withBot("bot2", () => { BOT.bf = []; BOT.hand = []; BOT.gy = []; BOT.life = 20; botChanged(); }); commit()'); await wait(20); };
  check(ev('liveOpps().length') === 2, 'zwei KI-Gegner');
  // Fate of the Flammable: KI mit viel Leben nimmt 6 selbst
  await reset2(); ev('BOTS.bot.life = 30; withBot("bot", botChanged)'); await runScheme('The Fate of the Flammable', 'Test');
  check(life('bot') === 24 && life('bot2') === 20, `Fate of the Flammable: Gegner wählt sich selbst → 6 Schaden (${life('bot')}/${life('bot2')})`);
  await reset2(); ev('BOTS.bot.life = 12; withBot("bot", botChanged)'); await runScheme('The Fate of the Flammable', 'Test');
  check(life('bot') === 12 && life('bot2') === 17, `Fate of the Flammable: wenig Leben → die anderen nehmen 3 (${life('bot')}/${life('bot2')})`);
  // Feed the Machine: KI hat Kreaturen → die anderen opfern je eine
  await reset2(); botPut('bot', bear(), bear()); botPut('bot2', bear(), bear()); await runScheme('Feed the Machine', 'Test'); await wait(200);
  check(ev('BOTS.bot.bf.length') === 2 && ev('BOTS.bot2.bf.length') === 1, `Feed the Machine: «die anderen» – zweite KI opfert eine Kreatur (${ev('BOTS.bot.bf.length')}/${ev('BOTS.bot2.bf.length')})`);
  // May Civilization Collapse: KI ohne Länder wählt sich selbst (opfert nichts)
  await reset2(); botPut('bot2', N('Island', 'Basic Land — Island', '')); await runScheme('May Civilization Collapse', 'Test'); await wait(200);
  check(ev('BOTS.bot2.bf.length') === 1, `May Civilization Collapse: Gegner ohne Länder wählt sich selbst, die anderen behalten ihre Länder (${ev('BOTS.bot2.bf.length')})`);
  // Surrender Your Thoughts: KI mit 1 Handkarte wählt sich selbst → wirft ab
  await reset2(); botHand('bot', 1); botHand('bot2', 3); await runScheme('Surrender Your Thoughts', 'Test'); await wait(200);
  check(ev('BOTS.bot.hand.length') === 0 && ev('BOTS.bot2.hand.length') === 3, `Surrender Your Thoughts: «selbst» – nur der Gewählte wirft ab (${ev('BOTS.bot.hand.length')}/${ev('BOTS.bot2.hand.length')})`);
  // Mortal Flesh Is Weak
  await reset2(); ev('BOTS.bot.life = 18; BOTS.bot2.life = 7; withBot("bot", botChanged); withBot("bot2", botChanged)'); await runScheme('Mortal Flesh Is Weak'); await wait(150);
  check(life('bot') === 7 && life('bot2') === 7, `Mortal Flesh Is Weak: alle Gegner auf das tiefste Leben (${life('bot')}/${life('bot2')})`);

  // For Each of You, a Gift: ein Horror pro Gegner
  await reset2(); await runScheme('For Each of You, a Gift');
  { const h = S().bf.filter(c => c.tok && /Horror/.test(c.n + c.type)); check(h.length === 2 && h.some(c => /attacks KI each/.test(c.o)) && h.some(c => /attacks KI 2 /.test(c.o)), `For Each of You, a Gift: je ein Horror pro Gegner (${h.length})`); }
  // Menschlicher Mitspieler wählt «self or others» im Dialog
  { let got = null; const old = w.sendTo; w.eval('window.__oldSend = sendTo; sendTo = (to, m) => { if(m && m.t === "resp") window.__resp = m.data; else window.__oldSend(to, m); }');
    ev('receiveReq({from:"x", by:"Anna", id:"r1", req:{kind:"selfOthers", self:"that player sacrifices two creatures of their choice", others:"each of your other opponents sacrifices a creature of their choice", src:"Feed the Machine"}})'); await wait(120);
    check(open() && /Ich selbst/.test($('#modalBox').textContent), 'Mitspieler: Dialog «Ich selbst / Die anderen Gegner»');
    await click('Die anderen'); await wait(80); got = w.__resp; ev('sendTo = window.__oldSend');
    check(got && got.choice === 'others', `Mitspieler: Antwort «others» (${JSON.stringify(got)})`); }
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
