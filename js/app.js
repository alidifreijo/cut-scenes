(function(){
"use strict";
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const FW=1500,FH=1000;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

/* clock */
const fmtClock=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
function tick(){$('#clock').textContent=fmtClock.format(new Date());}tick();setInterval(tick,1000);

/* fit display type to container width */
function fitAll(){document.querySelectorAll('[data-fit]').forEach(el=>{
  if(el.closest('[hidden]'))return;const pe=el.parentElement,pcs=getComputedStyle(pe);const box=pe.clientWidth-parseFloat(pcs.paddingLeft)-parseFloat(pcs.paddingRight);if(!box)return;
  el.style.transform='none';el.style.marginBottom='0';el.style.fontSize='100px';
  const w=el.getBoundingClientRect().width;if(w)el.style.fontSize=(100*box/w*.995)+'px';
  const hero=el.closest('.hero'),foot=hero&&hero.querySelector('.hero-foot');const k=el.dataset.fit==='vh'?clamp(((hero?hero.clientHeight:window.innerHeight*.8)-(foot?foot.offsetHeight:0)-36)/Math.max(1,el.offsetHeight),.75,3.4):(parseFloat(el.dataset.fit)||1);if(k!==1){const h=el.offsetHeight;el.style.transformOrigin='left top';el.style.transform='scaleY('+k+')';el.style.marginBottom=(h*(k-1))+'px';}});}
let fitT;window.addEventListener('resize',()=>{clearTimeout(fitT);fitT=setTimeout(fitAll,80);});

/* ---------- catalogue: real stills ---------- */
const STILLS={
  "charade": "stills/charade.jpg",
  "kaguya": "stills/kaguya.jpg",
  "call": "stills/call.jpg",
  "royal": "stills/royal.jpg",
  "intime": "stills/intime.jpg"
};
const CATALOG=[
  {id:"charade",type:"film",meta:{title:"Charade",year:"1963",genre:"Romantic thriller",dir:"Stanley Donen",run:"113 min",line:"Cary Grant and Audrey Hepburn being charming while everyone around them dies. <em>Priorities.</em>"}},
  {id:"kaguya",type:"film",meta:{title:"The Tale of the Princess Kaguya",year:"2013",genre:"Animation",dir:"Isao Takahata",run:"137 min",line:"Drawn in charcoal and heartbreak. <em>Bring tissues.</em>"}},
  {id:"call",type:"film",meta:{title:"The Call",year:"2020",genre:"Thriller",dir:"Lee Chung-hyun",run:"112 min",line:"Two women, one phone line, twenty years apart. <em>Still better reception than yours.</em>"}},
  {id:"royal",type:"film",meta:{title:"The Royal Hotel",year:"2023",genre:"Thriller",dir:"Kitty Green",run:"91 min",line:"Two backpackers take a bar job in the Outback. <em>Every man there is a red flag.</em>"}},
  {id:"intime",type:"film",meta:{title:"In Time",year:"2011",genre:"Sci-fi",dir:"Andrew Niccol",run:"109 min",line:"Time is literally money. <em>Capitalism, minus the subtlety.</em>"}},
];

/* accent from frame */
function lum(r,g,b){const f=c=>{c/=255;return c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4);};return .2126*f(r)+.7152*f(g)+.0722*f(b);}
function contrast(a,b){const L1=lum(...a),L2=lum(...b);return(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);}
const hex=c=>'#'+c.map(v=>Math.round(clamp(v,0,255)).toString(16).padStart(2,'0')).join('');
function accentOf(canvas){
  const s=document.createElement('canvas');s.width=60;s.height=40;const x=s.getContext('2d',{willReadFrequently:true});x.drawImage(canvas,0,0,60,40);
  const d=x.getImageData(0,0,60,40).data;const B=Array.from({length:12},()=>({w:0,r:0,g:0,b:0}));
  for(let i=0;i<d.length;i+=4){const r=d[i]/255,g=d[i+1]/255,b=d[i+2]/255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,dl=mx-mn;if(!dl)continue;
    const s2=dl/(1-Math.abs(2*l-1));if(s2<.35||l<.16||l>.86)continue;let h;if(mx===r)h=((g-b)/dl)%6;else if(mx===g)h=(b-r)/dl+2;else h=(r-g)/dl+4;h=(h*60+360)%360;
    const w=s2*(1-Math.abs(l-.55));const k=Math.floor(h/30)%12;B[k].w+=w;B[k].r+=d[i]*w;B[k].g+=d[i+1]*w;B[k].b+=d[i+2]*w;}
  const top=B.reduce((a,b)=>b.w>a.w?b:a);const c=top.w?[top.r/top.w,top.g/top.w,top.b/top.w]:[47,122,62];
  let p=c.slice();let n=0;while(contrast(p,[255,255,255])<4.6&&n++<40)p=p.map(v=>v*.92);
  let q=c.slice();n=0;while(contrast(q,[10,10,10])<7&&n++<40)q=q.map(v=>v+(255-v)*.12);
  const tint=p.map(v=>255-(255-v)*.08);
  return{paper:hex(p),screen:hex(q),tint:hex(tint),hair:'rgba('+p.map(Math.round).join(',')+',.28)'};
}
function applyAccent(a){return;const s=document.documentElement.style;s.setProperty('--accent',a.paper);s.setProperty('--accent-screen',a.screen);s.setProperty('--tint',a.tint);s.setProperty('--hair',a.hair);}

/* state */
const CUTS={easy:{n:12,name:'Easy'},difficult:{n:24,name:'Difficult'},extreme:{n:48,name:'Extreme',noSlots:true}};
function gridFor(n,A){let best=null;for(let r=1;r<=n;r++){if(n%r)continue;const c=n/r,score=Math.abs(Math.log(A*r/c));if(!best||score<best.s)best={r,c,s:score};}return{rows:best.r,cols:best.c};}
const st={frames:[],sel:0,upload:null,cut:'easy',hidden:false,surprise:false,gift:null,queue:[]};
const current=()=>st.sel==='upload'?st.upload:st.frames[st.sel];
function finishFrame(c,obj){
  obj.canvas=c;obj.aspect=c.width/c.height;obj.full=obj.full||c.toDataURL('image/jpeg',.9);
  const t=document.createElement('canvas');t.width=900;t.height=Math.round(900/obj.aspect);t.getContext('2d').drawImage(c,0,0,t.width,t.height);try{obj.thumb=t.toDataURL('image/jpeg',.86);obj.accent=accentOf(c);}catch(e){obj.thumb=obj.full;}return obj;
}

/* views */
const views=['home','play','create','ticket','review'];
/* real pages: every view gets a history entry, so the browser's back button works */
let navDepth=0,fromPop=false,homeAnchor=null;
function show(v,anchor){
  if(!fromPop){
    if(v==='home'&&navDepth>0){homeAnchor=anchor||null;const n=navDepth;navDepth=0;history.go(-n);return;}
    if(v!=='home'){if(history.state&&history.state.v===v)history.replaceState({v},'');else{history.pushState({v},'');navDepth++;}}
  }
  views.forEach(n=>{$('#v-'+n).hidden=n!==v;});
  const full=v==='play'||v==='ticket';$('#foot').hidden=full;document.body.classList.toggle('playing',full);document.body.classList.toggle('in-play',v==='play');document.documentElement.style.overflow=full?'hidden':'';
  if(v!=='play'){stopTimer();closeScore();}
  requestAnimationFrame(()=>{fitAll();if(anchor){const el=$(anchor);if(el)el.scrollIntoView({block:'start'});}else window.scrollTo({top:0,behavior:'auto'});});
}

/* filters: format (film / TV) and genre */
const FIL={type:'all',genre:'all'};
function genreOf(f){const w=f.meta.genre.split(/[ ,]/).pop();return w[0].toUpperCase()+w.slice(1);}
function renderFilters(){
  const mk=(box,key,vals)=>{box.innerHTML='';vals.forEach(([v,l])=>{const b=document.createElement('button');b.type='button';b.className='chip-f';b.textContent=l;b.setAttribute('aria-pressed',String(FIL[key]===v));
    b.addEventListener('click',()=>{FIL[key]=v;renderFilters();applyFilters();});box.appendChild(b);});};
  const lab=(box,t)=>{const sp=document.createElement('span');sp.className='mono';sp.textContent=t;box.prepend(sp);
    /* the same options as a native select, shown on phones */
    const key=box.id==='f-type'?'type':'genre',wrap=document.createElement('label');wrap.className='fsel';
    const sel=document.createElement('select');sel.setAttribute('aria-label',t);
    [...box.querySelectorAll('.chip-f')].forEach((b,k)=>{const o=document.createElement('option');o.value=k;o.textContent=t+': '+b.textContent;if(b.getAttribute('aria-pressed')==='true')o.selected=true;sel.appendChild(o);});
    sel.addEventListener('change',()=>box.querySelectorAll('.chip-f')[+sel.value].click());wrap.appendChild(sel);box.appendChild(wrap);};
  mk($('#f-type'),'type',[['all','All'],['film','Films'],['tv','TV']]);lab($('#f-type'),'Format');
  const gs=[...new Set(st.frames.map(genreOf))].sort();mk($('#f-genre'),'genre',[['all','All'],...gs.map(g=>[g,g])]);lab($('#f-genre'),'Genre');
}
function applyFilters(){
  let shown=0;document.querySelectorAll('#films .film[data-i]').forEach(el=>{const f=st.frames[+el.dataset.i];const ok=(FIL.type==='all'||f.type===FIL.type)&&(FIL.genre==='all'||genreOf(f)===FIL.genre);el.hidden=!ok;if(ok)shown++;});
  let em=$('#empty');if(!shown){if(!em){em=document.createElement('div');em.id='empty';em.className='empty';$('#films').prepend(em);}
    em.innerHTML='<p class="big">'+(FIL.type==='tv'?'No TV yet.':'Nothing here.')+'</p><p class="mono">'+(FIL.type==='tv'?'Binge something else. Series arrive with the catalogue.':'Try another genre. Or lower your standards.')+'</p>';}
  else if(em)em.remove();
}

/* home grid */
function renderGrid(){
  const box=$('#films');box.innerHTML='';
  st.frames.forEach((f,i)=>{
    const b=document.createElement('button');b.type='button';b.className='film';b.style.setProperty('--d',(i*.12)+'s');
    b.setAttribute('aria-label',f.meta.title+', '+f.meta.year);
    b.innerHTML='<img alt="" src="'+f.thumb+'"><span class="chip mono"></span><span class="hovertitle" aria-hidden="true"></span>';
    b.querySelector('.chip').textContent=f.meta.title+' — '+f.meta.year;if(f.community)b.insertAdjacentHTML('beforeend','<span class="chip-c mono">Community</span>');b.querySelector('.hovertitle').textContent=f.meta.title;
    b.addEventListener('mouseenter',()=>applyAccent(f.accent));
    b.addEventListener('focus',()=>applyAccent(f.accent));
    b.dataset.i=i;b.addEventListener('click',()=>playFilm(i));box.appendChild(b);
  });
  const sp=document.createElement('button');sp.type='button';sp.className='film surprise';sp.style.setProperty('--d',(st.frames.length*.12)+'s');
  sp.innerHTML='<span class="q" aria-hidden="true">?</span><span class="mono">Surprise me</span><span class="mono" style="opacity:.6">Title classified until the end</span>';
  sp.setAttribute('aria-label','Surprise puzzle');sp.addEventListener('click',surprise);box.appendChild(sp);
  const ff=$('#foot-films');ff.innerHTML='';st.frames.forEach((f,i)=>{const li=document.createElement('li');const a=document.createElement('button');a.type='button';a.className='linkish';a.textContent=f.meta.title;a.addEventListener('click',()=>playFilm(i));li.appendChild(a);ff.appendChild(li);});
}
$('#films').addEventListener('mouseleave',()=>{applyAccent(current().accent);});
function loadStill(file,cb){
  if(!file||!file.type.startsWith('image/')){toast("That's not an image. Nice try.");return;}
  const rd=new FileReader();rd.onload=()=>{const img=new Image();img.onload=()=>{
    const A=clamp(img.width/img.height,1.2,2.4),CW=1500,CH=Math.round(1500/A);const c=document.createElement('canvas');c.width=CW;c.height=CH;const x=c.getContext('2d',{willReadFrequently:true});
    const s=Math.max(CW/img.width,CH/img.height),w=img.width*s,h=img.height*s;x.drawImage(img,(CW-w)/2,(CH-h)/2,w,h);
    cb(finishFrame(c,{id:'upload',type:'film',meta:{title:'Home Movie',year:String(new Date().getFullYear()),genre:'Found footage',dir:'',run:'As long as it takes',line:'Shot on a phone. <em>Still more coherent than most sequels.</em>'}}));};img.src=rd.result;};rd.readAsDataURL(file);
}

/* frames from URLs (catalogue in the repo, uploads in Supabase Storage) */
function frameFromUrl(url,obj){return new Promise((res,rej)=>{const im=new Image();if(/^https?:/.test(url))im.crossOrigin='anonymous';
  im.onload=()=>{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);obj.full=url;obj.remoteUrl=/^https?:/.test(url)?url:null;res(finishFrame(c,obj));};
  im.onerror=()=>rej(new Error('Image failed: '+url));im.src=url;});}
