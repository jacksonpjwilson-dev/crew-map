const DATA_URLS=['https://raw.githubusercontent.com/jacksonpjwilson-dev/crew-map/data/activity.json','activity.json'];
const NS='http://www.w3.org/2000/svg',$=s=>document.querySelector(s);
const mk=(t,a,p)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);p&&p.appendChild(e);return e};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const col=id=>B[id]?C[B[id][3]]:'#bbb',nm=id=>id==='all'?'Everyone':B[id]?B[id][0]:id;
const icon=(id,s=30)=>{const g=mk('svg',{viewBox:'-14 -14 28 28',width:s,height:s});const b=B[id];if(b)mk('path',{d:SH[b[2]],fill:col(id),stroke:col(id),'stroke-width':1},g);else mk('circle',{r:11,fill:'#555'},g);return g};
// tabs
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#tabs button').forEach(x=>x.classList.toggle('on',x===b));['crew','today','list'].forEach(v=>$('#v-'+v).hidden=v!==b.dataset.v);location.hash=b.dataset.v});
if(location.hash)document.querySelector(`#tabs [data-v="${location.hash.slice(1)}"]`)?.click();
// crew view (what each bot does)
(function(){const root=$('#v-crew');const lead=document.createElement('div');lead.className='dept';lead.innerHTML='<h2 style="border-color:#eee">Leadership</h2>';['jackson','chief'].forEach(id=>lead.appendChild(card(id)));root.appendChild(lead);
Object.entries(D).sort((a,b)=>a[1][1]-b[1][1]).forEach(([k,[name,,c]])=>{const d=document.createElement('div');d.className='dept';d.innerHTML=`<h2 style="border-color:${c}">${esc(name)}</h2>`;Object.keys(B).filter(id=>B[id][6]===k).forEach(id=>d.appendChild(card(id)));root.appendChild(d)});
function card(id){const b=B[id],e=document.createElement('div');e.className='bot';e.appendChild(icon(id));const t=document.createElement('div');
const lb=x=>B[x]?B[x][0]:APPS[x]?APPS[x][0]:x;const fl=FLOWS.filter(f=>f[0]===id||f[1]===id).map(f=>f[0]===id?`→ ${lb(f[1])}: ${f[2]}`:`← ${lb(f[0])}: ${f[2]}`);
t.innerHTML=`<b style="color:${col(id)}">${esc(b[0])}</b><span class="role">${esc(b[1])}</span><p>${esc(b[7])}</p>`+(fl.length?`<div class="chips">${fl.map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div>`:'');e.appendChild(t);return e}})();
// sheet
const sheet=(title,items)=>{$('#sheetBody').innerHTML=`<h3>${title}</h3>`+items.map(i=>`<div class="msg"><div class="meta"><span class="time">${i.time}</span><span class="who" style="color:${col(i.from)}">${esc(nm(i.from))}</span>→<span class="who" style="color:${col(i.to)}">${esc(nm(i.to))}</span></div><div class="topic">${esc(i.topic)}</div><div class="sum">${esc(i.summary)}</div></div>`).join('');$('#sheet').hidden=false};
$('#close').onclick=()=>$('#sheet').hidden=true;$('#sheet').onclick=e=>{if(e.target.id==='sheet')$('#sheet').hidden=true};
// today network
function drawNet(items){const svg=$('#net');svg.innerHTML='';$('#todayEmpty').hidden=!!items.length;svg.style.display=items.length?'':'none';if(!items.length)return;
const ids=[...new Set(items.flatMap(i=>[i.from,i.to]))].sort((a,b)=>(a==='chief'?-1:b==='chief'?1:0));const R=145,cx=200,cy=200,P={};
ids.forEach((id,k)=>{const a=-Math.PI/2+2*Math.PI*k/ids.length;P[id]={x:cx+R*Math.cos(a),y:cy+R*Math.sin(a)}});
const defs=mk('defs',{},svg);const edges={};items.forEach(i=>{(edges[i.from+'>'+i.to]=edges[i.from+'>'+i.to]||[]).push(i)});
Object.entries(edges).forEach(([k,list])=>{const[f,t]=k.split('>');const c=col(f);const mid='m'+k.replace(/\W/g,'');const m=mk('marker',{id:mid,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:6,markerHeight:6,orient:'auto'},defs);mk('path',{d:'M0 0L10 5L0 10Z',fill:c},m);
const a=P[f],b=P[t],dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,r=20;const x1=a.x+ux*r,y1=a.y+uy*r,x2=b.x-ux*(r+3),y2=b.y-uy*(r+3);const bend=edges[t+'>'+f]?22:10;const qx=(x1+x2)/2-uy*bend,qy=(y1+y2)/2+ux*bend;
const g=mk('g',{class:'edge'},svg);const d=`M${x1} ${y1}Q${qx} ${qy} ${x2} ${y2}`;mk('path',{d,stroke:c,'stroke-width':Math.min(1.5+list.length,5),fill:'none','marker-end':`url(#${mid})`},g);mk('path',{d,class:'hit'},g);
if(list.length>1){mk('circle',{cx:qx*.5+(x1+x2)/4,cy:qy*.5+(y1+y2)/4,r:8,fill:'#222',stroke:c},g);const tx=mk('text',{x:qx*.5+(x1+x2)/4,y:qy*.5+(y1+y2)/4+3.5,'text-anchor':'middle','font-size':10,fill:'#fff'},g);tx.textContent=list.length}
g.onclick=()=>sheet(`${esc(nm(f))} → ${esc(nm(t))}`,list)});
ids.forEach(id=>{const g=mk('g',{transform:`translate(${P[id].x} ${P[id].y})`,class:'edge'},svg);mk('circle',{r:19,fill:'#111',stroke:col(id),'stroke-width':2},g);
if(B[id])mk('path',{d:SH[B[id][2]],fill:col(id),transform:'scale(.95)'},g);else{const t=mk('text',{'text-anchor':'middle',y:4,'font-size':10,fill:'#ddd'},g);t.textContent='ALL'}
const lb=mk('text',{'text-anchor':'middle',y:P[id].y>cy+5?33:-25,'font-size':11,fill:'#ddd'},g);lb.textContent=nm(id).replace('Fix it ','');
g.onclick=()=>sheet(esc(nm(id))+' today',items.filter(i=>i.from===id||i.to===id))})}
function drawList(items){$('#feed').innerHTML=items.length?'':'<li class="empty">No bot-to-bot messages yet today.</li>';[...items].reverse().forEach(i=>{const li=document.createElement('li');li.innerHTML=`<div class="meta"><span class="time">${i.time}</span><span class="who" style="color:${col(i.from)}">${esc(nm(i.from))}</span>→<span class="who" style="color:${col(i.to)}">${esc(nm(i.to))}</span></div><div class="topic">${esc(i.topic)}</div><div class="sum">${esc(i.summary)}</div>`;li.onclick=()=>sheet('Message',[i]);$('#feed').appendChild(li)})}
let last='';async function load(){for(const u of DATA_URLS){try{const r=await fetch(u+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)continue;const j=await r.json();const s=JSON.stringify(j);
$('#status').textContent=`${j.date} · updated ${j.generated} · ${j.items.length} messages`;if(s!==last){last=s;drawNet(j.items);drawList(j.items)}return}catch(e){}}$('#status').textContent='offline – retrying'}
load();setInterval(load,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)load()});
