const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report26_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  const pickOpp = async () => { await wait(60); if(/Gegner|wessen|Spieler/i.test(title())) { if(!(await clickCard('KI'))) await click('KI'); } await wait(150); };
  const enter = async (c, ms = 150) => { S().hand.push(c); ev('commit()'); ev('moveCard')(c.u, 'bf'); await wait(ms); };
  const kw = (c, k) => ev('kwHas')(c, k);
  // Absorb Identity
  await reset(); const sh = N('Wandler', 'Creature — Shapeshifter', '', {pw:1, tg:1}); bf(sh); botBf([{n:'Drache', type:'Creature — Dragon', pw:5, tg:5, o:'Flying'}]);
  await cast(C('Absorb Identity', {mc:''})); await wait(60); await clickCard('Drache'); await wait(100); await click('Ja'); await wait(100);
  check(ev('BOT.hand.some(c => c.n === "Drache")') && sh.n === 'Drache', 'Absorb Identity: zurück auf die Hand, Gestaltwandler wird Kopie');
  // Ayula: Kampf-Modus
  await reset(); const ay = C('Ayula, Queen Among Bears', {pw:2, tg:2}); bf(ay); botBf([{n:'Elf', type:'Creature — Elf', pw:1, tg:1}]);
  const br = N('Bär2', 'Creature — Bear', '', {pw:4, tg:4}); await enter(br); console.log('   AY:', title(), btns().join('|'));
  await click('Target Bear'); await click('Ausführen'); await wait(80); console.log('   AY2:', title(), btns().join('|')); await clickCard('Bär2'); await wait(80); await clickCard('Elf'); await wait(150); await drain();
  console.log('   LOG:', [...d.querySelectorAll('#log > div')].slice(-4).map(x => x.textContent).join(' || '), '| T:', title(), btns().join('|')); check(ev('BOT.gy.some(c => c.n === "Elf")'), 'Ayula: Bär kämpft');
  // Slivers
  await reset(); const s1 = N('Sliver A', 'Creature — Sliver', '', {pw:1, tg:1}), hu = N('Mensch', 'Creature — Human', '', {pw:1, tg:1}); bf(C('Cloudshredder Sliver', {pw:2, tg:2}), C('Manaweft Sliver', {pw:1, tg:1}), C('Thrumming Hivepool'), s1, hu);
  check(kw(s1, 'flying') && kw(s1, 'haste') && kw(s1, 'double strike') && !kw(hu, 'flying'), 'Slivers: Flying, Haste, Double strike nur für Slivers');
  console.log('   MW:', JSON.stringify(ev('manaChoices')(s1))); check((ev('manaChoices')(s1) || []).some(o => (o.add || []).length === 1 && o.any !== false) && !(ev('manaChoices')(hu) || []).length, 'Manaweft: Slivers geben Mana');
  // Piper, Sylvia
  await reset(); const rat = N('Ratte', 'Creature — Rat', '', {pw:1, tg:1}), dr = N('Drache', 'Creature — Dragon', '', {pw:4, tg:4}); bf(C('Piper of the Swarm', {pw:1, tg:3}), C('Sylvia Brightspear', {pw:2, tg:2}), rat, dr);
  check(kw(rat, 'menace') && kw(dr, 'double strike') && !kw(rat, 'double strike'), 'Piper: Ratten Menace; Sylvia: Drachen Double strike');
  // Descendants' Path
  await reset(); bf(C("Descendants' Path"), N('Elf1', 'Creature — Elf', '', {pw:1, tg:1})); lib(N('Elf2', 'Creature — Elf Warrior', '', {pw:2, tg:2, mc:'{3}{G}'}), N('X', 'Instant'));
  ev('abilEvent({kind:"phase", phase:"upkeep", mine:true})'); await wait(120); await click('Ja'); await wait(150); await drain();
  check(S().bf.some(c => c.n === 'Elf2'), "Descendants' Path: Elf gratis gewirkt");
  // Peer Pressure
  await reset(); bf(N('G1', 'Creature — Goblin', '', {pw:1, tg:1}), N('G2', 'Creature — Goblin', '', {pw:1, tg:1})); botBf([{n:'KiGob', type:'Creature — Goblin', pw:2, tg:2}]);
  await cast(C('Peer Pressure', {mc:''})); await wait(80); await click('Goblin'); await wait(200);
  check(S().bf.some(c => c.n === 'KiGob'), 'Peer Pressure: Goblin der KI übernommen');
  // Risen Reef
  await reset(); lib(N('Insel', 'Basic Land — Island')); const rr = C('Risen Reef', {pw:1, tg:1}); await enter(rr); await click('Ja'); await wait(100);
  console.log('   LOG:', [...d.querySelectorAll('#log > div')].slice(-4).map(x => x.textContent).join(' || '), '| T:', title(), btns().join('|')); check(S().bf.some(c => c.n === 'Insel' && c.tap), 'Risen Reef: Land getappt ins Spiel');
  // Rooftop Storm
  await reset(); bf(C('Rooftop Storm')); const zb = N('Zombie', 'Creature — Zombie', '', {pw:2, tg:2, mc:'{3}{B}'}); S().hand.push(zb); ev('commit()'); ev('play')(zb.u); await wait(100);
  check(btns().some(b => /ohne Manakosten/.test(b)), 'Rooftop Storm: Zombie für {0}'); await drain();
  // Atla Palani
  await reset(); lib(N('Z1', 'Instant'), N('Kreatur', 'Creature — Beast', '', {pw:3, tg:3}), N('Z2', 'Sorcery')); bf(C('Atla Palani, Nest Tender', {pw:2, tg:3})); const egg = N('Egg', 'Token Creature — Egg', '', {pw:0, tg:1, tok:true}); bf(egg);
  ev('moveCard')(egg.u, 'gy'); await wait(200); await drain();
  check(S().bf.some(c => c.n === 'Kreatur') && S().library.length === 2, 'Atla Palani: Kreatur ins Spiel, Rest unten');
  // Bloodline Bidding
  await reset(); S().gy.push(N('V1', 'Creature — Vampire', '', {pw:1, tg:1}), N('V2', 'Creature — Vampire', '', {pw:1, tg:1}), N('H', 'Creature — Human', '', {pw:1, tg:1})); ev('commit()');
  await cast(C('Bloodline Bidding', {mc:''})); await wait(80); await click('Vampire'); await wait(150); console.log('   BL:', title(), btns().join('|')); await click('Fertig'); await wait(100); await drain();
  check(S().bf.filter(c => /^V[12]$/.test(c.n)).length === 2 && !S().bf.some(c => c.n === 'H'), 'Bloodline Bidding: alle Vampire zurück');
  // Cairn Wanderer
  await reset(); const cw = C('Cairn Wanderer', {pw:4, tg:4}); bf(cw); S().gy.push(N('Vogel', 'Creature — Bird', 'Flying', {kw:['Flying']}), N('Wurm', 'Creature — Wurm', 'Trample', {kw:['Trample']})); ev('commit()');
  check(kw(cw, 'flying') && kw(cw, 'trample') && !kw(cw, 'lifelink'), 'Cairn Wanderer: Flying und Trample aus dem Friedhof');
  // Coveted Prize
  await reset(); bf(N('C', 'Creature — Human Cleric', '', {pw:1, tg:1}), N('R', 'Creature — Rogue', '', {pw:1, tg:1}), N('W', 'Creature — Warrior', '', {pw:1, tg:1}), N('Wi', 'Creature — Wizard', '', {pw:1, tg:1}));
  check(ev('partySize()') === 4, 'Gruppe voll (4)');
  // Exterminate!
  await reset(); botBf([{n:'Ork', type:'Creature — Orc', pw:2, tg:2}]); ev('BOT.life = 20'); await cast(C('Exterminate!', {mc:''})); await wait(60); await clickCard('Ork'); await wait(150);
  check(ev('BOT.gy.some(c => c.n === "Ork") && BOT.life === 17'), 'Exterminate!: zerstört, Beherrscher verliert 3');
  // Feisty Spikeling
  await reset(); const fs2 = C('Feisty Spikeling', {pw:2, tg:1}); bf(fs2); check(kw(fs2, 'first strike'), 'Feisty Spikeling: im eigenen Zug First strike'); ev('TURN.active = "bot"'); check(!kw(fs2, 'first strike'), 'im fremden Zug nicht'); ev('TURN.active = me.id');
  // Giada
  await reset(); bf(C('Giada, Font of Hope', {pw:2, tg:2}), N('Engel1', 'Creature — Angel', '', {pw:2, tg:2})); const a3 = N('Engel2', 'Creature — Angel', '', {pw:3, tg:3}); await enter(a3);
  check(a3.c === 2, 'Giada: +2 Marken (zwei Engel schon da)');
  // Gilt-Leaf Archdruid
  await reset(); botBf([{n:'Wald', type:'Basic Land — Forest'}, {n:'Insel', type:'Basic Land — Island'}]); const ga = C('Gilt-Leaf Archdruid', {pw:3, tg:3}); bf(ga);
  ev('window.__ga = parseAbilities(S.bf[0]).find(a => a.kind === "act")'); ev('runAbility(S.bf[0], window.__ga, {})'); await wait(80); await pickOpp(); await wait(200);
  check(S().bf.filter(c => /Wald|Insel/.test(c.n)).length === 2, 'Gilt-Leaf Archdruid: alle Länder der KI übernommen');
  // Leyline of the Guildpact
  await reset(); bf(C('Leyline of the Guildpact')); const wa = N('Wastes', 'Basic Land', '{T}: Add {C}.'); bf(wa);
  check((ev('manaChoices')(wa) || []).length > 1, 'Leyline of the Guildpact: Länder geben jede Farbe');
  // Leyline of Transformation
  await reset(); const lt = C('Leyline of Transformation'); lt.chosen = 'Elf'; bf(lt); const hm = N('Mensch', 'Creature — Human', '', {pw:1, tg:1}); bf(hm); S().hand.push(N('Hand', 'Creature — Giant')); ev('commit()');
  check(ev('typeMatch')(hm, 'Elf') && ev('typeMatch')(S().hand[0], 'Elf'), 'Leyline of Transformation: alle meine Kreaturen sind Elfen');
  // Maralen
  await reset(); ev('BOT.library = [newCard({n:"Klein", type:"Instant", cmc:1, mc:"{U}"}), newCard({n:"Gross", type:"Sorcery", cmc:5, mc:"{5}"})]'); const ma = C('Maralen, Fae Ascendant', {pw:4, tg:5}); await enter(ma, 150); await pickOpp(); await wait(150);
  console.log('   LOG:', [...d.querySelectorAll('#log > div')].slice(-4).map(x => x.textContent).join(' || '), '| T:', title(), btns().join('|')); const kl = S().ex.find(c => c.n === 'Klein'), gr = S().ex.find(c => c.n === 'Gross');
  check(kl && gr && kl.maralen, 'Maralen: zwei Karten verbannt');
  if(!gr) { console.log('skip'); } else await ev('castFromExile')(gr); await wait(60); check(S().ex.includes(gr), 'Manawert 5 > 1 Elf/Fee: nicht wirkbar');
  if(kl) await ev('castFromExile')(kl); await wait(150); await drain(); check(!S().ex.includes(kl), 'Manawert 1: gratis gewirkt');
  // Mirror Entity
  await reset(); const me1 = C('Mirror Entity', {pw:1, tg:1}); const mb = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); bf(me1, mb); ev('S.pool.C = 4; commit()');
  ev('activateAbility')(me1, acts(me1)[0]); await wait(100); const inp = d.querySelector('#modalBox input'); if(inp){ inp.value = '4'; inp.dispatchEvent(new dom.window.Event('input')); } await click('OK') || await click('Weiter') || await click('Übernehmen'); await wait(120);
  check(ev('power')(mb) === 4 && ev('typeMatch')(mb, 'Elf'), 'Mirror Entity: alle 4/4 und alle Typen');
  // Nameless Inversion
  await reset(); botBf([{n:'Ork', type:'Creature — Orc', pw:2, tg:3}]); await cast(C('Nameless Inversion', {mc:''})); await wait(60); await clickCard('Ork'); await wait(150);
  check(ev('BOT.gy.some(c => c.n === "Ork")'), 'Nameless Inversion: +3/-3 tötet den 2/3');
  // Realmbreaker
  await reset(); ev('BOT.library = [newCard({n:"KiLand", type:"Land"}), newCard({n:"x", type:"Instant"}), newCard({n:"y", type:"Instant"})]'); const rb = C('Realmbreaker, the Invasion Tree'); bf(rb); mana();
  ev('activateAbility')(rb, acts(rb)[0]); await wait(100); await pickOpp(); await wait(200); await clickCard('KiLand'); await wait(300);
  const kland = S().bf.find(c => c.n === 'KiLand'); check(kland && kland.tap && kland.exileOnLeave, 'Realmbreaker: Land der KI getappt unter meiner Kontrolle');
  // Realmwalker
  await reset(); const rw = C('Realmwalker', {pw:2, tg:3}); rw.chosen = 'Elf'; bf(rw); lib(N('ElfTop', 'Creature — Elf', '', {pw:1, tg:1, mc:''}));
  const it = ev('cardMenu')(rw, 'bf').find(i => /Oberste Karte wirken/.test(i.l || '')); check(!!it, 'Realmwalker: oberste Karte wirken im Menü');
  it.f(); await wait(150); await drain(); check(S().bf.some(c => c.n === 'ElfTop'), 'Elf von oben gewirkt');
  // Rivaz
  await reset(); bf(C('Rivaz of the Claw', {pw:1, tg:1})); const dg = N('Drache', 'Creature — Dragon', '', {pw:4, tg:4, mc:''}); S().gy.push(dg); ev('commit()');
  const rvi = ev('cardMenu')(dg, 'gy').find(i => /Rivaz/.test(i.l || '')); check(!!rvi, 'Rivaz: Drache aus dem Friedhof im Menü'); rvi.f(); await wait(150); await drain();
  check(S().bf.includes(dg) && dg.exileOnLeave, 'Drache gewirkt, wird beim Sterben verbannt'); ev('moveCard')(dg.u, 'gy'); check(S().ex.includes(dg), 'stirbt → Exil');
  // Swarmyard
  await reset(); const sy = C('Swarmyard'); const rt = N('Ratte', 'Creature — Rat', '', {pw:1, tg:1}); bf(sy, rt);
  ev('activateAbility')(sy, acts(sy)[0]); await wait(100); await clickCard('Ratte'); await wait(80);
  ev('applyHitToCard')(rt, {kind:'destroy'}, false); check(S().bf.includes(rt) && rt.tap, 'Swarmyard: Ratte regeneriert');
  // The World Tree
  await reset(); bf(C('The World Tree')); for(let i = 0; i < 5; i++) bf(N('L' + i, 'Basic Land — Forest', '{T}: Add {G}.'));
  check((ev('manaChoices')(S().bf[1]) || []).length > 1, 'The World Tree: sechs Länder → jede Farbe');
  // Urtet
  await reset(); const ur = C('Urtet, Remnant of Memnarch', {pw:2, tg:2}); const my = N('Myr', 'Artifact Creature — Myr', '', {pw:1, tg:1}); bf(ur, my); my.tap = true; ur.tap = true;
  ev('abilEvent({kind:"phase", phase:"combat", mine:true})'); await wait(120); check(!my.tap && !ur.tap, 'Urtet: Myr enttappt');
  mana(); ev('activateAbility')(ur, acts(ur)[0]); await wait(120); check(my.c === 3 && ur.c === 3, 'Urtet: +3 Marken auf jeden Myr');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
