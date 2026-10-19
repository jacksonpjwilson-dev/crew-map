/* Crew Map v4. Roster + activity are fetched live from the data branch (rebuilt on the box every 90 s). */
const VERSION='v5';
const SCHED=()=>window.CrewSched?CrewSched.list(R&&R.schedule):[];
const RAW='https://raw.githubusercontent.com/jacksonpjwilson-dev/crew-map/data/';
const LOCAL=/^(localhost|127\.)/.test(location.hostname);
const ROSTER_URLS=LOCAL?['roster.json']:[RAW+'roster.json','roster.json'],DATA_URLS=LOCAL?['activity.json']:[RAW+'activity.json','activity.json'];
const NS='http://www.w3.org/2000/svg',$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const mk=(t,a,p)=>{const e=document.createElementNS(NS,t);for(const k in a)if(a[k]!=null)e.setAttribute(k,a[k]);p&&p.appendChild(e);return e};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- theme (same colourways as Logbook v2) ---------- */
function isDark(){return TH.mode==='dark'||(TH.mode==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches)}
function applyTheme(){const dark=isDark(),c=CW[TH.cw]||CW.teal,v=dark?c.Dk:c.L,r=document.documentElement;r.dataset.theme=dark?'dark':'light';
 const mix=(a,b,p)=>`color-mix(in srgb,${a} ${p}%,${b})`;
 const set={'--bg':v.bg,'--card':v.card,'--card2':mix(v.line,v.card,55),'--text':v.fg,'--muted':v.mut,'--line':v.line,'--accent':v.a,'--accent2':v.a2,'--accent3':v.a3,'--on':v.on,'--accentSoft':mix(v.a,v.card,22),'--fh':c.fh,'--fb':c.fb};
 for(const k in set)r.style.setProperty(k,set[k]);$$('meta[name=theme-color]').forEach(x=>x.setAttribute('content',v.bg))}
function saveTheme(){localStorage.setItem('crewmap:theme',JSON.stringify(TH));applyTheme();if(!$('#sheet').hidden&&$('#sheet').dataset.k==='theme')openTheme()}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',applyTheme);applyTheme();
function openTheme(){const dk=isDark();
 openSheet('theme',`<h3>Appearance</h3><label class="f">Mode</label><div class="seg">${['light','dark','auto'].map(m=>`<button data-thm="${m}" class="${TH.mode===m?'on':''}">${m[0].toUpperCase()+m.slice(1)}</button>`).join('')}</div>
 <label class="f">Colourway</label><div class="cwgrid">${CW_ORDER.map(k=>{const c=CW[k],v=dk?c.Dk:c.L;return `<button class="cw ${TH.cw===k?'on':''}" data-cw="${k}" style="background:${v.bg};color:${v.fg};font-family:${c.fh}"><span class="sw"><i style="background:${v.a}"></i><i style="background:${v.a2}"></i><i style="background:${v.a3}"></i></span><b>${esc(c.n)}</b></button>`}).join('')}</div>
 <div class="ver">Crew Map ${VERSION} · roster synced from Grok Bot</div>`);
 $$('[data-thm]').forEach(b=>b.onclick=()=>{TH.mode=b.dataset.thm;saveTheme()});$$('[data-cw]').forEach(b=>b.onclick=()=>{TH.cw=b.dataset.cw;saveTheme()})}
$('#themeBtn').onclick=openTheme;

