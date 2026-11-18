// Regeltreue aus Lukas' Partie vom 16.11.: Gegenzauber der KI, Silence, Ohne-Mana-Wirken, Mulligan, Commander, Fetchländer, 0 Leben
const {JSDOM} = require('jsdom'); const fs = require('fs'); const path = require('path');
let html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const CARDS = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(__dirname, 'legal_cards.json'), 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const click = async t => { const b = [...d.querySelectorAll('#modalBox button')].find(b => b.textContent.trim().startsWith(t)); if(b){ b.click(); await wait(40); } return !!b; };
const btns = () => [...d.querySelectorAll('#modalBox button')].map(b => b.textContent.trim());
const C = (n, x = {}) => { w.__t = {...CARDS[n], img:null, ...x}; return ev('newCard(window.__t)'); };
const N = (n, type, o, x = {}) => { w.__t = {n, type, o, img:null, ...x}; return ev('newCard(window.__t)'); };
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()'); ev('LOOK.autoPay = false');
  ev('S.deck = Array(40).fill(0).map(() => ({n:"Mountain", type:"Basic Land — Mountain", o:""})); startGame()');
  ev('startBot("Test", "Test", Array(40).fill(0).map(() => ({n:"Island", type:"Basic Land — Island", o:""}))); botChanged()');
  const etali = C('Etali, Primal Conqueror // Etali, Primal Sickness');
  const cm = (n, sp) => ev('counterMatch')(C(n), sp);
  // Gegenzauber
  check(!cm('Mental Misstep', etali) && cm('Mental Misstep', N('Bolt', 'Instant', '', {mc:'{R}', cmc:1})), 'Mental Misstep kontert nur Zauber mit Manawert 1 (nicht Etali)');
  check(!cm('Pyroblast', etali) && cm('Pyroblast', N('Brainstorm', 'Instant', '', {mc:'{U}', cmc:1})), 'Pyroblast kontert nur blaue Zauber (nicht den roten Etali)');
  check(!cm('Red Elemental Blast', etali), 'Red Elemental Blast kontert Etali nicht');
  check(cm('Pact of Negation', etali) && cm('Flusterstorm', N('Capstone', 'Sorcery', '', {mc:'{5}{R}{R}', cmc:7})) && !cm('Flusterstorm', etali), 'Pact of Negation kontert alles, Flusterstorm nur Spontanzauber/Hexereien');
  // Silence: die KI darf diesen Zug nichts wirken
  ev('BOT.hand = [newCard({...window.__p = ' + JSON.stringify({...CARDS['Pact of Negation'], img:null}) + '})]; botChanged()');
  ev('S.locks = [{key:turnKey(), noncreature:false, pid:null, src:"Silence"}]');
  check(await ev('botChooseCounter')(etali) === null, 'nach Silence kontert die KI nicht (Pact of Negation bleibt auf der Hand)');
  ev('S.locks = []');
  check(!!(await ev('botChooseCounter')(etali)), 'ohne Silence würde sie mit Pact of Negation kontern');
  // Flusterstorm: Spieler darf {1} zahlen
  ev('BOT.hand = [newCard(' + JSON.stringify({...CARDS['Flusterstorm'], img:null}) + '), newCard({n:"Island", type:"Basic Land — Island", o:""})]; BOT.bf = [newCard({n:"Island", type:"Basic Land — Island", o:""})]; botChanged()');
  ev('S.pool = emptyPoolObj(); S.pool.R = 1; commit()');
  const cap = N('Improvisation Capstone', 'Sorcery', 'Exile cards from the top of your library.', {mc:'{5}{R}{R}', cmc:7});
  const pr = ev('botsRespond')(cap); await wait(150);
  check(/Flusterstorm: \{1\} zahlen\?/.test((d.querySelector('#modalBox h2') || {}).textContent || ''), 'Flusterstorm: Frage «{1} zahlen?»');
  await click('{1} zahlen'); const res = await pr;
  check(res === false && ev('S.pool.R') === 0, 'bezahlt: Improvisation Capstone wird nicht gekontert');
  // Ohne Mana wirken nur mit alternativen Kosten
  check(!ev('hasAltCost')(etali) && ev('hasAltCost')(C('Force of Will')) && ev('hasAltCost')(C('Pact of Negation')), '«Ohne Mana wirken» nur bei alternativen Kosten (Force of Will, Pact), nicht bei Etali');
  { const p = ev('shortDialog')(etali, {missing:['{7}'], fromCz:false}); await wait(30);
    check(!btns().includes('Ohne Mana wirken') && /keine alternativen Kosten/.test($('#modalBox').textContent), 'Etali bei zu wenig Mana: kein «Ohne Mana wirken»');
    await click('Abbrechen'); await p; }
  // Commander gekontert → Kommandozone
  w.__e = {...CARDS['Etali, Primal Conqueror // Etali, Primal Sickness'], img:null, cmdr:true, pw:7, tg:7}; ev('S.cz.push(window._et = newCard(window.__e)); commit()');
  ev('BOT.hand = [newCard(' + JSON.stringify({...CARDS['Pact of Negation'], img:null}) + ')]; botChanged()');
  ev('S.pool = emptyPoolObj(); S.pool.R = 7; commit()');
  { const u = ev('window._et.u'); ev('play')(u); await wait(250);
    check(ev('S.cz.includes(window._et)') && /kehrt in die Kommandozone zurück/.test($('#log').textContent), `gekonterter Commander kommt in die Kommandozone (${ev('findCard(window._et.u) && findCard(window._et.u).z')})`); }
  // Mulligan nur vor dem ersten Zug
  ev('S.turn = 2; commit()'); const h = ev('S.hand.length'); ev('mulligan()');
  check(ev('S.hand.length') === h && !/nimmt einen Mulligan/.test($('#log').textContent.slice(-200)), 'kein Mulligan mehr im zweiten Zug');
  // Fetchland der KI wird geknackt
  ev('BOT.landPlayed = false; BOT.bf = []; BOT.life = 20; BOT.hand = [newCard(' + JSON.stringify({...CARDS['Misty Rainforest'], img:null}) + ')]; BOT.library = [newCard({n:"Forest", type:"Basic Land — Forest", o:""}), newCard({n:"Swamp", type:"Basic Land — Swamp", o:""})]');
  ev('botPlayLand()');
  check(ev('BOT.bf.map(c => c.n).join()') === 'Forest' && ev('BOT.gy.some(c => c.n === "Misty Rainforest")') && ev('BOT.life') === 19, `KI knackt Misty Rainforest (1 Leben) und holt einen Forest (${ev('BOT.bf.map(c => c.n).join()')})`);
  check(ev('srcColors')(C('Misty Rainforest')).join() === 'C', 'ein ungeknacktes Fetchland zählt nicht als Quelle für Grün/Blau');
  // 0 Leben: verloren
  ev('S.life = -3; commit()');
  check(/hat -3 Leben und verliert das Spiel/.test($('#log').textContent), 'mit -3 Leben ist das Spiel sofort verloren');
  // Von Hand verschoben: keine «Endlosschleife»
  ev('S.life = 20; S.lostAnnounced = false; LOOP.key = null; S.bf = []; S.gy = []; commit()');
  const k = N('Testzauber', 'Creature — Giant', '', {mc:'', cmc:0, pw:1, tg:1}); ev('S.hand.push(window.__k = ' + 'newCard({n:"Testzauber", type:"Sorcery", o:"", mc:"", cmc:0})); commit()');
  for(let i = 0; i < 3; i++){ ev('S.spellsCast = (spellsThisTurn() || 0) + 1; manualMove(window.__k.u, "gy"); manualMove(window.__k.u, "hand")'); }
  check(!ev('LOOP.found'), 'Karte von Hand zwischen Friedhof und Hand verschoben: keine Endlosschleife');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
