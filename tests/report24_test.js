const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report24_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  const mana = () => ev('S.pool.C = 9; S.pool.R = 3; S.pool.W = 3; S.pool.U = 3; commit()');
  const acts = c => ev('parseAbilities')(c).filter(a => a.kind === 'act');
  const loys = c => ev('parseAbilities')(c).filter(a => a.kind === 'loy');
  const pickOpp = async () => { await wait(60); if(/Gegner/i.test(title())) { if(!(await clickCard('KI'))) await click('KI'); } await wait(150); };
  const MN = (c, z) => ev('cardMenu')(c, z);
  // Apple of Eden
  await reset(); ev('BOT.hand = [newCard({n:"Bolt", type:"Instant", mc:"{R}", o:"Bolt deals 3 damage to any target."}), newCard({n:"Mountain", type:"Basic Land — Mountain"})]; BOT.library = [newCard({n:"Z1", type:"Instant"}), newCard({n:"Z2", type:"Instant"})]; botChanged()');
  const ap = C('Apple of Eden, Isu Relic'); bf(ap); const l0 = S().life;
  ev('activateAbility')(ap, acts(ap)[0]); await wait(120); await pickOpp(); await drain();
  const exB = S().ex.find(c => c.n === 'Bolt');
  check(exB && exB.castKey && S().life === l0 - 4 && ev('BOT.hand.length') === 0, 'Apple of Eden: Hand der KI verbannt, 4 Leben bezahlt');
  const mt = S().ex.find(c => c.n === 'Mountain'); const pm = MN(mt, 'ex').find(i => /Spielen/.test(i.l || '')); check(!!pm, 'Land aus dem Exil spielbar');
  pm.f(); await wait(150); check(S().bf.some(c => c.n === 'Mountain') && ev('BOT.hand.length') === 1, 'Land gespielt → Besitzer zieht eine Karte');
  const b2 = N('Test', 'Instant', '', {mc:'{R}'}); b2.anyMana = true; await ev('castWarn')(b2, 'hand'); check(b2.payMc === '{1}', 'Mana beliebiger Art: {R} → {1}');
  ev('TURN.n = 21'); ev('expireCastable()'); await wait(80); check(ev('BOT.hand.some(c => c.n === "Bolt")'), 'nicht gespielte Karte kehrt auf die Hand des Besitzers zurück');
  // Avarice Totem
  await reset(); botBf([{n:'Drache', type:'Creature — Dragon', pw:5, tg:5}]); const at = C('Avarice Totem'); bf(at); mana();
  ev('activateAbility')(at, acts(at)[0]); await wait(120); await clickCard('Drache'); await wait(200);
  check(S().bf.some(c => c.n === 'Drache') && !S().bf.includes(at) && ev('BOT.bf.some(c => c.n === "Avarice Totem")'), 'Avarice Totem: Kontrolle getauscht');
  // Cogwork Assembler
  await reset(); const cw = C('Cogwork Assembler', {pw:3, tg:3}); const ring = N('Sol Ring', 'Artifact', '{T}: Add {C}{C}.'); bf(cw, ring); mana();
  ev('activateAbility')(cw, acts(cw)[0]); await wait(120); await clickCard('Sol Ring'); await wait(150); await drain();
  const tk = S().bf.find(c => c.tok && /Sol Ring/.test(c.n)); check(tk && ev('kwHas')(tk, 'haste'), 'Cogwork Assembler: Token-Kopie mit Eile');
  // Chrome Dome
  await reset(); const cd = C('Chrome Dome', {pw:4, tg:4}); const ac = N('Golem', 'Artifact Creature — Golem', '', {pw:2, tg:2}), hc = N('Mensch', 'Creature — Human', '', {pw:2, tg:2}); bf(cd, ac, hc);
  check(ev('power')(ac) === 3 && ev('power')(hc) === 2 && ev('power')(cd) === 4, 'Chrome Dome: andere Artefaktkreaturen +1/+0');
  // Goblin Welder
  await reset(); const gw = C('Goblin Welder', {pw:1, tg:1}); const junk = N('Schrott', 'Artifact'), gold = N('Wurmcoil', 'Artifact Creature — Wurm', '', {pw:6, tg:6}); bf(gw, junk); S().gy.push(gold); ev('commit()');
  ev('activateAbility')(gw, acts(gw)[0]); await wait(120); await clickCard('Schrott'); await wait(80); await clickCard('Wurmcoil'); await wait(120);
  check(S().gy.includes(junk) && S().bf.includes(gold), 'Goblin Welder: eigenes Artefakt getauscht');
  await reset(); ev('BOT.gy = [newCard({n:"KiGold", type:"Artifact"})]'); botBf([{n:'KiSchrott', type:'Artifact'}]); const gw2 = C('Goblin Welder', {pw:1, tg:1}); bf(gw2);
  ev('activateAbility')(gw2, acts(gw2)[0]); await wait(120); await clickCard('KiSchrott'); await wait(80); await clickCard('KiGold'); await wait(150);
  check(ev('BOT.bf.some(c => c.n === "KiGold") && BOT.gy.some(c => c.n === "KiSchrott")'), 'Goblin Welder: bei der KI getauscht');
  // Karn
  await reset(); const kr = C('Karn, the Great Creator'); bf(kr); kr.c = 5; const rk = N('Stein', 'Artifact', '', {cmc:4}); bf(rk);
  ev('activateAbility')(kr, loys(kr)[0]); await wait(120); await clickCard('Stein'); await wait(100);
  check(ev('isCreature')(rk) && ev('power')(rk) === 4, 'Karn +1: Artefakt wird 4/4');
  ev('TURN.active = "bot"; remindTriggers("upkeep", false)'); await wait(40); check(ev('isCreature')(rk), 'im Zug des Gegners noch Kreatur');
  ev('TURN.active = me.id; remindTriggers("upkeep", true)'); await wait(80); await drain(); check(!ev('isCreature')(rk), 'zu Beginn deines nächsten Zugs wieder normal');
  ev('S.deck = [{n:"Wunsch-Artefakt", type:"Artifact", o:"", sb:true}, {n:"Kein Artefakt", type:"Instant", o:"", sb:true}]; S.wished = []');
  kr.pwKey = null; ev('S.pwUsed = null'); ev('activateAbility')(kr, loys(kr)[1]); await wait(150); await clickCard('Wunsch'); await wait(100);
  check(S().hand.some(c => c.n === 'Wunsch-Artefakt'), 'Karn −2: Artefakt aus dem Sideboard auf die Hand');
  ev(`others.bot = others.bot || {}; others.bot.bf = [{u:"k1", n:"Karn, the Great Creator", type:"Legendary Planeswalker"}]`);
  const myArt = N('Mein Artefakt', 'Artifact', '{T}: Add {C}.\n{1}, {T}: Draw a card.'); bf(myArt);
  check(!(ev('manaChoices')(myArt) || []).length, 'Karn des Gegners: keine Mana-Fähigkeit meiner Artefakte'); ev('others.bot.bf = []');
  // Metalworker
  await reset(); const mw = C('Metalworker', {pw:1, tg:2}); bf(mw); S().hand.push(N('A1', 'Artifact'), N('A2', 'Artifact Creature'), N('I', 'Instant')); ev('commit()');
  ev('activateAbility')(mw, acts(mw)[0]); await wait(120); await clickCard('A1'); await clickCard('A2'); await click('Fertig'); await wait(80);
  check(S().pool.C === 4, 'Metalworker: zwei Artefakte gezeigt → {C}{C}{C}{C}');
  // Reckless Handling
  await reset(); lib(N('Kette', 'Artifact'), N('Land', 'Land')); ev('BOT.life = 20');
  await cast(C('Reckless Handling', {mc:''})); await wait(80); await clickCard('Kette'); await wait(150); await drain();
  check(S().gy.some(c => c.n === 'Kette') && ev('BOT.life') === 18, 'Reckless Handling: Artefakt gesucht, zufällig abgeworfen (einzige Handkarte), 2 Schaden');
  // Recommission
  await reset(); const rb = N('Bär', 'Creature — Bear', '', {pw:2, tg:2, cmc:2}); S().gy.push(rb); ev('commit()');
  await cast(C('Recommission', {mc:''})); await wait(80); await clickCard('Bär'); await wait(150); await drain();
  check(S().bf.includes(rb) && rb.c === 1, 'Recommission: Kreatur zurück mit +1/+1-Marke');
  // Chromatic Orrery
  await reset(); bf(C('Chromatic Orrery')); const co = N('Rot', 'Instant', '', {mc:'{1}{R}{R}'}); await ev('castWarn')(co, 'hand'); check(co.payMc === '{1}{1}{1}', 'Chromatic Orrery: farbiges Mana als beliebige Farbe');
  // Liberator
  await reset(); const lb = C("Liberator, Urza's Battlethopter", {pw:2, tg:2}); bf(lb);
  ev('abilEvent({kind:"cast", c:Object.assign(newCard({n:"Gross", type:"Artifact"}), {spent:{C:4}})})'); await wait(120); await drain();
  check(lb.c === 1, 'Liberator: 4 Mana > Stärke 2 → +1/+1-Marke');
  ev('abilEvent({kind:"cast", c:Object.assign(newCard({n:"Klein", type:"Artifact"}), {spent:{C:1}})})'); await wait(120); await drain();
  check(lb.c === 1, '1 Mana: keine Marke');
  // Thran Spider
  await reset(); const ts = C('Thran Spider', {pw:5, tg:6}); S().hand.push(ts); ev('commit()'); ev('moveCard')(ts.u, 'bf'); await wait(120); await pickOpp(); await wait(150);
  check(S().bf.some(c => c.tok && /Powerstone/.test(c.n) && c.tap) && ev('BOT.bf.some(c => /Powerstone/.test(c.n))'), 'Thran Spider: beide erhalten ein getapptes Powerstone');
  // Zirda
  await reset(); bf(C('Zirda, the Dawnwaker', {pw:3, tg:3})); const zt = N('Totem', 'Artifact', '{3}, {T}: Draw a card.'); bf(zt); ev('S.pool.C = 1; commit()'); lib(N('Z', 'Instant')); const h0 = S().hand.length;
  ev('activateAbility')(zt, acts(zt)[0]); await wait(150); console.log('   Z:', title(), btns().join('|'), S().pool.C, S().hand.length - h0, JSON.stringify(acts(zt)[0]).slice(0,200)); await drain();
  check(S().hand.length === h0 + 1 && S().pool.C === 0, 'Zirda: {3} kostet nur {1}');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
