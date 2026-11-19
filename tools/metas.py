#!/usr/bin/env python3
"""Holt Top-16-Decks aus dem Netz und schreibt sie im Format von decks/*.txt (siehe tools/build.py).

Quellen:
    Standard, Pauper:  MTGTop8, Metagame der letzten 2 Wochen. Die 16 grössten Archetypen
                       (ohne «Other»), pro Archetyp die bestplatzierte der neuesten Listen.
    Bracket 3 und 4:   EDHREC, die beliebtesten Commander (letzter Monat, nur Einzel-Commander),
                       davon die Durchschnittsdecks auf Bracket 3 («upgraded») bzw. 4 («optimized»).

Läuft im GitHub-Ablauf .github/workflows/metas.yml (dort gibt es Netz). Schreibt nur Dateien,
bei denen alles stimmt (16 Decks, richtige Kartenzahl); sonst bleibt die alte Datei.

Aufruf:  python3 tools/metas.py                 # alle
         python3 tools/metas.py pauper bracket3 # nur diese
"""
import html, json, pathlib, re, sys, time, urllib.request, datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
HEAD = {"User-Agent": "KuechentischMTG/1.0 (github.com/LALordi97/Kuechentisch-MTG)"}
MTGTOP8 = {"standard": "ST", "pauper": "PAU"}
BRACKETS = {"bracket3": "upgraded", "bracket4": "optimized"}


def get(url, tries=3):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=HEAD), timeout=60) as r:
                data = r.read().decode("utf-8", "replace")
            time.sleep(0.6)
            return data
        except Exception as e:
            print(f"  Fehler {url}: {e}")
            time.sleep(3 * (i + 1))
    return None


def strip(s):
    return html.unescape(re.sub(r"<[^>]+>", " ", s)).strip()


def count(lines):
    return sum(int(m.group(1)) if (m := re.match(r"^(\d+)\s+", l)) else 1 for l in lines)


# ---------- MTGTop8 ----------
def top8_archetypes(f):
    page = get(f"https://www.mtgtop8.com/format?f={f}")
    if not page:
        return []
    out = []
    for m in re.finditer(r"archetype\?a=(\d+)&(?:amp;)?meta=(\d+)&(?:amp;)?f=" + f + r"[^>]*>(.*?)</a>(.{0,400}?)>\s*(\d+(?:\.\d+)?)\s*%\s*<", page, re.S):
        name = strip(m.group(3))
        if not name or name.lower().startswith("other"):
            continue
        if any(o["a"] == m.group(1) for o in out):
            continue
        out.append({"a": m.group(1), "meta": m.group(2), "n": name, "p": float(m.group(5))})
    out.sort(key=lambda o: -o["p"])
    print(f"{f}: {len(out)} Archetypen gefunden: " + ", ".join(f"{o['n']} {o['p']}%" for o in out[:20]))
    return out


def top8_best_deck(f, arch):
    page = get(f"https://www.mtgtop8.com/archetype?a={arch['a']}&meta={arch['meta']}&f={f}")
    if not page:
        return None
    rows = []
    for tr in re.split(r"<tr", page)[1:]:
        dm = re.search(r"event\?e=(\d+)&(?:amp;)?d=(\d+)&(?:amp;)?f=" + f, tr)
        if not dm:
            continue
        tds = [strip(t) for t in re.findall(r"<td[^>]*>(.*?)</td>", tr, re.S)]
        rank = next((t for t in tds if re.fullmatch(r"\d+(?:-\d+)?", t)), None)
        date = next((t for t in tds if re.fullmatch(r"\d\d/\d\d/\d\d", t)), None)
        ev = re.search(r"event\?e=" + dm.group(1) + r"&(?:amp;)?f=" + f + r"[^>]*>(.*?)</a>", tr, re.S)
        rows.append({"d": dm.group(2), "rank": rank, "date": date, "event": strip(ev.group(1)) if ev else ""})
    if not rows:
        print(f"  {arch['n']}: keine Decklisten gefunden"); return None
    rows = rows[:25]  # die neuesten
    best = min(rows, key=lambda r: int(re.match(r"\d+", r["rank"]).group(0)) if r["rank"] else 99)
    txt = get(f"https://www.mtgtop8.com/mtgo?d={best['d']}")
    if not txt:
        return None
    main, side, sb = [], [], False
    for line in txt.splitlines():
        line = line.strip()
        if not line:
            if main:
                sb = True
            continue
        if line.lower().startswith("sideboard"):
            sb = True; continue
        if not re.match(r"^\d+\s+\S", line):
            continue
        (side if sb else main).append(line)
    n, s = count(main), count(side)
    if n not in (60, 61, 80) or s > 15:
        print(f"  {arch['n']}: Deck {best['d']} hat {n}/{s} Karten – übersprungen"); return None
    d = best["date"] or ""
    when = f"{d[0:2]}.{d[3:5]}.{d[6:8]}" if d else ""
    rank = (best["rank"] or "?").replace("-", ".–")
    src = ", ".join(x for x in [best["event"] or "MTGTop8", f"{rank}. Platz", when] if x)
    share = f"{arch['p']:g}%".replace(".", ",")
    body = "\n".join(main) + ("\n\nSideboard\n" + "\n".join(side) if side else "")
    return f"### {arch['n']} | {share} | {src}\n{body}\n"


