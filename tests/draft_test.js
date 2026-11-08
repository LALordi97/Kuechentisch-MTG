const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const COLS = ['W', 'U', 'B', 'R', 'G'];
const fake = Array.from({length:80}, (_, i) => { const k = COLS[i % 5]; const r = i < 4 ? 'mythic' : i < 16 ? 'rare' : i < 36 ? 'uncommon' : 'common';
  return {object:'card', name:`Testkarte ${i}`, rarity:r, set:'tst', collector_number:String(i), type_line: i % 3 ? 'Creature — Bear' : 'Instant', cmc:1 + i % 6, mana_cost:`{${1 + i % 4}}{${k}}`, colors:[k], oracle_text: i % 7 ? '' : 'Destroy target creature.', power: i % 3 ? '2' : undefined, toughness: i % 3 ? '2' : undefined, keywords:[]}; });
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async (u) => {
  u = String(u);
  if(/\/sets$/.test(u)) return {ok:true, json: async () => ({data:[{code:'tst', name:'Testedition', released_at:'2024-01-01', set_type:'expansion', card_count:200, digital:false}]})};
  if(/\/cards\/search/.test(u)) return {ok:true, json: async () => ({data:fake, has_more:false})};
  return {ok:false, json: async () => ({})}; }; }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const lb = t => [...d.querySelectorAll('#limBox button')].find(b => b.textContent.trim().startsWith(t));
const click = async t => { const b = lb(t); if(b){ b.click(); await wait(60); } return !!b; };
(async () => {
  $('#lName').value = 'Lukas';
  check(d.querySelectorAll('#lMode button').length === 3, 'Startbildschirm: Auswahl Normal / Draft / Sealed');
  [...d.querySelectorAll('#lMode button')].find(b => b.dataset.m === 'draft').click();
  check(/Booster/.test($('#lModeTxt').textContent), 'Draft gewählt: Erklärung erscheint');
  $('#lSolo').click(); await wait(400);
  check(!$('#limit').hidden && /Draft oder Sealed starten/.test($('#limBox').textContent), 'nach dem Start öffnet sich die Draft-Einrichtung');
  check($('#limSet').value === 'tst', 'Edition aus Scryfall geladen');
  d.querySelector('#limSeats').value = '8';
  await click('Starten'); await wait(800);
  check(/Runde 1 von 3 · Pick 1/.test($('#limBox').textContent), 'erstes Booster: Runde 1, Pick 1');
  check(d.querySelectorAll('#limBox .limgrid .card').length === 14, 'Booster hat 14 Karten');
  let picks = 0;
  for(let i = 0; i < 60; i++){
    const g = d.querySelector('#limBox .limgrid .card'); if(!g){ await wait(120); if(ev('DB')) break; continue; }
    g.click(); await wait(20); await click('Nehmen'); picks++; await wait(120);
  }
  check(picks === 42, `42 Picks gemacht (${picks})`);
  check(ev('DB && DB.pool.length') === 42, 'Pool mit 42 Karten im Deckbau');
  const k = ev('dbCounts()'); check(k.total === 40 && k.lands === 17, `Vorschlag: 40 Karten, 17 Länder (${k.total}/${k.lands})`);
  check(ev('LIM.botPools.length') === 7 && ev('LIM.botPools.every(b => b.pool.length === 42)'), '7 KI-Plätze mit je 42 Karten');
  // Karte aus dem Deck nehmen und wieder hinein
  const before = ev('DB.main.size'); d.querySelector('#limBox .limcurve .card').click(); await wait(40);
  check(ev('DB.main.size') === before - 1, 'Karte im Deck antippen: zurück in den Pool');
  d.querySelector('#limBox .limpool .card').click(); await wait(40);
  check(ev('DB.main.size') === before, 'Karte im Pool antippen: ins Deck');
  await click('Gegen eine Draft-KI'); await wait(200);
  const kb = [...d.querySelectorAll('#modalBox button')].find(b => /^KI \d/.test(b.textContent)); if(kb){ kb.click(); await wait(300); }
  check($('#limit').hidden && ev('S.deck.filter(c => !c.sb).length') === 40 && ev('S.hand.length') === 7, 'Spiel startet mit dem Draft-Deck (7 Handkarten)');
  check(ev('BOT.active && BOT.format === "Limited" && BOT.library.length + BOT.hand.length === 40'), 'KI spielt ihr eigenes Draft-Deck (40 Karten)');
  check(ev('S.deck.filter(c => c.sb).length') === 19, 'restliche Karten im Sideboard');
  // Sealed
  ev('DB = null'); ev('limOpenSetup("sealed")'); await wait(300);
  check(!$('#limSealedOpts').hidden, 'Sealed-Optionen sichtbar');
  await click('Starten'); await wait(500);
  check(ev('DB && DB.mode === "sealed" && DB.pool.length === 84'), 'Sealed: 6 Booster = 84 Karten im Pool');
  // gespeichert
  ev('DB = null'); check(ev('limLoadSaved()') && ev('DB.pool.length') === 84, 'Pool bleibt gespeichert und lässt sich wieder öffnen');
  // Mehrspieler-Ablauf auf Gastgeber-Ebene: zwei Menschen, Pick kommt per Nachricht
  ev('DB = null; DR = {on:false}');
  ev('net.role = "host"; net.players = {p2:{name:"Alex"}}; net.order = [me.id, "p2"]');
  const sent = []; ev('net.conns = [{_pid:"p2", open:true, send:m => window._sent.push(m)}]'); w._sent = sent;
  await ev('limStart({mode:"draft", set:"tst", setName:"Testedition", seats:4, rounds:1})'); await wait(300);
  const pk = sent.filter(m => m.op === 'pack').pop();
  check(sent.some(m => m.op === 'start') && pk && pk.cards.length === 14, 'Mitspieler bekommt Start und sein Booster');
  ev(`drHostRecv({t:"draft", op:"pick", from:"p2", packId:${JSON.stringify(pk.packId)}, pu:${JSON.stringify(pk.cards[0].pu)}})`); await wait(200);
  check(ev('DH.seats.find(s => s.id === "p2").pool.length') === 1, 'Pick des Mitspielers kommt beim Gastgeber an');
  ev('net.players.p2.off = true; limCheckOff()'); await wait(400);
  check(ev('DH.seats.find(s => s.id === "p2").bot'), 'Wer die Verbindung verliert, wird durch die KI ersetzt');
  ev('net.role = "solo"; net.conns = []; net.players = {}; net.order = []');
  console.log(fails ? `\n${fails} FEHLER` : "\nALLES OK"); process.exit(0);
})();
