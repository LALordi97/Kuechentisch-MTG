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
  const A = mkWin('anna'), B = mkWin('ben'), C = mkWin('chris');
  // Lobby
  $(A, '#lName').value = 'Anna'; $(A, '#lHost').click(); await wait(80);
  const code = ev(A, 'net.code');
  for(const [w, n] of [[B, 'Ben'], [C, 'Chris']]){ $(w, '#lName').value = n; $(w, '#lCode').value = code; $(w, '#lJoin').click(); }
  await wait(150);
  check(Object.keys(ev(A, 'net.players')).length === 3, 'drei Spieler am Tisch');
  for(const w of [A, B, C]) await loadDeck(w, '10 Island\n10 Mountain\n8 Grizzly Bears\n4 Counterspell\n4 Lightning Bolt\n4 Hill Giant\n2 Phyrexian Arena');
  await wait(150);
  // Auslosung fest auf Anna
  ev(A, 'TURN.active=null'); ev(A, `applyTurn({active:me.id, n:1, starter:me.id, phase:2})`); await wait(100);
  const banner = w => `${$(w, '#turnTxt').textContent} | gold=${$(w, '#turnBar').classList.contains('mine')}`;
  console.log(' ', banner(A)); console.log(' ', banner(B));
  check($(A, '#turnBar').classList.contains('mine') && !$(B, '#turnBar').classList.contains('mine'), 'Zuganzeige: Anna gold, Ben nicht');
  // Phase wechseln
  ev(A, 'setPhase(4)'); await wait(80);
  check(ev(B, 'TURN.phase') === 4 && ev(C, 'TURN.phase') === 4, 'Phase «Hauptphase 2» bei allen sichtbar');
  // Stapel: Anna wirkt Grizzly Bears
  ev(A, `LOOK.autoPay = false`); ev(B, `LOOK.autoPay = false`); ev(A, `(() => { const c = S.library.find(x => x.n === 'Grizzly Bears'); S.library.splice(S.library.indexOf(c), 1); S.hand.push(c); window._bear = c.u; play(c.u); })()`); await wait(80);
  check(ev(B, 'STACK.length') === 1 && !$(B, '#stackBox').hidden, 'Bär liegt bei Ben sichtbar auf dem Stapel');
  check(ev(A, 'S.bf.length') === 0 && ev(A, 'S.st.length') === 1, 'Bär ist bei Anna noch nicht im Spiel');
  // Ben kontert
  ev(B, `(() => { const c = S.library.find(x => x.n === 'Counterspell'); S.library.splice(S.library.indexOf(c), 1); S.hand.push(c); window._cs = c.u; })()`);
  ev(B, `castSpell(window._cs)`); await wait(30);
  const tgtBtn = [...B.document.querySelectorAll('#modalBox button')].find(b => b.textContent.startsWith('Ziel: Grizzly Bears')); check(!!tgtBtn, 'Ben kann den Bären als Ziel wählen'); tgtBtn && tgtBtn.click();
  await wait(80);
  check(ev(A, 'STACK.length') === 2, 'Counterspell liegt oben auf dem Stapel');
  // Anna und Chris geben OK
  btnText(A, 'OK, weiter', '#stackBox').click(); btnText(C, 'OK, weiter', '#stackBox').click(); await wait(80);
  check(ev(A, 'STACK.length') === 1 && ev(A, 'STACK[0].countered') === true, 'Counterspell verrechnet, Bär als gekontert markiert');
  for(const w of [A, B, C]){ const b = btnText(w, 'OK, weiter', '#stackBox'); if(b) b.click(); }
  await wait(80);
  check(ev(A, 'STACK.length') === 0 && ev(A, 'S.gy.some(c => c.n === "Grizzly Bears")') && !ev(A, 'S.bf.length'), 'gekonterter Bär landet in Annas Friedhof');
  check(ev(B, 'S.gy.some(c => c.n === "Counterspell")'), 'Counterspell in Bens Friedhof');
  // Zweiter Bär ohne Konter
  ev(A, `(() => { const c = S.library.find(x => x.n === 'Grizzly Bears'); S.library.splice(S.library.indexOf(c), 1); S.hand.push(c); play(c.u); })()`); await wait(200);
  for(const w of [B, C]) btnText(w, 'OK, weiter', '#stackBox').click(); await wait(250);
  check(ev(A, 'S.bf.some(c => c.n === "Grizzly Bears")'), 'zweiter Bär ist im Spiel');
  check(ev(B, 'others[Object.keys(others).find(k => others[k].name === "Anna")].bf.length') === 1, 'Ben sieht Annas Bären');
  // Kampf: Anna greift Ben an
  ev(A, 'S.bf.forEach(c => c.tap = false)');
  const benId = ev(B, 'me.id'); const benLife = ev(B, 'S.life');
  ev(A, `openAttackDialog(${JSON.stringify(benId)})`); await wait(20);
  const sel = A.document.querySelector('#modalBox select'); if(sel){ sel.value = benId; }
  const cb = A.document.querySelector('#modalBox input[type=checkbox]'); cb.checked = true; cb.onchange();
  btnText(A, 'Angreifen').click(); await wait(80);
  check(ev(B, 'modalState && modalState.kind') === 'block', 'Ben bekommt das Block-Fenster');
  btnText(B, 'Blocker bestätigen').click(); await wait(100);
  check(ev(B, 'S.life') === benLife - 2, `Ben verliert 2 Leben (jetzt ${ev(B, 'S.life')})`);
  // Ben blockt beim nächsten Angriff mit eigenem Hill Giant
  ev(B, `(() => { const c = S.library.find(x => x.n === 'Hill Giant'); S.library.splice(S.library.indexOf(c), 1); c.x = 10; c.y = 10; S.bf.push(c); commit(); })()`); await wait(60);
  ev(A, 'S.bf.forEach(c => c.tap = false)');
  ev(A, `openAttackDialog(${JSON.stringify(benId)})`); await wait(20);
  { const s2 = A.document.querySelector('#modalBox select'); if(s2) s2.value = benId; const c2 = A.document.querySelector('#modalBox input[type=checkbox]'); c2.checked = true; c2.onchange(); }
  btnText(A, 'Angreifen').click(); await wait(80);
  { const bs = B.document.querySelector('#modalBox select'); bs.value = bs.options[1].value; }
  btnText(B, 'Blocker bestätigen').click(); await wait(120);
  check(!ev(A, 'S.bf.some(c => c.n === "Grizzly Bears")') && ev(B, 'S.bf.some(c => c.n === "Hill Giant")'), 'Bär stirbt am Hill Giant, Riese überlebt');
  // Zug weitergeben
  ev(A, 'passTurn()'); await wait(80);
  check(ev(B, 'TURN.active') === ev(B, 'me.id') && $(B, '#turnBar').classList.contains('mine'), 'Ben ist am Zug');
  // Trigger-Erinnerung: Ben hat Phyrexian Arena im Spiel, beim nächsten eigenen Zug
  ev(B, `(() => { const c = S.library.find(x => x.n === 'Phyrexian Arena') || S.hand.find(x => x.n === 'Phyrexian Arena'); if(!c) return; const z = S.library.includes(c) ? S.library : S.hand; z.splice(z.indexOf(c), 1); c.x = 200; c.y = 10; S.bf.push(c); commit(); })()`);
  ev(B, 'passTurn()'); await wait(60); ev(C, 'passTurn()'); await wait(60); ev(A, 'passTurn()'); await wait(80);
  await wait(200);
  { const b = [...B.document.querySelectorAll('#modalBox button')].find(x => x.textContent.trim() === 'Später'); if(b){ b.click(); await wait(200); } }
  check(/Phyrexian Arena löst aus/.test($(B, '#log').textContent), 'Phyrexian Arena löst in Bens Versorgung aus (Karte ziehen, 1 Leben)');
  console.log(' ', line(A)); console.log(' ', line(B)); console.log(' ', line(C));
  // Host-Übernahme: Anna fällt weg
  const turnBefore = ev(B, 'TURN.active'), roundBefore = ev(B, 'TURN.n');
  ev(A, 'net.peer.destroy()'); A.close();
  console.log('  Anna ist weg, warte auf Übernahme …'); await wait(50); console.log('   Chris sieht:', ev(C,'JSON.stringify({order, host:net.hostId, me:me.id, offs:Object.fromEntries(Object.entries(others).map(([k,v])=>[k,!!v.off]))})'));
  for(let i=0;i<8;i++){ await wait(2000); console.log('   t+'+(2*(i+1))+'s Ben', ev(B,'net.role'), ev(B,'$("#status").textContent'), '| Chris', ev(C,'net.role'), ev(C,'$("#status").textContent'), ev(C,'!!(net.conn&&net.conn.open)')); }
  check(ev(B, 'net.role') === 'host', 'Ben übernimmt den Tisch');
  check(ev(C, 'net.role') === 'client' && ev(C, 'net.conn && net.conn.open') === true, 'Chris ist wieder verbunden');
  check(ev(C, 'TURN.active') === turnBefore && ev(C, 'TURN.n') === roundBefore, 'Zug und Runde bleiben erhalten');
  check(ev(B, 'Object.values(net.players).some(p => p.name === "Anna" && p.off)'), 'Anna als «weg» markiert');
  ev(B, 'passTurn()'); await wait(80);
  check(ev(C, 'TURN.active') === ev(C, 'me.id'), 'Zugweitergabe nach Übernahme funktioniert (Chris dran)');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK');
  process.exit(0);
})();
