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
  // Invert
  await reset(); const wall = N('Wall', 'Creature — Wall', '', {pw:0, tg:6}); S().bf.push(wall); ev('commit()');
  await cast(C('Invert // Invent', opt)); await clickCard('Wall'); await wait(40); await click('Kein Ziel'); await wait(40);
  check(ev('power')(wall) === 6 && ev('tough')(wall) === 0, `Invert: Wall 6/0 (${ev('power')(wall)}/${ev('tough')(wall)})`);
  // Mishra's Bauble
  await reset(); ev('BOT.library = [newCard({n:"Secret", type:"Instant"})]; botChanged()');
  const mb = C("Mishra's Bauble"); S().bf.push(mb); ev('commit()');
  ev('activateAbility')(mb, ev('parseAbilities')(mb)[0]); await wait(60); console.log('   MB:', title()); await kiBtn(); await wait(80); console.log('   MB2:', title(), d.querySelector('#modalBox').textContent.slice(0,100));
  const seen1 = /Secret/.test(d.querySelector('#modalBox').textContent); [...d.querySelectorAll('#modalBox button')].filter(b => /Schliessen/.test(b.textContent)).pop().click(); await wait(60);
  check(seen1 && (S().delayed || []).some(x => x.action === 'draw'), "Mishra's Bauble: sieht «Secret», Ziehen vorgemerkt");
  // Urza's Bauble
  await reset(); ev('BOT.hand = [newCard({n:"OnlyCard", type:"Instant"})]; botChanged()');
  const ub = C("Urza's Bauble"); S().bf.push(ub); ev('commit()');
  ev('activateAbility')(ub, ev('parseAbilities')(ub)[0]); await wait(60); await kiBtn(); await wait(80);
  const seen2 = /OnlyCard/.test(d.querySelector('#modalBox').textContent); [...d.querySelectorAll('#modalBox button')].filter(b => /Schliessen/.test(b.textContent)).pop().click(); await wait(60);
  check(seen2 && (S().delayed || []).some(x => x.action === 'draw'), "Urza's Bauble: zufällige Handkarte, Ziehen vorgemerkt");
  // Secret Identity
  await reset(); const el = N('Elf', 'Creature — Elf', '', {pw:1, tg:1}); S().bf.push(el); ev('commit()');
  await cast(C('Secret Identity', opt)); await pick(/Hero/); await click('Ausführen'); await wait(40); await clickCard('Elf'); await wait(40);
  check(ev('power')(el) === 3 && ev('tough')(el) === 4 && ev('kwHas')(el, 'flying'), 'Secret Identity: Elf ist 3/4 fliegend');
  // Sundering Eruption
  await reset(); ev('BOT.bf = [newCard({n:"Gaea\'s Cradle", type:"Legendary Land"})]; BOT.library = [newCard({n:"Forest", type:"Basic Land — Forest"})]; botChanged()'); await wait(20);
  await cast(C('Sundering Eruption // Volcanic Fissure', opt)); await clickCard("Gaea"); await wait(100);
  check(ev('BOT.bf.length') === 1 && ev('BOT.bf[0].n') === 'Forest' && ev('BOT.bf[0].tap'), 'Sundering Eruption: Cradle zerstört, KI sucht getappten Wald');
  check(!ev('canBlock')(N('Bear', 'Creature', '', {pw:2, tg:2}), N('Att', 'Creature', '', {pw:2, tg:2})), 'Kreaturen ohne Fliegen können nicht blocken');
  ev('S.locks = []; commit()');
  // Tandem Lookout
  await reset(); lib(N('a', 'Instant'), N('b', 'Instant'));
  const bear = N('Bear', 'Creature — Bear', '', {pw:2, tg:2}); S().bf.push(bear); ev('commit()');
  const tl = C('Tandem Lookout', {pw:2, tg:1}); S().hand.push(tl); ev('commit()'); ev('moveCard')(tl.u, 'bf'); await wait(60); await clickCard('Bear'); await wait(40);
  check(tl.pair === bear.u && bear.pair === tl.u, 'Soulbond: Tandem Lookout mit Bär verbunden');
  w.__b = bear; ev('abilEvent({kind:"combatDamage", c:window.__b, pid:"bot", much:2, first:true}, [window.__b])'); await wait(60);
  check(S().hand.length === 1, 'Bär macht Schaden → du ziehst');
  // Virtue of Courage
  await reset(); lib(N('V1', 'Instant'), N('V2', 'Instant'), N('V3', 'Instant'));
  S().bf.push(C('Virtue of Courage // Embereth Blaze')); ev('commit()');
  await cast(N('Shock', 'Instant', 'Shock deals 2 damage to any target.')); await kiBtn(); await wait(120); await click('Ja'); await wait(60);
  check(S().ex.filter(c => c.castKey).length === 2, `Virtue: 2 Schaden → 2 Karten spielbar (${S().ex.filter(c => c.castKey).length})`);
  // Alchemist's Gambit mit Cleave
  await reset(); ev('S.life = 20; S.extraTurns = 0; S.delayed = []');
  const ag = C("Alchemist's Gambit"); w.__c = ag; ev('castCosts(window.__c)'); await wait(40); await click('Mit Cleave'); await wait(40);
  ev('abilSpellResolve(window.__c)'); await wait(60);
  check(S().extraTurns === 1 && !S().delayed.some(x => x.action === 'steps'), 'Cleave: Zusatzzug ohne Verlieren');
  await reset(); ev('S.extraTurns = 0; S.delayed = []'); const ag2 = C("Alchemist's Gambit"); w.__c = ag2; ev('castCosts(window.__c)'); await wait(40); await click('Normal'); await wait(40); ev('abilSpellResolve(window.__c)'); await wait(60);
  check(S().extraTurns === 1 && S().delayed.some(x => x.action === 'steps'), 'ohne Cleave: Verlieren vorgemerkt');
  ev('S.extraTurns = 0; S.delayed = []; commit()');
  // Curiosity
  await reset(); lib(N('a', 'Instant')); const cr = N('Bear', 'Creature — Bear', '', {pw:2, tg:2}); S().bf.push(cr); ev('commit()');
  const cu = C('Curiosity'); S().hand.push(cu); ev('commit()'); ev('moveCard')(cu.u, 'bf'); await wait(60); await clickCard('Bear'); await wait(40);
  w.__b = cr; ev('abilEvent({kind:"combatDamage", c:window.__b, pid:"bot", much:2, first:true}, [window.__b])'); await wait(60); await click('Ja'); await wait(40);
  check(S().hand.length === 1, 'Curiosity: verzauberte Kreatur macht Schaden → ziehen');
  // Jeweled Amulet
  await reset(); const ja = C('Jeweled Amulet'); S().bf.push(ja); ev('commit()');
  ev('activateAbility')(ja, ev('parseAbilities')(ja)[0]); await wait(60); console.log('   Dialog:', title()); await pick(/Grün|Green|^G$|\{G\}/); await wait(40);
  console.log('   noted', ja.noted, ja.c);
  ja.tap = false; const jo = (ev('manaChoices')(ja) || [])[0]; if(jo) await ev('tapForMana')(ja, jo); await wait(60);
  check(ja.noted && S().pool[ja.noted] === 1 && !ja.c, `Jeweled Amulet: notiert ${ja.noted}, gibt es zurück`);
  // Multiversal Passage
  await reset(); const mp = C('Multiversal Passage'); S().hand.push(mp); ev('commit()'); ev('moveCard')(mp.u, 'bf'); await wait(60);
  await click('Island'); await wait(40); await click('Ja'); await wait(40);
  check(/Island/.test(mp.type) && !mp.tap && S().life === 18 && (ev('manaChoices')(mp) || []).some(o => (o.add || []).includes('U')), 'Multiversal Passage: Insel, 2 Leben, ungetappt');
  // Thran Portal
  await reset(); ev('S.life = 20'); const tp = C('Thran Portal'); S().hand.push(tp); ev('commit()'); ev('moveCard')(tp.u, 'bf'); await wait(60); await click('Swamp'); await wait(40);
  tp.tap = false; console.log('   TP', tp.type, JSON.stringify(ev('manaChoices')(tp))); const o = (ev('manaChoices')(tp) || []).find(x => (x.add || []).includes('B')); if(o) await ev('tapForMana')(tp, o); await wait(20);
  console.log('   TP2', JSON.stringify(S().pool), S().life);
  check(S().pool.B === 1 && S().life === 19, 'Thran Portal: Sumpf, Mana kostet 1 Leben');
  // Sandstone Needle
  await reset(); const sn = C('Sandstone Needle'); S().hand.push(sn); ev('commit()'); ev('moveCard')(sn.u, 'bf'); await wait(40);
  console.log('   SN', sn.c, sn.tap, sn.cn);
  check(sn.c === 2 && sn.tap, 'Sandstone Needle: getappt mit 2 Marken');
  // Submerge
  await reset(); ev('BOT.bf = [newCard({n:"Dino", type:"Creature", pw:6, tg:6})]; BOT.library = []; botChanged()'); await wait(20);
  await cast(C('Submerge', opt)); await click('Normal'); await wait(40); console.log('   SUB', title(), [...d.querySelectorAll('#modalBox button')].map(b=>b.textContent).join('|')); await clickCard('Dino'); await wait(80); console.log('   SUB2', title(), ev('BOT.bf.length'), ev('BOT.library.length'));
  check(ev('BOT.library[0] && BOT.library[0].n') === 'Dino', 'Submerge: Dino oben auf die Bibliothek der KI');
  // Vivi Ornitier
  await reset(); ev('BOT.life = 20'); const vv = C('Vivi Ornitier', {pw:0, tg:3}); S().bf.push(vv); ev('commit()');
  await cast(N('Opt', 'Instant', 'Scry 1.')); await drain(); await wait(80);
  check(vv.c === 1 && ev('BOT.life') === 19, `Vivi: Marke und 1 Schaden (KI ${ev('BOT.life')})`);
  // Wild Slash
  await reset(); ev('BOT.life = 20'); await cast(C('Wild Slash', opt)); await kiBtn(); await wait(60);
  check(ev('BOT.life') === 18, 'Wild Slash: 2 Schaden');
  // Command Performance
  await reset(); ev('S.marks = S.marks || {}'); await cast(C('Command Performance', opt)); await pick(/You get/); await pick(/^Roll/); await click('Ausführen'); await wait(60);
  check(ev('marksOf().TK') === 2, 'Command Performance: 2 Tickets');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
