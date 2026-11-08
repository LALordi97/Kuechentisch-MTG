const {JSDOM}=require('jsdom');const fs=require('fs');
let h=fs.readFileSync(require('path').join(__dirname, '..', 'index.html'),'utf8').replace(/<script src=[^>]+><\/script>/,'').replace(/<link[^>]+>/g,'');
const dom=new JSDOM(h,{url:'https://x.org/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){ w.fetch=async(u,o)=>{
  if(/archidekt/.test(u)) return {ok:true,json:async()=>({name:'Archi Burn',cards:[{quantity:20,card:{oracleCard:{name:'Mountain'}},categories:['Land']},{quantity:4,card:{oracleCard:{name:'Lightning Bolt'}},categories:['Instant']},{quantity:2,card:{oracleCard:{name:'Smash to Smithereens'}},categories:['Sideboard']},{quantity:1,card:{oracleCard:{name:'Krenko'}},categories:['Maybeboard']}]})};
  if(/moxfield/.test(u)) throw new TypeError('Failed to fetch');
  if(/version/.test(u)) return {ok:false};
  return {ok:true,json:async()=>({data:JSON.parse(o.body).identifiers.map((x,i)=>({name:x.name,set:'a',collector_number:String(i),type_line:/Mountain/.test(x.name)?'Basic Land — Mountain':'Instant',cmc:1,image_uris:{normal:'https://cards.scryfall.io/normal/x.jpg'}}))})};
}; }});
const w=dom.window,d=w.document,$=s=>d.querySelector(s); w.addEventListener('error',e=>console.log('ERR',e.message));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 $('#lName').value='Lukas';$('#lSolo').click();await wait(50);
 $('#dUrl').value='https://moxfield.com/decks/abc123'; $('#dImport').click(); await wait(30); console.log('Moxfield:', $('#dErr').textContent.slice(0,90));
 $('#dUrl').value='https://archidekt.com/decks/12345/burn'; $('#dImport').click(); await wait(30);
 console.log('Archidekt:', $('#dProg').textContent, '| Name', $('#dName').value, '| Liste:', JSON.stringify($('#dText').value));
 $('#dGo').click(); await wait(800);
 const S=w.eval('S'); console.log('Deck', S.deck.length, 'davon SB', S.deck.filter(t=>t.sb).length, '| Bibliothek+Hand', S.library.length+S.hand.length);
 console.log('Gespeichert:', JSON.stringify(w.eval('LS.get("kt-decks",[])').map(x=>x.name)));
 $('#bSide').click(); await wait(20);
 const rows=[...d.querySelectorAll('.sbrow')].map(r=>r.textContent); console.log('SB-Dialog:', rows.join(' | '));
 [...d.querySelectorAll('.sbrow')].find(r=>/Lightning Bolt/.test(r.textContent)).click(); await wait(10);
 [...d.querySelectorAll('.sbrow')].find(r=>/Smash/.test(r.textContent)).click(); await wait(10);
 [...d.querySelectorAll('#modalBox button')].find(b=>b.textContent==='Fertig, neues Spiel starten').click(); await wait(50);
 console.log('Nach Sideboarden: Bolt im Deck', S.deck.filter(t=>t.n==='Lightning Bolt'&&!t.sb).length, 'Smash im Deck', S.deck.filter(t=>t.n==='Smash to Smithereens'&&!t.sb).length, '| Spielkarten', S.library.length+S.hand.length);
 $('#bWin').click(); $('#bLoss').click(); $('#bWin').click(); console.log('Match:', $('#myMatch').textContent);
 // gespeichertes Deck wieder öffnen
 $('#bDeck').click(); await wait(10); $('#dText').value=''; $('#dLoadSaved').click(); console.log('Öffnen füllt Liste:', $('#dText').value.split('\n').length, 'Zeilen');
 process.exit(0);
})();
