const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('loop_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  const reset0 = () => ev('LOOP.key = null; LOOP.found = null; LOOP.seen = new Map(); S.life = 20; S.bf = []; S.hand = []; S.gy = []; S.ex = []; S.library = []; S.pool = emptyPoolObj(); S.lifeLock = null; S.protect = null; BOT.bf = []; botChanged(); TURN = {active:me.id, n:20, starter:me.id, phase:2}; commit()');
  const reset = async () => { await wait(80); await drain(); reset0(); await wait(20); };
  const lib = (...c) => { S().library.push(...c); ev('commit()'); };
  const btns = () => [...d.querySelectorAll('#modalBox button')].map(b => b.textContent.trim());
  const M = n => ev('cardMenu')(n.c, n.z);
  const cast = async c => { S().hand.push(c); ev('commit()'); ev('castSpell')(c.u); await wait(80); };
  const opt = {mc:''};
  // Demonic Consultation
  await reset();
  const acts = c => ev("parseAbilities")(c).filter(a => a.kind === "act");
  const put = (...c) => { S().bf.push(...c); ev('commit()'); };
  const tapM = async (c, pick) => { const os = ev('manaChoices')(c) || []; const o = (pick && os.find(pick)) || os[0]; await ev('tapForMana')(c, o); };
  const found = () => ev('LOOP.found && JSON.stringify(LOOP.found.d)');
  const logHas = t => new RegExp(t).test(d.querySelector('#log').textContent);
  // 1. Zirda + Grim Monolith: Hinweis, dann Schleife
  await reset(); const zir = C('Zirda, the Dawnwaker', {pw:3, tg:3}), grim = C('Grim Monolith'); put(zir, grim);
  check(logHas('Kombo möglich: Grim Monolith macht 3 Mana und enttappt für \\{2\\}'), 'Hinweis: Grim Monolith + Zirda ergibt beliebig viel Mana');
  check(!found(), 'vor dem ersten Durchgang noch keine Schleife');
  await tapM(grim); await wait(60);
  check(S().pool.C === 3 && grim.tap, 'Grim Monolith getappt: 3 Mana');
  ev('activateAbility')(grim, acts(grim).find(a => /Untap/.test(a.text))); await wait(150); await drain();
  check(!grim.tap && S().pool.C === 1, `enttappt für {2} dank Zirda (Pool ${S().pool.C})`);
  check(found() === '{"P|C":1}', `Schleife erkannt: +1 {C} pro Durchgang (${found()})`);
  check(!d.querySelector('#loopBar').hidden && /Schleife erkannt/.test(d.querySelector('#loopBar').textContent), 'Leiste «∞ Schleife erkannt» ist sichtbar');
  d.querySelector('#loopBar button').click(); await wait(40); await click('100-mal'); await wait(60);
  check(S().pool.C === 101, `100-mal wiederholt: 101 Mana im Pool (${S().pool.C})`);
  check(logHas('wiederholt die Endlosschleife 100-mal'), 'Wiederholung steht im Protokoll');
  // Lage ändert sich → Leiste weg, kein Wiederholen
  await tapM(grim); await wait(40);
  check(d.querySelector('#loopBar').hidden, 'mitten im Durchgang ist die Leiste weg');
  // 2. Ohne Zirda kostet das Enttappen 4: keine Schleife
  await reset(); const g2 = C('Grim Monolith'); put(g2); S().pool.C = 4; ev('commit()');
  await tapM(g2); await wait(40); ev('activateAbility')(g2, acts(g2).find(a => /Untap/.test(a.text))); await wait(150); await drain();
  check(!g2.tap && S().pool.C === 3 && !found(), 'Grim Monolith allein (3 Mana, {4} zum Enttappen): keine Schleife');
  // 3. Kein Fehlalarm: Leben dazu ohne Umlauf, Land tappen und enttappen ohne Gewinn
  await reset(); const land = N('Wald', 'Basic Land — Forest', ''); put(land);
  ev('S.life += 3; commit()'); check(!found(), 'Leben dazu ohne Zustandswechsel: keine Schleife');
  land.tap = true; ev('commit()'); land.tap = false; ev('commit()'); check(!found(), 'tappen und enttappen ohne Gewinn: keine Schleife');
  // 4. Lion's Eye Diamond mit einer Rückhol-Kreatur (Testkarte nach dem Muster von Auriok Salvagers)
  await reset(); const led = C("Lion's Eye Diamond"), salv = N('Test-Berger', 'Creature — Human Soldier', '{1}{W}: Return target artifact card with mana value 1 or less from your graveyard to your hand.', {pw:2, tg:4}); put(led, salv);
  const round = async () => {
    await tapM(led, o => JSON.stringify(o).includes('W')); await wait(120); for(let i = 0; i < 3 && open(); i++){ if(!(await click('Weiss')) && !(await click('W'))) break; await wait(60); }
    if(S().bf.includes(led)){ console.log('   LED-Optionen:', JSON.stringify(ev('manaChoices')(led)).slice(0, 300), btns().join('|')); ev('moveCard')(led.u, 'gy'); S().pool.W += 3; ev('commit()'); }
    S().pool.W -= 2; ev('moveCard')(led.u, 'hand'); ev('commit()');   // Fähigkeit des Bergers: {1}{W} zahlen, Diamant auf die Hand
    ev('moveCard')(led.u, 'bf'); ev('commit()');                      // Diamant für {0} wieder ausspielen
  };
  await round(); await wait(40);

  check(found() === '{"P|W":1}', `Lion's Eye Diamond + Berger: Schleife erkannt, +1 Mana pro Durchgang (${found()})`);
  // 5. Schaden am Gegner pro Durchgang (z. B. Opfer-Schleife mit Lebensverlust)
  await reset(); const eng = N('Maschine', 'Artifact', ''); put(eng);
  eng.tap = true; ev('hitOpponent("bot", {kind:"loss", amount:1, src:"Test"})'); ev('commit()'); eng.tap = false; ev('commit()');
  check(found() === '{"H|bot|loss":1}', `Schleife mit Lebensverlust beim Gegner erkannt (${found()})`);
  { const b0 = B(); ev('loopApply(5)'); await wait(60); check(B() === b0 - 5, `5-mal wiederholt: KI verliert 5 Leben (${b0} → ${B()})`); }
  // 6. Spielsteine pro Durchgang
  await reset(); const fab = N('Fabrik', 'Artifact', ''); put(fab);
  fab.tap = true; ev('commit()'); S().bf.push(N('Treasure', 'Token Artifact — Treasure', '{T}, Sacrifice this token: Add one mana of any color.', {tok:true})); fab.tap = false; ev('commit()');
  check(found() === '{"T|Treasure|0|0":1}', `Schleife mit Spielstein erkannt (${found()})`);
  ev('loopApply(3)'); check(S().bf.filter(c => c.n === 'Treasure').length === 4, '3-mal wiederholt: 4 Treasure');
  // 7. Phasenwechsel setzt zurück
  ev('TURN = {...TURN, phase:4}; commit()'); check(!found() && d.querySelector('#loopBar').hidden, 'neue Phase: Schleife ist zurückgesetzt');
  console.log(fails ? `\n${fails} FEHLER` : "\nALLES OK"); process.exit(0);
})();
