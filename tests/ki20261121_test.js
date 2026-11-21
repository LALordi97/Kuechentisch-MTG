// KI verbessern (21.11.2026): Removal-Ziele – Unzerstörbarkeit, -N/-N, Zurückschicken von Token, «target attacking creature»
const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()');
  ev('startBot("Test", "Test", Array(30).fill(0).map(() => ({n:"Island", type:"Basic Land — Island", o:""})))'); ev('injectBot(); commit()'); await wait(30);
  const mine = (n, pw, tg, x = {}) => { w.__c = ev(`newCard({n:${JSON.stringify(n)}, type:"Creature — Test", o:"", pw:${pw}, tg:${tg}, img:null})`); Object.assign(w.__c, x); ev('S.bf.push(window.__c)'); return w.__c; };
  const spell = o => { w.__s = ev(`newCard({n:"Spruch", type:"Instant", o:${JSON.stringify(o)}, img:null, cmc:2})`); return w.__s; };
  const hitBy = o => { spell(o); const before = ev('S.bf.map(c => c.n)'); ev('withBot("bot", () => applyRemovalToMe(window.__s, removalOf(window.__s)))'); const after = ev('S.bf.map(c => c.n)'); return before.filter(n => !after.includes(n)).join(',') || '-'; };
  const reset = () => ev('S.bf = []; S.gy = []; S.hand = []; S.attacking = []; BOT.bf = []; botChanged()');
  reset(); { mine('Gott', 6, 6, {kw:['Indestructible']}); mine('Bär', 3, 3); const r = hitBy('Destroy target creature.');
    check(r === 'Bär', `Zerstören: nicht das unzerstörbare Ziel (${r})`); }
  reset(); { mine('Gott', 2, 2, {kw:['Indestructible'], cmc:5}); mine('Wicht', 2, 2); const r = hitBy('Spruch deals 3 damage to target creature.');
    check(r === 'Wicht', `Schaden: nicht das unzerstörbare Ziel (${r})`); }
  reset(); { mine('Gott', 3, 3, {kw:['Indestructible'], cmc:5}); mine('Wicht', 1, 1); const r = hitBy('Target creature gets -3/-3 until end of turn.');
    check(r === 'Gott', `-3/-3: trifft auch Unzerstörbare (${r})`); }
  reset(); { mine('Echt', 3, 3, {cmc:3}); mine('Token', 2, 2, {tok:true}); const r = hitBy("Return target creature to its owner's hand.");
    check(r === 'Token', `Zurückschicken: lieber das Token (${r})`); }
  reset(); { mine('Ruhig', 4, 4); const r = hitBy('Destroy target attacking creature.'); check(r === '-', `«attacking creature»: kein Ziel ohne Angriff (${r})`); }
  reset(); { const a = mine('Angreifer', 2, 2); mine('Daheim', 5, 5); ev('S.attacking = [window.__c && S.bf[0].u]; S.attackKey = turnKey()'); const r = hitBy('Destroy target attacking creature.');
    check(r === 'Angreifer', `«attacking creature»: nur der Angreifer (${r})`); }
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
