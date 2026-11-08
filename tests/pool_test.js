// Test des Manapools: Mana-Fähigkeiten lesen, Tappen, automatisches Bezahlen
const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const C = (n, type, o, extra = {}) => ev('newCard')({n, type, o, img:null, ...extra});
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()'); ev('LOOK.autoAbil = false');
  const mc = ev('manaChoices');
  const fmt = c => JSON.stringify((mc(c) || []).map(o => o.add.join('') + (o.pain ? '!' + o.pain : '') + (o.sac ? 'S' : '') + (o.cost ? '$' + o.cost : '') + (o.life ? 'L' + o.life : '')));
  // Mana-Fähigkeiten lesen
  const cases = [
    [C('Mountain', 'Basic Land — Mountain', '({T}: Add {R}.)'), '["R"]'],
    [C('Mountain', 'Basic Land — Mountain', ''), '["R"]'],
    [C('Watery Grave', 'Land — Island Swamp', '({T}: Add {U} or {B}.)\nAs Watery Grave enters, you may pay 2 life.'), '["U","B"]'],
    [C('Karplusan Forest', 'Land', '{T}: Add {C}.\n{T}: Add {R} or {G}. Karplusan Forest deals 1 damage to you.'), '["C","R!1","G!1"]'],
    [C('Ancient Tomb', 'Land', '{T}: Add {C}{C}. Ancient Tomb deals 2 damage to you.'), '["CC!2"]'],
    [C('Polluted Delta', 'Land', '{T}, Pay 1 life, Sacrifice Polluted Delta: Search your library for an Island or Swamp card, put it onto the battlefield, then shuffle.'), '[]'],
    [C('Sol Ring', 'Artifact', '{T}: Add {C}{C}.'), '["CC"]'],
    [C('Mana Confluence', 'Land', '{T}, Pay 1 life: Add one mana of any color.'), '["WL1","UL1","BL1","RL1","GL1"]'],
    [C('Lotus Petal', 'Artifact', '{T}, Sacrifice Lotus Petal: Add one mana of any color.'), '["WS","US","BS","RS","GS"]'],
    [C('Dimir Signet', 'Artifact', '{1}, {T}: Add {U}{B}.'), '["UB$1"]'],
    [C('Llanowar Elves', 'Creature — Elf Druid', '{T}: Add {G}.', {pw:1, tg:1}), '["G"]'],
    [C('Command Tower', 'Land', "{T}: Add one mana of any color in your commander's color identity."), '["W","U","B","R","G"]'],
    [C('Grizzly Bears', 'Creature — Bear', '', {pw:2, tg:2}), '[]'],
    [C('Triome', 'Land — Mountain Plains Swamp', '({T}: Add {R}, {W}, or {B}.)\nCycling {3}'), '["R","W","B"]'],
  ];
  cases.forEach(([c, want]) => check(fmt(c) === want, `${c.n}: ${fmt(c)}${fmt(c) === want ? '' : ' (erwartet ' + want + ')'}`));
  // Spiel aufbauen
  const S = ev('S');
  const lands = [C('Mountain', 'Basic Land — Mountain', '({T}: Add {R}.)'), C('Mountain', 'Basic Land — Mountain', '({T}: Add {R}.)'), C('Island', 'Basic Land — Island', '({T}: Add {U}.)'), C('Watery Grave', 'Land — Island Swamp', '({T}: Add {U} or {B}.)')];
  lands.forEach(l => S.bf.push(l));
  ev('commit()'); await wait(10);
  // 1. Einfaches Tappen: Mountain → {R} im Pool
  ev('toggleTap')(lands[0]); await wait(10);
  check(lands[0].tap && S.pool.R === 1, `Mountain tappen legt {R} in den Pool (Pool ${ev('poolStr(S.pool)')})`);
  check(!!d.querySelector('#myPool .manachip'), 'Pool wird angezeigt');
  // 2. Enttappen nimmt das Mana zurück
  ev('toggleTap')(lands[0]); await wait(10);
  check(!lands[0].tap && S.pool.R === 0, 'Enttappen nimmt {R} wieder aus dem Pool');
  // 3. Watery Grave: Auswahl
  ev('toggleTap')(lands[3], {clientX:100, clientY:100}); await wait(10);
  const choices = [...d.querySelectorAll('#menu button')].map(b => b.textContent.trim());
  check(!$('#menu').hidden && choices.length === 3, `Watery Grave fragt nach der Farbe (${choices.join(' | ')})`);
  d.querySelectorAll('#menu button')[1].click(); await wait(10);
  check(lands[3].tap && S.pool.B === 1, `Wahl {B} landet im Pool (Pool ${ev('poolStr(S.pool)')})`);
  // 4. Counterspell {U}{U}: {B} im Pool hilft nicht, Island wird getappt, dann fehlt eins
  const cs = C('Counterspell', 'Instant', 'Counter target spell.', {mc:'{U}{U}', cmc:2});
  S.hand.push(cs); ev('commit()');
  const plan = ev('playerPayPlan')(cs, 0);
  check(!plan.ok && plan.missing.join('') === '{U}', `Counterspell mit B im Pool + Island: es fehlt ${plan.missing.join('')}`);
  // 5. Lightning Bolt {R}: tappt automatisch einen Mountain
  const bolt = C('Lightning Bolt', 'Instant', 'Lightning Bolt deals 3 damage to any target.', {mc:'{R}', cmc:1});
  S.hand.push(bolt); ev('commit()');
  await ev('castSpell')(bolt.u); await wait(20);
  check(S.gy.includes(bolt) && lands[0].tap && !lands[1].tap, 'Lightning Bolt tappt genau einen Mountain automatisch');
  check(S.pool.B === 1, 'das {B} bleibt im Pool');
  // 6. Hill Giant {3}{R}: Pool {B} + Mountain + Island = 3, fehlt 1 → Dialog
  const giant = C('Hill Giant', 'Creature — Giant', '', {mc:'{3}{R}', cmc:4, pw:3, tg:3});
  S.hand.push(giant); ev('commit()');
  const pr = ev('play')(giant.u); await wait(20);
  check(ev('modalState && modalState.kind') === 'ask' && /zu wenig Mana/.test($('#modalBox').textContent), 'Zu wenig Mana: Dialog erscheint');
  check(/Es fehlt/.test($('#modalBox').textContent), `Dialog nennt das Fehlende: ${$('#modalBox p').textContent.replace(/\s+/g, ' ').slice(0, 80)}`);
  [...d.querySelectorAll('#modalBox button')].find(b => b.textContent === 'Abbrechen').click(); await pr; await wait(10);
  check(S.hand.includes(giant) && !lands[1].tap && S.pool.B === 1, 'Abbrechen: nichts getappt, Karte bleibt auf der Hand');
  // 7. Force of Will ohne Mana (alternative Kosten)
  const fow = C('Force of Will', 'Instant', "You may pay 1 life and exile a blue card from your hand rather than pay this spell's mana cost.", {mc:'{3}{U}{U}', cmc:5});
  S.hand.push(fow); ev('commit()');
  const pf = ev('castSpell')(fow.u); await wait(20);
  [...d.querySelectorAll('#modalBox button')].find(b => b.textContent === 'Ohne Mana wirken').click(); await pf; await wait(10);
  check(S.gy.includes(fow) && S.pool.B === 1 && !lands[1].tap, 'Ohne Mana wirken: nichts bezahlt, Zauber gewirkt');
  // 8. Bär {1}{G}? Kein Grün → fehlt {G}; aber mit + Mana G manuell
  ev('poolAdd(["G"])');
  const bear = C('Grizzly Bears', 'Creature — Bear', '', {mc:'{1}{G}', cmc:2, pw:2, tg:2});
  S.hand.push(bear); ev('commit()');
  await ev('play')(bear.u); await wait(20);
  check(S.bf.includes(bear) && S.pool.G === 0 && S.pool.B === 0 && !lands[1].tap, 'Bär bezahlt mit {G} + {B} aus dem Pool, ohne Länder zu tappen');
  // 9. X-Zauber
  ev('S.bf.forEach(c => { c.tap = false; c.mtap = null; }); S.pool = emptyPoolObj(); commit();');
  const fb = C('Fireball', 'Sorcery', 'Fireball deals X damage...', {mc:'{X}{R}', cmc:1});
  S.hand.push(fb); ev('commit()');
  const px = ev('castSpell')(fb.u); await wait(20);
  check(/Wert für X/.test($('#modalBox').textContent), 'X-Zauber fragt nach X');
  $('#askN').value = '2'; [...d.querySelectorAll('#modalBox button')].find(b => b.textContent === 'Weiter').click(); await px; await wait(10);
  check(S.gy.includes(fb) && S.bf.filter(c => c.tap).length === 3, `Fireball X=2 tappt 3 Länder (${S.bf.filter(c => c.tap).map(c => c.n).join(', ')})`);
  // 10. Pool leert sich beim Phasenwechsel
  ev('S.bf.forEach(c => { c.tap = false; c.mtap = null; })'); ev('toggleTap')(lands[2]);
  ev('TURN.active = me.id; TURN.phase = 2; setPhase(4)'); await wait(10);
  check(ev('poolTotal(S.pool)') === 0 && /Manapool geleert/.test($('#log').textContent), 'Phasenwechsel leert den Pool, mit Hinweis im Log');
  // 11. Commander-Steuer
  ev('S.bf.forEach(c => { c.tap = false; c.mtap = null; })');
  const cmd = C('Ragavan', 'Legendary Creature — Monkey', '', {mc:'{R}', cmc:1, pw:2, tg:1, cmdr:true});
  S.cz.push(cmd); cmd.casts = 1; ev('commit()');
  const pc = ev('playerPayPlan')(cmd, 0);
  check(pc.ok && pc.taps.length === 3, `Commander mit 1× Steuer kostet {R}+{2}: tappt ${pc.taps.length} Länder`);
  // 12. Auto-Bezahlen aus
  ev('LOOK.autoPay = false');
  const bolt2 = C('Lightning Bolt', 'Instant', '', {mc:'{R}', cmc:1}); S.hand.push(bolt2); ev('commit()');
  await ev('castSpell')(bolt2.u); await wait(10);
  check(S.gy.includes(bolt2) && !S.bf.some(c => c.tap), 'Auto-Bezahlen aus: Zauber geht ohne Bezahlen durch, nichts getappt');
  ev('LOOK.autoPay = true');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK');
  process.exit(0);
})();