/* ---------- roster model ---------- */
let R=null,BOT={},DEP={};
function setRoster(r){
 if(!r||!Array.isArray(r.bots)||r.bots.length<5)return false;
 if(!r.version){ // legacy roster.json (v3 format): names + roles only
  r={version:1,lead:{id:'jackson',name:'Jackson',role:'Head Honcho',about:''},departments:[{id:'unassigned',name:'Crew',head:null,color:'#8A8F98'}],
   bots:r.bots.map(b=>({...b,tier:b.id==='chief'?'chief':'bot',dept:b.id==='chief'?'exec':'unassigned',reportsTo:b.id==='chief'?'jackson':'chief',dotted:[],shape:'circle',color:'sky',about:b.role,runs:[]})),groups:[],schedule:[]}}
 R=r;BOT={};DEP={};
 const L=r.lead||{id:'jackson',name:'Jackson',role:'Head Honcho'};
 BOT.jackson={id:'jackson',name:L.name||'Jackson',role:L.role||'',tier:'lead',dept:'exec',reportsTo:null,shape:'person',color:'white',about:L.about||'',dotted:[],runs:[]};
 r.bots.forEach(b=>{if(b&&b.id)BOT[String(b.id)]=Object.assign({dotted:[],runs:[]},b)});
 (r.departments||[]).forEach(d=>DEP[d.id]=d);
 return true}
const isBot=id=>!!BOT[id];
const col=id=>id==='jackson'?'var(--text)':BOT[id]?(C[BOT[id].color]||BOT[id].color||'#888'):'var(--muted)';
const nm=id=>id==='all'?'Everyone':BOT[id]?BOT[id].name:APPS[id]||String(id||'?').replace(/^./,c=>c.toUpperCase());
const deptBots=k=>Object.values(BOT).filter(b=>b.dept===k&&b.tier==='bot').sort((a,b)=>a.name.localeCompare(b.name));
const heads=()=>(R.departments||[]).map(d=>d.head).filter(h=>BOT[h]);
const groupsOf=id=>(R.groups||[]).filter(g=>g.members.includes(id));
function iconSVG(id,size=24){const b=BOT[id]||{shape:'circle'},s=b.shape in SH?b.shape:'circle',c=col(id),so=STROKE_ONLY[s];
 return `<svg viewBox="-14 -14 28 28" width="${size}" height="${size}"><path d="${SH[s]}" style="fill:${so?'none':c};stroke:${c}" stroke-width="${so?2:1}" stroke-linecap="round"/></svg>`}
const av=(id,cls='')=>`<span class="av ${cls}" style="background:color-mix(in srgb,${col(id)} 16%,transparent)">${iconSVG(id)}</span>`;

/* ---------- tabs ---------- */
function show(v){$$('#tabs button').forEach(x=>x.classList.toggle('on',x.dataset.v===v));['org','crew','today','list'].forEach(k=>$('#v-'+k).hidden=k!==v);
 $('#app').classList.toggle('wide',v==='org');if(location.hash.slice(1)!==v)history.replaceState(null,'','#'+v);window.scrollTo(0,0)}
$$('#tabs button').forEach(b=>b.onclick=()=>show(b.dataset.v));
/* org sub-view: Tree (default on phones) / Map */
let orgMode=localStorage.getItem('crewmap:org')||(innerWidth<760?'tree':'map');
function setOrg(m){orgMode=m;localStorage.setItem('crewmap:org',m);$$('#orgView button').forEach(b=>b.classList.toggle('on',b.dataset.o===m));$('#orgTree').hidden=m!=='tree';$('#orgMap').hidden=m!=='map'}
$$('#orgView button').forEach(b=>b.onclick=()=>setOrg(b.dataset.o));

