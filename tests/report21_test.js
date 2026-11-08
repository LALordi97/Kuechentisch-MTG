const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report21_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  const enter = async (c, ms = 80) => { S().hand.push(c); ev('commit()'); ev('moveCard')(c.u, 'bf'); await wait(ms); };
  const bf = (...c) => { S().bf.push(...c); ev('commit()'); };
  const acts = c => ev('parseAbilities')(c).filter(a => a.kind === 'act');
  // Artist's Talent
  await reset(); const at = C("Artist's Talent"); await enter(at);
  check(at.level === 1 && !/cost \{1\} less/.test(at.o) && acts(at).length === 1, "Artist's Talent: Level 1, nur Level-2-Fähigkeit aktivierbar");
  ev('activateAbility')(at, acts(at)[0]); await wait(120); await drain();
  check(at.level === 2 && /cost \{1\} less/.test(at.o) && acts(at).length === 1 && /Level 3/.test(acts(at)[0].text || acts(at)[0].line || at.o), 'Level 2: Verbilligung aktiv, Level 3 aktivierbar');
  ev('activateAbility')(at, acts(at)[0]); await wait(120); await drain();
  check(at.level === 3 && /plus 2 instead/.test(at.o) && acts(at).length === 0, 'Level 3 erreicht');
  const l0 = ev('BOT.life'); ev('hitOpponent')('bot', {kind:'damage', amount:1, src:'Shock'}); await wait(80);
  check(ev('BOT.life') === l0 - 3, 'Level 3: 1 nicht-Kampfschaden wird zu 3');
  ev('moveCard')(at.u, 'hand'); check(at.level == null && /Level 3/.test(at.o) && /plus 2/.test(at.o), 'verlässt das Spiel: voller Text zurück');
  // Jeskai Ascendancy
  await reset(); bf(C('Jeskai Ascendancy')); const jb = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); bf(jb); jb.tap = true;
  ev('abilEvent({kind:"cast", c:newCard({n:"Opt", type:"Instant"})})'); await wait(150); await drain();
  check(!jb.tap && ev('power')(jb) === 3, 'Jeskai Ascendancy: +1/+1 und enttappt');
  // Kellan
  await reset(); const ke = C('Kellan, the Fae-Blooded // Birthright Boon', {pw:2, tg:2}); const kb = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); bf(ke, kb);
  const e1 = N('Schwert', 'Artifact — Equipment', ''); e1.eq = ke.u; const e2 = N('Aura', 'Enchantment — Aura', ''); e2.eq = ke.u; bf(e1, e2);
  check(ev('power')(kb) === 4 && ev('tough')(kb) === 2 && ev('power')(ke) === 2, 'Kellan: andere Kreaturen +2/+0 bei zwei Anhängen');
  // Seedtime
  await reset(); ev('S.oppBlueKey = null'); ev('TURN.active = "bot"');
  S().hand.push(C('Seedtime', {mc:''})); ev('commit()'); ev('castSpell')(S().hand[0].u); await wait(80);
  check(/nicht erlaubt/.test(title()) && /eigenen Zug/.test($('#modalBox').textContent), 'Seedtime: Warnung im fremden Zug'); await click('Nicht wirken');
  ev('TURN.active = me.id; S.extraTurns = 0'); await cast(C('Seedtime', {mc:''})); await wait(80); await drain();
  check(!ev('S.extraTurns'), 'ohne blauen Zauber kein Extrazug');
  ev('abilEvent({kind:"oppCast", c:{n:"Counterspell", type:"Instant", mc:"{U}{U}"}, opp:true, pid:"bot"})'); await cast(C('Seedtime', {mc:''})); await wait(80); await drain();
  check(ev('S.extraTurns') === 1, 'nach blauem Gegnerzauber: Extrazug');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
