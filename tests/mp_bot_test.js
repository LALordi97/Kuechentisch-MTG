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
async function loadDeck(w, list){ $(w, '#bDeck').click(); await wait(10); $(w, '#dText').value = list; $(w, '#dGo').click(); await wait(400); }
function line(w){ const S = ev(w, 'S'); return `${w._name}: Leben ${S.life}, Hand ${S.hand.length}, Feld [${S.bf.map(c => c.n + (c.tap ? '*' : '')).join(', ')}], GY [${S.gy.map(c => c.n).join(', ')}]`; }
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK   ' : 'FEHLER ') + msg); if(!ok) fails++; };
(async () => {
  const A = mkWin('anna'), B = mkWin('ben');
  $(A, '#lName').value = 'Anna'; $(A, '#lHost').click(); await wait(80);
  const code = ev(A, 'net.code');
  $(B, '#lName').value = 'Ben'; $(B, '#lCode').value = code; $(B, '#lJoin').click(); await wait(120);
  for(const w of [A, B]) await loadDeck(w, '10 Island\n10 Mountain\n8 Grizzly Bears\n4 Counterspell\n4 Lightning Bolt\n4 Hill Giant');
  // KI beim Host, mit Counterspell auf der Hand
  ev(A, `META_DECKS.Test=[{n:'Blau',p:'',s:'',l:'14 Island\\n14 Counterspell\\n12 Grizzly Bears'}]`);
  $(A, '#bBot').click(); await wait(10);
  $(A, '#bFmt').innerHTML = '<option value="Test">Test</option>'; $(A, '#bFmt').value = 'Test'; $(A, '#bDeckSel').innerHTML = '<option value="0">x</option>'; $(A, '#bRestart').checked = false;
  $(A, '#bGo').click(); await wait(1500);
  // Blockfenster der KI ggf. bestätigen, bis Ben oder Anna dran ist
  for(let i = 0; i < 4; i++){ for(const w of [A, B]){ const b = btnText(w, 'Blocker bestätigen'); if(b) b.click(); } await wait(800); }
  check(ev(B, 'order.includes("bot")') && !!ev(B, 'others.bot'), 'Ben sieht die KI am Tisch');
  // Zug zu Ben bringen
  ev(A, 'TURN.active=null'); ev(A, `applyTurn({active:${JSON.stringify(ev(B, 'me.id'))}, n:2, starter:me.id, phase:2})`); await wait(120);
  check(ev(B, 'TURN.active === me.id'), 'Ben ist am Zug');
  // KI bekommt Inseln und Counterspell bereit
  ev(A, `(() => { BOT.bf = BOT.bf.filter(c => !isLand(c)); for(let i=0;i<3;i++) BOT.bf.push(newCard({n:'Island', type:'Basic Land — Island', pm:['U'], o:'({T}: Add {U}.)'})); BOT.hand.push(newCard({n:'Counterspell', type:'Instant', mc:'{U}{U}', cmc:2, o:'Counter target spell.'})); botChanged(); })()`); await wait(60);
  // Ben wirkt Hill Giant (Bedrohung): KI sollte kontern
  ev(B, `LOOK.autoPay = false`); ev(B, `(() => { const c = S.library.find(x => x.n === 'Hill Giant') || S.hand.find(x => x.n === 'Hill Giant'); const z = S.library.includes(c) ? S.library : S.hand; z.splice(z.indexOf(c), 1); S.hand.push(c); play(c.u); })()`); await wait(200);
  console.log('  Stapel bei Ben:', ev(B, 'JSON.stringify(STACK.map(x => x.n + " von " + x.by + (x.countered ? " (gekontert)" : "")))'));
  check(ev(B, 'STACK.length') === 2 && ev(B, 'STACK[1].by') === 'KI', 'KI kontert über den Stapel');
  for(let i = 0; i < 2; i++){ for(const w of [A, B]){ const b = btnText(w, 'OK, weiter', '#stackBox'); if(b) b.click(); } await wait(150); }
  check(ev(B, 'STACK.length') === 0 && ev(B, 'S.gy.some(c => c.n === "Hill Giant")'), 'Hill Giant gekontert und im Friedhof');
  // Bär ohne Bedrohung: KI gibt OK
  ev(B, `(() => { const c = S.library.find(x => x.n === 'Grizzly Bears'); S.library.splice(S.library.indexOf(c), 1); S.hand.push(c); play(c.u); })()`); await wait(150);
  const okA = btnText(A, 'OK, weiter', '#stackBox'); if(okA) okA.click(); await wait(200);
  check(ev(B, 'S.bf.some(c => c.n === "Grizzly Bears")'), 'Bär wird nach OK von Anna und KI verrechnet');
  // Ben greift die KI an
  const botLife = ev(A, 'BOT.life');
  ev(B, 'S.bf.forEach(c => c.tap = false); BOT.bf.forEach(c => c.tap = true); botChanged()'); await wait(50);
  ev(B, 'openAttackDialog("bot")'); await wait(20);
  { const s = B.document.querySelector('#modalBox select'); if(s) s.value = 'bot'; const cb = B.document.querySelector('#modalBox input[type=checkbox]'); cb.checked = true; cb.onchange(); }
  btnText(B, 'Angreifen').click(); await wait(400);
  check(ev(A, 'BOT.life') === botLife - 2, `KI verliert 2 Leben durch Bens Angriff (jetzt ${ev(A, 'BOT.life')})`);
  // Zugfolge Ben → KI → Anna
  ev(B, 'passTurn()'); await wait(150);
  check(ev(B, 'TURN.active') === 'bot' || ev(B, 'TURN.active') === ev(A, 'me.id'), 'Nach Ben ist die KI oder Anna dran');
  for(let i = 0; i < 4; i++){ for(const w of [A, B]){ const b = btnText(w, 'Blocker bestätigen'); if(b) b.click(); } await wait(700); }
  console.log('  Jetzt am Zug:', ev(B, 'displayName(TURN.active)'));
  // Anna lädt neu und klickt wieder «Tisch eröffnen»: Ben hat übernommen, Anna muss beitreten
  ev(A, 'net.peer.destroy()'); A.close(); await wait(9000);
  check(ev(B, 'net.role') === 'host', 'Ben übernimmt nach Annas Weggang');
  const A2 = mkWin('anna2'); $(A2, '#lName').value = 'Anna'; $(A2, '#lCode').value = code;
  ev(A2, `LS.set("kt-last", {role:"host", code:${JSON.stringify(code)}})`);
  ev(A2, `hostTable(${JSON.stringify(code)})`); await wait(14000);
  check(ev(A2, 'net.role') === 'client' && ev(A2, 'net.conn && net.conn.open') === true, 'Anna kommt als Mitspielerin zurück, Tisch bleibt bei Ben');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK');
  process.exit(0);
})();
