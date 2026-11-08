#!/bin/bash
# Regression: Lint zuerst; normale Tests parallel, danach zeitkritische Mehrspieler-Tests allein nacheinander
cd "$(dirname "$0")"
P=${P:-2}
node lint.js || { echo "LINT FEHLGESCHLAGEN – Tests abgebrochen" > reg.out; cat reg.out; exit 1; }
mkdir -p regres; rm -f regres/*
run(){ f="$1"; s=$(date +%s); o=$(timeout 120 node "$f" 2>&1); n="${f%_test.js}"; d=$(( $(date +%s) - s ));
  if [[ $f == chk* ]]; then echo "$n: $(echo "$o" | sed -n 2p)" > "regres/$n";
  else pr=$(echo "$o" | grep -c 'FEHLER\|^ERR\|TypeError\|ReferenceError');
    if grep -q "ALLES OK" "$f" && ! echo "$o" | grep -q "ALLES OK\|FEHLER"; then pr=$((pr+1)); echo "$n: $(echo "$o" | grep -c '^OK') ok, UNVOLLSTÄNDIG nach ${d}s (hängt?) – $pr Probleme" > "regres/$n";
    else echo "$n: $(echo "$o" | grep -c '^OK') ok, $pr Probleme" > "regres/$n"; fi; fi
  echo "$d $n" >> regres/_times; }
export -f run
SERIAL='^(mp|mp_bot|mp_old|req|life)_test\.js$'
ls *_test.js | grep -vE "$SERIAL" | xargs -P "$P" -I{} bash -c 'run {}'
for f in $(ls *_test.js | grep -E "$SERIAL"); do run "$f"; done
cat $(ls regres/* | grep -v _times) > reg.out; echo FERTIG >> reg.out
grep -v " 0 Probleme\|0 teilweise, 0 von Hand\|FERTIG\|^chk: Fähigkeiten-Check Test" reg.out || echo "ALLES GRÜN ($(ls regres | grep -vc _times) Testdateien)"
