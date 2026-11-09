#!/usr/bin/env python3
"""Holt den Kartentext aller Karten aus decks/*.txt aus den Scryfall-Massendaten (oracle-cards)
und schreibt tests/oracle_decks.json im Format der Prüfdateien:
    ["Name", "Typzeile", "Regeltext", "{Manakosten}", Manawert]
Der Text wird so übernommen, wie die App ihn sieht (wie tpl() in index.html: Vorderseite bei doppelseitigen Karten).

Aufruf:  python3 tools/oracle.py            # lädt die aktuelle Datei von Scryfall
         python3 tools/oracle.py bulk.json  # nimmt eine schon geladene Datei (zum Testen)
"""
import json, pathlib, re, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
HEAD = {"User-Agent": "KuechentischMTG/1.0 (github.com/LALordi97/Kuechentisch-MTG)", "Accept": "application/json"}
BASIC = re.compile(r"^(Snow-Covered )?(Plains|Island|Swamp|Mountain|Forest|Wastes)$", re.I)


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEAD), timeout=300) as r:
        return r.read()


def deck_names():
    names = []
    for f in ("cedh.txt", "modern.txt", "legacy.txt"):
        p = ROOT / "decks" / f
        if not p.exists():
            continue
        for line in p.read_text(encoding="utf8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or line in ("Commander", "Deck", "Sideboard", "Companion"):
                continue
            n = re.sub(r"^\d+x?\s+", "", line)
            n = re.sub(r"\s+\([A-Z0-9]+\)\s*\S*$", "", n).strip()
            if not BASIC.match(n) and n.lower() not in (x.lower() for x in names):
                names.append(n)
    return names


def main():
    if len(sys.argv) > 1:
        cards = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf8"))
    else:
        meta = json.loads(get("https://api.scryfall.com/bulk-data"))
        item = next((b for b in meta.get("data", []) if b.get("type") == "oracle_cards"), None)
        if not item:
            sys.exit("Scryfall-Antwort ohne oracle_cards: " + json.dumps(meta)[:500])
        cards = json.loads(get(item["download_uri"]))
    idx = {}
    for sc in cards:
        if sc.get("layout") in ("token", "double_faced_token", "emblem", "art_series"):
            continue
        keys = [sc.get("name", "")] + [f.get("name", "") for f in (sc.get("card_faces") or [])[:1]]
        for k in keys:
            if k:
                idx.setdefault(k.lower(), sc)
    out, missing = [], []
    for n in deck_names():
        sc = idx.get(n.lower()) or idx.get(n.split(" // ")[0].lower())
        if not sc:
            missing.append(n)
            continue
        f0 = (sc.get("card_faces") or [{}])[0]
        out.append([sc["name"], sc.get("type_line") or f0.get("type_line", ""),
                    (sc.get("oracle_text") or f0.get("oracle_text") or "")[:1500],
                    sc.get("mana_cost") or f0.get("mana_cost") or "", sc.get("cmc") or 0])
    out.sort(key=lambda c: c[0])
    (ROOT / "tests" / "oracle_decks.json").write_text(json.dumps(out, ensure_ascii=False, indent=0) + "\n", encoding="utf8")
    print(f"{len(out)} Karten geschrieben, {len(missing)} nicht gefunden" + (": " + ", ".join(missing) if missing else ""))


if __name__ == "__main__":
    main()
