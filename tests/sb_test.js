const {JSDOM}=require('jsdom');const fs=require('fs');
let h=fs.readFileSync(require('path').join(__dirname, '..', 'index.html'),'utf8').replace(/<script src=[^>]+><\/script>/,'').replace(/<link[^>]+>/g,'');
const dom=new JSDOM(h,{url:'https://x.org/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){ w.fetch=async(u,o)=>/version/.test(u)?{ok:false}:({ok:true,json:async()=>({data:JSON.parse(o.body).identifiers.map((x,i)=>({name:x.name,set:'a',collector_number:String(i),type_line:/Island|Mountain|Swamp|Plains|Forest/.test(x.name)?'Basic Land':'Creature',power:'1',toughness:'1',cmc:1,image_uris:{normal:'https://cards.scryfall.io/normal/x.jpg'}}))})}); }});
const w=dom.window,d=w.document,$=s=>d.querySelector(s); w.addEventListener('error',e=>console.log('ERR',e.message));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const M=w.eval('META_DECKS'); let bad=0;
 for(const f of ['Modern','Legacy']) for(const dk of M[f]){ const p=w.parseDeck(dk.l,''); const main=p.filter(e=>!e.sb).reduce((a,e)=>a+e.qty,0), sb=p.filter(e=>e.sb).reduce((a,e)=>a+e.qty,0); if(![60,61,80].includes(main)||sb!==15){bad++; console.log('BAD',f,dk.n,main,sb);} }
 console.log('Modern/Legacy geprüft, Fehler:', bad);
 $('#lName').value='Lukas';$('#lSolo').click();await wait(50);
 $('#dFmt').value='Modern';$('#dFmt').dispatchEvent(new w.Event('change'));$('#dMeta').value='0';$('#dUse').click();$('#dGo').click();await wait(1500);
 const S=w.eval('S'); console.log('Rakdos geladen: Spielkarten', S.library.length+S.hand.length, '| Sideboard', S.deck.filter(t=>t.sb).length);
 w.startBot('Test','Modern', S.deck.map(t=>({...t}))); console.log('KI: Bibliothek+Hand', w.eval('BOT.library.length+BOT.hand.length'));
 process.exit(0);
})();
