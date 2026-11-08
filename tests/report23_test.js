const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report23_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  const mana = () => ev('S.pool.B = 5; S.pool.R = 5; S.pool.C = 5; S.pool.G = 5; S.pool.U = 5; commit()');
  const acts = c => ev('parseAbilities')(c).filter(a => a.kind === 'act');
  // Kozilek's Command: Modus «Exile up to X target cards from graveyards»
  await reset(); const a1 = N('Mein1', 'Instant'); S().gy.push(a1); ev('BOT.gy = [newCard({n:"KiA", type:"Sorcery"}), newCard({n:"KiB", type:"Creature"})]; botChanged(); commit()');
  ev('window.__kz = newCard({n:"Kozilek Test", type:"Instant", o:"Exile up to X target cards from graveyards."})');
  ev('runAbility(window.__kz, {kind:"spell", text:"Exile up to X target cards from graveyards."}, {X:2})'); await wait(100);
  await clickCard('Mein1'); await clickCard('KiA'); await click('Fertig'); await wait(150);
  check(S().ex.some(c => c.n === 'Mein1') && ev('BOT.ex.some(c => c.n === "KiA") && BOT.gy.length === 1'), "Kozilek's Command: bis zu X Karten aus Friedhöfen verbannt");
  check(ev('parseSteps')("Exile up to X target cards from graveyards.", ev('newCard({n:"K", type:"Instant"})')).some(s => s.t === 'gyExileN'), 'Modus wird erkannt');
  // Nature's Claim
  await reset(); botBf([{n:'Ring', type:'Artifact', cmc:1}]); ev('BOT.life = 20');
  await cast(C("Nature's Claim", {mc:''})); await wait(60); await clickCard('Ring'); await wait(150); await drain();
  check(ev('BOT.gy.some(c => c.n === "Ring") && BOT.life === 24'), "Nature's Claim: zerstört, Beherrscher erhält 4 Leben");
  // The Stone Brain
  await reset(); ev('BOT.hand = [newCard({n:"Bolt", type:"Instant"}), newCard({n:"Opt", type:"Instant"})]; BOT.gy = [newCard({n:"Bolt", type:"Instant"})]; BOT.library = [newCard({n:"Bolt", type:"Instant"}), newCard({n:"Land", type:"Land"}), newCard({n:"Bolt", type:"Instant"}), newCard({n:"Bolt", type:"Instant"})]; botChanged()');
  const sb = C('The Stone Brain'); bf(sb); mana();
  ev('activateAbility')(sb, acts(sb)[0]); await wait(120); console.log('   SB:', title(), btns().join('|'));
  if(/Gegner|welche/i.test(title())) { if(!(await clickCard('KI'))) await click('KI'); await wait(80); }
  const inp = d.querySelector('#modalBox input'); if(inp){ inp.value = 'Bolt'; inp.dispatchEvent(new dom.window.Event('input')); } await wait(40); console.log('   SB2:', title(), btns().join('|'));
  await click('OK') || await click('Nennen') || await click('Weiter'); await wait(150); console.log('   SB3:', title(), btns().join('|'));
  await clickCard('Hand'); await clickCard('Friedhof'); await clickCard('Bibliothek'); await click('Fertig'); await wait(150); await drain();
  check(ev('BOT.ex.filter(c => c.n === "Bolt").length') >= 3 && ev('BOT.hand.length') === 2, 'The Stone Brain: Bolts verbannt, KI zieht für die Handkarte');
  // Trinisphere
  await reset(); bf(C('Trinisphere')); const t1 = N('Opt', 'Instant', '', {mc:'{U}'}); await ev('castWarn')(t1, 'hand');
  check(t1.payMc === '{U}{2}', 'Trinisphere: {U} kostet drei Mana');
  const t2 = N('Grosses', 'Sorcery', '', {mc:'{3}{U}'}); await ev('castWarn')(t2, 'hand'); check(t2.payMc == null, 'teure Zauber unverändert');
  S().bf[0].tap = true; const t3 = N('Opt2', 'Instant', '', {mc:'{U}'}); await ev('castWarn')(t3, 'hand'); check(t3.payMc == null, 'getappt: keine Wirkung');
  // Blade of the Bloodchief
  await reset(); const vp = N('Vamp', 'Creature — Vampire', '', {pw:2, tg:2}), hu = N('Mensch', 'Creature — Human', '', {pw:2, tg:2}); bf(vp, hu); const bl = C('Blade of the Bloodchief'); bl.eq = vp.u; bf(bl);
  ev('moveCard')(hu.u, 'gy'); await wait(150);
  console.log('   BL:', vp.c, title()); check(vp.c === 2, 'Blade: Vampir bekommt zwei Marken');
  // Engineered Explosives
  await reset(); const ee = C('Engineered Explosives'); ee.spent = {G:1, U:1}; S().hand.push(ee); ev('commit()'); ev('moveCard')(ee.u, 'bf'); await wait(60);
  check(ee.c === 2, 'Engineered Explosives: Sunburst mit zwei Farben = 2 Marken');
  const k2 = N('Zwei', 'Creature', '', {cmc:2, pw:2, tg:2}), k3 = N('Drei', 'Creature', '', {cmc:3, pw:3, tg:3}); bf(k2, k3); botBf([{n:'KiZwei', type:'Artifact', cmc:2}, {n:'KiEins', type:'Artifact', cmc:1}]); mana();
  ev('activateAbility')(ee, acts(ee)[0]); await wait(200); await drain();
  check(S().gy.includes(k2) && S().bf.includes(k3) && ev('BOT.gy.some(c => c.n === "KiZwei") && BOT.bf.some(c => c.n === "KiEins")'), 'EE: nur Manawert 2 wird zerstört');
  // Ugin's Labyrinth
  await reset(); const big = N('Eldrazi', 'Creature — Eldrazi', '', {mc:'{7}', cmc:7}); S().hand.push(big); const ul = C("Ugin's Labyrinth"); S().hand.push(ul); ev('commit()'); ev('moveCard')(ul.u, 'bf'); await wait(100);
  check(!(ev('manaChoices')(ul) || []).some(o => (o.add || []).length === 2), 'ohne Einprägung kein {C}{C}');
  await clickCard('Eldrazi'); await wait(80);
  check(S().ex.includes(big) && ul.imprint === 'Eldrazi', "Ugin's Labyrinth: farblose 7er-Karte eingeprägt");
  check((ev('manaChoices')(ul) || []).some(o => (o.add || []).length === 2), 'mit Einprägung {C}{C}');
  ev('activateAbility')(ul, acts(ul)[0]); await wait(150);
  check(S().hand.includes(big) && !ul.imprint, 'Rückkehr der eingeprägten Karte auf die Hand');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
