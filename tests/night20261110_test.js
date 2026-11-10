const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('night20261110_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  const acts = c => ev("parseAbilities")(c).filter(a => a.kind === "act");
  const botBear = (n = "Bär", x = "") => ev(`BOT.bf.push(newCard({n:"${n}", type:"Creature — Bear", o:"", pw:2, tg:2})); ${x} botChanged()`);
  // Boomerang Basics: eigene Karte → ziehen, fremde → nicht
  await reset(); { const own = N('Eigen', 'Artifact', ''); put(own); lib(N('Z1', 'Instant'), N('Z2', 'Instant'));
    await cast(C('Boomerang Basics')); await clickCard('Eigen'); await wait(150); await drain();
    check(S().hand.includes(own) && S().hand.some(c => c.n === 'Z1'), 'Boomerang Basics: eigene Karte auf die Hand und eine Karte gezogen'); }
  await reset(); { botBear(); lib(N('Z1', 'Instant'));
    await cast(C('Boomerang Basics')); await clickCard('Bär'); await wait(150); await drain();
    check(ev('!BOT.bf.length') && !S().hand.some(c => c.n === 'Z1'), 'Boomerang Basics: fremde Karte zurück, kein Ziehen'); }
  // Damnation: Regeneration hilft nicht
  await reset(); botBear('Troll', 'BOT.bf[0].regen = turnKey();'); await cast(C('Damnation')); await wait(200); await drain();
  check(ev('!BOT.bf.length'), 'Damnation: Kreatur trotz Regeneration zerstört');
  // Day's Undoing: Hand + Friedhof in die Bibliothek, genau 7 ziehen, Zug endet
  await reset(); { for(let i = 0; i < 10; i++) lib(N('L' + i, 'Instant')); S().hand.push(N('H1', 'Instant')); S().gy.push(N('G1', 'Instant')); ev('commit()');
    await cast(C("Day's Undoing")); await wait(1200); await drain(); await wait(300);
    check(S().hand.length === 7 && S().gy.length === 0, `Day's Undoing: 7 Karten auf der Hand, Friedhof leer (${S().hand.length}/${S().gy.length})`);
    check(ev('TURN.active') !== ev('me.id'), "Day's Undoing: dein Zug endet");
    check(S().ex.some(c => c.n === "Day's Undoing"), "Day's Undoing: ins Exil statt in den Friedhof"); }
  // Abhorrent Oculus: Manifest dread
  await reset(); { const oc = C('Abhorrent Oculus', {pw:5, tg:5}); put(oc); const a1 = N('Spontan', 'Instant', 'Draw a card.'), a2 = N('Bär2', 'Creature — Bear', '', {pw:3, tg:3});
    lib(a1, a2); ev('runAbility')(oc, trig(oc), {}); await wait(100); await clickCard('Bär2'); await wait(100); await drain();
    check(S().bf.includes(a2) && a2.fd && ev('power')(a2) === 2 && ev('tough')(a2) === 2 && ev('isCreature')(a2) && S().gy.includes(a1), 'Abhorrent Oculus: verdeckte 2/2, andere Karte im Friedhof');
    ev('cardMenu') && 0; a2.fd = false; ev('unmanifest')(a2); check(ev('power')(a2) === 3 && /Bear/.test(a2.type), 'Manifest: aufgedeckt wieder 3/3 Bär');
    const s1 = N('Spont2', 'Sorcery', ''), s2 = N('Spont3', 'Sorcery', ''); lib(s1, s2); ev('runAbility')(oc, trig(oc), {}); await wait(100); await clickCard('Spont2'); await wait(100); await drain();
    ev('moveCard')(s1.u, 'gy'); check(S().gy.includes(s1) && s1.type === 'Sorcery' && !s1.fd, 'Manifest: verdeckte Hexerei stirbt und ist wieder eine Hexerei'); }
  // Archon of Cruelty
  await reset(); { botBear(); ev('BOT.hand = [newCard({n:"Handkarte", type:"Instant", o:""})]; BOT.life = 20; S.life = 10'); lib(N('Z1', 'Instant'));
    const ar = C('Archon of Cruelty', {pw:6, tg:6}); put(ar); ev('runAbility')(ar, trig(ar), {}); await wait(400); await drain(); await wait(200);
    check(ev('BOT.life') === 17 && ev('!BOT.bf.length') && ev('BOT.hand.length') === 0, `Archon of Cruelty: KI opfert, wirft ab, verliert 3 (${ev('BOT.life')}, bf ${ev('BOT.bf.length')}, hand ${ev('BOT.hand.length')})`);
    check(S().life === 13 && S().hand.some(c => c.n === 'Z1'), `Archon of Cruelty: ich ziehe und erhalte 3 (${S().life})`); }
  // Basim Ibn Ishaq
  await reset(); { const ba = C('Basim Ibn Ishaq', {pw:1, tg:1}); put(ba); lib(N('Z1', 'Instant')); ev('runAbility')(ba, trig(ba), {}); await wait(150); await drain();
    check(ev('kwHas')(ba, 'unblockable') && S().hand.length === 1, 'Basim Ibn Ishaq: ziehen und unblockbar'); }
  // Celestial Colonnade
  await reset(); { const cc = C('Celestial Colonnade'); put(cc); const a = acts(cc).find(x => /becomes/.test(x.text || JSON.stringify(x.steps || ''))) || acts(cc).pop();
    ev('runAbility')(cc, a, {}); await wait(150); await drain();
    check(ev('isCreature')(cc) && ev('power')(cc) === 4 && ev('kwHas')(cc, 'flying') && ev('kwHas')(cc, 'vigilance'), 'Celestial Colonnade: 4/4 Flug, Wachsamkeit'); }
  // Cephalid Coliseum: ich ziehe 3, werfe 3 ab
  await reset(); { const ce = C('Cephalid Coliseum'); put(ce); for(let i = 0; i < 3; i++) lib(N('Z' + i, 'Instant')); S().hand.push(N('A', 'Instant'), N('B', 'Instant'), N('C', 'Instant')); ev('commit()');
    const a = acts(ce).find(x => /discards/.test(x.text || '')); ev('runAbility')(ce, a, {}); await wait(150); await click('Du'); await wait(150);
    for(const n of ['A', 'B', 'C']) await clickCard(n); await click('Fertig'); await wait(150); await drain();
    check(S().hand.length === 3 && S().hand.every(c => /^Z/.test(c.n)), `Cephalid Coliseum: 3 gezogen, 3 abgeworfen (${S().hand.map(c => c.n)})`); }
  // Cling to Dust
  await reset(); { S().gy.push(N('Tote', 'Creature — Bear', '', {pw:2, tg:2})); S().life = 10; ev('commit()'); await cast(C('Cling to Dust')); await clickCard('Tote'); await wait(150); await drain();
    check(S().life === 13 && S().hand.length === 0, `Cling to Dust: Kreaturenkarte → 3 Leben (${S().life})`); }
  await reset(); { S().gy.push(N('Altzauber', 'Instant')); S().life = 10; lib(N('Z1', 'Instant')); ev('commit()'); await cast(C('Cling to Dust')); await clickCard('Altzauber'); await wait(150); await drain();
    check(S().life === 10 && S().hand.some(c => c.n === 'Z1'), 'Cling to Dust: andere Karte → ziehen'); }
  // Crystal Barricade: nicht-Kampfschaden an anderen Kreaturen verhindert
  await reset(); { const bear = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(C('Crystal Barricade', {pw:0, tg:4}), bear);
    ev('receiveHit')({kind:'damage', card:bear.u, amount:3, src:'Bolt'}); await wait(50);
    check(S().bf.includes(bear), 'Crystal Barricade: Schaden an anderer Kreatur verhindert'); }
  // Cultivator Colossus: Länder nacheinander, jedes Mal ziehen
  await reset(); { const l1 = N('Forest', 'Basic Land — Forest', ''), l2 = N('Island', 'Basic Land — Island', ''); S().hand.push(l1); lib(l2, N('Z1', 'Instant'), N('Z2', 'Instant')); ev('commit()');
    const co = C('Cultivator Colossus'); put(co); ev('runAbility')(co, trig(co), {}); await wait(100); await click('Ja'); await wait(80); await clickCard('Forest'); await wait(100); await clickCard('Island'); await wait(100); await click('Keins'); await wait(100); await drain();
    check(S().bf.includes(l1) && S().bf.includes(l2) && l1.tap && l2.tap && S().hand.length === 1 && S().hand[0].n === 'Z1', `Cultivator Colossus: 2 Länder getappt, 2 gezogen (${S().hand.map(c => c.n)})`); }
  // Dalkovan Encampment: Krieger greifen mit an
  await reset(); { const de = C('Dalkovan Encampment'); put(de); const a = acts(de).find(x => /attack/.test(x.text || '')); ev('runAbility')(de, a, {}); await wait(100); await drain();
    const atk = N('Angreifer', 'Creature — Bear', '', {pw:2, tg:2}); put(atk); const list = [atk]; const ch = new w.Map([[atk.u, 'bot']]); ev('mobilize')(list, ch);
    check(list.length === 3 && list.filter(c => c.tok && c.n === 'Warrior' && c.tap && c.pw === 1).length === 2 && ch.size === 3, `Dalkovan Encampment: 2 Krieger greifen mit an (${list.length})`);
    check(ev('S.delayed').filter(x => x.action === 'sacrifice').length >= 2, 'Dalkovan Encampment: Krieger am Ende opfern'); }
  ev('S.atkTok = []');
  // Lücke: Ainok- und Winota-Angreifer greifen wirklich mit an
  const R28 = Object.fromEntries(JSON.parse(fs.readFileSync('report28_cards.json', 'utf8')).map(([n, type, o, mc, cmc, pw, tg]) => [n, {n, type, o, mc, cmc, pw, tg}]));
  const attackWith = async (...names) => { ev('openAttackDialog()'); await wait(60); for(const n of names){ const el = [...d.querySelectorAll('#modalBox .card')].find(e => e.textContent.includes(n)); if(el) el.click(); } await wait(30); await click('Angreifen'); await wait(400); };
  await reset(); { const ai = ev('newCard')({...R28['Ainok Strike Leader'], img:null}); put(ai); ev('BOT.life = 20; botChanged()');
    await attackWith('Ainok'); await wait(300); await drain(); await wait(200);
    check(ev('BOT.life') === 17, `Ainok Strike Leader: Goblin greift mit an, KI 20 → 17 (${ev('BOT.life')})`); }
  await reset(); { const wi = ev('newCard')({...R28['Winota, Joiner of Forces'], img:null}); const bear = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(wi, bear);
    const hum = N('Mensch', 'Creature — Human Soldier', '', {pw:3, tg:3}); lib(N('X1', 'Instant'), hum, N('X2', 'Instant')); ev('BOT.life = 20; botChanged()');
    await attackWith('Bär'); await wait(200); await clickCard('Mensch'); await wait(400); await drain(); await wait(200);
    check(S().bf.includes(hum) && ev('BOT.life') === 15, `Winota: Mensch greift mit an, KI 20 → 15 (${ev('BOT.life')})`); }
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
