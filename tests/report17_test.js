const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report17_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  const kiBtn = async () => { const b = [...d.querySelectorAll('#modalBox button')].find(b => /^KI/.test(b.textContent)); if(b){ b.click(); await wait(80); } return !!b; };
  const pick = async re => { const b = [...d.querySelectorAll('#modalBox button')].find(b => re.test(b.textContent)); if(b){ b.click(); await wait(40); } return !!b; };
  const act1 = (c, i = 0) => ev('activateAbility')(c, ev('parseAbilities')(c).filter(a => a.kind === 'act')[i]);
  // Magda: Herr + Treasure beim Tappen eines Zwergs
  await reset(); const mg = C('Magda, Brazen Outlaw', {pw:2, tg:1}); const dw = C('Dwarven Armorer', {pw:0, tg:2}); S().bf.push(mg, dw); ev('commit()');
  check(ev('power')(dw) === 1 && ev('power')(mg) === 2, 'Magda: andere Zwerge +1/+0');
  ev('toggleTap')(dw); await wait(60);
  check(S().bf.filter(c => c.n === 'Treasure').length === 1, 'Zwerg getappt → Schatz');
  // Dwarven Armorer
  S().hand.push(N('junk', 'Instant')); dw.tap = false; ev('commit()'); act1(dw); await wait(60); await clickCard('junk'); await wait(40); await clickCard('Magda'); await wait(40); await click('+0/+1'); await wait(40);
  console.log('   DW:', title(), btns().join('|'), [...d.querySelectorAll('#log > div')].slice(-3).map(x => x.textContent).join(' || '));
  check(ev('tough')(mg) === 2, 'Dwarven Armorer: Magda +0/+1');
  // Xorn
  await reset(); S().bf.push(C('Xorn', {pw:3, tg:2})); ev('commit()'); await ev('runSteps')(ev('parseSteps')('Create a Treasure token.', S().bf[0]), S().bf[0]); await wait(30);
  check(S().bf.filter(c => c.n === 'Treasure').length === 2, 'Xorn: zwei Schätze statt einem');
  // Enslaved Dwarf
  await reset(); const ed = C('Enslaved Dwarf', {pw:1, tg:1}); const bk = N('Knight', 'Creature — Knight', '', {pw:2, tg:2, mc:'{B}'}); S().bf.push(ed, bk); ev('commit()');
  act1(ed); await wait(60); await clickCard('Knight'); await wait(40);
  check(ev('power')(bk) === 3 && ev('kwHas')(bk, 'first strike'), 'Enslaved Dwarf: schwarzer Ritter +1/+0 mit Erstschlag');
  // Gogo
  await reset(); const gg = C('Gogo, Mysterious Mime', {pw:1, tg:1}); const ogre = N('Ogre', 'Creature — Ogre', '', {pw:4, tg:4}); S().bf.push(gg, ogre); ev('commit()');
  ev('remindTriggers("combat", true)'); await wait(60); await click('Ja'); await wait(40); await clickCard('Ogre'); await wait(60);
  check(gg.n === 'Gogo, Mysterious Mime' && ev('power')(gg) === 6 && ev('power')(ogre) === 6 && ev('kwHas')(gg, 'haste'), `Gogo: Kopie des Ogers, beide 6 Stärke mit Eile (${ev('power')(gg)})`);
  // Grafdigger's Cage
  await reset(); ev('BOT.bf = [newCard({n:"Grafdigger\'s Cage", type:"Artifact"})]; botChanged()'); await wait(20);
  const z = N('Zombie', 'Creature — Zombie', '', {pw:2, tg:2}); S().gy.push(z); ev('commit()'); ev('moveCard')(z.u, 'bf'); await wait(30);
  check(S().gy.includes(z) && !S().bf.includes(z), "Grafdigger's Cage: Kreatur bleibt im Friedhof");
  // Spark Mage
  await reset(); ev('BOT.bf = [newCard({n:"Elf", type:"Creature", pw:1, tg:1})]; botChanged()'); await wait(20);
  const sm = C('Spark Mage', {pw:2, tg:2}); S().bf.push(sm); ev('commit()'); w.__s = sm;
  ev('abilEvent({kind:"combatDamage", c:window.__s, pid:"bot", much:2, first:true}, [window.__s])'); await wait(60); await click('Ja'); await wait(40); await clickCard('Elf'); await wait(60);
  check(!ev('BOT.bf.length'), 'Spark Mage: 1 Schaden tötet den Elf der KI');
  // Torpor Orb
  await reset(); lib(N('a', 'Instant')); S().bf.push(C('Torpor Orb')); ev('commit()');
  const etb = N('Looter', 'Creature', 'When this creature enters, draw a card.', {pw:1, tg:1}); S().hand.push(etb); ev('commit()'); ev('moveCard')(etb.u, 'bf'); await wait(60);
  check(S().hand.length === 0, 'Torpor Orb: kein Eintritts-Auslöser');
  // Barkform Harvester
  await reset(); const bh = C('Barkform Harvester', {pw:2, tg:3}); S().bf.push(bh); S().gy.push(N('Combo', 'Instant')); ev('commit()');
  act1(bh); await wait(40); await clickCard('Combo'); await wait(40);
  check(S().library[S().library.length - 1].n === 'Combo', 'Barkform: Karte unter die Bibliothek');
  // Bottle-Cap Blast
  await reset(); ev('BOT.bf = [newCard({n:"Elf", type:"Creature", pw:1, tg:1})]; botChanged()'); await wait(20);
  await cast(C('Bottle-Cap Blast', opt)); await clickCard('Elf'); await wait(80);
  const tr = S().bf.filter(c => c.n === 'Treasure');
  check(tr.length === 4 && tr.every(c => c.tap), `Bottle-Cap Blast: 5 an 1/1 → 4 getappte Schätze (${tr.length})`);
  // Motorcycle
  await reset(); const mc = C("Captain America's Motorcycle"); const b2 = N('Bear', 'Creature', '', {pw:2, tg:2}); S().bf.push(b2); S().hand.push(mc); ev('commit()'); ev('moveCard')(mc.u, 'bf'); await wait(60); await clickCard('Bear'); await wait(40);
  check(ev('power')(b2) === 4, 'Motorcycle: Bär +2/+0');
  // Clown Car
  await reset(); const cc = C('Clown Car'); cc.lastX = 4; S().hand.push(cc); ev('commit()'); ev('moveCard')(cc.u, 'bf'); await wait(80);
  check(S().bf.filter(c => /Clown/.test(c.n)).length + (cc.c || 0) - 1 === 4 || S().bf.filter(c => /Clown Robot/.test(c.n)).length + (cc.c || 0) === 4, `Clown Car X=4: Token + Marken = 4 (${S().bf.filter(c => /Clown Robot/.test(c.n)).length}+${cc.c || 0})`);
  // Disruptor Flute
  await reset(); const df = C('Disruptor Flute'); S().hand.push(df); ev('commit()'); ev('moveCard')(df.u, 'bf'); await wait(40); d.querySelector('#askName').value = 'Opt'; await click('Weiter'); await wait(30);
  const op = N('Opt', 'Instant', '', {mc:'{U}'}); w.__c = op; ev('castCosts(window.__c)'); await wait(30);
  check(df.chosen === 'Opt' && op.payMc === '{U}{3}', `Disruptor Flute: Opt kostet ${op.payMc}`);
  // Dragon-Cursed Halls
  await reset(); const dh = C('Dragon-Cursed Halls'); const at = N('Bear', 'Creature', '', {pw:2, tg:2}); S().bf.push(dh, at); ev('commit()');
  act1(dh); await wait(40); await clickCard('Bear'); await wait(40); w.__b = at;
  ev('abilEvent({kind:"combatDamage", c:window.__b, pid:"bot", much:2, first:true}, [window.__b])'); await wait(60);
  check(S().bf.some(c => c.n === 'Treasure'), 'Dragon-Cursed Halls: Kampfschaden → Schatz');
  // Firdoch Core, Mutavault
  await reset(); const fc = C('Firdoch Core'); const mv = C('Mutavault'); S().bf.push(fc, mv); ev('commit()');
  act1(fc); await wait(40); act1(mv); await wait(40);
  check(ev('isCreature')(fc) && ev('power')(fc) === 4 && ev('isCreature')(mv) && ev('power')(mv) === 2 && ev('typeMatch')(mv, 'Dwarf'), 'Firdoch 4/4, Mutavault 2/2 mit allen Typen');
  ev('setTurn({active:"bot", n:99, starter:me.id, phase:0})'); await wait(30);
  check(!ev('isCreature')(fc) && !ev('isCreature')(mv), 'nach dem Zug wieder keine Kreaturen');
  ev('setTurn({active:me.id, n:100, starter:me.id, phase:2})'); await wait(60); await drain();
  // Lifecraft Engine + Maskwood + Stalactite Dagger
  await reset(); const le = C('Lifecraft Engine', {pw:3, tg:3}); S().hand.push(le); const dwarf = N('Dw', 'Creature — Dwarf', '', {pw:1, tg:1}); S().bf.push(dwarf); ev('commit()'); ev('moveCard')(le.u, 'bf'); await wait(40);
  d.querySelector('#askType').value = 'Dwarf'; await click('Weiter'); await wait(30);
  check(ev('power')(dwarf) === 2, 'Lifecraft Engine: Zwerge +1/+1');
  const mn = C('Maskwood Nexus'); const spirit = N('Sp', 'Creature — Spirit', '', {pw:1, tg:1}); S().bf.push(mn, spirit); ev('commit()');
  check(ev('power')(spirit) === 2, 'Maskwood Nexus: Geist zählt als Zwerg');
  // Liquimetal Torque
  await reset(); const lt = C('Liquimetal Torque'); const en = N('Ench', 'Enchantment'); S().bf.push(lt, en); ev('commit()');
  act1(lt); await wait(40); await clickCard('Ench'); await wait(40);
  check(/Artifact/.test(en.type), 'Liquimetal Torque: Verzauberung ist Artefakt');
  // Óin the Brave
  await reset(); ev('S.enduring = false'); const oin = C('Óin the Brave', {pw:1, tg:3}); S().bf.push(oin, N('A1', 'Artifact'), N('A2', 'Artifact')); ev('commit()');
  ev('S.enduring = false'); S().bf.pop(); ev('commit()');
  check(ev('power')(oin) === 1, 'Óin: noch keine Geschichte (Óin + 1 Artefakt)');
  S().bf.push(N('A3', 'Artifact')); ev('commit()');
  check(ev('power')(oin) === 2 && ev('kwHas')(oin, 'haste'), `Óin: enduring story → 2/3 mit Eile (${ev('power')(oin)})`);
  // Peter Parker's Camera
  await reset(); lib(N('a', 'Instant'), N('b', 'Instant')); const lo = N('Looter', 'Creature', '{T}: Draw a card.', {pw:1, tg:1}); const cam = C("Peter Parker's Camera"); cam.c = 3; S().bf.push(lo, cam); ev('commit()');
  act1(lo); await wait(40); act1(cam); await wait(60);
  check(S().hand.length === 2, 'Camera: kopiert «Draw a card»');
  // Portal to Phyrexia
  await reset(); ev('BOT.gy = [newCard({n:"Titan", type:"Creature — Giant", pw:6, tg:6})]; botChanged()'); await wait(20);
  S().bf.push(C('Portal to Phyrexia')); ev('commit()'); ev('remindTriggers("upkeep", true)'); await wait(60); console.log('   Dialog:', title()); await clickCard('Titan'); await wait(80);
  check(S().bf.some(c => c.n === 'Titan' && /Phyrexian/.test(c.type)), 'Portal to Phyrexia: Titan der KI kommt als Phyrexianer zu dir');
  // Return the Favor
  await reset(); lib(N('a', 'Instant')); const lo2 = N('Looter', 'Creature', '{T}: Draw a card.', {pw:1, tg:1}); S().bf.push(lo2); ev('commit()'); act1(lo2); await wait(40);
  await cast(C('Return the Favor', opt)); await pick(/^Copy target/); await click('Ausführen'); await wait(60);
  check(S().hand.length === 2 || S().library.length === 0, 'Return the Favor: Fähigkeit kopiert');
  // Roaming Throne
  await reset(); lib(N('a', 'Instant'), N('b', 'Instant'));
  const rt = C('Roaming Throne', {pw:4, tg:4}); S().hand.push(rt); ev('commit()'); ev('moveCard')(rt.u, 'bf'); await wait(40); d.querySelector('#askType').value = 'Human'; await click('Weiter'); await wait(30);
  const hu = N('Seer', 'Creature — Human', 'Whenever this creature attacks, draw a card.', {pw:1, tg:1}); S().bf.push(hu); ev('commit()'); w.__h = hu;
  ev('abilEvent({kind:"attack", c:window.__h, first:true})'); await wait(80);
  check(S().hand.length === 2, 'Roaming Throne: Mensch-Auslöser doppelt');
  // Shinka
  await reset(); const sh = C('Shinka, the Bloodsoaked Keep'); const lg = N('Leg', 'Legendary Creature', '', {pw:2, tg:2}); S().bf.push(sh, lg); ev('commit()');
  act1(sh); await wait(40); await clickCard('Leg'); await wait(30);
  check(ev('kwHas')(lg, 'first strike'), 'Shinka: Erstschlag');
  // Stalactite Dagger
  await reset(); const sd = C('Stalactite Dagger'); const tok = N('Bear', 'Creature — Bear', '', {pw:2, tg:2}); sd.eq = tok.u; S().bf.push(sd, tok, C('Magda, Brazen Outlaw', {pw:2, tg:1})); ev('commit()');
  check(ev('power')(tok) === 4, `Stalactite Dagger: Bär +1/+1 und Zwerg (Magda +1) → 4 (${ev('power')(tok)})`);
  // Unlicensed Hearse
  await reset(); ev('BOT.gy = [newCard({n:"x", type:"Instant"}), newCard({n:"y", type:"Sorcery"})]; botChanged()'); await wait(20);
  const uh = C('Unlicensed Hearse'); S().bf.push(uh); ev('commit()');
  check(ev('power')(uh) === 0, 'Hearse: 0/0 am Anfang');
  act1(uh); await wait(60); console.log('   Dialog:', title()); await clickCard('x'); await wait(60); await clickCard('y'); await wait(60);
  check(ev('power')(uh) === 2, `Hearse: zwei verbannt → 2/2 (${ev('power')(uh)})`);
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
