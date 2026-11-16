# Tests

Alle Tests laufen mit Node und jsdom gegen `../index.html`.

```
cd tests
npm install
./reg.sh          # Lint, dann alle Tests (parallel), Ergebnis in reg.out
node lint.js      # nur Syntax und doppelte case-/Funktionsnamen (unter 1 s)
node parse_dump.js report27_cards.json   # zeigt, wie die App Kartentexte zerlegt
```

- `chkN_test.js`: Fähigkeiten-Check für die Karten in `reportN_cards.json` (Ziel: alles automatisch).
- `reportN_test.js`: Verhalten der Karten aus Bericht N.
- Mehrspieler-Tests (`mp*`, `req`, `life`) sind zeitkritisch und laufen am Schluss allein.
- `node deck_cards.js 30`: Karten aus `../decks/*.txt`, die noch keine Prüfdatei haben.
- `node chk_file.js <karten.json>`: Fähigkeiten-Check für eine beliebige Kartendatei.
- `node night_cards.js 30`: nächste ungeprüfte Karten aus `oracle_decks.json` (vom GitHub-Ablauf) als Prüfdatei.
- `node stackabil_test.js`: Fähigkeiten auf dem Stapel im Mehrspieler (läuft in reg.sh seriell).
- `node loop_test.js`: Erkennung von Endlosschleifen (Zirda + Grim Monolith, Lion's Eye Diamond, Schaden, Spielsteine).
- `node multibot_test.js`: mehrere KI-Gegner (Zugfolge, eigene Decks, Kampf, Schaden, Ausscheiden, Speichern; läuft in reg.sh seriell).
