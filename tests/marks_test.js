// Test der Spielermarken: Energie, Erfahrung, Strahlung
const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const C = (n, type, o, extra = {}) => ev('newCard')({n, type, o, img:null, ...extra});
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()'); ev('LOOK.autoAbil = false');
  const S = ev('S'); ev('LOOK.autoPay = false');
  const M = () => ev('marksOf()');
  const mc = ev('markClauses');
  // Erkennen
  const raptor = C('Amped Raptor', 'Creature — Dinosaur', 'First strike\nWhen this creature enters, you get {E}{E} (two energy counters). Then if you have fewer than two {E}, sacrifice it.', {mc:'{1}{R}', cmc:2, pw:2, tg:1});
  check(JSON.stringify(mc(raptor).map(x => [x.k, x.n, x.kind, x.clean])) === '[["E",2,"trig",true]]', `Amped Raptor erkannt: ${JSON.stringify(mc(raptor))}`);
  const meren = C('Meren of Clan Nel Toth', 'Legendary Creature — Human Shaman', 'Whenever another creature you control dies, you get an experience counter.\nAt the beginning of your end step, choose target creature card in your graveyard. If that card\'s mana value is less than or equal to the number of experience counters you have, return it to the battlefield. Otherwise, put it into your hand.', {mc:'{2}{B}{G}', cmc:4, pw:3, tg:4});
  check(mc(meren).length === 1 && mc(meren)[0].k === 'XP' && mc(meren)[0].n === 1, 'Meren erkannt (1 Erfahrung pro Tod)');
  const longtusk = C('Longtusk Cub', 'Creature — Cat', 'Whenever Longtusk Cub deals combat damage to a player, you get {E}{E}.\nPay {E}{E}: Put a +1/+1 counter on Longtusk Cub.', {mc:'{1}{G}', cmc:2, pw:2, tg:2});
  check(ev('energyCosts')(longtusk)[0].n === 2, 'Longtusk Cub: «Pay {E}{E}» als Kosten erkannt');
  // 1. Amped Raptor kommt ins Spiel
  S.hand.push(raptor); ev('commit()');
  await ev('play')(raptor.u); await wait(10);
  check(M().E === 2, `Amped Raptor ins Spiel: Energie ${M().E}`);
  check(/Energie/.test($('#myMarks').textContent) && /2/.test($('#myMarks').textContent), `Anzeige in der Kopfzeile: «${$('#myMarks').textContent.replace(/\s+/g, ' ').trim()}»`);
  // 2. Rückgängig
  const undo = $('#markUndo'); check(!!undo, 'Rückgängig-Knopf im Hinweis');
  undo.click(); await wait(5);
  check(M().E === 0, 'Rückgängig nimmt die Energie zurück');
  // 3. Aether Hub (Land, Name statt «this»)
  const hub = C('Aether Hub', 'Land', 'When Aether Hub enters, you get {E} (an energy counter).\n{T}: Add {C}.\n{T}, Pay {E}: Add one mana of any color.');
  S.hand.push(hub); ev('commit()'); await ev('play')(hub.u); await wait(10);
  check(M().E === 1, `Aether Hub: Energie ${M().E}`);
  // 4. Guide of Souls + Token
  const guide = C('Guide of Souls', 'Creature — Human Cleric', 'Whenever another creature you control enters, you gain 1 life and get {E} (an energy counter).\nWhenever you attack, you may pay {E}{E}{E} and exile a card from your graveyard. If you do, put two +1/+1 counters on target attacking creature.', {mc:'{W}', cmc:1, pw:1, tg:2});
  S.hand.push(guide); ev('commit()'); await ev('play')(guide.u); await wait(10);
  check(M().E === 1, 'Guide of Souls selbst löst nicht aus (another)');
  ev('TOKCACHE')['x'] = {n:'Soldier', type:'Token Creature — Soldier', pw:1, tg:1, img:null}; ev('createTokenFromId')('x', 'Soldier', 2); await wait(20);
  check(M().E === 3, `2 Tokens ins Spiel: Energie ${M().E}`);
  // 5. Meren: eigene Kreatur stirbt
  S.bf.push(meren); ev('commit()');
  const bear = C('Grizzly Bears', 'Creature — Bear', '', {mc:'{1}{G}', cmc:2, pw:2, tg:2});
  S.bf.push(bear); ev('commit()');
  check(M().XP === 0, 'Meren direkt aufs Feld gelegt: noch keine Erfahrung');
  ev('moveCard')(bear.u, 'gy'); await wait(5);
  check(M().XP === 1, `Bär stirbt: Erfahrung ${M().XP}`);
  const tok = S.bf.find(c => c.tok); ev('moveCard')(tok.u, 'gy'); await wait(5);
  check(M().XP === 2, `Token stirbt: Erfahrung ${M().XP}`);
  ev('moveCard')(S.bf.find(c => c.n === 'Aether Hub').u, 'gy'); await wait(5);
  check(M().XP === 2, 'Land in den Friedhof: keine Erfahrung (keine Kreatur)');
  ev('moveCard')(meren.u, 'gy'); await wait(5);
  check(M().XP === 2, 'Meren selbst stirbt: keine Erfahrung (another)');
  ev('moveCard')(S.bf.find(c => c.n === 'Guide of Souls').u, 'hand'); await wait(5);
  check(M().XP === 2, 'Kreatur auf die Hand: keine Erfahrung');
  // 6. Galvanic Discharge: Energie bekommen und bezahlen
  ev('S.marks.E = 0');
  const gd = C('Galvanic Discharge', 'Instant', 'Choose target creature or planeswalker. You get {E}{E}{E} (three energy counters), then you may pay any amount of {E}. Galvanic Discharge deals that much damage to that permanent.', {mc:'{R}', cmc:1});
  S.hand.push(gd); ev('commit()');
  const pg = ev('castSpell')(gd.u); await wait(20);
  check(/Energie bezahlen/.test($('#modalBox').textContent), 'Galvanic Discharge: fragt, wie viel Energie bezahlt wird');
  check($('#askN').value === '3', `Vorschlag ist alles (${$('#askN').value})`);
  $('#askN').value = '2'; [...d.querySelectorAll('#modalBox button')].find(b => b.textContent === 'Weiter').click(); await pg; await wait(10);
  check(M().E === 1 && S.gy.includes(gd), `nach 3 bekommen und 2 bezahlt: Energie ${M().E}`);
  // 7. Mizzix: Zauber mit Manawert > Erfahrung
  ev('S.marks.XP = 0');
  const mizzix = C('Mizzix of the Izmagnus', 'Legendary Creature — Goblin Wizard', 'Whenever you cast an instant or sorcery spell with mana value greater than the number of experience counters you have, you get an experience counter.\nInstant and sorcery spells you cast cost {1} less to cast for each experience counter you have.', {mc:'{2}{U}{R}', cmc:4, pw:2, tg:2});
  S.bf.push(mizzix); ev('commit()');
  const opt = C('Opt', 'Instant', 'Scry 1. Draw a card.', {mc:'{U}', cmc:1});
  const opt2 = C('Opt', 'Instant', 'Scry 1. Draw a card.', {mc:'{U}', cmc:1});
  const fact = C('Fact or Fiction', 'Instant', 'Reveal the top five cards...', {mc:'{3}{U}', cmc:4});
  const bear2 = C('Grizzly Bears', 'Creature — Bear', '', {mc:'{1}{G}', cmc:2, pw:2, tg:2});
  S.hand.push(opt, opt2, fact, bear2); ev('commit()');
  await ev('castSpell')(opt.u); await wait(5);
  check(M().XP === 1, `Mizzix + Opt (MW 1 > 0): Erfahrung ${M().XP}`);
  await ev('castSpell')(opt2.u); await wait(5);
  check(M().XP === 1, 'zweites Opt (MW 1, nicht > 1): keine Erfahrung');
  await ev('castSpell')(fact.u); await wait(5);
  check(M().XP === 2, `Fact or Fiction (MW 4 > 1): Erfahrung ${M().XP}`);
  await ev('play')(bear2.u); await wait(5);
  check(M().XP === 2, 'Kreatur gewirkt: keine Erfahrung (nur Spontan/Hexerei)');
  // 8. Kalemne: Kreatur mit MW ≥ 5
  ev('S.marks.XP = 0');
  S.bf.push(C('Kalemne, Disciple of Iroas', 'Legendary Creature — Giant Soldier', 'Double strike, vigilance\nWhenever you cast a creature spell with mana value 5 or greater, you get an experience counter.', {mc:'{2}{R}{W}', cmc:4, pw:3, tg:3})); ev('commit()');
  const big = C('Inferno Titan', 'Creature — Giant', '', {mc:'{4}{R}{R}', cmc:6, pw:6, tg:6});
  const small = C('Goblin Guide', 'Creature — Goblin Scout', '', {mc:'{R}', cmc:1, pw:2, tg:2});
  S.hand.push(big, small); ev('commit()');
  await ev('play')(big.u); await ev('play')(small.u); await wait(5);
  check(M().XP === 1, `Kalemne: nur der Titan zählt (Erfahrung ${M().XP})`);
  // 9. Ezuri: Kreatur mit Stärke ≤ 2 tritt ein
  ev('S.bf = S.bf.filter(c => !/Kalemne|Mizzix/.test(c.n)); S.marks.XP = 0');
  S.bf.push(C('Ezuri, Claw of Progress', 'Legendary Creature — Phyrexian Elf Warrior', 'Whenever a creature you control with power 2 or less enters, you get an experience counter.\nAt the beginning of combat on your turn, put X +1/+1 counters on another target creature you control, where X is the number of experience counters you have.', {mc:'{2}{G}{U}', cmc:4, pw:3, tg:3})); ev('commit()');
  const elf = C('Llanowar Elves', 'Creature — Elf Druid', '{T}: Add {G}.', {mc:'{G}', cmc:1, pw:1, tg:1});
  const ogre = C('Gray Ogre', 'Creature — Ogre', '', {mc:'{2}{R}', cmc:3, pw:2, tg:2});
  const titan2 = C('Inferno Titan', 'Creature — Giant', '', {mc:'{4}{R}{R}', cmc:6, pw:6, tg:6});
  S.hand.push(elf, ogre, titan2); ev('commit()');
  await ev('play')(elf.u); await ev('play')(ogre.u); await ev('play')(titan2.u); await wait(5);
  check(M().XP === 2, `Ezuri: Elf und Oger zählen, Titan nicht (Erfahrung ${M().XP})`);
  // 10. Kartenmenü: Longtusk Cub
  ev('S.marks.E = 1');
  S.bf.push(longtusk); ev('commit()');
  const items = ev('cardMenu')(longtusk, 'bf');
  const lbl = items.map(i => i.h || i.l || '').filter(Boolean);
  check(lbl.some(l => /Auslöser: \+2/.test(l)), 'Menü: «Auslöser: +2 Energie» für Kampfschaden');
  const pay = items.find(i => /Bezahle 2/.test(i.h || ''));
  check(!!pay, 'Menü: «Bezahle 2 ⚡»');
  pay.f(); await wait(5);
  check(M().E === 1 && /Zu wenig Energie/.test($('#toast').textContent), 'Zu wenig Energie: nichts abgezogen, Hinweis');
  items.find(i => /Auslöser/.test(i.h || '')).f(); await wait(5);
  check(M().E === 3, `Auslöser von Hand: Energie ${M().E}`);
  pay.f(); await wait(5);
  check(M().E === 1, `Bezahlt: Energie ${M().E}`);
  // 11. Strahlung
  const rad = C('Feral Ghoul', 'Creature — Zombie Mutant', 'When this creature enters, you get two rad counters.', {mc:'{2}{G}', cmc:3, pw:2, tg:2});
  S.hand.push(rad); ev('commit()'); await ev('play')(rad.u); await wait(5);
  check(M().RAD === 2 && /Strahlung/.test($('#myMarks').textContent), `Strahlung: ${M().RAD}, angezeigt`);
  // 12. Angriff: «whenever this creature attacks»
  ev('S.marks.E = 0');
  const att = C('Voltaic Brawler', 'Creature — Human Warrior', 'When this creature enters, you get {E}{E}.\nWhenever this creature attacks, you may pay {E}. If you do, it gets +1/+1 and gains trample until end of turn.', {mc:'{R}{G}', cmc:2, pw:3, tg:1});
  check(mc(att).length === 1, 'Voltaic Brawler: nur die Eintreten-Fähigkeit gibt Energie');
  const sparky = C('Bristling Brawler', 'Creature — Beast', 'Whenever this creature attacks, you get {E}.', {pw:3, tg:3});
  S.bf.push(sparky); ev('commit()');
  ev('markOnAttack')([sparky]); await wait(5);
  check(M().E === 1, `Angriff gibt Energie: ${M().E}`);
  // 13. Spieler sieht die Marken der anderen
  const pub = ev('pub()');
  check(pub.marks && pub.marks.E === 1 && pub.marks.RAD === 2, `pub() enthält Marken ${JSON.stringify(pub.marks)}`);
  check(/Energie/.test(ev('oppMarksHtml')({E:4, XP:'<b>'})) && !/&lt;b|<b>/.test(ev('oppMarksHtml')({XP:'<b>'})), 'Gegneranzeige zeigt nur Zahlen');
  // 14. Ausschalten
  ev('LOOK.autoMarks = false; S.marks.E = 0');
  const hub2 = C('Aether Hub', 'Land', 'When Aether Hub enters, you get {E}.'); S.hand.push(hub2); ev('commit()'); await ev('play')(hub2.u); await wait(5);
  check(M().E === 0, 'Automatik aus: nichts gezählt');
  ev('LOOK.autoMarks = true');
  // 15. Neues Spiel setzt zurück
  ev('S.deck = [{n:"Mountain", type:"Basic Land — Mountain", o:""}]; startGame()'); await wait(10);
  check(M().E === 0 && M().XP === 0 && M().RAD === 0, 'Neues Spiel: alle Marken auf 0');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK');
  process.exit(0);
})();
