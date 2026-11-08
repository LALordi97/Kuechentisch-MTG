# Küchentisch MTG – Arbeitsnotizen

- App = eine Datei `index.html`, Version in `APP_VERSION` (index.html) und `version.json` hochzählen.
- Antworten an Lukas auf Deutsch, Schweizer Schreibweise (ss statt ß).
- Fähigkeiten-Check-Berichte enthalten den vollen Kartentext: daraus `tests/reportN_cards.json` bauen (nicht aus dem Gedächtnis).
- Vor jedem Push: `cd tests && npm install && ./reg.sh` (Lint + alle Tests, ca. 4 Min). Schnell zwischendurch: `node lint.js`.
- Neue Schritt-Namen (`case "..."`) vorher mit `grep` prüfen; Lint meldet doppelte Namen.
