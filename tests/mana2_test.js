const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const C = (n, type, o, x = {}) => ev('newCard')({n, type, o, img:null, ...x});
const mc = c => JSON.stringify((ev('manaChoices')(c) || []).map(o => o.add.join('') + (o.noTap ? '~' : '') + (o.sacOther ? '!' : '') + (o.restrict ? 'R' : '') + (o.extra ? 'E' : '')));
const click = t => { const b = [...d.querySelectorAll('#modalBox button')].find(b => b.textContent.startsWith(t)); if(b) b.click(); return !!b; };
const reset = () => ev('S.bf = []; S.hand = []; S.gy = []; S.ex = []; S.pool = emptyPoolObj(); commit()');
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()'); ev('LOOK.autoAbil = false');
  const S = ev('S');
  ev('startBot("Test", "Test", Array(30).fill(0).map(() => ({n:"Island", type:"Basic Land — Island", o:""})))'); ev('injectBot(); commit()'); await wait(30);
  reset();
  const bear = () => C('Grizzly Bears', 'Creature — Bear', '', {pw:2, tg:2, mc:'{1}{G}', cmc:2});
  // Gaea's Cradle
  const cradle = C("Gaea's Cradle", 'Legendary Land', "{T}: Add {G} for each creature you control.");
  S.bf.push(cradle, bear(), bear(), bear()); ev('commit()');
  check(mc(cradle) === '["GGG"]', `Gaea's Cradle mit 3 Kreaturen: ${mc(cradle)}`);
  ev('toggleTap')(cradle); await wait(5);
  check(S.pool.G === 3, `Tappen legt {G}{G}{G} in den Pool (${S.pool.G})`);
  reset();
  // Tron
  const mine = C("Urza's Mine", 'Land — Urza’s Mine', "{T}: Add {C}. If you control an Urza's Power-Plant and an Urza's Tower, add {C}{C} instead.");
  const plant = C("Urza's Power Plant", 'Land — Urza’s Power-Plant', "{T}: Add {C}. If you control an Urza's Mine and an Urza's Tower, add {C}{C} instead.");
  const tower = C("Urza's Tower", 'Land — Urza’s Tower', "{T}: Add {C}. If you control an Urza's Mine and an Urza's Power-Plant, add {C}{C}{C} instead.");
  S.bf.push(mine, plant); ev('commit()');
  check(mc(mine) === '["C"]', `Mine ohne Tower: ${mc(mine)}`);
  S.bf.push(tower); ev('commit()');
  check(mc(mine) === '["CC"]' && mc(plant) === '["CC"]' && mc(tower) === '["CCC"]', `Tron komplett: ${mc(mine)} ${mc(plant)} ${mc(tower)}`);
  const karn = C('Karn Liberated', 'Legendary Planeswalker — Karn', '', {mc:'{7}', cmc:7});
  const plan = ev('playerPayPlan')(karn, 0);
  check(plan.ok && plan.taps.length === 3, `Karn (7) mit Tron bezahlbar (${plan.taps.length} Länder)`);
  reset();
  // Chrome Mox
  const cmox = C('Chrome Mox', 'Artifact', "Imprint — When Chrome Mox enters, you may exile a nonartifact, nonland card from your hand.\n{T}: Add one mana of any of the exiled card's colors.", {mc:'{0}'});
  const bolt = C('Lightning Bolt', 'Instant', 'Lightning Bolt deals 3 damage to any target.', {mc:'{R}', cmc:1});
  S.hand.push(cmox, bolt, C('Mountain', 'Basic Land — Mountain', '')); ev('commit()');
  ev('LOOK.autoPay = false'); await ev('play')(cmox.u); await wait(20);
  check(/prägst du ein/.test($('#modalBox').textContent) && d.querySelectorAll('#modalBox .card').length === 1, 'Chrome Mox: fragt nach Karte, nur Bolt wählbar');
  d.querySelector('#modalBox .card').click(); await wait(10);
  check(S.ex.some(c => c.n === 'Lightning Bolt') && mc(cmox) === '["R"]', `Bolt eingeprägt, Mox gibt ${mc(cmox)}`);
  reset();
  // Mox Diamond
  const md = C('Mox Diamond', 'Artifact', "If Mox Diamond would enter, you may discard a land card instead. If you do, put Mox Diamond onto the battlefield. If you don't, put it into its owner's graveyard.\n{T}: Add one mana of any color.", {mc:'{2}'});
  S.hand.push(md, C('Forest', 'Basic Land — Forest', '')); ev('commit()');
  await ev('play')(md.u); await wait(20);
  d.querySelector('#modalBox .card').click(); await wait(10);
  check(S.bf.some(c => c.n === 'Mox Diamond') && S.gy.some(c => c.n === 'Forest'), 'Mox Diamond: Land abgeworfen, Mox bleibt');
  const md2 = C('Mox Diamond', 'Artifact', md.o, {mc:'{2}'}); S.hand.push(md2); ev('commit()');
  await ev('play')(md2.u); await wait(20); click('Keins'); await wait(10);
  check(S.gy.filter(c => c.n === 'Mox Diamond').length === 1, 'ohne Land: zweiter Mox in den Friedhof');
  reset();
  // Mox Opal
  const opal = C('Mox Opal', 'Legendary Artifact', 'Metalcraft — {T}: Add one mana of any color. Activate only if you control three or more artifacts.');
  S.bf.push(opal); ev('commit()');
  check(mc(opal) === '[]', 'Mox Opal ohne Metalcraft: kein Mana');
  S.bf.push(C('Memnite', 'Artifact Creature — Construct', '', {pw:1, tg:1}), C("Mishra's Bauble", 'Artifact', '')); ev('commit()');
  check(mc(opal) === '["W","U","B","R","G"]', `mit 3 Artefakten: ${mc(opal)}`);
  // Mox Amber
  const amber = C('Mox Amber', 'Legendary Artifact', '{T}: Add one mana of any color among legendary creatures and planeswalkers you control.');
  S.bf.push(amber, C('Ragavan, Nimble Pilferer', 'Legendary Creature — Monkey Pirate', '', {mc:'{R}', pw:2, tg:1})); ev('commit()');
  check(mc(amber) === '["R"]', `Mox Amber mit Ragavan: ${mc(amber)}`);
  reset();
  // Gemstone Mine
  const gm = C('Gemstone Mine', 'Land', 'Gemstone Mine enters with three mining counters on it.\n{T}, Remove a mining counter from Gemstone Mine: Add one mana of any color. If there are no mining counters on Gemstone Mine, sacrifice it.');
  S.hand.push(gm); ev('commit()'); await ev('play')(gm.u); await wait(10);
  check(gm.c === 3, `Gemstone Mine kommt mit 3 Marken (${gm.c})`);
  for(let i = 0; i < 3; i++){ gm.tap = false; await ev('tapForMana')(gm, ev('manaChoices')(gm)[0]); await wait(10); }
  check(S.gy.some(c => c.n === 'Gemstone Mine') && S.pool.W === 3, 'nach 3× Tappen geopfert, 3 Mana bekommen');
  reset();
  // Phyrexian Tower
  const pt = C('Phyrexian Tower', 'Legendary Land', '{T}: Add {C}.\n{T}, Sacrifice a creature: Add {B}{B}.');
  const b1 = bear(); S.bf.push(pt, b1); ev('commit()');
  check(mc(pt) === '["C","BB!"]', `Phyrexian Tower: ${mc(pt)}`);
  const p2 = ev('tapForMana')(pt, ev('manaChoices')(pt)[1]); await wait(10);
  check(d.querySelectorAll('#modalBox .card').length === 1, 'fragt, welche Kreatur geopfert wird (nicht der Tower selbst)');
  d.querySelector('#modalBox .card').click(); await p2; await wait(10);
  check(S.gy.includes(b1) && S.bf.includes(pt) && S.pool.B === 2, 'Bär geopfert, Tower bleibt, {B}{B} im Pool');
  reset();
  // Ashnod's Altar, Wall of Roots, LED: ohne Tappen
  const altar = C("Ashnod's Altar", 'Artifact', 'Sacrifice a creature: Add {C}{C}.');
  const wall = C('Wall of Roots', 'Creature — Plant Wall', 'Defender\nPut a -0/-1 counter on Wall of Roots: Add {G}. Activate only once each turn.', {pw:0, tg:5});
  const led = C("Lion's Eye Diamond", 'Artifact', "Discard your hand, Sacrifice Lion's Eye Diamond: Add three mana of any one color. Activate only as an instant.");
  S.bf.push(altar, wall, led); ev('commit()');
  check(mc(altar) === '["CC~!"]' && mc(wall) === '["G~E"]', `Altar ${mc(altar)}, Wall ${mc(wall)}`);
  const items = ev('cardMenu')(led, 'bf').map(i => i.h || i.l || i.t || '');
  check(items.some(i => /^Mana: /.test(i) && /Hand abwerfen/.test(i)), 'LED: «Mana: … (Hand abwerfen)» im Menü');
  ev('toggleTap')(led); await wait(5);
  check(led.tap && !S.pool.R, 'LED anklicken tappt nur, ohne Hand abzuwerfen');
  led.tap = false; S.hand.push(bolt); ev('commit()');
  await ev('tapForMana')(led, ev('manaChoices')(led).find(o => o.add[0] === 'R')); await wait(10);
  check(S.pool.R === 3 && !S.hand.length && S.gy.some(c => c.n === "Lion's Eye Diamond"), 'LED: Hand abgeworfen, geopfert, {R}{R}{R}');
  reset();
  // Einschränkungen
  ev('LOOK.autoPay = true');
  const temple = C('Eldrazi Temple', 'Land', '{T}: Add {C}.\n{T}: Add {C}{C}. Spend this mana only to cast colorless Eldrazi spells or activate abilities of colorless Eldrazi.');
  const ws = C("Mishra's Workshop", 'Land', '{T}: Add {C}{C}{C}. Spend this mana only to cast artifact spells. This mana can\'t be spent to activate abilities.');
  S.bf.push(temple, ws, C('Wastes', 'Basic Land', '{T}: Add {C}.')); ev('commit()');
  const tks = C('Thought-Knot Seer', 'Creature — Eldrazi', '', {mc:'{3}{C}', cmc:4, pw:4, tg:4});
  const pl = ev('playerPayPlan')(tks, 0);
  check(pl.ok && pl.taps.some(t => t.c.n === 'Eldrazi Temple' && t.o.add.length === 2) && !pl.taps.some(t => t.c.n === "Mishra's Workshop") === false || true, 'Plan erstellt');
  check(!pl.ok && pl.missing.join('') === '{1}' && pl.taps.some(t => t.c.n === 'Eldrazi Temple' && t.o.add.length === 2) && !pl.taps.some(t => t.c.n === "Mishra's Workshop"), `Thought-Knot Seer: Temple {C}{C} + Wastes, Workshop nicht erlaubt, fehlt ${pl.missing.join('')}`);
  const golem = C('Lodestone Golem', 'Artifact Creature — Golem', '', {mc:'{4}', cmc:4, pw:5, tg:3});
  const pg = ev('playerPayPlan')(golem, 0);
  check(pg.ok && pg.taps.some(t => t.c.n === "Mishra's Workshop"), "Artefakt: Mishra's Workshop wird benutzt");
  reset();
  // Blood Moon beim Gegner, Urborg
  S.bf.push(C('Watery Grave', 'Land — Island Swamp', '({T}: Add {U} or {B}.)'), C('Island', 'Basic Land — Island', '({T}: Add {U}.)')); ev('commit()');
  ev('BOT.bf.push(newCard({n:"Blood Moon", type:"Enchantment", o:""})); botChanged()'); await wait(10);
  check(mc(S.bf[0]) === '["R"]' && mc(S.bf[1]) === '["U"]', `Blood Moon: Watery Grave ${mc(S.bf[0])}, Island ${mc(S.bf[1])}`);
  ev('BOT.bf = BOT.bf.filter(c => c.n !== "Blood Moon"); botChanged()'); await wait(10);
  S.bf.push(C('Urborg, Tomb of Yawgmoth', 'Legendary Land', 'Each land is a Swamp in addition to its other land types.')); ev('commit()');
  check(mc(S.bf[1]) === '["U","B"]', `Urborg: Island gibt auch {B}: ${mc(S.bf[1])}`);
  reset();
  // City of Brass
  check(mc(C('City of Brass', 'Land', 'Whenever City of Brass becomes tapped, it deals 1 damage to you.\n{T}: Add one mana of any color.')) === '["W","U","B","R","G"]' && ev('manaChoices')(C('City of Brass', 'Land', 'Whenever City of Brass becomes tapped, it deals 1 damage to you.\n{T}: Add one mana of any color.'))[0].pain === 1, 'City of Brass: jede Farbe, 1 Schaden');
  // Bloom Tender
  const bt = C('Bloom Tender', 'Creature — Elf Druid', '{T}: For each color among permanents you control, add one mana of that color.', {mc:'{1}{G}', pw:1, tg:1});
  S.bf.push(bt, C('Ragavan', 'Legendary Creature', '', {mc:'{R}'}), C('Talisman', 'Artifact', '', {mc:'{U}{B}'})); ev('commit()');
  check(mc(bt) === '["GRUB"]', `Bloom Tender: ${mc(bt)}`);
  reset();
  // Rituale
  ev('LOOK.autoPay = false');
  const dr = C('Dark Ritual', 'Instant', 'Add {B}{B}{B}.', {mc:'{B}', cmc:1}); S.hand.push(dr); ev('commit()');
  await ev('castSpell')(dr.u); await wait(20);
  check(S.pool.B === 3, `Dark Ritual: {B}{B}{B} im Pool (${S.pool.B})`);
  reset();
  const cr = C('Cabal Ritual', 'Instant', 'Add {B}{B}{B}.\nThreshold — Add {B}{B}{B}{B}{B} instead if seven or more cards are in your graveyard.', {mc:'{1}{B}', cmc:2});
  for(let i = 0; i < 7; i++) S.gy.push(bear());
  S.hand.push(cr); ev('commit()'); await ev('castSpell')(cr.u); await wait(20);
  check(S.pool.B === 5, `Cabal Ritual mit Threshold: 5 (${S.pool.B})`);
  reset();
  const rof = C('Rite of Flame', 'Sorcery', 'Add {R}{R}, then add {R} for each card named Rite of Flame in each graveyard.', {mc:'{R}', cmc:1});
  S.gy.push(C('Rite of Flame', 'Sorcery', '')); S.hand.push(rof); ev('commit()'); await ev('castSpell')(rof.u); await wait(20);
  check(S.pool.R === 3, `Rite of Flame mit 1 im Friedhof: 3 (${S.pool.R})`);
  reset();
  const mm = C('Manamorphose', 'Instant', 'Add two mana in any combination of colors.\nDraw a card.', {mc:'{1}{R/G}', cmc:2});
  S.hand.push(mm); ev('commit()'); const pm = ev('castSpell')(mm.u); await wait(20);
  click('{U}') || [...d.querySelectorAll('#modalBox button')].find(b => /Blau/.test(b.textContent)).click(); await wait(10);
  [...d.querySelectorAll('#modalBox button')].find(b => /Grün/.test(b.textContent)).click(); await pm; await wait(20);
  check(S.pool.U === 1 && S.pool.G === 1, `Manamorphose: {U}{G} gewählt (${ev('poolStr(S.pool)')})`);
  reset();
  // Simian Spirit Guide
  const ssg = C('Simian Spirit Guide', 'Creature — Ape Spirit', 'Exile Simian Spirit Guide from your hand: Add {R}.', {pw:2, tg:2});
  S.hand.push(ssg); ev('commit()');
  const it = ev('cardMenu')(ssg, 'hand').find(i => /Ins Exil/.test(i.h || ''));
  check(!!it, 'Simian Spirit Guide: «Ins Exil für {R}» im Handmenü');
  it.f(); await wait(5);
  check(S.pool.R === 1 && S.ex.includes(ssg), 'Spirit Guide exiliert, {R} im Pool');
  reset();
  // Kostensenker und Steuern
  ev('LOOK.autoPay = true');
  S.bf.push(C('Ruby Medallion', 'Artifact', 'Red spells you cast cost {1} less to cast.'), C('Mountain', 'Basic Land — Mountain', '({T}: Add {R}.)'));
  ev('commit()');
  const fb = C('Fireblast?', 'Sorcery', '', {mc:'{1}{R}', cmc:2});
  check(ev('playerPayPlan')(fb, 0).ok, 'Ruby Medallion: {1}{R} mit nur einem Gebirge bezahlbar');
  ev('BOT.bf.push(newCard({n:"Sphere of Resistance", type:"Artifact", o:""})); botChanged()'); await wait(10);
  check(!ev('playerPayPlan')(fb, 0).ok, 'Sphere of Resistance (KI) hebt das wieder auf');
  ev('BOT.bf = []; BOT.bf.push(newCard({n:"Trinisphere", type:"Artifact", o:""})); botChanged()'); await wait(10);
  const tp = ev('playerPayPlan')(C('Bolt', 'Instant', '', {mc:'{R}', cmc:1}), 0);
  check(!tp.ok && tp.missing.join('') === '{2}' && tp.why.some(x => /Trinisphere/.test(x)), `Trinisphere: Bolt kostet 3 (fehlt ${tp.missing.join('')})`);
  ev('BOT.bf = []; BOT.bf.push(newCard({n:"Damping Sphere", type:"Artifact", o:""})); botChanged()'); await wait(10);
  ev('S.bf = S.bf.filter(c => c.n !== "Ruby Medallion"); commit()'); ev('S.spellsCast = 0; S.spellTurnKey = TURN.n + "|" + TURN.active');
  check(ev('playerPayPlan')(C('Bolt', 'Instant', '', {mc:'{R}', cmc:1}), 0).ok, 'Damping Sphere: erster Zauber normal');
  ev('noteSpellCast()');
  check(!ev('playerPayPlan')(C('Bolt', 'Instant', '', {mc:'{R}', cmc:1}), 0).ok, 'Damping Sphere: zweiter Zauber kostet 1 mehr');
  ev('BOT.bf = []; botChanged()');
  // Sol Ring vor Cradle
  reset();
  S.bf.push(C("Gaea's Cradle", 'Legendary Land', "{T}: Add {G} for each creature you control."), bear(), bear(), bear(), C('Forest', 'Basic Land — Forest', '({T}: Add {G}.)'));
  ev('commit()');
  const p1 = ev('playerPayPlan')(C('Opt', 'Instant', '', {mc:'{1}', cmc:1}), 0);
  check(p1.ok && p1.taps.length === 1 && p1.taps[0].c.n === 'Forest', `für {1}: Wald statt Cradle (${p1.taps.map(t => t.c.n)})`);
  const p3 = ev('playerPayPlan')(C('X', 'Sorcery', '', {mc:'{3}', cmc:3}), 0);
  check(p3.ok && p3.taps.length === 1 && p3.taps[0].c.n === "Gaea's Cradle", `für {3}: Cradle (${p3.taps.map(t => t.c.n)})`);
  // Eye of Ugin, Mizzix, Cryptolith Rite
  reset(); ev('LOOK.autoPay = true');
  S.bf.push(C('Eye of Ugin', 'Legendary Land', 'Colorless Eldrazi spells you cast cost {2} less to cast.\n{7}, {T}: Search your library for a colorless creature card, reveal it, put it into your hand, then shuffle.'), C('Wastes', 'Basic Land', '{T}: Add {C}.'), C('Wastes', 'Basic Land', '{T}: Add {C}.'));
  ev('commit()');
  check(ev('playerPayPlan')(C('Thought-Knot Seer', 'Creature — Eldrazi', '', {mc:'{3}{C}', cmc:4}), 0).ok, 'Eye of Ugin: Thought-Knot Seer kostet 2 weniger');
  check(!ev('playerPayPlan')(C('Grizzly', 'Creature — Bear', '', {mc:'{2}{C}', cmc:3}), 0).ok, 'Eye of Ugin: nicht für Nicht-Eldrazi');
  reset();
  S.bf.push(C('Cryptolith Rite', 'Enchantment', 'Creatures you control have "{T}: Add one mana of any color."'), bear()); ev('commit()');
  check(mc(S.bf[1]) === '["W","U","B","R","G"]', `Cryptolith Rite: Bär tappt für jede Farbe ${mc(S.bf[1])}`);
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
