const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
const wait = ms => new Promise(r => setTimeout(r, ms));
const cards = require('./audit_cards.js');
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()');
  w.__deck = cards.map(([n, type, o]) => ({n, type, o}));
  ev('S.deck = window.__deck; S.deckName = "Test"; openStats("check")'); await wait(30);
  console.log([...d.querySelectorAll('.statcard')].map(e => e.textContent.replace(/\s+/g, ' ').trim()).join(' | '));
  console.log(ev('ABILITY_REPORT').slice(0, 2500));
  process.exit(0);
})();
