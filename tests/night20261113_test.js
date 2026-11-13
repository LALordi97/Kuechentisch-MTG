const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('night20261113_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  const put = (...c) => { S().bf.push(...c); ev('commit()'); };
  const trig = c => ev("parseAbilities")(c).find(a => a.kind === "trig");
  const spell = c => ev("parseAbilities")(c).find(a => a.kind === "spell");
  const acts = c => ev("parseAbilities")(c).filter(a => a.kind === "act");
  const hexAb = c => ev("parseAbilities")(c).filter(a => a.kind === "spell").pop();
  const shown = () => [...d.querySelectorAll('#modalBox .card')].map(e => e.textContent).join('|');
  // Persist: nur nicht legendäre Kreatur, kommt mit -1/-1-Marke
  await reset(); { const leg = N('Held', 'Legendary Creature — Human', '', {pw:3, tg:3}), el = N('Elf', 'Creature — Elf', '', {pw:2, tg:2}); S().gy.push(leg, el, N('Spruch', 'Instant', ''));
    const pe = C('Persist'); ev('runAbility')(pe, spell(pe), {}); await wait(120); const sh = shown();
    check(/Elf/.test(sh) && !/Held/.test(sh) && !/Spruch/.test(sh), `Persist: nur nicht legendäre Kreaturen (${sh})`);
    await clickCard('Elf'); await wait(100); await drain();
    check(S().bf.includes(el) && el.c === -1, `Persist: Elf im Spiel mit -1/-1-Marke (${el.c})`); }
  // Requiting Hex: Blight als freiwillige Zusatzkosten, dann 2 Leben
  await reset(); { const be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(be); const hx = C('Requiting Hex'); S().hand.push(hx); ev('commit()');
    const pr = ev('castCosts')(hx); await wait(100); check(/Bär/.test(shown()), `Requiting Hex: Blight-Auswahl (${shown()})`); await clickCard('Bär'); await wait(60); await pr;
    check(be.c === -1 && hx.blighted, `Requiting Hex: Blight 1 bezahlt (${be.c})`);
    ev('BOT.bf.push(newCard({n:"Klein", type:"Creature — Elf", o:"", pw:1, tg:1, cmc:1})); botChanged()'); const l0 = S().life;
    ev('runAbility')(hx, hexAb(hx), {}); await wait(100); await clickCard('Klein'); await wait(150); await drain();
    check(S().life === l0 + 2, `Requiting Hex: +2 Leben mit Blight (${S().life - l0})`); }
  await reset(); { const hx = C('Requiting Hex'); hx.blighted = false; ev('BOT.bf.push(newCard({n:"Klein", type:"Creature — Elf", o:"", pw:1, tg:1, cmc:1})); botChanged()'); const l0 = S().life;
    ev('runAbility')(hx, hexAb(hx), {}); await wait(100); await clickCard('Klein'); await wait(150); await drain();
    check(S().life === l0 && !ev('BOT.bf.some(c => c.n === "Klein")'), `Requiting Hex: ohne Blight kein Leben, Kreatur zerstört (${S().life - l0})`); }
  await reset(); { const hx = C('Requiting Hex'); hx.blighted = true; ev('BOT.bf.push(newCard({n:"Klein", type:"Creature — Elf", o:"", pw:1, tg:1, cmc:1})); botChanged()'); const l0 = S().life;
    const pr = ev('abilSpellResolve')(hx); await wait(120); await clickCard('Klein'); await wait(150); await drain(); await pr;
    check(S().life === l0 + 2 && !ev('BOT.bf.some(c => c.n === "Klein")'), `Requiting Hex beim Auflösen: zerstört und +2 Leben (${S().life - l0})`); }
  // Roiling Canopy: Bedingung «at least five other Forests»
  for(const k of [4, 5]){ await reset(); const rc = C('Roiling Canopy'); put(rc); const fs = Array(k + 1).fill(0).map(() => N('Forest', 'Basic Land — Forest', '')); put(...fs);
    const r = ev('interveningIf')(trig(rc).text, rc, {ev:{c:fs[k]}}); check(r.ok === (k >= 5), `Roiling Canopy: ${k} andere Wälder → ${r.ok}`); }
  // Sanctifier en-Vec: schwarze/rote Karten ins Exil
  await reset(); { put(C('Sanctifier en-Vec', {pw:2, tg:2})); const b = N('Schwarz', 'Instant', '', {mc:'{B}'}), g = N('Grün', 'Instant', '', {mc:'{G}'}), r = N('RotKrea', 'Creature — Goblin', '', {mc:'{1}{R}', pw:1, tg:1});
    S().hand.push(b, g); put(r); ev('moveCard')(b.u, 'gy'); ev('moveCard')(g.u, 'gy'); ev('moveCard')(r.u, 'gy'); await wait(80); await drain();
    check(S().ex.includes(b) && S().ex.includes(r) && S().gy.includes(g), `Sanctifier: schwarz/rot ins Exil, grün in den Friedhof (ex ${S().ex.map(c => c.n)}, gy ${S().gy.map(c => c.n)})`);
    ev('BOT.bf.push(newCard({n:"KiRot", type:"Creature — Goblin", o:"", mc:"{R}", pw:1, tg:1})); botChanged()'); ev('botToZone(BOT.bf.find(c => c.n === "KiRot"), "gy")');
    check(ev('BOT.ex.some(c => c.n === "KiRot") && !BOT.gy.some(c => c.n === "KiRot")'), 'Sanctifier: rote Karte der KI ins Exil'); }
  // Scion of Draco: Schlüsselwörter nach Farbe
  await reset(); { const w1 = N('Weiss', 'Creature — Human', '', {mc:'{W}', pw:1, tg:1}), g1 = N('Grün', 'Creature — Elf', '', {mc:'{G}', pw:1, tg:1}), u1 = N('Blau', 'Creature — Merfolk', '', {mc:'{U}', pw:1, tg:1}); put(w1, g1, u1);
    check(!ev('kwHas')(w1, 'vigilance'), 'Scion fehlt: keine Wachsamkeit');
    put(C('Scion of Draco', {pw:4, tg:4}));
    check(ev('kwHas')(w1, 'vigilance') && !ev('kwHas')(w1, 'trample') && ev('kwHas')(g1, 'trample') && ev('kwHas')(u1, 'hexproof') && !ev('kwHas')(u1, 'vigilance'), 'Scion: Weiss Wachsamkeit, Grün Trampelschaden, Blau Fluchsicherheit'); }
  // Seasoned Pyromancer: für jede abgeworfene Nichtland-Karte ein Elementar
  await reset(); { const sp = C('Seasoned Pyromancer', {pw:2, tg:2}); put(sp); const la = N('Mountain', 'Basic Land — Mountain', ''), bo = N('Bolt', 'Instant', '', {mc:'{R}'}); S().hand.push(la, bo); lib(N('A', 'Instant'), N('B', 'Instant'), N('C', 'Instant'));
    ev('runAbility')(sp, trig(sp), {}); await wait(120); await clickCard('Mountain'); await clickCard('Bolt'); await click('Fertig'); await wait(150); await drain();
    const toks = S().bf.filter(c => c.tok && /Elemental/.test(c.type || ''));
    check(toks.length === 1 && S().hand.length === 2 && S().gy.includes(la), `Pyromancer: ein Elementar für eine Nichtland-Karte (${toks.length}, Hand ${S().hand.length})`); }
  await reset(); { const sp = C('Seasoned Pyromancer', {pw:2, tg:2}); put(sp); lib(N('A', 'Instant'), N('B', 'Instant'));
    ev('runAbility')(sp, trig(sp), {}); await wait(150); await drain();
    check(!S().bf.some(c => c.tok) && S().hand.length === 2, `Pyromancer mit leerer Hand: zwei Karten, keine Token (${S().hand.length})`); }
  // Seasoned Cryomancer: so viele Kreaturen tappen und betäuben, wie Nichtland-Karten abgeworfen wurden
  await reset(); { const cr = C('Seasoned Cryomancer', {pw:3, tg:3}); put(cr); lib(N('Insel', 'Basic Land — Island', ''), N('Zauber', 'Sorcery', ''));
    ev('BOT.bf.push(newCard({n:"Riese", type:"Creature — Giant", o:"", pw:5, tg:5}), newCard({n:"Zwerg", type:"Creature — Dwarf", o:"", pw:1, tg:1})); botChanged()');
    ev('runAbility')(cr, trig(cr), {}); await wait(150); await clickCard('Insel'); await clickCard('Zauber'); await click('Fertig'); await wait(150);
    await clickCard('Riese'); await wait(150); const more = open() && /Kreatur tappen/.test(title());
    await drain(); await wait(80);
    const ri = ev('BOT.bf.find(c => c.n === "Riese")'), zw = ev('BOT.bf.find(c => c.n === "Zwerg")');
    check(ri.tap && ri.stun === 1 && !zw.tap && !more, `Cryomancer: ein Nichtland abgeworfen → Riese getappt und betäubt (${ri.tap}/${ri.stun}, weitere Wahl ${more})`); }
  // Shadowspear: gegnerische Karten verlieren Unzerstörbarkeit
  await reset(); { const ss = C('Shadowspear'); put(ss); ev('BOT.bf.push(newCard({n:"Panzer", type:"Creature — Golem", o:"Indestructible", kw:["Indestructible"], pw:3, tg:3})); botChanged()'); await wait(50);
    check(ev('kwHas(BOT.bf.find(c => c.n === "Panzer"), "indestructible")'), 'Shadowspear: vorher unzerstörbar');
    ev('runAbility')(ss, acts(ss)[0], {}); await wait(150); await drain();
    check(!ev('kwHas(BOT.bf.find(c => c.n === "Panzer"), "indestructible")'), 'Shadowspear: danach nicht mehr unzerstörbar'); }
  // Portent of Calamity: pro Kartentyp eine verbannen, bei vier gratis wirken, Rest der verbannten auf die Hand
  await reset(); { lib(N('Wald', 'Basic Land — Forest', ''), N('Ork', 'Creature — Orc', '', {pw:2, tg:2, mc:'{1}{R}'}), N('Blitz', 'Instant', 'You gain 3 life.', {mc:'{R}'}), N('Ding', 'Artifact', '', {mc:'{1}'}), N('Weg', 'Sorcery', '', {mc:'{B}'}), N('Unten', 'Instant', ''));
    const po = C('Portent of Calamity'); const l0 = S().life; ev('runAbility')(po, spell(po), {X:5}); await wait(150);
    for(const n of ['Ding', 'Ork', 'Blitz', 'Wald']){ await clickCard(n); await wait(80); }
    await wait(80); if(open() && /Sorcery/.test(title())) await click('Keine'); await wait(100);
    const offer = shown(); await clickCard('Blitz'); await wait(250); await drain();
    check(/Blitz/.test(offer) && !/Wald/.test(offer), `Portent: Gratis-Wahl ohne Land (${offer})`);
    check(S().life === l0 + 3, `Portent: Blitz gratis gewirkt (${S().life - l0})`);
    check(['Ding', 'Ork', 'Wald'].every(n => S().hand.some(c => c.n === n)) && S().gy.some(c => c.n === 'Weg') && S().library.length === 1, `Portent: Rest auf die Hand, Weg im Friedhof (Hand ${S().hand.map(c => c.n)}, gy ${S().gy.map(c => c.n)})`); }
  await reset(); { lib(N('Wald', 'Basic Land — Forest', ''), N('Blitz', 'Instant', 'You gain 3 life.'), N('Weg', 'Sorcery', ''));
    const po = C('Portent of Calamity'); ev('runAbility')(po, spell(po), {X:3}); await wait(150);
    await clickCard('Blitz'); await wait(80); await clickCard('Wald'); await wait(80); if(open()) await click('Keine'); await wait(150); await drain();
    check(S().hand.map(c => c.n).sort().join(',') === 'Blitz,Wald' && S().gy.some(c => c.n === 'Weg'), `Portent mit zwei: kein Gratiswirken, beide auf die Hand (${S().hand.map(c => c.n)})`); }
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
