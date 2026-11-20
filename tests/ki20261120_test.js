// KI verbessern (20.11.2026): Blocken und Angreifen mit Erstschlag, Doppelschlag, Todesberührung, Trampelschaden
const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').replace(/<script src=[^>]+><\/script>/, '').replace(/<link[^>]+>/g, '');
const dom = new JSDOM(html, {url:'https://x.org/', runScripts:'dangerously', pretendToBeVisual:true, beforeParse(w){ w.fetch = async () => ({ok:false, json: async () => ({})}); }});
const w = dom.window, d = w.document, $ = s => d.querySelector(s), ev = c => w.eval(c);
w.addEventListener('error', e => console.log('ERR', e.message));
let fails = 0; const check = (ok, msg) => { console.log((ok ? 'OK     ' : 'FEHLER ') + msg); if(!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  $('#lName').value = 'Lukas'; $('#lSolo').click(); await wait(30); ev('closeModal()');
  ev('startBot("Test", "Test", Array(30).fill(0).map(() => ({n:"Island", type:"Basic Land — Island", o:""})))'); ev('injectBot(); commit()'); await wait(30);
  const mine = (n, pw, tg, kw = []) => { w.__c = ev(`newCard({n:${JSON.stringify(n)}, type:"Creature — Test", o:"", pw:${pw}, tg:${tg}, img:null})`); w.__c.kw = kw; ev('S.bf.push(window.__c)'); return w.__c; };
  const bot = (n, pw, tg, kw = []) => { w.__c = ev(`newCard({n:${JSON.stringify(n)}, type:"Creature — Test", o:"", pw:${pw}, tg:${tg}, img:null})`); w.__c.kw = kw; ev('BOT.bf.push(window.__c)'); return w.__c; };
  const reset = () => ev('S.bf = []; BOT.bf = []; BOT.life = 20; botChanged()');
  const blocks = atk => { w.__a = atk; const m = ev('withBot("bot", () => botChooseBlocks(window.__a))'); return atk.map(a => (m.get(a.u) || {}).n || '-').join(','); };
  // blockOutcome
  reset(); { const a = mine('Erst', 2, 2, ['First strike']), b = bot('Bär', 2, 2); w.__a = a; w.__b = b;
    check(JSON.stringify(ev('blockOutcome(window.__a, window.__b)')) === '{"aDead":false,"bDead":true}', 'Erstschlag 2/2 gegen 2/2: nur der Blocker stirbt'); }
  reset(); { const a = mine('Doppel', 2, 2, ['Double strike']), b = bot('Grosser', 3, 3); w.__a = a; w.__b = b;
    check(JSON.stringify(ev('blockOutcome(window.__a, window.__b)')) === '{"aDead":true,"bDead":true}', 'Doppelschlag 2/2 gegen 3/3: beide sterben'); }
  reset(); { const a = mine('Riese', 5, 5), b = bot('Gift', 1, 1, ['Deathtouch']); w.__a = a; w.__b = b;
    check(JSON.stringify(ev('blockOutcome(window.__a, window.__b)')) === '{"aDead":true,"bDead":true}', 'Todesberührung 1/1 gegen 5/5: beide sterben'); }
  reset(); { const a = mine('Riese', 5, 5), b = bot('Gift', 1, 1, ['Deathtouch', 'First strike']); w.__a = a; w.__b = b;
    check(JSON.stringify(ev('blockOutcome(window.__a, window.__b)')) === '{"aDead":true,"bDead":false}', 'Todesberührung mit Erstschlag: Blocker überlebt'); }
  // Blocken: kein Tausch gegen Erstschlag
  reset(); { const a = mine('Erst', 2, 2, ['First strike']); bot('Bär', 2, 2);
    check(blocks([a]) === '-', `KI blockt Erstschlag-2/2 nicht mit einem 2/2 (${blocks([a])})`); }
  reset(); { const a = mine('Bär', 2, 2); bot('Erst', 2, 2, ['First strike']);
    check(blocks([a]) === 'Erst', 'KI blockt 2/2 mit ihrem Erstschlag-2/2 (gewinnt)'); }
  // Notblock gegen tödlichen Angriff; gegen Trampler zählt nur die Widerstandskraft
  reset(); { ev('BOT.life = 4'); const a = mine('Trampler', 6, 6, ['Trample']), c = mine('Zweiter', 3, 3); bot('Mauer', 0, 5); bot('Wicht', 1, 1);
    const r = blocks([a, c]); check(/Mauer/.test(r) && r !== '-,-', `KI rettet sich mit Notblocks (${r})`); }
  // Angreifen: nicht in einen Erstschlag-Blocker
  reset(); { ev('BOT.life = 20; S.life = 20'); const b = bot('Bär', 2, 2); mine('Erst', 2, 2, ['First strike']); b.sick = false;
    const atk = ev('withBot("bot", () => botChooseAttackers(botDefenders()[0]).map(c => c.n).join())');
    check(!/Bär/.test(atk || ''), `KI greift nicht mit 2/2 in einen Erstschlag-2/2 (${atk})`); }
  reset(); { ev('BOT.life = 20; S.life = 20'); const b = bot('Bär', 3, 3); mine('Klein', 2, 2); b.sick = false;
    const atk = ev('withBot("bot", () => botChooseAttackers(botDefenders()[0]).map(c => c.n).join())');
    check(/Bär/.test(atk || ''), `Gegenprobe: KI greift mit 3/3 gegen einen 2/2 an (${atk})`); }
  console.log(fails ? `${fails} FEHLER` : 'ALLES OK'); process.exit(0);
})();
