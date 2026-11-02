# Küchentisch MTG

Virtueller Magic-Spieltisch im Browser: Decks laden (Kartenbilder von Scryfall), Tisch per Code teilen, 2 Spieler oder Commander zu viert, Stapel mit Priorität, Kampf mit Block-Fenster, Phasen, Sideboard/Best-of-3, KI-Gegner (eingebaut oder mit Claude).

**Spielen:** https://lalordi97.github.io/Kuechentisch-MTG/

## Aufbau

- `index.html` – die ganze App in einer Datei
- `version.json` – aktuelle Version; offene Tische prüfen sie regelmässig und laden sich bei einer neuen Version selbst neu
- `decks/*.txt` – die eingebauten Top-16-Decks pro Format
- `tools/build.py` – baut die Decks in `index.html` ein und erhöht die Version
- `UPDATE_DECKS.md` – Anleitung für das monatliche Deck-Update

## Neue Version veröffentlichen

```
python3 tools/build.py --notes "Was neu ist"
git commit -am "…" && git push
```