/* ---------- sheet ---------- */
function openSheet(k,html){$('#sheet').dataset.k=k;$('#sheetBody').innerHTML=html;$('#sheet').hidden=false}
function closeSheet(){$('#sheet').hidden=true;unfocus()}
$('#close').onclick=closeSheet;$('#sheet').onclick=e=>{if(e.target.id==='sheet')closeSheet()};
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet()});
const flowsOf=id=>FLOWS.filter(f=>(f[0]===id||f[1]===id)&&(isBot(f[0])||APPS[f[0]])&&(isBot(f[1])||APPS[f[1]]));
function botSheet(id){const b=BOT[id];if(!b)return;const d=DEP[b.dept];
 const boss=b.reportsTo?nm(b.reportsTo):'—',kids=Object.values(BOT).filter(x=>x.reportsTo===id).map(x=>x.id);
 const fl=flowsOf(id),outs=fl.filter(f=>f[0]===id).map(f=>`${esc(nm(f[1]))} <span class="sub">(${esc(f[2])})</span>`),ins=fl.filter(f=>f[1]===id).map(f=>`${esc(nm(f[0]))} <span class="sub">(${esc(f[2])})</span>`);
 const sch=SCHED().filter(s=>s.who.includes(id)),grp=groupsOf(id);
 const row=(k,v)=>v?`<div class="kv"><b>${k}</b><div>${v}</div></div>`:'';
 openSheet('bot',`<h3>${av(id)}${esc(b.name)}${b.hidden?'<span class="tag">hidden</span>':''}</h3><div class="r">${esc(b.role)}${d&&d.id!=='exec'?' · '+esc(d.name):b.tier==='head'||b.tier==='chief'?' · Executives':''}</div>
 ${b.about?`<p style="margin:0 0 10px">${esc(b.about)}</p>`:''}
 ${row('Reports to',id==='jackson'?'—':esc(boss))}${row(b.tier==='head'||id==='chief'||id==='jackson'?'Leads':'Manages',kids.length?kids.map(k=>esc(nm(k))).join(', '):'')}
 ${row('Also with',(b.dotted||[]).map(k=>esc(nm(k))).join(', '))}
 ${row('Group chats',grp.map(g=>esc(g.name)).join(', '))}
 ${row('Schedule',sch.map(s=>`<b>${esc(s.when)}</b> ${esc(s.note)}`).join('<br>'))}
 ${row('Sends to',outs.length?'<ul><li>'+outs.join('</li><li>')+'</li></ul>':'')}${row('Gets from',ins.length?'<ul><li>'+ins.join('</li><li>')+'</li></ul>':'')}`)}
function groupSheet(g){openSheet('group',`<h3>${esc(g.name)}</h3><div class="r">Group chat · ${g.members.length} members</div>${g.members.map(id=>`<div class="node-row" data-bot="${esc(id)}">${av(id)}<div class="grow"><div class="t">${esc(nm(id))}</div><div class="s">${esc(BOT[id]?.role||'')}</div></div><span class="chev">›</span></div>`).join('')}`);
 $$('#sheetBody [data-bot]').forEach(x=>x.onclick=()=>botSheet(x.dataset.bot))}

/* ---------- org: tree ---------- */
function rowHTML(id,sub){const b=BOT[id];return `<div class="node-row" data-bot="${esc(id)}">${av(id)}<div class="grow"><div class="t">${esc(b.name)}${b.hidden?'<span class="tag">hidden</span>':''}</div><div class="s">${esc(sub??b.role)}</div></div><span class="chev">›</span></div>`}
function drawTree(){const el=$('#orgTree');let h=`<div class="lead"><div class="card">${rowHTML('jackson')}</div><div class="stem"></div>`;
 if(BOT.chief)h+=`<div class="card">${rowHTML('chief')}</div><div class="stem"></div>`;h+='</div><div class="tree-grid">';
 (R.departments||[]).forEach(d=>{const kids=deptBots(d.id);if(!d.head&&!kids.length)return;
  h+=`<div class="card dept" style="--dc:${d.color}"><div class="dh"><b style="color:${d.color}">${esc(d.name)}</b><span class="n">${kids.length+(d.head?1:0)} bots</span></div>`;
  if(d.head&&BOT[d.head])h+=rowHTML(d.head,BOT[d.head].role);
  if(kids.length)h+=`<div class="${d.head?'kids':''}">${kids.map(k=>rowHTML(k.id)).join('')}</div>`;h+='</div>'});
 el.innerHTML=h+'</div>';el.querySelectorAll('[data-bot]').forEach(x=>x.onclick=()=>botSheet(x.dataset.bot))}

