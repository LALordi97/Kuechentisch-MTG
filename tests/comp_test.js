const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()');
  const S = ev('S');
  // Parser
  const pd = ev('parseDeck')('4 Island\n\nSideboard\n2 Duress\n\nCompanion\n1 Lurrus of the Dream-Den');
  const lur = pd.find(e => /Lurrus/.test(e.name));
  check(lur && lur.comp && lur.sb && !lur.cmdr, `Abschnitt «Companion» wird Begleiter, kein Commander: ${JSON.stringify(lur)}`);
  const lurT = {n:'Lurrus of the Dream-Den', type:'Legendary Creature — Cat Nightmare', mc:'{1}{W/B}{W/B}', cmc:3, pw:3, tg:2, o:'Companion — Each permanent card in your starting deck has mana value 2 or less. (If this card is your chosen companion, you may put it into your hand from outside the game for {3} any time you could cast a sorcery.)\nLifelink\nDuring each of your turns, you may cast one permanent spell with mana value 2 or less from your graveyard.'};
  const isl = {n:'Island', type:'Basic Land — Island', o:''};
  // 60-Karten-Deck, Begleiter im Sideboard
  S.deck = [...Array(60).fill(0).map(() => ({...isl})), {...lurT, sb:true}, ...Array(14).fill(0).map(() => ({n:'Duress', type:'Sorcery', o:'', sb:true}))];
  ev('startGame()'); await wait(10);
  check(S.companion && S.companion.n === lurT.n && S.life === 20 && !S.cz.length, 'Begleiter ausserhalb des Spiels, 20 Leben, keine Kommandozone');
  check(!$('#bComp').hidden && /Lurrus/.test($('#bComp').textContent), `Knopf bei der Hand: «${$('#bComp').textContent}»`);
  check(/zeigt Begleiter Lurrus.*mana value 2 or less/.test($('#log').textContent), 'Begleiter wird mit Bedingung im Log gezeigt');
  check(ev('pub()').companion === lurT.n, 'Mitspieler sehen den Begleiter');
  // Altes gespeichertes Deck: Begleiter als Commander markiert
  S.deck = [...Array(60).fill(0).map(() => ({...isl})), {...lurT, cmdr:true}];
  ev('startGame()'); await wait(10);
  check(S.companion && !S.cz.length && S.life === 20, 'Alte Liste (Lurrus als Commander im 60er-Deck): als Begleiter erkannt');
  // Commander-Deck: Lurrus als echter Commander bleibt Commander
  S.deck = [...Array(99).fill(0).map(() => ({...isl})), {...lurT, cmdr:true}];
  ev('startGame()'); await wait(10);
  check(!S.companion && S.cz.length === 1 && S.life === 40, 'Commander-Deck mit Lurrus als Commander: bleibt Commander');
  // Auf die Hand nehmen
  S.deck = [...Array(60).fill(0).map(() => ({...isl, o:'({T}: Add {U}.)'})), {...lurT, sb:true}];
  ev('startGame()'); await wait(10);
  ev('TURN.active = me.id; TURN.phase = 3'); 
  await ev('companionToHand()'); await wait(5);
  check(S.companion && /Hauptphase/.test($('#toast').textContent), 'Im Kampf: geht nicht, Hinweis');
  ev('TURN.phase = 2');
  ['a','b','c'].forEach(() => { const c = S.hand.find(x => x.n === 'Island'); S.hand.splice(S.hand.indexOf(c), 1); S.bf.push(c); });
  ev('LOOK.autoPay = true; commit()');
  await ev('companionToHand()'); await wait(5);
  check(!S.companion && S.hand.some(c => c.n === lurT.n) && S.bf.filter(c => c.tap).length === 3, 'Hauptphase: 3 Länder getappt, Lurrus auf der Hand');
  check($('#bComp').hidden, 'Knopf verschwindet danach');
  // Zu wenig Mana: Abbrechen
  S.deck = [...Array(60).fill(0).map(() => ({...isl})), {...lurT, sb:true}];
  ev('startGame(); TURN.active = null'); await wait(10);
  const p = ev('companionToHand()'); await wait(10);
  [...d.querySelectorAll('#modalBox button')].find(b => b.textContent === 'Abbrechen').click(); await p;
  check(S.companion && !S.hand.some(c => c.n === lurT.n), 'Zu wenig Mana, Abbrechen: Begleiter bleibt draussen');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
