const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report30_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  // Moonsilver Key: «an artifact card with a mana ability or a basic land card» (Text aus dem Suchfenster der App)
  const f = ev('cardFilter')('an artifact card with a mana ability or a basic land card');
  const yes = [N('Mana Vault', 'Artifact', "Mana Vault doesn't untap during your untap step.\n{T}: Add {C}{C}{C}."), N('Mox', 'Legendary Artifact', 'Metalcraft — {T}: Add one mana of any color. Activate only if you control three or more artifacts.'),
    N('Diamant', 'Artifact', 'Sacrifice this artifact, Discard your hand: Add three mana of any one color. Activate only as an instant.'), N('Werker', 'Artifact Creature — Construct', '{T}: Reveal any number of artifact cards in your hand. Add {C}{C} for each card revealed this way.'),
    N('Artefaktland', 'Artifact Land', '{T}: Add {W}.'), N('Plains', 'Basic Land — Plains', ''), N('Snow-Covered Island', 'Basic Snow Land — Island', '')];
  const no = [N('Stab', 'Artifact', '{1}: Untap this artifact.\n{2}, {T}: You gain 1 life.\n{5}, {T}: Draw a card.'), N('Ballista', 'Artifact Creature — Construct', '{4}: Put a +1/+1 counter on this creature.'),
    N('Karte', 'Artifact', '{2}, {T}, Sacrifice this artifact: Search your library for a land card, reveal it, put it into your hand, then shuffle.'), N('Kanonist', 'Artifact Creature — Human Cleric', "Each player who has cast a nonartifact spell this turn can't cast additional nonartifact spells."),
    N('Doppelland', 'Land', '{T}: Add {W} or {U}.'), N('Elf', 'Creature — Elf Druid', '{T}: Add {G}.'), N('Geber', 'Artifact', 'Creatures you control have "{T}: Add one mana of any color."')];
  yes.forEach(c => check(f(c), `passt: ${c.n} (${c.type})`));
  no.forEach(c => check(!f(c), `passt nicht: ${c.n} (${c.type})`));
  console.log(fails ? `\n${fails} FEHLER` : "\nALLES OK"); process.exit(0);
})();
