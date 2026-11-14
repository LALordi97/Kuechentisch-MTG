const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('night20261114_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
const C = (n, x = {}) => ev('newCard')({...T[n], img:null, ...x});
const N = (n, type, o = '', x = {}) => ev('newCard')({n, type, o, img:null, ...x});
const title = () => ($('#modalBox h2') || {}).textContent || '';
const open = () => !$('#modal').hidden;
const click = async t => { const b = [...d.querySelectorAll('#modalBox button')].find(b => b.textContent.trim().startsWith(t)); if(b){ b.click(); await wait(40); } return !!b; };
const clickCard = async name => { const el = [...d.querySelectorAll('#modalBox .card')].find(e => !name || e.textContent.includes(name)); if(el){ el.click(); await wait(40); } return !!el; };
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()'); ev('LOOK.autoPay = false');
  ev('startBot("Test", "Test", Array(30).fill(0).map(() => ({n:"Island", type:"Basic Land — Island", o:""})))'); ev('injectBot(); commit()'); await wait(30);
  const S = () => ev('S'), B = () => ev('BOT.life');
  const drain = async () => { for(let i = 0; i < 6 && open(); i++){ if(!(await click('Abbrechen')) && !(await click('Kein')) && !(await click('Nein')) && !(await click('Erledigt'))) break; await wait(40); } };
  const reset0 = () => ev('S.bf = []; S.hand = []; S.gy = []; S.ex = []; S.library = []; S.pool = emptyPoolObj(); S.lifeLock = null; S.protect = null; BOT.bf = []; botChanged(); TURN = {active:me.id, n:20, starter:me.id, phase:2}; commit()');
  const reset = async () => { await wait(80); await drain(); reset0(); await wait(20); };
  const lib = (...c) => { S().library.push(...c); ev('commit()'); };
  const btns = () => [...d.querySelectorAll('#modalBox button')].map(b => b.textContent.trim());
  const M = n => ev('cardMenu')(n.c, n.z);
  const cast = async c => { S().hand.push(c); ev('commit()'); ev('castSpell')(c.u); await wait(80); };
  const put = (...c) => { S().bf.push(...c); ev('commit()'); };
  const trig = c => ev("parseAbilities")(c).find(a => a.kind === "trig");
  const spell = c => ev("parseAbilities")(c).find(a => a.kind === "spell");
  const acts = c => ev("parseAbilities")(c).filter(a => a.kind === "act");
  const hexAb = c => ev("parseAbilities")(c).filter(a => a.kind === "spell").pop();
  const logT = () => $('#log').textContent;
  const opp = (n, x = {}) => ev(`(() => { const c = newCard(${JSON.stringify({n, type:'Creature — Test', o:'', pw:1, tg:1, ...x})}); BOT.bf.push(c); botChanged(); return c; })()`);
  // Stubborn Denial: Ferocious → ohne Bezahlen-Frage
  await reset(); { const sd = C('Stubborn Denial'); put(N('Klein', 'Creature — Elf', '', {pw:2, tg:2}));
    ev('runAbility')(sd, spell(sd), {}); await wait(120); const asked = open() && btns().some(b => /Nicht bezahlt/.test(b));
    check(asked, `Stubborn Denial ohne Ferocious: fragt nach Bezahlen (${btns()})`); await click('KI'); await wait(80); await drain(); }
  await reset(); { const sd = C('Stubborn Denial'); put(N('Gross', 'Creature — Beast', '', {pw:4, tg:4}));
    ev('runAbility')(sd, spell(sd), {}); await wait(120); const asked = open() && btns().some(b => /Nicht bezahlt/.test(b)); await drain();
    check(!asked && /ohne Bezahlen neutralisiert/.test(logT()), `Stubborn Denial mit Kraft 4: kein Bezahlen möglich`); }
  // The Endstone: Leben wird halbe Startlebenspunkte
  await reset(); { const es = C('The Endstone'); put(es); ev('S.startLife = 40; S.life = 7'); const t = ev('parseAbilities')(es).filter(a => a.kind === 'trig')[1];
    ev('runAbility')(es, t, {}); await wait(100); await drain(); check(S().life === 20, `Endstone: Leben 20 bei Start 40 (${S().life})`);
    ev('S.startLife = 20; S.life = 3'); ev('runAbility')(es, t, {}); await wait(100); await drain(); check(S().life === 10, `Endstone: Leben 10 bei Start 20 (${S().life})`); }
  // The Mind Stone: ∞-Auslöser erst nach Harness
  await reset(); { const ms = C('The Mind Stone'); put(ms); const t = ev('parseAbilities')(ms).find(a => a.kind === 'trig'); const evE = {kind:'phase', phase:'end', mine:true};
    check(t && !ev('trigMatches')(t, ms, evE), 'Mind Stone: ohne Harness kein Endphasen-Auslöser');
    ev('runAbility')(ms, acts(ms).find(a => /Harness/.test(a.text)), {}); await wait(100); await drain();
    check(ms.harnessed && ev('trigMatches')(t, ms, evE), 'Mind Stone: nach Harness löst die ∞-Fähigkeit aus');
    const el = N('Elf', 'Creature — Elf', '', {pw:1, tg:1}); put(el); el.tap = true;
    ev('runAbility')(ms, t, {}); await wait(120); await clickCard('Elf'); await wait(150); await drain();
    check(S().bf.some(c => c.n === 'Elf') && !S().ex.some(c => c.n === 'Elf'), `Mind Stone: Elf verbannt und zurück (${S().bf.map(c => c.n)})`);
    ev('moveCard')(ms.u, 'hand'); check(!ms.harnessed, 'Mind Stone: Harness endet beim Verlassen'); }
  // Thrun: regeneriert sich selbst
  await reset(); { const th = C('Thrun, the Last Troll', {pw:4, tg:4}); put(th); ev('runAbility')(th, acts(th)[0], {}); await wait(100); await drain();
    check(th.regen === ev('turnKey()'), 'Thrun: Regenerationsschild'); }
  // Twinned Vision: aus der Hand eine Karte, mit Flashback zwei
  await reset(); { lib(N('A', 'Instant'), N('B', 'Instant'), N('C', 'Instant')); const tv = C('Twinned Vision'); ev('runAbility')(tv, spell(tv), {}); await wait(120); await drain();
    check(S().hand.length === 1, `Twinned Vision aus der Hand: 1 Karte (${S().hand.length})`); }
  await reset(); { lib(N('A', 'Instant'), N('B', 'Instant'), N('C', 'Instant')); const tv = C('Twinned Vision'); tv.fromGy = true; ev('runAbility')(tv, spell(tv), {}); await wait(120); await drain();
    check(S().hand.length === 2, `Twinned Vision mit Flashback: 2 Karten (${S().hand.length})`); }
  // Violent Urge: Delirium gibt Doppelschlag
  for(const del of [false, true]){ await reset(); const be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(be);
    if(del) S().gy.push(N('L', 'Land'), N('I', 'Instant'), N('S', 'Sorcery'), N('K', 'Creature — X'));
    const vu = C('Violent Urge'); const pr = ev('abilSpellResolve')(vu); await wait(120); await clickCard('Bär'); await wait(150); await drain(); await pr;
    const kw = (be.tkw || []).join(','); check(/First strike/i.test(kw) && /Double strike/i.test(kw) === del, `Violent Urge ${del ? 'mit' : 'ohne'} Delirium (${kw})`); }
  // Thraben Charm: Schaden doppelt so hoch wie eigene Kreaturen; Friedhöfe verbannen
  await reset(); { put(N('K1', 'Creature — X', '', {pw:1, tg:1}), N('K2', 'Creature — X', '', {pw:1, tg:1})); opp('Riese', {pw:5, tg:5});
    const tc = C('Thraben Charm'); const steps = ev('parseSteps')('Thraben Charm deals damage equal to twice the number of creatures you control to target creature.', tc);
    check(steps[0].t === 'damage' && ev('xExpr')(steps[0].xexpr, tc) === 4, `Thraben Charm: Schaden 4 bei zwei Kreaturen (${JSON.stringify(steps[0])})`);
    ev('runSteps')(steps, tc, {}); await wait(120); await clickCard('Riese'); await wait(150); await drain();
    check(/Thraben Charm\): 4 Schaden an Riese/.test(logT()), 'Thraben Charm: 4 Schaden an Riese'); }
  await reset(); { S().gy.push(N('Meins', 'Instant')); ev('BOT.gy.push(newCard({n:"Seins", type:"Instant", o:""}), newCard({n:"Seins2", type:"Sorcery", o:""})); botChanged()');
    const tc = C('Thraben Charm'); const steps = ev('parseSteps')("Exile any number of target players' graveyards.", tc); ev('runSteps')(steps, tc, {}); await wait(120);
    await click('Nein'); await wait(80); await click('Ja'); await wait(200); await drain();
    check(S().gy.length === 1 && ev('BOT.gy.length') === 0 && ev('BOT.ex.length') === 2, `Thraben Charm: nur Friedhof der KI verbannt (meiner ${S().gy.length}, KI ${ev('BOT.gy.length')}/${ev('BOT.ex.length')})`); }
  await reset(); { put(N('K1', 'Creature — X', '', {pw:1, tg:1}), N('K2', 'Creature — X', '', {pw:1, tg:1}), N('K3', 'Creature — X', '', {pw:1, tg:1})); opp('Riese', {pw:5, tg:5});
    const tc = C('Thraben Charm'); const pr = ev('abilSpellResolve')(tc); await wait(150); await click('Thraben Charm deals'); await wait(100); await click('Ausführen'); await wait(150);
    await clickCard('Riese'); await wait(200); await drain(); await pr;
    check(!ev('BOT.bf.some(c => c.n === "Riese")') && /6 Schaden an Riese/.test(logT()), 'Thraben Charm als Modus: 6 Schaden, Riese stirbt'); }
  // Valakut Awakening: zwei unter die Bibliothek, drei ziehen
  await reset(); { S().hand.push(N('H1', 'Instant'), N('H2', 'Instant'), N('H3', 'Instant')); lib(N('A', 'Instant'), N('B', 'Instant'), N('C', 'Instant'));
    const va = C('Valakut Awakening // Valakut Stoneforge'); ev('runAbility')(va, spell(va), {}); await wait(120); await clickCard('H1'); await clickCard('H2'); await click('Fertig'); await wait(150); await drain();
    const h = S().hand.map(c => c.n).sort().join(','); check(h === 'A,B,C,H3' && S().library.slice(-2).map(c => c.n).sort().join(',') === 'H1,H2', `Valakut Awakening: Hand ${h}, unten ${S().library.slice(-2).map(c => c.n)}`); }
  // Vizier of Remedies + Devoted Druid
  await reset(); { const dd = N('Devoted Druid', 'Creature — Elf Druid', '{T}: Add {G}.\nPut a -1/-1 counter on this creature: Untap this creature.', {pw:0, tg:2}); put(dd); dd.tap = true;
    const un = acts(dd).find(a => /-1\/-1/.test(a.cost || '')); ev('activateAbility')(dd, un); await wait(150); await drain();
    check(dd.c === -1 && !dd.tap, `Devoted Druid ohne Vizier: -1/-1-Marke und enttappt (${dd.c}, ${dd.tap})`);
    put(C('Vizier of Remedies', {pw:2, tg:1})); for(let i = 0; i < 3; i++){ dd.tap = true; ev('activateAbility')(dd, un); await wait(150); await drain(); }
    check(dd.c === -1 && !dd.tap && S().bf.includes(dd), `Devoted Druid mit Vizier: keine weiteren Marken (${dd.c})`); }
  await reset(); { const dd = N('Devoted Druid', 'Creature — Elf Druid', '{T}: Add {G}.\nPut a -1/-1 counter on this creature: Untap this creature.', {pw:0, tg:2}); put(dd);
    const un = acts(dd).find(a => /-1\/-1/.test(a.cost || '')); for(let i = 0; i < 2; i++){ ev('activateAbility')(dd, un); await wait(150); await drain(); }
    check(!S().bf.includes(dd) && S().gy.includes(dd), 'Devoted Druid stirbt nach zwei Marken ohne Vizier'); }
  // Wish: Karte aus dem Sideboard diesen Zug spielbar
  await reset(); { ev('S.deck = [{n:"Haupt", type:"Instant", o:""}, {n:"Brett", type:"Sorcery", o:"", sb:true}]'); const wi = C('Wish'); ev('runAbility')(wi, spell(wi), {}); await wait(120);
    await clickCard('Brett'); await wait(150); await drain(); const b = S().ex.find(c => c.n === 'Brett');
    check(b && b.castKey === ev('turnKey()'), `Wish: Brett liegt spielbar im Exil (${S().ex.map(c => c.n)})`); }
  await reset(); { ev('S.deck = [{n:"Haupt", type:"Instant", o:""}]'); const wi = C('Wish'); ev('runAbility')(wi, spell(wi), {}); await wait(120); await drain();
    check(!S().ex.length && /kein Sideboard/.test(logT()), 'Wish ohne Sideboard: nichts'); }
  // Superior Spider-Man: Kopie aus dem Friedhof, Name/4/4/Typen, Karte ins Exil
  await reset(); { const gob = N('Goblin Guide', 'Creature — Goblin Scout', 'Haste', {pw:2, tg:2, mc:'{R}'}); S().gy.push(gob); const sm = C('Superior Spider-Man', {pw:4, tg:4}); S().hand.push(sm); ev('commit()');
    ev('moveCard')(sm.u, 'bf'); await wait(150); await clickCard('Goblin Guide'); await wait(200); await drain();
    check(sm.n === 'Superior Spider-Man' && sm.pw === 4 && sm.tg === 4 && /Goblin Scout Spider Human Hero/.test(sm.type) && /Haste/.test(sm.o), `Spider-Man: Kopie (${sm.n}, ${sm.pw}/${sm.tg}, ${sm.type}, ${sm.o})`);
    check(S().ex.includes(gob) && !S().gy.includes(gob), 'Spider-Man: kopierte Karte im Exil'); }
  // The Wandering Emperor / Vizier: Dauereffekte gelten als erledigt
  { const rep = ev('(() => { S.deck = [' + ['The Wandering Emperor', 'Vizier of Remedies'].map(n => JSON.stringify({n, type:T[n].type, o:T[n].o})).join(',') + ']; openStats("check"); return ABILITY_REPORT; })()'); await wait(50); await drain();
    check(!/Wandering Emperor \[|Vizier of Remedies \[/.test(rep) || /0 teilweise, 0 von Hand/.test(rep), 'Fähigkeiten-Check: Emperor und Vizier automatisch'); }
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
