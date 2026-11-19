// Nacht 19.11.2026: laufende Komplotte (Ongoing, Archenemy) – Text aus oracle_schemes.json (Scryfall)
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
  const drain = async () => { for(let i = 0; i < 8 && open(); i++){ if(!(await click('In Gang setzen')) && !(await click('Abbrechen')) && !(await click('Kein')) && !(await click('Nein')) && !(await click('Erledigt')) && !(await click('OK'))) break; await wait(40); } };
  const reset0 = () => ev('TURN = {active:me.id, n:5, starter:me.id, phase:2}; S.bf = []; S.hand = []; S.gy = []; S.ex = []; S.emblems = []; S.library = Array(20).fill(0).map(() => newCard({n:"Swamp", type:"Basic Land — Swamp", o:""})); S.pool = emptyPoolObj(); S.life = 40; S.arch = {on:true, deck:[{n:"Platzhalter", o:"Draw a card."}], n:0, last:null, active:[]}; withBot("bot", () => { BOT.bf = []; BOT.hand = []; BOT.gy = []; BOT.life = 20; botChanged(); }); commit()');
  const reset = async () => { await wait(80); await drain(); reset0(); await wait(20); };
  const scheme = n => { const sc = SCH.find(x => x.n === n); if(!sc) throw new Error('Komplott fehlt: ' + n); return {n:sc.n, o:sc.o, ongoing:/Ongoing/.test(sc.type) || undefined}; };
  const setOngoing = async n => { w.__sc = scheme(n); ev('S.arch.deck.unshift(window.__sc); window.__done = false; schemeMotionOne().then(() => { window.__done = true; })');
    for(let i = 0; i < 40 && !w.__done; i++){ await wait(40); if(open()) await click('In Gang setzen'); } await wait(60); };
  const active = () => ev('archActive().map(c => c.n).join()');
  const phase = async (phase, mine) => { w.__ph = {kind:'phase', phase, mine}; ev('abilEvent(window.__ph)'); await wait(250); await drain(); await wait(100); };
  const cr = (n, x = {}) => N(n, 'Creature — Bear', '', {pw:2, tg:2, cmc:2, mc:'{1}{G}', ...x});
  const AUTO = ['My Tendrils Run Deep', 'Your Inescapable Doom', 'Because I Have Willed It', 'Dark Wings Bring Your Downfall', 'Mine Is the Only Truth', 'The Very Soil Shall Shake',
    'Fear My Authority', 'I Am Duskmourn', 'My Forces Are Innumerable', 'You Cannot Hide from Me'];
  for(const n of AUTO){ w.__sc = scheme(n); const st = ev('cardCheck(schemeAsSpell(window.__sc)).status'); check(st === 'auto', `${n}: automatisch (${st})`); }

  // Grundgerüst: laufendes Komplott bleibt liegen, kommt nicht sofort unter das Deck
  await reset(); await setOngoing('My Tendrils Run Deep');
  check(active() === 'My Tendrils Run Deep' && !ev('S.arch.deck.some(x => x.n === "My Tendrils Run Deep")'), `laufendes Komplott liegt offen (${active()})`);
  // My Tendrils Run Deep: mit fünf Ländern nichts, mit sechs zwei Karten und aufgeben
  ev('for(let i = 0; i < 5; i++) S.bf.push(newCard({n:"Swamp", type:"Basic Land — Swamp", o:""})); commit()');
  await phase('end', true);
  check(S().hand.length === 0 && active() === 'My Tendrils Run Deep', `Tendrils: fünf Länder → nichts (Hand ${S().hand.length})`);
  ev('S.bf.push(newCard({n:"Swamp", type:"Basic Land — Swamp", o:""})); commit()'); await phase('end', true);
  check(S().hand.length === 2 && active() === '' && ev('S.arch.deck[S.arch.deck.length - 1].n') === 'My Tendrils Run Deep', `Tendrils: sechs Länder → 2 Karten, aufgegeben, unter das Deck (Hand ${S().hand.length}, aktiv «${active()}»)`);
  await phase('end', true); check(S().hand.length === 2, 'Tendrils: nach dem Aufgeben keine Wirkung mehr');

  // Your Inescapable Doom: Marke, dann Schaden in Höhe der Marken
  await reset(); await setOngoing('Your Inescapable Doom');
  await phase('end', true); check(ev('BOTS.bot.life') === 19, `Doom: 1 Schaden (${ev('BOTS.bot.life')})`);
  await phase('end', true); check(ev('BOTS.bot.life') === 17 && active() === 'Your Inescapable Doom', `Doom: dann 2 Schaden, bleibt liegen (${ev('BOTS.bot.life')})`);
  await phase('end', false); check(ev('BOTS.bot.life') === 17, 'Doom: nicht im Endschritt des Gegners');

  // Because I Have Willed It: Zauber kosten 1 weniger; vier Zauber eines Gegners → aufgeben
  await reset(); w.__sp = N('Zauber', 'Sorcery', 'Draw a card.', {cmc:3, mc:'{2}{B}'});
  check(ev('costMods(window.__sp).less') === 0, 'Because I Have Willed It: ohne Komplott keine Senkung');
  await setOngoing('Because I Have Willed It');
  check(ev('costMods(window.__sp).less') === 1, `Because I Have Willed It: Zauber kosten {1} weniger (${ev('costMods(window.__sp).less')})`);
  ev('TURN = {active:"bot", n:6, starter:me.id, phase:5}');
  for(let i = 0; i < 3; i++) ev('abilEvent({kind:"oppCast", c:{n:"X", type:"Instant", mc:"{U}", cmc:1}, opp:true, pid:"bot"})');
  await phase('end', false); check(active() === 'Because I Have Willed It', 'Because I Have Willed It: drei Zauber → bleibt');
  ev('abilEvent({kind:"oppCast", c:{n:"X", type:"Instant", mc:"{U}", cmc:1}, opp:true, pid:"bot"})');
  await phase('end', false); check(active() === '' && ev('costMods(window.__sp).less') === 0, `Because I Have Willed It: vier Zauber → aufgegeben (${active()})`);

  // Dark Wings Bring Your Downfall: Dämon greift mit an; zwei gestorbene Kreaturen → aufgeben
  await reset(); await setOngoing('Dark Wings Bring Your Downfall');
  ev('S.bf.push(newCard({n:"Bär A", type:"Creature — Bear", o:"", pw:2, tg:2}), newCard({n:"Bär B", type:"Creature — Bear", o:"", pw:2, tg:2})); commit()');
  ev('S.atkJoin = []; markOnAttack([S.bf[0]])'); await wait(250); await drain(); await wait(100);
  { const dm = S().bf.find(c => /Demon/.test(c.type || '')); check(dm && dm.tap && (S().atkJoin || []).some(j => j.u === dm.u) && ev('kwHas(S.bf.find(c => /Demon/.test(c.type || "")), "flying")') && ev('power(S.bf.find(c => /Demon/.test(c.type || "")))') === 5, `Dark Wings: 5/5-Dämon getappt und angreifend (${dm && dm.n}, ${dm && dm.tap})`); }
  ev('moveCard(S.bf.find(c => c.n === "Bär A").u, "gy")'); await phase('end', true);
  check(active() === 'Dark Wings Bring Your Downfall', 'Dark Wings: eine gestorbene Kreatur → bleibt');
  ev('moveCard(S.bf.find(c => c.n === "Bär B").u, "gy")'); await phase('end', false);
  check(active() === '', `Dark Wings: zwei gestorbene Kreaturen → aufgegeben, auch im Endschritt eines anderen (${active()})`);

  // Mine Is the Only Truth: jeder Zauber → ich ziehe; habe ich im letzten Zug gezogen → aufgeben
  await reset(); await setOngoing('Mine Is the Only Truth');
  ev('TURN = {active:"bot", n:6, starter:me.id, phase:2}'); ev('abilEvent({kind:"oppCast", c:{n:"X", type:"Instant", mc:"{U}", cmc:1}, opp:true, pid:"bot"})'); await wait(250); await drain();
  check(S().hand.length === 1, `Mine Is the Only Truth: Zauber der KI → ich ziehe (Hand ${S().hand.length})`);
  ev('TURN = {active:me.id, n:5, starter:me.id, phase:2}; abilEvent({kind:"cast", c:newCard({n:"Y", type:"Sorcery", o:"", mc:"{B}", cmc:1})})'); await wait(250); await drain();
  check(S().hand.length === 2, `Mine Is the Only Truth: eigener Zauber → ich ziehe auch (Hand ${S().hand.length})`);
  ev('TURN = {active:"bot", n:6, starter:me.id, phase:2}');
  ev('S.prevTK = turnKey(); TURN = {active:me.id, n:7, starter:me.id, phase:0}'); await phase('upkeep', true);
  check(active() === '', `Mine Is the Only Truth: im letzten Zug gezogen → aufgegeben (${active()})`);
  await reset(); await setOngoing('Mine Is the Only Truth'); ev('TURN = {active:"bot", n:8, starter:me.id, phase:2}; S.prevTK = turnKey(); TURN = {active:me.id, n:9, starter:me.id, phase:0}'); await phase('upkeep', true);
  check(active() === 'Mine Is the Only Truth', 'Mine Is the Only Truth: nichts gezogen → bleibt');

  // The Very Soil Shall Shake: +2/+2 und Trampelschaden; stirbt eine meiner Kreaturen → aufgeben
  await reset(); ev('S.bf.push(newCard({n:"Bär A", type:"Creature — Bear", o:"", pw:2, tg:2}), newCard({n:"Bär B", type:"Creature — Bear", o:"", pw:2, tg:2})); commit()');
  await setOngoing('The Very Soil Shall Shake');
  check(ev('power(S.bf[0])') === 4 && ev('tough(S.bf[0])') === 4 && ev('kwHas(S.bf[0], "trample")'), `Very Soil: 4/4 mit Trampelschaden (${ev('power(S.bf[0])')}/${ev('tough(S.bf[0])')})`);
  ev('withBot("bot", () => { BOT.bf.push(newCard({n:"KI-Bär", type:"Creature — Bear", o:"", pw:2, tg:2})); botChanged(); })');
  check(ev('power(BOTS.bot.bf[0])') === 2, 'Very Soil: Kreaturen der KI unverändert');
  ev('moveCard(S.bf.find(c => c.n === "Bär A").u, "gy")'); await wait(250); await drain(); await wait(100);
  check(active() === '' && ev('power(S.bf[0])') === 2 && !ev('kwHas(S.bf[0], "trample")'), `Very Soil: Kreatur gestorben → aufgegeben, wieder 2/2 (${active()})`);

  // Fear My Authority: +2/+2 und Furcht; im Versorgungssegment abwerfen, 3 Leben zahlen oder aufgeben
  await reset(); ev('S.bf.push(newCard({n:"Bär", type:"Creature — Bear", o:"", pw:2, tg:2, mc:"{1}{G}"})); commit()');
  await setOngoing('Fear My Authority');
  w.__g = cr('Grüner Blocker'); w.__b = cr('Schwarzer Blocker', {mc:'{1}{B}'}); w.__a = N('Golem', 'Artifact Creature — Golem', '', {pw:3, tg:3, mc:'{3}'});
  check(ev('power(S.bf[0])') === 4 && ev('kwHas(S.bf[0], "fear")'), `Fear My Authority: 4/4 mit Furcht (${ev('power(S.bf[0])')})`);
  check(!ev('canBlock(window.__g, S.bf[0])') && ev('canBlock(window.__b, S.bf[0])') && ev('canBlock(window.__a, S.bf[0])'), 'Fear: nur schwarze oder Artefaktkreaturen blocken');
  ev('S.hand = [newCard({n:"Ballast", type:"Sorcery", o:"", mc:"{1}", cmc:1})]; commit()');
  w.__ph = {kind:'phase', phase:'upkeep', mine:true}; ev('abilEvent(window.__ph)'); await wait(200);
  await click('Karte abwerfen'); await wait(150); if(open()) await clickCard('Ballast'); await wait(100); if(open()) await click('Fertig'); await wait(150);
  check(S().hand.length === 0 && S().gy.some(c => c.n === 'Ballast') && active() === 'Fear My Authority', `Fear: Karte abgeworfen, bleibt liegen (Hand ${S().hand.length}, ${active()})`);
  ev('abilEvent(window.__ph)'); await wait(200); await click('3 Leben zahlen'); await wait(150);
  check(S().life === 37 && active() === 'Fear My Authority', `Fear: 3 Leben gezahlt, bleibt liegen (${S().life})`);
  ev('abilEvent(window.__ph)'); await wait(200); await click('Aufgeben'); await wait(150);
  check(active() === '' && ev('power(S.bf[0])') === 2 && !ev('kwHas(S.bf[0], "fear")'), `Fear: aufgegeben, wieder 2/2 ohne Furcht (${active()})`);

  // I Am Duskmourn: im Endschritt einen Zauber gratis aus der Hand wirken, dann aufgeben
  await reset(); await setOngoing('I Am Duskmourn'); ev('S.hand = [newCard({n:"Tiefe Weisheit", type:"Sorcery", o:"Draw two cards.", mc:"{5}{U}", cmc:6})]; commit()');
  w.__ph = {kind:'phase', phase:'end', mine:true}; ev('abilEvent(window.__ph)'); await wait(200); await click('Keinen'); await wait(200); await drain();
  check(S().hand.length === 1 && active() === 'I Am Duskmourn', `Duskmourn: keinen gewirkt → bleibt (${active()})`);
  ev('abilEvent(window.__ph)'); await wait(200); await clickCard('Tiefe Weisheit'); await wait(80); if(open()) await click('Fertig'); await wait(400); await drain(); await wait(200);
  check(S().gy.some(c => c.n === 'Tiefe Weisheit') && S().hand.length === 2 && active() === '' && ev('S.pool.U || 0') === 0, `Duskmourn: Tiefe Weisheit gratis gewirkt, aufgegeben (Hand ${S().hand.length}, ${active()})`);

  // My Forces Are Innumerable: 3/3-Horror in meinem Endschritt; Gegner opfert zwei Kreaturen → aufgeben
  await reset(); await setOngoing('My Forces Are Innumerable');
  await phase('end', true); check(S().bf.some(c => c.tok && /Horror/.test(c.type || '') && ev('power(S.bf.find(c => /Horror/.test(c.type || "")))') === 3), `Forces: 3/3-Horror erschaffen (${S().bf.map(c => c.n).join()})`);
  ev('withBot("bot", () => { BOT.bf = [newCard({n:"Riese A", type:"Creature — Giant", o:"", pw:5, tg:5}), newCard({n:"Riese B", type:"Creature — Giant", o:"", pw:5, tg:5})]; botChanged(); }); TURN = {active:"bot", n:6, starter:me.id, phase:5}');
  await phase('end', false); check(ev('BOTS.bot.bf.length') === 2 && active() === 'My Forces Are Innumerable', 'Forces: KI behält ihre zwei Riesen, Komplott bleibt');
  ev('withBot("bot", () => { BOT.bf = [newCard({n:"Spross", type:"Token Creature — Saproling", o:"", pw:1, tg:1, tok:true}), newCard({n:"Elf", type:"Creature — Elf", o:"", pw:1, tg:1}), newCard({n:"Riese", type:"Creature — Giant", o:"", pw:5, tg:5})]; botChanged(); })');
  await phase('end', false); check(ev('BOTS.bot.bf.map(c => c.n).join()') === 'Riese' && active() === '', `Forces: KI opfert Spross und Elf → aufgegeben (${ev('BOTS.bot.bf.map(c => c.n).join()')}, ${active()})`);
  // Mitspieler: freiwillig opfern im Dialog
  { w.eval('window.__oldSend = sendTo; sendTo = (to, m) => { if(m && m.t === "resp") window.__resp = m.data; else window.__oldSend(to, m); }'); w.__resp = null;
    ev('S.bf = [newCard({n:"Eins", type:"Creature — Bear", o:"", pw:2, tg:2}), newCard({n:"Zwei", type:"Creature — Bear", o:"", pw:2, tg:2}), newCard({n:"Drei", type:"Creature — Bear", o:"", pw:2, tg:2})]; commit()');
    ev('receiveReq({from:"x", by:"Anna", id:"r9", req:{kind:"sacrifice", n:2, desc:"creature", may:true, src:"My Forces Are Innumerable"}})'); await wait(150);
    await click('Nicht opfern'); await wait(120); check(w.__resp && w.__resp.cards.length === 0 && S().bf.length === 3, `Mitspieler: «Nicht opfern» (${JSON.stringify(w.__resp)})`);
    w.__resp = null; ev('receiveReq({from:"x", by:"Anna", id:"r10", req:{kind:"sacrifice", n:2, desc:"creature", may:true, src:"My Forces Are Innumerable"}})'); await wait(150);
    await clickCard('Eins'); await clickCard('Zwei'); if(open()) await click('Fertig'); await wait(150);
    check(w.__resp && w.__resp.cards.length === 2 && S().bf.map(c => c.n).join() === 'Drei', `Mitspieler: opfert Eins und Zwei (${JSON.stringify(w.__resp)})`); ev('sendTo = window.__oldSend'); }

  // You Cannot Hide from Me: zu Beginn meines Kampfes +2/+2, Wachsamkeit, unblockbar; Gegner unter halbem Startleben → aufgeben
  await reset(); ev('S.bf.push(newCard({n:"Bär", type:"Creature — Bear", o:"", pw:2, tg:2})); commit()'); await setOngoing('You Cannot Hide from Me');
  w.__ph = {kind:'phase', phase:'combat', mine:true}; ev('abilEvent(window.__ph)'); await wait(200); await clickCard('Bär'); await wait(200); await drain();
  check(ev('power(S.bf[0])') === 4 && ev('kwHas(S.bf[0], "vigilance")') && ev('kwHas(S.bf[0], "unblockable")'), `Cannot Hide: Bär 4/4, Wachsamkeit, unblockbar (${ev('power(S.bf[0])')}, ${JSON.stringify(ev('S.bf[0].tkw'))})`);
  ev('TURN = {active:"bot", n:6, starter:me.id, phase:5}; withBot("bot", () => { BOT.life = 10; botChanged(); })');
  await phase('end', false); check(active() === 'You Cannot Hide from Me', 'Cannot Hide: KI mit 10 von 20 Leben → bleibt');
  ev('withBot("bot", () => { BOT.life = 9; botChanged(); })'); await phase('end', false);
  check(active() === '', `Cannot Hide: KI mit 9 Leben → aufgegeben (${active()})`);

  // Neues Spiel: laufende Komplotte kommen zurück ins Deck
  await reset(); await setOngoing('Your Inescapable Doom'); const nd = ev('S.arch.deck.length');
  const rs = ev('(() => { restartBots(); return archActive().length + "|" + S.arch.deck.filter(x => x.n === "Your Inescapable Doom").length + "|" + S.arch.deck.length; })()'); await wait(300); await drain();
  check(rs === `0|1|${nd + 1}`, `Neues Spiel: laufendes Komplott zurück im Deck (${rs})`);

  // Komplott-Deck: laufende nur, wenn automatisch
  ev('ARCH.cache = null; window.__all = ' + JSON.stringify(SCH.map(s => ({n:s.n, o:s.o, ongoing:/Ongoing/.test(s.type) || undefined}))) + '; ARCH.cache = window.__all');
  await ev('schemeDeckBuild().then(d => { window._sd = d; })'); await wait(50);
  check(ev('window._sd.filter(sc => sc.ongoing).every(sc => cardCheck(schemeAsSpell(sc)).status === "auto")'), `Komplott-Deck: nur automatische laufende Komplotte (${ev('window._sd.filter(sc => sc.ongoing).map(sc => sc.n).join(", ")')})`);
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