function frameFromRow(r){return frameFromUrl(r.image_url,{id:r.id,dbId:r.id,type:r.kind,community:r.community,spotify:r.spotify||null,
  meta:{title:r.title,year:r.year||String(new Date(r.created_at).getFullYear()),genre:r.genre||'Community',dir:r.director||'',run:r.runtime||'One frame',
    line:r.community?(r.line?esc(r.line):r.note?esc(r.note):'Submitted by a stranger. <em>Approved by us.</em>'):(r.line||'')}});}
async function loadCatalogue(){
  try{const rows=await DB.films();const out=await Promise.all(rows.map(r=>frameFromRow(r).catch(()=>null)));return out.filter(Boolean);}
  catch(e){console.warn('Supabase unavailable, using the local catalogue',e);
    return Promise.all(CATALOG.map(f=>frameFromUrl(STILLS[f.id],{id:f.id,type:f.type,meta:f.meta})));}
}
async function refreshCatalogue(){st.frames=await loadCatalogue();renderGrid();renderFilters();applyFilters();updateReels();$('#films').classList.add('in');}

/* entering a puzzle */
function playFilm(i){st.sel=i;st.hidden=false;st.surprise=false;st.gift=null;startPuzzle();}
function surprise(){st.sel=Math.floor(Math.random()*st.frames.length);st.hidden=true;st.surprise=true;st.gift=null;startPuzzle();}
document.querySelectorAll('[data-level]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.level===st.cut&&P&&!P.done)return;st.cut=b.dataset.level;startPuzzle();}));

/* ---------- custom dropdowns ---------- */
function makeListbox(root,{options,onPick,input}){
  const list=root.querySelector('.dd-list'),btn=root.querySelector('.dd-btn')||root.querySelector('.dd-chev');let act=-1;
  const items=()=>[...list.querySelectorAll('li')];
  const open=o=>{list.hidden=!o;(input||btn).setAttribute('aria-expanded',String(o));if(!o){act=-1;items().forEach(li=>li.classList.remove('active'));}};
  const render=q=>{if(!options)return;const f=options.filter(o=>!q||o.toLowerCase().includes(q.toLowerCase()));
    list.innerHTML=f.map(o=>'<li role="option" data-v="'+esc(o)+'">'+esc(o)+'</li>').join('');act=-1;return f.length;};
  const move=d=>{const it=items();if(!it.length)return;act=(act+d+it.length)%it.length;it.forEach((li,k)=>li.classList.toggle('active',k===act));it[act].scrollIntoView({block:'nearest'});};
  list.addEventListener('mousedown',e=>e.preventDefault());
  list.addEventListener('click',e=>{const li=e.target.closest('li');if(!li)return;onPick(li.dataset.v,li);open(false);(input||btn).focus();});
  btn.addEventListener('click',()=>{if(list.hidden){if(input)render('');open(true);}else open(false);});
  const keyEl=input||btn;
  keyEl.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(list.hidden){if(input)render(input.value);open(true);}move(e.key==='ArrowDown'?1:-1);}
    else if(e.key==='Enter'&&!list.hidden&&act>=0){e.preventDefault();items()[act].click();}
    else if(e.key==='Escape'&&!list.hidden){e.preventDefault();open(false);}});
  if(input){input.addEventListener('input',()=>open(render(input.value)>0));input.addEventListener('focus',()=>open(render(input.value)>0));input.addEventListener('blur',()=>setTimeout(()=>open(false),120));}
  document.addEventListener('click',e=>{if(!root.contains(e.target))open(false);});
  return{open};
}
makeListbox($('#genre-dd'),{input:$('#c-genre'),options:['Animation','Comedy','Documentary','Drama','Horror','Musical','Romance','Sci-fi','Thriller','Western'],
  onPick:v=>{$('#c-genre').value=v;updateOpening();}});
makeListbox($('#lvl-dd'),{onPick:v=>{if(v===st.cut&&P&&!P.done)return;st.cut=v;startPuzzle();}});
function syncLevelDD(){const li=[...document.querySelectorAll('#lvl-dd li')];li.forEach(x=>x.setAttribute('aria-selected',String(x.dataset.v===st.cut)));
  const cur=li.find(x=>x.dataset.v===st.cut);if(cur)$('#lvl-dd .dd-val').textContent=cur.textContent;}

