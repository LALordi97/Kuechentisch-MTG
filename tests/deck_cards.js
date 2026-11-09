// Listet Karten aus decks/*.txt, die noch in keiner tests/*_cards.json stehen: node deck_cards.js [max]
const fs = require('fs'), path = require('path');
const max = +process.argv[2] || 1e9;
const done = new Set();
fs.readdirSync(__dirname).filter(f => /_cards\.json$/.test(f)).forEach(f => { try{ JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8')).forEach(c => done.add(String(c[0]).toLowerCase())); }catch(e){} });
const basics = /^(Snow-Covered )?(Plains|Island|Swamp|Mountain|Forest|Wastes)$/i;
const out = []; const seen = new Set();
for(const f of ['cedh.txt', 'modern.txt', 'legacy.txt']){
  const p = path.join(__dirname, '..', 'decks', f); if(!fs.existsSync(p)) continue;
  for(let l of fs.readFileSync(p, 'utf8').split(/\r?\n/)){
    l = l.trim(); if(!l || /^#/.test(l) || /^(Commander|Deck|Sideboard|Companion)$/i.test(l)) continue;
    const n = l.replace(/^\d+x?\s+/, '').replace(/\s+\([A-Z0-9]+\)\s*\S*$/, '').trim();
    const k = n.toLowerCase(); if(basics.test(n) || done.has(k) || seen.has(k)) continue;
    seen.add(k); out.push(n);
  }
}
console.log(out.slice(0, max).join('\n'));
console.error(`${out.length} Karten noch ohne Prüfdatei`);
