# Top-Decks aktualisieren

Anleitung für das monatliche Update der eingebauten Top-16-Decks (cEDH, Modern, Legacy). Sie ist so geschrieben, dass eine geplante Aufgabe sie ohne Rückfragen ausführen kann.

## Ablauf

1. Repository klonen, die Dateien in `decks/` lesen.
2. Für jedes Format die aktuellen Top 16 bestimmen (Quellen unten) und je eine vollständige, aktuelle Liste holen.
3. `decks/cedh.txt`, `decks/modern.txt` und `decks/legacy.txt` komplett neu schreiben (Format unten).
4. `python3 tools/build.py --check` ausführen. Jede Warnung beheben (meist eine falsch übertragene Liste); erst wenn alles stimmt, weiter.
5. `python3 tools/build.py --notes "Top-Decks aktualisiert (Monat Jahr)"` ausführen. Das baut die Decks in `index.html` ein und erhöht die Version in `index.html` und `version.json`.
6. Committen und auf `main` pushen. Offene Tische laden sich danach selbst neu.

## Quellen und Auswahl

**Modern und Legacy: MTGTop8**
- Metagame: `https://www.mtgtop8.com/format?f=MO` (Modern) bzw. `?f=LE` (Legacy), Standard-Zeitraum «Last 2 Weeks».
- Die 16 Archetypen mit dem höchsten Anteil nehmen. Bei Gleichstand am Ende das Deck mit der jüngeren Top-Platzierung.
- Pro Archetyp die Archetyp-Seite öffnen und eine aktuelle, möglichst gut platzierte Liste wählen (Sieg oder Top 4 bevorzugt, jüngstes Datum).
- Die Liste als Text: `https://www.mtgtop8.com/mtgo?d=<Deck-ID>`. Nur das Hauptdeck übernehmen (alles vor «Sideboard»).
- Deckname: der Name der gewählten Liste (z. B. «Rakdos Delirium»), bei Bedarf mit Archetyp in Klammern.

**cEDH: EDHTop16**
- Startseite `https://edhtop16.com/` (Zeitraum 6 Monate, ab 20 Einträgen, Turniere ab 50 Spielern), die 16 Commander mit den meisten Einträgen.
- Pro Commander die Commander-Seite öffnen und einen möglichst jungen Turniersieg wählen.
- Die Decklisten-Seite auf edhtop16.com enthält die komplette Liste mit den Commandern.

## Dateiformat

Jedes Deck beginnt mit einer Kopfzeile:

```
### Deckname | Anteil | Turnier, Platz, Datum
```

Modern und Legacy: danach das Hauptdeck, eine Karte pro Zeile mit Anzahl, z. B. `4 Lightning Bolt`. 60 Karten (61 oder 80 nur, wenn die Liste wirklich so gespielt wurde, z. B. mit Yorion).

cEDH: zuerst der Abschnitt `Commander` mit einem oder zwei Commandern, dann eine Leerzeile, dann `Deck` und die übrigen Karten, je eine pro Zeile (Anzahl nur, wenn grösser als 1, z. B. `8 Mountain`). Zusammen genau 100 Karten. Doppelseitige Karten nur mit dem Namen der Vorderseite.

Anteile wie auf der Quelle angeben: Modern/Legacy als ganze Prozent (`14%`), cEDH mit einer Nachkommastelle und Komma (`7,4%`). Datum als `TT.MM.JJ`.

## Wenn etwas nicht klappt

- Ist eine Quelle nicht erreichbar oder liefert keine vollständige Liste: für dieses Deck die bisherige Liste aus `decks/` behalten und im Commit erwähnen.
- Nie raten oder Karten ergänzen, damit die Zahl stimmt.
