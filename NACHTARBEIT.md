# Nachtarbeit

Diese Anleitung führt eine geplante Aufgabe jede Nacht ohne Rückfragen aus. Sie gilt zusätzlich zu `CLAUDE.md`.

## Zeitrahmen

- Start gegen 01:45 Uhr. **Spätestens um 04:30 Uhr (Zürich) aufhören**: dann committen, was fertig und grün ist, den Rest verwerfen oder auf einen Zweig legen. Am Morgen ab 07:00 Uhr muss das Kontingent für die Arbeit frei sein.
- Die Uhrzeit mit `TZ=Europe/Zurich date` prüfen, vor jedem grösseren Schritt.

## Regeln fürs Pushen

- Was auf `main` landet, geht über die automatische Aktualisierung sofort an alle Mitspieler. Deshalb nur auf `main` pushen, wenn `cd tests && ./reg.sh` mit «ALLES GRÜN» endet.
- Grössere oder riskante Umbauten (Zugablauf, Netzwerk, Kampf, Bezahlen) auf einen Zweig `nacht/JJJJ-MM-TT` pushen statt auf `main`. In der Zusammenfassung erwähnen.
- Vor dem Push die Version hochzählen: `APP_VERSION` in `index.html` und `version.json` (Format `JJJJ.MM.TT-n`, `n` fortlaufend am selben Tag). In `version.json` kurze deutsche Notizen.
- Nie Kartentext aus dem Gedächtnis schreiben.

## 1. Gesundheitscheck (immer)

1. `cd tests && npm install && ./reg.sh`
2. Ist etwas rot: Ursache suchen und beheben. Ein Mehrspieler-Test (`mp*`, `req`, `life`), der einzeln dreimal grün ist, gilt als wackelig, nicht als Fehler.

## 2. Karten aus den Top-Decks (pro Nacht bis zu 30 nicht automatische Karten)

1. `cd tests && node night_cards.js 100` schreibt die nächsten 100 ungeprüften Karten (erfahrungsgemäss sind rund 80 % davon schon automatisch; davon höchstens 30 nicht automatische einbauen) aus den Top-Decks mit ihrem echten Kartentext in `tests/nightJJJJMMTT_cards.json`. Der Text stammt aus `tests/oracle_decks.json`, das ein GitHub-Ablauf (`.github/workflows/oracle.yml`) jede Nacht um ca. 00:52 Uhr aus den Scryfall-Massendaten erneuert. Das ist echter Kartentext von Scryfall, kein Gedächtnis.
2. Fehlt `oracle_decks.json` (Ablauf noch nie gelaufen oder fehlgeschlagen), ersatzweise `node tests/deck_cards.js 30` und den Text Karte für Karte mit WebFetch holen: `https://api.scryfall.com/cards/named?exact=<Name, URL-kodiert>&format=text`, **wörtlich** übernehmen; unsichere Karten weglassen. Klappt auch das nicht, Schritt 2 auslassen und das in der Zusammenfassung sagen.
3. Format der Prüfdateien: `["Name", "Typzeile", "Regeltext", "{Manakosten}", Manawert]`.
4. `node tests/chk_file.js tests/nightJJJJMMTT_cards.json` zeigt, was «automatisch», «teilweise» oder «von Hand» ist. `node tests/manual_dump.js` und `node tests/parse_dump.js <datei>` helfen beim Zerlegen.
5. Die nicht automatischen Karten einbauen wie in den bisherigen Runden (Muster in `matchStep`, Signaturen `sig`, Fälle in `runSteps`, `HANDLED_STATIC`). Neue `case`-Namen vorher mit `grep` prüfen. Zwischendurch `node tests/lint.js`.
6. Für eingebaute Karten Verhaltenstests in `tests/nightJJJJMMTT_test.js` (Kopf von `report30_test.js` übernehmen, Kartendatei austauschen).
7. Lieber 10 Karten sauber als 30 halb. Was nicht fertig wird, bleibt für die nächste Nacht (die Karte steht dann schon in der Prüfdatei; in der Zusammenfassung erwähnen).

## 3. Bekannte Lücken (höchstens eine pro Nacht, nur wenn Zeit bleibt)

Eine offene Lücke wählen, umsetzen, testen, hier abhaken (`[x]` mit Datum):

- [ ] Mindslaver: den nächsten Zug des Gegners wirklich steuern (heute nur Hinweis).
- [ ] Zusätzliche Kampfphasen ausführen (heute nur Hinweis).
- [ ] Ainok- und Winota-Angreifer automatisch in den Angriff aufnehmen.
- [ ] Kostensenkung von March of Otherworldly Light / March-Zyklus anwenden.
- [ ] Convoke für Zauber aus dem Exil prüfen.
- [ ] Trickbind/Tidebinder: Fähigkeiten auf dem Stapel neutralisieren.

## 4. Abschluss

1. `cd tests && ./reg.sh` → nur bei «ALLES GRÜN» auf `main` pushen (sonst Zweig, siehe oben).
2. Unten im Protokoll eine Zeile anhängen und mitcommitten.
3. Zusammenfassung auf Deutsch (Schweizer Schreibweise, ss statt ß), kurz: Testergebnis, welche Karten neu automatisch sind, welche Lücke erledigt ist, was offen blieb, ob gepusht wurde (Version) oder ein Zweig angelegt wurde.

## Protokoll

- 2026-11-09: Nachtarbeit eingerichtet. GitHub-Ablauf liefert den Kartentext aller 877 Karten der Top-Decks; 506 davon noch ohne Prüfdatei.
