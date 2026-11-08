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
  const T = (n, type, o) => ({n, type, o});
  const ley = T('Leyline of Sanctity', 'Enchantment', 'If Leyline of Sanctity is in your opening hand, you may begin the game with it on the battlefield.\nYou have hexproof.');
  const gem = T('Gemstone Caverns', 'Legendary Snow Land', "If Gemstone Caverns is in your opening hand and you're not the starting player, you may begin the game with Gemstone Caverns on the battlefield with a luck counter on it. If you do, exile a card from your hand.\n{T}: Add {C}. If Gemstone Caverns has a luck counter on it, instead add one mana of any color.");
  const chan = T('Chancellor of the Annex', 'Creature — Phyrexian Angel', 'Flying\nYou may reveal this card from your opening hand. If you do, when each opponent casts their first spell of the game, counter that spell unless that player pays {1}.\nWhenever an opponent casts a spell, counter it unless that player pays {1}.');
  const powder = T('Serum Powder', 'Artifact', '{T}: Add {C}.\nAny time you could mulligan and Serum Powder is in your hand, you may exile all the cards from your hand, then draw that many cards.');
  const filler = T('Island', 'Basic Land — Island', '({T}: Add {U}.)');
  ev('pregameKind') ;
  const k = x => JSON.stringify(ev('pregameKind')(ev('newCard')(x)));
  check(/"begin"/.test(k(ley)) && /false/.test(k(ley)), `Leyline: ${k(ley)}`);
  check(/"begin".*"notFirst":true.*"counter":"luck".*"exile":true/.test(k(gem)), `Gemstone Caverns: ${k(gem)}`);
  check(/"reveal"/.test(k(chan)), `Chancellor: ${k(chan)}`); check(!/Whenever/.test(k(chan)), 'Chancellor: nur der Starthand-Effekt');
  check(/"powder"/.test(k(powder)), `Serum Powder: ${k(powder)}`);
  check(ev('pregameKind')(ev('newCard')(filler)) === null, 'Island: keine Vor-Spiel-Aktion');
  // Spiel mit fester Starthand
  S.deck = [ley, gem, chan, powder, ...Array(30).fill(filler)];
  ev('startGame()'); await wait(10);
  S.library.push(...S.hand); S.hand = [];
  for(const n of ['Leyline of Sanctity','Gemstone Caverns','Chancellor of the Annex','Serum Powder']){ const i = S.library.findIndex(c => c.n === n); S.hand.push(S.library.splice(i,1)[0]); }
  S.hand.push(...S.library.splice(0, 3)); ev('commit()'); await wait(10);
  const bar = $('#pregame');
  const labels = () => [...bar.querySelectorAll('button')].map(b => b.textContent + (b.disabled ? ' [aus]' : ''));
  check(!bar.hidden && labels().length === 5, `Leiste über der Hand: ${labels().join(' | ')}`);
  // Ich beginne: Caverns gesperrt
  ev('TURN.starter = me.id'); ev('commit()'); await wait(5);
  check(labels().some(l => /Gemstone.*\[aus\]/.test(l)), 'Wer beginnt, kann Gemstone Caverns nicht legen');
  ev('TURN.starter = "x"'); ev('commit()'); await wait(5);
  // Leyline
  [...bar.querySelectorAll('button')].find(b => /Leyline/.test(b.textContent)).click(); await wait(5);
  check(S.bf.some(c => c.n === 'Leyline of Sanctity') && !S.hand.some(c => c.n === 'Leyline of Sanctity'), 'Leyline liegt im Spiel');
  // Caverns
  [...bar.querySelectorAll('button')].find(b => /Gemstone/.test(b.textContent)).click(); await wait(5);
  const cav = S.bf.find(c => c.n === 'Gemstone Caverns');
  check(cav && cav.c === 1, 'Gemstone Caverns im Spiel mit Glücksmarke');
  check(/ins Exil/.test($('#modalBox').textContent), 'Dialog: Karte aus der Hand exilen');
  const handN = S.hand.length;
  [...d.querySelectorAll('#modalBox .card')].pop().click(); await wait(5);
  check(S.hand.length === handN - 1 && S.ex.length === 1, `exiliert: ${S.ex.map(c => c.n).join(', ')}`);
  const opts = ev('manaChoices')(cav).map(o => o.add.join(''));
  check(opts.join(',') === 'W,U,B,R,G', `Caverns mit Marke gibt jede Farbe: ${opts}`);
  cav.c = 0; check(ev('manaChoices')(cav).map(o => o.add.join('')).join(',') === 'C', 'ohne Marke nur {C}');
  cav.c = 1;
  // Chancellor zeigen
  const cb = [...bar.querySelectorAll('button')].find(b => /Chancellor/.test(b.textContent));
  if(cb){ cb.click(); await wait(5); }
  check(S.pregameRev.length === 1 && /gezeigt/.test(labels().join()), 'Chancellor gezeigt und vermerkt');
  // Serum Powder
  const pb = [...bar.querySelectorAll('button')].find(b => /Serum Powder/.test(b.textContent));
  if(pb){ const n = S.hand.length, exN = S.ex.length; pb.click(); await wait(5); check(S.hand.length === n && S.ex.length === exN + n, `Serum Powder: ${n} exiliert, ${S.hand.length} neu gezogen`); }
  else check(false, 'Serum-Powder-Knopf fehlt');
  // Erster Zug: Erinnerung, Leiste weg
  ev('TURN.active = me.id; onMyTurnStart()'); await wait(10);
  check(bar.hidden, 'Leiste verschwindet mit dem ersten Zug');
  check(/Starthand: Chancellor/.test($('#log').textContent), 'Erinnerung an Chancellor im ersten Zug');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
