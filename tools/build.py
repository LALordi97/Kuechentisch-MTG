#!/usr/bin/env python3
"""Baut die eingebauten Top-Decks aus decks/*.txt neu in index.html ein und setzt eine neue Version.

Aufruf (im Repository-Ordner):
    python3 tools/build.py                 # Decks einbauen, Version hochzählen
    python3 tools/build.py --notes "Text"  # mit Hinweis, der in der App beim Update erscheint
    python3 tools/build.py --check         # nur prüfen (Kartenanzahl), nichts schreiben

Format der Deck-Dateien:
    ### Deckname | Anteil | Quelle (Turnier, Platz, Datum)
    4 Lightning Bolt
    ...
cEDH-Decks beginnen mit einem Abschnitt «Commander», danach eine Leerzeile und «Deck».
Modern/Legacy: nach dem Hauptdeck eine Leerzeile, dann «Sideboard» und bis zu 15 Karten.
Erwartet werden 60 Karten im Hauptdeck (Modern/Legacy, Ausnahmen: 61 oder 80 mit Yorion) und 100 Karten (cEDH, ohne Sideboard).
"""
import json, re, sys, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
FORMATS = [("cEDH", "cedh"), ("Modern", "modern"), ("Legacy", "legacy")]
SOURCES = "Modern und Legacy: MTGTop8, Metagame der letzten 2 Wochen · cEDH: EDHTop16, letzte 6 Monate (Turniere ab 50 Spielern)"


def count(body):
    """Liefert (Hauptdeck inkl. Commander, Sideboard)."""
    n, sb, side = 0, 0, False
    for line in body.splitlines():
        line = line.strip()
        if not line or line in ("Commander", "Deck"):
            continue
        if line.lower() == "sideboard":
            side = True
            continue
        m = re.match(r"^(\d+)\s+", line)
        k = int(m.group(1)) if m else 1
        if side:
            sb += k
        else:
            n += k
    return n, sb


def load():
    out, problems = {}, []
    for key, fn in FORMATS:
        txt = (ROOT / "decks" / f"{fn}.txt").read_text(encoding="utf-8")
        decks = []
        for block in txt.split("### ")[1:]:
            head, _, body = block.partition("\n")
            parts = [s.strip() for s in head.split("|")]
            if len(parts) != 3:
                problems.append(f"{key}: Kopfzeile ungültig: {head!r}")
                continue
            name, share, src = parts
            body = body.strip()
            n, sb = count(body)
            ok = (n == 100 and sb == 0) if key == "cEDH" else (n in (60, 61, 80) and sb <= 15)
            if not ok:
                problems.append(f"{key}: «{name}» hat {n} Karten im Hauptdeck und {sb} im Sideboard")
            elif key != "cEDH" and sb != 15:
                print(f"Hinweis: {key} «{name}» hat {sb} Sideboard-Karten")
            decks.append({"n": name, "p": share, "s": src, "l": body})
        if len(decks) != 16:
            problems.append(f"{key}: {len(decks)} statt 16 Decks")
        out[key] = decks
    return out, problems


def main():
    decks, problems = load()
    for p in problems:
        print("WARNUNG:", p)
    for key, _ in FORMATS:
        print(f"{key}: {len(decks[key])} Decks")
    if "--check" in sys.argv:
        sys.exit(1 if problems else 0)
    if problems and "--force" not in sys.argv:
        print("Abbruch wegen Warnungen (mit --force trotzdem bauen).")
        sys.exit(1)
    today = datetime.date.today()
    months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]
    stand = f"Stand {today.day}. {months[today.month - 1]} {today.year}"
    block = ("const META_DECKS = " + json.dumps(decks, ensure_ascii=False, separators=(",", ":")) + ";\n"
             + f"const META_INFO = {json.dumps(stand + ' · ' + SOURCES, ensure_ascii=False)};")
    idx = ROOT / "index.html"
    html = idx.read_text(encoding="utf-8")
    html = re.sub(r"/\*META_START\*/\n.*?\n/\*META_END\*/", lambda m: "/*META_START*/\n" + block + "\n/*META_END*/", html, flags=re.S)
    # Version: Datum plus laufende Nummer
    old = re.search(r'const APP_VERSION = "([^"]+)";', html).group(1)
    base = today.strftime("%Y.%m.%d")
    num = int(old.split("-")[1]) + 1 if old.startswith(base + "-") else 1
    ver = f"{base}-{num}"
    html = html.replace(f'const APP_VERSION = "{old}";', f'const APP_VERSION = "{ver}";')
    idx.write_text(html, encoding="utf-8")
    notes = sys.argv[sys.argv.index("--notes") + 1] if "--notes" in sys.argv else "Neue Version"
    (ROOT / "version.json").write_text(json.dumps({"version": ver, "notes": notes}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Version {old} → {ver}")


if __name__ == "__main__":
    main()
