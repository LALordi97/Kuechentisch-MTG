const {JSDOM} = require('jsdom'); const fs = require('fs'); const path = require('path');
let html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const SCH = JSON.parse(fs.readFileSync(path.join(__dirname, 'oracle_schemes.json'), 'utf8')).map(([name, type_line, oracle_text]) => ({name, type_line, oracle_text}));
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async u => /t%3Ascheme|t:scheme/.test(String(u)) ? {ok:true, json: async () => ({data:SCH, has_more:false})} : {ok:false, json: async () => ({})}; }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const click = async t => { const b = [...d.querySelectorAll('#modalBox button')].find(b => b.textContent.trim().startsWith(t)); if(b){ b.click(); await wait(40); } return !!b; };
const title = () => (d.querySelector('#modalBox h2') || {}).textContent || '';
const drain = async () => { for(let i = 0; i < 30; i++){ await wait(40); if($('#modal').hidden) return; if(!(await click('In Gang setzen')) && !(await click('Blocker bestätigen')) && !(await click('Später')) && !(await click('Keine')) && !(await click('Nichts')) && !(await click('Kein Ziel')) && !(await click('Erledigt'))) { if(await click('OK')) continue; } } };
const settle = async () => { for(let i = 0; i < 80; i++){ await wait(50); if($('#modal').hidden){ if(!ev('QDEPTH')) return; continue; }
  const bs = [...d.querySelectorAll('#modalBox button')].filter(b => b.textContent.trim() !== 'Schliessen'); const pref = bs.find(b => /^(In Gang setzen|Kein Ziel|Keine|Nichts|Erledigt|OK|Später|Nein)/.test(b.textContent.trim())) || bs[bs.length - 1]; if(pref) pref.click(); } };
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()'); ev('LOOK.autoPay = false');
  ev(`META_DECKS.Test=[{n:'Blau',p:'',s:'',l:'20 Island\\n20 Grizzly Bears'},{n:'Rot',p:'',s:'',l:'20 Mountain\\n20 Hill Giant'}]`);
  ev(`window.fetchCards = async (list) => ({deck: list.flatMap(e => Array(e.qty).fill(0).map(() => ({n:e.name, type: /Island|Mountain|Plains/.test(e.name) ? "Basic Land — " + e.name : "Creature — Bear", o:"", mc: /Island|Mountain|Plains/.test(e.name) ? "" : "{1}", cmc: /Island|Mountain|Plains/.test(e.name) ? 0 : 1, pw:2, tg:2}))), missing:[], netErr:false})`);
  ev('S.deck = Array(40).fill(0).map(() => ({n:"Plains", type:"Basic Land — Plains", o:""})); startGame()'); await wait(30);
  $('#bBot').click(); await wait(20);
  check(!!$('#bArchOn') && /Archenemy/.test($('#bArchOn').parentElement.textContent), 'KI-Dialog: Häkchen «Archenemy: Ich bin der Erzfeind»');
  $('#bFmt').innerHTML = '<option value="Test">Test</option>'; $('#bFmt').value = 'Test'; $('#bFmt').onchange();
  $('#bCount').value = '2'; $('#bCount').onchange(); $('#bArchOn').checked = true;
  // Komplott-Deck aus den echten Scryfall-Komplotten
  await ev('schemeDeckBuild().then(d => { window._sd = d; })'); await wait(50);
  check(ev('window._sd.length') === 20 && new Set(ev('window._sd.map(x => x.n)')).size === 20, 'Komplott-Deck mit 20 verschiedenen Komplotten');
  check(ev('window._sd.every(sc => !/Ongoing/.test(sc.o) && cardCheck(schemeAsSpell(sc)).status === "auto")'), `nur Komplotte, die die App ganz automatisch ausführt (${ev('ARCH.cache.filter(sc => cardCheck(schemeAsSpell(sc)).status === "auto").length')} von ${ev('ARCH.cache.length')})`);
  // Für den Spielablauf: nur zwei bekannte Komplotte, damit der Test nicht vom Zufall abhängt
  ev('ARCH.cache = ARCH.cache.filter(sc => sc.n === "I Delight in Your Convulsions" || sc.n === "The Mighty Will Fall")');
  $('#bGo').click(); await wait(400);
  check(ev('S.life') === 40, `ich habe 40 Leben (${ev('S.life')})`);
  check(ev('TURN.active === me.id'), 'der Erzfeind beginnt');
  check(!$('#bArch').hidden && /Komplotte \(2\)/.test($('#bArch').textContent), 'Knopf «Komplotte (2)» in der Leiste');
  // Erster Zug: Komplott wird automatisch in Gang gesetzt
  for(let i = 0; i < 20 && !/^Komplott:/.test(title()); i++) await wait(50);
  check(/^Komplott:/.test(title()), `zu Beginn meines ersten Zuges: Komplott-Fenster (${title()})`);
  await settle(); ev('S.arch.lastKey = turnKey()');
  console.log('   (erstes Komplott: ' + ev('S.arch.last && S.arch.last.n') + ')');
  check(ev('S.arch.n') === 1, 'ein Komplott wurde in Gang gesetzt');
  // Bestimmte Komplotte: «I Delight in Your Convulsions» (jeder Gegner verliert 3, ich gewinne so viel)
  const put = n => ev(`(() => { const i = S.arch.deck.findIndex(x => x.n === ${JSON.stringify(n)}); const sc = i >= 0 ? S.arch.deck.splice(i, 1)[0] : ARCH.cache.find(x => x.n === ${JSON.stringify(n)}); S.arch.deck.unshift(sc); })()`);
  ev('BOTS.bot.life = 20; BOTS.bot2.life = 20; S.life = 40; botChanged(); commit()');
  put('I Delight in Your Convulsions'); ev('queued(() => schemeMotion(true))'); await settle();
  check(ev('BOTS.bot.life') === 17 && ev('BOTS.bot2.life') === 17, `I Delight in Your Convulsions: jede KI verliert 3 (${ev('BOTS.bot.life')}/${ev('BOTS.bot2.life')})`);
  check(ev('S.life') === 46, `… und ich gewinne 6 Leben (${ev('S.life')})`);
  check(ev('S.arch.deck[S.arch.deck.length - 1].n') === 'I Delight in Your Convulsions', 'das Komplott kommt unter das Komplott-Deck');
  // «The Mighty Will Fall»: der Gegner mit den meisten Leben verliert 7
  ev('BOTS.bot2.life = 25; botChanged()');
  put('The Mighty Will Fall'); ev('queued(() => schemeMotion(true))'); await settle();
  check(ev('BOTS.bot2.life') === 18 && ev('BOTS.bot.life') === 17, `The Mighty Will Fall: KI 2 (meiste Leben) verliert 7 (${ev('BOTS.bot2.life')})`);
  // Team: die KI greifen sich bei Archenemy nicht an
  check(ev('withBot("bot2", () => botDefenders().map(x => x.id).join())') === ev('me.id'), 'die KI-Gegner sind ein Team: sie greifen nur mich an');
  // «Neues Spiel» mit Archenemy: wieder 40 Leben, Komplott-Deck neu, ich beginne
  ev('S.life = 11; BOTS.bot.life = 4; commit(); botChanged()');
  $('#bNew').click(); await settle();
  check(ev('S.life') >= 40 && ev('BOTS.bot.life') <= 20 && ev('BOTS.bot.hand.length + BOTS.bot.library.length') === 40, `Neues Spiel: ich 40 Leben, KI neu gestartet (${ev('S.life')}/${ev('BOTS.bot.life')})`);
  check(ev('TURN.active === me.id && TURN.n === 1') && ev('S.arch.n') === 1, 'Neues Spiel: der Erzfeind beginnt und setzt gleich wieder ein Komplott in Gang');
  // Archenemy über den Knopf beenden
  await settle(); $('#bArch').click(); await wait(30);
  check(/Komplott-Deck: 2 /.test($('#modalBox').textContent), 'Komplott-Fenster zeigt das Deck');
  await click('Archenemy beenden'); await wait(30);
  check(!ev('archOn()') && $('#bArch').hidden, 'Archenemy beendet, Knopf verschwindet');
  check(ev('withBot("bot2", () => botDefenders().length)') === 2, 'ohne Archenemy greifen sich die KI wieder gegenseitig an');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
