const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
// Scryfall-Ersatz: Text/Typ aus oracle_parts.json, Stärke/Widerstand sind Testwerte
const PARTS = Object.fromEntries(JSON.parse(fs.readFileSync(require('path').join(__dirname, 'oracle_parts.json'), 'utf8')).map(([n, type, o]) => [n, {n, type, o}]));
const TESTPT = {"Hanweir, the Writhing Township":["5", "5"], "Mishra, Lost to Phyrexia":["6", "6"]};
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async url => {
  const m = String(url).match(/cards\/named\?exact=(.+)$/); const n = m && decodeURIComponent(m[1]);
  if(n && PARTS[n] && TESTPT[n]) return {ok:true, json: async () => ({name:n, type_line:PARTS[n].type, oracle_text:PARTS[n].o, power:TESTPT[n][0], toughness:TESTPT[n][1], keywords:/^Trample, haste/.test(PARTS[n].o) ? ["Trample", "Haste"] : [], cmc:0})};
  return {ok:false, json: async () => ({})}; }; }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync(require('path').join(__dirname, 'night20261116_cards.json'), 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
const C = (n, x = {}) => ev('newCard')({...T[n], img:null, ...x});
const N = (n, type, o = '', x = {}) => ev('newCard')({n, type, o, img:null, ...x});
const open = () => !$('#modal').hidden;
const click = async t => { const b = [...d.querySelectorAll('#modalBox button')].find(b => b.textContent.trim().startsWith(t)); if(b){ b.click(); await wait(40); } return !!b; };
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()'); ev('LOOK.autoPay = false');
  ev('startBot("Test", "Test", Array(30).fill(0).map(() => ({n:"Island", type:"Basic Land — Island", o:""})))'); ev('injectBot(); commit()'); await wait(30);
  const S = () => ev('S');
  const drain = async () => { for(let i = 0; i < 8 && open(); i++){ if(!(await click('Abbrechen')) && !(await click('Kein')) && !(await click('Nein')) && !(await click('Erledigt'))) break; await wait(40); } };
  const reset0 = () => ev('S.bf = []; S.hand = []; S.gy = []; S.ex = []; S.library = []; S.pool = emptyPoolObj(); S.attacking = []; BOT.bf = []; BOT.life = 20; botChanged(); TURN = {active:me.id, n:20, starter:me.id, phase:2}; commit()');
  const reset = async () => { await wait(80); await drain(); reset0(); await wait(20); };
  const put = (...c) => { S().bf.push(...c); ev('commit()'); };
  const acts = c => ev("parseAbilities")(c).filter(a => a.kind === "act");
  const attackWith = async (...names) => { ev('openAttackDialog()'); await wait(60); for(const n of names){ const el = [...d.querySelectorAll('#modalBox .card')].find(e => e.textContent.includes(n)); if(el) el.click(); } await wait(30); await click('Angreifen'); await wait(400); };
  const meldAb = c => acts(c).find(a => /meld them into/i.test(a.text || ''));
  // Hanweir Battlements: verschmilzt mit Hanweir Garrison
  await reset(); { const hb = C('Hanweir Battlements'), hg = C('Hanweir Garrison', {pw:2, tg:3}); put(hb, hg);
    check(!!meldAb(hb), 'Hanweir Battlements: Meld-Fähigkeit erkannt');
    await ev('runAbility')(hb, meldAb(hb), {}); await wait(150); await drain();
    const m = S().bf.find(c => c.n === 'Hanweir, the Writhing Township');
    check(!!m && !S().bf.includes(hb) && !S().bf.includes(hg) && !S().ex.length, `Meld: Hanweir, the Writhing Township im Spiel, beide Teile weg (${S().bf.map(c => c.n).join(', ')} | Exil ${S().ex.length})`);
    check(m && m.meld && m.meld.length === 2 && ev('power')(m) === 5 && ev('kwHas')(m, 'haste'), 'Meld: Kartendaten geladen, beide Teile gemerkt');
    // verlässt das Spiel → beide Karten in den Friedhof
    ev('moveCard')(m.u, 'gy'); await wait(50);
    check(S().gy.length === 2 && S().gy.some(c => c.n === 'Hanweir Battlements') && S().gy.some(c => c.n === 'Hanweir Garrison') && !S().gy.some(c => c.n === m.n), `Meld: stirbt → beide Karten im Friedhof (${S().gy.map(c => c.n).join(', ')})`); }
  await reset(); { const hb = C('Hanweir Battlements'), hg = C('Hanweir Garrison', {pw:2, tg:3}); put(hb, hg);
    await ev('runAbility')(hb, meldAb(hb), {}); await wait(150); await drain();
    const m = S().bf.find(c => c.meld); ev('moveCard')(m.u, 'hand'); await wait(50);
    check(S().hand.length === 2 && !S().bf.length, 'Meld: auf die Hand → beide Karten auf die Hand'); }
  // ohne Garrison (oder mit fremder Garrison) geschieht nichts
  await reset(); { const hb = C('Hanweir Battlements'); put(hb);
    await ev('runAbility')(hb, meldAb(hb), {}); await wait(150); await drain();
    check(S().bf.length === 1 && S().bf[0] === hb, 'Meld: ohne Hanweir Garrison geschieht nichts'); }
  await reset(); { const hb = C('Hanweir Battlements'), hg = C('Hanweir Garrison', {pw:2, tg:3}); hg.ow = {id:'x', name:'Anna'}; put(hb, hg);
    await ev('runAbility')(hb, meldAb(hb), {}); await wait(150); await drain();
    check(S().bf.includes(hb) && S().bf.includes(hg), 'Meld: fremde Garrison (nicht im Besitz) verschmilzt nicht'); }
  // Hanweir Garrison: zwei Menschen greifen getappt mit an
  await reset(); { const hg = C('Hanweir Garrison', {pw:2, tg:3}); put(hg);
    await attackWith('Hanweir Garrison'); await wait(300); await drain(); await wait(200);
    const toks = S().bf.filter(c => c.tok);
    check(toks.length === 2 && toks.every(c => c.tap), `Hanweir Garrison: zwei Token getappt (${toks.length})`);
    check(ev('BOT.life') === 16, `Hanweir Garrison: Token greifen mit an, KI 20 → 16 (${ev('BOT.life')})`); }
  // Mishra, Claimed by Gix + Phyrexian Dragon Engine greifen an → verschmelzen, greifen weiter an
  await reset(); { const mi = C('Mishra, Claimed by Gix', {pw:3, tg:3}), de = C('Phyrexian Dragon Engine', {pw:2, tg:2}); put(mi, de);
    await attackWith('Mishra, Claimed', 'Phyrexian Dragon Engine'); await wait(400); await drain(); await wait(300); await drain();
    const m = S().bf.find(c => c.n === 'Mishra, Lost to Phyrexia');
    check(!!m && m.tap && !S().bf.includes(mi) && !S().bf.includes(de), `Mishra: verschmolzen zu Mishra, Lost to Phyrexia, getappt (${S().bf.map(c => c.n).join(', ')})`);
    check(ev('BOT.life') === 12, `Mishra: 2 Leben (Angreifer) + 6 Kampfschaden, KI 20 → 12 (${ev('BOT.life')})`); }
  // Mishra greift ohne Dragon Engine an: kein Verschmelzen
  await reset(); { const mi = C('Mishra, Claimed by Gix', {pw:3, tg:3}), de = C('Phyrexian Dragon Engine', {pw:2, tg:2}); put(mi, de);
    await attackWith('Mishra, Claimed'); await wait(400); await drain(); await wait(300);
    check(S().bf.includes(mi) && S().bf.includes(de) && ev('BOT.life') === 16, `Mishra allein: kein Verschmelzen, KI 20 → 16 (${ev('BOT.life')})`); }
  // Mishra, Lost to Phyrexia: «Creatures you don't control get -1/-1» trifft nur fremde Kreaturen
  await reset(); { const own = N('Bär', 'Creature — Bear', '', {pw:2, tg:2}); put(own); ev('BOT.bf.push(newCard({n:"Feind", type:"Creature — Bear", o:"", pw:2, tg:2})); botChanged()');
    const st = ev('parseSteps')("Creatures you don't control get -1/-1 until end of turn.", own);
    check(st.length === 1 && st[0].t === 'massPump' && st[0].oppOnly, 'Mishra-Modus: -1/-1 für fremde Kreaturen erkannt');
    await ev('runSteps')(st, {n:'Mishra, Lost to Phyrexia'}, {}); await wait(100);
    check(!own.pump, 'Mishra-Modus: eigene Kreatur bleibt 2/2'); }
  // Grist, the Hunger Tide: +1 wiederholt sich, solange ein Insekt gemahlen wird
  await reset(); { const gr = C('Grist, the Hunger Tide', {loy:3}); put(gr); gr.c = 3; gr.cn = 'loyalty';
    const ins = N('Käfer', 'Creature — Insect', '', {pw:1, tg:1}), ins2 = N('Käfer2', 'Creature — Insect', '', {pw:1, tg:1}), land = N('Forest', 'Basic Land — Forest'), rest = N('Rest', 'Instant');
    S().library.push(ins, ins2, land, rest); ev('commit()');
    const ab = ev('parseAbilities')(gr).find(a => /repeat this process/i.test(a.text || ''));
    check(!!ab, 'Grist: +1 erkannt');
    await ev('runAbility')(gr, ab, {}); await wait(150); await drain();
    const toks = S().bf.filter(c => c.tok);
    check(toks.length === 3 && S().gy.length === 3 && S().library.length === 1, `Grist: 3 Insekt-Token, 3 gemahlen (Token ${toks.length}, Friedhof ${S().gy.length})`);
    check(gr.c === 5, `Grist: +2 Loyalität durch zwei gemahlene Insekten (${gr.c})`); }
  // Grist ausserhalb des Spielfelds: 1/1 Insekt-Kreatur, im Spiel nicht
  await reset(); { const gr = C('Grist, the Hunger Tide'); S().gy.push(gr); ev('commit()');
    check(ev('isCreature')(gr) && ev('typeMatch')(gr, 'Insect'), 'Grist im Friedhof: Insekt-Kreatur');
    S().gy.length = 0; put(gr);
    check(!ev('isCreature')(gr) && !ev('typeMatch')(gr, 'Insect'), 'Grist im Spiel: keine Kreatur'); }
  // Grist mahlt sich selbst als Insekt (zweiter Grist in der Bibliothek)
  await reset(); { const gr = C('Grist, the Hunger Tide'), gr2 = C('Grist, the Hunger Tide'); put(gr); gr.c = 3; gr.cn = 'loyalty'; S().library.push(gr2, N('Rest', 'Instant')); ev('commit()');
    await ev('runAbility')(gr, ev('parseAbilities')(gr).find(a => /repeat this process/i.test(a.text || '')), {}); await wait(150); await drain();
    check(gr.c === 4 && S().gy.length === 2, `Grist: gemahlener Grist zählt als Insekt (${gr.c})`); }
  // Fähigkeiten-Check: alle automatisch
  { const rep = ev('(() => { S.deck = [' + Object.keys(T).map(n => JSON.stringify({n, type:T[n].type, o:T[n].o})).join(',') + ']; openStats("check"); return ABILITY_REPORT; })()'); await wait(50); await drain();
    check(/0 teilweise, 0 von Hand/.test(rep), 'Fähigkeiten-Check: Meld-Karten automatisch'); }
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
