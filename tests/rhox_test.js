const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const C = (n, type, o, x = {}) => ev('newCard')({n, type, o, img:null, ...x});
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()');
  const S = ev('S'); ev('LOOK.autoPay = false');
  ev('startBot("Test", "Test", Array(30).fill(0).map(() => ({n:"Island", type:"Basic Land — Island", o:""})))'); ev('injectBot(); commit()'); await wait(30);
  const rhox = C('Rhox Faithmender', 'Creature — Rhino Monk', 'Lifelink\nIf you would gain life, you gain twice that much life instead.', {pw:1, tg:5});
  S.bf.push(rhox); ev('commit()'); await wait(10);
  let l0 = S.life; d.querySelector('[data-life="1"]').click(); await wait(40);
  check(S.life === l0 + 2, `Rhox: +1 wird +2 (${l0} → ${S.life})`);
  await wait(40); check(S.life === l0 + 2, 'bleibt bei +2, kein erneutes Verdoppeln');
  check(/Rhox Faithmender: Lebensgewinn 1 wird zu 2/.test($('#log').textContent), 'Log erklärt es');
  // Essence Warden + Rhox
  const warden = C('Essence Warden', 'Creature — Elf Shaman', 'Whenever another creature enters, you gain 1 life.', {pw:1, tg:1});
  S.bf.push(warden); ev('commit()'); await wait(10);
  l0 = S.life; const bear = C('Grizzly Bears', 'Creature — Bear', '', {pw:2, tg:2}); S.hand.push(bear); ev('commit()');
  await ev('play')(bear.u); await wait(60);
  check(S.life === l0 + 2, `Essence Warden + Rhox: +2 (${l0} → ${S.life})`);
  // Crusher + Dina + Rhox
  const cr = C('Dr. Beverly Crusher', 'Legendary Creature — Human Doctor', 'If you gaining life causes a triggered ability of a permanent you control to trigger, that ability triggers an additional time.\nWhenever you gain life, put a +1/+1 counter on Dr. Crusher.', {pw:2, tg:2});
  S.bf.push(cr); ev('commit()'); await wait(10);
  l0 = S.life; ev('S.life += 3; commit()'); await wait(60);
  check(S.life === l0 + 6 && cr.c === 2, `Rhox + Crusher: +3 wird +6, Crusher 2 Marken (${S.life - l0}, ${cr.c})`);
  // zweiter Verdoppler + Angel of Vitality
  S.bf.push(C('Boon Reflection', 'Enchantment', 'If you would gain life, you gain twice that much life instead.'), C('Angel of Vitality', 'Creature — Angel', 'Flying\nIf you would gain life, you gain that much life plus 1 instead.\nAngel of Vitality gets +2/+2 as long as you have 25 or more life.'));
  ev('commit()'); await wait(10);
  l0 = S.life; ev('S.life += 1; commit()'); await wait(60);
  check(S.life === l0 + 8, `Angel + 2 Verdoppler: (1+1)×4 = 8 (${S.life - l0})`);
  l0 = S.life; ev('S.life -= 3; commit()'); await wait(40);
  check(S.life === l0 - 3, 'Leben verlieren bleibt normal');
  console.log(fails ? `\n${fails} FEHLER` : '\nALLES OK'); process.exit(0);
})();
