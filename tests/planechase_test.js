// Planechase Etappe 1: Ebenen-Deck, Planar-Würfel (Kosten, Chaos, Planeswalk), Dauereffekte und Auslöser der Ebene
// Die Ebenen hier sind erfundene Testkarten (kein echter Kartentext); echte Ebenen lädt die App von Scryfall.
const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const open = () => !$('#modal').hidden;
const click = async t => { const b = [...d.querySelectorAll('#modalBox button')].find(b => b.textContent.trim().startsWith(t)); if(b){ b.click(); await wait(40); } return !!b; };
const PLANES = [
  {n:'Testebene A', type:'Plane — Testwelt', o:'Creatures you control get +1/+1 and have trample.\nWhenever chaos ensues, draw a card.'},
  {n:'Testebene B', type:'Plane — Testwelt', o:'When you planeswalk to Testebene B, you gain 3 life.\nWhenever chaos ensues, you gain 1 life.'},
  {n:'Testebene C', type:'Plane — Testwelt', o:'Whenever chaos ensues, draw a card.'},
];
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()'); ev('LOOK.autoPay = true');
  ev('S.bf = []; S.hand = []; S.life = 20; S.library = Array(20).fill(0).map(() => newCard({n:"Swamp", type:"Basic Land — Swamp", o:"", img:null})); TURN = {active:me.id, n:3, starter:me.id, phase:2}; commit()');
  w.__pl = PLANES;
  for(const pl of PLANES){ w.__p = pl; check(ev('cardCheck(planeAsCard(window.__p)).status') === 'auto', `${pl.n}: automatisch`); }
  ev('planeStart(window.__pl)'); await wait(50);
  check(ev('S.plane.cur.n') === 'Testebene A' && ev('S.plane.deck.length') === 2, 'erste Ebene liegt offen');
  check(!$('#bPlane').hidden && /Testebene A/.test($('#bPlane').textContent), `Knopf «Ebene» sichtbar (${$('#bPlane').textContent})`);
  // Dauereffekt der Ebene
  w.__cr = ev('newCard({n:"Bär", type:"Creature — Bear", o:"", pw:2, tg:2, img:null})'); ev('S.bf.push(window.__cr); commit()');
  check(ev('power(window.__cr)') === 3 && ev('kwHas(window.__cr, "trample")'), `Ebene A: Kreaturen +1/+1 und Trampelschaden (${ev('power(window.__cr)')})`);
  // Würfel: Chaos
  w.Math.random = () => 0.0; const h0 = ev('S.hand.length'); let f = await ev('planeRoll()'); await wait(200);
  check(f === 'chaos' && ev('S.hand.length') === h0 + 1, `Chaos: Ebene A zieht eine Karte (${f}, Hand ${ev('S.hand.length')})`);
  // zweiter Wurf kostet {1}
  check(ev('planeRollCost()') === 1, 'zweiter Wurf kostet {1}');
  ev('S.bf.push(newCard({n:"Swamp", type:"Basic Land — Swamp", o:"", img:null})); commit()');
  w.Math.random = () => 0.4; f = await ev('planeRoll()'); await wait(150);
  check(f === 'blank' && ev('S.bf.find(c => c.n === "Swamp").tap') && ev('planeRollCost()') === 2, `leerer Wurf, Swamp für {1} getappt, nächster kostet {2} (${f})`);
  // Planeswalk
  w.Math.random = () => 0.99; const l0 = ev('S.life'); ev('S.pool = emptyPoolObj(); S.pool.B = 2'); f = await ev('planeRoll()'); await wait(250);
  check(f === 'walk' && ev('S.plane.cur.n') === 'Testebene B' && ev('S.plane.deck[S.plane.deck.length - 1].n') === 'Testebene A', `Planeswalk zu Ebene B, A unter das Deck (${ev('S.plane.cur.n')})`);
  check(ev('S.life') === l0 + 3, `Ebene B: «When you planeswalk to» → 3 Leben (${ev('S.life')})`);
  check(ev('power(window.__cr)') === 2, 'Ebene A wirkt nicht mehr');
  // neuer Zug: Würfel wieder gratis; nur im eigenen Zug
  ev('TURN = {active:me.id, n:5, starter:me.id, phase:2}'); check(ev('planeRollCost()') === 0, 'neuer Zug: erster Wurf wieder gratis');
  ev('TURN = {active:"x", n:6, starter:me.id, phase:2}'); f = await ev('planeRoll()'); check(f === undefined, 'nicht im fremden Zug');
  w.Math.random = Math.random;
  // Komplotte bleiben unberührt: schemeAbandon arbeitet auf S.arch.active
  ev('S.arch = {on:true, deck:[], n:0, last:null, active:[newCard({n:"Komplott", type:"Ongoing Scheme", o:"", img:null})]}');
  check(ev('archActive().length') === 2 && ev('schemeAbandon(S.arch.active[0])') && ev('S.arch.active.length') === 0 && ev('archActive().length') === 1, 'laufende Komplotte und Ebene nebeneinander');
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
