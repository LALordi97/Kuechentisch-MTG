const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report14_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  // Attraktionsdeck
  await reset(); lib(N('a', 'Instant'), N('b', 'Instant'));
  const at = N('Balloon Stand', 'Artifact — Attraction', 'Visit — Draw a card.'); at.lights = [1,2,3,4,5,6];
  ev('S.attrDeck = []'); S().attrDeck.push(at);
  await cast(C('Command Performance', opt)); await pick(/^Open/); await pick(/^Roll/); await click('Ausführen'); await wait(100);
  check(S().bf.includes(at) && S().hand.length === 1, `Command Performance: Attraktion geöffnet und besucht (Hand ${S().hand.length})`);
  // Sticker
  await reset(); const bear = N('Bear', 'Creature — Bear', '', {pw:2, tg:2}); S().bf.push(bear); ev('commit()');
  ev('runSteps(parseSteps("You may put a sticker on a nonland permanent you own.", S.bf[0]), S.bf[0])'); await wait(40);
  await clickCard('Bear'); await wait(40); await click('Stärke/Widerstand'); await wait(40); d.querySelector('#askName').value = '5/4'; await click('Weiter'); await wait(40);
  check(ev('power')(bear) === 5 && ev('tough')(bear) === 4, 'Sticker: Bär ist 5/4');
  ev('runSteps(parseSteps("You may put a sticker on a nonland permanent you own.", S.bf[0]), S.bf[0])'); await wait(40);
  await clickCard('Bear'); await wait(40); await click('Fähigkeit'); await wait(40); d.querySelector('#askName').value = 'When this creature dies, draw a card.'; await click('Weiter'); await wait(40);
  check(ev('parseAbilities')(bear).some(a => a.kind === 'trig'), 'Fähigkeits-Sticker: Bär hat den Auslöser');
  // Quicksilver Elemental
  await reset(); ev('BOT.bf = [newCard({n:"Looter", type:"Creature — Human", pw:1, tg:1, o:"{T}: Draw a card."})]; botChanged()'); await wait(20); lib(N('x', 'Instant'));
  const qe = C('Quicksilver Elemental', {pw:3, tg:4}); S().bf.push(qe); ev('commit()');
  ev('runSteps(parseSteps(parseAbilities(S.bf[0])[0].text, S.bf[0]), S.bf[0])'); await wait(40); await clickCard('Looter'); await wait(80);
  const it = ev('cardMenu')(qe, 'bf').find(i => /Looter \(übernommen\)/.test(i.l || '')); check(!!it, 'Quicksilver: Fähigkeit von Looter der KI übernommen');
  if(it) it.f(); await wait(60);
  check(qe.tap && S().hand.length === 1, 'Quicksilver tappt sich und zieht');
  // Curiosity bei Nicht-Kampfschaden
  await reset(); lib(N('a', 'Instant')); const pinger = N('Pinger', 'Creature — Wizard', '{T}: Pinger deals 1 damage to each opponent.', {pw:1, tg:1}); S().bf.push(pinger); ev('commit()');
  const cu = C('Curiosity'); S().hand.push(cu); ev('commit()'); ev('moveCard')(cu.u, 'bf'); await wait(60); await clickCard('Pinger'); await wait(40);
  ev('activateAbility')(pinger, ev('parseAbilities')(pinger)[0]); await wait(100); await click('Ja'); await wait(60);
  check(S().hand.length === 1, 'Curiosity: Nicht-Kampfschaden an Gegner → ziehen');
  // Tandem Lookout bei Nicht-Kampfschaden
  await reset(); lib(N('a', 'Instant')); const p2 = N('Pinger', 'Creature — Wizard', '{T}: Pinger deals 1 damage to each opponent.', {pw:1, tg:1}); S().bf.push(p2); ev('commit()');
  const tl = C('Tandem Lookout', {pw:2, tg:1}); S().hand.push(tl); ev('commit()'); ev('moveCard')(tl.u, 'bf'); await wait(60); await clickCard('Pinger'); await wait(40);
  ev('activateAbility')(p2, ev('parseAbilities')(p2)[0]); await wait(120);
  check(S().hand.length === 1, 'Tandem Lookout: Pinger macht Schaden → ziehen');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
