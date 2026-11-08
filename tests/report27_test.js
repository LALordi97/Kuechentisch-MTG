const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report27_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  const bf = (...c) => { S().bf.push(...c); ev('commit()'); };
  const botBf = arr => { ev('BOT.bf = []'); arr.forEach(x => { dom.window.__x = x; ev('BOT.bf.push(newCard(window.__x))'); }); ev('botChanged()'); };
  const mana = () => ev('S.pool.C = 9; S.pool.W = 5; S.pool.U = 5; S.pool.B = 5; S.pool.R = 5; S.pool.G = 5; commit()');
  const acts = c => ev('parseAbilities')(c).filter(a => a.kind === 'act');
  const loys = c => ev('parseAbilities')(c).filter(a => a.kind === 'loy');
  const pickOpp = async () => { await wait(60); if(/Gegner|Spieler/i.test(title())) { if(!(await clickCard('KI'))) await click('KI'); } await wait(150); };
  const enter = async (c, ms = 150) => { S().hand.push(c); ev('commit()'); ev('moveCard')(c.u, 'bf'); await wait(ms); };
  // Arcum Dagsson (eigene)
  await reset(); const ar = C('Arcum Dagsson', {pw:2, tg:2}); const ac = N('Myr', 'Artifact Creature — Myr', '', {pw:1, tg:1}); bf(ar, ac); lib(N('Bombe', 'Artifact', ''), N('Golem', 'Artifact Creature', ''));
  ev('activateAbility')(ar, acts(ar)[0]); await wait(100); await clickCard('Myr'); await wait(100); await click('Ja'); await wait(100); await clickCard('Bombe'); await wait(150);
  check(S().gy.includes(ac) && S().bf.some(c => c.n === 'Bombe'), 'Arcum Dagsson: Artefaktkreatur geopfert, Artefakt geholt');
  // Damping Sphere
  await reset(); bf(C('Damping Sphere')); const tl = N('Tron', 'Land', '{T}: Add {C}{C}.'); bf(tl);
  check((ev('manaChoices')(tl) || []).every(o => (o.add || []).length === 1), 'Damping Sphere: Land für {C}{C} gibt nur {C}');
  // Encroaching Mycosynth
  await reset(); const bear = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); bf(C('Encroaching Mycosynth'), bear); S().hand.push(N('Zauber', 'Enchantment', '')); ev('commit()');
  check(/Artifact/.test(bear.type) && /Artifact/.test(S().hand[0].type), 'Mycosynth: eigene bleibende Karten sind Artefakte');
  ev('S.bf = S.bf.filter(c => c.n !== "Encroaching Mycosynth"); commit()'); check(!/Artifact/.test(bear.type), 'ohne Mycosynth wieder normal');
  // K-9
  await reset(); const k9 = C('K-9, Mark I', {pw:1, tg:1}); const lg = N('Doctor', 'Legendary Creature — Time Lord', '', {pw:2, tg:2}); bf(k9, lg); mana();
  ev('activateAbility')(k9, acts(k9)[0]); await wait(100); await clickCard('Doctor'); await wait(100);
  check(!ev('canBlock')(N('B', 'Creature', '', {pw:1, tg:1}), lg), 'K-9: legendäre Kreatur unblockbar');
  // Mindslaver
  await reset(); const ms = C('Mindslaver'); bf(ms); mana(); ev('activateAbility')(ms, acts(ms)[0]); await wait(100); await pickOpp(); await wait(100);
  check(S().gy.includes(ms) && [...d.querySelectorAll('#log > div')].some(x => /kontrollierst/.test(x.textContent)), 'Mindslaver: geopfert, Kontrolle angesagt');
  // Nexus of Becoming
  await reset(); bf(C('Nexus of Becoming')); lib(N('Z', 'Instant')); S().hand.push(N('Ritter', 'Creature — Human Knight', 'First strike', {pw:2, tg:2})); ev('commit()');
  ev('abilEvent({kind:"phase", phase:"combat", mine:true})'); await wait(150); await clickCard('Ritter'); await wait(150);
  const nx = S().bf.find(c => c.tok && c.n === 'Ritter'); check(nx && ev('power')(nx) === 3 && /Artifact Creature/.test(nx.type) && /Golem/.test(nx.type), 'Nexus of Becoming: 3/3-Golem-Kopie');
  // Rapid Hybridization
  await reset(); botBf([{n:'Drache', type:'Creature — Dragon', pw:5, tg:5}]); await cast(C('Rapid Hybridization', {mc:''})); await wait(60); await clickCard('Drache'); await wait(200);
  check(ev('BOT.gy.some(c => c.n === "Drache") && BOT.bf.some(c => c.tok && c.pw === 3)'), 'Rapid Hybridization: KI erhält 3/3 Frosch-Echse');
  // Unwinding Clock
  await reset(); const uc = C('Unwinding Clock'); const ring = N('Ring', 'Artifact', ''); bf(uc, ring); ring.tap = true; ev('remindTriggers("upkeep", false)'); await wait(40);
  check(!ring.tap, 'Unwinding Clock: Artefakte im fremden Zug enttappt');
  // Academy Ruins
  await reset(); const au = C('Academy Ruins'); bf(au); S().gy.push(N('Bombe', 'Artifact', '')); ev('commit()'); mana();
  ev('activateAbility')(au, acts(au)[0]); await wait(100); await clickCard('Bombe'); await wait(100);
  check(S().library[0] && S().library[0].n === 'Bombe', 'Academy Ruins: Artefakt oben auf die Bibliothek');
  // Deep Space 9
  await reset(); lib(N('L', 'Land'), N('I', 'Instant'), N('Kreatur', 'Creature', '', {pw:1, tg:1}), N('S', 'Sorcery'), N('Rest', 'Instant')); const ds = C('Deep Space 9'); await enter(ds, 200);
  check(S().bf.some(c => c.n === 'L') && S().bf.some(c => c.n === 'Kreatur') && S().ex.length === 2, 'Deep Space 9: bleibende Karten ins Spiel');
  const cr = N('Grosse', 'Creature', '', {pw:9, tg:9}); bf(cr); const st = ev('cardMenu')(ds, 'bf').find(i => /Station/.test(i.l || '')); check(!!st, 'Station im Menü');
  st.f(); await wait(100); await clickCard('Grosse'); await wait(100);
  check(ds.c === 9 && ev('power')(cr) === 12, 'Station 9: Kreaturen +3/+3');
  // Extinguisher Battleship
  await reset(); const eb = C('Extinguisher Battleship', {pw:10, tg:10}); bf(eb); ev('commit()'); check(!ev('isCreature')(eb), 'Raumschiff ohne Marken: keine Kreatur');
  eb.c = 5; ev('commit()'); console.log('   EB:', eb.type, JSON.stringify(eb.kw), JSON.stringify(eb.o), eb._stType); check(ev('isCreature')(eb) && ev('kwHas')(eb, 'flying') && ev('kwHas')(eb, 'trample'), 'Station 5+: Kreatur mit Flying und Trample');
  // Gerrard's Hourglass Pendant
  await reset(); const gp = C("Gerrard's Hourglass Pendant"); const dd = N('Tot', 'Creature', '', {pw:1, tg:1}); bf(gp, dd); ev('moveCard')(dd.u, 'gy'); mana();
  ev('activateAbility')(gp, acts(gp)[0]); await wait(150);
  check(S().bf.includes(dd) && dd.tap, 'Pendant: diesen Zug gestorbene Kreatur kommt getappt zurück');
  // God-Pharaoh's Statue
  ev(`others.bot = others.bot || {}; others.bot.bf = [{u:"g1", n:"God-Pharaoh's Statue", type:"Artifact"}]`); check(ev('costMods')(N('Opt', 'Instant', '', {mc:'{U}'})).more >= 2, "God-Pharaoh's Statue: Zauber des Gegners +2"); ev('others.bot.bf = []');
  // H.E.R.B.I.E., The Ten Rings: Bedingungen
  ev('S.ncKey = turnKey(); S.ncCount = 1'); check(ev('interveningIf')("If you've cast a noncreature spell this turn, surveil 1.", {}).ok === true, 'H.E.R.B.I.E.: Bedingung erkannt');
  check(ev('interveningIf')("If you have fewer than ten cards in hand, draw a card.", {}).ok === true, 'The Ten Rings: Bedingung erkannt');
  // Invasion Submersible
  await reset(); const is = C('Invasion Submersible', {pw:2, tg:2}); bf(is); ev('runAbility')(is, acts(is)[0], {}); await wait(100);
  console.log('   IS:', is.type, is.c); check(ev('isCreature')(is) && is.c === 3, 'Invasion Submersible: Artefaktkreatur mit drei Marken');
  // Isochron Scepter
  await reset(); const sc = C('Isochron Scepter'); const lbo = N('Lightning Bolt', 'Instant', 'Lightning Bolt deals 3 damage to any target.', {cmc:1, mc:'{R}'}); S().hand.push(lbo); await enter(sc, 120); await clickCard('Lightning Bolt'); await wait(100);
  check(sc.imprintU === lbo.u && S().ex.includes(lbo), 'Isochron Scepter: Spontanzauber eingeprägt');
  ev('BOT.life = 20'); mana(); ev('activateAbility')(sc, acts(sc)[0]); await wait(100); await click('Ja'); await wait(100); await clickCard('KI') || await click('KI'); await wait(150);
  check(ev('BOT.life') === 17, 'Kopie gewirkt: 3 Schaden');
  // Lavaspur Boots
  await reset(); const lb = C('Lavaspur Boots'); const hb = N('Bär', 'Creature', '', {pw:2, tg:2}); lb.eq = hb.u; bf(hb, lb);
  check(ev('power')(hb) === 3 && ev('kwHas')(hb, 'haste'), 'Lavaspur Boots: +1/+0 und Haste');
  // Mishra's Factory
  await reset(); const mf = C("Mishra's Factory"); bf(mf); mana(); ev('activateAbility')(mf, acts(mf)[0]); await wait(100);
  console.log('   MF:', mf.type, mf.pw, mf.tg, title()); check(ev('isCreature')(mf) && ev('power')(mf) === 2 && ev('typeMatch')(mf, 'Assembly-Worker'), "Mishra's Factory: 2/2 Assembly-Worker");
  ev('activateAbility')(mf, acts(mf)[1]); await wait(100); await clickCard("Mishra"); await wait(100); check(ev('power')(mf) === 3, 'Factory pumpt sich selbst +1/+1');
  // Page, Loose Leaf
  await reset(); const pg = C('Page, Loose Leaf', {pw:0, tg:2}); bf(pg); S().hand.push(C('Page, Loose Leaf')); lib(N('A', 'Land'), N('B', 'Creature'), N('Opt', 'Instant')); ev('commit()');
  ev('activateAbility')(pg, acts(pg)[0]); await wait(150); await drain();
  check(S().hand.some(c => c.n === 'Opt'), 'Page: Spontanzauber auf die Hand');
  // Shield Sphere
  await reset(); const ss = C('Shield Sphere', {pw:0, tg:6}); bf(ss); ev('abilEvent({kind:"block", c:S.bf[0]})'); await wait(120); console.log('   SS:', JSON.stringify(ss.ptc), ss.tg, [...d.querySelectorAll('#log > div')].slice(-3).map(x => x.textContent).join(' || '));
  check(ev('tough')(ss) === 5, 'Shield Sphere: -0/-1 beim Blocken');
  // Tezzeret −5
  await reset(); const tz = C('Tezzeret the Seeker'); tz.c = 6; const rk = N('Stein', 'Artifact', ''); bf(tz, rk); ev('activateAbility')(tz, loys(tz)[2]); await wait(150);
  check(ev('isCreature')(rk) && ev('power')(rk) === 5, 'Tezzeret −5: Artefakte werden 5/5');
  // Trickbind (Sperre)
  await reset(); const tb = N('Maschine', 'Artifact', '{1}: Draw a card.'); bf(tb); tb.abilLockKey = ev('turnKey()'); lib(N('Z', 'Instant')); mana(); const h0 = S().hand.length;
  ev('activateAbility')(tb, acts(tb)[0]); await wait(100); check(S().hand.length === h0, 'Trickbind: gesperrte Fähigkeit geht nicht');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
