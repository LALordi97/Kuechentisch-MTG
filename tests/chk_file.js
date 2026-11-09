// Fähigkeiten-Check für eine beliebige Karten-Datei: node chk_file.js night_cards.json
const {JSDOM} = require('jsdom'); const fs = require('fs');
const file = process.argv[2]; if(!file){ console.log('Aufruf: node chk_file.js <karten.json>'); process.exit(1); }
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
(async () => {
  d.querySelector('#lName').value = 'Nacht'; d.querySelector('#lSolo').click(); await new Promise(r => setTimeout(r, 30)); ev('closeModal()');
  w.__deck = JSON.parse(fs.readFileSync(file, 'utf8')).map(([n, type, o, mc, cmc]) => ({n, type, o, mc, cmc}));
  ev('S.deck = window.__deck; S.deckName = "Nacht"; openStats("check")'); await new Promise(r => setTimeout(r, 30));
  console.log(ev('ABILITY_REPORT')); process.exit(0);
})();
