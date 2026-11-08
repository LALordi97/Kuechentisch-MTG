const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('report28_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  const bf = (...c) => { S().bf.push(...c); ev('commit()'); };
  const botBf = arr => { ev('BOT.bf = []'); arr.forEach(x => { w.__x = x; ev('BOT.bf.push(newCard(window.__x))'); }); ev('botChanged()'); };
  const oppBf = arr => ev(`others.bot = others.bot || {}; others.bot.bf = ${JSON.stringify(arr)}`);
  const mana = () => ev('S.pool.C = 12; S.pool.W = 5; S.pool.U = 5; S.pool.B = 5; S.pool.R = 5; S.pool.G = 5; commit()');
  const acts = c => ev('parseAbilities')(c).filter(a => a.kind === 'act');
  const enter = async (c, ms = 150) => { S().hand.push(c); ev('commit()'); ev('moveCard')(c.u, 'bf'); await wait(ms); };
  const kw = (c, k) => ev('kwHas')(c, k);
  const pickOpp = async () => { await wait(60); if(/Gegner|Spieler/i.test(title())) { if(!(await clickCard('KI'))) await click('KI'); } await wait(150); };
  // Sperren
  await reset(); bf(C('Cursed Totem')); const elf = N('Elf', 'Creature — Elf', '{T}: Add {G}.', {pw:1, tg:1}); bf(elf);
  check(!(ev('manaChoices')(elf) || []).length, 'Cursed Totem: Kreaturen ohne aktivierte Fähigkeiten');
  await reset(); bf(C('Collector Ouphe', {pw:2, tg:2})); const ring = N('Ring', 'Artifact', '{T}: Add {C}{C}.'); bf(ring); check(!(ev('manaChoices')(ring) || []).length, 'Collector Ouphe: Artefakte gesperrt');
  // Soulless Jailer
  await reset(); bf(C('Soulless Jailer', {pw:0, tg:4})); const dead = N('Tot', 'Creature', '', {pw:1, tg:1}); S().gy.push(dead); ev('commit()'); ev('moveCard')(dead.u, 'bf'); await wait(40);
  check(S().gy.includes(dead), 'Soulless Jailer: nichts aus dem Friedhof ins Spiel');
  // Spelunking / Horizon Explorer
  await reset(); bf(C('Horizon Explorer', {pw:2, tg:4})); const tl = N('Tapland', 'Land', 'This land enters tapped.\n{T}: Add {G}.'); await enter(tl); check(!tl.tap, 'Horizon Explorer: Länder kommen ungetappt');
  // Seedborn Muse
  await reset(); bf(C('Seedborn Muse', {pw:2, tg:4})); const sl = N('Land', 'Land', ''); bf(sl); sl.tap = true; ev('remindTriggers("upkeep", false)'); await wait(40); check(!sl.tap, 'Seedborn Muse: enttappt im fremden Zug');
  // Nyxbloom Ancient
  await reset(); bf(C('Nyxbloom Ancient', {pw:5, tg:5})); const fo = N('Forest', 'Basic Land — Forest', '{T}: Add {G}.'); bf(fo);
  check((ev('manaChoices')(fo) || []).some(o => (o.add || []).length === 3), 'Nyxbloom: dreifaches Mana');
  // Angrath's Marauders
  await reset(); bf(C("Angrath's Marauders", {pw:4, tg:4})); ev('BOT.life = 20'); ev('hitOpponent')('bot', {kind:'damage', amount:3, src:'Bolt'}); await wait(60); check(ev('BOT.life') === 14, "Angrath's Marauders: doppelter Schaden");
  // Notion Thief gegen die KI
  await reset(); bf(C('Notion Thief', {pw:3, tg:1})); lib(N('a', 'Instant'), N('b', 'Instant')); ev('BOT.library = [newCard({n:"x", type:"Instant"}), newCard({n:"y", type:"Instant"})]; BOT.hand = []; TURN.active = me.id');
  ev('botDraw(1)'); check(S().hand.length === 1 && ev('BOT.hand.length') === 0, 'Notion Thief: Ziehen der KI ausserhalb ihres Ziehschritts geht an dich'); ev('TURN.active = me.id');
  // Ashaya, Lumra
  await reset(); const ash = C('Ashaya, Soul of the Wild'); bf(ash); for(let i = 0; i < 3; i++) bf(N('L' + i, 'Land', ''));
  check(ev('power')(ash) === 3, 'Ashaya: Stärke = Zahl der Länder'); check((ev('manaChoices')(ash) || []).some(o => (o.add || []).includes('G')), 'Ashaya: Kreaturen sind Wälder');
  // Ixidron
  await reset(); const bb = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); bf(bb); botBf([{n:'Ork', type:'Creature — Orc', pw:3, tg:3}]); const ix = C('Ixidron'); await enter(ix, 200);
  check(bb.fd && ev('BOT.bf[0].fd') && ev('power')(ix) >= 1, 'Ixidron: andere Kreaturen umgedreht, Stärke = verdeckte Kreaturen');
  // Elvish Reclaimer, Stonework Packbeast, Razorkin
  await reset(); const er = C('Elvish Reclaimer', {pw:1, tg:2}); bf(er); S().gy.push(N('a', 'Land'), N('b', 'Land'), N('c', 'Land')); ev('commit()'); check(ev('power')(er) === 3, 'Elvish Reclaimer: +2/+2 mit drei Ländern im Friedhof');
  const pb = C('Stonework Packbeast', {pw:2, tg:1}); bf(pb); check(ev('typeMatch')(pb, 'Wizard') && ev('partySize()') >= 1, 'Packbeast ist auch Wizard');
  const rz = C('Razorkin Needlehead', {pw:2, tg:2}); bf(rz); check(kw(rz, 'first strike'), 'Razorkin: First strike im eigenen Zug');
  // Greymond
  await reset(); const gm = C('Greymond, Avacyn\'s Stalwart', {pw:3, tg:4}); gm.chosenKw = ['first strike', 'lifelink']; bf(gm); const hs = [0, 1, 2].map(i => N('H' + i, 'Creature — Human', '', {pw:1, tg:1})); bf(...hs);
  check(kw(hs[0], 'lifelink') && ev('power')(hs[0]) === 3, 'Greymond: Menschen mit gewählten Fähigkeiten und +2/+2');
  // Azure Beastbinder, Gingerbrute
  await reset(); const ab = C('Azure Beastbinder', {pw:1, tg:3}); check(!ev('canBlock')(N('Gross', 'Creature', '', {pw:3, tg:3}), ab) && ev('canBlock')(N('Klein', 'Creature', '', {pw:1, tg:1}), ab), 'Beastbinder: nicht von Stärke 2+ blockbar');
  const gb = C('Gingerbrute', {pw:1, tg:1}); bf(gb); mana(); ev('activateAbility')(gb, acts(gb)[0]); await wait(80); check(!ev('canBlock')(N('Lahm', 'Creature', '', {pw:1, tg:1}), gb), 'Gingerbrute: nur von Kreaturen mit Eile blockbar');
  // Tax Collector
  await reset(); const tc = C('Tax Collector', {pw:2, tg:2}); await enter(tc, 120); await click('Tax'); await click('Ausführen'); await wait(100); check(ev('S.taxNext') === true, 'Tax Collector: Steuer bis zum nächsten Zug');
  // Geier Reach Sanitarium
  await reset(); const gr = C('Geier Reach Sanitarium'); bf(gr); lib(N('k1', 'Instant')); ev('BOT.library = [newCard({n:"z", type:"Instant"})]; BOT.hand = [newCard({n:"h", type:"Instant"})]'); mana();
  ev('activateAbility')(gr, acts(gr)[1] || acts(gr)[0]); await wait(120); await clickCard('k1'); await wait(150);
  check(S().gy.some(c => c.n === 'k1') && ev('BOT.gy.length') === 1, 'Geier Reach: jeder zieht und wirft ab');
  // Burning Inquiry
  await reset(); lib(N('a', 'Instant'), N('b', 'Instant'), N('c', 'Instant')); ev('BOT.library = [1,2,3].map(i => newCard({n:"q" + i, type:"Instant"})); BOT.hand = []; BOT.gy = []');
  await cast(C('Burning Inquiry', {mc:''})); await wait(200); await drain(); check(S().hand.length === 0 && S().gy.filter(c => /^[abc]$/.test(c.n)).length === 3 && ev('BOT.gy.length') === 3, 'Burning Inquiry: drei ziehen, drei zufällig abwerfen');
  // Scapeshift
  await reset(); bf(N('L1', 'Land', ''), N('L2', 'Land', '')); lib(N('Valakut', 'Land', ''), N('Wald', 'Basic Land — Forest', ''), N('X', 'Instant'));
  await cast(C('Scapeshift', {mc:''})); await wait(80); await clickCard('L1'); await clickCard('L2'); await click('Fertig'); await wait(100); await clickCard('Valakut'); await clickCard('Wald'); await click('Fertig'); await wait(150); await drain();
  check(S().bf.filter(c => /Valakut|Wald/.test(c.n) && c.tap).length === 2 && S().gy.length >= 2, 'Scapeshift: zwei Länder geopfert, zwei getappt geholt');
  // Simic Growth Chamber
  await reset(); bf(N('Insel', 'Basic Land — Island', '')); const sg = C('Simic Growth Chamber'); await enter(sg, 120); await clickCard('Insel'); await wait(80);
  check(S().hand.some(c => c.n === 'Insel') && sg.tap, 'Simic Growth Chamber: Land zurück auf die Hand');
  // Talion
  await reset(); const ta = C('Talion, the Kindly Lord', {pw:3, tg:4}); ta.chosen = '2'; bf(ta); lib(N('z', 'Instant')); ev('BOT.life = 20');
  ev('abilEvent({kind:"oppCast", c:newCard({n:"Zwei", type:"Instant", cmc:2}), pid:"bot", opp:true})'); await wait(150);
  console.log('   LOG:', [...d.querySelectorAll('#log > div')].slice(-4).map(x => x.textContent).join(' || '), '| T:', title(), btns().join('|')); check(ev('BOT.life') === 18 && S().hand.length === 1, 'Talion: Gegner verliert 2, du ziehst');
  // Ledger Shredder
  await reset(); const ls = C('Ledger Shredder', {pw:1, tg:3}); bf(ls); lib(N('d', 'Instant'));
  ev('abilEvent({kind:"oppCast", c:newCard({n:"A", type:"Instant"}), pid:"bot", opp:true})'); ev('abilEvent({kind:"oppCast", c:newCard({n:"B", type:"Instant"}), pid:"bot", opp:true})'); await wait(150); await clickCard('d'); await wait(100);
  check(ls.c === 1, 'Ledger Shredder: zweiter Zauber eines Spielers → connive mit Marke');
  // Jin-Gitaxias
  await reset(); const jg = C('Jin-Gitaxias, Progress Tyrant', {pw:5, tg:5}); bf(jg); ev('BOT.life = 20');
  ev('abilEvent({kind:"cast", c:newCard({n:"Shock", type:"Instant", o:"Shock deals 2 damage to any target."})})'); await wait(150); await clickCard('KI') || await click('KI'); await wait(150);
  console.log('   LOG:', [...d.querySelectorAll('#log > div')].slice(-4).map(x => x.textContent).join(' || '), '| T:', title(), btns().join('|')); check(ev('BOT.life') === 18, 'Jin-Gitaxias: kopiert eigenen Spontanzauber');
  ev('abilEvent({kind:"cast", c:newCard({n:"Shock", type:"Instant", o:"Shock deals 2 damage to any target."})})'); await wait(150); await drain(); check(ev('BOT.life') === 18, 'nur einmal pro Zug');
  // Tiller Engine
  await reset(); bf(C('Tiller Engine', {pw:1, tg:3})); const tl2 = N('Tapland', 'Land', 'This land enters tapped.'); await enter(tl2, 120); await click('Untap'); await click('Ausführen'); await wait(100);
  check(!tl2.tap, 'Tiller Engine: Land enttappt');
  // Archdruid's Charm (Suche)
  await reset(); lib(N('Feld', 'Land', ''), N('Wesen', 'Creature', '', {pw:1, tg:1})); await cast(C("Archdruid's Charm", {mc:''})); await wait(80); await click('Search'); await click('Ausführen'); await wait(80); await clickCard('Feld'); await wait(150); await drain();
  check(S().bf.some(c => c.n === 'Feld' && c.tap), "Archdruid's Charm: Land getappt ins Spiel");
  // Fabled Passage
  await reset(); bf(N('A', 'Land', ''), N('B', 'Land', ''), N('C', 'Land', '')); const fp = C('Fabled Passage'); bf(fp); lib(N('Ebene', 'Basic Land — Plains', ''));
  ev('activateAbility')(fp, acts(fp)[0]); await wait(120); await clickCard('Ebene'); await wait(150); const eb = S().bf.find(c => c.n === 'Ebene');
  check(eb && !eb.tap, 'Fabled Passage: mit vier Ländern ungetappt');
  // Riptide Shapeshifter
  await reset(); const rs = C('Riptide Shapeshifter', {pw:3, tg:3}); bf(rs); S().deck = [{n:'Goblin', type:'Creature — Goblin'}]; lib(N('x', 'Instant'), N('Gob', 'Creature — Goblin', '', {pw:1, tg:1}), N('y', 'Instant')); mana();
  ev('activateAbility')(rs, acts(rs)[0]); await wait(120); await click('Goblin'); await wait(150); console.log('   LOG:', [...d.querySelectorAll('#log > div')].slice(-4).map(x => x.textContent).join(' || '), '| T:', title(), btns().join('|')); check(S().bf.some(c => c.n === 'Gob'), 'Riptide Shapeshifter: Goblin ins Spiel');
  // Nezahal
  await reset(); const nz = C('Nezahal, Primal Tide', {pw:7, tg:7}); bf(nz); S().hand.push(N('a', 'Instant'), N('b', 'Instant'), N('c', 'Instant')); ev('commit()');
  ev('runAbility')(nz, acts(nz)[0], {}); await wait(80); check(S().ex.includes(nz), 'Nezahal: verbannt'); ev('runDelayed("end", true)'); await wait(60); check(S().bf.includes(nz) && nz.tap, 'kommt am Zugende getappt zurück');
  // Ob Nixilis Captive Kingpin, Unstable Amulet
  await reset(); const ob = C('Ob Nixilis, Captive Kingpin', {pw:4, tg:3}); bf(ob); lib(N('Top', 'Instant'));
  ev('runAbility')(ob, ev('parseAbilities')(ob).find(a => a.kind === 'trig'), {}); await wait(80); check(ob.c === 1 && S().ex.some(c => c.n === 'Top' && c.castKey === 'myNextEnd'), 'Ob Nixilis: Marke und Impuls-Karte');
  await reset(); const am = C('Unstable Amulet'); bf(am); lib(N('E1', 'Instant'), N('E2', 'Instant'));
  ev('runAbility')(am, acts(am)[0], {}); await wait(60); ev('runAbility')(am, acts(am)[0], {}); await wait(60);
  check(!S().ex.find(c => c.n === 'E1').castKey && S().ex.find(c => c.n === 'E2').castKey === 'perm', 'Unstable Amulet: nur die neueste Karte spielbar');
  // Black Mage's Rod: Job select und geliehener Auslöser
  await reset(); const rod = C("Black Mage's Rod"); await enter(rod, 200); const hero = S().bf.find(c => c.tok && /Hero/.test(c.n + c.type));
  check(hero && rod.eq === hero.u && ev('power')(hero) === 2 && ev('typeMatch')(hero, 'Wizard'), "Black Mage's Rod: Hero-Token mit +1/+0, ist Wizard");
  ev('BOT.life = 20'); ev('abilEvent({kind:"cast", c:newCard({n:"Opt", type:"Instant"})})'); await wait(150); check(ev('BOT.life') === 19, 'Equipped creature: 1 Schaden bei Nicht-Kreatur-Zauber');
  // Amphibian Downpour (eigene Kreatur)
  await reset(); const big = N('Drache', 'Creature — Dragon', 'Flying', {pw:5, tg:5, kw:['Flying']}); bf(big); const ad = C('Amphibian Downpour'); await enter(ad, 120); await clickCard('Drache'); await wait(120);
  check(ev('power')(big) === 1 && !kw(big, 'flying') && /Frog/.test(big.type), 'Amphibian Downpour: 1/1-Frosch ohne Fähigkeiten');
  ev('moveCard')(ad.u, 'gy'); check(ev('power')(big) === 5, 'Aura weg: wieder normal');
  // Retrace (Six), Dredge, Foretell, Warp
  await reset(); bf(C('Six', {pw:2, tg:4})); const sx = N('Golem', 'Artifact Creature', '', {pw:2, tg:2, mc:''}); S().gy.push(sx); S().hand.push(N('Ödland', 'Land', '')); ev('commit()');
  const ri = ev('cardMenu')(sx, 'gy').find(i => /Retrace/.test(i.l || '')); check(!!ri, 'Six: Retrace im Friedhof-Menü'); ri.f(); await wait(100); await clickCard('Ödland'); await wait(150); check(S().bf.includes(sx) && S().gy.some(c => c.n === 'Ödland'), 'Retrace: Land abgeworfen, Karte gewirkt');
  await reset(); const lfl = C('Life from the Loam'); S().gy.push(lfl); lib(N('a', 'Land'), N('b', 'Land'), N('c', 'Land'), N('d', 'Instant')); ev('commit()');
  ev('cardMenu')(lfl, 'gy').find(i => /Dredge/.test(i.l || '')).f(); ev('draw(1)'); check(S().hand.includes(lfl) && S().hand.length === 1 && S().library.length === 1, 'Dredge: drei gemahlen, Karte zurück, Ziehung entfällt');
  await reset(); const mr = C('Mystic Reflection', {mc:'{1}{U}'}); S().hand.push(mr); ev('commit()'); ev('S.pool.C = 2; commit()'); ev('cardMenu')(mr, 'hand').find(i => /Vorhersagen/.test(i.l || '')).f(); await wait(100);
  check(S().ex.includes(mr) && mr.fd && mr.foretoldKey, 'Foretell: verdeckt ins Exil'); mr.foretoldKey = 'alt'; check(ev('cardMenu')(mr, 'ex').some(i => /Vorhergesagt/.test(i.l || '')), 'später für die Foretell-Kosten wirkbar');
  // Devour
  await reset(); bf(N('A', 'Land', ''), N('B', 'Land', '')); const fw = C('Famished Worldsire', {pw:0, tg:0}); await enter(fw, 150); await clickCard('A'); await clickCard('B'); await click('Fertig'); await wait(150); await drain();
  check(fw.c === 6, 'Famished Worldsire: Devour land 3 → 6 Marken');
  // Katara
  await reset(); bf(C('Katara, the Fearless', {pw:3, tg:3})); const ally = N('Freund', 'Creature — Human Ally', 'When this creature enters, draw a card.', {pw:1, tg:1}); lib(N('a', 'Instant'), N('b', 'Instant')); await enter(ally, 200);
  check(S().hand.length === 2, 'Katara: Auslöser von Verbündeten doppelt');
  // Lena
  await reset(); bf(N('A', 'Creature', '', {pw:1, tg:1}), N('B', 'Creature', '', {pw:1, tg:1})); const le = C('Lena, Selfless Champion', {pw:3, tg:3}); await enter(le, 200);
  check(S().bf.filter(c => c.tok && /Soldier/.test(c.n + c.type)).length === 3, 'Lena: ein Soldat pro Kreatur (keine Token)');
  // Trouble in Pairs
  await reset(); bf(C('Trouble in Pairs')); lib(N('t', 'Instant')); ev('abilEvent({kind:"attackedYou", n:2, pid:"bot", opp:true})'); await wait(150); check(S().hand.length === 1, 'Trouble in Pairs: Angriff mit zwei Kreaturen → ziehen');
  // Preston, Kona Bedingungen
  check(ev('interveningIf')("If it wasn't cast, draw a card.", {}, {ev:{c:{wasCast:true}}}).ok === false, 'Preston: «it wasn\'t cast» erkannt');
  check(ev('interveningIf')("If Kona is tapped, draw a card.", {n:"Kona, Rescue Beastie", tap:true}).ok === true, 'Kona: «is tapped» erkannt');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
