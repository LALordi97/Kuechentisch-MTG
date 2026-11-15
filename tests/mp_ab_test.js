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
const RC = Object.fromEntries([...JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'report27_cards.json'), 'utf8')), ...JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'report28_cards.json'), 'utf8'))].map(([n, type, o, mc, cmc]) => [n, {type_line:type, oracle_text:o, mana_cost:mc, cmc}]));
const STIFLE = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'oracle_decks.json'), 'utf8')); const st = Array.isArray(STIFLE) ? STIFLE.find(c => c[0] === 'Stifle') : null;
const CARDS = {
  'Island': {type_line:'Basic Land — Island', produced_mana:['U'], oracle_text:'({T}: Add {U}.)', cmc:0},
  'Counterspell': {type_line:'Instant', mana_cost:'{U}{U}', cmc:2, oracle_text:'Counter target spell.'},
  'Stifle': st ? {type_line:st[1], oracle_text:st[2], mana_cost:st[3], cmc:st[4]} : {type_line:'Instant', oracle_text:'Counter target activated or triggered ability. (Mana abilities can\'t be targeted.)', mana_cost:'{U}', cmc:1},
  'Trickbind': RC['Trickbind'], "Tishana's Tidebinder": {...RC["Tishana's Tidebinder"], power:'3', toughness:'2'},
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
  $(B, '#lName').value = 'Ben'; $(B, '#lCode').value = code; $(B, '#lJoin').click(); await wait(150);
  check(Object.keys(ev(A, 'net.players')).length === 2, 'zwei Spieler am Tisch');
  for(const w of [A, B]) await loadDeck(w, '20 Island\n4 Counterspell\n4 Stifle\n4 Trickbind\n4 Tishana\'s Tidebinder');
  await wait(150);
  ev(A, 'TURN.active=null'); ev(A, `applyTurn({active:me.id, n:1, starter:me.id, phase:2})`); await wait(100);
  for(const w of [A, B]) ev(w, 'LOOK.autoPay = false; LOOK.autoAbil = false');
  // Anna: eine Kreatur mit «{T}: Draw a card.» und eine mit Mana-Fähigkeit
  ev(A, `(() => { const z = newCard({n:"Zeichner", type:"Creature — Human Wizard", o:"{T}: Draw a card.", pw:1, tg:1, img:null}); z.x = 10; z.y = 10; S.bf.push(z); window._z = z;
    const e = newCard({n:"Elfe", type:"Creature — Elf", o:"{T}: Add {G}.", pw:1, tg:1, img:null}); e.x = 120; e.y = 10; S.bf.push(e); window._e = e; commit(); })()`); await wait(60);
  const act = async () => { ev(A, '_z.tap = false; commit()'); ev(A, 'activateAbility(_z, parseAbilities(_z).find(a => a.kind === "act"))'); await wait(150); };
  const okAll = async (...ws) => { for(let i = 0; i < 4; i++){ let any = false; for(const w of ws){ const b = btnText(w, 'OK, weiter', '#stackBox'); if(b){ b.click(); any = true; await wait(120); } } if(!any) break; } await wait(150); };
  const give = (w, n) => ev(w, `(() => { const c = S.library.find(x => x.n === ${JSON.stringify(n)}); S.library.splice(S.library.indexOf(c), 1); S.hand.push(c); return c.u; })()`);
  const tgts = w => [...w.document.querySelectorAll('#modalBox button')].map(b => b.textContent.trim()).filter(t => t.startsWith('Ziel:'));
  // 1. Mana-Fähigkeit geht nicht auf den Stapel
  check(!ev(A, 'parseAbilities(_e).some(a => a.kind === "act")') && ev(A, 'isManaAbil({kind:"trig", text:"add {G}."})') && !ev(A, 'abilUsesStack(_z, {kind:"trig", text:"add one mana of any color."})'), 'Mana-Fähigkeiten gehen nicht auf den Stapel');
  // 2. Fähigkeit wartet auf OK, dann wird gezogen
  let h0 = ev(A, 'S.hand.length'); await act();
  check(ev(B, 'STACK.length') === 1 && ev(B, 'STACK[0].kind') === 'ab' && !$(B, '#stackBox').hidden && /Draw a card/.test($(B, '#stackBox').textContent), 'Fähigkeit liegt bei Ben sichtbar auf dem Stapel (mit Text)');
  check(ev(A, 'S.hand.length') === h0, 'Anna zieht noch nicht');
  check(!btnText(A, 'Zurücknehmen', '#stackBox'), 'Fähigkeiten kann man nicht zurücknehmen');
  await okAll(B);
  check(ev(A, 'STACK.length') === 0 && ev(A, 'S.hand.length') === h0 + 1, `nach Bens OK zieht Anna (${h0}→${ev(A, 'S.hand.length')})`);
  // 3. Counterspell darf keine Fähigkeit wählen, Stifle schon
  h0 = ev(A, 'S.hand.length'); await act();
  const cs = give(B, 'Counterspell'); ev(B, `castSpell(${JSON.stringify(cs)})`); await wait(80);
  check(!tgts(B).length, `Counterspell bietet die Fähigkeit nicht als Ziel an (${tgts(B)})`);
  { const b = btnText(B, 'Kein Ziel auf dem Stapel') || btnText(B, 'Abbrechen'); if(b) b.click(); await wait(80); }
  // Counterspell ohne Ziel liegt evtl. auf dem Stapel → durchwinken
  while(ev(A, 'STACK.length') > 1){ await okAll(A); if(ev(A, 'STACK.length') > 1) break; }
  const sf = give(B, 'Stifle'); ev(B, `castSpell(${JSON.stringify(sf)})`); await wait(80);
  check(tgts(B).some(t => /Zeichner: Fähigkeit/.test(t)), `Stifle kann die Fähigkeit wählen (${tgts(B)})`);
  { const b = [...B.document.querySelectorAll('#modalBox button')].find(x => /Ziel: Zeichner: Fähigkeit/.test(x.textContent)); b && b.click(); } await wait(150);
  await okAll(A); 
  check(ev(A, 'STACK.length') === 1 && ev(A, 'STACK[0].countered') === true, 'Stifle verrechnet, Fähigkeit als neutralisiert markiert');
  await okAll(A, B);
  check(ev(A, 'STACK.length') === 0 && ev(A, 'S.hand.length') === h0 && /neutralisiert/.test($(A, '#log').textContent), `neutralisierte Fähigkeit: Anna zieht nicht (${h0}→${ev(A, 'S.hand.length')})`);
  check(ev(A, '_z.abilLockKey') !== ev(A, 'turnKey()'), 'Stifle sperrt keine weiteren Aktivierungen');
  // 4. Trickbind sperrt die Fähigkeiten für den Zug
  h0 = ev(A, 'S.hand.length'); await act();
  const tb = give(B, 'Trickbind'); ev(B, `castSpell(${JSON.stringify(tb)})`); await wait(80);
  { const b = [...B.document.querySelectorAll('#modalBox button')].find(x => /Ziel: Zeichner: Fähigkeit/.test(x.textContent)); check(!!b, 'Trickbind kann die Fähigkeit wählen'); b && b.click(); } await wait(150);
  await okAll(A); await okAll(A, B);
  check(ev(A, 'STACK.length') === 0 && ev(A, 'S.hand.length') === h0 && ev(A, '_z.abilLockKey') === ev(A, 'turnKey()'), 'Trickbind: neutralisiert und Zeichner diesen Zug gesperrt');
  await act();
  check(ev(B, 'STACK.length') === 0, 'gesperrter Zeichner legt nichts mehr auf den Stapel');
  ev(A, 'delete _z.abilLockKey');
  // 5. Tishana's Tidebinder: neutralisiert und nimmt Zeichner alle Fähigkeiten
  h0 = ev(A, 'S.hand.length'); await act();
  ev(B, `(() => { const c = S.library.find(x => x.n === "Tishana's Tidebinder"); S.library.splice(S.library.indexOf(c), 1); c.x = 10; c.y = 10; S.bf.push(c); window._t = c; commit(); })()`);
  ev(B, `runAbility(_t, parseAbilities(_t).find(a => a.kind === "trig"), {})`); await wait(150);
  { const b = [...B.document.querySelectorAll('#modalBox button')].find(x => /Zeichner: Fähigkeit/.test(x.textContent)); check(!!b, 'Tidebinder bietet die Fähigkeit an'); b && b.click(); } await wait(200);
  check(ev(A, 'STACK[0] && STACK[0].countered') === true, 'Tidebinder: Fähigkeit als neutralisiert markiert');
  check(ev(A, '!!_z.noAb'), 'Tidebinder: Zeichner verliert alle Fähigkeiten');
  await okAll(A, B);
  check(ev(A, 'STACK.length') === 0 && ev(A, 'S.hand.length') === h0, 'Tidebinder: Anna zieht nicht');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK');
  process.exit(0);
})();