/* gift sheet */
const sheet=$('#sheet'),scrim=$('#scrim');
function setSheet(o){sheet.classList.toggle('open',o);scrim.classList.toggle('on',o);sheet.setAttribute('aria-hidden',String(!o));if(o)setTimeout(()=>$('#msg').focus(),80);}
$('#gift-btn').addEventListener('click',()=>{$('#share').hidden=true;setSheet(true);});
$('#sheet-close').addEventListener('click',()=>setSheet(false));scrim.addEventListener('click',()=>setSheet(false));
function token(){const a='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';let s='';for(let i=0;i<10;i++)s+=a[Math.floor(Math.random()*a.length)];return s;}
$('#make-btn').addEventListener('click',async()=>{
  const b=$('#make-btn');if(b.disabled)return;b.disabled=true;b.textContent='Rolling…';
  const g={from:$('#from').value.trim(),to:$('#to').value.trim(),note:$('#msg').value.trim(),sel:st.sel,cut:st.cut};
  try{const f=current(),id=token();
    let ref=f.dbId&&!f.community?{film_id:f.dbId}:{image_url:f.remoteUrl};
    if(!ref.film_id&&!ref.image_url){ref={image_url:await DB.uploadStill(await canvasBlob(f.canvas),id)};f.remoteUrl=ref.image_url;}
    await DB.createPuzzle(Object.assign({id,level:g.cut,from_name:g.from||null,to_name:g.to||null,note:g.note||null,title:f.dbId?null:(f.meta.title||null)},ref));
    st.gift=g;$('#share-link').textContent=linkFor(id);$('#share').hidden=false;}
  catch(e){console.error(e);toast('The projector jammed. Try again.');}
  finally{b.disabled=false;b.textContent='Make the link';}
});
$('#msg').addEventListener('input',e=>{$('#msg-count').textContent=e.target.value.length+'/140';});
document.addEventListener('click',e=>{const b=e.target.closest('[data-copy]');if(!b)return;const el=$(b.dataset.copy);
  const ok=()=>{b.classList.add('done');b.setAttribute('aria-label','Copied');toast('Copied. It goes nowhere yet.');setTimeout(()=>{b.classList.remove('done');b.setAttribute('aria-label','Copy link');},1600);};
  try{navigator.clipboard.writeText(el.textContent).then(ok,()=>fallbackSelect(el));}catch(err){fallbackSelect(el);}});
function fallbackSelect(el){const r=document.createRange();r.selectNodeContents(el||$('#share-link'));const s=window.getSelection();s.removeAllRanges();s.addRange(r);toast('Selected. Copy it yourself, it builds character.');}
$('#as-them-btn').addEventListener('click',()=>{setSheet(false);openTicket();});

/* ---------- create flow ---------- */
$('#make-band').addEventListener('click',()=>openCreate());
const CR={frame:null,cut:'easy',kind:'film'};
const COPY_ICON='<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><rect x="6.5" y="6.5" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M13.5 6.5V4.5a1 1 0 0 0-1-1h-8a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
dropTarget($('#make-band'),f=>openCreate(f));
function openCreate(file){$('#c-result').hidden=true;$('#c-err').textContent='';show('create');if(file)loadStill(file,setCreateFrame);}
function dropTarget(el,cb){el.addEventListener('dragover',e=>{e.preventDefault();el.classList.add('over');});el.addEventListener('dragleave',()=>el.classList.remove('over'));el.addEventListener('drop',e=>{e.preventDefault();el.classList.remove('over');const f=e.dataTransfer.files&&e.dataTransfer.files[0];if(f)cb(f);});}
function setCreateFrame(f){CR.frame=f;checkDupe();$('#c-result').hidden=true;const im=$('#c-prev');im.src=f.full;im.alt='Your still';$('#c-bg').src=f.thumb;$('#cr-stage').classList.add('has');updateOpening();$('#c-err').textContent='';}
$('#c-file').addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(f)loadStill(f,setCreateFrame);});
dropTarget($('#cr-stage'),f=>loadStill(f,setCreateFrame));
/* the preview reads like opening credits and updates as you type */
function updateOpening(){const v=k=>$(k).value.trim(),c=CUTS[CR.cut],gift=$('#c-gift').checked;
  $('#cr-ttl').textContent=v('#c-title')||'Home Movie';
  const bits=[];if(v('#c-dir'))bits.push('Directed by <b>'+esc(v('#c-dir'))+'</b>');if(v('#c-year'))bits.push(esc(v('#c-year')));if(v('#c-genre'))bits.push(esc(v('#c-genre')));
  if(gift&&v('#c-to'))bits.push('For <b>'+esc(v('#c-to'))+'</b>');bits.push(c.name+' · '+c.n+' pieces');
  $('#cr-by').innerHTML=bits.join(' · ');}
