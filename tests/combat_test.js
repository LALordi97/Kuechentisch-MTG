const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const C = (n, type, o, x = {}) => ev('newCard')({n, type, o, img:null, ...x});
const btnT = t => [...d.querySelectorAll('#modalBox button')].find(b => b.textContent.trim().startsWith(t));
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()');
  ev('startBot("Test", "Test", Array(30).fill(0).map(() => ({n:"Island", type:"Basic Land — Island", o:""})))'); ev('injectBot(); commit()'); await wait(30);
  const S = () => ev('S');
  S().library.push(...Array(5).fill(0).map(() => C('Island', 'Basic Land — Island', '')));
  const frog = C('Psychic Frog', 'Creature — Frog', 'Whenever Psychic Frog deals combat damage to a player or planeswalker, draw a card.\nDiscard a card: Put a +1/+1 counter on Psychic Frog.', {pw:1, tg:3});
  const rag = C('Ragavan, Nimble Pilferer', 'Legendary Creature — Monkey Pirate', "Whenever Ragavan deals combat damage to a player, create a Treasure token and exile the top card of that player's library. Until end of turn, you may cast that card.\nDash {1}{R}", {pw:2, tg:1});
  const bear = C('Grizzly Bears', 'Creature — Bear', '', {pw:2, tg:2});
  S().bf.push(frog, rag, bear); ev('commit()');
  const h0 = S().hand.length, b0 = ev('BOT.life');
  ev('resolveCombat')([frog, rag, bear], new w.Map(), false); await wait(60);
  check(ev('BOT.life') === b0 - 5, `KI −5 (${ev('BOT.life')})`);
  check(S().hand.length === h0 + 1, 'Psychic Frog: Karte gezogen');
  check(S().bf.some(c => c.n === 'Treasure'), 'Ragavan: Treasure erzeugt');
  await wait(60);
  check(S().ex.some(c => c.ow && c.castKey) || ev('BOT.library.length') === 0, 'Ragavan: oberste Karte der KI im Exil und wirkbar');
  btnT('Erledigt') && btnT('Erledigt').click(); await wait(20);
  // geblockt: kein Auslöser
  const h1 = S().hand.length;
  const blocker = ev('newCard')({n:'Wall', type:'Creature — Wall', pw:0, tg:4});
  const bl = new w.Map([[frog.u, blocker]]);
  ev('resolveCombat')([frog], bl, false); await wait(40);
  check(S().hand.length === h1, 'Frog geblockt: kein Ziehen');
  // Cabbage Merchant: KI trifft dich
  const cab = C('The Cabbage Merchant', 'Legendary Creature — Human Citizen', 'Whenever an opponent casts a noncreature spell, create a Food token.\nWhenever a creature deals combat damage to you, sacrifice a Food token.\nTap two untapped Foods you control: Add one mana of any color.', {pw:2, tg:2});
  S().bf = [cab]; ev('for(let i=0;i<2;i++) S.bf.push(newCard({...LOCAL_TOKENS.food, tok:true})); commit()');
  const goblin = ev('newCard')({n:'Goblin Guide', type:'Creature — Goblin', pw:2, tg:2});
  ev('BOT.bf').push(goblin);
  ev('resolveCombat')([goblin], new w.Map(), true); await wait(40);
  if(d.querySelectorAll('#modalBox .card').length){ d.querySelector('#modalBox .card').click(); await wait(30); }
  check(S().bf.filter(c => c.n === 'Food').length === 1, 'Cabbage Merchant: KI trifft dich → 1 Food geopfert');
  // Menü: Frog hat keinen «Auslösen»-Eintrag mehr
  check(!ev('cardMenu')(frog, 'bf').some(i => /^Auslösen/.test(i.l || '')), 'Frog: Kampfauslöser läuft automatisch, kein Handeintrag');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