/* ---------- org: map (SVG) ---------- */
const W=216,H=52,CW_=246;let P={},links={},pinned=null;
function drawMap(){const svg=$('#map');svg.innerHTML='';P={};links={};
 const cols=(R.departments||[]).filter(d=>d.head||deptBots(d.id).length),n=Math.max(cols.length,1),width=Math.max(n*CW_,760),cx=width/2;
 const reg=(a,b,e)=>{(links[a]=links[a]||[]).push({e,o:b});(links[b]=links[b]||[]).push({e,o:a})};
 const defs=mk('defs',{},svg),gR=mk('g',{},svg),gF=mk('g',{},svg),gN=mk('g',{},svg);
 const mark=(id,c)=>{const m=mk('marker',{id,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'},defs);mk('path',{d:'M0 0L10 5L0 10Z',style:`fill:${c}`},m)};
 mark('ar','var(--muted)');
 const rep=(d,a,b,cls='rep',arrow=true)=>{const p=mk('path',{d,class:cls,'marker-end':arrow?'url(#ar)':null},gR);if(a)reg(a,b,p);return p};
 P.jackson={x:cx,y:40};if(BOT.chief)P.chief={x:cx,y:130};
 const rail=196,headY=278,botY0=360,step=68;let maxY=headY;
 cols.forEach((d,i)=>{const x=CW_*(i+.5)+(width-n*CW_)/2;
  const pill=mk('g',{class:'dpill','data-dept':d.id},gN);const tw=Math.min(W,d.name.length*8+28);
  mk('rect',{x:x-tw/2,y:222,width:tw,height:24,rx:12,style:`stroke:${d.color}`},pill);const t=mk('text',{x,y:238,'text-anchor':'middle',style:`fill:${d.color}`},pill);t.textContent=d.name;
  const top=d.head?headY:botY0-step;
  if(BOT.chief)rep(`M${cx} ${130+H/2}V${rail}H${x}V${d.head?headY-H/2-4:216}`,'chief',d.head||null);
  if(d.head)P[d.head]={x,y:headY};
  deptBots(d.id).forEach((b,j)=>{P[b.id]={x,y:botY0+step*j};maxY=Math.max(maxY,P[b.id].y)});
  const kids=deptBots(d.id);if(kids.length){const sx=x-W/2+14,last=P[kids[kids.length-1].id].y;
   rep(`M${sx} ${d.head?headY+H/2:246}V${last}`,null,null,'rep',false);
   kids.forEach(b=>rep(`M${sx} ${P[b.id].y}H${x-W/2}`,d.head||b.reportsTo,b.id,'rep',false))}});
 if(BOT.chief)rep(`M${cx} ${40+H/2}V${130-H/2-4}`,'jackson','chief');
 // apps row
 const appIds=Object.keys(APPS).filter(a=>FLOWS.some(f=>(f[0]===a||f[1]===a)&&(isBot(f[0])||isBot(f[1])))),ay=maxY+120;
 appIds.forEach((a,i)=>{P[a]={x:width*(i+1)/(appIds.length+1),y:ay,app:1}});
 const pos=id=>{const p=P[id];if(!p)return null;return p.app?{...p,w:APPS[id].length*8+34,h:30}:{...p,w:W,h:H}};
 // dotted "also works with"
 Object.values(BOT).forEach(b=>(b.dotted||[]).forEach(o=>{const p=pos(b.id),q=pos(o);if(!p||!q)return;
  const dir=q.x<p.x?-1:1,sx=p.x+dir*W/2,qx=q.x-dir*W/2,mx=(sx+qx)/2;const e=mk('path',{d:`M${sx} ${p.y}C${mx} ${p.y} ${mx} ${q.y+10} ${qx} ${q.y+10}`,class:'dotted'},gR);reg(b.id,o,e)}));
 // flows
 const edge=(p,q)=>{if(Math.abs(p.x-q.x)<40){const sx=p.x-p.w/2,qx=q.x-q.w/2,b=Math.min(sx,qx)-26-Math.abs(p.y-q.y)*.1;return `M${sx} ${p.y}C${b} ${p.y} ${b} ${q.y} ${qx} ${q.y}`}
  if(q.app||p.app){const a=p.app?q:p,o=p.app?p:q;const s=`M${a.x} ${a.y+a.h/2}C${a.x} ${o.y-60} ${o.x} ${o.y-80} ${o.x} ${o.y-o.h/2}`;
   return p.app?`M${o.x} ${o.y-o.h/2}C${o.x} ${o.y-80} ${a.x} ${a.y+90} ${a.x} ${a.y+a.h/2}`:s}
  const dir=q.x>p.x?1:-1,sx=p.x+dir*p.w/2,qx=q.x-dir*q.w/2,mx=(sx+qx)/2;return `M${sx} ${p.y}C${mx} ${p.y} ${mx} ${q.y} ${qx} ${q.y}`};
 FLOWS.forEach(([a,b,lbl,c,both],i)=>{const p=pos(a),q=pos(b);if(!p||!q)return;c=c||col(isBot(a)?a:b);const id='f'+i;mark(id,c);
  const e=mk('path',{d:edge(p,q),class:'flow',style:`stroke:${c}`,'marker-end':`url(#${id})`,'marker-start':both?`url(#${id})`:null},gF);e.dataset.lbl=lbl;reg(a,b,e)});
 // nodes
 Object.keys(P).forEach(id=>{const p=pos(id);
  if(p.app){const g=mk('g',{class:'app'+(id==='runs'?' flowonly':''),'data-id':id},gN);mk('rect',{x:p.x-p.w/2,y:p.y-p.h/2,width:p.w,height:p.h,rx:15},g);const t=mk('text',{x:p.x,y:p.y+4,'text-anchor':'middle'},g);t.textContent=(id==='runs'?'⛁ ':'▣ ')+APPS[id];return}
  const b=BOT[id],c=col(id),s=b.shape in SH?b.shape:'circle',so=STROKE_ONLY[s];
  const g=mk('g',{class:'node'+(b.hidden?' hiddenbot':''),transform:`translate(${p.x} ${p.y})`,'data-id':id},gN);
  mk('rect',{class:'box',x:-W/2,y:-H/2,width:W,height:H,rx:16},g);
  mk('circle',{cx:-W/2+27,cy:0,r:17,style:`fill:${c};fill-opacity:.16`},g);
  mk('path',{d:SH[s],transform:`translate(${-W/2+27} 0)`,style:`fill:${so?'none':c};stroke:${c}`,'stroke-width':so?2:0,'stroke-linecap':'round'},g);
  const t1=mk('text',{x:-W/2+54,y:-3,class:'name'},g);t1.textContent=b.name.length>19?b.name.slice(0,18)+'…':b.name;
  const t2=mk('text',{x:-W/2+54,y:14,class:'role'},g);t2.textContent=b.role.length>27?b.role.slice(0,26)+'…':b.role;
  g.addEventListener('mouseenter',()=>{if(!pinned)focus(id)});g.addEventListener('mouseleave',()=>{if(!pinned)unfocus()});
  g.addEventListener('click',e=>{e.stopPropagation();pinned=id;focus(id);botSheet(id)})});
 svg.setAttribute('viewBox',`-70 8 ${width+140} ${ay+40}`);svg.classList.add('mode-'+($('#modes .on')?.dataset.m||'both'))}
function focus(id){const svg=$('#map');svg.classList.add('focus');svg.querySelectorAll('.hl').forEach(x=>x.classList.remove('hl'));
 const ids=Array.isArray(id)?id:[id];ids.forEach(i=>{svg.querySelector(`[data-id="${i}"]`)?.classList.add('hl');if(!Array.isArray(id))(links[i]||[]).forEach(({e,o})=>{e.classList.add('hl');svg.querySelector(`[data-id="${o}"]`)?.classList.add('hl')})});
}
function unfocus(){pinned=null;const s=$('#map');s&&s.classList.remove('focus');s&&s.querySelectorAll('.hl').forEach(x=>x.classList.remove('hl'));$$('.group.on').forEach(x=>x.classList.remove('on'))}
$$('#modes button').forEach(b=>b.onclick=()=>{$$('#modes button').forEach(x=>x.classList.toggle('on',x===b));const s=$('#map');s.classList.remove('mode-rep','mode-flow','mode-both');s.classList.add('mode-'+b.dataset.m)});
let zoom=innerWidth<760?2.5:1;$('#map').style.width=(zoom*100)+'%';$$('.zoom button').forEach(b=>b.onclick=e=>{e.stopPropagation();zoom=Math.min(4,Math.max(1,zoom+(+b.dataset.z)*.5));$('#map').style.width=(zoom*100)+'%'});
$('#map').addEventListener('click',()=>closeSheet());

/* ---------- group chats ---------- */
function drawGroups(){const el=$('#groups'),gs=R.groups||[];
 el.innerHTML=gs.length?gs.map((g,i)=>{const d=DEP[g.dept];return `<div class="card group" data-g="${i}" style="--dc:${d?d.color:'var(--accent)'}"><div class="gt"><i></i>${esc(g.name)}<span class="sub" style="margin-left:auto">${g.members.length}</span></div><div class="stack">${g.members.slice(0,9).map(id=>av(id)).join('')}</div></div>`}).join(''):'<div class="empty">No group chats yet.</div>';
 el.querySelectorAll('[data-g]').forEach(x=>x.onclick=()=>{const g=gs[+x.dataset.g];$$('.group.on').forEach(y=>y.classList.remove('on'));x.classList.add('on');if(orgMode==='map')focus(g.members);groupSheet(g)})}

/* ---------- crew tab ---------- */
function drawCrew(){const root=$('#v-crew');const lb=x=>nm(x);
 const card=id=>{const b=BOT[id],fl=flowsOf(id).map(f=>f[0]===id?`→ ${lb(f[1])}: ${f[2]}`:`← ${lb(f[0])}: ${f[2]}`),sch=SCHED().filter(s=>s.who.includes(id)).map(s=>`🕒 ${s.when}`);
  return `<div class="bot" data-bot="${esc(id)}">${av(id)}<div style="min-width:0"><b style="color:${col(id)}">${esc(b.name)}${b.hidden?'<span class="tag">hidden</span>':''}</b><span class="role">${esc(b.role)}</span><p>${esc(b.about)}</p>${sch.length||fl.length?`<div class="chips">${sch.map(x=>`<span class="chip acc">${esc(x)}</span>`).join('')}${fl.map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div>`:''}</div></div>`};
 let h='';const sch=SCHED();let lastG='';
 if(sch.length)h+=`<div class="card sched"><h2>Crew schedule <small>next up first · Ontario time</small></h2>${sch.map(s=>{const g=s.group!==lastG?`<div class="sgrp">${esc(s.group)}</div>`:'';lastG=s.group;
  return `${g}<div class="row"><div class="tm">${s.label!==s.group?`<span class="dl">${esc(s.label)}</span>`:''}${esc(s.clock)}</div><div><div class="who">${s.who.map(w=>`<span class="chip" style="color:${col(w)}">${esc(nm(w))}</span>`).join('')}</div><div class="note">${esc(s.note)} · <span class="rp">${esc(CrewSched.rep(s))}</span></div></div></div>`}).join('')}</div>`;
 h+=`<div class="card"><h2>Leadership</h2>${['jackson','chief'].filter(isBot).map(card).join('')}</div>`;
 (R.departments||[]).forEach(d=>{const ids=(d.head?[d.head]:[]).concat(deptBots(d.id).map(b=>b.id)).filter(isBot);if(!ids.length)return;
  h+=`<div class="card dept" style="--dc:${d.color}"><h2><span style="color:${d.color}">${esc(d.name)}</span><small>${ids.length} bots</small></h2>${ids.map(card).join('')}</div>`});
 root.innerHTML=h;root.querySelectorAll('[data-bot]').forEach(x=>x.onclick=()=>botSheet(x.dataset.bot))}

/* ---------- today network + feed ---------- */
function msgHTML(i){return `<div class="meta"><span class="time">${esc(i.time)}</span><span class="who" style="color:${col(i.from)}">${esc(nm(i.from))}</span>→<span class="who" style="color:${col(i.to)}">${esc(nm(i.to))}</span></div><div class="topic">${esc(i.topic)}</div><div class="sum">${esc(i.summary)}</div>`}
const msgSheet=(title,items)=>openSheet('msgs',`<h3>${title}</h3>`+items.map(i=>`<div class="msg">${msgHTML(i)}</div>`).join(''));
function drawNet(items){const svg=$('#net');svg.innerHTML='';$('#todayEmpty').hidden=!!items.length;svg.style.display=items.length?'':'none';if(!items.length)return;
 const ids=[...new Set(items.flatMap(i=>[i.from,i.to]))],order=id=>{const b=BOT[id];if(!b)return [9,id];const di=(R.departments||[]).findIndex(d=>d.id===b.dept);return [b.tier==='lead'?0:b.tier==='chief'?1:2+Math.max(di,0),b.tier==='head'?'':b.name]};
 ids.sort((a,b)=>{const x=order(a),y=order(b);return x[0]-y[0]||String(x[1]).localeCompare(String(y[1]))});
 const S=520,cx=S/2,cy=S/2,R0=ids.length>14?190:160,nr=ids.length>14?14:18,Q={};svg.setAttribute('viewBox',`0 0 ${S} ${S}`);
 ids.forEach((id,k)=>{const a=-Math.PI/2+2*Math.PI*k/ids.length;Q[id]={x:cx+R0*Math.cos(a),y:cy+R0*Math.sin(a),a}});
 const defs=mk('defs',{},svg),edges={};items.forEach(i=>{(edges[i.from+'>'+i.to]=edges[i.from+'>'+i.to]||[]).push(i)});
 Object.entries(edges).forEach(([k,list])=>{const[f,t]=k.split('>');const c=col(f),mid='m'+k.replace(/\W/g,'');const m=mk('marker',{id:mid,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:5,markerHeight:5,orient:'auto'},defs);mk('path',{d:'M0 0L10 5L0 10Z',style:`fill:${c}`},m);
  const a=Q[f],b=Q[t],dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,r=nr+2,x1=a.x+ux*r,y1=a.y+uy*r,x2=b.x-ux*(r+2),y2=b.y-uy*(r+2);
  const qx=cx+((x1+x2)/2-cx)*.45,qy=cy+((y1+y2)/2-cy)*.45; // pull curves toward the centre
  const g=mk('g',{class:'edge'},svg),d=`M${x1} ${y1}Q${qx} ${qy} ${x2} ${y2}`;mk('path',{d,style:`stroke:${c}`,'stroke-width':Math.min(1.2+list.length*.6,4.5),'stroke-opacity':.75,fill:'none','marker-end':`url(#${mid})`},g);mk('path',{d,class:'hit'},g);
  if(list.length>1){const mx=.25*x1+.5*qx+.25*x2,my=.25*y1+.5*qy+.25*y2;mk('circle',{cx:mx,cy:my,r:8,class:'nodebg',style:`stroke:${c}`},g);const tx=mk('text',{x:mx,y:my+3.5,'text-anchor':'middle','font-size':9,class:'lbl'},g);tx.textContent=list.length}
  g.onclick=()=>msgSheet(`${esc(nm(f))} → ${esc(nm(t))}`,list)});
 ids.forEach(id=>{const q=Q[id],g=mk('g',{transform:`translate(${q.x} ${q.y})`,class:'edge'},svg);mk('circle',{r:nr,class:'nodebg',style:`stroke:${col(id)}`,'stroke-width':2},g);
  if(BOT[id]){const s=BOT[id].shape in SH?BOT[id].shape:'circle',so=STROKE_ONLY[s];mk('path',{d:SH[s],style:`fill:${so?'none':col(id)};stroke:${col(id)}`,'stroke-width':so?2:0,transform:`scale(${nr/20})`},g)}else{const t=mk('text',{'text-anchor':'middle',y:3.5,'font-size':9,class:'lbl'},g);t.textContent='ALL'}
  const ca=Math.cos(q.a),sa=Math.sin(q.a),lx=ca*(nr+8),ly=sa*(nr+8)+4+(Math.abs(ca)<.3?sa*6:0);
  const lb=mk('text',{x:lx,y:ly,'text-anchor':Math.abs(ca)<.3?'middle':ca>0?'start':'end',class:'lbl'},g);lb.textContent=nm(id).replace('Fix it ','');
  g.onclick=()=>msgSheet(esc(nm(id))+' today',items.filter(i=>i.from===id||i.to===id))})}
function drawList(items){const f=$('#feed');f.innerHTML=items.length?'':'<li class="card empty">No bot-to-bot messages yet today.</li>';
 [...items].reverse().forEach(i=>{const li=document.createElement('li');li.className='card';li.innerHTML=msgHTML(i);li.onclick=()=>msgSheet('Message',[i]);f.appendChild(li)})}

/* ---------- loading ---------- */
async function getJSON(urls,timeout=6000,ok=()=>true){for(const u of urls){try{const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),timeout);
 const r=await fetch(u+(u.startsWith('http')?'?t='+Date.now():'?v='+Date.now()),{cache:'no-store',signal:ctl.signal});clearTimeout(t);if(r.ok){const j=await r.json();if(ok(j))return j}}catch(e){}}return null}
let lastRoster='',lastAct='',ACT=null;
function renderRoster(){drawTree();drawMap();drawGroups();drawCrew();if(ACT){drawNet(ACT.items);drawList(ACT.items)}}
function status(){const nb=R?R.bots.length:0,d=ACT?new Date(ACT.date+'T12:00:00').toLocaleDateString('en-CA',{weekday:'short',month:'short',day:'numeric'}):'';$('#status').textContent=ACT?`${d} · ${ACT.generated} · ${ACT.items.length} msgs · ${nb} bots`:`${nb} bots`}
async function load(){
 const r=await getJSON(ROSTER_URLS,6000,j=>j&&j.version>=2)||await getJSON(ROSTER_URLS);if(r){const s=JSON.stringify(r);if(s!==lastRoster&&setRoster(r)){lastRoster=s;renderRoster()}}
 const a=await getJSON(DATA_URLS);if(a&&Array.isArray(a.items)){const s=JSON.stringify(a);ACT=a;if(s!==lastAct){lastAct=s;if(R){drawNet(a.items);drawList(a.items)}}}
 if(R)status();else $('#status').textContent='offline – retrying';if(!a&&R)$('#status').textContent=`offline – retrying · ${R.bots.length} bots`}
setOrg(orgMode);show(['org','crew','today','list'].includes(location.hash.slice(1))?location.hash.slice(1):'org');
load();setInterval(load,60000);setInterval(()=>{if(R)drawCrew()},60000);const shTick=()=>window.CrewSched&&CrewSched.loadShifts().then(x=>{if(x&&R)drawCrew()});shTick();setInterval(shTick,30*60e3);document.addEventListener('visibilitychange',()=>{if(!document.hidden)load()});
