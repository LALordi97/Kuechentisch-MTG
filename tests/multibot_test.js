const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const C = (n, type, o, x = {}) => ev('newCard')({n, type, o, img:null, ...x});
const click = async t => { const b = [...d.querySelectorAll('#modalBox button')].find(b => b.textContent.trim().startsWith(t)); if(b){ b.click(); await wait(30); } return !!b; };
const btns = () => [...d.querySelectorAll('#modalBox button')].map(b => b.textContent.trim());
const TITLES = [];
const confirmBlocks = async () => { for(let i = 0; i < 12; i++){ const h = d.querySelector('#modalBox h2'); if(h && /greift an/.test(h.textContent) && !$('#modal').hidden && !TITLES.includes(h.textContent)) TITLES.push(h.textContent); const b = [...d.querySelectorAll('#modalBox button')].find(b => /Blocker bestätigen|Nicht blocken|Keine Blocker|^Später$/.test(b.textContent)); if(b){ b.click(); await wait(80); } else await wait(80); } };
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()'); ev('LOOK.autoPay = false');
  ev(`META_DECKS.Test=[{n:'Blau',p:'',s:'',l:'20 Island\\n20 Grizzly Bears'},{n:'Rot',p:'',s:'',l:'20 Mountain\\n20 Hill Giant'},{n:'Grün',p:'',s:'',l:'20 Forest\\n20 Llanowar Elves'}]`);
  // Kartenabruf ersetzen: Namen → einfache Karten
  ev(`window.fetchCards = async (list) => ({deck: list.flatMap(e => Array(e.qty).fill(0).map(() => ({n:e.name, type: /Island|Mountain|Forest/.test(e.name) ? "Basic Land — " + e.name : "Creature — Bear", o:"", mc: /Island|Mountain|Forest/.test(e.name) ? "" : "{1}", cmc: /Island|Mountain|Forest/.test(e.name) ? 0 : 1, pw:2, tg:2}))), missing:[], netErr:false})`);
  ev('S.deck = Array(40).fill(0).map(() => ({n:"Plains", type:"Basic Land — Plains", o:""})); startGame()'); await wait(30);
  $('#bBot').click(); await wait(20);
  check(!!$('#bCount') && $('#bCount').options.length === 3, 'KI-Dialog: Auswahl «Anzahl KI-Gegner» 1–3');
  $('#bFmt').innerHTML = '<option value="Test">Test</option>'; $('#bFmt').value = 'Test'; $('#bFmt').onchange();
  $('#bCount').value = '3'; $('#bCount').onchange(); await wait(10);
  const sels = [...d.querySelectorAll('#bDecks select')];
  check(sels.length === 3 && sels.map(x => x.value).join() === '0,1,2', 'drei Deck-Auswahlen, verschiedene Decks vorgewählt');
  check(/Deck von KI 2/.test($('#bDecks').textContent), 'Beschriftung «Deck von KI 2»');
  $('#bRestart').checked = false;
  ev('Math.random = (() => { const r = Math.random; return () => 0; })()');   // Auslosung: ich beginne
  $('#bGo').click(); await wait(300);
  check(ev('botIds().join()') === 'bot,bot2,bot3', `drei KI-Gegner aktiv (${ev('botIds().join()')})`);
  check(ev('BOTS.bot.deckName') === 'Blau' && ev('BOTS.bot2.deckName') === 'Rot' && ev('BOTS.bot3.deckName') === 'Grün', 'jede KI spielt ihr eigenes Deck');
  check(ev('["bot","bot2","bot3"].every(id => BOTS[id].hand.length + BOTS[id].library.length === 40)'), 'jede KI hat 40 Karten');
  check(ev('order.filter(isBotId).length') === 3 && /KI 2 · Rot/.test(d.querySelector('#opps').textContent) && /KI 3 · Grün/.test(d.querySelector('#opps').textContent), 'alle drei sitzen sichtbar am Tisch');
  check(ev('TURN.active === me.id'), 'ich beginne');
  // Zugfolge: ich → KI → KI 2 → KI 3 → ich
  const seen = [];
  ev('passTurn()');
  for(let i = 0; i < 80 && seen.length < 3; i++){ await wait(150); const a = ev('TURN.active'); if(isB(a) && !seen.includes(a)) seen.push(a); await confirmBlocks(); if(ev('TURN.active === me.id') && seen.length) break; }
  function isB(a){ return /^bot\d*$/.test(a || ''); }
  for(let i = 0; i < 60 && !ev('TURN.active === me.id'); i++){ await confirmBlocks(); await wait(150); }
  check(seen.join() === 'bot,bot2,bot3', `alle drei KI kommen der Reihe nach dran (${seen.join()})`);
  check(ev('TURN.active === me.id'), 'danach bin ich wieder am Zug');
  check(ev('["bot","bot2","bot3"].every(id => BOTS[id].turn === 1)'), 'jede KI hat genau einen Zug gemacht');
  check(ev('BOTS.bot2.bf.some(c => c.n === "Mountain")') && !ev('BOTS.bot.bf.some(c => c.n === "Mountain")'), 'KI 2 spielt ihre eigenen Länder (Mountain), nicht die von KI 1');
  check(/KI 2/.test(d.querySelector('#log').textContent) && /KI 3/.test(d.querySelector('#log').textContent), 'Protokoll nennt «KI 2» und «KI 3»');
  // Zweite Runde: die KI greifen mit ihren Kreaturen an, jedes Blockfenster nennt die richtige KI
  ev('["bot","bot2","bot3"].forEach(id => BOTS[id].bf.push(Object.assign(newCard({n:"Angreifer " + id, type:"Creature — Bear", o:"", pw:2, tg:2}), {sick:false}))); botChanged()');
  ev('S.bf.push(Object.assign(newCard({n:"Wache", type:"Creature — Soldier", o:"", pw:0, tg:1}), {sick:false})); commit()');
  TITLES.length = 0; const titles = TITLES; const lifeMe = ev('S.life');
  ev('passTurn()');
  for(let i = 0; i < 120; i++){ await wait(100); await confirmBlocks(); if(ev('TURN.active === me.id') && i > 5) break; }
  check(titles.some(t => /^Die KI greift an/.test(t)) && titles.some(t => /^KI 2 greift an/.test(t)) && titles.some(t => /^KI 3 greift an/.test(t)), `Blockfenster: ${titles.join(' | ')}`);
  check(ev('S.life') < lifeMe, `ich nehme Kampfschaden von den KI (${lifeMe} → ${ev('S.life')})`);
  // KI greifen sich gegenseitig an: KI 2 sieht die angeschlagene KI (3 Leben, keine Blocker) und greift sie statt mich an
  ev('BOTS.bot.life = 3; BOTS.bot.bf = BOTS.bot.bf.filter(c => !isCreature(c)); BOTS.bot3.bf.forEach(c => { if(isCreature(c)) c.tap = true; })');
  ev('BOTS.bot2.bf = BOTS.bot2.bf.filter(c => !isCreature(c)); BOTS.bot2.bf.push(Object.assign(newCard({n:"Oger", type:"Creature — Ogre", o:"", pw:4, tg:4}), {sick:false})); botChanged()');
  ev('S.bf.push(Object.assign(newCard({n:"Mauer", type:"Creature — Wall", o:"Defender", pw:0, tg:8, kw:["Defender"]}), {sick:false})); commit()');
  { const lifeMe2 = ev('S.life'); ev('TURN.active = null; applyTurn({active:"bot2", n:TURN.n + 1, starter:TURN.starter})');
    for(let i = 0; i < 40 && !ev('BOTS.bot.life <= 0'); i++){ await confirmBlocks(); await wait(100); }
    check(ev('BOTS.bot.life') <= 0 && ev('S.life') === lifeMe2, `KI 2 greift die KI an, nicht mich (KI: ${ev('BOTS.bot.life')} Leben, ich: ${ev('S.life')})`);
    check(/greift Die KI an mit Oger/.test(d.querySelector('#log').textContent) && /Kampf gegen Die KI/.test(d.querySelector('#log').textContent), 'Protokoll: «KI 2 greift Die KI an mit Oger»');
    check(/verliert das Spiel/.test(d.querySelector('#log').textContent) && ev('!turnIds().includes("bot")'), 'die KI ist ausgeschieden und fällt aus der Zugfolge');
    for(let i = 0; i < 60 && !ev('TURN.active === me.id'); i++){ await confirmBlocks(); await wait(100); }
    ev('BOTS.bot.life = 20; botChanged()'); }
  // KI blockt den Angriff einer anderen KI
  ev('BOTS.bot3.bf.push(Object.assign(newCard({n:"Wächter", type:"Creature — Golem", o:"", pw:1, tg:9}), {sick:false})); BOTS.bot3.life = 2; botChanged()');
  ev('BOTS.bot.life = 30; BOTS.bot2.bf.forEach(c => { c.tap = false; c.sick = false; })');
  { ev('withBot("bot2", () => { const atk = BOT.bf.filter(c => c.n === "Oger"); const bl = withBot("bot3", () => botChooseBlocks(atk)); botVsBot(atk, bl, "bot3"); })');
    check(ev('BOTS.bot3.life') === 2 && /Oger wird von Wächter geblockt/.test(d.querySelector('#log').textContent), `KI 3 blockt den Oger mit dem Wächter (Leben ${ev('BOTS.bot3.life')})`); ev('BOTS.bot3.life = 20; BOTS.bot3.bf = BOTS.bot3.bf.filter(c => c.n !== "Wächter"); botChanged()'); }
  // Schaden an KI 2 trifft nur KI 2
  const l1 = ev('BOTS.bot.life'), l2 = ev('BOTS.bot2.life');
  ev('hitOpponent("bot2", {kind:"damage", amount:5, src:"Test"})'); await wait(60);
  check(ev('BOTS.bot2.life') === l2 - 5 && ev('BOTS.bot.life') === l1, `Schaden an KI 2 trifft nur KI 2 (${l2} → ${ev('BOTS.bot2.life')})`);
  check(ev('Number(others.bot2.life)') === l2 - 5, 'Anzeige von KI 2 aktualisiert');
  // Angriff auf KI 3 mit eigener Kreatur
  ev('S.bf.push(Object.assign(newCard({n:"Riese", type:"Creature — Giant", o:"", pw:6, tg:6}), {sick:false})); commit()');
  ev('BOTS.bot3.bf.forEach(c => { if(isCreature(c)) c.tap = true; }); botChanged()');
  const l3 = ev('BOTS.bot3.life');
  ev('openAttackDialog("bot3")'); await wait(30);
  check(/Ziel/.test($('#modalBox').textContent) || !!d.querySelector('#modalBox select'), 'Angriffsfenster offen');
  { const cb = [...d.querySelectorAll('#modalBox input[type=checkbox]')].pop(); cb.checked = true; cb.onchange(); const sel = d.querySelector('#modalBox select'); if(sel){ sel.value = 'bot3'; sel.onchange(); } }
  await click('Angreifen'); await wait(400);
  check(ev('BOTS.bot3.life') === l3 - 6, `Angriff auf KI 3: 6 Schaden (${l3} → ${ev('BOTS.bot3.life')})`);
  // KI 2 scheidet aus und wird in der Zugfolge übersprungen
  ev('BOTS.bot2.life = 0; botChanged()');
  check(ev('turnIds().join()') === ev('[me.id, "bot", "bot3"].join()'), 'ausgeschiedene KI 2 wird in der Zugfolge übersprungen');
  check(/ausgeschieden/.test(d.querySelector('#opps').textContent), 'Anzeige: KI 2 «ausgeschieden»');
  // KI 3 entfernen
  ev('removeBot("bot3")'); await wait(30);
  check(ev('botIds().join()') === 'bot,bot2' && !ev('order.includes("bot3")') && !ev('others.bot3'), 'KI 3 entfernt');
  // Speichern und Laden
  check(ev('Object.keys(LS.get("kt-bots", {})).sort().join()').includes('bot2'), 'alle KI-Gegner werden gespeichert');
  // Alte Einzel-KI-Speicherung wird übernommen
  ev('LS.set("kt-bots", null); localStorage.removeItem("kt-bots")'); ev('LS.set("kt-bot", {active:true, deckName:"Alt", life:13})');
  check(ev('(() => { const m = botsLoad(); return m.bot && m.bot.deckName === "Alt" && m.bot.life === 13; })()'), 'gespeicherte einzelne KI aus älteren Versionen wird übernommen');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
