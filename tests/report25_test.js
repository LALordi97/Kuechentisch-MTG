const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report25_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  const oppBf = arr => ev(`others.bot = others.bot || {}; others.bot.bf = ${JSON.stringify(arr)}`);
  const mana = () => ev('S.pool.C = 9; S.pool.W = 5; S.pool.G = 5; commit()');
  const acts = c => ev('parseAbilities')(c).filter(a => a.kind === 'act');
  const pickOpp = async () => { await wait(60); if(/Gegner/i.test(title())) { if(!(await clickCard('KI'))) await click('KI'); } await wait(150); };
  // Bridgeworks Battle
  await reset(); const bb = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); bf(bb); botBf([{n:'Elf', type:'Creature — Elf', pw:1, tg:3}]);
  await cast(C('Bridgeworks Battle // Tanglespan Bridgeworks', {mc:''})); await wait(60); await clickCard('Bär'); await wait(80); console.log('   BB:', title(), btns().join('|')); await clickCard('Elf'); await wait(200); console.log('   BB2:', [...d.querySelectorAll('#log > div')].slice(-6).map(x => x.textContent).join(' || '));
  check(ev('BOT.gy.some(c => c.n === "Elf")') && S().bf.includes(bb), 'Bridgeworks Battle: 4/4 kämpft und tötet den 1/3');
  // Emeria's Call
  await reset(); const eh = N('Mensch', 'Creature — Human', '', {pw:1, tg:1}); bf(eh);
  await cast(C("Emeria's Call // Emeria, Shattered Skyclave", {mc:''})); await wait(150); await drain();
  const ang = S().bf.filter(c => c.tok && /Angel/.test(c.n + c.type));
  check(ang.length === 2 && ev('kwHas')(eh, 'indestructible') && !ev('kwHas')(ang[0], 'indestructible'), "Emeria's Call: zwei Engel, Nicht-Engel unzerstörbar");
  ev('remindTriggers("upkeep", true)'); await wait(60); await drain(); check(!ev('kwHas')(eh, 'indestructible'), 'endet zu Beginn deines nächsten Zugs');
  // Leonin Arbiter
  await reset(); bf(C('Leonin Arbiter', {pw:2, tg:2})); lib(N('Plains', 'Basic Land — Plains')); ev('S.arbiterKey = null');
  ev('window.__p = searchStep({what:"a basic land card", rest:"put it into your hand"}, {n:"Test"}, {})'); await wait(80);
  check(/Leonin Arbiter/.test(title()), 'Leonin Arbiter: Suche wird gesperrt'); await click('Nicht suchen'); await wait(60);
  check(!S().hand.length, 'ohne Zahlung keine Suche');
  // Aven Mindcensor
  await reset(); oppBf([{u:'m1', n:'Aven Mindcensor', type:'Creature'}]); lib(N('A', 'Instant'), N('B', 'Instant'), N('C', 'Instant'), N('D', 'Instant'), N('Plains', 'Basic Land — Plains'));
  ev('searchStep({what:"a basic land card", rest:"put it into your hand"}, {n:"Test"}, {})'); await wait(80);
  check(!$('#modalBox').textContent.includes('Plains'), 'Aven Mindcensor: nur die obersten vier'); await drain(); oppBf([]);
  // Path to Exile
  await reset(); botBf([{n:'Troll', type:'Creature — Troll', pw:3, tg:3}]); ev('BOT.library = [newCard({n:"Forest", type:"Basic Land — Forest"})]');
  await cast(C('Path to Exile', {mc:''})); await wait(60); await clickCard('Troll'); await wait(200); await drain();
  check(ev('BOT.ex.some(c => c.n === "Troll") && BOT.bf.some(c => c.n === "Forest" && c.tap)'), 'Path to Exile: KI holt ein getapptes Standardland');
  // Sanctum Prelate
  await reset(); const sp = C('Sanctum Prelate', {pw:2, tg:2}); S().hand.push(sp); ev('commit()'); ev('moveCard')(sp.u, 'bf'); await wait(100);
  const inp = d.querySelector('#modalBox input'); if(inp){ inp.value = '1'; inp.dispatchEvent(new dom.window.Event('input')); } await click('OK') || await click('Weiter') || await click('Übernehmen'); await wait(80);
  check(sp.chosen === '1', 'Sanctum Prelate: Zahl 1 gewählt');
  S().hand.push(N('Bolt', 'Instant', '', {mc:'', cmc:1})); ev('commit()'); ev('castSpell')(S().hand[S().hand.length - 1].u); await wait(80);
  check(/nicht erlaubt/.test(title()) && /Prelate/.test($('#modalBox').textContent), 'Manawert-1-Zauber gewarnt'); await click('Nicht wirken');
  // Soul Partition
  await reset(); botBf([{n:'Golem', type:'Artifact Creature', pw:3, tg:3}]);
  await cast(C('Soul Partition', {mc:''})); await wait(60); await clickCard('Golem'); await wait(200);
  check(ev('BOT.ex.some(c => c.n === "Golem")'), 'Soul Partition: Karte der KI verbannt');
  await reset(); const own = N('Mein Ding', 'Artifact', '', {mc:'{2}'}); bf(own); await cast(C('Soul Partition', {mc:''})); await wait(60); await clickCard('Mein Ding'); await wait(200);
  check(S().ex.includes(own) && own.castKey === 'perm' && own.playOk, 'eigene Karte: aus dem Exil spielbar');
  // Spirit of the Labyrinth
  await reset(); bf(C('Spirit of the Labyrinth', {pw:3, tg:1})); lib(N('a', 'Instant'), N('b', 'Instant'), N('c', 'Instant')); ev('S.drawKey = null');
  ev('draw(2)'); check(S().hand.length === 1, 'Spirit: von zwei nur eine gezogen'); ev('draw(1)'); check(S().hand.length === 1, 'zweite Ziehung im Zug blockiert');
  // Angel's Grace
  await reset(); ev('S.life = 3'); await cast(C("Angel's Grace", {mc:''})); await wait(80); ev('receiveHit({kind:"damage", amount:10})');
  check(S().life === 1, "Angel's Grace: Leben bleibt bei 1"); ev('S.graceKey = null; S.life = 20');
  // Blind Obedience
  check(ev('ENTER_TAPPED_OPP')['Blind Obedience'] === 'artifact or creature', 'Blind Obedience: gegnerische Artefakte/Kreaturen getappt');
  // Charismatic Conqueror
  await reset(); bf(C('Charismatic Conqueror', {pw:2, tg:2})); botBf([{n:'Stein', type:'Artifact'}]);
  ev('oppBoardScan()'); await wait(300); await drain();
  console.log('   LOG:', [...d.querySelectorAll('#log > div')].slice(-4).map(x => x.textContent).join(' || '), '| T:', title(), btns().join('|')); check(ev('BOT.bf[0].tap') && !S().bf.some(c => c.tok), 'Conqueror: KI tappt das Artefakt, kein Token');
  ev('BOT.bf.push(newCard({n:"Ork", type:"Creature — Orc", pw:2, tg:2}))'); ev('botChanged()'); await wait(60); ev('oppBoardScan()'); await wait(300); await drain();
  check(S().bf.some(c => c.tok && /Vampire/.test(c.n + c.type)), 'Kreatur bleibt ungetappt → Vampir-Token');
  // Craterhoof
  await reset(); const ch1 = N('A', 'Creature', '', {pw:1, tg:1}), ch2 = N('B', 'Creature', '', {pw:1, tg:1}); bf(ch1, ch2); const hoof = C('Craterhoof Behemoth', {pw:5, tg:5}); S().hand.push(hoof); ev('commit()'); ev('moveCard')(hoof.u, 'bf'); await wait(150);
  check(ev('power')(ch1) === 4 && ev('kwHas')(ch1, 'trample') && ev('power')(hoof) === 8, 'Craterhoof: +3/+3 und Trample bei drei Kreaturen');
  // Elesh Norn, Grand Cenobite
  await reset(); const en = C('Elesh Norn, Grand Cenobite', {pw:4, tg:7}); const eb = N('Bär', 'Creature', '', {pw:2, tg:2}); bf(en, eb); botBf([{n:'Ork', type:'Creature — Orc', pw:3, tg:3}]);
  check(ev('power')(eb) === 4 && ev('power')(en) === 4 && ev('tough(BOT.bf[0])') === 1, 'Elesh Norn GC: +2/+2 eigene, -2/-2 für die KI');
  oppBf([{u:'e1', n:'Elesh Norn, Grand Cenobite', type:'Creature'}]); ev('S.bf = S.bf.filter(c => c.n !== "Elesh Norn, Grand Cenobite"); commit()'); check(ev('power')(eb) === 0, 'gegnerische Elesh Norn: -2/-2 für mich'); oppBf([]);
  // Elesh Norn, Mother of Machines
  await reset(); bf(C('Elesh Norn, Mother of Machines', {pw:4, tg:7})); const etb = N('Bote', 'Creature', 'When this creature enters, you gain 1 life.', {pw:1, tg:1}); ev('S.life = 20'); S().hand.push(etb); ev('commit()'); ev('moveCard')(etb.u, 'bf'); await wait(200);
  console.log('   LOG:', [...d.querySelectorAll('#log > div')].slice(-4).map(x => x.textContent).join(' || '), '| T:', title(), btns().join('|')); check(S().life === 22, 'Elesh Norn MoM: Eintritts-Auslöser doppelt');
  await reset(); oppBf([{u:'e2', n:'Elesh Norn, Mother of Machines', type:'Creature'}]); const etb2 = N('Bote', 'Creature', 'When this creature enters, you gain 1 life.', {pw:1, tg:1}); ev('S.life = 20'); S().hand.push(etb2); ev('commit()'); ev('moveCard')(etb2.u, 'bf'); await wait(200);
  check(S().life === 20, 'gegnerische Elesh Norn MoM: kein Auslöser'); oppBf([]);
  // Linvala
  oppBf([{u:'l1', n:'Linvala, Keeper of Silence', type:'Creature'}]); const lv = N('Elf', 'Creature — Elf', '{T}: Add {G}.', {pw:1, tg:1}); bf(lv);
  check(!(ev('manaChoices')(lv) || []).length, 'Linvala: Kreaturen ohne Mana-Fähigkeit'); oppBf([]);
  // Loran
  await reset(); const lo = C('Loran of the Third Path', {pw:1, tg:3}); bf(lo); lib(N('x', 'Instant')); ev('BOT.library = [newCard({n:"y", type:"Instant"})]; BOT.hand = []');
  ev('activateAbility')(lo, acts(lo)[0]); await wait(100); await pickOpp(); await wait(100);
  check(S().hand.length === 1 && ev('BOT.hand.length') === 1, 'Loran: beide ziehen');
  // Once Upon a Time
  await reset(); ev('S.gameSpells = 0'); const ou = C('Once Upon a Time'); S().hand.push(ou); ev('commit()'); ev('castSpell')(ou.u); await wait(100);
  console.log('   LOG:', [...d.querySelectorAll('#log > div')].slice(-4).map(x => x.textContent).join(' || '), '| T:', title(), btns().join('|')); check(btns().some(b => /ohne Manakosten/.test(b)), 'Once Upon a Time: erster Zauber gratis angeboten'); await click('Abbrechen'); await drain();
  ev('S.gameSpells = 3'); S().hand.push(C('Once Upon a Time')); ev('commit()'); ev('castSpell')(S().hand[S().hand.length - 1].u); await wait(100);
  check(!btns().some(b => /ohne Manakosten/.test(b)), 'nicht mehr gratis nach anderen Zaubern'); await drain();
  // Riftstone Portal
  await reset(); S().gy.push(C('Riftstone Portal')); const wl = N('Wastes', 'Basic Land', '{T}: Add {C}.'); bf(wl);
  check((ev('manaChoices')(wl) || []).some(o => (o.add || []).includes('G')), 'Riftstone Portal im Friedhof: Länder geben {G} oder {W}');
  // Serra's Emissary
  await reset(); const se = C("Serra's Emissary", {pw:7, tg:7}); se.chosen = 'Creature'; bf(se);
  check(!ev('canBlock')(N('Blocker', 'Creature', '', {pw:1, tg:1}), se), "Serra's Emissary (Kreatur): nicht blockbar");
  ev('S.life = 20'); ev('receiveHit({kind:"damage", amount:3, srcType:"Creature — Goblin"})'); check(S().life === 20, 'Schaden von Kreaturen verhindert');
  ev('receiveHit({kind:"damage", amount:3, srcType:"Instant"})'); check(S().life === 17, 'Schaden von Spontanzaubern kommt durch');
  // Swift Reconfiguration
  await reset(); const sw = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); bf(sw); const sr = C('Swift Reconfiguration'); sr.eq = sw.u; bf(sr);
  check(!ev('isCreature')(sw), 'Swift Reconfiguration: keine Kreatur mehr');
  // Thalia
  await reset(); bf(C('Thalia, Guardian of Thraben', {pw:2, tg:1})); check(/\+1/.test(JSON.stringify(ev('costMods')(N('Opt', 'Instant', '', {mc:'{U}'}))) || ''), 'Thalia: Nicht-Kreatur-Zauber +1');
  // Winds of Abandon Overload
  await reset(); botBf([{n:'K1', type:'Creature', pw:1, tg:1}, {n:'K2', type:'Creature', pw:1, tg:1}]); ev('BOT.library = [newCard({n:"Plains", type:"Basic Land — Plains"}), newCard({n:"Island", type:"Basic Land — Island"})]'); mana();
  const wa = C('Winds of Abandon'); S().hand.push(wa); ev('commit()'); ev('castSpell')(wa.u); await wait(100); console.log('   LOG:', [...d.querySelectorAll('#log > div')].slice(-4).map(x => x.textContent).join(' || '), '| T:', title(), btns().join('|')); await click('Mit Overload'); await wait(300); console.log('   LOG:', [...d.querySelectorAll('#log > div')].slice(-4).map(x => x.textContent).join(' || '), '| T:', title(), btns().join('|')); await drain();
  console.log('   W:', ev('BOT.ex.map(c=>c.n).join()'), ev('BOT.bf.map(c=>c.n+c.tap).join()')); check(ev('BOT.ex.filter(c => /^K[12]$/.test(c.n)).length') === 2 && ev('BOT.bf.filter(c => /Basic/.test(c.type) && c.tap).length') === 2, 'Winds of Abandon Overload: alle Kreaturen der KI verbannt, zwei getappte Länder');
  // Yasharn
  await reset(); bf(C('Yasharn, Implacable Earth', {pw:4, tg:4})); const fe = N('Fetch', 'Land', '{T}, Pay 1 life, Sacrifice this land: Search your library for a basic land card, put it onto the battlefield, then shuffle.'); bf(fe);
  const ok = await ev('payAbilityCost')(fe, '{T}, Pay 1 life, Sacrifice this land'); check(ok === false, 'Yasharn: Leben zahlen als Kosten verboten');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