def build_top8(key):
    f = MTGTOP8[key]
    blocks = []
    for arch in top8_archetypes(f):
        if len(blocks) == 16:
            break
        b = top8_best_deck(f, arch)
        if b:
            blocks.append(b); print(f"  ok: {arch['n']}")
    return blocks


# ---------- EDHREC ----------
def ejson(path):
    t = get("https://json.edhrec.com/pages/" + path)
    try:
        return json.loads(t) if t else None
    except json.JSONDecodeError:
        print(f"  kein JSON: {path}"); return None


def edhrec_commanders():
    j = ejson("commanders/month.json")
    if not j:
        return []
    views = []
    def walk(o):
        if isinstance(o, dict):
            if "sanitized" in o and "name" in o and ("num_decks" in o or "inclusion" in o):
                views.append(o)
            for v in o.values(): walk(v)
        elif isinstance(o, list):
            for v in o: walk(v)
    walk(j)
    seen, out = set(), []
    for v in views:
        s = v["sanitized"]
        if s in seen:
            continue
        seen.add(s); out.append(v)
    print(f"EDHREC: {len(out)} Commander, z. B. " + ", ".join(v["name"] for v in out[:10]))
    if not out:
        print("  Schlüssel:", list(j.keys())[:20])
    return out


def edhrec_avg(cmd, bracket):
    j = ejson(f"average-decks/{cmd['sanitized']}/{bracket}.json")
    if not j:
        return None
    deck = j.get("deck")
    if not isinstance(deck, dict) or not isinstance(deck.get("cards"), dict):
        print(f"  {cmd['name']}: keine Liste"); return None
    cmdrs = [str(x) for x in (deck.get("commander") or [cmd["name"]])]
    lines = []
    for group in deck["cards"].values():
        for e in group:
            if isinstance(e, list) and len(e) >= 2 and str(e[0]) not in cmdrs:
                lines.append(f"{int(e[1])} {e[0]}")
    n = count(lines) + len(cmdrs)
    if n != 100:
        print(f"  {cmd['name']}: {n} Karten – übersprungen"); return None
    b = {"upgraded": "3", "optimized": "4"}[bracket]
    num = int((j.get("bracket_counts") or {}).get(b) or 0)
    return {"name": " / ".join(cmdrs), "num": num, "body": "Commander\n" + "\n".join(cmdrs) + "\n\nDeck\n" + "\n".join(lines)}


def build_bracket(key):
    br = BRACKETS[key]
    cands = edhrec_commanders()[:60]
    decks = []
    for c in cands:
        d = edhrec_avg(c, br)
        if d:
            decks.append(d); print(f"  ok: {d['name']} ({d['num']} Decks)")
    decks.sort(key=lambda d: -d["num"])
    decks = decks[:16]
    total = sum(d["num"] for d in decks) or 1
    today = datetime.date.today().strftime("%d.%m.%y")
    lab = {"upgraded": "Bracket 3", "optimized": "Bracket 4"}[br]
    return [f"### {d['name']} | {(100 * d['num'] / total):.1f}%".replace(".", ",") + f" | EDHREC Durchschnittsdeck {lab}, {d['num']} Decks, {today}\n{d['body']}\n" for d in decks]


def debug():
    page = get("https://www.mtgtop8.com/format?f=PAU") or ""
    i = page.find("archetype?a=")
    print("FORMAT-HTML:", repr(page[max(0, i - 700):i + 900]))
    page = get("https://www.mtgtop8.com/archetype?a=512&f=PAU") or ""
    i = page.find("&d=")
    print("ARCH-HTML:", repr(page[max(0, i - 900):i + 900]))
    j = ejson("average-decks/atraxa-praetors-voice/upgraded.json") or {}
    print("EDH-KEYS", list(j.keys()))
    for k, v in j.items():
        if k in ("creature", "instant", "sorcery", "artifact", "enchantment", "battle", "planeswalker", "land", "basic", "nonbasic", "bracket_counts", "budget_counts", "tag_counts", "savedate_counts"):
            continue
        print("EDH", k, type(v).__name__, json.dumps(v)[:1500])


def main():
    if "--debug" in sys.argv:
        debug(); return
    want = [a for a in sys.argv[1:] if not a.startswith("-")] or ["standard", "pauper", "bracket3", "bracket4"]
    bad = 0
    for key in want:
        print(f"== {key}")
        blocks = build_top8(key) if key in MTGTOP8 else build_bracket(key)
        if len(blocks) != 16:
            print(f"WARNUNG: {key}: nur {len(blocks)} Decks – Datei bleibt unverändert"); bad += 1; continue
        (ROOT / "decks" / f"{key}.txt").write_text("\n".join(blocks), encoding="utf-8")
        print(f"{key}: 16 Decks geschrieben")
    sys.exit(1 if bad == len(want) else 0)


if __name__ == "__main__":
    main()
