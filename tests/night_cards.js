// Schreibt die nächsten N noch ungeprüften Karten aus oracle_decks.json (Kartentext von Scryfall) in eine Prüfdatei.
// Aufruf: node night_cards.js 30  →  nightJJJJMMTT_cards.json
const fs = require('fs'), path = require('path');
const max = +process.argv[2] || 30;
const src = path.join(__dirname, 'oracle_decks.json');
if(!fs.existsSync(src)){ console.log('oracle_decks.json fehlt – der GitHub-Ablauf «Kartentext für die Nachtarbeit» ist noch nicht gelaufen.'); process.exit(2); }
const done = new Set();
fs.readdirSync(__dirname).filter(f => /_cards\.json$/.test(f)).forEach(f => { try{ JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8')).forEach(c => { done.add(String(c[0]).toLowerCase()); done.add(String(c[0]).split(' // ')[0].toLowerCase()); }); }catch(e){} });
const all = JSON.parse(fs.readFileSync(src, 'utf8'));
const todo = all.filter(c => !done.has(String(c[0]).toLowerCase()));
const day = new Date().toLocaleDateString('sv-SE', {timeZone:'Europe/Zurich'}).replace(/-/g, '');
const out = path.join(__dirname, `night${day}_cards.json`);
const pick = todo.slice(0, max);
if(!pick.length){ console.log('Alle Karten aus den Top-Decks haben schon eine Prüfdatei.'); process.exit(0); }
fs.writeFileSync(out, JSON.stringify(pick, null, 0).replace(/\],\[/g, '],\n[') + '\n');
console.log(`${pick.length} Karten → ${path.basename(out)} (danach noch ${todo.length - pick.length} offen)`);
