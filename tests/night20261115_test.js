const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = Object.fromEntries(JSON.parse(fs.readFileSync(require('path').join(__dirname, 'night20261115_cards.json'), 'utf8')).map(([n, type, o, mc, cmc]) => [n, {n, type, o, mc, cmc}]));
const C = (n, type, o, x = {}) => ev('newCard')({n, type, o, img:null, ...x});
const mc = c => JSON.stringify((ev('manaChoices')(c) || []).map(o => o.add.join('')));
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()'); ev('LOOK.autoAbil = false');
  const S = ev('S');
  ev('startBot("Test", "Test", Array(30).fill(0).map(() => ({n:"Island", type:"Basic Land — Island", o:""})))'); ev('injectBot(); commit()'); await wait(30);
  const grave = C('Watery Grave', 'Land — Island Swamp', '({T}: Add {U} or {B}.)'), mount = C('Mountain', 'Basic Land — Mountain', '({T}: Add {R}.)'), cit = C('City of Brass', 'Land', '{T}: Add one mana of any color.');
  S.bf.push(grave, mount, cit); ev('commit()');
  // Harbinger of the Seas beim Gegner: nichtstandard Länder geben nur {U}
  ev(`BOT.bf.push(newCard(${JSON.stringify({...T['Harbinger of the Seas'], pw:2, tg:2})})); botChanged()`); await wait(10);
  check(mc(cit) === '["U"]' && mc(grave) === '["U"]' && mc(mount) === '["R"]', `Harbinger: City ${mc(cit)}, Grave ${mc(grave)}, Mountain ${mc(mount)}`);
  check(ev('typeMatch')(cit, 'Island') && !ev('typeMatch')(grave, 'Swamp') && ev('typeMatch')(mount, 'Mountain'), 'Harbinger: City ist Insel, Watery Grave kein Sumpf mehr, Mountain bleibt');
  // Harbinger eigener, dann Blood Moon später: Gebirge gewinnt
  ev('BOT.bf.push(newCard({n:"Blood Moon", type:"Enchantment", o:"Nonbasic lands are Mountains."})); botChanged()'); await wait(10);
  check(mc(cit) === '["R"]' && ev('typeMatch')(cit, 'Mountain') && !ev('typeMatch')(cit, 'Island'), `Harbinger, danach Blood Moon: City ${mc(cit)}`);
  ev('BOT.bf = []; botChanged()'); await wait(10);
  check(mc(cit) === '["W","U","B","R","G"]' && ev('typeMatch')(grave, 'Swamp') && !ev('typeMatch')(cit, 'Island'), `ohne Harbinger wieder normal: ${mc(cit)}`);
  // Fähigkeiten-Check: Harbinger automatisch
  { const rep = ev('(() => { S.deck = [' + JSON.stringify({n:'Harbinger of the Seas', type:T['Harbinger of the Seas'].type, o:T['Harbinger of the Seas'].o}) + ']; openStats("check"); return ABILITY_REPORT; })()'); await wait(50);
    check(/0 teilweise, 0 von Hand/.test(rep), 'Fähigkeiten-Check: Harbinger automatisch'); }
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
