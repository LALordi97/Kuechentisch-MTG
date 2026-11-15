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
const ok = async (...ws) => { for(const w of ws){ const b = btnText(w, 'OK, weiter', '#stackBox'); if(b) b.click(); } await wait(80); };
const mk = (w, o, v) => { w.__c = o; ev(w, `(() => { const c = newCard(window.__c); c.x = 10; c.y = 10; S.bf.push(c); window.${v} = c; commit(); })()`); };
const hand = (w, o, v) => { w.__c = o; ev(w, `(() => { const c = newCard(window.__c); S.hand.push(c); window.${v} = c; commit(); })()`); };
const mbtn = (w, t) => [...w.document.querySelectorAll('#modalBox button')].find(b => b.textContent.trim().startsWith(t));
(async () => {
  const A = mkWin('anna'), B = mkWin('ben');
  $(A, '#lName').value = 'Anna'; $(A, '#lHost').click(); await wait(80);
  const code = ev(A, 'net.code');
  // 0. Allein am Tisch: niemand muss OK geben, die Fähigkeit läuft sofort
  mk(A, {n:'Solo-Archivist', type:'Creature — Human Wizard', o:'{T}: You gain 3 life.', pw:1, tg:1}, '_solo');
  { const l0 = ev(A, 'S.life'); ev(A, 'queued(() => activateAbility(window._solo, parseAbilities(window._solo).find(a => a.kind === "act")))'); await wait(80);
    check(ev(A, 'S.life') === l0 + 3 && ev(A, 'STACK.length') === 0, 'allein am Tisch: Fähigkeit wird sofort verrechnet');
    ev(A, 'window._m0 = 0; queued(() => { window._m0 = 1; })'); await wait(30); check(ev(A, 'window._m0') === 1, 'Warteschlange läuft danach normal weiter'); }
  ev(A, 'S.bf.length = 0; commit()');
  $(B, '#lName').value = 'Ben'; $(B, '#lCode').value = code; $(B, '#lJoin').click(); await wait(150);
  for(const w of [A, B]) await loadDeck(w, '20 Island\n20 Mountain');
  await wait(150);
  ev(A, 'TURN.active=null'); ev(A, `applyTurn({active:me.id, n:1, starter:me.id, phase:2})`); await wait(100);
  for(const w of [A, B]) ev(w, 'LOOK.autoPay = false');
  const h0 = () => ev(A, 'S.hand.length');

  // 1. Aktivierte Fähigkeit liegt auf dem Stapel, bis Ben OK gibt
  mk(A, {n:'Archivist', type:'Creature — Human Wizard', o:'{T}: Draw a card.', pw:1, tg:1}, '_arch');
  let n = h0();
  ev(A, 'queued(() => activateAbility(window._arch, parseAbilities(window._arch).find(a => a.kind === "act")))'); await wait(80);
  check(ev(B, 'STACK.length') === 1 && ev(B, 'STACK[0].abil') === true && /Draw a card/.test(ev(B, 'STACK[0].o')), 'aktivierte Fähigkeit liegt bei Ben sichtbar auf dem Stapel');
  check(/Fähigkeit: Archivist/.test($(B, '#stackBox').textContent), 'Stapel zeigt «Fähigkeit: Archivist»');
  check(h0() === n && ev(A, 'window._arch.tap') === true, 'Kosten bezahlt, aber noch nicht gezogen');
  check(!btnText(A, 'Zurücknehmen', '#stackBox'), 'Fähigkeiten lassen sich nicht zurücknehmen');
  // Warteschlange ist frei: Anna kann in der Zwischenzeit etwas anderes tun
  ev(A, 'window._mark = 0; queued(() => { window._mark = 1; })'); await wait(30);
  check(ev(A, 'window._mark') === 1, 'während die Fähigkeit wartet, läuft die Warteschlange weiter');
  await ok(B);
  check(ev(A, 'STACK.length') === 0 && h0() === n + 1, 'nach Bens OK wird die Fähigkeit verrechnet (Karte gezogen)');

  // 2. Ausgelöste Fähigkeit + Stifle
  mk(A, {n:'Elvish Visionary', type:'Creature — Elf Shaman', o:'When this creature enters, draw a card.', pw:1, tg:1}, '_vis');
  n = h0(); ev(A, 'abilEvent({kind:"enter", c:window._vis})'); await wait(80);
  check(ev(B, 'STACK.length') === 1 && ev(B, 'STACK[0].abil'), 'Auslöser liegt auf dem Stapel');
  hand(B, {n:'Stifle', type:'Instant', o:'Counter target activated or triggered ability.', mc:''}, '_st');
  ev(B, 'castSpell(window._st.u)'); await wait(40);
  const tb = mbtn(B, 'Ziel: Fähigkeit von Elvish Visionary'); check(!!tb, 'Stifle kann die Fähigkeit als Ziel wählen'); tb && tb.click(); await wait(80);
  check(ev(A, 'STACK.length') === 2, 'Stifle liegt über der Fähigkeit');
  await ok(A);
  check(ev(A, 'STACK.length') === 1 && ev(A, 'STACK[0].countered') === true, 'Stifle verrechnet: Fähigkeit ist als gekontert markiert');
  await ok(A, B);
  check(ev(A, 'STACK.length') === 0 && h0() === n, 'gekonterte Fähigkeit: Anna zieht nicht');
  check(ev(B, 'S.gy.some(c => c.n === "Stifle")'), 'Stifle liegt in Bens Friedhof');

  // 3. Gegenzauber trifft keine Fähigkeit
  ev(A, 'window._arch.tap = false');
  ev(A, 'queued(() => activateAbility(window._arch, parseAbilities(window._arch).find(a => a.kind === "act")))'); await wait(80);
  hand(B, {n:'Counterspell', type:'Instant', o:'Counter target spell.', mc:''}, '_cs');
  ev(B, 'castSpell(window._cs.u)'); await wait(60);
  check(!mbtn(B, 'Ziel:') && ev(A, 'STACK.length') === 2 && !ev(A, 'STACK[1].target'), 'Counterspell bekommt die Fähigkeit nicht als Ziel angeboten');
  await ok(A); await ok(A, B); await wait(60);
  check(ev(A, 'STACK.length') === 0, 'Stapel wieder leer');

  // 4. Trickbind: kontert und sperrt die Quelle
  ev(A, 'window._arch.tap = false'); n = h0();
  ev(A, 'queued(() => activateAbility(window._arch, parseAbilities(window._arch).find(a => a.kind === "act")))'); await wait(80);
  hand(B, {n:'Trickbind', type:'Instant', o:"Split second\nCounter target activated or triggered ability. If a permanent's ability is countered this way, activated abilities of that permanent can't be activated this turn.", mc:''}, '_tb');
  ev(B, 'castSpell(window._tb.u)'); await wait(40);
  { const b = mbtn(B, 'Ziel: Fähigkeit von Archivist'); b && b.click(); } await wait(80);
  await ok(A); await wait(120); await ok(A, B); await wait(120);
  check(h0() === n, 'Trickbind: Fähigkeit gekontert');
  check(ev(A, 'window._arch.abilLockKey === turnKey()'), 'Trickbind: Fähigkeiten der Quelle sind diesen Zug gesperrt');

  // 5. Mana-Fähigkeit nutzt den Stapel nicht
  mk(A, {n:'Manastein', type:'Artifact', o:'{1}, {T}: Add {G}{G}.'}, '_ms');
  check(ev(A, 'abilUsesStack(parseAbilities(window._ms).find(a => a.kind === "act") || {text:"Add {G}{G}."})') === false, 'Mana-Fähigkeiten gehen nicht auf den Stapel');

  // 6. Automatisch durchwinken
  ev(B, 'LS.set("kt-autoabil", true)');
  mk(A, {n:'Visionary 2', type:'Creature — Elf', o:'When this creature enters, draw a card.', pw:1, tg:1}, '_v2');
  n = h0(); ev(A, 'abilEvent({kind:"enter", c:window._v2})'); await wait(900);
  check(ev(A, 'STACK.length') === 0 && h0() === n + 1, 'mit «automatisch durchwinken» verrechnet die Fähigkeit ohne Klick');
  ev(B, 'LS.set("kt-autoabil", false)');

  // 7. Tishana's Tidebinder kontert eine Fähigkeit auf dem Stapel
  ev(A, 'window._arch.abilLockKey = null; window._arch.tap = false'); n = h0();
  ev(A, 'queued(() => activateAbility(window._arch, parseAbilities(window._arch).find(a => a.kind === "act")))'); await wait(80);
  mk(B, {n:"Tishana's Tidebinder", type:'Creature — Merfolk Wizard', o:'Flash\nWhen this creature enters, counter up to one target activated or triggered ability. If an ability of an artifact, creature, or planeswalker is countered this way, that permanent loses all abilities for as long as this creature remains on the battlefield.', pw:3, tg:2}, '_tide');
  ev(B, 'abilEvent({kind:"enter", c:window._tide})'); await wait(80);
  check(ev(A, 'STACK.length') === 2 && ev(A, 'STACK[1].abil'), 'Tidebinder-Auslöser liegt über der Fähigkeit');
  await ok(A); await wait(60);
  { const b = mbtn(B, 'Fähigkeit von Archivist'); check(!!b, 'Tidebinder: Auswahl der Fähigkeit auf dem Stapel'); b && b.click(); } await wait(150);
  await ok(A, B); await wait(150);
  check(h0() === n, 'Tidebinder: Fähigkeit gekontert');
  check(ev(A, 'window._arch.noAb === true'), 'Tidebinder: Quelle verliert alle Fähigkeiten');

  // 8. Angriffs-Auslöser wird vor dem Blocken verrechnet
  mk(A, {n:'Stürmer', type:'Creature — Warrior', o:'Whenever this creature attacks, you gain 2 life.', pw:2, tg:2}, '_atk');
  const benId = ev(B, 'me.id'); const lifeA = ev(A, 'S.life');
  ev(A, 'S.bf.forEach(c => { c.tap = false; c.sick = false; })');
  ev(A, `openAttackDialog(${JSON.stringify(benId)})`); await wait(30);
  { const cbs = [...A.document.querySelectorAll('#modalBox input[type=checkbox]')]; const cb = cbs[cbs.length - 1]; cb.checked = true; cb.onchange(); }
  btnText(A, 'Angreifen').click(); await wait(120);
  check(ev(B, 'STACK.length') === 1 && (ev(B, 'modalState && modalState.kind') !== 'block'), 'Angriffs-Auslöser auf dem Stapel, Ben blockt noch nicht');
  await ok(B); await wait(200);
  check(ev(A, 'S.life') === lifeA + 2 && ev(B, 'modalState && modalState.kind') === 'block', 'nach dem OK: Auslöser verrechnet, dann kommt das Block-Fenster');
  // 9. Endschritt-Auslöser: Zug endet erst nach dem Verrechnen
  { const bb = btnText(B, 'Blocker bestätigen'); if(bb) bb.click(); } await wait(200);
  mk(A, {n:'Endzeit-Archiv', type:'Enchantment', o:'At the beginning of your end step, draw a card.'}, '_end');
  n = h0(); ev(A, 'passTurn()'); await wait(150);
  check(ev(A, 'STACK.length') === 1 && ev(A, 'STACK[0].abil') && ev(A, 'TURN.active === me.id'), 'Zug beenden: Endschritt-Auslöser liegt auf dem Stapel, Anna bleibt am Zug');
  await ok(B); await wait(250);
  { const b = mbtn(A, 'Später'); if(b) b.click(); } await wait(200);
  check(h0() === n + 1 && ev(B, 'TURN.active === me.id'), 'nach dem OK: Karte gezogen, danach ist Ben am Zug');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
