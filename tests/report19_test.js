const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report19_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  // Praetor's Grasp
  await reset(); ev('BOT.library = [newCard({n:"Bolt", type:"Instant", o:"Draw a card."}), newCard({n:"Hill", type:"Land"})]; botChanged()'); lib(N('a', 'Instant'));
  await cast(C("Praetor's Grasp", opt)); await kiBtn(); await wait(60); await clickCard('Bolt'); await wait(100);
  const g = S().ex.find(c => c.n === 'Bolt');
  check(g && g.castKey === 'perm' && ev('BOT.library.length') === 1, "Praetor's Grasp: Bolt der KI verdeckt im Exil, dauerhaft spielbar");
  ev('setTurn({active:"bot", n:110, starter:me.id, phase:0})'); ev('setTurn({active:me.id, n:111, starter:me.id, phase:2})'); await wait(60); await drain();
  check(S().ex.includes(g), 'auch im nächsten Zug noch spielbar');
  const mi = ev('cardMenu')(g, 'ex').find(i => /Wirken|Spielen/.test(i.l || '')); if(mi) mi.f(); await wait(100);
  check(S().hand.length === 1 && ev('BOT.gy.some(c => c.n === "Bolt")'), 'gewirkt, Bolt im Friedhof der KI');
  // Yawgmoth's Will
  await reset(); lib(N('a', 'Instant'), N('b', 'Instant')); const br = N('Brainstorm', 'Instant', 'Draw a card.'); const ld = N('Swamp', 'Basic Land — Swamp'); S().gy.push(br, ld); ev('commit()');
  await cast(C("Yawgmoth's Will", opt));
  const yi = ev('cardMenu')(br, 'gy').find(i => /Yawgmoth/.test(i.l || '')); const yl = ev('cardMenu')(ld, 'gy').find(i => /Yawgmoth/.test(i.l || ''));
  check(!!yi && !!yl, "Yawgmoth's Will: Zauber und Land im Friedhof-Menü");
  if(yi) yi.f(); await wait(100);
  check(S().ex.includes(br) && S().hand.length === 1, 'Brainstorm gewirkt und danach ins Exil');
  // Demonic Counsel
  await reset(); ev('S.ywExile = null'); lib(N('Demon', 'Creature — Demon'), N('Combo', 'Sorcery'));
  await cast(C('Demonic Counsel', opt)); console.log('   ohne Delirium:', title(), [...d.querySelectorAll('#modalBox .card')].map(e => e.textContent.slice(0, 8)).join(','));
  await clickCard('Demon'); await wait(60); await drain();
  check(S().hand.some(c => c.n === 'Demon'), 'ohne Delirium: nur Dämon');
  await reset(); lib(N('Demon', 'Creature — Demon'), N('Combo', 'Sorcery')); S().gy.push(N('i', 'Instant'), N('s', 'Sorcery'), N('l', 'Land'), N('a', 'Artifact')); ev('commit()');
  console.log('   delirium', ev('deliriumOn()'), S().gy.map(c=>c.type).join(','));
  await cast(C('Demonic Counsel', opt)); console.log('   D1', title(), [...d.querySelectorAll('#modalBox .card')].map(e => e.textContent.slice(0, 8)).join(',')); await clickCard('Combo'); await wait(60); console.log('   D2', title()); await drain();
  check(S().hand.some(c => c.n === 'Combo') && !S().hand.some(c => c.n === 'Demon'), 'mit Delirium: beliebige Karte, nur eine Suche');
  // Glimmervoid
  await reset(); ev('S.ywExile = null; S.ywPlay = null'); const gv = C('Glimmervoid'); S().bf.push(gv); ev('commit()'); ev('remindTriggers("end", true)'); await wait(60); console.log('   G', ev('QDEPTH'), S().bf.map(c=>c.n+':'+c.type).join(','), S().gy.map(c=>c.n).join(',')); await drain();
  check(S().gy.includes(gv), 'Glimmervoid ohne Artefakte geopfert');
  await reset(); const gv2 = C('Glimmervoid'); S().bf.push(gv2, N('Rock', 'Artifact')); ev('commit()'); ev('remindTriggers("end", true)'); await wait(60); await drain();
  check(S().bf.includes(gv2), 'mit Artefakt bleibt es');
  // Mnemonic Betrayal
  await reset(); lib(N('a', 'Instant')); ev('BOT.gy = [newCard({n:"Opt", type:"Instant", o:"Draw a card."}), newCard({n:"Hill", type:"Land"})]; botChanged()');
  await cast(C('Mnemonic Betrayal', opt)); await wait(80);
  const ob = S().ex.filter(c => c.ow && c.castKey);
  check(ob.length === 2 && !ev('BOT.gy.length'), 'Mnemonic Betrayal: Friedhof der KI bei dir im Exil');
  const oi = ev('cardMenu')(ob.find(c => c.n === 'Opt'), 'ex').find(i => /Wirken/.test(i.l || '')); if(oi) oi.f(); await wait(100);
  check(S().hand.length === 1, 'Opt der KI gewirkt');
  ev('setTurn({active:"bot", n:112, starter:me.id, phase:0})'); await wait(60);
  check(ev('BOT.gy.some(c => c.n === "Hill")'), 'nicht gewirkte Karte zurück in den Friedhof der KI');
  ev('setTurn({active:me.id, n:113, starter:me.id, phase:2})'); await wait(60); await drain();
  // Nick Fury
  await reset(); lib(...Array(8).fill(0).map((_, i) => N('F' + i, 'Instant'))); const nf = C('Nick Fury, Agent of S.H.I.E.L.D.', {pw:2, tg:3}); S().bf.push(nf); ev('commit()');
  ev('activateAbility')(nf, ev('parseAbilities')(nf).find(a => a.kind === 'act')); await wait(80); console.log('   Nick:', title());
  check(nf.c === 2 && open(), 'Nick Fury: zwei Marken, dann Ansehen-Fenster');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
