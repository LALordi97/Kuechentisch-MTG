const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()');
  w.__deck = JSON.parse(fs.readFileSync('report14_cards.json', 'utf8')).map(([n, type, o, mc, cmc]) => ({n, type, o, mc, cmc}));
  ev('S.deck = window.__deck; S.deckName = "Bericht14"; openStats("check")'); await wait(30);
  console.log(ev('ABILITY_REPORT'));
  process.exit(0);
})();
