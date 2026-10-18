const C={yellow:'#F5C518',blue:'#4A90E2',green:'#3BA55C',orange:'#FF9F1C',cyan:'#2EC4D6',violet:'#9B5DE5',red:'#E63946',magenta:'#E040A0',teal:'#1BA7A7',lime:'#A3E635',pink:'#FF8FA3',gold:'#E0A83A',sky:'#7DD3FC',white:'#eee',coral:'#e06a3a',indigo:'#6366F1'};
const SH={
shield:'M0-12L10-8V0C10 7 5 11 0 13C-5 11-10 7-10 0V-8Z',
hexagon:'M0-12L10.4-6V6L0 12L-10.4 6V-6Z',
square:'M-10-10H10V10H-10Z',
cloud:'M-9 7H8A5 5 0 0 0 8-3A7 7 0 0 0-5-5A5 5 0 0 0-9 7Z',
leaf:'M-9 9C-11-3-3-11 10-11C11 2 3 10-9 9ZM-9 9L4-4',
gem:'M-6-10H6L11-4L0 12L-11-4Z',
heart:'M0 11C-14 1-10-11 0-5C10-11 14 1 0 11Z',
teardrop:'M0-12C6-4 9 0 9 4A9 9 0 0 1-9 4C-9 0-6-4 0-12Z',
house:'M0-11L11-1H8V10H-8V-1H-11Z',
clover:'M0 0A5 5 0 1 1 0-9A5 5 0 1 1 0 0A5 5 0 1 1 9 0A5 5 0 1 1 0 0A5 5 0 1 1 0 9A5 5 0 1 1 0 0A5 5 0 1 1-9 0A5 5 0 1 1 0 0Z',
sparkle:'M0-12Q2-2 12 0Q2 2 0 12Q-2 2-12 0Q-2-2 0-12Z',
star:'M0-12L3.5-4H12L5 1L8 10L0 4L-8 10L-5 1L-12-4H-3.5Z',
triangle:'M0-11L11 9H-11Z',
diamond:'M0-12L10 0L0 12L-10 0Z',
circle:'M-11 0A11 11 0 1 0 11 0A11 11 0 1 0-11 0Z',
book:'M-11-8Q-5-11 0-8Q5-11 11-8V9Q5 6 0 9Q-5 6-11 9Z',
bolt:'M3-12L-8 2H-1L-4 12L8-3H1Z',
spiral:'M0 0A2 2 0 0 1 4 0A4 4 0 0 1-4 0A6 6 0 0 1 8 0A8 8 0 0 1-8 0A10 10 0 0 1 12 0',
person:'M0-12A5 5 0 1 1 0-2A5 5 0 1 1 0-12ZM-10 12C-10 2 10 2 10 12Z',
crown:'M-11 8V-6L-5 0L0-9L5 0L11-6V8Z'};
const X=[130,370,610,850,1090];
const B={ // id:[name,role,shape,color,x,y,dept,about]
jackson:['Jackson','Head Honcho','person','white',620,40,null,'Sets priorities and approves deploys.'],
chief:['Chief','Manager','shield','yellow',620,130,null,'Runs the crew, Sunday board meeting, monthly backlog review (1st, 18:00).'],
cal:['Cal','Calendar','hexagon','blue',X[0],330,'ops','Shift calendars (Chartright + EA), schedule, gym times.'],
remi:['Remi','Planner','square','green',X[0],402,'ops','To-do list, tasks and reminders.'],
sunny:['Sunny','Daily Briefing','cloud','orange',X[0],474,'ops','Builds and publishes the morning briefing.'],
indie:['Indie','Inbox','leaf','cyan',X[0],546,'ops','Triages Gmail, surfaces important mail.'],
penny:['Penny','Finance','gem','violet',X[1],330,'fin','Bank feed, balances, Stack app.'],
sally:['Sally','Shopping · formerly Basil','star','lime',X[1],402,'fin','Weekly Costco list (Fri 18:00) from Logbook pantry.'],
nick:['Nick','Gifts','heart','red',X[1]+18,474,'fin','Gift deadlines and gift spending. Grouped under Sally.'],
scout:['Scout','Pilot Jobs','teardrop','cyan',X[2],330,'car','Finds pilot job prospects.'],
ace:['Ace','Aviation Study','triangle','sky',X[2],402,'car','Aviation study; works with Scout.'],
margot:['Margot','French','book','pink',X[2],474,'car','French learning.'],
adam:['Adam','Economics & Politics','diamond','gold',X[2],546,'car','Economics and politics digests.'],
felix:['Fix it Felix','Developer','house','magenta',X[3],330,'tech','Builds and fixes apps (Logbook, Stack, Briefing site).'],
quinn:['Quinn','Quality Control','circle','teal',X[3],402,'tech','Reads runs.jsonl, flags broken things to Felix.'],
atlas:['Atlas','Optimization','bolt','indigo',X[3],474,'tech','Reads Penny, Cal, Remi and the Logbook to optimize.'],
romeo:['Romeo','Guelph Visits','clover','violet',X[4],330,'life','Plans Guelph visits around free time.'],
gram:['Gram','Games','sparkle','green',X[4],402,'life','Party games.'],
vinny:['Vinny','Vortex · role TBD','spiral','coral',X[4],474,'life','New bot — role TBD.']};
const D={ops:['Operations',0,'#4A90E2'],fin:['Finance & Household',1,'#9B5DE5'],car:['Career & Learning',2,'#1BA7A7'],tech:['Tech & Reliability',3,'#E040A0'],life:['Personal & Fun',4,'#3BA55C']};
const APPS={logbook:['Logbook',300,680],stack:['Stack',460,680],briefing:['Briefing site',620,680],runs:['runs.jsonl',850,620]};
const FLOWS=[ // from,to,label,color
['cal','sunny','schedule'],['remi','sunny','to-do'],['indie','sunny','mail'],['penny','sunny','balances'],['scout','sunny','top jobs'],
['sunny','briefing','publishes'],['penny','stack','money'],
['runs','quinn','all bots log',C.teal],['quinn','felix','fixes',C.teal],
['atlas','penny','reads'],['atlas','cal','reads'],['atlas','remi','reads'],['atlas','logbook','reads'],
['sally','logbook','reads'],['ace','scout','study ↔ jobs',null,true],['felix','logbook','maintains'],['felix','stack','maintains'],['felix','briefing','maintains']];
const W=200,H=50,svg=document.getElementById('map'),NS='http://www.w3.org/2000/svg';
const el=(t,a,p=svg)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);p.appendChild(e);return e};
const defs=el('defs',{});
const mk=(id,col)=>{const m=el('marker',{id,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'},defs);el('path',{d:'M0 0L10 5L0 10Z',fill:col},m)};
mk('ar','#777');
const L=[],links={};const reg=(a,b,e)=>{(links[a]=links[a]||[]).push({e,o:b});(links[b]=links[b]||[]).push({e,o:a})};
const pos=id=>B[id]?{x:B[id][4],y:B[id][5],w:W,h:H}:{x:APPS[id][1],y:APPS[id][2],w:APPS[id][0].length*8+30,h:28};
const gR=el('g',{}),gF=el('g',{}),gN=el('g',{});
// reporting
const rep=(d,a,b)=>{const p=el('path',{d,class:'rep','marker-end':'url(#ar)'},gR);if(a)reg(a,b,p);return p};
rep('M620 65V105','jackson','chief');
for(const k in D){const [n,i,col]=D[k],x=X[i];
 rep(`M620 155V200H${x}V245`,'chief','d_'+k);
 const g=el('g',{class:'dept'},gN);el('rect',{x:x-W/2,y:250,width:W,height:32,rx:10,stroke:col},g);
 const t=el('text',{x,y:271,'text-anchor':'middle',fill:col},g);t.textContent=n;
 const kids=Object.keys(B).filter(b=>B[b][6]===k&&b!=='nick');
 const last=B[kids[kids.length-1]][5];
 el('path',{d:`M${x-W/2+8} 282V${last}`,class:'rep'},gR);
 kids.forEach(b=>{const p=rep(`M${x-W/2+8} ${B[b][5]}H${x-W/2+12}`,'chief',b);p.removeAttribute('marker-end')});}
rep(`M${X[1]-80} ${402+H/2}V474H${X[1]+18-W/2}`,'sally','nick');
// nodes
for(const id in B){const [n,r,s,c,x,y]=B[id];const w=id==='nick'?W-36:W;
 const g=el('g',{class:'node',transform:`translate(${x} ${y})`,'data-id':id},gN);
 el('rect',{class:'box',x:-w/2+(id==='nick'?0:0),y:-H/2,width:w,height:H,rx:14},g);
 el('circle',{cx:-w/2+26,cy:0,r:17,fill:C[c],'fill-opacity':.15},g);
 const fill=['leaf','spiral'].includes(s)?'none':C[c];
 el('path',{d:SH[s],transform:`translate(${-w/2+26} 0)`,fill:s==='spiral'?'none':C[c],stroke:C[c],'stroke-width':s==='spiral'||s==='leaf'?2:0,'stroke-linecap':'round'},g);
 const t1=el('text',{x:-w/2+52,y:-3,class:'name'},g);t1.textContent=n;
 const t2=el('text',{x:-w/2+52,y:14,class:'role'},g);t2.textContent=r;
 g.addEventListener('mouseenter',()=>focus(id));g.addEventListener('mouseleave',()=>{if(!pinned)unfocus()});
 g.addEventListener('click',e=>{e.stopPropagation();pinned=pinned===id?null:id;pinned?focus(id):unfocus()});}
for(const id in APPS){const p=pos(id);const g=el('g',{class:'app'+(id==='runs'?' flowonly':''),'data-id':id},gN);
 el('rect',{x:p.x-p.w/2,y:p.y-p.h/2,width:p.w,height:p.h,rx:14},g);const t=el('text',{x:p.x,y:p.y+4,'text-anchor':'middle'},g);t.textContent=(id==='runs'?'⛁ ':'▣ ')+APPS[id][0];}
el('text',{x:850,y:650,'text-anchor':'middle',class:'flowlbl flowonly'},gF).textContent='every bot appends here';
// flows
const edge=(p,q)=>{ // anchor points
 if(Math.abs(p.x-q.x)<40){const sx=p.x-p.w/2,qx=q.x-q.w/2,b=Math.min(sx,qx)-30-Math.abs(p.y-q.y)*.12;return `M${sx} ${p.y}C${b} ${p.y} ${b} ${q.y} ${qx} ${q.y}`}
 const dir=q.x>p.x?1:-1;const sx=p.x+dir*p.w/2,qx=q.x-dir*q.w/2;
 if(q.y-p.y>150&&Math.abs(q.x-p.x)<300){return `M${p.x} ${p.y+p.h/2}C${p.x} ${q.y} ${p.x} ${q.y} ${qx} ${q.y}`}
 const mx=(sx+qx)/2;return `M${sx} ${p.y}C${mx} ${p.y} ${mx} ${q.y} ${qx} ${q.y}`};
FLOWS.forEach(([a,b,lbl,col,both],i)=>{col=col||(B[a]?C[B[a][3]]:'#888');if(a==='felix')col='#E040A0';
 const id='f'+i;mk(id,col);const p=pos(a),q=pos(b);let d=edge(p,q);
 if(a==='runs'){d=`M${p.x} ${p.y-p.h/2}V${q.y+H/2}`}
 if(a==='quinn'&&b==='felix'){d=`M${p.x+W/2} ${p.y}C${p.x+W/2+40} ${p.y} ${q.x+W/2+40} ${q.y} ${q.x+W/2} ${q.y}`}
 const e=el('path',{d,class:'flow',stroke:col,'marker-end':`url(#${id})`},gF);if(both)e.setAttribute('marker-start',`url(#${id})`);
 e.dataset.lbl=lbl;reg(a,b,e);});
// mode
document.querySelectorAll('#modes button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#modes button').forEach(x=>x.classList.toggle('on',x===b));svg.classList.remove('mode-rep','mode-flow','mode-both');svg.classList.add('mode-'+b.dataset.m)});
svg.classList.add('mode-both');
let pinned=null;const card=document.getElementById('card');
function focus(id){svg.classList.add('focus');svg.querySelectorAll('.hl').forEach(x=>x.classList.remove('hl'));
 const g=svg.querySelector(`[data-id="${id}"]`);g.classList.add('hl','sel');
 const L=(links[id]||[]).concat(id!=='runs'&&B[id]&&!['jackson'].includes(id)?[]:[]);
 const ins=[],outs=[];
 L.forEach(({e,o})=>{e.classList.add('hl');const n=svg.querySelector(`[data-id="${o}"]`);if(n)n.classList.add('hl');
  if(e.classList.contains('flow')){const f=FLOWS.find(f=>(f[0]===id&&f[1]===o)||(f[1]===id&&f[0]===o));const nm=(B[o]||APPS[o])[0];(f[0]===id?outs:ins).push(`${nm} <span style="color:#777">(${f[2]})</span>`)}});
 if(B[id]&&id!=='jackson'){const rl=svg.querySelector('[data-id="runs"]');rl.classList.add('hl');if(id!=='quinn')outs.push('runs.jsonl <span style="color:#777">(log)</span>')}
 const [n,r,s,c,,,dep,about]=B[id];
 const boss=id==='jackson'?'—':id==='chief'?'Jackson':id==='nick'?'Sally':'Chief';
 card.innerHTML=`<h3><svg width="22" height="22" viewBox="-13 -13 26 26"><path d="${SH[s]}" fill="${s==='spiral'?'none':C[c]}" stroke="${C[c]}" stroke-width="2"/></svg>${n}</h3><div class="r">${r}${dep?' · '+D[dep][0]:''}</div>${about}<div style="margin-top:8px"><b>Reports to:</b> ${boss}</div>${outs.length?'<b>Sends to:</b><ul><li>'+outs.join('</li><li>')+'</li></ul>':''}${ins.length?'<b>Gets from:</b><ul><li>'+ins.join('</li><li>')+'</li></ul>':''}`;card.hidden=false}
function unfocus(){svg.classList.remove('focus');svg.querySelectorAll('.hl,.sel').forEach(x=>x.classList.remove('hl','sel'));card.hidden=true}
document.addEventListener('click',()=>{pinned=null;unfocus()});