['#c-title','#c-year','#c-dir','#c-genre','#c-to','#c-from'].forEach(s=>$(s).addEventListener('input',updateOpening));
document.querySelectorAll('[data-ck]').forEach(b=>b.addEventListener('click',()=>{CR.kind=b.dataset.ck;document.querySelectorAll('[data-ck]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}));
$('#c-line').addEventListener('input',e=>{$('#c-line-count').textContent=e.target.value.length+'/140';});
/* already here? */
let dupT,DUPE=null;
async function checkDupe(){const t=$('#c-title').value.trim(),y=$('#c-year').value.trim(),box=$('#c-dupe'),sub=$('#c-submit'),row=sub.closest('.opt');
  DUPE=null;box.hidden=true;row.classList.remove('locked');
  if(t.length<2)return;const hit=await DB.filmExists(t,/^\d{4}$/.test(y)?y:null);
  if(!hit||$('#c-title').value.trim()!==t)return;DUPE=hit;
  if(hit.status==='published'){box.innerHTML='Already Now Showing: '+esc(hit.title)+(hit.year?' ('+esc(hit.year)+')':'')+'. You can still gift it. <button class="pill sm" type="button" id="dupe-play">Play it</button>';}
  else box.textContent=hit.title+' is already waiting in our queue. You can still gift it.';
  box.hidden=false;sub.checked=false;row.classList.add('locked');syncPurpose();
  const pb=$('#dupe-play');if(pb)pb.addEventListener('click',()=>{const i=st.frames.findIndex(f=>f.dbId===hit.id);if(i>=0)playFilm(i);else toast('It is in the catalogue, but not loaded yet. Refresh.');});}
['#c-title','#c-year'].forEach(k=>$(k).addEventListener('input',()=>{clearTimeout(dupT);dupT=setTimeout(checkDupe,450);}));
function syncPurpose(){$('#c-gift-fields').hidden=!$('#c-gift').checked;$('#v-create').classList.toggle('needs-meta',$('#c-submit').checked);updateOpening();}
$('#c-gift').addEventListener('change',syncPurpose);$('#c-submit').addEventListener('change',syncPurpose);
document.querySelectorAll('[data-cl]').forEach(b=>b.addEventListener('click',()=>{CR.cut=b.dataset.cl;setTimeout(updateOpening);document.querySelectorAll('[data-cl]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}));
$('#c-note').addEventListener('input',e=>{$('#c-count').textContent=e.target.value.length+'/140';});
$('#c-back').addEventListener('click',()=>show('home','#films'));
function readCreate(){
  const v=k=>$(k).value.trim();document.querySelectorAll('#v-create .fld.bad').forEach(f=>f.classList.remove('bad'));
  if(!CR.frame){$('#c-err').textContent='No still, no film. Upload one first.';window.scrollTo({top:0,behavior:reduced?'auto':'smooth'});return null;}
  const gift=$('#c-gift').checked,submit=$('#c-submit').checked;
  if(!gift&&!submit){$('#c-err').textContent='Gift it, submit it, or both. Pick at least one.';return null;}
  if(submit){const need=[['#c-title','a title'],['#c-year','the year'],['#c-dir','the director'],['#c-genre','the genre']].filter(([k])=>!v(k));
    if(v('#c-year')&&!/^(18|19|20)\d\d$/.test(v('#c-year')))need.push(['#c-year','a real year, like 1963']);
    if(need.length){need.forEach(([k])=>$(k).closest('.fld').classList.add('bad'));$('#c-err').textContent='Now Showing needs '+need.map(n=>n[1]).join(', ')+'.';$(need[0][0]).focus();return null;}}
  $('#c-err').textContent='';
  const d={gift,submit,title:v('#c-title'),year:v('#c-year'),dir:v('#c-dir'),genre:v('#c-genre'),kind:CR.kind,run:v('#c-run'),line:v('#c-line'),
    from:gift?v('#c-from'):'',to:gift?v('#c-to'):'',note:gift?v('#c-note'):''};
  Object.assign(CR.frame,{type:d.kind,community:true});
  CR.frame.meta={title:d.title||'Home Movie',year:d.year||String(new Date().getFullYear()),genre:d.genre||'Found footage',dir:d.dir||d.from||'',run:d.run||'One frame',
    line:d.line?esc(d.line):'Shot on a phone. <em>Still more coherent than most sequels.</em>'};
  return d;
}
$('#c-go').addEventListener('click',async()=>{
  const d=readCreate();if(!d)return;const b=$('#c-go');if(b.disabled)return;
  b.disabled=true;b.textContent='Rolling…';$('#c-err').textContent='';
  try{
    const id=token(),meta={title:d.title||null,year:d.year||null,director:d.dir||null,genre:d.genre||null,kind:d.kind,runtime:d.run||null,line:d.line||null};
    const url=CR.frame.remoteUrl||await DB.uploadStill(await canvasBlob(CR.frame.canvas),id);CR.frame.remoteUrl=url;
    if(d.submit)await DB.submitFilm({title:d.title,year:d.year,genre:d.genre,kind:d.kind,director:d.dir,runtime:d.run||null,line:d.line||null,
      image_url:url,status:'pending',community:true,submitted_by:d.from||null,note:d.note||null});
    let html='';
    if(d.gift){await DB.createPuzzle(Object.assign({id,image_url:url,level:CR.cut,from_name:d.from||null,to_name:d.to||null,note:d.note||null},meta));
      st.upload=CR.frame;st.gift={from:d.from,to:d.to,note:d.note,sel:'upload',cut:CR.cut};
      html+='<p class="body">It\'s a wrap. Send this to '+(d.to?esc(d.to):'them')+' and see what happens.</p><div class="linkrow"><span class="linkbox"><span class="lb-url" id="c-link">'+esc(linkFor(id))+'</span><button class="lb-copy" type="button" data-copy="#c-link" aria-label="Copy link"><span class="cp">'+COPY_ICON+'</span><span class="ok" aria-hidden="true">✓</span></button></span><button class="pill sm solid" id="c-asthem" type="button">Open as them →</button></div>';}
    if(d.submit)html+='<span class="status mono"><span class="dot"></span>Pending review</span><p class="mono" style="margin:0;opacity:.7">'+esc(d.title)+' is in the queue. If it passes, it joins Now Showing.</p>';
    const r=$('#c-result');r.innerHTML=html;r.hidden=false;
    const at=$('#c-asthem');if(at)at.addEventListener('click',()=>{st.sel='upload';openTicket();});
    r.scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});
  }catch(e){console.error(e);$('#c-err').textContent=(e.code==='23505')?'That film is already in Now Showing or in our queue. Untick Submit and gift it instead.':'The projector jammed: '+(e.message||'unknown error')+'. Try again.';}
  finally{b.disabled=false;b.textContent='Roll camera';}
});
$('#c-self').addEventListener('click',()=>{if(!CR.frame){$('#c-err').textContent='No still, no film. Upload one first.';return;}const g0=$('#c-gift').checked,s0=$('#c-submit').checked;$('#c-gift').checked=true;$('#c-submit').checked=false;readCreate();$('#c-gift').checked=g0;$('#c-submit').checked=s0;st.upload=CR.frame;st.sel='upload';st.cut=CR.cut;st.hidden=false;st.surprise=false;st.gift=null;startPuzzle();});
function linkFor(id){return location.origin+location.pathname+'?p='+id;}
function canvasBlob(c){return new Promise(r=>c.toBlob(r,'image/jpeg',.86));}
function esc(t){return t.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

/* ---------- ticket: the recipient's first screen ---------- */
function openTicket(){
  const g=st.gift||{from:'',to:'',note:'',sel:st.sel,cut:st.cut};st.sel=g.sel;st.cut=g.cut;
  const f=current();
  $('#t-to').textContent=g.to||'you';$('#t-from').textContent=g.from||'Someone mysterious';
  $('#t-cut').textContent=CUTS[g.cut].name+' · '+CUTS[g.cut].n+' pieces';$('#t-year').textContent=f.meta.year.slice(0,2)+'··';
  $('#t-note').textContent=g.note?'“'+g.note+'”':'No description. They want you to go in blind.';
  $('.t-foot').hidden=!!g.real;
  $('#t-seat').textContent='ABCDEFGHJK'[Math.floor(Math.random()*10)]+(1+Math.floor(Math.random()*18));
  show('ticket');requestAnimationFrame(()=>$('#t-go').focus({preventScroll:true}));
}
$('#t-go').addEventListener('click',()=>{st.hidden=true;st.surprise=false;startPuzzle();});
$('#t-back').addEventListener('click',()=>{st.gift&&st.gift.sel==='upload'?show('create'):show('home','#films');});

/* ---------- review queue (Projection room) ---------- */
let RT='pending';
document.querySelectorAll('[data-rt]').forEach(b=>b.addEventListener('click',()=>{RT=b.dataset.rt;document.querySelectorAll('[data-rt]').forEach(x=>x.setAttribute('aria-selected',String(x===b)));renderQueue();}));
/* <em>x</em> in the database, *x* while you edit */
const toEdit=h=>(h||'').replace(/<em>(.*?)<\/em>/g,'*$1*');
const fromEdit=t=>esc(t||'').replace(/\*(.+?)\*/g,'<em>$1</em>');
async function renderQueue(){
  const sess=await DB.session().catch(()=>null);
  $('#login').hidden=!!sess;$('#r-admin').hidden=!sess;if(!sess){setTimeout(()=>$('#l-email').focus(),60);return;}
  $('#r-who').textContent='Signed in as '+(sess.user.email||'admin');
  const q=$('#queue');q.innerHTML='<p class="mono">Loading the reels…</p>';
  let pend=[],drafts=[];
  try{[pend,drafts]=await Promise.all([DB.pending(),DB.drafts()]);}catch(e){q.innerHTML='<p class="mono">Could not load the queue: '+esc(e.message||'')+'</p>';return;}
  $('#ct-pending').textContent=pend.length;$('#ct-draft').textContent=drafts.length;
  const rows=RT==='draft'?drafts:pend;q.innerHTML='';
  if(!rows.length){q.innerHTML='<div class="empty"><p class="big">Nothing to review.</p><p class="mono">'+(RT==='draft'?'No drafts. Import a list and they land here.':'Suspiciously quiet. Submit one from Make your own.')+'</p></div>';return;}
  if(RT==='draft'){const bar=document.createElement('div');bar.className='qbar';
    bar.innerHTML='<p class="mono" style="margin:0;opacity:.75">Pick a still and tweak the line one by one, or trust the defaults.</p><button class="pill sm" type="button" id="pub-all">Publish all '+rows.length+' as they are</button>';
    q.appendChild(bar);
    $('#pub-all').addEventListener('click',async e=>{const b=e.currentTarget;b.disabled=true;let n=0;
      for(const it of rows){b.textContent='Publishing '+(++n)+' / '+rows.length+'…';
        let url;try{url=await DB.keepStill(it.image_url,'tmdb-'+(it.tmdb_id||it.id));}catch(err){url=it.image_url;}
        try{await DB.updateFilm(it.id,{status:'published',image_url:url});}catch(err){toast(it.title+' did not stick: '+(err.message||'error'));}}
      toast(rows.length+' films. Now showing.');refreshCatalogue();renderQueue();});}
  rows.forEach(it=>{const c=document.createElement('article');c.className='qcard';
    const meta='<p class="mono" style="opacity:.7">'+[it.director&&('Dir. '+esc(it.director)),esc(it.year||''),esc(it.genre||''),it.kind==='tv'?'TV':'Film',esc(it.runtime||''),it.rating?('TMDB '+it.rating):''].filter(Boolean).join(' · ')+'</p>';
    if(RT==='draft'){
      const stills=(it.stills&&it.stills.length?it.stills:[it.image_url]);let pick=stills.indexOf(it.image_url);if(pick<0)pick=0;
      c.innerHTML='<img alt="Still from '+esc(it.title)+'" src="'+esc(stills[pick])+'" class="big-still">'+(stills.length>1?'<div class="picks">'+stills.map((u,k)=>'<button type="button" aria-label="Still '+(k+1)+'" aria-pressed="'+(k===pick)+'"><img alt="" src="'+esc(u.replace('/w1280/','/w300/'))+'"></button>').join('')+'</div>':'')+
        '<div class="qbody"><p class="mono">Draft'+(it.original_title&&it.original_title!==it.title?' · '+esc(it.original_title):'')+'</p><p class="t">'+esc(it.title)+'</p>'+meta+
        '<label class="mono" style="opacity:.7">Line for the credits · *stars* make italics</label><textarea rows="3"></textarea><div class="qact"><button class="pill sm solid" type="button" data-a="ok">Publish</button><button class="pill sm" type="button" data-a="no">Skip</button></div></div>';
      const ta=c.querySelector('textarea');ta.value=toEdit(it.line);
      c.querySelectorAll('.picks button').forEach((b,k)=>b.addEventListener('click',()=>{pick=k;c.querySelector('.big-still').src=stills[k];c.querySelectorAll('.picks button').forEach((x,n)=>x.setAttribute('aria-pressed',String(n===k)));}));
      const busy=o=>c.querySelectorAll('button,textarea').forEach(x=>x.disabled=o);
      c.querySelector('[data-a=ok]').addEventListener('click',async()=>{busy(true);
        try{let url;try{url=await DB.keepStill(stills[pick],'tmdb-'+(it.tmdb_id||it.id));}catch(err){console.warn('Copy failed, using the TMDB image directly',err);url=stills[pick];}
          await DB.updateFilm(it.id,{status:'published',image_url:url,line:fromEdit(ta.value)});
          c.remove();toast(it.title+'. Now showing.');refreshCatalogue();$('#ct-draft').textContent=Math.max(0,(+$('#ct-draft').textContent||1)-1);if(!$('#queue .qcard'))renderQueue();}
        catch(e){toast('That did not stick: '+(e.message||'error'));busy(false);}});
      c.querySelector('[data-a=no]').addEventListener('click',async()=>{busy(true);
        try{await DB.setStatus(it.id,'rejected');c.remove();toast('Skipped. Back to the vault.');$('#ct-draft').textContent=Math.max(0,(+$('#ct-draft').textContent||1)-1);if(!$('#queue .qcard'))renderQueue();}
        catch(e){toast('That did not stick: '+(e.message||'error'));busy(false);}});
    }else{
      c.innerHTML='<img alt="Submitted still" src="'+esc(it.image_url)+'"><div class="qbody"><p class="mono">Pending · from '+esc(it.submitted_by||'Anonymous')+' · '+new Date(it.created_at).toLocaleDateString('en-GB')+'</p><p class="t">'+esc(it.title||'Untitled')+'</p>'+meta+(it.line?'<p class="n">'+esc(it.line)+'</p>':'')+(it.note?'<p class="n">“'+esc(it.note)+'”</p>':'')+'<div class="qact"><button class="pill sm solid" type="button" data-a="ok">Approve</button><button class="pill sm" type="button" data-a="no">Reject</button></div></div>';
      const act=async(status,msg)=>{c.querySelectorAll('button').forEach(x=>x.disabled=true);
        try{await DB.setStatus(it.id,status);c.remove();toast(msg);if(status==='published')refreshCatalogue();if(!$('#queue .qcard'))renderQueue();}
        catch(e){toast('That did not stick: '+(e.message||'error'));c.querySelectorAll('button').forEach(x=>x.disabled=false);}};
      c.querySelector('[data-a=ok]').addEventListener('click',()=>act('published','Approved. Now showing.'));
      c.querySelector('[data-a=no]').addEventListener('click',()=>act('rejected','Rejected. It never happened.'));
    }
    q.appendChild(c);});
}
$('#login').addEventListener('submit',async e=>{e.preventDefault();const b=$('#l-go');b.disabled=true;$('#l-err').textContent='';
  try{await DB.signIn($('#l-email').value.trim(),$('#l-pass').value);$('#l-pass').value='';renderQueue();}
  catch(err){$('#l-err').textContent='Wrong email or password. Staff only, remember.';}
  finally{b.disabled=false;}});
$('#r-out').addEventListener('click',async()=>{await DB.signOut();renderQueue();toast('Signed out. The projector is all yours, nobody.');});
$('#r-back').addEventListener('click',()=>show('home','#films'));
function updateReels(){const words=['none','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];$('#reels').textContent=(words[st.frames.length]||st.frames.length)+' reels.';}

/* theme */
function setTheme(v){if(v)document.documentElement.setAttribute('data-invert','');else document.documentElement.removeAttribute('data-invert');
  document.querySelectorAll('[data-theme-btn]').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.themeBtn||'')===(v?'invert':''))));
  try{localStorage.setItem('cs-theme',v?'invert':'');}catch(e){}if(P&&!$('#v-play').hidden){drawSlots();P.pieces.forEach(renderPiece);}}
document.querySelectorAll('[data-theme-btn]').forEach(b=>b.addEventListener('click',()=>setTheme(!!b.dataset.themeBtn)));

$('#badge').addEventListener('click',()=>{if(st.frames.length)surprise();});

/* menu */
const menu=$('#menu');
function setMenu(o){menu.classList.toggle('open',o);menu.setAttribute('aria-hidden',String(!o));$('#menu-open').setAttribute('aria-expanded',String(o));if(o)setTimeout(()=>$('#menu-close').focus(),50);}
$('#menu-open').addEventListener('click',()=>setMenu(true));
$('#menu-close').addEventListener('click',()=>setMenu(false));
menu.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{setMenu(false);const g=b.dataset.go;
  if(g==='films')show('home','#films');else if(g==='create')openCreate();else if(g==='review'){renderQueue();show('review');}else if(g==='surprise')surprise();else if(g==='upload')openCreate();else{st.sel=st.sel==='upload'&&!st.upload?0:st.sel;demoCredits();}}));
$('#logo').addEventListener('click',()=>show('home'));
$('#totop').addEventListener('click',()=>window.scrollTo({top:0,behavior:reduced?'auto':'smooth'}));
$('#walk-btn').addEventListener('click',()=>{stopTimer();if(navDepth>0)history.back();else show('home','#films');});
window.addEventListener('popstate',e=>{const v=(e.state&&e.state.v)||'home';fromPop=true;
  try{if(navDepth>0)navDepth--;
    if(document.querySelector('#credits.on'))closeCredits();
    if(v==='home'){stopTimer();show('home',homeAnchor||'#films');homeAnchor=null;}
    else if(v==='play'){if(P&&!P.done)show('play');else startPuzzle();}
    else show(v);}
  finally{fromPop=false;}});

let toastT;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2400);}

/* ---------- puzzle engine ---------- */
let P=null,drag=null;const stage=$('#stage');
function startPuzzle(){
  const frame=current(),cut=CUTS[st.cut],m=frame.meta;
  const from=(st.gift&&st.gift.from)||'';
  $('#p-from').textContent=st.surprise?'Surprise feature · Title classified · '+m.year.slice(0,2)+'··':st.hidden?'A puzzle from '+(from||'someone mysterious')+' · Untitled, '+m.year.slice(0,2)+'··':'Now playing · '+m.title+', '+m.year;
  document.querySelectorAll('[data-level]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.level===st.cut)));syncLevelDD();
  show('play');
  const sc=scoreFor(frame);if(SCORE&&SCORE!==sc)closeScore();$('#score-btn').hidden=!sc||!!st.surprise||!!st.hidden;
  const tk=(frame.id||'x')+'|'+st.cut;st.takes=st.takes||{};st.takes[tk]=(st.takes[tk]||0)+1;$('#d-take').textContent=String(st.takes[tk]);
  const idx=st.frames.indexOf(frame);$('#d-num').textContent=st.surprise||st.sel==='upload'?'??':String(idx+1).padStart(2,'0');
  $('#d-film').textContent=(st.hidden||st.surprise)?'Untitled · '+m.year.slice(0,2)+'··':m.title+' · '+m.year;
  $('#d-cut').textContent=cut.name+' · '+cut.n+' pieces';
  {const dt=new Date();$('#d-date').textContent=dt.getFullYear()+'.'+String(dt.getMonth()+1).padStart(2,'0');}
  stage.classList.remove('solved','peek');$('#peek-btn').setAttribute('aria-pressed','false');
  stage.querySelectorAll('.piece').forEach(n=>n.remove());
  const gr=gridFor(cut.n,frame.aspect),rnd=(a,b)=>a+Math.random()*(b-a);
  const mk=()=>({s:Math.random()<.5?1:-1,c:.5,w:1,h:1,j1:0,j2:0});
  const H=[],V=[];for(let r=0;r<=gr.rows;r++){H[r]=[];V[r]=[];for(let c=0;c<=gr.cols;c++){H[r][c]=mk();V[r][c]=mk();}}
  P={frame,cut,cols:gr.cols,rows:gr.rows,aspect:frame.aspect,H,V,pieces:[],placed:0,z:10,done:false,t0:0,elapsed:0,timer:null};
  $('#ghost').src=frame.full;
  requestAnimationFrame(()=>{
    geometry();renderSource();
    for(let r=0;r<P.rows;r++)for(let c=0;c<P.cols;c++){const el=document.createElement('canvas');el.className='piece';el.setAttribute('aria-hidden','true');
      const p={c,r,el,ctx:el.getContext('2d',{willReadFrequently:true}),locked:false,x:0,y:0,nx:0,ny:0};el._p=p;P.pieces.push(p);stage.appendChild(el);}
    drawSlots();const ord=P.pieces.map((_,i)=>i).sort(()=>Math.random()-.5);P.pieces.forEach((p,i)=>{renderPiece(p);scatter(p,ord[i]);place(p);});
    updateCounter();startTimer();
  });
}
function geometry(){
  const W=stage.clientWidth,Hs=stage.clientHeight;const wide=W>=700&&W/Hs>1.15;let tw;
  const A=P.aspect,n=P.cols*P.rows;if(wide)tw=Math.min(W*(A>1.8?.54:.46),Hs*.7*A);else tw=Math.min(W-12,Hs*.46*A);
  let ts=.6;
  for(let k=0;k<24;k++){const th0=tw/A,pw0=tw/P.cols,ph0=th0/P.rows,pd=Math.min(pw0,ph0)*.38;let ok=false;
    for(ts=.6;ts>=.34;ts-=.04){const bw0=(pw0+pd*1.2)*ts,bh0=(ph0+pd*1.2)*ts;
      const cap=wide?2*Math.floor(((W-tw)/2-30-th0/7)/bw0)*Math.floor(Hs/bh0)*1.6:Math.floor(W/bw0)*Math.floor((Hs-th0-12)/bh0)*1.6;if(cap>=n){ok=true;break;}}
    if(ok)break;tw*=.95;}
  const th=tw/A,pw=tw/P.cols,ph=th/P.rows,T=Math.min(pw,ph),pad=Math.ceil(T*.38);
  const jp=wide?clamp(th*.14,26,72):0;
  const tx=(W-tw)/2,ty=wide?Math.max((Hs-th)/2+jp*.45,jp+16):Math.max(pad*ts,8);
  P.geo={W,SH:Hs,tw,th,pw,ph,T,pad,tx,ty,wide,ts};
  const tg=$('#target');tg.style.left=tx+'px';tg.style.top=ty+'px';tg.style.width=tw+'px';tg.style.height=th+'px';
  /* lettering, placed like a magazine cover around the frame */
  const d=$('#deco');d.hidden=!wide;
  if(wide){const J=$('#d-jp'),S=$('#d-side'),L=$('#d-left');
    J.style.fontSize=jp+'px';J.style.left=tx+'px';J.style.top=(ty-jp*1.12-10)+'px';
    let fs=clamp(th/7.2,22,96);S.style.fontSize=fs+'px';if(S.offsetHeight>th){fs*=th/S.offsetHeight*.98;S.style.fontSize=fs+'px';}
    S.style.left=(tx+tw+16)+'px';S.style.top=ty+'px';
    L.style.right=(W-tx+16)+'px';L.style.top=(ty+th-L.offsetHeight)+'px';
    P.geo.trayL=tx-16-L.offsetWidth-12;P.geo.trayR=tx+tw+16+S.offsetWidth+12;}
  else{P.geo.trayL=tx;P.geo.trayR=tx+tw;}
}
function drawSlots(){
  const g=P.geo,c=$('#slots'),dpr=Math.min(window.devicePixelRatio||1,2);c.width=Math.round(g.tw*dpr);c.height=Math.round(g.th*dpr);
  const x=c.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,g.tw,g.th);if(P.cut.noSlots)return;
  const hair=getComputedStyle(document.documentElement).getPropertyValue('--hair').trim()||'rgba(0,0,0,.25)';
  P.pieces.forEach(p=>{x.save();x.translate(p.c*g.pw,p.r*g.ph);piecePath(x,p);x.lineJoin='round';x.strokeStyle=hair;x.lineWidth=1.2;x.stroke();x.restore();});
}
function renderSource(){const g=P.geo,dpr=Math.min(window.devicePixelRatio||1,2);const s=document.createElement('canvas');s.width=Math.round(g.tw*dpr);s.height=Math.round(g.th*dpr);s.getContext('2d').drawImage(P.frame.canvas,0,0,s.width,s.height);P.src=s;P.dpr=dpr;}
/* every shared edge has its own knob: position, width, height and a slight wobble.
   Shapes are defined once per edge (canonical direction) so both neighbours match. */
function edgeSegs(e){
  const c=e.c,w=e.w,h=.23*e.h*e.s,x0=c-.1*w,x1=c+.1*w;
  return[[[0,0],[x0*.35,e.j1],[x0*.7,-e.j1*.5],[x0,0]],
         [[x0,0],[x0+.03*w,.03*e.h*e.s],[c-.2*w,h],[c,h]],
         [[c,h],[c+.2*w,h],[x1-.03*w,.03*e.h*e.s],[x1,0]],
         [[x1,0],[x1+(1-x1)*.3,e.j2*.5],[x1+(1-x1)*.65,e.j2],[1,0]]];
}
function drawEdge(ctx,A,B,N,T,e,rev){
  if(!e){ctx.lineTo(...(rev?A:B));return;}
  const m=q=>[A[0]+(B[0]-A[0])*q[0]+N[0]*q[1]*T,A[1]+(B[1]-A[1])*q[0]+N[1]*q[1]*T];
  const S=edgeSegs(e);
  if(!rev)S.forEach(q=>ctx.bezierCurveTo(...m(q[1]),...m(q[2]),...m(q[3])));
  else S.slice().reverse().forEach(q=>ctx.bezierCurveTo(...m(q[2]),...m(q[1]),...m(q[0])));
}
function piecePath(ctx,p,keep){
  const g=P.geo,w=g.pw,h=g.ph,T=g.T,{r,c}=p;
  const top=r===0?null:P.H[r][c],bot=r===P.rows-1?null:P.H[r+1][c],lef=c===0?null:P.V[r][c],rig=c===P.cols-1?null:P.V[r][c+1];
  if(!keep)ctx.beginPath();ctx.moveTo(0,0);
  drawEdge(ctx,[0,0],[w,0],[0,1],T,top,false);
  drawEdge(ctx,[w,0],[w,h],[1,0],T,rig,false);
  drawEdge(ctx,[0,h],[w,h],[0,1],T,bot,true);
  drawEdge(ctx,[0,0],[0,h],[1,0],T,lef,true);
  ctx.closePath();
}
function renderPiece(p){
  const g=P.geo,dpr=P.dpr,bw=g.pw+g.pad*2,bh=g.ph+g.pad*2,el=p.el;
  el.width=Math.ceil(bw*dpr);el.height=Math.ceil(bh*dpr);el.style.width=bw+'px';el.style.height=bh+'px';
  const ctx=p.ctx;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,el.width,el.height);ctx.scale(dpr,dpr);ctx.translate(g.pad,g.pad);
  piecePath(ctx,p);ctx.save();ctx.clip();ctx.drawImage(P.src,-p.c*g.pw,-p.r*g.ph,g.tw,g.th);
  /* flat: one crisp line in the accent colour, drawn inside the edge so it never gets clipped */
  const ink=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#F2262B';
  if(!p.locked){piecePath(ctx,p);ctx.lineJoin='round';ctx.lineCap='round';ctx.lineWidth=1.6;ctx.strokeStyle='rgba(255,255,255,.75)';ctx.stroke();}ctx.restore();
}
function homePos(p){const g=P.geo;return[g.tx+p.c*g.pw-g.pad,g.ty+p.r*g.ph-g.pad];}
function scatter(p,i){
  const g=P.geo,s=g.ts,bw=g.pw+g.pad*2,bh=g.ph+g.pad*2,vw=bw*s,vh=bh*s;let cx,cy;
  if(g.wide){const left=i%2===0;const x0=left?vw/2:g.trayR+vw/2,x1=left?g.trayL-vw/2:g.W-vw/2;
    cx=x0+Math.random()*Math.max(0,x1-x0);cy=vh/2+Math.random()*Math.max(0,g.SH-vh);}
  else{const y0=g.ty+g.th+14+vh/2;cx=vw/2+Math.random()*Math.max(0,g.W-vw);cy=y0+Math.random()*Math.max(0,g.SH-y0-vh/2);}
  p.x=cx-bw/2;p.y=cy-bh/2;p.nx=p.x/g.W;p.ny=p.y/g.SH;p.el.style.zIndex=10+i;
}
function place(p){p.el.style.translate=p.x+'px '+p.y+'px';p.el.style.scale=(p.locked||(drag&&drag.p===p))?'1':String(P.geo.ts);}
function lockPiece(p,quiet){
  if(p.locked)return;p.locked=true;[p.x,p.y]=homePos(p);renderPiece(p);place(p);p.el.classList.add('locked');p.el.style.zIndex=1;
  if(!quiet){p.el.classList.remove('snap');void p.el.offsetWidth;p.el.classList.add('snap');}
  P.placed++;updateCounter();if(P.placed===P.pieces.length)win();
}
function updateCounter(){$('#pcount').textContent=String(P.placed).padStart(2,'0')+' / '+P.pieces.length;}
function pick(x,y){
  for(const el of document.elementsFromPoint(x,y)){if(!el.classList||!el.classList.contains('piece'))continue;const p=el._p;if(!p||p.locked)continue;
    /* hit-test against the piece outline, not its pixels: works even when the image can't be read back */
    const r=el.getBoundingClientRect(),g=P.geo,k=r.width/(g.pw+g.pad*2);const lx=(x-r.left)/k-g.pad,ly=(y-r.top)/k-g.pad;
    const c=p.ctx;c.save();c.setTransform(1,0,0,1,0,0);piecePath(c,p);const hit=c.isPointInPath(lx,ly);c.restore();if(hit)return p;}
  return null;
}
stage.addEventListener('pointerdown',e=>{
  if(!P||P.done)return;const p=pick(e.clientX,e.clientY);if(!p)return;e.preventDefault();
  const r=stage.getBoundingClientRect();drag={p,ox:e.clientX-r.left-p.x,oy:e.clientY-r.top-p.y,id:e.pointerId};
  try{stage.setPointerCapture(e.pointerId);}catch(err){}
  p.el.classList.remove('flying');p.el.classList.add('dragging');p.el.style.zIndex=++P.z;place(p);
});
stage.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;const r=stage.getBoundingClientRect(),g=P.geo,bw=g.pw+2*g.pad,bh=g.ph+2*g.pad;
  drag.p.x=clamp(e.clientX-r.left-drag.ox,-g.pad,g.W-bw+g.pad);drag.p.y=clamp(e.clientY-r.top-drag.oy,-g.pad,g.SH-bh+g.pad);place(drag.p);
});
function endDrag(e){
  if(!drag||e.pointerId!==drag.id)return;const p=drag.p;drag=null;p.el.classList.remove('dragging');
  const[hx,hy]=homePos(p);if(Math.hypot(p.x-hx,p.y-hy)<P.geo.T*.34)lockPiece(p);else{p.nx=p.x/P.geo.W;p.ny=p.y/P.geo.SH;place(p);}
}
stage.addEventListener('pointerup',endDrag);stage.addEventListener('pointercancel',endDrag);
let rsT;window.addEventListener('resize',()=>{clearTimeout(rsT);rsT=setTimeout(()=>{
  if(!P||$('#v-play').hidden)return;geometry();renderSource();drawSlots();
  P.pieces.forEach(p=>{renderPiece(p);if(p.locked)[p.x,p.y]=homePos(p);else{p.x=p.nx*P.geo.W;p.y=p.ny*P.geo.SH;}p.el.classList.remove('flying');place(p);});
},150);});
document.querySelectorAll('[data-level]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.level===st.cut&&P&&!P.done)return;st.cut=b.dataset.level;const r=$('#cut-'+st.cut);if(r)r.checked=true;startPuzzle();}));
$('#peek-btn').addEventListener('click',e=>{const on=stage.classList.toggle('peek');e.currentTarget.setAttribute('aria-pressed',String(on));if(on){if(P&&!P.done)P.cheated='peek';toast('Peeking. We saw that. No leaderboard for you.');}});
$('#skip-btn').addEventListener('click',()=>{if(!P||P.done)return;P.cheated='skip';toast('Coward. Rolling anyway.');
  P.pieces.filter(p=>!p.locked).forEach((p,i)=>setTimeout(()=>{p.el.classList.add('flying');lockPiece(p,true);},reduced?0:i*14));});

function fmt(ms){const s=Math.floor(ms/1000);return[Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(v=>String(v).padStart(2,'0')).join(':');}
function short(ms){const s=Math.floor(ms/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
function startTimer(){stopTimer();P.t0=performance.now();$('#ptime').textContent='00:00:00';P.timer=setInterval(()=>{$('#ptime').textContent=fmt(performance.now()-P.t0);},250);}
function stopTimer(){if(P&&P.timer){clearInterval(P.timer);P.timer=null;}}
function win(){
  P.done=true;P.elapsed=performance.now()-P.t0;stopTimer();$('#ptime').textContent=fmt(P.elapsed);
  $('#p-from').textContent='It was '+P.frame.meta.title+', '+P.frame.meta.year+'. Obviously.';
  setTimeout(()=>{stage.classList.add('solved');setTimeout(openCredits,reduced?200:1500);},reduced?0:900);
}

/* ---------- credits ---------- */
/* film grain: fresh noise every frame, so it never loops */
(function(){const cv=$('#grainfx'),g=cv.getContext('2d');let w=0,h=0,img=null,last=0,raf=0;
  function size(){w=Math.ceil(innerWidth/2);h=Math.ceil(innerHeight/2);cv.width=w;cv.height=h;img=g.createImageData(w,h);}
  function frame(){const d=new Uint32Array(img.data.buffer);for(let i=0;i<d.length;i++){const v=(Math.random()*255)|0;d[i]=(255<<24)|(v<<16)|(v<<8)|v;}g.putImageData(img,0,0);}
  function loop(t){raf=requestAnimationFrame(loop);if(t-last<70)return;last=t;frame();}
  size();frame();window.addEventListener('resize',()=>{size();frame();});
  if(!reduced){raf=requestAnimationFrame(loop);document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);if(!document.hidden)raf=requestAnimationFrame(loop);});}
})();
try{if(localStorage.getItem('cs-theme')==='invert')setTheme(true);}catch(e){}
const cr=$('#credits');let crT=[];
function fillCredits(f,elapsed,pieces,cutName){
  const m=f.meta,g=st.gift,from=g?g.from:'';
  $('#cr-frame').src=f.full;document.querySelector('.endframe').style.aspectRatio=String(f.aspect||1.5);$('#rl-title').textContent=m.title;$('#rl-year').textContent=m.year+' · '+m.genre;
  $('#rl-dir-l').textContent=f.type==='tv'?'Created by':'Directed by';  $('#rl-dir').textContent=m.dir||from||'You, apparently';$('#rl-run').textContent=m.run;$('#rl-line').innerHTML=m.line;
  $('#rl-sender').textContent=g?(from||'Anonymous'):'Cut Scenes';$('#rl-for').textContent=g?(g.to||'Whoever finished it'):'You';
  $('#rl-msg').textContent=g?(g.note||"They didn't leave a note. Mysterious, or lazy."):'No note. Just you and a film.';
  $('#rl-score').hidden=!scoreFor(f);
  $('#rl-time').textContent=short(elapsed);$('#rl-pieces').textContent=String(pieces);$('#rl-cut').textContent=cutName;
}
function runCredits(){
  document.body.classList.add('screening');crT.forEach(clearTimeout);crT=[];cr.className='';cr.setAttribute('aria-hidden','false');
  if(reduced){cr.classList.add('on','p1','p2','p3','done');$('#again-btn').focus();return;}
  requestAnimationFrame(()=>requestAnimationFrame(()=>cr.classList.add('on')));
  crT.push(setTimeout(()=>cr.classList.add('p1'),1300));
  crT.push(setTimeout(()=>cr.classList.add('p2'),2900));
  crT.push(setTimeout(()=>{computeRoll();cr.classList.add('p3');},6400));
  setTimeout(()=>$('#skip-credits').focus({preventScroll:true}),1400);
}
function openCredits(){fillCredits(P.frame,P.elapsed,P.pieces.length,P.cut.name);showBoard();runCredits();}
/* ---------- soundtrack: Spotify's embed, loaded only when asked for ---------- */
var SCORE=null;
function scoreFor(f){return f&&f.spotify&&/^(album|track|playlist)\/[A-Za-z0-9]{22}$/.test(f.spotify)?f.spotify:null;}
function syncScore(){$('#score-btn').setAttribute('aria-pressed',String(!!SCORE));$('#rl-score').textContent=SCORE?'♪ Stop the score':'♪ Play the original score';}
function openScore(id){if(!id)return;if(SCORE!==id){SCORE=id;
  $('#score-slot').innerHTML='<iframe title="Original score on Spotify" src="https://open.spotify.com/embed/'+id+'?utm_source=generator&theme=0" width="100%" height="'+(id.startsWith('track/')?80:152)+'" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>';}
  $('#score').hidden=false;syncScore();}
function closeScore(){if(!SCORE&&$('#score').hidden)return;SCORE=null;$('#score-slot').innerHTML='';$('#score').hidden=true;syncScore();}
$('#score-btn').addEventListener('click',()=>SCORE?closeScore():openScore(scoreFor(current())));
$('#rl-score').addEventListener('click',()=>SCORE?closeScore():openScore(scoreFor(P&&P.frame)));
$('#score-x').addEventListener('click',closeScore);
/* ---------- leaderboard ---------- */
let PLAY=null;
function boardRows(top,meIdx){$('#rb-top').innerHTML=(top||[]).map((r,k)=>'<li'+(k===meIdx?' class="me"':'')+'><span>'+String(k+1).padStart(2,'0')+'</span><span>'+esc(r.alias)+'</span><span>'+short(r.ms)+'</span></li>').join('');}
function showBoard(){
  const box=$('#rl-board'),f=P.frame,lvl=st.cut;PLAY=null;box.hidden=false;$('#rb-sign').hidden=true;$('#rb-top').innerHTML='';
  $('#rb-head').textContent='Fastest cuts · '+CUTS[lvl].name;
  if(P.cheated){$('#rb-rank').innerHTML=P.cheated==='skip'?'You skipped to the end. <em>No time, no glory.</em>':'You peeked. <em>Disqualified. We saw.</em>';return;}
  if(!f.dbId){$('#rb-rank').innerHTML='Home movies don\'t make the leaderboard. <em>Only the catalogue does.</em>';return;}
  $('#rb-rank').textContent='Checking the scoreboard…';
  DB.logPlay(f.dbId,lvl,P.elapsed).then(d=>{
    if(!d||d.rejected){$('#rb-rank').innerHTML='Too fast to be human. <em>Not counted.</em>';return;}
    PLAY=d;const quip=d.rank===1?'Fastest in the house. <em>Suspicious.</em>':d.rank<=5?'Top five. <em>Your mother would be proud.</em>':'Not the fastest. <em>But you finished, which is more than most sequels do.</em>';
    $('#rb-rank').innerHTML='<b>#'+d.rank+'</b> of '+d.total+' on '+esc(f.meta.title)+'. '+quip;
    boardRows(d.top,d.rank<=5?d.rank-1:-1);$('#rb-sign').hidden=false;
  }).catch(()=>{$('#rb-rank').textContent='The scoreboard is out for popcorn. Your time still counts to us.';});
}
$('#rb-sign').addEventListener('submit',async e=>{e.preventDefault();const a=$('#rb-alias').value.trim();if(!a||!PLAY)return;
  try{const top=await DB.signPlay(PLAY.id,PLAY.token,a);boardRows(top,PLAY.rank<=5?PLAY.rank-1:-1);$('#rb-sign').hidden=true;toast('Signed. Immortal, sort of.');}
  catch(err){toast('Could not sign it. Try another alias.');}});
function demoCredits(){const f=current()||st.frames[0];fillCredits(f,252000,12,'Easy');$('#rl-board').hidden=true;runCredits();}
function computeRoll(){const roll=$('#roll'),vh=cr.clientHeight,rh=roll.offsetHeight;const end=rh<vh*.85?(vh-rh)/2:vh*.9-rh;roll.style.setProperty('--end',end+'px');roll.style.setProperty('--dur',((vh*1.15-end)/85).toFixed(1)+'s');}
$('#roll').addEventListener('animationend',()=>cr.classList.add('done'));
$('#skip-credits').addEventListener('click',()=>{crT.forEach(clearTimeout);crT=[];computeRoll();cr.classList.add('on','p1','p2','p3','done');$('#again-btn').focus({preventScroll:true});});
function closeCredits(then){
  document.body.classList.remove('screening');
  crT.forEach(clearTimeout);crT=[];cr.classList.remove('p1','p2','p3','done');cr.classList.remove('on');cr.setAttribute('aria-hidden','true');
  setTimeout(()=>{cr.className='';if(then)then();},reduced?0:600);
  if(then&&!reduced)setTimeout(()=>{},0);
}
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(menu.classList.contains('open'))setMenu(false);else if(cr.classList.contains('on'))closeCredits(()=>show('home'));});
$('#again-btn').addEventListener('click',()=>{const next=st.sel==='upload'?0:(st.sel+1)%st.frames.length;closeCredits(()=>{playFilm(next);});});
$('#own-btn').addEventListener('click',()=>closeCredits(()=>show('home','#make-band')));
window.addEventListener('resize',()=>{if(cr.classList.contains('done'))computeRoll();});

