const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report9_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  // Birgi
  await reset(); const bg = C('Birgi, God of Storytelling // Harnfel, Horn of Bounty', {pw:3, tg:3}); S().bf.push(bg); ev('commit()');
  await cast(N('Opt', 'Instant', 'Scry 1.')); await drain();
  check(S().pool.R === 1, 'Birgi: Zauber gewirkt → {R}');
  ev('S.pool.G = 1; setPhase(3)'); await wait(40);
  check(S().pool.R === 1 && !S().pool.G, 'Phasenwechsel: {R} bleibt, {G} verfällt');
  ev('emptyPool("Zugende")'); check(!S().pool.R, 'Zugende: alles weg');
  // Gifts Ungiven
  await reset(); lib(N('A', 'Instant', '', {cmc:1}), N('B', 'Instant', '', {cmc:2}), N('C', 'Sorcery', '', {cmc:5}), N('D', 'Sorcery', '', {cmc:6}), N('E', 'Instant'));
  await cast(C('Gifts Ungiven', opt));
  for(const n of ['A','B','C','D']){ await clickCard(n); await wait(40); }
  await wait(60);
  check(S().gy.some(c => c.n === 'C') && S().gy.some(c => c.n === 'D') && S().hand.some(c => c.n === 'A') && S().hand.some(c => c.n === 'B'), `Gifts: KI legt C, D in den Friedhof (Hand ${S().hand.map(c => c.n)})`);
  // Intuition
  await reset(); lib(N('A', 'Instant', '', {cmc:1}), N('B', 'Instant', '', {cmc:2}), N('C', 'Sorcery', '', {cmc:5}));
  await cast(C('Intuition', opt)); for(const n of ['A','B','C']){ await clickCard(n); await wait(40); } await wait(60);
  console.log('   ', S().hand.map(c=>c.n), S().gy.map(c=>c.n), title());
  check(S().hand.some(c => c.n === 'A') && S().gy.filter(c => c.n !== 'Intuition').length === 2, 'Intuition: KI gibt dir die billigste (A), der Rest in den Friedhof');
  // Queen of Dale
  await reset(); lib(N('Spell', 'Instant')); S().hand.push(N('Bolt', 'Instant'));
  const qd = C('The Queen of Dale', {pw:2, tg:2}); S().bf.push(qd); ev('commit()');
  ev('abilEvent({kind:"oppCast", c:{n:"Ponder", type:"Sorcery"}, opp:true, pid:"bot"})'); await wait(60);
  await clickCard('Bolt'); await wait(60);
  check(S().gy.some(c => c.n === 'Bolt') && S().bf.some(c => c.n === 'Human Soldier' || /Human/.test(c.n)) && S().hand.some(c => c.n === 'Spell'), 'Queen of Dale: Recruit – ziehen, Bolt abgeworfen, Soldat');
  // Curse of Opulence
  await reset(); ev('BOT.bf = []; BOT.life = 20; botChanged()'); await wait(20);
  const cu = C('Curse of Opulence'); S().hand.push(cu); ev('commit()'); ev('moveCard')(cu.u, 'bf'); await wait(60);
  const kb = [...d.querySelectorAll('#modalBox button')].find(b => /^KI/.test(b.textContent)); if(kb){ kb.click(); await wait(60); }
  check(cu.eqPid === 'bot' && ev('pub()').bf.find(x => x.u === cu.u).eqPid === 'bot', 'Curse: verzaubert die KI');
  const at = N('Bear', 'Creature — Bear', '', {pw:2, tg:2}); S().bf.push(at); ev('commit()');
  ev('openAttackDialog()'); await wait(40); await clickCard('Bear'); await click('Angreifen'); await wait(300); await drain();
  check(S().bf.some(c => c.n === 'Gold'), 'Angriff auf die KI: Gold-Token');
  // Paradise Mantle
  await reset(); const pm = C('Paradise Mantle'); const el = N('Bear', 'Creature — Bear', '', {pw:2, tg:2}); pm.eq = el.u; S().bf.push(pm, el); ev('commit()');
  check((ev('manaChoices')(el) || []).length === 5, 'Paradise Mantle: ausgerüstete Kreatur tappt für jede Farbe');
  // Sevinne's Reclamation
  await reset(); const r1 = N('Rock', 'Artifact', '', {cmc:2}), r2 = N('Stone', 'Artifact', '', {cmc:3}); const sv = C("Sevinne's Reclamation"); S().gy.push(r1, r2, sv); ev('commit()');
  const fb = ev('cardMenu')(sv, 'gy').find(i => /Flashback/.test(i.l || '')); if(fb) fb.f(); await wait(80);
  await clickCard('Rock'); await wait(60); await click('Ja'); await wait(60); await clickCard('Stone'); await wait(60);
  check(S().bf.includes(r1) && S().bf.includes(r2), 'Sevinne\'s Reclamation mit Flashback: zwei Karten zurück');
  // Storm-Kiln Artist
  await reset(); const sk = C('Storm-Kiln Artist', {pw:2, tg:2}); S().bf.push(sk, N('A1', 'Artifact'), N('A2', 'Artifact')); ev('commit()');
  check(ev('power')(sk) === 4 && ev('tough')(sk) === 2, `Storm-Kiln Artist: 4/2 mit zwei Artefakten (${ev('power')(sk)}/${ev('tough')(sk)})`);
  // Hydroelectric Specimen
  await reset(); ev('net.role = "host"; net.order = [me.id]; net.players = {}; net.players[me.id] = {name:"Lukas"}; STACK = [{id:"s1", n:"Lightning Bolt", type:"Instant", owner:"x", by:"Anna", passes:[]}]');
  const hy = C('Hydroelectric Specimen // Hydroelectric Laboratory', {pw:1, tg:4}); S().hand.push(hy); ev('commit()'); ev('moveCard')(hy.u, 'bf'); await wait(80);
  await click('Ja'); await wait(40); await click('Lightning Bolt'); await wait(40);
  check(/Hydroelectric/.test(ev('STACK[0].redirect') || ''), 'Hydroelectric Specimen lenkt den Blitz um');
  ev('STACK = []; net.role = "solo"');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
