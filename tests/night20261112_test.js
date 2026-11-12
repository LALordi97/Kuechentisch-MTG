const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('night20261112_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  // Oliphaunt: andere eigene Kreatur +2/+0 und Trample
  await reset(); { const ol = C('Oliphaunt', {pw:5, tg:5}), be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(ol, be);
    ev('runAbility')(ol, trig(ol), {}); await wait(100); await clickCard('Bär'); await wait(100); await drain();
    check(be.pump && be.pump.p === 2 && (be.tkw || []).includes('Trample') && !ol.pump, `Oliphaunt: Bär +2/+0 und Trample (${JSON.stringify(be.pump)}, ${be.tkw})`);
    ev('runAbility')(ol, trig(ol), {}); await wait(100); await clickCard('Oliphaunt'); await wait(100); await drain();
    check(!ol.pump, 'Oliphaunt: nicht sich selbst'); }
  // Kraul Harpooner: Flieger wählen, +X/+0, kämpfen
  await reset(); { ev('BOT.bf.push(newCard({n:"Vogel", type:"Creature — Bird", o:"Flying", kw:["Flying"], pw:2, tg:2})); BOT.bf.push(newCard({n:"Bär", type:"Creature — Bear", o:"", pw:2, tg:2})); botChanged()');
    S().gy.push(N('Tot1', 'Creature — Elf', ''), N('Tot2', 'Creature — Elf', ''), N('Spruch', 'Instant', '')); const kh = C('Kraul Harpooner', {pw:2, tg:5}); put(kh);
    ev('runAbility')(kh, trig(kh), {}); await wait(100); const shown = [...d.querySelectorAll('#modalBox .card')].map(e => e.textContent).join('|');
    check(/Vogel/.test(shown) && !/Bär/.test(shown), `Kraul: nur Flieger zur Wahl (${shown})`);
    await clickCard('Vogel'); await wait(100); await click('Ja'); await wait(150); await drain();
    check(kh.pump && kh.pump.p === 2, `Kraul: +2/+0 für zwei Kreaturenkarten (${JSON.stringify(kh.pump)})`);
    check(!ev('BOT.bf.some(c => c.n === "Vogel")') && S().bf.includes(kh), `Kraul: Vogel im Kampf gestorben (${ev('BOT.bf.map(c => c.n).join(",")')})`); }
  await reset(); { ev('BOT.bf.push(newCard({n:"Vogel", type:"Creature — Bird", o:"Flying", kw:["Flying"], pw:2, tg:2})); botChanged()');
    const kh = C('Kraul Harpooner', {pw:3, tg:2}); put(kh); ev('runAbility')(kh, trig(kh), {}); await wait(100); await clickCard('Vogel'); await wait(100); await click('Nein'); await wait(120); await drain();
    check(ev('BOT.bf.some(c => c.n === "Vogel")') && S().bf.includes(kh), 'Kraul: Kampf ist freiwillig'); }
  // Inevitable Betrayal: Kreatur aus der gegnerischen Bibliothek
  await reset(); { ev('BOT.library = [newCard({n:"Island", type:"Basic Land — Island", o:""}), newCard({n:"Riese", type:"Creature — Giant", o:"", pw:5, tg:5}), newCard({n:"Sorg", type:"Sorcery", o:""})]; botChanged()');
    const ib = C('Inevitable Betrayal'); ev('runAbility')(ib, spell(ib), {}); await wait(120);
    const b0 = btns(); const kb = b0.find(x => /^KI|Test/.test(x)); if(kb) await click(kb); await wait(150);
    const shown = [...d.querySelectorAll('#modalBox .card')].map(e => e.textContent).join('|');
    check(/Riese/.test(shown) && !/Island|Sorg/.test(shown), `Betrayal: nur Kreaturen zur Wahl (${shown}; ${b0.join(',')})`);
    await clickCard('Riese'); await wait(200); await drain();
    const r = S().bf.find(c => c.n === 'Riese');
    check(r && r.ow && r.ow.id === 'bot' && ev('BOT.library.length') === 2 && !ev('BOT.library.some(c => c.n === "Riese")'), `Betrayal: Riese unter meiner Kontrolle (${S().bf.map(c => c.n)})`); }
  // Living End
  await reset(); { const a = N('MeinTot', 'Creature — Zombie', '', {pw:3, tg:3}), b = N('MeinLebend', 'Creature — Elf', '', {pw:1, tg:1}); S().gy.push(a, N('Spruch', 'Instant', '')); put(b);
    ev('BOT.gy = [newCard({n:"KiTot", type:"Creature — Zombie", o:"", pw:4, tg:4})]; BOT.bf.push(newCard({n:"KiLebend", type:"Creature — Bear", o:"", pw:2, tg:2}), newCard({n:"KiLand", type:"Basic Land — Island", o:""})); botChanged()');
    const le = C('Living End'); ev('runAbility')(le, spell(le), {}); await wait(250); await drain();
    check(S().bf.includes(a) && S().gy.includes(b) && !S().bf.includes(b) && S().gy.some(c => c.n === 'Spruch'), `Living End: bei mir getauscht (bf ${S().bf.map(c => c.n)}, gy ${S().gy.map(c => c.n)})`);
    check(ev('BOT.bf.map(c => c.n).sort().join(",")') === 'KiLand,KiTot' && ev('BOT.gy.map(c => c.n).join(",")') === 'KiLebend', `Living End: bei der KI getauscht (${ev('BOT.bf.map(c => c.n).join(",")')} / ${ev('BOT.gy.map(c => c.n).join(",")')})`); }
  // Oblivion Stone
  await reset(); { const os = C('Oblivion Stone'), x = N('Behalten', 'Creature — Elf', '', {pw:1, tg:1}), y = N('Weg', 'Artifact', ''), l = N('Forest', 'Basic Land — Forest', ''); put(os, x, y, l);
    ev('BOT.bf.push(newCard({n:"KiBleibt", type:"Creature — Bear", o:"", pw:2, tg:2}), newCard({n:"KiWeg", type:"Enchantment", o:""}), newCard({n:"KiLand", type:"Basic Land — Island", o:""})); botChanged()');
    const [a1, a2] = acts(os);
    ev('runAbility')(os, a1, {}); await wait(100); await clickCard('Behalten'); await wait(80); await drain();
    ev('runAbility')(os, a1, {}); await wait(100); await clickCard('KiBleibt'); await wait(80); await drain();
    check(ev('S.fate.length') === 2, 'Oblivion Stone: zwei Schicksalsmarken');
    ev('runAbility')(os, a2, {}); await wait(250); await drain(); await wait(100);
    check(S().bf.includes(x) && S().bf.includes(l) && !S().bf.includes(y), `Oblivion Stone: bei mir nur ohne Marke zerstört (${S().bf.map(c => c.n)})`);
    check(ev('BOT.bf.map(c => c.n).sort().join(",")') === 'KiBleibt,KiLand', `Oblivion Stone: bei der KI (${ev('BOT.bf.map(c => c.n).join(",")')})`);
    check(ev('S.fate.length') === 0, 'Oblivion Stone: Marken entfernt'); }
  // Narset: Gegner ziehen höchstens eine Karte pro Zug
  await reset(); { lib(N('A', 'Instant'), N('B', 'Instant'), N('C', 'Instant')); w.__no = T['Narset, Parter of Veils'].o; ev('BOT.bf.push(newCard({n:"Narset, Parter of Veils", type:"Legendary Planeswalker — Narset", o:window.__no})); botChanged()');
    ev('draw(2)'); await wait(30); check(S().hand.length === 1, `Narset der KI: ich ziehe nur eine (${S().hand.length})`);
    ev('draw(1)'); await wait(30); check(S().hand.length === 1, 'Narset der KI: zweite Ziehung im Zug entfällt'); }
  await reset(); { const na = C('Narset, Parter of Veils'); put(na); lib(N('A', 'Instant'), N('B', 'Instant'));
    ev('draw(2)'); await wait(30); check(S().hand.length === 2, `Eigene Narset: ich ziehe normal (${S().hand.length})`);
    ev('BOT.hand = []; BOT.library = [newCard({n:"X", type:"Instant", o:""}), newCard({n:"Y", type:"Instant", o:""})]; botDraw(2)');
    check(ev('BOT.hand.length') === 1, `Eigene Narset: KI zieht nur eine (${ev('BOT.hand.length')})`); }
  // Karn, Argent Defender: Artefakte und Kreaturen lösen beim Eintreten nichts aus
  for(const withKarn of [false, true]){ await reset(); lib(N('a', 'Instant'), N('b', 'Instant'), N('c', 'Instant')); if(withKarn) put(C('Karn, Argent Defender', {pw:1, tg:4}));
    const cr = N('Looter', 'Creature — Cleric', 'When this creature enters, draw a card.', {pw:1, tg:1}), ar = N('Ding', 'Artifact', 'When this artifact enters, draw a card.');
    S().hand.push(cr, ar); ev('commit()'); ev('moveCard')(cr.u, 'bf'); await wait(150); await click('Ja'); await wait(100); ev('moveCard')(ar.u, 'bf'); await wait(150); await click('Ja'); await wait(100); await drain();
    check(S().hand.length === (withKarn ? 0 : 2), `Karn ${withKarn ? 'im Spiel: nichts ausgelöst' : 'fehlt: beide lösen aus'} (${S().hand.length})`); }
  // Lücke: March-Zyklus – farbige Karten aus der Hand verbannen, je {2} billiger (auch für X)
  { const R28 = Object.fromEntries(JSON.parse(fs.readFileSync('report28_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
    await reset(); const ma = ev('newCard')({...R28['March of Swirling Mist'], img:null}), b1 = N('Blau1', 'Instant', '', {mc:'{U}'}), b2 = N('Blau2', 'Sorcery', '', {mc:'{1}{U}'}), r1 = N('Rot', 'Instant', '', {mc:'{R}'});
    S().hand.push(ma, b1, b2, r1); ev('commit()'); const pr = ev('castCosts')(ma); await wait(100);
    const shown = [...d.querySelectorAll('#modalBox .card')].map(e => e.textContent).join('|');
    check(/Blau1/.test(shown) && /Blau2/.test(shown) && !/Rot/.test(shown) && !/March/.test(shown), `March: nur blaue Karten zur Wahl (${shown})`);
    await clickCard('Blau1'); await clickCard('Blau2'); await click('Fertig'); await wait(80); await pr;
    check(S().ex.includes(b1) && S().ex.includes(b2) && S().hand.includes(r1) && ma.marchN === 2, `March: zwei Karten verbannt (${ma.marchN})`);
    check(ev('costMods')(ma).less === 4, `March: kostet {4} weniger (${ev('costMods')(ma).less})`);
    const plan = ev('playerPayPlan')(ma, 4); check(plan && (plan.missing || []).join('') === '{U}', `March: bei X=4 fehlt nur noch {U} (${JSON.stringify(plan && plan.missing)})`);
    ma.marchN = 0; const plan0 = ev('playerPayPlan')(ma, 4); check((plan0.missing || []).length > 1, `March: ohne Rabatt fehlt mehr (${JSON.stringify(plan0.missing)})`); check(ev('costMods')(ma).less === 0, 'March: ohne verbannte Karten kein Rabatt'); }
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
