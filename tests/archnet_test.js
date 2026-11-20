// Komplotte eines Erzfeinds wirken auch bei menschlichen Mitspielern (Netz): Molten Realm genau, Bow, Bask, Imprison
// Mehrspieler-Test: drei JSDOM-Fenster, verbunden über eine nachgebaute PeerJS-Schicht
const {JSDOM} = require('jsdom'); const fs = require('fs');
const FILE = process.argv[2] || require('path').join(__dirname, '..', 'index.html');
let html = fs.readFileSync(FILE, 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const REG = new Map();
class Conn { constructor(){ this.h = {}; this.open = false; } on(e, f){ (this.h[e] = this.h[e] || []).push(f); } emit(e, ...a){ (this.h[e] || []).forEach(f => { try{ f(...a); }catch(err){ console.log('HANDLER-ERR', e, err.message); } }); }
  send(d){ const o = this.other; if(!this.open || !o || !o.open) return; const copy = JSON.parse(JSON.stringify(d)); setTimeout(() => o.emit('data', copy), 2); }
  close(){ if(!this.open) return; this.open = false; this.emit('close'); if(this.other && this.other.open){ this.other.open = false; this.other.emit('close'); } } }
class Peer { constructor(id){ this.id = id || ('anon' + Math.random().toString(36).slice(2, 8)); this.h = {}; this.destroyed = false; this.conns = [];
    setTimeout(() => { if(this.destroyed) return; if(REG.has(this.id)){ this.emit('error', {type:'unavailable-id'}); return; } REG.set(this.id, this); this.emit('open', this.id); }, 5); }
  on(e, f){ (this.h[e] = this.h[e] || []).push(f); } emit(e, ...a){ (this.h[e] || []).forEach(f => f(...a)); }
  connect(rid){ const a = new Conn(); this.conns.push(a);
    setTimeout(() => { const t = REG.get(rid); if(!t || t.destroyed){ this.emit('error', {type:'peer-unavailable'}); return; }
      const b = new Conn(); t.conns.push(b); a.other = b; b.other = a; a.open = b.open = true; t.emit('connection', b); a.emit('open'); b.emit('open'); }, 5);
    return a; }
  destroy(){ if(this.destroyed) return; this.destroyed = true; if(REG.get(this.id) === this) REG.delete(this.id); this.conns.forEach(c => c.close()); }
  reconnect(){} }
const CARDS = {
  'Mountain': {type_line:'Basic Land — Mountain', produced_mana:['R'], oracle_text:'({T}: Add {R}.)', cmc:0},
  'Island': {type_line:'Basic Land — Island', produced_mana:['U'], oracle_text:'({T}: Add {U}.)', cmc:0},
  'Grizzly Bears': {type_line:'Creature — Bear', power:'2', toughness:'2', mana_cost:'{1}{G}', cmc:2},
  'Hill Giant': {type_line:'Creature — Giant', power:'3', toughness:'3', mana_cost:'{3}{R}', cmc:4},
  'Counterspell': {type_line:'Instant', mana_cost:'{U}{U}', cmc:2, oracle_text:'Counter target spell.'},
  'Lightning Bolt': {type_line:'Instant', mana_cost:'{R}', cmc:1, oracle_text:'Lightning Bolt deals 3 damage to any target.'},
  'Phyrexian Arena': {type_line:'Enchantment', mana_cost:'{1}{B}{B}', cmc:3, oracle_text:'At the beginning of your upkeep, you draw a card and you lose 1 life.'},
};
function mkFetch(){ return async (u, o) => {
  if(/version\.json/.test(u)) return {ok:false, json:async()=>({})};
  const ids = JSON.parse(o.body).identifiers;
  return {ok:true, json: async () => ({data: ids.map((x, i) => ({name:x.name, set:'t', collector_number:String(i), keywords:[], oracle_text:'', image_uris:{normal:'https://cards.scryfall.io/normal/x.jpg'}, ...(CARDS[x.name] || {type_line:'Creature', power:'1', toughness:'1', cmc:1})}))})};
}; }
const wait = ms => new Promise(r => setTimeout(r, ms));
function mkWin(name){
  const dom = new JSDOM(html, {url:`https://example.org/${name}/`, runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = mkFetch(); w.Peer = Peer; }});
  const w = dom.window; w.addEventListener('error', e => console.log(`[${name}] ERR`, e.message));
  w._name = name; return w;
}
const $ = (w, s) => w.document.querySelector(s);
const ev = (w, code) => w.eval(code);
const btnText = (w, t, scope = '#modalBox') => [...w.document.querySelectorAll(scope + ' button')].find(b => b.textContent.trim() === t);
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const C = (w, n, type, o, x = {}) => ev(w, 'newCard')({n, type, o, img:null, ...x});
const click = async (w, t) => { const b = [...w.document.querySelectorAll('#modalBox button')].find(b => b.textContent.trim().startsWith(t)); if(b){ b.click(); await wait(30); } return !!b; };
let A, B;
const passB = async () => { await wait(60); const b = btnText(B, 'OK, weiter', '#stackBox'); if(b) b.click(); await wait(120); };
(async () => {
  A = mkWin('anna'); B = mkWin('ben');
  $(A, '#lName').value = 'Anna'; $(A, '#lHost').click(); await wait(80);
  $(B, '#lName').value = 'Ben'; $(B, '#lCode').value = ev(A, 'net.code'); $(B, '#lJoin').click(); await wait(150);
  for(const w of [A, B]){ ev(w, 'closeModal(); LOOK.autoPay = false'); }
  const aId = ev(A, 'me.id'), bId = ev(B, 'me.id');
  const SCH = JSON.parse(fs.readFileSync(require('path').join(__dirname, 'oracle_schemes.json'), 'utf8'));
  const sc = n => { const x = SCH.find(y => y[0] === n); return {n:x[0], o:x[2], ongoing:/Ongoing/.test(x[1]) || undefined}; };
  const setActive = (list, extra = '') => { A.__act = list; ev(A, `S.arch = {on:true, deck:[], n:0, last:null, active:window.__act.map(x => ({...newCard({n:x.n, type:"Ongoing Scheme", o:x.o, img:null}), chosenPid:x.chosenPid}))}; ${extra} commit()`); };
  // Approach My Molten Realm: Ben (Mitspieler) verursacht doppelten Schaden – genau, nicht doppelt verdoppelt
  ev(A, 'S.molten = true; S.life = 20; S.bf = []; commit()'); ev(B, 'S.life = 20; S.bf = []; commit()'); await wait(200);
  check(ev(B, 'moltenOn()') === true, 'Ben sieht Approach My Molten Realm von Anna');
  ev(B, `hitOpponent(${JSON.stringify(aId)}, {kind:"damage", amount:3, src:"Lightning Bolt"})`); await wait(250);
  check(ev(A, 'S.life') === 14, `Bens Blitz trifft Anna für 6 (Leben ${ev(A, 'S.life')})`);
  // Kampf: Bens 2/2 greift Anna an → 4 Schaden, nicht 8
  ev(B, `S.bf = [newCard({n:"Grizzly Bears", type:"Creature — Bear", pw:2, tg:2, img:null})]; commit()`); await wait(100);
  ev(B, `TURN = {active:${JSON.stringify(bId)}, n:7, starter:${JSON.stringify(aId)}, phase:3}; openAttackDialog()`); await wait(100);
  { const el = [...B.document.querySelectorAll('#modalBox .card')].find(e => e.textContent.includes('Grizzly')); if(el) el.click(); await wait(40); await click(B, 'Angreifen'); await wait(300); }
  for(let i = 0; i < 4 && !$(A, '#modal').hidden; i++){ if(!(await click(A, 'Blocker bestätigen'))) break; await wait(200); }
  await wait(300);
  check(ev(A, 'S.life') === 10, `Bens Bär trifft Anna für 4 (Leben ${ev(A, 'S.life')})`);
  // Anna (Erzfeindin) trifft Ben: weiterhin doppelt (einmal)
  ev(A, `hitOpponent(${JSON.stringify(bId)}, {kind:"damage", amount:2, src:"Shock"})`); await wait(250);
  check(ev(B, 'S.life') === 16, `Annas Schock trifft Ben für 4 (Leben ${ev(B, 'S.life')})`);
  ev(A, 'S.molten = false; commit()'); await wait(150);
  check(ev(B, 'moltenOn()') === false, 'Molten Realm endet auch bei Ben');
  // Bow to My Command: Ben kann Anna nicht angreifen
  setActive([{...sc('Bow to My Command'), chosenPid:bId}]); await wait(200);
  check(!ev(B, 'attackTargets()').includes(aId), `Bow to My Command: Anna ist für Ben kein Angriffsziel (${JSON.stringify(ev(B, 'attackTargets()'))})`);
  setActive([]); await wait(200);
  check(ev(B, 'attackTargets()').includes(aId), 'ohne Komplott wieder Angriffsziel');
  // I Bask in Your Silent Awe: zweiter Zauber pro Zug gesperrt
  setActive([sc('I Bask in Your Silent Awe')]); await wait(200);
  B.__c = C(B, 'Opt', 'Instant', 'Scry 1.', {mc:'{U}', cmc:1});
  ev(B, `TURN = {active:${JSON.stringify(bId)}, n:9, starter:${JSON.stringify(aId)}, phase:2}; S.spellsCast = 0`);
  const w0 = await ev(B, 'castWarn(window.__c, "hand")'); await wait(80); const m0 = !$(B, '#modal').hidden && /Bask/.test($(B, '#modalBox').textContent);
  if(!$(B, '#modal').hidden) await click(B, 'Abbrechen');
  ev(B, 'noteSpellCast()');
  const pr = ev(B, 'castWarn(window.__c, "hand")'); await wait(120); const m1 = !$(B, '#modal').hidden && /Bask/.test($(B, '#modalBox').textContent);
  if(!$(B, '#modal').hidden){ await click(B, 'Abbrechen'); await click(B, 'Nicht'); await click(B, 'Nein'); } await wait(60);
  check(!m0 && m1, `I Bask in Your Silent Awe: erster Zauber frei, zweiter mit Warnung (${m0}/${m1})`);
  // Imprison This Insolent Wretch: Bens bleibende Karten enttappen nicht
  setActive([{...sc('Imprison This Insolent Wretch'), chosenPid:bId}]); await wait(200);
  ev(B, `S.bf = [newCard({n:"Island", type:"Basic Land — Island", o:"", img:null})]; S.bf[0].tap = true; commit()`); await wait(80);
  ev(B, `TURN = {active:${JSON.stringify(bId)}, n:11, starter:${JSON.stringify(aId)}, phase:0}; onMyTurnStart()`); await wait(150);
  check(ev(B, 'S.bf[0].tap') === true, 'Imprison: Bens Insel bleibt getappt');
  setActive([]); await wait(200); ev(B, 'onMyTurnStart()'); await wait(150);
  check(ev(B, 'S.bf[0].tap') === false, 'ohne Komplott enttappt sie wieder');
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