/* ---------- boot ---------- */
async function boot(){
  try{await Promise.race([Promise.all([document.fonts.load('100px "League Gothic"'),document.fonts.load('96px "League Gothic"'),document.fonts.load('500 26px "DM Mono"'),document.fonts.load('italic 30px "Instrument Serif"')]),new Promise(r=>setTimeout(r,2500))]);}catch(e){}
  fitAll();
  st.frames=await loadCatalogue();
  renderGrid();renderFilters();applyFilters();updateReels();
  await openSharedLink();
  BOOTED=true;
}
/* someone opened cutscenes/?p=<id>: show them their ticket */
async function openSharedLink(){
  const id=new URLSearchParams(location.search).get('p');if(!id)return;
  try{const r=await DB.getPuzzle(id);
    if(!r){toast('This link expired, or never existed. Enjoy the lobby.');return;}
    let i=r.film_id?st.frames.findIndex(f=>f.dbId===r.film_id):-1;
    if(i<0){const T=r.title||r.film_title,Y=r.year||r.film_year,G=r.genre||r.film_genre,D=r.director||r.film_director,RU=r.runtime||r.film_runtime,L=r.line||r.film_line;
      st.upload=await frameFromUrl(r.image_url,{id:'shared',type:r.kind||'film',meta:{title:T||'Home Movie',year:Y||String(new Date().getFullYear()),genre:G||'Found footage',dir:D||r.from_name||'',run:RU||'As long as it takes',line:L?(r.community===false?L:esc(L)):'Shot on a phone. <em>Still more coherent than most sequels.</em>'}});i='upload';}
    st.gift={from:r.from_name||'',to:r.to_name||'',note:r.note||'',sel:i,cut:r.level,real:true};
    openTicket();
  }catch(e){console.error(e);toast('Could not open that link. The projector jammed.');}
}
/* split the wordmark into letters for the intro and the hover stretch */
const wm=$('#wordmark');
(function(){const t=wm.textContent;wm.textContent='';[...t].forEach((ch,i)=>{const sp=document.createElement('span');sp.className='ch';sp.setAttribute('aria-hidden','true');sp.style.setProperty('--i',i);sp.textContent=ch===' '?'\u00a0':ch;wm.appendChild(sp);});})();
let BOOTED=false,INTRO=false;
function startIntro(){
  const L=$('#loader'),num=$('#ld-num');
  if(reduced||!L){if(L)L.remove();wm.classList.remove('pre');$('#films').classList.add('in');INTRO=true;return;}
  const t0=performance.now(),D=1900;
  (function step(){const t=Math.min(1,(performance.now()-t0)/D);const e=1-Math.pow(1-t,3);num.textContent=Math.round(e*(BOOTED?100:96))+'%';
    if(t<1||!BOOTED){requestAnimationFrame(step);return;}
    num.textContent='100%';
    setTimeout(()=>{L.classList.add('wipe');
      setTimeout(()=>{fitAll();L.classList.add('lift');wm.classList.remove('pre');wm.classList.add('go');
        setTimeout(()=>$('#films').classList.add('in'),500);
        setTimeout(()=>{L.remove();},1300);
        setTimeout(()=>{wm.classList.remove('go');INTRO=true;},1900);
      },1000);
    },250);
  })();
}
/* hover: letters near the cursor stretch up, like the reference */
const heroEl=document.querySelector('.hero');
heroEl.addEventListener('pointermove',e=>{if(!INTRO||e.pointerType==='touch')return;
  wm.querySelectorAll('.ch').forEach(sp=>{const r=sp.getBoundingClientRect();const d=(e.clientX-(r.left+r.width/2))/Math.max(60,r.width*1.6);const s=1+.2*Math.exp(-d*d);sp.style.transform='scaleY('+s.toFixed(3)+')';});});
heroEl.addEventListener('pointerleave',()=>{wm.querySelectorAll('.ch').forEach(sp=>sp.style.transform='');});
fitAll();boot();startIntro();
try{document.fonts.ready.then(fitAll);document.fonts.addEventListener('loadingdone',fitAll);}catch(e){}
if(window.ResizeObserver)new ResizeObserver(()=>{clearTimeout(fitT);fitT=setTimeout(fitAll,60);}).observe(document.body);
})();
