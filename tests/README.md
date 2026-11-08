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
