// Mindslaver Etappe 1: Anna steuert Bens Zug über das Netz
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
  ev(B, `S.hand = [newCard({n:"Island", type:"Basic Land — Island", o:"({T}: Add {U}.)"}), newCard({n:"Grizzly Bears", type:"Creature — Bear", mc:"{1}{G}", cmc:2, pw:2, tg:2})]; S.bf = []; commit()`); await wait(80);
  // Anna (Mindslaver) kündigt die Kontrolle an
  ev(A, `requestOpp(${JSON.stringify(bId)}, {kind:"slave", src:"Mindslaver"})`); await wait(150);
  check(ev(B, 'S.slaveBy') === 'Anna' && ev(B, 'S.slavePid') === aId, 'Ben merkt sich, dass Anna seinen nächsten Zug steuert');
  // Bens Zug beginnt
  ev(A, `applyTurn({active:${JSON.stringify(bId)}, n:5, starter:${JSON.stringify(aId)}, phase:2})`); await wait(250);
  check(!!ev(B, 'S.slaved') && ev(B, 'slavedNow()'), 'Bens Zug ist gesteuert');
  const bar = () => A.document.getElementById('slaveBar');
  check(!!bar() && /Island/.test(bar().textContent) && /Grizzly Bears/.test(bar().textContent), 'Anna sieht Bens Hand in der Mindslaver-Leiste');
  check(!B.document.getElementById('slaveBar'), 'Ben selbst hat keine Leiste');
  // Anna spielt Bens Land
  [...bar().querySelectorAll('button.slaveCard')].find(b => /Island/.test(b.textContent)).click(); await wait(250);
  check(ev(B, 'S.bf.some(c => c.n === "Island")') && !ev(B, 'S.hand.some(c => c.n === "Island")'), 'Anna klickt Island: Ben spielt das Land');
  check(!/Island/.test([...bar().querySelectorAll('button.slaveCard')].map(b => b.textContent).join(' ')), 'Leiste zeigt die neue Hand');
  // Nächste Phase
  [...bar().querySelectorAll('button')].find(b => b.textContent === 'Nächste Phase').click(); await wait(250);
  check(ev(B, 'TURN.phase') === 3 && ev(A, 'TURN.phase') === 3, `Nächste Phase: Kampf (${ev(B, 'TURN.phase')})`);
  // Anna wählt Bens Angreifer bei sich aus
  ev(B, `S.bf.push(newCard({n:"Hill Giant", type:"Creature — Giant", pw:3, tg:3})); commit()`); await wait(250);
  [...bar().querySelectorAll('button')].find(b => b.textContent === 'Angreifen …').click(); await wait(60);
  check(/Angreifen mit den Kreaturen von Ben/.test(($(A, '#modalBox h2') || {}).textContent || '') && !!$(A, '#modalBox input[type=checkbox]'), 'Anna bekommt den Angriffsdialog für Bens Kreaturen');
  check(!$(B, '#modal') || $(B, '#modal').hidden, 'Ben bekommt keinen Angriffsdialog');
  const cb = $(A, '#modalBox input[type=checkbox]'); cb.checked = true; cb.onchange(); await click(A, 'Angreifen'); await wait(400);
  check(ev(B, 'S.bf.find(c => c.n === "Hill Giant").tap'), 'Bens Hill Giant greift an (getappt)');
  check(/Ben greift dich an/.test(($(A, '#modalBox h2') || {}).textContent || '') || /greift/.test(($(A, '#modalBox') || {}).textContent || ''), 'Anna wird angegriffen und darf blocken');
  await click(A, 'Blocker bestätigen'); await wait(400);
  check(ev(A, 'S.life') === 17, `Anna nimmt 3 Schaden (${ev(A, 'S.life')})`);
  // Anna aktiviert eine Fähigkeit von Bens Karte
  ev(B, `S.bf.push(newCard({n:"Orakel", type:"Artifact", o:"{T}: Draw a card."})); S.library = [newCard({n:"Zug1", type:"Instant"})]; commit()`); await wait(250);
  const abB = [...bar().querySelectorAll('button.slaveAbil')].find(b => /Orakel/.test(b.textContent));
  check(!!abB, 'Leiste zeigt Bens Fähigkeiten');
  if(abB){ abB.click(); await wait(400); for(let i = 0; i < 3; i++){ const ok = [...B.document.querySelectorAll('#stackBox button')].find(b => /OK/.test(b.textContent)); if(ok) ok.click(); const okA = [...A.document.querySelectorAll('#stackBox button')].find(b => /OK/.test(b.textContent)); if(okA) okA.click(); await wait(200); } }
  check(ev(B, 'S.hand.some(c => c.n === "Zug1")') && ev(B, 'S.bf.find(c => c.n === "Orakel").tap'), 'Anna aktiviert Orakel: Ben zieht, Orakel getappt');
  // Ein anderer Spieler darf nicht steuern
  ev(B, `receiveSlaveAct({from:"fremd", a:"pass"})`); await wait(150);
  check(ev(B, 'TURN.active') === bId, 'fremde Steuerbefehle werden ignoriert');
  // Zug beenden
  [...bar().querySelectorAll('button')].find(b => b.textContent === 'Zug beenden').click(); await wait(400);
  check(ev(A, 'TURN.active') === aId, `Zug beenden: Anna ist am Zug (${ev(A, 'TURN.active') === aId})`);
  await wait(200);
  check(!bar() && !ev(B, 'S.slaved'), 'Leiste weg, Steuerung vorbei');
  // Nach dem gesteuerten Zug wirkt kein Befehl mehr
  ev(A, `applyTurn({active:${JSON.stringify(bId)}, n:6, starter:${JSON.stringify(aId)}, phase:2})`); await wait(250);
  const hn = ev(B, 'S.hand.length');
  ev(B, `receiveSlaveAct({from:${JSON.stringify(aId)}, a:"play", u:S.hand[0].u})`); await wait(150);
  check(ev(B, 'S.hand.length') === hn && !A.document.getElementById('slaveBar'), 'im nächsten eigenen Zug steuert Anna nicht mehr');
  // Umgekehrt: Ben (Mitspieler) steuert Anna (Gastgeberin)
  ev(A, `S.hand = [newCard({n:"Mountain", type:"Basic Land — Mountain", o:"({T}: Add {R}.)"})]; S.bf = []; commit()`); await wait(60);
  ev(B, `requestOpp(${JSON.stringify(aId)}, {kind:"slave", src:"Mindslaver"})`); await wait(150);
  ev(A, `applyTurn({active:${JSON.stringify(aId)}, n:7, starter:${JSON.stringify(aId)}, phase:2})`); await wait(300);
  const barB = () => B.document.getElementById('slaveBar');
  check(!!barB() && /Mountain/.test(barB().textContent), 'Ben sieht Annas Hand');
  [...barB().querySelectorAll('button.slaveCard')][0].click(); await wait(300);
  check(ev(A, 'S.bf.some(c => c.n === "Mountain")'), 'Ben klickt: Anna spielt Mountain');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
