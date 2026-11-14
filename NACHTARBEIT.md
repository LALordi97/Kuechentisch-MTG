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

1. `cd tests && node night_cards.js 100` schreibt die nächsten 100 ungeprüften Karten (erfahrungsgemäss sind rund 80 % davon schon automatisch; davon höchstens 30 nicht automatische einbauen) aus den Top-Decks mit ihrem echten Kartentext in `tests/nightJJJJMMTT_cards.json`. Der Text stammt aus `tests/oracle_decks.json`, das ein GitHub-Ablauf (`.github/workflows/oracle.yml`) jede Nacht kurz vor 1 Uhr aus den Scryfall-Massendaten erneuert. Das ist echter Kartentext von Scryfall, kein Gedächtnis.
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
- [x] Ainok- und Winota-Angreifer automatisch in den Angriff aufnehmen. (2026-11-10)
- [x] Kostensenkung von March of Otherworldly Light / March-Zyklus anwenden. (2026-11-12, getestet mit March of Swirling Mist)
- [x] Convoke für Zauber aus dem Exil prüfen. (2026-11-11: funktioniert schon, Tests ergänzt)
- [ ] Trickbind/Tidebinder: Fähigkeiten auf dem Stapel neutralisieren.

## 4. Abschluss

1. `cd tests && ./reg.sh` → nur bei «ALLES GRÜN» auf `main` pushen (sonst Zweig, siehe oben).
2. Unten im Protokoll eine Zeile anhängen und mitcommitten.
3. Zusammenfassung auf Deutsch (Schweizer Schreibweise, ss statt ß), kurz: Testergebnis, welche Karten neu automatisch sind, welche Lücke erledigt ist, was offen blieb, ob gepusht wurde (Version) oder ein Zweig angelegt wurde.

## Protokoll

- 2026-11-09: Nachtarbeit eingerichtet. GitHub-Ablauf liefert den Kartentext aller 877 Karten der Top-Decks; 506 davon noch ohne Prüfdatei.
- 2026-11-10: Regression grün. 100 Karten geprüft (85 schon automatisch), 13 eingebaut (Azusa, Boomerang Basics, Damnation, Day's Undoing, Abhorrent Oculus, Archon of Cruelty, Basim Ibn Ishaq, Celestial Colonnade, Cephalid Coliseum, Cling to Dust, Crystal Barricade, Cultivator Colossus, Dalkovan Encampment). Lücke Ainok/Winota erledigt. Nebenbei: Timetwister/Day's Undoing zogen 14 statt 7; «if it's a … card» prüfte das Wort «card» mit. Version 2026.11.10-1.
- 2026-11-11: Regression grün. 100 Karten geprüft (94 schon automatisch, 2 ohne Text), 4 eingebaut (Fallaji Archaeologist, Golos, Field of Ruin, Duskwatch Recruiter; dafür neu: Zauber aller Spieler pro Zug gemerkt). Lücke Convoke aus dem Exil geprüft (lief schon, Tests ergänzt). Version 2026.11.11-1.
- 2026-11-12: Regression grün. 100 Karten geprüft (90 schon automatisch, 1 ohne Text), 8 eingebaut (Oliphaunt, Kraul Harpooner, Inevitable Betrayal, Living End, Oblivion Stone, Narset, Parter of Veils, Karn, Argent Defender; dazu Ziele «with flying» u. ä. gefiltert, KI-Karten zeigen ihre Schlüsselwörter). Offen: Harbinger of the Seas, Hanweir Battlements (Meld). Lücke March-Zyklus erledigt. Scryfall-WebFetch war nicht freigegeben (Text kam aus oracle_decks.json). Version 2026.11.12-1.
- 2026-11-13: Regression grün. 100 Karten geprüft (88 schon automatisch, 3 ohne Text), 9 eingebaut (Persist, Requiting Hex, Roiling Canopy, Sanctifier en-Vec, Scion of Draco, Seasoned Pyromancer, Seasoned Cryomancer, Shadowspear, Portent of Calamity; dazu neu: abgeworfene Karten werden für «discarded this way» gemerkt, Blight als freiwillige Zusatzkosten). Text aus oracle_decks.json (Stand 11.11.). Version 2026.11.13-1.
- 2026-11-14: Regression grün. 106 Karten geprüft (alle restlichen der Top-Decks; 89 schon automatisch, 5 ohne Text), 12 eingebaut (Stubborn Denial, The Endstone, The Mind Stone, The Wandering Emperor, Thrun, Twinned Vision, Violent Urge, Thraben Charm, Valakut Awakening, Vizier of Remedies, Wish, Superior Spider-Man; dazu neu: Bedingungen «with power N or greater», «wasn't cast from your hand» und Delirium vor einem Satz, Devoted Druid legt seine -1/-1-Marke als Kosten). Keine Lücke angefasst (alle offenen betreffen Stapel/Zugablauf). Text aus oracle_decks.json. Version 2026.11.14-1.
