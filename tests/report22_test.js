const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report22_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  const MN = (c, z) => ev('cardMenu')(c, z);
  const botBf = arr => { ev('BOT.bf = []'); arr.forEach(x => { dom.window.__x = x; ev('BOT.bf.push(newCard(window.__x))'); }); ev('botChanged()'); };
  const pickOpp = async () => { await wait(60); if(/Gegner|wessen|welche/i.test(title())) { if(!(await clickCard('KI'))) await click('KI'); } await wait(150); };
  // End of the Hunt
  await reset(); botBf([{n:'Klein', type:'Creature — Elf', cmc:2, pw:1, tg:1}, {n:'Gross', type:'Creature — Wurm', cmc:6, pw:6, tg:6}]);
  await cast(C('End of the Hunt', {mc:''})); await pickOpp(); await drain();
  check(ev('BOT.ex.some(c => c.n === "Gross") && BOT.bf.some(c => c.n === "Klein")'), 'End of the Hunt: KI verbannt ihre teuerste Kreatur');
  // Strategic Betrayal
  await reset(); botBf([{n:'Klein', type:'Creature — Elf', cmc:2, pw:1, tg:1}, {n:'Gross', type:'Creature — Wurm', cmc:6, pw:6, tg:6}]); ev('BOT.gy = [newCard({n:"Alt", type:"Instant"}), newCard({n:"Alt2", type:"Sorcery"})]');
  await cast(C('Strategic Betrayal', {mc:''})); await pickOpp(); await drain();
  check(ev('BOT.ex.some(c => c.n === "Klein") && BOT.gy.length === 0 && BOT.ex.some(c => c.n === "Alt2")'), 'Strategic Betrayal: KI verbannt eine Kreatur und ihren Friedhof');
  // Glistening Deluge
  await reset(); const gb = N('Bär', 'Creature — Bear', '', {pw:2, tg:2, mc:'{1}{G}'}), gz = N('Zombie', 'Creature — Zombie', '', {pw:3, tg:3, mc:'{2}{B}'}); bf(gb, gz);
  botBf([{n:'Ritter', type:'Creature — Knight', mc:'{1}{W}', pw:2, tg:4}]);
  await cast(C('Glistening Deluge', {mc:''})); await wait(200); await drain();
  check(S().gy.includes(gb) && ev('power')(gz) === 2 && ev('tough')(gz) === 2, 'Glistening Deluge: grüner Bär stirbt, schwarzer Zombie -1/-1');
  check(ev('tough(BOT.bf[0])') === 1, 'weisser Ritter der KI bekommt -3/-3');
  // Nethergoyf
  await reset(); const ng = C('Nethergoyf', {pw:0, tg:1}); bf(ng); S().gy.push(N('L', 'Land'), N('I', 'Instant'), N('A', 'Artifact Creature — Golem')); ev('commit()');
  check(ev('power')(ng) === 4 && ev('tough')(ng) === 5, 'Nethergoyf: 4 Kartentypen im eigenen Friedhof → 4/5');
  await reset(); const ng2 = C('Nethergoyf', {pw:0, tg:1}); const g1 = N('Land1', 'Land'), g2 = N('Spruch', 'Instant'), g3 = N('Golem', 'Artifact Creature — Golem'), g4 = N('Aura', 'Enchantment — Aura'); S().gy.push(ng2, g1, g2, g3, g4); ev('commit()');
  const esc = MN(ng2, 'gy').find(i => /Escape/.test(i.l || '')); check(!!esc, 'Nethergoyf: Escape im Friedhof-Menü');
  ev('S.pool.B = 4; S.pool.R = 4; S.pool.C = 4; commit()'); esc.f(); await wait(80); await clickCard('Land1'); await clickCard('Spruch'); await clickCard('Golem'); await click('Fertig'); await wait(80);
  await wait(150); await drain(); check(S().bf.includes(ng2) && S().ex.length === 3 && S().gy.some(c => c.n === 'Aura'), 'Nethergoyf mit Escape gewirkt (Land, Instant, Artefakt-Kreatur = 4 Typen verbannt)');
  // Troll
  await reset(); const tr = C('Troll of Khazad-dûm', {pw:6, tg:5}); check(!ev('canBlock')(N('B', 'Creature'), tr), 'Troll: kein einzelner Blocker');
  lib(N('Swamp', 'Basic Land — Swamp'), N('Island', 'Basic Land — Island')); S().hand.push(tr); ev('commit()');
  const sc = MN(tr, 'hand').find(i => /Swampcycling/.test(i.l || '')); check(!!sc, 'Troll: Swampcycling im Handmenü');
  ev('S.pool.B = 4; S.pool.R = 4; S.pool.C = 4; commit()'); sc.f(); await wait(150); await clickCard('Swamp'); await wait(80); await drain();
  check(S().gy.includes(tr) && S().hand.some(c => c.n === 'Swamp'), 'Swampcycling holt einen Sumpf');
  // Dark Matter Manipulator
  await reset(); const dm = C('Dark Matter Manipulator', {pw:2, tg:2}); bf(dm); for(let i = 0; i < 15; i++) S().gy.push(N('K' + i, 'Instant')); ev('commit()');
  check(ev('power')(dm) === 6 && ev('tough')(dm) === 2, 'Dark Matter Manipulator: +2/+0 je sieben Karten');
  // Detective's Phoenix
  await reset(); const ph = C("Detective's Phoenix", {pw:2, tg:2}); const host = N('Elf', 'Creature — Elf', '', {pw:1, tg:1}); bf(host);
  S().gy.push(N('Big', 'Sorcery', '', {cmc:4}), N('Mid', 'Instant', '', {cmc:2})); S().hand.push(ph); ev('commit()');
  const bs = MN(ph, 'hand').find(i => /Bestow/.test(i.l || '')); check(!!bs && /Beweise/.test(bs.l), 'Phoenix: Bestow mit Beweise sammeln');
  ev('S.pool.B = 4; S.pool.R = 4; S.pool.C = 4; commit()'); bs.f(); await wait(100); if(/Bestow/.test(title())) await clickCard('Elf'); await wait(60); await clickCard('Big'); await clickCard('Mid'); await click('Fertig'); await wait(150); await drain();
  check(S().bf.includes(ph) && ph.bestowed && ph.eq === host.u && S().ex.length === 2, 'Phoenix angelegt, Beweise verbannt');
  check(ev('power')(host) === 3 && ev('kwHas')(host, 'flying') && ev('kwHas')(host, 'haste'), 'verzauberte Kreatur +2/+2, Flying, Haste');
  ev('moveCard')(ph.u, 'gy'); check(MN(ph, 'gy').some(i => /Friedhof mit Bestow/.test(i.l || '')), 'Phoenix: aus dem Friedhof mit Bestow');
  // Ob Nixilis +1
  await reset(); const ob = C('Ob Nixilis, the Adversary'); bf(ob); ob.c = 3; ev('BOT.hand = []; BOT.life = 20');
  const l0 = S().life; ev('activateAbility')(ob, ev('parseAbilities')(ob).filter(a => a.kind === 'loy')[0]); await wait(200); await drain();
  check(ev('BOT.life') === 18 && S().life === l0, 'Ob Nixilis +1: KI ohne Handkarten verliert 2, ohne Devil kein Leben');
  bf(N('Imp', 'Creature — Devil', '', {pw:1, tg:1})); ev('BOT.hand = [newCard({n:"X", type:"Instant"}), newCard({n:"Y", type:"Instant"}), newCard({n:"Z", type:"Land"}), newCard({n:"W", type:"Land"})]');
  ev('S.pwUsed = null'); ob.pwKey = null; ev('activateAbility')(ob, ev('parseAbilities')(ob).filter(a => a.kind === 'loy')[0]); await wait(200); await drain();
  check(ev('BOT.hand.length') === 3 && S().life === l0 + 2, 'mit Devil: +2 Leben, KI wirft ab');
  // Casualty
  await reset(); const vv = N('Ogre', 'Creature — Ogre', '', {pw:3, tg:3}); bf(vv); const ob2 = C('Ob Nixilis, the Adversary', {mc:''});
  ev('S.pool.B = 4; S.pool.R = 4; S.pool.C = 4; commit()'); S().hand.push(ob2); ev('commit()'); ev('play')(ob2.u); await wait(150); console.log('   CAS:', title()); await clickCard('Ogre'); await wait(150); await drain();
  const cp = S().bf.find(c => c.tok && /Ob Nixilis/.test(c.n));
  check(S().gy.includes(vv) && cp && cp.c === 3 && !/Legendary/.test(cp.type), 'Casualty: Ogre geopfert, nicht-legendäre Token-Kopie mit Loyalität 3');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
