const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report3_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  const opt = {mc:''};
  // Demonic Consultation
  await reset();
  lib(...['A','B','C','D','E','F','G'].map(x => N(x, 'Instant')), N('Thassa', 'Creature'), N('H', 'Instant'));
  await cast(C('Demonic Consultation', opt));
  check(/Karte nennen/.test(title()), 'Consultation: fragt nach dem Namen');
  d.querySelector('#askName').value = 'thassa'; await click('Weiter'); await wait(60);
  check(S().hand.some(c => c.n === 'Thassa') && S().ex.length === 7 && S().library.length === 1, `Consultation: Thassa auf der Hand, 7 im Exil (${S().ex.length}), 1 übrig`);
  // Tainted Pact
  await reset(); lib(N('X', 'Instant'), N('Y', 'Instant'), N('X', 'Instant'), N('Z', 'Instant'));
  await cast(C('Tainted Pact', opt));
  await click('Weiter verbannen'); await wait(40); await click('Weiter verbannen'); await wait(60);
  check(S().ex.filter(c => /^[XY]$/.test(c.n)).length === 3 && S().library.length === 1 && !open(), 'Tainted Pact: X doppelt → Ende nach 3 Karten');
  await reset(); lib(N('P', 'Instant'), N('Q', 'Instant'), N('R', 'Instant'));
  await cast(C('Tainted Pact', opt)); await click('Weiter verbannen'); await wait(40); await click('Auf die Hand'); await wait(60);
  check(S().hand.some(c => c.n === 'Q') && S().ex.some(c => c.n === 'P') && S().library.length === 1, 'Tainted Pact: Q genommen');
  // Lim-Dûl's Vault
  await reset(); ev('S.life = 20'); lib(...Array(12).fill(0).map((_, i) => N('L' + i, 'Instant')));
  await cast(C("Lim-Dûl's Vault", opt));
  await click('1 Leben'); await wait(60); await click('Diese nehmen'); await wait(60);
  await clickCard('L7'); await clickCard('L5'); await click('Fertig'); await wait(60);
  const top5 = S().library.slice(0, 5).map(c => c.n);
  check(S().life === 19 && top5[0] === 'L7' && top5[1] === 'L5' && top5.every(n => ['L5','L6','L7','L8','L9'].includes(n)) && S().library.length === 12, `Lim-Dûl: 1 Leben, oben ${top5.join(',')}`);
  // Scheming Symmetry
  await reset(); lib(N('Junk', 'Instant'), N('Wanted', 'Sorcery'), N('Junk2', 'Instant'));
  ev('BOT.library = [newCard({n:"Forest", type:"Basic Land — Forest"}), newCard({n:"Big", type:"Creature", cmc:6}), newCard({n:"Small", type:"Creature", cmc:1})]');
  await cast(C('Scheming Symmetry', opt)); await clickCard('Wanted'); await wait(80);
  check(S().library[0].n === 'Wanted' && ev('BOT.library[0].n') === 'Big', `Scheming Symmetry: Wanted oben, KI legt Big oben (${ev('BOT.library[0].n')})`);
  // Final Fortune
  await reset(); ev('S.life = 20'); lib(...Array(5).fill(0).map(() => N('Island', 'Basic Land — Island')));
  await cast(C('Final Fortune', opt));
  check(S().extraTurns === 1 && S().delayed.some(x => x.action === 'steps'), 'Final Fortune: Zusatzzug und Endphase vorgemerkt');
  ev('passTurn()'); await wait(80); await drain();
  check(ev('TURN.active') === ev('me.id') && ev('TURN.ex') === 1 && S().life === 20, `zusätzlicher Zug beginnt (ex ${ev('TURN.ex')}), noch nicht verloren`);
  ev('remindTriggers("end", true)'); await wait(80);
  check(S().life <= 0, `Endphase des Zusatzzugs: verloren (Leben ${S().life})`);
  await drain(); ev('S.life = 20; S.extraTurns = 0; S.delayed = []; commit()');
  // Pact of Negation
  await reset(); ev('S.life = 20');
  await cast(C('Pact of Negation', opt));
  check(S().delayed.some(x => x.when === 'upkeep' && x.action === 'steps'), 'Pact: Versorgung vorgemerkt');
  ev('remindTriggers("upkeep", true)'); await wait(60);
  check(S().life === 20 && S().delayed.length === 1, 'Pact: im selben Zug noch nicht fällig');
  ev('S.pool.G = 1; LOOK.autoPay = true');
  ev('setTurn({active:"bot", n:30, starter:me.id, phase:0})'); ev('setTurn({active:me.id, n:31, starter:me.id, phase:0})'); await wait(100);
  console.log('   Dialog:', title(), '|', btns().join(' / '));
  if(!(await click('Abbrechen'))) await click('Nicht');
  await wait(100);
  check(S().life <= 0, `Pact nicht bezahlt → verloren (Leben ${S().life})`);
  ev('LOOK.autoPay = false'); await drain();
  // Rain of Filth
  await reset(); const sw = N('Forest', 'Basic Land — Forest'); S().bf.push(sw); ev('commit()');
  await cast(C('Rain of Filth', opt));
  const rf = ev('cardMenu')(sw, 'bf').find(i => /Opfern/.test(i.h || i.l || ''));
  check(!!rf, 'Rain of Filth: Land hat «Opfern: {B}»'); if(rf) rf.f(); await wait(30);
  check(S().gy.includes(sw) && S().pool.B === 1, 'Land geopfert, {B} im Pool');
  // Tataru Taru
  await reset(); lib(N('Island', 'Basic Land — Island'), N('Island', 'Basic Land — Island'));
  ev('BOT.library = Array(5).fill(0).map(() => newCard({n:"Plains", type:"Basic Land — Plains"})); BOT.hand = []; botChanged()');
  const tat = C('Tataru Taru', {mc:'', pw:0, tg:3}); S().hand.push(tat); ev('commit()'); await ev('play')(tat.u); await wait(80);
  console.log('   Dialog:', title(), '|', btns().join(' / '));
  const kb = [...d.querySelectorAll('#modalBox button')].find(b => /^KI/.test(b.textContent)); if(kb){ kb.click(); await wait(80); }
  check(S().hand.length === 1 && ev('BOT.hand.length') === 1, `Tataru: du ziehst 1, die KI zieht 1 (${S().hand.length}/${ev('BOT.hand.length')})`);
  ev('abilEvent({kind:"oppDraw", opp:true, pid:"bot"})'); await wait(80);
  ev('abilEvent({kind:"oppDraw", opp:true, pid:"bot"})'); await wait(80);
  const tr = S().bf.filter(c => c.n === 'Treasure');
  check(tr.length === 1 && tr[0].tap, `Tataru: Schatz getappt, nur einmal pro Zug (${tr.length})`);
  ev('TURN.active = "bot"'); ev('abilEvent({kind:"oppDraw", opp:true, pid:"bot"})'); await wait(80); ev('TURN.active = me.id');
  // Gleaming Splendor
  await reset(); lib(N('Island', 'Basic Land — Island')); ev('BOT.hand = []; BOT.library = [newCard({n:"Plains", type:"Basic Land — Plains"})]');
  const gs = C('Gleaming Splendor'); S().bf.push(gs); ev('commit()');
  await ev('runSteps')(ev('parseSteps')('Two target players each draw a card.', gs), gs); await wait(40);
  check(S().hand.length === 1 && ev('BOT.hand.length') === 1, 'Gleaming Splendor: du und die KI ziehen');
  // Valley Floodcaller
  await reset();
  const vf = C('Valley Floodcaller', {pw:2, tg:2}), frog = N('Frog', 'Creature — Frog', '', {pw:1, tg:1}), bear = N('Bear', 'Creature — Bear', '', {pw:2, tg:2});
  vf.tap = true; frog.tap = true; bear.tap = true; S().bf.push(vf, frog, bear); ev('commit()');
  await cast(N('Opt', 'Instant', 'Scry 1.')); await drain();
  check(ev('power')(vf) === 3 && ev('power')(frog) === 2 && !vf.tap && !frog.tap && bear.tap && ev('power')(bear) === 2, 'Valley Floodcaller: Otter und Frosch +1/+1 und enttappt, Bär nicht');
  // Orim's Chant
  await reset();
  const oc = C("Orim's Chant"); ev('window.__oc = null'); w.__c = oc; ev('castCosts(window.__c).then(r => window.__oc = r)'); await wait(40);
  await click('Mit Kicker'); await wait(40);
  check(ev('window.__oc') === true && oc.kicked && oc.payMc === '{W}{W}', `Orim's Chant: Kicker gewählt, Kosten ${oc.payMc}`);
  ev('abilSpellResolve(window.__c)'); await wait(60);
  const kb2 = [...d.querySelectorAll('#modalBox button')].find(b => /^KI/.test(b.textContent)); if(kb2){ kb2.click(); await wait(80); }
  const locks = ev('pub()').locks;
  check(locks.some(l => l.pid === 'bot') && locks.some(l => l.noAttack), `Sperren: KI kann nicht wirken, niemand greift an (${JSON.stringify(locks)})`);
  // Into the Flood Maw
  await reset(); ev('BOT.bf = [newCard({n:"Sol Ring", type:"Artifact", cmc:1}), newCard({n:"Bear", type:"Creature — Bear", pw:2, tg:2})]; BOT.hand = []; botChanged()'); await wait(20);
  const fm = C('Into the Flood Maw', opt); w.__c = fm; ev('castCosts(window.__c)'); await wait(40);
  console.log('   Dialog:', title(), '|', btns().join(' / '));
  await click('Geschenk an'); await wait(40);
  ev('abilSpellResolve(window.__c)'); await wait(100);
  console.log('   Dialog:', title());
  await clickCard('Sol Ring'); await wait(80);
  check(ev('BOT.bf.some(c => c.n === "Fish" && c.tap)') && ev('BOT.hand.some(c => c.n === "Sol Ring")'), 'Into the Flood Maw: KI bekommt getappten Fisch, Sol Ring zurück auf die Hand');
  // Chain of Vapor
  await reset();
  const rock = N('Mind Stone', 'Artifact'), fo = N('Forest', 'Basic Land — Forest'), fo2 = N('Forest', 'Basic Land — Forest');
  S().bf.push(rock, fo, fo2); ev('commit()');
  await cast(C('Chain of Vapor', opt)); await clickCard('Mind Stone'); await wait(80);
  console.log('   Dialog:', title());
  await clickCard('Forest'); await wait(80);
  console.log('   Dialog:', title());
  await click('Kein Ziel'); await wait(60);
  check(S().hand.includes(rock) && S().gy.filter(c => c.n === 'Forest').length === 1, 'Chain of Vapor: Mind Stone zurück, Wald geopfert für die Kopie');
  // Ragavan
  await reset(); ev('BOT.library = [newCard({n:"Lightning Bolt", type:"Instant", o:"", mc:""}), newCard({n:"Plains", type:"Basic Land — Plains"})]; BOT.gy = []; BOT.ex = []; botChanged()');
  const rag = C('Ragavan, Nimble Pilferer', {pw:2, tg:1}); S().bf.push(rag); ev('commit()');
  w.__r = rag; ev('abilEvent({kind:"combatDamage", c:window.__r, pid:"bot", much:2, first:true}, [window.__r])'); await wait(120);
  const bolt = S().ex.find(c => c.n === 'Lightning Bolt');
  check(S().bf.some(c => c.n === 'Treasure') && bolt && bolt.ow && bolt.castKey, 'Ragavan: Schatz, Blitz der KI im Exil und wirkbar');
  const mi = bolt && ev('cardMenu')(bolt, 'ex').find(i => /Wirken \(bis Zugende/.test(i.l || ''));
  check(!!mi, 'Exil-Menü: «Wirken (bis Zugende erlaubt)»'); if(mi) mi.f(); await wait(100);
  check(ev('BOT.gy.some(c => c.n === "Lightning Bolt")') && !S().ex.some(c => c.n === 'Lightning Bolt'), 'gewirkt, Blitz geht in den Friedhof der KI');
  ev('abilEvent({kind:"combatDamage", c:window.__r, pid:"bot", much:2, first:true}, [window.__r])'); await wait(120);
  ev('setTurn({active:"bot", n:40, starter:me.id, phase:0})'); await wait(40);
  check(!S().ex.some(c => c.n === 'Plains') && ev('BOT.ex.some(c => c.n === "Plains")'), 'nicht gewirkt → zurück ins Exil der KI beim nächsten Zug');
  ev('setTurn({active:me.id, n:41, starter:me.id, phase:2})'); await wait(60); await drain();
  // Underworld Breach
  await reset();
  S().bf.push(C('Underworld Breach')); const rit = N('Dark Ritual', 'Instant', 'Add {B}{B}{B}.'); S().gy.push(rit, N('G1', 'Instant'), N('G2', 'Instant'), N('G3', 'Instant'), N('G4', 'Instant')); ev('commit()');
  const esc = ev('cardMenu')(rit, 'gy').find(i => /Escape/.test(i.l || ''));
  check(!!esc, 'Underworld Breach: Escape im Friedhof-Menü'); if(esc) esc.f(); await wait(60);
  await clickCard('G1'); await clickCard('G2'); await clickCard('G3'); await click('Fertig'); await wait(120);
  check(S().pool.B === 3 && S().ex.filter(c => /^G[123]$/.test(c.n)).length === 3 && S().gy.includes(rit), `Escape: Ritual gewirkt ({B}×${S().pool.B}), drei Karten verbannt`);
  // Mockingbird
  await reset(); ev('BOT.bf = [newCard({n:"Big Dino", type:"Creature — Dinosaur", cmc:6, pw:6, tg:6})]; botChanged()'); await wait(20);
  const mys = N('Elvish Mystic', 'Creature — Elf Druid', '{T}: Add {G}.', {pw:1, tg:1, cmc:1, mc:'{G}'}); S().bf.push(mys);
  const mb = C('Mockingbird', {pw:1, tg:1, kw:['Flying']}); mb.wasCast = true; mb.lastX = 0; S().hand.push(mb); ev('commit()');
  ev('moveCard')(mb.u, 'bf'); await wait(80);
  check(/Kopie/.test(title()) && !d.querySelector('#modalBox').textContent.includes('Big Dino'), 'Mockingbird: Auswahl nur bis Manawert 1');
  console.log('   Karten:', [...d.querySelectorAll('#modalBox .card')].map(e => e.textContent.slice(0,30)).join(' | ')); await clickCard('Elvish Mystic'); await wait(60); console.log('   nach Klick:', title(), mb.n);
  check(mb.n === 'Elvish Mystic' && /Bird/.test(mb.type) && ev('kwHas')(mb, 'flying') && /Add \{G\}/.test(mb.o), `Kopie: ${mb.n}, ${mb.type}, fliegend`);
  ev('moveCard')(mb.u, 'gy'); await wait(30);
  check(mb.n === 'Mockingbird', 'im Friedhof wieder Mockingbird');
  // Wishclaw Talisman
  await reset(); ev('BOT.bf = []; botChanged()');
  const wt = C('Wishclaw Talisman'); wt.c = 2; S().bf.push(wt); ev('commit()');
  await ev('runSteps')(ev('parseSteps')('An opponent gains control of Wishclaw Talisman.', wt), wt); await wait(40);
  check(!S().bf.includes(wt) && ev('BOT.bf.some(c => c.n === "Wishclaw Talisman" && c.c === 2)'), 'Wishclaw: KI bekommt den Talisman mit 2 Marken');
  // Voice of Victory: Mobilize
  await reset(); ev('BOT.bf = []; BOT.life = 20; botChanged()');
  const vv = C('Voice of Victory', {pw:1, tg:3}); S().bf.push(vv); ev('commit()');
  ev('openAttackDialog()'); await wait(40); await clickCard('Voice of Victory'); await click('Angreifen'); await wait(300); await drain();
  const war = S().bf.filter(c => c.n === 'Warrior');
  check(war.length === 2 && ev('BOT.life') === 17, `Mobilize 2: zwei Krieger greifen mit an, KI 20 → ${ev('BOT.life')}`);
  ev('remindTriggers("end", true)'); await wait(60); await drain();
  check(!S().bf.some(c => c.n === 'Warrior'), 'Krieger am Zugende geopfert');
  // Lavinia, Voice of Victory: Verbote
  await reset(); ev('BOT.bf = [newCard({n:"Lavinia, Azorius Renegade", type:"Legendary Creature", pw:2, tg:2})]; botChanged()'); await wait(20);
  S().bf.push(N('Island', 'Basic Land — Island')); ev('commit()');
  w.__c = N('Big Spell', 'Sorcery', '', {cmc:3}); ev('window.__r2 = null; castWarn(window.__c, "hand").then(r => window.__r2 = r)'); await wait(40);
  check(/Lavinia/.test(d.querySelector('#modalBox').textContent), 'Lavinia: Warnung bei Manawert 3 mit 1 Land');
  await click('Nicht wirken'); await wait(30);
  ev('BOT.bf = [newCard({n:"Voice of Victory", type:"Creature", pw:1, tg:3})]; botChanged(); TURN.active = "bot"'); await wait(20);
  w.__c = N('Opt', 'Instant', '', {cmc:1}); ev('castWarn(window.__c, "hand")'); await wait(40);
  check(/Voice of Victory/.test(d.querySelector('#modalBox').textContent), 'Voice of Victory: im Zug der KI keine Zauber');
  await click('Nicht wirken'); ev('TURN.active = me.id');
  // Stapel: Swan Song, Force of Negation, Commandeer, Misdirection, Mindbreak Trap
  await reset();
  ev('net.role = "host"; net.order = [me.id]; net.players = {}; net.players[me.id] = {name:"Lukas"}');
  const mk = (id, card, extra) => Object.assign({id, u:card ? card.u : 'x' + id, n: card ? card.n : id, type: card ? card.type : 'Instant', o: card ? card.o : '', owner: ev('me.id'), by:'Lukas', passes:[], countered:false, dest:'gy', target:null, targets:[]}, extra || {});
  const bs = N('Brainstorm', 'Instant', 'Draw two cards.'); S().st.push(bs); ev('commit()');
  w.__st = [mk('a', bs), mk('b', C('Swan Song'), {owner:'x', target:'a'})]; ev('STACK = window.__st; stackResolveTop(); stackResolveTop()'); await wait(80);
  check(S().gy.includes(bs) && S().bf.some(c => c.n === 'Bird' && ev('kwHas')(c, 'flying')), 'Swan Song: Brainstorm gekontert, du bekommst einen 2/2-Vogel');
  const art = N('Sol Ring', 'Artifact'); S().st.push(art); ev('commit()');
  w.__st = [mk('a', art), mk('b', C('Force of Negation'), {owner:'x', target:'a'})]; ev('STACK = window.__st; stackResolveTop(); stackResolveTop()'); await wait(80);
  check(S().ex.includes(art), 'Force of Negation: gekonterter Zauber geht ins Exil');
  const off = N('Ponder', 'Sorcery'); S().st.push(off); ev('commit()');
  w.__st = [mk('a', off), mk('b', C("An Offer You Can't Refuse"), {owner:'x', target:'a'})]; ev('STACK = window.__st; stackResolveTop(); stackResolveTop()'); await wait(80);
  check(S().bf.filter(c => c.n === 'Treasure').length === 2, "An Offer You Can't Refuse: zwei Schätze für dich");
  const h0 = S().hand.length; lib(N('L1', 'Instant'), N('L2', 'Instant'));
  w.__st = [mk('a', N('Divination', 'Sorcery', 'Draw two cards.'), {owner:'x', u:'zz'}), mk('b', C('Commandeer'), {target:'a', u:'cmd'})]; ev('STACK = window.__st; stackResolveTop(); stackResolveTop()'); await wait(100);
  check(S().hand.length === h0 + 2, `Commandeer: übernommene Divination zieht für dich (${S().hand.length - h0})`);
  const p1 = N('Ponder', 'Sorcery'), p2 = N('Preordain', 'Sorcery'); S().st.push(p1, p2); ev('commit()');
  w.__st = [mk('d', p1), mk('a', p2), mk('b', N('Counterspell', 'Instant', 'Counter target spell.'), {owner:'x', target:'a', u:'cs'}), mk('c', C('Misdirection'), {owner:'x', target:'b', newTarget:'d', u:'md'})];
  ev('STACK = window.__st; stackResolveTop(); stackResolveTop()'); await wait(60);
  check(ev('STACK.find(x => x.id === "d").countered') === true && !ev('STACK.find(x => x.id === "a").countered'), 'Misdirection: Counterspell trifft jetzt Ponder statt Preordain');
  ev('stackResolveTop(); stackResolveTop()'); await wait(60);
  const t1 = N('Spell1', 'Sorcery'), t2 = N('Spell2', 'Sorcery'); S().st.push(t1, t2); ev('commit()');
  w.__st = [mk('a', t1), mk('b', t2), mk('c', C('Mindbreak Trap'), {owner:'x', target:'a', targets:['b'], u:'mt'})]; ev('STACK = window.__st; stackResolveTop(); stackResolveTop(); stackResolveTop()'); await wait(80);
  check(S().ex.includes(t1) && S().ex.includes(t2), 'Mindbreak Trap: beide Zauber verbannt');
  ev('net.role = "solo"; STACK = []');
  // Anfragen von Mitspielern
  await reset(); lib(N('Island', 'Basic Land — Island'), N('Swamp', 'Basic Land — Swamp'), N('Tutor', 'Sorcery'));
  ev('receiveReq({from:"bot", by:"Anna", req:{kind:"draw", n:1, may:true, src:"Tataru Taru"}})'); await wait(40);
  await click('Ja'); await wait(40);
  check(S().hand.length === 1, 'Anfrage: «darf ziehen» → Ja → gezogen');
  ev('receiveReq({from:"bot", by:"Anna", req:{kind:"token", n:1, desc:"1/1 blue Fish creature", tapped:true, src:"Into the Flood Maw"}})'); await wait(60);
  check(S().bf.some(c => c.n === 'Fish' && c.tap), 'Anfrage: Geschenk-Fisch getappt erhalten');
  ev('receiveReq({from:"bot", by:"Anna", req:{kind:"tutorTop", src:"Scheming Symmetry"}})'); await wait(60); await clickCard('Tutor'); await wait(60);
  check(S().library[0].n === 'Tutor', 'Anfrage: Karte suchen und oben hinlegen');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
