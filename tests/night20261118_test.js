// Nacht 18.11.2026: weitere einmalige Komplotte (Archenemy) – Text aus oracle_schemes.json (Scryfall), wie schemeAsSpell ihn zuschneidet
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
const setNum = async v => { const i = d.querySelector('#askN'); if(!i) return false; i.value = String(v); return click('Weiter'); };
const clickCard = async t => { const el = [...d.querySelectorAll('#modalBox .card')].find(e => e.textContent.includes(t)); if(el){ el.click(); await wait(40); } return !!el; };
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()'); ev('LOOK.autoPay = false');
  ev('startBot("Test", "Test", Array(30).fill(0).map(() => ({n:"Island", type:"Basic Land — Island", o:""})))'); ev('injectBot(); commit()'); await wait(30);
  const S = () => ev('S');
  const drain = async () => { for(let i = 0; i < 8 && open(); i++){ if(!(await click('Abbrechen')) && !(await click('Kein')) && !(await click('Nein')) && !(await click('Erledigt')) && !(await click('OK'))) break; await wait(40); } };
  const reset0 = () => ev('S.bf = []; S.hand = []; S.gy = []; S.ex = []; S.emblems = []; S.library = Array(20).fill(0).map(() => newCard({n:"Swamp", type:"Basic Land — Swamp", o:""})); S.pool = emptyPoolObj(); S.life = 40; S.arch = {on:true, deck:[], n:0, last:null}; withBot("bot", () => { BOT.bf = []; BOT.hand = []; BOT.gy = []; BOT.ex = []; BOT.life = 20; BOT.library = Array(20).fill(0).map(() => newCard({n:"Island", type:"Basic Land — Island", o:""})); botChanged(); }); TURN = {active:me.id, n:20, starter:me.id, phase:2}; commit()');
  const reset = async () => { await wait(80); await drain(); reset0(); await wait(20); };
  const botSet = (zone, list) => { w.__c = list; ev(`withBot("bot", () => { BOT.${zone} = window.__c; botChanged(); }); commit()`); };
  const life = id => ev(`BOTS[${JSON.stringify(id)}].life`);
  const scheme = n => { const sc = SCH.find(x => x.n === n); if(!sc) throw new Error('Komplott fehlt: ' + n); return sc; };
  // steps: Liste von Aktionen, je eine pro offenem Dialog: "b:Text" Knopf, "c:Name" Karte, "n:5" Zahl, "f" Fertig, Funktion
  const runScheme = async (n, steps = []) => {
    w.__sc = scheme(n); steps = steps.slice();
    ev('window.__done = false; (async () => { const card = newCard(schemeAsSpell(window.__sc)); for(const ab of parseAbilities(card).filter(a => a.kind === "spell")) await runAbility(card, ab, {}); commit(); window.__done = true; })()');
    for(let i = 0; i < 80 && !w.__done; i++){ await wait(50);
      if(open() && steps.length){ const s = steps.shift();
        if(typeof s === 'function') await s(); else if(s.startsWith('b:')) await click(s.slice(2)); else if(s.startsWith('c:')) await clickCard(s.slice(2)); else if(s.startsWith('n:')) await setNum(+s.slice(2)); else if(s === 'f') await click('Fertig');
        await wait(60); } }
    await wait(150); await drain();
  };
  const cr = (n, cmc, x = {}) => N(n, 'Creature — Bear', '', {pw:2, tg:2, cmc, mc:`{${cmc}}`, ...x});
  const AUTO = ['A Premonition of Your Demise', 'Running Is Useless', 'Every Last Vestige Shall Rot', 'No Secret Is Hidden from Me', 'When Will You Learn?', 'My Wish Is Your Command', 'Your Plans Mean Nothing', 'Choose Your Demise', 'The Dead Shall Serve', 'My Wings Enfold All',
    'Dance, Pathetic Marionette', 'Chaos Is My Plaything', 'My Will Is Irresistible', 'Only I Know What Awaits', 'Your Own Face Mocks You', 'You Live Only Because I Will It', 'Know Evil', 'Choose Your Champion', 'You Exist Only to Amuse', 'Nature Demands an Offering'];
  for(const n of AUTO){ w.__sc = scheme(n); const st = ev('cardCheck(schemeAsSpell(window.__sc)).status'); check(st === 'auto', `${n}: automatisch (${st})`); }

  // A Premonition of Your Demise: zwei auf die Hand, Schaden = Manawert der Nichtlandkarten
  await reset(); ev('S.library.unshift(newCard({n:"Riese", type:"Creature — Giant", o:"", cmc:5, mc:"{4}{R}", pw:5, tg:5}), newCard({n:"Mountain", type:"Basic Land — Mountain", o:""}))');
  await runScheme('A Premonition of Your Demise', ['b:KI']);
  check(S().hand.length === 2 && life('bot') === 15, `Premonition: 2 auf die Hand, 5 Schaden an die KI (${S().hand.length}, ${life('bot')})`);
  await reset(); await runScheme('A Premonition of Your Demise', ['b:KI']);
  check(S().hand.length === 2 && life('bot') === 20, `Premonition: nur Länder → kein Schaden (${life('bot')})`);

  // Running Is Useless: je Manawert höchstens eine
  await reset(); S().bf.push(cr('Mein Bär', 2)); ev('commit()'); botSet('bf', [cr('KI-Bär', 2), cr('KI-Oger', 3)]);
  await runScheme('Running Is Useless', [async () => { await clickCard('Mein Bär'); await clickCard('KI-Bär'); await clickCard('KI-Oger'); await click('Fertig'); }]); await wait(100);
  check(S().bf.length === 0 && ev('BOTS.bot.bf.map(c => c.n).join()') === 'KI-Bär', `Running Is Useless: Mein Bär (MW 2) und KI-Oger (MW 3) zerstört, zweiter MW-2 entfällt (${ev('BOTS.bot.bf.map(c => c.n).join()')})`);

  // Every Last Vestige Shall Rot: X = 2
  await reset(); botSet('bf', [N('Ring', 'Artifact', '', {cmc:1, mc:'{1}'}), cr('Drache', 5), N('Island', 'Basic Land — Island', ''), cr('Bär', 2)]);
  await runScheme('Every Last Vestige Shall Rot', ['b:KI', 'b:Ja', 'n:2']); await wait(100);
  check(ev('BOTS.bot.bf.map(c => c.n).sort().join()') === 'Drache,Island' && ev('BOTS.bot.library.slice(-2).map(c => c.n).sort().join()') === 'Bär,Ring', `Every Last Vestige: Ring und Bär unter die Bibliothek (${ev('BOTS.bot.bf.map(c => c.n).join()')})`);
  await reset(); botSet('bf', [cr('Bär', 2)]); await runScheme('Every Last Vestige Shall Rot', ['b:KI', 'b:Nein']);
  check(ev('BOTS.bot.bf.length') === 1, 'Every Last Vestige: nicht bezahlt → nichts');

  // No Secret Is Hidden from Me: bis zur Nichtlandkarte, gratis wirken, mit sechs Ländern zweimal
  await reset(); ev('S.library.splice(1, 0, newCard({n:"Zauber A", type:"Sorcery", o:"Draw a card.", cmc:3, mc:"{2}{U}"})); S.library.splice(4, 0, newCard({n:"Zauber B", type:"Sorcery", o:"Draw a card.", cmc:3, mc:"{2}{U}"}))');
  await runScheme('No Secret Is Hidden from Me', ['b:Ja']);
  check(S().gy.some(c => c.n === 'Zauber A') && S().hand.length === 1 && !S().gy.some(c => c.n === 'Zauber B'), `No Secret: Zauber A gratis gewirkt, ohne sechs Länder keine Wiederholung (Hand ${S().hand.length})`);
  await reset(); ev('for(let i = 0; i < 6; i++) S.bf.push(newCard({n:"Swamp", type:"Basic Land — Swamp", o:""})); S.library.splice(1, 0, newCard({n:"Zauber A", type:"Sorcery", o:"Draw a card.", cmc:3, mc:"{2}{U}"})); S.library.splice(4, 0, newCard({n:"Zauber B", type:"Sorcery", o:"Draw a card.", cmc:3, mc:"{2}{U}"})); commit()');
  await runScheme('No Secret Is Hidden from Me', ['b:Ja', 'b:Ja']);
  check(S().gy.some(c => c.n === 'Zauber A') && S().gy.some(c => c.n === 'Zauber B') && S().hand.length === 2, `No Secret: mit sechs Ländern zweimal (Hand ${S().hand.length})`);

  // When Will You Learn?: oberste Karte der KI verbannen und gratis wirken
  await reset(); ev('withBot("bot", () => { BOT.library.unshift(newCard({n:"Gedankenblitz", type:"Instant", o:"Draw three cards.", cmc:3, mc:"{2}{U}"})); botChanged(); })');
  await runScheme('When Will You Learn?', [async () => { await clickCard('Gedankenblitz'); await click('Fertig'); }]);
  check(S().hand.length === 3 && ev('BOTS.bot.library.length') === 20, `When Will You Learn?: KI-Karte verbannt, gratis gewirkt (Hand ${S().hand.length})`);

  // My Wish Is Your Command: Nichtkreatur-Nichtland aus der Hand der KI gratis wirken
  await reset(); botSet('hand', [cr('Elf', 1), N('Island', 'Basic Land — Island', ''), N('Weisheit', 'Sorcery', 'Draw two cards.', {cmc:2, mc:'{1}{U}'})]);
  await runScheme('My Wish Is Your Command', ['c:Weisheit']);
  check(S().hand.length === 2 && ev('BOTS.bot.hand.map(c => c.n).sort().join()') === 'Elf,Island', `My Wish Is Your Command: Weisheit aus der KI-Hand gewirkt (Hand ${S().hand.length}, KI ${ev('BOTS.bot.hand.map(c => c.n).join()')})`);

  // Your Plans Mean Nothing: ich und die KI werfen ab; KI zieht 2 (3−1), ich ziehe sieben
  await reset(); ev('S.hand = [newCard({n:"A", type:"Instant", o:""})]'); botSet('hand', [cr('E1', 1), cr('E2', 1), cr('E3', 1)]);
  await runScheme('Your Plans Mean Nothing', [async () => { await click('Du'); await click('KI'); await click('Weiter'); }]); await wait(100);
  check(S().hand.length === 7 && S().gy.length === 1 && ev('BOTS.bot.hand.length') === 2 && ev('BOTS.bot.gy.length') === 3, `Your Plans Mean Nothing: ich 7, KI 3 ab und 2 gezogen (${S().hand.length}/${ev('BOTS.bot.hand.length')})`);
  await reset(); botSet('hand', [cr('E1', 1), cr('E2', 1)]);
  await runScheme('Your Plans Mean Nothing', [async () => { await click('KI'); await click('Weiter'); }]); await wait(100);
  check(S().hand.length === 0 && ev('BOTS.bot.hand.length') === 1, `Your Plans Mean Nothing: nur die KI → sie zieht 1, ich nichts (${S().hand.length}/${ev('BOTS.bot.hand.length')})`);

  // Choose Your Demise: KI gibt den schwächeren Stapel
  await reset(); ev('S.library.unshift(newCard({n:"Bombe", type:"Creature — Dragon", o:"", cmc:7, mc:"{7}", pw:7, tg:7}))');
  await runScheme('Choose Your Demise', [async () => { await clickCard('Swamp'); await click('Fertig'); }]);
  { const h = S().hand.map(c => c.n); check(S().hand.length >= 1 && S().library.length === 20 && !h.includes('Bombe'), `Choose Your Demise: KI gibt nicht die Bombe (Hand ${h.join(', ')}, Bibliothek ${S().library.length})`); }
  // Mitspieler wählt den Stapel im Dialog
  { w.eval('window.__oldSend = sendTo; sendTo = (to, m) => { if(m && m.t === "resp") window.__resp = m.data; else window.__oldSend(to, m); }');
    ev('receiveReq({from:"x", by:"Anna", id:"r2", req:{kind:"pickPile", up:[{u:"q1", n:"Bombe", type:"Creature", cmc:7}], downN:3, src:"Choose Your Demise"}})'); await wait(120);
    check(open() && /Verdeckter Stapel \(3\)/.test($('#modalBox').textContent), 'Choose Your Demise: Mitspieler sieht beide Stapel');
    await click('Verdeckter'); await wait(80); check(w.__resp && w.__resp.pile === 'down', `Choose Your Demise: Antwort «down» (${JSON.stringify(w.__resp)})`); ev('sendTo = window.__oldSend'); }

  // The Dead Shall Serve: Kreatur aus dem KI-Friedhof, greift ihren Besitzer an
  await reset(); botSet('gy', [cr('Zombie', 2), N('Blitz', 'Instant', '')]);
  await runScheme('The Dead Shall Serve', ['c:Zombie']); await wait(100);
  { const z = S().bf.find(c => c.n === 'Zombie'); check(z && /attacks KI each combat if able/.test(z.o) && ev('BOTS.bot.gy.length') === 1, `The Dead Shall Serve: Zombie unter meiner Kontrolle, greift KI an (${z && z.o})`); }

  // My Wings Enfold All: Modus 2 – Spontanzauber/Hexereien werden bis Zugende kopiert
  await reset(); w.__sc = scheme('My Wings Enfold All');
  ev('window.__done = false; (async () => { const card = newCard(schemeAsSpell(window.__sc)); window.__card = card; window.__abs = parseAbilities(card).filter(a => a.kind === "spell"); window.__done = true; })()'); await wait(50);
  ev('window.__done = false; (async () => { await runSteps([{t:"wingsCopy"}], window.__card, {}); window.__done = true; })()'); await wait(100);
  check(ev('S.emblems.length') === 1 && ev('cardCheck(S.emblems[0]).status') === 'auto', `My Wings Enfold All: Emblem bis Zugende (${ev('S.emblems.length')})`);
  ev('S.hand.push(newCard({n:"Grübeln", type:"Instant", o:"Draw a card.", cmc:1, mc:"{U}"})); commit()'); await wait(30);
  ev('castSpell(S.hand[0].u)'); for(let i = 0; i < 30; i++){ await wait(60); if(open()){ if(!(await click('OK')) && !(await click('Ja'))) await click('Bezahlen'); } }
  check(S().hand.length === 2, `My Wings Enfold All: Grübeln kopiert → zwei Karten (${S().hand.length})`);
  ev('TURN = {...TURN, n:21}; abilEvent({kind:"upkeep"})'); check(ev('S.emblems.length') === 0, 'My Wings Enfold All: im nächsten Zug vorbei');

  // Dance, Pathetic Marionette: KI deckt bis zur Kreatur auf, die kommt zu mir, der Rest in den Friedhof
  await reset(); ev('withBot("bot", () => { BOT.library.splice(2, 0, newCard({n:"Golem", type:"Artifact Creature — Golem", o:"", cmc:4, mc:"{4}", pw:4, tg:4})); botChanged(); })');
  await runScheme('Dance, Pathetic Marionette'); await wait(100);
  check(S().bf.some(c => c.n === 'Golem') && ev('BOTS.bot.gy.length') === 2 && ev('BOTS.bot.library.length') === 18, `Dance, Pathetic Marionette: Golem unter meiner Kontrolle, 2 Inseln im KI-Friedhof (${ev('BOTS.bot.gy.length')})`);

  // Chaos Is My Plaything: eine KI-Karte verbannen, dann jeder bis zur bleibenden Karte
  await reset(); botSet('bf', [cr('Opfer', 3)]); ev('S.library.unshift(newCard({n:"Blitz", type:"Instant", o:"", cmc:1, mc:"{R}"}), newCard({n:"Ork", type:"Creature — Orc", o:"", cmc:2, mc:"{1}{R}", pw:2, tg:2}))');
  ev('withBot("bot", () => { BOT.library.unshift(newCard({n:"Schock", type:"Instant", o:"", cmc:1, mc:"{R}"})); botChanged(); })');
  await runScheme('Chaos Is My Plaything', ['c:Opfer']); await wait(100);
  check(ev('BOTS.bot.bf.map(c => c.n).join()') === 'Island' && ev('BOTS.bot.library.length') === 20 && ev('BOTS.bot.library[19].n') === 'Schock', `Chaos: Opfer verbannt, KI bringt eine Insel, Schock unten (${ev('BOTS.bot.bf.map(c => c.n).join()')})`);
  check(S().bf.map(c => c.n).join() === 'Ork' && S().library[S().library.length - 1].n === 'Blitz', `Chaos: ich bringe den Ork, Blitz unten (${S().bf.map(c => c.n).join()})`);

  // My Will Is Irresistible: KI behält die teuerste, ich übernehme den Rest
  await reset(); botSet('bf', [cr('Klein', 1), cr('Gross', 6), N('Ring', 'Artifact', '', {cmc:2, mc:'{2}'}), N('Island', 'Basic Land — Island', '')]);
  await runScheme('My Will Is Irresistible', [async () => { await clickCard('Klein'); await clickCard('Gross'); await clickCard('Ring'); await click('Fertig'); }]); await wait(150);
  check(S().bf.map(c => c.n).sort().join() === 'Klein,Ring' && ev('BOTS.bot.bf.map(c => c.n).sort().join()') === 'Gross,Island', `My Will Is Irresistible: Klein und Ring übernommen, Gross bleibt (${S().bf.map(c => c.n).join()})`);

  // Only I Know What Awaits: KI hat Kreatur und Land → je eine Karte dieses Typs aus der Hand
  await reset(); botSet('bf', [cr('Bär', 2), N('Island', 'Basic Land — Island', '')]);
  ev('S.hand = [newCard({n:"Wolf", type:"Creature — Wolf", o:"", cmc:2, pw:2, tg:2}), newCard({n:"Forest", type:"Basic Land — Forest", o:""}), newCard({n:"Amulett", type:"Artifact", o:"", cmc:1})]; commit()');
  await runScheme('Only I Know What Awaits', ['c:Wolf', 'c:Forest']);
  check(S().bf.map(c => c.n).sort().join() === 'Forest,Wolf' && S().hand.map(c => c.n).join() === 'Amulett', `Only I Know What Awaits: Wolf und Forest ins Spiel, Artefakt nicht (${S().bf.map(c => c.n).join()})`);

  // Your Own Face Mocks You: eine Kopie + eine Vogelscheuche
  await reset(); botSet('bf', [cr('Hydra', 5, {pw:5, tg:5})]);
  await runScheme('Your Own Face Mocks You', ['c:Hydra', 'b:Kein']);
  { const tk = S().bf.filter(c => c.tok); check(tk.length === 2 && tk.some(c => c.n === 'Hydra') && tk.some(c => /Scarecrow/.test(c.n + c.type) && c.pw === 4), `Your Own Face Mocks You: Hydra-Kopie und eine 4/4-Vogelscheuche (${tk.map(c => c.n).join(', ')})`); }
  await reset(); await runScheme('Your Own Face Mocks You', ['b:Kein']);
  check(S().bf.filter(c => c.tok && /Scarecrow/.test(c.n + c.type)).length === 2, `Your Own Face Mocks You: ohne Ziel zwei Vogelscheuchen (${S().bf.length})`);

  // You Live Only Because I Will It: Leben tauschen
  await reset(); ev('S.life = 5; commit()'); await wait(30);
  await runScheme('You Live Only Because I Will It', [async () => { const s = [...d.querySelectorAll('#modalBox select')]; s[0].value = '1'; s[1].value = '0'; await click('Verteilen'); }]); await wait(150);
  check(S().life === 20 && life('bot') === 5, `You Live Only Because I Will It: 5 ↔ 20 getauscht (${S().life}/${life('bot')})`);
  await reset(); await runScheme('You Live Only Because I Will It', [async () => { const s = [...d.querySelectorAll('#modalBox select')]; s[0].value = '1'; await click('Verteilen'); await click('Nicht verteilen'); }]);
  check(S().life === 40 && life('bot') === 20, 'You Live Only Because I Will It: doppelter Stand abgelehnt');

  // Know Evil: KI kann nicht angreifen (Standardwahl), dann: KI kann keine Kreaturen wirken
  await reset(); ev('S.locks = []');
  await runScheme('Know Evil', ['b:Weiter']);
  check(ev('withBot("bot", () => !!botAttackLocked())') && !ev('withBot("bot", () => botCastLocked({type:"Creature — Bear"}))'), 'Know Evil: KI darf bis zu meinem nächsten Zug nicht angreifen, aber wirken');
  await reset(); ev('S.locks = []');
  await runScheme('Know Evil', [async () => { const s = [...d.querySelectorAll('#modalBox select')]; s[0].value = ''; s[1].value = 'bot'; await click('Weiter'); }]);
  check(!ev('withBot("bot", () => !!botAttackLocked())') && ev('withBot("bot", () => botCastLocked({type:"Creature — Bear"}))') && !ev('withBot("bot", () => botCastLocked({type:"Instant"}))'), 'Know Evil: KI kann keine Kreaturenzauber wirken, Spontanzauber schon');
  ev('TURN = {active:"bot", n:21, starter:me.id, phase:2}'); check(ev('withBot("bot", () => botCastLocked({type:"Creature — Bear"}))'), 'Know Evil: Sperre gilt auch im Zug der KI');
  await reset(); ev('S.locks = []');
  await runScheme('Know Evil', [async () => { const s = [...d.querySelectorAll('#modalBox select')]; s[0].value = 'bot'; s[1].value = 'bot'; await click('Weiter'); await click('Abbrechen'); }]);
  check(ev('S.locks.length') === 0, 'Know Evil: denselben Gegner zweimal abgelehnt');
  // Cast-Warnung für Mitspieler: Kreaturenzauber-Sperre
  { ev('others.zz = {name:"Anna", locks:[{key:turnKey(), creature:true, pid:me.id, src:"Know Evil"}]}');
    w.__res = undefined; ev('castWarn(newCard({n:"Wolf", type:"Creature — Wolf", o:""}), "hand").then(r => window.__res = r)'); await wait(100);
    check(open() && /keine Kreaturenzauber/.test($('#modalBox').textContent), 'Know Evil (Mitspieler): Warnung beim Kreaturenzauber'); await click('Nicht wirken'); await wait(50);
    w.__res = undefined; ev('castWarn(newCard({n:"Blitz", type:"Instant", o:""}), "hand").then(r => window.__res = r)'); await wait(100);
    check(w.__res === true && !open(), `Know Evil (Mitspieler): Spontanzauber ohne Warnung (${open() ? $('#modalBox').textContent.slice(0, 200) : w.__res})`); ev('delete others.zz'); await drain(); }

  // You Exist Only to Amuse: ohne sechs Länder Modus 2 gewählt
  await reset(); botSet('bf', [cr('Flieger', 3, {pw:3, tg:3, o:'Flying'})]);
  await runScheme('You Exist Only to Amuse', [async () => { const b = [...d.querySelectorAll('#modalBox button')].find(b => /^Until your next turn/.test(b.textContent)); if(b) b.click(); await wait(40); await click('Ausführen'); }]); await wait(100);
  { const c = ev('BOTS.bot.bf[0]'); check(c.pw === 1 && c.tg === 1 && c.o === '' && S().bf.length === 0, `You Exist Only to Amuse: KI-Kreatur 1/1 ohne Fähigkeiten, keine Teufel (${c.pw}/${c.tg})`); }
  ev('TURN = {active:me.id, n:22, starter:me.id, phase:0}; remindTriggers("upkeep", true)'); await wait(50);
  { const c = ev('BOTS.bot.bf[0]'); check(c.pw === 3 && c.o === 'Flying', `You Exist Only to Amuse: zu meinem nächsten Zug wieder 3/3 mit Flying (${c.pw}/${c.tg})`); }
  // mit sechs Ländern beide Modi ohne Auswahl
  await reset(); ev('for(let i = 0; i < 6; i++) S.bf.push(newCard({n:"Swamp", type:"Basic Land — Swamp", o:""})); commit()'); botSet('bf', [cr('Flieger', 3, {pw:3, tg:3})]);
  await runScheme('You Exist Only to Amuse'); await wait(100);
  check(S().bf.filter(c => c.tok && /Devil/.test(c.n + c.type)).length === 3 && ev('BOTS.bot.bf[0].pw') === 1, `You Exist Only to Amuse: sechs Länder → drei Teufel und 1/1 (${S().bf.filter(c => c.tok).length})`);

  // Nature Demands an Offering: KI wählt ihre billigsten Karten, sie werden in ihre Bibliothek gemischt
  await reset(); botSet('bf', [cr('Klein', 1), cr('Gross', 6), N('Ring', 'Artifact', '', {cmc:2}), N('Aura', 'Enchantment — Aura', '', {cmc:3}), N('Island', 'Basic Land — Island', '')]);
  ev('S.bf.push(newCard({n:"Mein Bär", type:"Creature — Bear", o:"", pw:2, tg:2, cmc:2})); commit()');
  await runScheme('Nature Demands an Offering'); await wait(150);
  check(ev('BOTS.bot.bf.map(c => c.n).join()') === 'Gross' && ev('BOTS.bot.library.length') === 24 && S().bf.length === 1, `Nature Demands an Offering: Klein, Ring, Aura, Island in die KI-Bibliothek, Gross bleibt, mein Bär bleibt (${ev('BOTS.bot.bf.map(c => c.n).join()')})`);
  // Mitspieler wählt im Dialog
  { w.eval('window.__oldSend = sendTo; sendTo = (to, m) => { if(m && m.t === "resp") window.__resp = m.data; else window.__oldSend(to, m); }'); w.__resp = null;
    ev('receiveReq({from:"x", by:"Anna", id:"r4", req:{kind:"natureOffer", groups:[{type:"Creature", cards:[{u:"k1", n:"Kreatur1", type:"Artifact Creature"}]}, {type:"Artifact", cards:[{u:"k1", n:"Kreatur1", type:"Artifact Creature"}, {u:"k2", n:"Ring2", type:"Artifact"}]}, {type:"Enchantment", cards:[]}, {type:"Land", cards:[]}], src:"Nature Demands an Offering"}})'); await wait(120);
    const okB = () => [...d.querySelectorAll('#modalBox button')].find(b => b.textContent.trim() === 'Fertig');
    check(open() && okB() && okB().disabled, 'Nature Demands (Mitspieler): Fertig erst nach der Wahl');
    await clickCard('Kreatur1'); check(okB() && okB().disabled, 'Nature Demands (Mitspieler): Artefakt fehlt noch');
    const rings = [...d.querySelectorAll('#modalBox .card')].filter(e => e.textContent.includes('Ring2')); rings[0].click(); await wait(40);
    okB().click(); await wait(80); check(w.__resp && JSON.stringify(w.__resp.us) === JSON.stringify(['k1', 'k2', null, null]), `Nature Demands (Mitspieler): Antwort (${JSON.stringify(w.__resp)})`); ev('sendTo = window.__oldSend'); }

  // Beastbind-Wirkung auf meiner Kreatur endet im nächsten Zug des Verursachers (bbBy = Spieler-ID, nicht Name)
  await reset(); ev('S.bf.push(newCard({n:"Mein Flieger", type:"Creature — Bird", o:"Flying", pw:3, tg:3})); commit()');
  ev('applyHitToCard(S.bf[0], {kind:"beastbind", from:"bot", by:"KI", amount:0}, false)');
  check(S().bf[0].pw === 2 && S().bf[0].bbBy === 'bot', `Beastbind: 2/2, gemerkt wird die ID (${S().bf[0].bbBy})`);
  ev('TURN = {active:"bot", n:21, starter:me.id, phase:0}; remindTriggers("upkeep", false)'); await wait(30);
  check(S().bf[0].pw === 3 && S().bf[0].o === 'Flying', `Beastbind: im Zug der KI wieder 3/3 mit Flying (${S().bf[0].pw})`);

  // Mitspieler: pickOne im Dialog
  { w.eval('window.__oldSend = sendTo; sendTo = (to, m) => { if(m && m.t === "resp") window.__resp = m.data; else window.__oldSend(to, m); }'); w.__resp = null;
    ev('receiveReq({from:"x", by:"Anna", id:"r3", req:{kind:"pickOne", cards:[{u:"a1", n:"Eins", type:"Artifact"}, {u:"a2", n:"Zwei", type:"Artifact"}], src:"My Will Is Irresistible"}})'); await wait(120);
    await clickCard('Zwei'); await wait(80); check(w.__resp && w.__resp.u === 'a2', `My Will Is Irresistible: Mitspieler behält «Zwei» (${JSON.stringify(w.__resp)})`); ev('sendTo = window.__oldSend'); }

  // Choose Your Champion: mit zwei KI wählt die gefragte KI sich selbst → die andere ist gesperrt
  ev('startBot("Zwei", "Test", Array(30).fill(0).map(() => ({n:"Island", type:"Basic Land — Island", o:""})), "bot2"); useBot("bot"); injectBot(); commit()'); await wait(50);
  await reset(); ev('S.locks = []');
  await runScheme('Choose Your Champion', ['b:KI (']);
  check(!ev('withBot("bot", () => botCastLocked({type:"Instant"}))') && ev('withBot("bot2", () => botCastLocked({type:"Instant"}))') && ev('withBot("bot2", () => !!botAttackLocked())'), `Choose Your Champion: KI wählt sich, KI 2 darf weder wirken noch angreifen (${ev('S.locks.length')})`);
  ev('TURN = {active:me.id, n:22, starter:me.id, phase:0}; S.locks = S.locks.filter(l => !l.untilNext)'); check(!ev('withBot("bot2", () => botCastLocked({type:"Instant"}))'), 'Choose Your Champion: ab meinem nächsten Zug vorbei');

  // Cloak and Dagger-Weg: Handkarten des Gegners werden angeboten (Antwort «hand»)
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
