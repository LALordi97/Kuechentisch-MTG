const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report5_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  const tapMana = async c => { const ch = ev('manaChoices')(c); await ev('tapForMana')(c, ch[0]); await wait(30); };
  // Badgermole Cub
  await reset();
  const fo = N('Forest', 'Basic Land — Forest'); S().bf.push(fo); ev('commit()');
  const bc = C('Badgermole Cub', {pw:2, tg:2}); S().hand.push(bc); ev('commit()'); await ev('play')(bc.u); await wait(80);
  await clickCard('Forest'); await wait(60);
  check(ev('isCreature')(fo) && ev('power')(fo) === 1 && ev('kwHas')(fo, 'haste'), 'Earthbend 1: Wald ist 1/1-Kreatur mit Eile');
  const elf = N('Llanowar Elves', 'Creature — Elf Druid', '{T}: Add {G}.', {pw:1, tg:1}); S().bf.push(elf); ev('commit()');
  await tapMana(elf);
  check(S().pool.G === 2, `Badgermole: Elf gibt {G}{G} (${ev('poolStr(S.pool)')})`);
  ev('moveCard')(fo.u, 'gy'); await wait(60);
  check(S().bf.includes(fo) && fo.tap && !ev('isCreature')(fo), 'Erdgebogenes Land stirbt → kommt getappt als Land zurück');
  // Training Grounds / Biomancer's Familiar
  await reset(); ev('S.pool = emptyPoolObj(); S.pool.G = 5; LOOK.autoPay = true');
  S().bf.push(C('Training Grounds')); const pump = N('Shaman', 'Creature — Human Shaman', '{3}{G}: Draw a card.', {pw:1, tg:1}); S().bf.push(pump); lib(N('X', 'Instant')); ev('commit()');
  ev('activateAbility')(pump, ev('parseAbilities')(pump)[0]); await wait(80);
  check(S().pool.G === 3 && S().hand.length === 1, `Training Grounds: {3}{G} kostet nur {1}{G} (Pool G ${S().pool.G})`);
  ev('LOOK.autoPay = false; S.pool = emptyPoolObj()');
  // Adapt mit Biomancer's Familiar
  await reset();
  const bf2 = C("Biomancer's Familiar", {pw:1, tg:1}); const ad = N('Adapter', 'Creature — Beast', '{2}: Adapt 2.', {pw:2, tg:2}); ad.c = 2; S().bf.push(bf2, ad); ev('commit()');
  ev('runSteps(parseSteps("The next time target creature adapts this turn, it adapts as though it had no +1/+1 counters on it.", S.bf[0]), S.bf[0])'); await wait(40); await clickCard('Adapter'); await wait(40);
  ev('runSteps(parseSteps("Adapt 2.", S.bf[1]), S.bf[1])'); await wait(40);
  check(ad.c === 4, `Adapt trotz Marken dank Biomancer (${ad.c})`);
  // Candelabra
  await reset(); const ls = [0,1,2].map(i => { const l = N('Island', 'Basic Land — Island'); l.tap = true; return l; }); const cand = C('Candelabra of Tawnos'); S().bf.push(cand, ...ls); ev('commit()');
  ev('activateAbility')(cand, ev('parseAbilities')(cand)[0]); await wait(60);
  console.log('   Dialog:', title()); d.querySelector('#askN').value = '2'; await click('Weiter'); await wait(40);
  await clickCard('Island'); await wait(20); [...d.querySelectorAll('#modalBox .card')][1].click(); await wait(20); await click('Fertig'); await wait(40);
  check(ls.filter(l => !l.tap).length === 2 && cand.tap, 'Candelabra X=2: zwei Inseln enttappt');
  // Snap
  await reset(); const sl = [0,1,2].map(() => { const l = N('Island', 'Basic Land — Island'); l.tap = true; return l; }); const cr = N('Bear', 'Creature — Bear', '', {pw:2, tg:2}); S().bf.push(cr, ...sl); ev('commit()');
  await cast(C('Snap', opt)); await clickCard('Bear'); await wait(60); await clickCard('Island'); await wait(20); [...d.querySelectorAll('#modalBox .card')][1].click(); await wait(20); await click('Fertig'); await wait(40);
  check(S().hand.includes(cr) && sl.filter(l => !l.tap).length === 2, 'Snap: Bär zurück, zwei Länder enttappt');
  // Emerald Charm
  await reset(); ev('BOT.bf = [newCard({n:"Bird", type:"Creature — Bird", kw:["Flying"], pw:1, tg:1})]; botChanged()'); await wait(20);
  await cast(C('Emerald Charm', opt)); console.log('   Dialog:', title());
  [...d.querySelectorAll('#modalBox button')].find(b => /loses flying/.test(b.textContent)).click(); await click('Ausführen'); await wait(60); await clickCard('Bird'); await wait(60);
  check(!ev('kwHas')(ev('BOT.bf[0]'), 'flying') && !ev('pub ? true : false') === false, 'Emerald Charm: Vogel der KI verliert Fliegen');
  // Talon Gates
  await reset(); ev('BOT.bf = [newCard({n:"Dino", type:"Creature — Dinosaur", pw:6, tg:6})]; botChanged()'); await wait(20);
  const tg = C('Talon Gates of Madara'); S().hand.push(tg); ev('commit()');
  const hm = ev('cardMenu')(tg, 'hand').find(i => /aus der Hand ins Spiel/.test(i.l || '')); check(!!hm, 'Talon Gates: «{4}: aus der Hand ins Spiel» im Handmenü');
  if(hm) hm.f(); await wait(100); await clickCard('Dino'); await wait(60);
  check(S().bf.includes(tg) && ev('BOT.bf[0].phased'), 'Talon Gates im Spiel, Dino der KI phast aus');
  // Cloud of Faeries
  await reset(); const cl = [0,1].map(() => { const l = N('Island', 'Basic Land — Island'); l.tap = true; return l; }); S().bf.push(...cl); ev('commit()');
  const cf = C('Cloud of Faeries', {pw:1, tg:1}); S().hand.push(cf); ev('commit()'); await ev('play')(cf.u); await wait(80);
  check(cl.every(l => !l.tap), 'Cloud of Faeries: zwei Länder enttappt');
  // Hexing Squelcher: Ward
  await reset(); ev('S.life = 20; BOT.bf = [newCard({n:"Hexing Squelcher", type:"Creature — Goblin", pw:2, tg:2, kw:["Ward"]}), newCard({n:"Bear", type:"Creature — Bear", pw:2, tg:2})]; botChanged()'); await wait(20);
  ev('window.__t = undefined; pickTarget("Ziel", "target creature", false).then(r => window.__t = r)'); await wait(40); await clickCard('Bear'); await wait(40);
  check(/Pay 2 life/.test(d.querySelector('#modalBox').textContent), 'Ward: Bär der KI kostet 2 Leben');
  await click('Bezahlen'); await wait(40);
  check(S().life === 18 && ev('window.__t && window.__t.card.n') === 'Bear', 'Ward bezahlt: 18 Leben, Ziel gilt');
  ev('window.__t = undefined; pickTarget("Ziel", "target creature", false).then(r => window.__t = r)'); await wait(40); await clickCard('Bear'); await wait(40); await click('Nicht bezahlen'); await wait(40);
  check(ev('window.__t') === null, 'Ward nicht bezahlt: kein Ziel');
  // Sowing Mycospawn
  await reset(); ev('BOT.bf = [newCard({n:"Gaea\'s Cradle", type:"Legendary Land"})]; botChanged()'); await wait(20); lib(N('Forest', 'Basic Land — Forest'));
  const sm = C('Sowing Mycospawn', {mc:'', pw:3, tg:3}); S().hand.push(sm); ev('commit()'); ev('play')(sm.u); await wait(60);
  await click('Mit Kicker'); await wait(100); console.log('   Dialog:', title());
  for(let i = 0; i < 3 && open(); i++){ if(/Wald|Forest|suche/.test(title())) await clickCard('Forest'); else if(/verbannen|Gaea/.test(d.querySelector('#modalBox').textContent)) await clickCard("Gaea"); else break; await wait(80); }
  check(S().bf.some(c => c.n === 'Forest') && ev('BOT.bf.length') === 0, 'Sowing Mycospawn mit Kicker: Land gesucht, Gaea\'s Cradle der KI verbannt');
  // Springheart Nantuko (Bestow)
  await reset(); const host = N('Bear', 'Creature — Bear', '', {pw:2, tg:2}); S().bf.push(host); ev('commit()');
  const sn = C('Springheart Nantuko', {pw:1, tg:1}); S().hand.push(sn); ev('commit()');
  const bi = ev('cardMenu')(sn, 'hand').find(i => /Bestow/.test(i.l || '')); check(!!bi, 'Nantuko: «Mit Bestow wirken» im Handmenü');
  if(bi) bi.f(); await wait(60); await clickCard('Bear'); await wait(80);
  check(sn.bestowed && !ev('isCreature')(sn) && ev('power')(host) === 3, 'Bestow: Bär 3/3, Nantuko keine Kreatur');
  const fl = N('Forest', 'Basic Land — Forest'); S().hand.push(fl); ev('commit()'); ev('moveCard')(fl.u, 'bf'); await wait(80);
  await click('Ja'); await wait(80); await click('Nein'); await wait(80);
  check(S().bf.filter(c => c.n === 'Forest').length === 2 && S().bf.filter(c => c.n === 'Insect').length === 1, 'Landfall: Token-Kopie des Waldes; deren Landfall ohne Zahlung → Insekt');
  ev('moveCard')(host.u, 'gy'); await wait(40);
  check(ev('isCreature')(sn) && !sn.bestowed, 'Bär stirbt → Nantuko wird wieder Kreatur');
  const fl2 = N('Forest', 'Basic Land — Forest'); S().hand.push(fl2); ev('commit()'); ev('moveCard')(fl2.u, 'bf'); await wait(80);
  console.log('   Dialog:', d.querySelector('#modalBox').textContent.slice(0,200));
  check(S().bf.filter(c => c.n === 'Insect').length === 2, 'nicht angelegt: Insekt-Token');
  // Vibrance
  await reset(); ev('BOT.life = 20; LOOK.autoPay = true; S.pool = emptyPoolObj(); S.pool.R = 2; S.pool.C = 3');
  const vb = C('Vibrance', {pw:4, tg:4}); S().hand.push(vb); ev('commit()'); ev('play')(vb.u); await wait(120);
  console.log('   Dialog:', title(), JSON.stringify(vb.spent));
  await kiBtn(); await wait(60);
  check(ev('BOT.life') === 17 && !open(), `Vibrance mit {R}{R}: 3 Schaden an die KI, kein G-Auslöser (KI ${ev('BOT.life')})`);
  ev('LOOK.autoPay = false'); await drain();
  // Wild Growth
  await reset(); const wl = N('Forest', 'Basic Land — Forest'); S().bf.push(wl); ev('commit()');
  const wg = C('Wild Growth'); S().hand.push(wg); ev('commit()'); ev('moveCard')(wg.u, 'bf'); await wait(60); await clickCard('Forest'); await wait(40);
  await tapMana(wl);
  check(wg.eq === wl.u && S().pool.G === 2, `Wild Growth: Wald gibt {G}{G} (${ev('poolStr(S.pool)')})`);
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
