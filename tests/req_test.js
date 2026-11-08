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
const cardsIn = w => [...w.document.querySelectorAll('#modalBox .card')];
(async () => {
  A = mkWin('anna'); B = mkWin('ben');
  $(A, '#lName').value = 'Anna'; $(A, '#lHost').click(); await wait(80);
  $(B, '#lName').value = 'Ben'; $(B, '#lCode').value = ev(A, 'net.code'); $(B, '#lJoin').click(); await wait(150);
  for(const w of [A, B]){ ev(w, 'closeModal(); LOOK.autoPay = false'); }
  // Ben hat 3 Karten auf der Hand
  ev(B, `S.hand = [newCard({n:"Island", type:"Basic Land — Island", o:""}), newCard({n:"Counterspell", type:"Instant", mc:"{U}{U}", cmc:2}), newCard({n:"Hill Giant", type:"Creature — Giant", mc:"{3}{R}", cmc:4, pw:3, tg:3})]; commit()`); await wait(80);
  // 1. Thoughtseize
  const ts = C(A, 'Thoughtseize', 'Sorcery', 'Target player reveals their hand. You choose a nonland card from it. That player discards that card. You lose 2 life.', {mc:'{B}', cmc:1});
  ev(A, 'S').hand.push(ts); ev(A, 'commit()');
  const pa = ev(A, 'castSpell')(ts.u); await passB();
  await click(A, 'Ben'); await wait(120);
  const shown = cardsIn(A);
  check(shown.length === 3 && /Hand von Ben/.test($(A, '#modalBox h2').textContent), `Anna sieht Bens Hand (${shown.length} Karten)`);
  check(shown.filter(e => e.style.opacity === '0.4').length === 1, 'das Land ist nicht wählbar (nonland)');
  check(/sieht deine Hand/.test($(B, '#toast').textContent), 'Ben bekommt den Hinweis');
  shown.find(e => /Counterspell/.test(e.textContent)).click(); await wait(150); 
  check(!ev(B, 'S.hand.some(c => c.n === "Counterspell")') && ev(B, 'S.gy.some(c => c.n === "Counterspell")'), 'Counterspell bei Ben abgeworfen');
  check(ev(A, 'S.life') === 18, 'Anna verliert 2 Leben');
  // 2. Mind Rot: Ben wählt selbst
  const mr = C(A, 'Mind Rot', 'Sorcery', 'Target player discards two cards.', {mc:'{2}{B}', cmc:3});
  ev(A, 'S').hand.push(mr); ev(A, 'commit()');
  ev(B, `S.hand.push(newCard({n:"Opt", type:"Instant", o:""})); commit()`); await wait(60);
  const pm = ev(A, 'castSpell')(mr.u); await passB();
  await click(A, 'Ben'); await wait(150);
  check(/wirf 2 Karte/.test(($(B, '#modalBox h2') || {}).textContent || ''), 'Ben bekommt ein Fenster: 2 Karten abwerfen');
  cardsIn(B)[0].click(); await wait(20); cardsIn(B)[1].click(); await wait(20); await click(B, 'Fertig'); await wait(150); 
  check(ev(B, 'S.hand.length') === 1 && ev(B, 'S.gy.length') === 3, `Ben hat 2 abgeworfen (Hand ${ev(B, 'S.hand.length')})`);
  check(/Ben hat .+ abgeworfen/.test($(A, '#log').textContent), 'Anna sieht im Log, was Ben abgeworfen hat');
  // 3. Edikt: Ben wählt, was er opfert
  ev(B, `S.bf = [newCard({n:"Llanowar Elves", type:"Creature — Elf", pw:1, tg:1}), newCard({n:"Tarmogoyf", type:"Creature — Lhurgoyf", pw:4, tg:5}), newCard({n:"Island", type:"Basic Land — Island"})]; commit()`); await wait(80);
  const ed = C(A, "Sheoldred's Edict", 'Instant', 'Choose one —\n• Each opponent sacrifices a nontoken creature of their choice.\n• Each opponent sacrifices a creature token of their choice.\n• Each opponent sacrifices a planeswalker of their choice.', {mc:'{1}{B}', cmc:2});
  ev(A, 'S').hand.push(ed); ev(A, 'commit()');
  const pe = ev(A, 'castSpell')(ed.u); await passB();
  [...A.document.querySelectorAll('#modalBox button')].find(b => /nontoken creature/.test(b.textContent)).click(); await wait(20); await click(A, 'Ausführen'); await wait(150);
  check(cardsIn(B).length === 2, `Ben wählt zwischen seinen 2 Kreaturen (${cardsIn(B).length})`);
  cardsIn(B).find(e => /Llanowar/.test(e.textContent)).click(); await wait(150); 
  check(ev(B, 'S.gy.some(c => c.n === "Llanowar Elves")') && ev(B, 'S.bf.some(c => c.n === "Tarmogoyf")'), 'Ben opfert die Elfe, Goyf bleibt');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
