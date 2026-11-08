const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report4_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  // Copy Enchantment / Mirrormade
  await reset(); ev('BOT.bf = [newCard({n:"Rhystic Study", type:"Enchantment", cmc:3}), newCard({n:"Sol Ring", type:"Artifact", cmc:1})]; botChanged()'); await wait(20);
  const ce = C('Copy Enchantment'); S().hand.push(ce); ev('commit()'); ev('moveCard')(ce.u, 'bf'); await wait(80);
  check(d.querySelector('#modalBox').textContent.includes('Rhystic') && !d.querySelector('#modalBox').textContent.includes('Sol Ring'), 'Copy Enchantment: nur Verzauberungen');
  await clickCard('Rhystic Study'); await wait(60);
  check(ce.n === 'Rhystic Study', 'Copy Enchantment ist jetzt Rhystic Study');
  const mm = C('Mirrormade'); S().hand.push(mm); ev('commit()'); ev('moveCard')(mm.u, 'bf'); await wait(80);
  await clickCard('Sol Ring'); await wait(60);
  check(mm.n === 'Sol Ring', 'Mirrormade kopiert Sol Ring');
  // Imposter Mech
  await reset(); ev('BOT.bf = [newCard({n:"Bear", type:"Creature — Bear", cmc:2, pw:2, tg:2})]; botChanged()'); await wait(20);
  const im = C('Imposter Mech', {pw:3, tg:4}); S().bf.push(N('Elf', 'Creature — Elf', '', {pw:1, tg:1})); S().hand.push(im); ev('commit()'); ev('moveCard')(im.u, 'bf'); await wait(80);
  check(!d.querySelector('#modalBox').textContent.includes('Elf'), 'Imposter Mech: nur Kreaturen der Gegner');
  await clickCard('Bear'); await wait(60);
  check(im.n === 'Bear' && /^Artifact — Vehicle/.test(im.type) && !ev('isCreature')(im) && im.kw.includes('Crew 3'), `Imposter Mech: ${im.type}, ${im.kw}`);
  // Dramatic Reversal
  await reset(); const a1 = N('Rock', 'Artifact'), l1 = N('Island', 'Basic Land — Island'); a1.tap = l1.tap = true; S().bf.push(a1, l1); ev('commit()');
  await cast(C('Dramatic Reversal', opt));
  check(!a1.tap && l1.tap, 'Dramatic Reversal: Artefakt enttappt, Land nicht');
  // Hidden Strings + Cipher
  await reset(); ev('BOT.bf = [newCard({n:"Bear", type:"Creature — Bear", pw:2, tg:2})]; botChanged()'); await wait(20);
  const myc = N('Ninja', 'Creature — Ninja', '', {pw:2, tg:2}); const rk = N('Rock', 'Artifact'); rk.tap = true; S().bf.push(myc, rk); ev('commit()');
  const hs = C('Hidden Strings', opt); await cast(hs);
  await clickCard('Rock'); await wait(40); await click('Enttappen'); await wait(40);
  await clickCard('Bear'); await wait(40); await click('Tappen'); await wait(60);
  console.log('   Dialog:', title());
  await clickCard('Ninja'); await wait(60);
  check(!rk.tap && ev('BOT.bf[0].tap') && S().ex.includes(hs) && myc.cipher, 'Hidden Strings: Rock enttappt, Bär der KI getappt, auf Ninja verschlüsselt');
  rk.tap = true; w.__n = myc; ev('abilEvent({kind:"combatDamage", c:window.__n, pid:"bot", much:2, first:true}, [window.__n])'); await wait(60);
  await click('Ja'); await wait(40); await clickCard('Rock'); await wait(40); await click('Enttappen'); await wait(40); await click('Kein'); await wait(40);
  check(!rk.tap, 'Cipher: Kampfschaden → Kopie gewirkt, Rock wieder enttappt');
  // Mirage Mirror
  await reset(); const mir = C('Mirage Mirror'); const mys = N('Elvish Mystic', 'Creature — Elf Druid', '{T}: Add {G}.', {pw:1, tg:1}); S().bf.push(mir, mys); ev('commit()');
  ev('runSteps')(ev('parseSteps')(ev('parseAbilities')(mir)[0].text, mir), mir); await wait(60);
  await clickCard('Elvish Mystic'); await wait(60);
  check(mir.n === 'Elvish Mystic' && ev('isCreature')(mir), 'Mirage Mirror wird Elvish Mystic');
  ev('setTurn({active:"bot", n:50, starter:me.id, phase:0})'); await wait(30);
  check(mir.n === 'Mirage Mirror', 'am Zugende wieder Mirage Mirror');
  ev('setTurn({active:me.id, n:51, starter:me.id, phase:2})'); await wait(60); await drain();
  // Transmute Artifact
  await reset(); const sr = N('Sol Ring', 'Artifact', '', {cmc:1}); S().bf.push(sr); lib(N('Mox', 'Artifact', '', {cmc:0}), N('Big Art', 'Artifact', '', {cmc:4}), N('Island', 'Basic Land — Island')); ev('commit()');
  await cast(C('Transmute Artifact', opt)); await clickCard('Sol Ring'); await wait(40); await clickCard('Big Art'); await wait(40);
  console.log('   Dialog:', title()); await click('Ja'); await wait(60);
  check(S().gy.includes(sr) && S().bf.some(c => c.n === 'Big Art'), 'Transmute Artifact: Sol Ring geopfert, Big Art bezahlt und im Spiel');
  // Transmute (Dizzy Spell)
  await reset(); lib(N('One', 'Instant', '', {cmc:1}), N('Two', 'Instant', '', {cmc:2}));
  const dz = C('Dizzy Spell'); S().hand.push(dz); ev('commit()');
  const tm = ev('cardMenu')(dz, 'hand').find(i => /Transmute/.test(i.l || '')); check(!!tm, 'Dizzy Spell: Transmute im Handmenü');
  if(tm) tm.f(); await wait(60); console.log('   Dialog:', title(), '|', [...d.querySelectorAll('#modalBox .card')].map(e => e.textContent.slice(0, 8)).join(','));
  await clickCard('One'); await wait(60);
  check(S().hand.some(c => c.n === 'One') && S().gy.includes(dz), 'Transmute: Karte mit Manawert 1 gefunden');
  // Endurance
  await reset(); ev('BOT.gy = [newCard({n:"Dead", type:"Creature"})]; BOT.library = []; botChanged()');
  const en = C('Endurance', {pw:3, tg:4}); S().hand.push(en); ev('commit()'); await ev('play')(en.u); await wait(80); await kiBtn();
  check(ev('BOT.gy.length') === 0 && ev('BOT.library.length') === 1, 'Endurance: Friedhof der KI unter die Bibliothek');
  // Flash Photography
  await reset(); const sb = N('Sylvan Safekeeper', 'Creature — Human Wizard', 'Sacrifice a land: ...', {pw:0, tg:1}); S().bf.push(sb); ev('commit()');
  await cast(C('Flash Photography', opt)); await clickCard('Sylvan Safekeeper'); await wait(60);
  check(S().bf.filter(c => c.n === 'Sylvan Safekeeper' && c.tok).length === 1, 'Flash Photography: Token-Kopie');
  // Gilded Drake
  await reset(); ev('BOT.bf = [newCard({n:"Big Dino", type:"Creature — Dinosaur", pw:6, tg:6})]; botChanged()'); await wait(20);
  const gd = C('Gilded Drake', {pw:3, tg:3}); S().hand.push(gd); ev('commit()'); await ev('play')(gd.u); await wait(80);
  await clickCard('Big Dino'); await wait(150);
  check(S().bf.some(c => c.n === 'Big Dino' && c.ow) && ev('BOT.bf.some(c => c.n === "Gilded Drake")') && !S().bf.includes(gd), 'Gilded Drake: Tausch mit dem Dino der KI');
  await reset(); ev('BOT.bf = []; botChanged()');
  const gd2 = C('Gilded Drake', {pw:3, tg:3}); S().hand.push(gd2); ev('commit()'); await ev('play')(gd2.u); await wait(80); await click('Kein Ziel'); await wait(60);
  check(S().gy.includes(gd2), 'ohne Tausch: geopfert');
  // Kinnan
  await reset(); const kin = C('Kinnan, Bonder Prodigy', {pw:2, tg:2}); const sol = N('Sol Ring', 'Artifact', '{T}: Add {C}{C}.'); const isl = N('Island', 'Basic Land — Island', '({T}: Add {U}.)');
  S().bf.push(kin, sol, isl); ev('commit()');
  const mo = ev('cardMenu')(sol, 'bf').find(i => /Tapp|Mana/.test(i.h || '') ); if(mo) await mo.f(); else ev('tapForMana')(sol, ev('manaChoices')(sol)[0]); await wait(40);
  const im2 = ev('cardMenu')(isl, 'bf').find(i => /Tapp|Mana/.test(i.h || '')); if(im2) await im2.f(); else await ev('tapForMana')(isl, ev('manaChoices')(isl)[0]); await wait(40);
  check(S().pool.C === 3 && S().pool.U === 1, `Kinnan: Sol Ring gibt 3, Insel 1 (${ev('poolStr(S.pool)')})`);
  // Steal Enchantment
  await reset(); ev('BOT.bf = [newCard({n:"Rhystic Study", type:"Enchantment", cmc:3})]; botChanged()'); await wait(20);
  const st = C('Steal Enchantment'); S().hand.push(st); ev('commit()'); ev('moveCard')(st.u, 'bf'); await wait(80);
  await clickCard('Rhystic Study'); await wait(120);
  check(S().bf.some(c => c.n === 'Rhystic Study' && c.ow) && !ev('BOT.bf.length'), 'Steal Enchantment: Rhystic Study gehört jetzt dir');
  ev('moveCard')(st.u, 'gy'); await wait(80);
  check(!S().bf.some(c => c.n === 'Rhystic Study') && ev('BOT.bf.some(c => c.n === "Rhystic Study")'), 'Aura weg → Rhystic Study zurück zur KI');
  // Thrasios
  await reset(); lib(N('Forest', 'Basic Land — Forest'), N('Spell', 'Instant'));
  const th = C('Thrasios, Triton Hero', {pw:1, tg:3}); S().bf.push(th); ev('commit()');
  ev('runSteps(parseSteps(parseAbilities(S.bf[0])[0].text, S.bf[0]), S.bf[0])'); await wait(60); await click('Fertig'); await wait(60);
  check(S().bf.some(c => c.n === 'Forest' && c.tap) && S().library[0].n === 'Spell', 'Thrasios: Land getappt ins Spiel');
  ev('runSteps(parseSteps(parseAbilities(S.bf[0])[0].text, S.bf[0]), S.bf[0])'); await wait(60); await click('Fertig'); await wait(60);
  check(S().hand.some(c => c.n === 'Spell'), 'Thrasios: sonst Karte gezogen');
  // Wan Shi Tong
  await reset(); lib(...Array(5).fill(0).map((_, i) => N('C' + i, 'Instant')));
  const ws = C('Wan Shi Tong, Librarian', {pw:1, tg:1}); ws.lastX = 5; S().hand.push(ws); ev('commit()'); ev('moveCard')(ws.u, 'bf'); await wait(100);
  check(ws.c === 5 && S().hand.length === 2, `Wan Shi Tong X=5: 5 Marken, 2 Karten (${ws.c}/${S().hand.length})`);
  // Twincast, Sudden Substitution (Stapel)
  await reset(); lib(N('L1', 'Instant'), N('L2', 'Instant'));
  ev('net.role = "host"; net.order = [me.id]; net.players = {}; net.players[me.id] = {name:"Lukas"}');
  const mk = (id, card, extra) => Object.assign({id, u:card ? card.u : 'x' + id, n: card ? card.n : id, type: card ? card.type : 'Instant', o: card ? card.o : '', owner: ev('me.id'), by:'Lukas', passes:[], countered:false, dest:'gy', target:null, targets:[]}, extra || {});
  const tw = C('Twincast'); S().st.push(tw); ev('commit()');
  w.__st = [mk('a', N('Divination', 'Sorcery', 'Draw two cards.'), {owner:'x', u:'zz'}), mk('b', tw, {target:'a'})]; ev('STACK = window.__st; stackResolveTop()'); await wait(100);
  check(S().hand.length === 2 && !ev('STACK[0].countered'), 'Twincast: Kopie von Divination zieht 2 für dich, Original bleibt');
  ev('STACK = []; net.role = "solo"');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
