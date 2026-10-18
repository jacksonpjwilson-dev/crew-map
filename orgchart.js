(function(){
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
 const kids=Object.keys(B).filter(b=>B[b][6]===k);
 if(!kids.length)continue;const last=B[kids[kids.length-1]][5];
 el('path',{d:`M${x-W/2+8} 282V${last}`,class:'rep'},gR);
 kids.forEach(b=>{const p=rep(`M${x-W/2+8} ${B[b][5]}H${x-W/2+12}`,'chief',b);p.removeAttribute('marker-end')});}
// nodes
for(const id in B){const [n,r,s,c,x,y]=B[id];const w=W;
 const g=el('g',{class:'node',transform:`translate(${x} ${y})`,'data-id':id},gN);
 el('rect',{class:'box',x:-w/2,y:-H/2,width:w,height:H,rx:14},g);
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
 const boss=id==='jackson'?'—':id==='chief'?'Jackson':'Chief';
 card.innerHTML=`<h3><svg width="22" height="22" viewBox="-13 -13 26 26"><path d="${SH[s]}" fill="${s==='spiral'?'none':C[c]}" stroke="${C[c]}" stroke-width="2"/></svg>${n}</h3><div class="r">${r}${dep?' · '+D[dep][0]:''}</div>${about}<div style="margin-top:8px"><b>Reports to:</b> ${boss}</div>${outs.length?'<b>Sends to:</b><ul><li>'+outs.join('</li><li>')+'</li></ul>':''}${ins.length?'<b>Gets from:</b><ul><li>'+ins.join('</li><li>')+'</li></ul>':''}`;card.hidden=false}
function unfocus(){svg.classList.remove('focus');svg.querySelectorAll('.hl,.sel').forEach(x=>x.classList.remove('hl','sel'));card.hidden=true}
document.addEventListener('click',()=>{pinned=null;unfocus()});
})();
(function(){let z=1;const m=document.getElementById('map');document.querySelectorAll('.zoom button').forEach(b=>b.onclick=e=>{e.stopPropagation();z=Math.min(4,Math.max(1,z+(+b.dataset.z)*.5));m.style.width=(z*100)+'%'})})();
// self-heal: if a stale cached style.css lacks the org chart rules, reload it fresh
(function(){const l=document.getElementById('legend');if(l&&getComputedStyle(l).display!=='flex'){const s=document.querySelector('link[rel=stylesheet]');s.href='style.css?r='+Date.now()}})();
