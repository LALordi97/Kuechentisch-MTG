const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync('night20261111_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
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
  const acts = c => ev("parseAbilities")(c).filter(a => a.kind === "act");
  const botBear = (n = "Bär", x = "") => ev(`BOT.bf.push(newCard({n:"${n}", type:"Creature — Bear", o:"", pw:2, tg:2})); ${x} botChanged()`);
  // Fallaji Archaeologist: Nichtkreatur-Nichtland aus den gemahlenen Karten, sonst +1/+1-Marke
  await reset(); { const sp = N('Spontan', 'Instant', ''), be = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}), fo = N('Forest', 'Basic Land — Forest', '');
    lib(sp, be, fo); const fa = C('Fallaji Archaeologist', {pw:1, tg:3}); put(fa);
    ev('runAbility')(fa, trig(fa), {}); await wait(120); const shown = [...d.querySelectorAll('#modalBox .card')].map(e => e.textContent);
    check(shown.length === 1 && shown[0].includes('Spontan'), `Fallaji: nur Nichtkreatur-Nichtland zur Wahl (${shown.length})`);
    await clickCard('Spontan'); await wait(100); await drain();
    check(S().hand.includes(sp) && S().gy.includes(be) && S().gy.includes(fo) && !(fa.c > 0), 'Fallaji: Spontanzauber auf die Hand, keine Marke'); }
  await reset(); { lib(N('Spontan', 'Instant', ''), N('Bär', 'Creature — Bear', ''), N('Forest', 'Basic Land — Forest', ''));
    const fa = C('Fallaji Archaeologist', {pw:1, tg:3}); put(fa); ev('runAbility')(fa, trig(fa), {}); await wait(120); await click('Keine'); await wait(100); await drain();
    check(S().hand.length === 0 && fa.c === 1, `Fallaji: verzichtet → +1/+1-Marke (${fa.c})`); }
  await reset(); { lib(N('Bär', 'Creature — Bear', ''), N('Forest', 'Basic Land — Forest', ''), N('Island', 'Basic Land — Island', ''));
    const fa = C('Fallaji Archaeologist', {pw:1, tg:3}); put(fa); ev('runAbility')(fa, trig(fa), {}); await wait(150); await drain();
    check(S().gy.length === 3 && fa.c === 1, `Fallaji: nichts Passendes → +1/+1-Marke (${fa.c})`); }
  // Golos: oberste drei ins Exil, diesen Zug gratis spielbar
  await reset(); { const z1 = N('Z1', 'Sorcery', '', {mc:'{5}{U}', cmc:6}), fo = N('Forest', 'Basic Land — Forest', ''), be = N('Bär', 'Creature — Bear', '', {mc:'{1}{G}', cmc:2, pw:2, tg:2});
    lib(z1, fo, be, N('Rest', 'Instant')); const go = C('Golos, Tireless Pilgrim', {pw:3, tg:5}); put(go);
    const a = acts(go).find(x => /Exile the top three/.test(x.text || '')); ev('runAbility')(go, a, {}); await wait(120); await drain();
    const k = ev('turnKey()');
    check([z1, fo, be].every(c => S().ex.includes(c) && c.castKey === k && c.playOk && (c === fo || c.freeCast)), 'Golos: drei Karten im Exil, diesen Zug gratis spielbar');
    await ev('castFromExile')(be); await wait(200); await drain();
    check(S().bf.includes(be), 'Golos: Kreatur aus dem Exil ohne Mana gespielt'); }
  // Field of Ruin: nichtstandard Land zerstören, alle suchen ein Standardland
  await reset(); { ev('BOT.bf.push(newCard({n:"Ödland", type:"Land", o:""})); BOT.library = [newCard({n:"Island", type:"Basic Land — Island", o:""}), newCard({n:"Bär", type:"Creature — Bear", o:""})]; botChanged()');
    const myF = N('Forest', 'Basic Land — Forest', ''); lib(N('X', 'Instant'), myF); const fr = C('Field of Ruin'); put(fr);
    const a = acts(fr).find(x => /Destroy target nonbasic/.test(x.text || '')); ev('runAbility')(fr, a, {}); await wait(120);
    await clickCard('Ödland'); await wait(150); await clickCard('Forest'); await wait(300); await drain(); await wait(200);
    check(ev('BOT.bf.some(c => c.n === "Island") && !BOT.bf.some(c => c.n === "Ödland")'), `Field of Ruin: KI-Land zerstört, KI sucht Island (${ev('BOT.bf.map(c => c.n).join(",")')})`);
    check(S().bf.includes(myF) && !myF.tap, 'Field of Ruin: ich suche ein Standardland (ungetappt)'); }
  // Duskwatch Recruiter: Werwolf-Bedingung über den letzten Zug
  await reset(); { const du = C('Duskwatch Recruiter // Krallenhorde Howler', {pw:2, tg:2, back:'x.jpg'}); put(du); const ab = trig(du);
    ev('S.spellSeen = []'); const k0 = ev('turnKey()'); await cast(N('Zauber', 'Sorcery', '')); await drain();
    check(ev('spellsInTurn(turnKey())') === 1, `Zauber im Zug gemerkt (${ev('spellsInTurn(turnKey())')}, ${ev('JSON.stringify(S.spellSeen)')}, ${title()})`);
    ev('setTurn')({active:'bot', n:21, starter:ev('me.id'), phase:0}); await wait(50); await drain();
    check(ev('S.prevTK') === k0, 'Vorheriger Zug gemerkt');
    ev('S.spellSeen = []; S.prevTK = "t1"'); await ev('runTrigger')(du, ab, {kind:'upkeep'}); await wait(50);
    check(du.flip === true, 'Duskwatch: kein Zauber im letzten Zug → verwandelt');
    ev('S.spellSeen = [["t1", "a"]]'); await ev('runTrigger')(du, ab, {kind:'upkeep'}); await wait(50);
    check(du.flip === true, 'Duskwatch (Rückseite): nur ein Zauber → bleibt');
    ev('S.spellSeen = [["t1", "a"], ["t1", "b"]]'); await ev('runTrigger')(du, ab, {kind:'upkeep'}); await wait(50);
    check(du.flip === false, 'Duskwatch (Rückseite): zwei Zauber → zurückverwandelt');
    ev('S.spellSeen = [["t1", "a"]]'); await ev('runTrigger')(du, ab, {kind:'upkeep'}); await wait(50);
    check(du.flip === false, 'Duskwatch: ein Zauber im letzten Zug → bleibt'); }
  // Lücke: Convoke für Zauber aus dem Exil (Party Thrasher)
  const R28 = Object.fromEntries(JSON.parse(fs.readFileSync('report28_cards.json', 'utf8')).map(([n, type, o, mc, cmc, pw, tg]) => [n, {n, type, o, mc, cmc, pw, tg}]));
  for(const kind of ['Sorcery', 'Artifact', 'Creature — Bear']){
    await reset(); const pt = ev('newCard')({...R28['Party Thrasher'], img:null}); const b1 = N('Bär1', 'Creature — Bear', '', {pw:2, tg:2, mc:'{R}'}), b2 = N('Bär2', 'Creature — Bear', '', {pw:2, tg:2, mc:'{G}'});
    put(pt, b1, b2); const sp = N('Exilzauber', kind, '', {mc:'{1}{R}', cmc:2, pw:1, tg:1}); sp.castKey = ev('turnKey()'); sp.playOk = true; S().ex.push(sp); ev('commit()');
    const pr = ev('castFromExile')(sp); await wait(120); const t = title(), hasConv = btns().some(x => /Convoke nutzen/.test(x));
    if(kind === 'Creature — Bear'){ check(!hasConv, `Convoke aus dem Exil: nicht für Kreaturenzauber (${t})`); await drain(); await pr; continue; }
    check(hasConv, `Convoke aus dem Exil (${kind}): Angebot erscheint (${t})`);
    await click('Convoke nutzen'); await wait(80); await clickCard('Bär1'); await clickCard('Bär2'); await click('Fertig') || await click('OK') || await click('Übernehmen'); await wait(150);
    await drain(); await pr; await wait(150);
    check(b1.tap && b2.tap && !S().ex.includes(sp), `Convoke aus dem Exil (${kind}): zwei Kreaturen getappt, Zauber gewirkt (${b1.tap}/${b2.tap}, ${S().ex.includes(sp)})`); }
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
