const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report6_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  // Defense Grid
  await reset(); ev('BOT.bf = [newCard({n:"Defense Grid", type:"Artifact"})]; botChanged(); TURN.active = "bot"'); await wait(20);
  const op = N('Opt', 'Instant', 'Scry 1.', {mc:'{U}'}); w.__c = op; ev('castCosts(window.__c)'); await wait(40);
  check(op.payMc === '{U}{3}', `Defense Grid: im Zug der KI kostet Opt ${op.payMc}`);
  ev('TURN.active = me.id'); delete op.payMc; ev('castCosts(window.__c)'); await wait(40);
  check(op.payMc == null, 'im eigenen Zug normal');
  // Scroll Rack
  await reset(); lib(N('T1', 'Instant'), N('T2', 'Instant'), N('T3', 'Instant')); S().hand.push(N('H1', 'Instant'), N('H2', 'Instant')); const sr = C('Scroll Rack'); S().bf.push(sr); ev('commit()');
  ev('runSteps(parseSteps(parseAbilities(S.bf[0])[0].text, S.bf[0]), S.bf[0])'); await wait(60);
  await clickCard('H1'); await clickCard('H2'); await click('Fertig'); await wait(60);
  await clickCard('H2'); await clickCard('H1'); await click('Fertig'); await wait(60);
  check(S().hand.map(c => c.n).join() === 'T1,T2' && S().library.slice(0, 3).map(c => c.n).join() === 'H2,H1,T3', `Scroll Rack: Hand ${S().hand.map(c => c.n)}, oben ${S().library.slice(0, 3).map(c => c.n)}`);
  // Manifold Key
  await reset(); ev('BOT.bf = [newCard({n:"Wall", type:"Creature — Wall", pw:0, tg:8})]; botChanged()'); await wait(20);
  const mk = C('Manifold Key'); const at = N('Bear', 'Creature — Bear', '', {pw:2, tg:2}); S().bf.push(mk, at); ev('commit()');
  ev('runSteps(parseSteps(parseAbilities(S.bf[0])[1].text, S.bf[0]), S.bf[0])'); await wait(40); await clickCard('Bear'); await wait(40);
  check(!ev('canBlock')(ev('BOT.bf[0]'), at) && ev('combatInfo')(at).kw.includes('Unblockable'), 'Manifold Key: Bär kann nicht geblockt werden');
  // Moonsnare Prototype
  await reset(); ev('BOT.bf = [newCard({n:"Sol Ring", type:"Artifact"})]; BOT.library = []; botChanged()'); await wait(20);
  const ms = C('Moonsnare Prototype'); S().hand.push(ms); ev('commit()');
  const ch = ev('cardMenu')(ms, 'hand').find(i => /Aus der Hand/.test(i.l || '')); check(!!ch, 'Moonsnare: Channel im Handmenü');
  if(ch) ch.f(); await wait(80); await clickCard('Sol Ring'); await wait(80);
  check(ev('BOT.library[0] && BOT.library[0].n') === 'Sol Ring' && S().gy.includes(ms), 'Channel: Sol Ring der KI auf ihre Bibliothek');
  const own = N('Rock', 'Artifact'); S().bf.push(own); ev('commit()');
  ev('runSteps(parseSteps("The owner of target nonland permanent puts it on their choice of the top or bottom of their library.", S.bf[0]), S.bf[0])'); await wait(40);
  await clickCard('Rock'); await wait(40); await click('Unter'); await wait(40);
  check(S().library[S().library.length - 1] === own, 'eigene Karte: unter die Bibliothek');
  // Tezzeret: Emblem
  await reset();
  const tz = C('Tezzeret, Cruel Captain'); tz.c = 8; S().bf.push(tz); const rock = N('Mind Stone', 'Artifact'); S().bf.push(rock); ev('commit()');
  const ab = ev('parseAbilities')(tz).find(a => a.cost === '-7'); ev('activateLoyalty')(tz, ab); await wait(60);
  check(S().emblems.length === 1, 'Tezzeret −7: Emblem erhalten');
  ev('remindTriggers("combat", true)'); await wait(60); await clickCard('Mind Stone'); await wait(60);
  check(rock.c === 3 && ev('isCreature')(rock) && ev('power')(rock) === 3, `Emblem im Kampf: Mind Stone wird 3/3-Roboter (${rock.type})`);
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
