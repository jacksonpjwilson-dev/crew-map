/* Crew Map — widget-home preview. LIVE public data: roster.json + activity.json from the data branch,
   rebuilt every 90 s on the box from the bots in Grok Bot. Nothing here can change any bot. */
const PREVIEW_VER='crew-vNext-preview';
(function(){
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const NS='http://www.w3.org/2000/svg';
const mkE=(t,a,p)=>{const e=document.createElementNS(NS,t);for(const k in a)if(a[k]!=null)e.setAttribute(k,a[k]);p&&p.appendChild(e);return e};

/* ---------- storage ---------- */
const K={layout:'crewmap-apple-v2:layout',theme:'crewmapw:theme',seen:'crewmap-next:seen',orgv:'crewmap-next:orgv'};
const load=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??f()}catch(e){return f()}};
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),1800)}

/* ---------- colourways (same 12 as Logbook v2, from ../themes.js) ---------- */
const TH=Object.assign({cw:'teal',mode:'auto'},load(K.theme,()=>({})));
const isDark=()=>TH.mode==='dark'||(TH.mode==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);
function applyTheme(){
 const dark=isDark(),r=document.documentElement;
 r.dataset.theme=dark?'dark':'light';
 r.dataset.apple='true';
 const v=dark?
 {bg:'#000000',card:'#1c1c1e',card2:'#2c2c2e',fg:'#f5f5f7',mut:'#98989e',line:'#38383a',on:'#ffffff'}:
 {bg:'#f2f2f7',card:'#ffffff',card2:'#e5e5ea',fg:'#1c1c1e',mut:'#6e6e73',line:'#d1d1d6',on:'#ffffff'};
 const colors={'--bg':v.bg,'--card':v.card,'--card2':v.card2,'--text':v.fg,'--muted':v.mut,'--line':v.line,
 '--accent':'#0a84ff','--accent2':'#5ac8fa','--accent3':'#30d158','--on':v.on,
 '--fh':'-apple-system,BlinkMacSystemFont,system-ui,sans-serif','--fb':'-apple-system,BlinkMacSystemFont,system-ui,sans-serif',
 '--pos':dark?'#30d158':'#34c759','--neg':dark?'#ff453a':'#ff3b30','--warn':dark?'#ff9f0a':'#ff9500'};
 for(const [k,val] of Object.entries(colors))r.style.setProperty(k,val);
 document.querySelectorAll('meta[name=theme-color]').forEach(x=>x.setAttribute('content',v.bg));
}
function saveTheme(){localStorage.setItem(K.theme,JSON.stringify(TH));applyTheme()}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{applyTheme()});
applyTheme();

/* ---------- themed dialogs ---------- */
const ui=(()=>{function open({title='',message='',action='OK',cancel='Cancel',destructive,input,value='',placeholder='',noCancel,type='text'}){return new Promise(res=>{const w=document.createElement('div');w.className='uim';w.setAttribute('role','alertdialog');w.setAttribute('aria-modal','true');
  const red=destructive??/^(delete|remove|reset|clear|erase)/i.test(action);
  w.innerHTML=`<div class="uim-bd"></div><div class="uim-box"><div class="uim-body"><b class="uim-t">${esc(title)}</b>${message?`<p class="uim-m">${esc(message)}</p>`:''}${input?`<input class="uim-in" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off">`:''}</div><div class="uim-acts ${noCancel?'one':''}">${noCancel?'':`<button class="uim-b uim-cancel">${esc(cancel)}</button>`}<button class="uim-b uim-ok ${red?'red':''}">${esc(action)}</button></div></div>`;
  document.body.appendChild(w);requestAnimationFrame(()=>w.classList.add('on'));const inp=w.querySelector('.uim-in');setTimeout(()=>{(inp||w.querySelector('.uim-ok')).focus();if(inp)inp.select()},60);
  const done=v=>{w.classList.remove('on');w.classList.add('off');document.removeEventListener('keydown',key,true);setTimeout(()=>w.remove(),220);res(v)};
  const ok=()=>done(input?inp.value:true),no=()=>done(input?null:false);
  const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();no()}else if(e.key==='Enter'){e.preventDefault();e.stopPropagation();ok()}};document.addEventListener('keydown',key,true);
  w.querySelector('.uim-ok').onclick=ok;const c=w.querySelector('.uim-cancel');if(c)c.onclick=no;w.querySelector('.uim-bd').onclick=no})}
 return {confirm:o=>open(o),prompt:o=>open(Object.assign({action:'OK'},o,{input:true})),alert:o=>open(Object.assign({action:'OK'},o,{noCancel:true,destructive:false}))}})();
window.ui=ui;


/* ---------- icons ---------- */
const P={
 org:'<rect x="9" y="2.5" width="6" height="5" rx="1.5"/><rect x="2.5" y="16.5" width="6" height="5" rx="1.5"/><rect x="15.5" y="16.5" width="6" height="5" rx="1.5"/><rect x="9" y="16.5" width="6" height="5" rx="1.5"/><path d="M12 7.5v9M5.5 16.5v-3h13v3"/>',
 people:'<circle cx="9" cy="8" r="3.2"/><path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><circle cx="17" cy="9" r="2.4"/><path d="M16 13.6c3 0 5 1.8 5 4.6"/>',
 chat:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
 activity:'<path d="M3 12h4l3-7 4 14 3-7h4"/>',
 share:'<circle cx="5" cy="12" r="2.5"/><circle cx="18" cy="5.5" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M7.3 11 15.7 6.6M7.3 13l8.4 4.4"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
 person:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
 crown:'<path d="M3 18V7l5 4 4-6 4 6 5-4v11z"/>',
 home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
 spend:'<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19M6.5 15h4"/>',
 budget:'<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
 plan:'<rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><path d="M7 16l3-3 2.5 2 4-4"/>',
 goals:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
 bank:'<path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
 chart:'<path d="M3 20h18M6 16l4-5 3 3 5-7"/>',
 invest:'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
 sync:'<path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3"/><path d="M18 2v5h-5M6 22v-5h5"/>',
 eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
 bell:'<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/>',
 cash:'<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9.5v5M18 9.5v5"/>',
 card:'<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19"/>',
 pig:'<path d="M5 11a7 6 0 0 1 13-2h2v4l-2 1-1 3h-3v-2H9v2H6l-1-3a3 3 0 0 1-2-3"/><circle cx="15" cy="10.5" r=".8" fill="currentColor"/>',
 loan:'<path d="M4 20h16M6 20V9l6-5 6 5v11"/><path d="M10 20v-5h4v5"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 cal:'<rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
 flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
 list:'<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
 tip:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>',
 palette:'<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.5-.8 1.5-1.6 0-1.4-1-1.4-1-2.6 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>',
 grid:'<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
 swipe:'<path d="M4 12h13M13 7l5 5-5 5"/>',hold:'<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>',
 shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>'};
const ic=(k,w=24)=>`<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${P[k]||P.grid}</svg>`;

/* ---------- live data ---------- */
const RAW='https://raw.githubusercontent.com/jacksonpjwilson-dev/crew-map/data/';
const LOCAL=/^(localhost|127\.)/.test(location.hostname);
const ROSTER_URLS=LOCAL?['../roster.json']:[RAW+'roster.json','../roster.json'],DATA_URLS=LOCAL?['../activity.json']:[RAW+'activity.json'];
const PRIVATE=!!((window.CREW_CFG||{}).PRIVATE||/[?&]private=1\b/.test(location.search));
// private mode: read crewMap/{roster|activity} from Firestore ({data:...}) instead of the public data branch
async function getPriv(kind,ok=()=>true){try{const d=await JWAUTH.getDoc('crewMap/'+kind),j=d&&d.data;return j&&ok(j)?j:null}catch(e){console.warn('crewMap',kind,e);return null}}
let R=null,BOT={},DEP={},ACT={date:'',generated:'',items:[]},SYNC=null;
async function getJSON(urls,ok=()=>true){for(const u of urls){try{const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),7000);
 const r=await fetch(u+'?t='+Date.now(),{cache:'no-store',signal:ctl.signal});clearTimeout(t);if(r.ok){const j=await r.json();if(ok(j))return j}}catch(e){}}return null}
function setRoster(r){if(!r||!Array.isArray(r.bots)||r.bots.length<5||!(r.version>=2))return false;R=r;BOT={};DEP={};
 const L=r.lead||{};BOT.jackson={id:'jackson',name:L.name||'Jackson',role:L.role||'Head Honcho',tier:'lead',dept:'exec',reportsTo:null,shape:'person',color:'white',about:L.about||'',dotted:[],runs:[]};
 r.bots.forEach(b=>{if(b&&b.id)BOT[b.id]=Object.assign({dotted:[],runs:[]},b)});(r.departments||[]).forEach(d=>DEP[d.id]=d);
 (r.groups||[]).forEach(g=>g.slug=g.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'));return true}
async function loadData(){let ch=false;const r=PRIVATE?await getPriv('roster',j=>j&&j.version>=2):await getJSON(ROSTER_URLS,j=>j&&j.version>=2);if(r){const s=JSON.stringify(r);if(s!==loadData.r&&setRoster(r)){loadData.r=s;ch=true}}
 const a=PRIVATE?await getPriv('activity',j=>j&&Array.isArray(j.items)):await getJSON(DATA_URLS,j=>j&&Array.isArray(j.items));if(a){const s=JSON.stringify(a);if(s!==loadData.a){loadData.a=s;ACT=a;ch=true}}
 if(r||a)SYNC=new Date();return ch}

/* Workspaces are presentation filters only; they never instantiate or trigger a second bot. */
const WS_KEY='crewmap-next:workspaces',WS_ACTIVE_KEY='crewmap-next:workspace-active';
const WORKSPACE_NAMES={all:'All Bots',productivity:'Productivity',learning:'Hobbies & Learning',custom:'My Workspace'};
let WS_ACTIVE=localStorage.getItem(WS_ACTIVE_KEY)||'all';
if(!WORKSPACE_NAMES[WS_ACTIVE])WS_ACTIVE='all';
let WS_CUSTOM=load(WS_KEY,()=>[]);
function workspaceIds(){
 const ids=Object.values(BOT).filter(b=>b.id!=='jackson');
 if(WS_ACTIVE==='all')return new Set(ids.map(b=>b.id));
 if(WS_ACTIVE==='custom')return new Set(WS_CUSTOM);
 return new Set(ids.filter(b=>{
 const department=(DEP[b.dept]?.name||'').toLowerCase();
 const fields=(department+' '+(b.role||'')+' '+(b.name||'')).toLowerCase();
 if(WS_ACTIVE==='learning')return /learning|career|study|econom|french|aviation|hobby|fun|shopping|gift|sports|fitness|food|language/.test(fields);
 return !/learning|study|econom|french|hobby|fun|shopping|gift|sports|fitness|language/.test(fields);
 }).map(b=>b.id));
}
const inWorkspace=id=>id==='jackson'||workspaceIds().has(id);
const workspaceBots=()=>Object.values(BOT).filter(b=>b.id!=='jackson'&&inWorkspace(b.id));
const workspaceActivity=()=>ACT.items.filter(x=>inWorkspace(x.from)||inWorkspace(x.to));
const workspaceSchedule=()=>SCHED().filter(x=>(x.who||[]).some(inWorkspace));
function changeWorkspace(id){if(!WORKSPACE_NAMES[id])return;WS_ACTIVE=id;localStorage.setItem(WS_ACTIVE_KEY,id);render();toast(WORKSPACE_NAMES[id]+' view');}
function workspacePicker(){
 const b=workspaceBots();
 sheet('<h3>Choose workspace</h3><p class="muted">These are views of the same Grok bots. A bot in multiple views is still only one bot and runs only once.</p>'
 +Object.entries(WORKSPACE_NAMES).map(([id,label])=>'<button class="cc-ws-choice '+(WS_ACTIVE===id?'active':'')+'" data-workspace="'+id+'"><span>'+esc(label)+'</span><small>'+ (id==='all'?R.bots.length:id==='custom'?WS_CUSTOM.filter(x=>BOT[x]).length:id==='productivity'?'Work':'Learning')+'</small></button>').join('')
 +'<button class="btn ghost block" data-edit-workspace>Customize My Workspace</button>',el=>{
 el.querySelectorAll('[data-workspace]').forEach(x=>x.onclick=()=>{changeWorkspace(x.dataset.workspace);closeSheet()});
 el.querySelector('[data-edit-workspace]').onclick=workspaceEditor;
 });
}
function workspaceEditor(){
 const selected=new Set(WS_CUSTOM);
 const list=Object.values(BOT).filter(b=>b.id!=='jackson').sort((a,b)=>a.name.localeCompare(b.name));
 sheet('<h3>My Workspace</h3><p class="muted">Choose the bots to display. Changes affect only this browser view.</p>'
 +list.map(b=>'<label class="cc-ws-bot"><input type="checkbox" value="'+esc(b.id)+'" '+(selected.has(b.id)?'checked':'')+'><span>'+esc(b.name)+'</span><small>'+esc(DEP[b.dept]?.name||b.role||'')+'</small></label>').join('')
 +'<button class="btn block" data-save-workspace>Save workspace</button>',el=>{
 el.querySelector('[data-save-workspace]').onclick=()=>{WS_CUSTOM=[...el.querySelectorAll('input:checked')].map(x=>x.value);localStorage.setItem(WS_KEY,JSON.stringify(WS_CUSTOM));changeWorkspace('custom');closeSheet()};
 });
}

/* ---------- helpers ---------- */
const col=id=>id==='jackson'?'var(--text)':BOT[id]?(C[BOT[id].color]||BOT[id].color||'#888'):'var(--muted)';
const nm=id=>id==='all'?'Everyone':BOT[id]?BOT[id].name:APPS[id]||String(id||'?').replace(/^./,c=>c.toUpperCase());
const short=id=>nm(id).replace('Fix it ','');
const isBot=id=>!!BOT[id];
const deptBots=k=>Object.values(BOT).filter(b=>inWorkspace(b.id)&&b.dept===k&&b.tier==='bot').sort((a,b)=>a.name.localeCompare(b.name));
const deptAll=k=>{const d=DEP[k];return (d&&d.head&&BOT[d.head]&&inWorkspace(d.head)?[BOT[d.head]]:[]).concat(deptBots(k))};
const DEPTS=()=>(R.departments||[]).filter(d=>deptAll(d.id).some(b=>inWorkspace(b.id)));
const HEADS=()=>DEPTS().map(d=>d.head).filter(id=>isBot(id)&&inWorkspace(id));
const GROUPS=()=>(R.groups||[]).filter(g=>(g.members||[]).some(inWorkspace));
const groupsOf=id=>GROUPS().filter(g=>g.members.includes(id));
const msgsOf=id=>workspaceActivity().filter(i=>i.from===id||i.to===id);
const deptMsgs=k=>{const ids=new Set(deptAll(k).map(b=>b.id));return workspaceActivity().filter(i=>ids.has(i.from)||ids.has(i.to))};
function iconSVG(id,size=24){const b=BOT[id]||{shape:'circle'},s=b.shape in SH?b.shape:'circle',c=col(id),so=STROKE_ONLY[s];
 return `<svg viewBox="-14 -14 28 28" width="${size}" height="${size}"><path d="${SH[s]}" style="fill:${so?'none':c};stroke:${c}" stroke-width="${so?2:1}" stroke-linecap="round"/></svg>`}
const av=(id,sz=40)=>`<span class="cav" style="width:${sz}px;height:${sz}px;background:color-mix(in srgb,${col(id)} 17%,transparent)">${iconSVG(id,Math.round(sz*.6))}</span>`;
const avStack=(ids,n=6,sz=28)=>`<span class="cstack">${ids.slice(0,n).map(id=>av(id,sz)).join('')}${ids.length>n?`<span class="cmore" style="width:${sz}px;height:${sz}px">+${ids.length-n}</span>`:''}</span>`;
const torNow=()=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',hour:'2-digit',minute:'2-digit',hour12:false,weekday:'short'}).formatToParts(new Date());const g=t=>p.find(x=>x.type===t)?.value;return {h:+g('hour')%24,m:+g('minute'),wd:g('weekday')}};
const SCHED=()=>window.CrewSched?CrewSched.list(R&&R.schedule):[];
function nextRuns(n=3){return workspaceSchedule().slice(0,n)}
const inTxt=m=>window.CrewSched?CrewSched.inTxt(m):`in ${m} min`;
function counts(){const c={};workspaceActivity().forEach(i=>{[i.from,i.to].forEach(x=>{if(x!=='all')c[x]=(c[x]||0)+1})});return Object.entries(c).filter(([k])=>isBot(k)).sort((a,b)=>b[1]-a[1])}
function hourly(){const h=Array(24).fill(0);workspaceActivity().forEach(i=>{const x=+String(i.time).slice(0,2);if(x>=0&&x<24)h[x]++});return h}
function topics(){const c={};workspaceActivity().forEach(i=>{const t=(i.topic||'').trim();if(t&&t!=='private')c[t]=(c[t]||0)+1});return Object.entries(c).sort((a,b)=>b[1]-a[1])}
const syncTxt=()=>ACT.generated?`updated ${ACT.generated}`:SYNC?`synced ${SYNC.toTimeString().slice(0,5)}`:'offline';
const flowsOf=id=>FLOWS.filter(f=>(f[0]===id||f[1]===id)&&(isBot(f[0])||APPS[f[0]])&&(isBot(f[1])||APPS[f[1]]));

/* ---------- small renderers ---------- */
function cols(vals,{hl=-1}={}){const m=Math.max(1,...vals);return `<div class="wcols">${vals.map((v,i)=>`<i class="${i===hl?'td':''}" style="height:${Math.max(3,v/m*100)}%"></i>`).join('')}</div>`}
const lbl=(k,t,c)=>`<small class="wl"${c?` style="color:${c}!important"`:''}>${ic(k,13)}${esc(t)}</small>`;
const msgLine=i=>`<div><span><b style="color:${col(i.from)}">${esc(short(i.from))}</b>→<b style="color:${col(i.to)}">${esc(short(i.to))}</b> <span class="mut">${esc(i.topic==='private'?'private':i.topic)}</span></span><em class="mut">${esc(i.time)}</em></div>`;
const botRow=(id,sub)=>{const b=BOT[id];return `<button class="item" data-bot="${esc(id)}">${av(id,40)}<div class="grow"><div class="t">${esc(b.name)}${b.hidden?' <span class="flag">hidden</span>':''}</div><div class="s">${esc(sub??b.role)}</div></div><span class="chev">›</span></button>`};
const msgRow=(i,k)=>`<button class="item msgrow" data-msg="${k}"><div class="grow"><div class="t"><span style="color:${col(i.from)}">${esc(nm(i.from))}</span> → <span style="color:${col(i.to)}">${esc(nm(i.to))}</span></div><div class="s">${esc(i.topic)} · ${esc(i.summary)}</div></div><b class="tiny">${esc(i.time)}</b></button>`;
function netSVG(items,S=520){const svg=mkE('svg',{viewBox:`0 0 ${S} ${S}`,class:'net'});if(!items.length)return '';
 const ids=[...new Set(items.flatMap(i=>[i.from,i.to]))],ord=id=>{const b=BOT[id];if(!b)return [99,id];const di=(R.departments||[]).findIndex(d=>d.id===b.dept);return [b.tier==='lead'?0:b.tier==='chief'?1:2+Math.max(di,0),b.tier==='head'?'':b.name]};
 ids.sort((a,b)=>{const x=ord(a),y=ord(b);return x[0]-y[0]||String(x[1]).localeCompare(String(y[1]))});
 const cx=S/2,cy=S/2,R0=S*.36,nr=ids.length>14?14:18,Q={};ids.forEach((id,k)=>{const a=-Math.PI/2+2*Math.PI*k/ids.length;Q[id]={x:cx+R0*Math.cos(a),y:cy+R0*Math.sin(a),a}});
 const E={};items.forEach(i=>{(E[i.from+'>'+i.to]=E[i.from+'>'+i.to]||[]).push(i)});
 Object.entries(E).forEach(([k,list])=>{const[f,t]=k.split('>'),c=col(f),a=Q[f],b=Q[t],dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,r=nr+2;
  const x1=a.x+ux*r,y1=a.y+uy*r,x2=b.x-ux*(r+2),y2=b.y-uy*(r+2),qx=cx+((x1+x2)/2-cx)*.45,qy=cy+((y1+y2)/2-cy)*.45;
  mkE('path',{d:`M${x1} ${y1}Q${qx} ${qy} ${x2} ${y2}`,style:`stroke:${c}`,'stroke-width':Math.min(1.2+list.length*.6,4.5),'stroke-opacity':.7,fill:'none','data-edge':k},svg)});
 ids.forEach(id=>{const q=Q[id],g=mkE('g',{transform:`translate(${q.x} ${q.y})`,'data-nb':id},svg);mkE('circle',{r:nr,style:`fill:var(--card);stroke:${col(id)}`,'stroke-width':2},g);
  if(BOT[id]){const s=BOT[id].shape in SH?BOT[id].shape:'circle',so=STROKE_ONLY[s];mkE('path',{d:SH[s],style:`fill:${so?'none':col(id)};stroke:${col(id)}`,'stroke-width':so?2:0,transform:`scale(${nr/20})`},g)}else{mkE('text',{'text-anchor':'middle',y:3.5,'font-size':9,style:'fill:var(--text)'},g).textContent='ALL'}
  const ca=Math.cos(q.a),sa=Math.sin(q.a);mkE('text',{x:ca*(nr+7),y:sa*(nr+7)+4+(Math.abs(ca)<.3?sa*6:0),'text-anchor':Math.abs(ca)<.3?'middle':ca>0?'start':'end',style:'fill:var(--text);font:600 12px var(--fb)'},g).textContent=short(id)});
 return svg.outerHTML}
function miniTree(full){const hs=DEPTS();return `<div class="mtree"><div class="mt-n">${av('jackson',full?30:24)}<b>Jackson</b></div><i class="mt-v"></i>${BOT.chief?`<div class="mt-n">${av('chief',full?30:24)}<b>Chief</b></div><i class="mt-v"></i>`:''}<div class="mt-row">${hs.map(d=>`<div class="mt-d" style="--dc:${d.color}">${d.head?av(d.head,full?30:24):'<span class="cav q">?</span>'}<b>${esc(d.head?short(d.head):d.name)}</b><small>${esc(d.name.split(' ')[0])}</small><em>${deptBots(d.id).length}</em></div>`).join('')}</div></div>`}

/* ---------- WIDGETS ---------- */
// sec: home | org | activity | depts | groups. sz: allowed sizes. r(size) -> inner html. mini() -> mini-app body.
const W={};
const def=(id,o)=>{W[id]=Object.assign({sz:['S','M'],d:'S',sec:'home'},o)};
def('status',{n:'Crew overview',sec:'home',sz:['S','M'],d:'M',r:z=>{
const count=workspaceBots().length,un=deptBots('unassigned').length;
return `${lbl('people','Crew overview')}<div class="cc-stat"><strong>${count}</strong><span>bots in directory</span></div>
<div class="cc-substats"><span><b>${DEPTS().filter(d=>d.id!=='unassigned').length}</b> departments</span><span><b>${GROUPS().length}</b> chats</span><span><b>${workspaceActivity().length}</b> messages</span></div>
<small class="cc-footnote">${un?un+' unassigned · ':''}Last data fetch: ${SYNC?SYNC.toLocaleTimeString('en-CA',{hour:'2-digit',minute:'2-digit'}):'not available'}</small>`;
},mini:()=>miniStatus()});
def('next',{n:'Next up',sec:'home',sz:['S','M'],r:s=>{const L=nextRuns(s==='M'?3:1);if(!L.length)return `${lbl('clock','Next up')}<div class="empty">No schedule</div>`;const x=L[0];return `${lbl('clock','Next up')}${s==='S'?`<div class="wn">${esc(x.clock)}</div><small><b style="color:${col(x.who[0])}">${esc(x.who.map(short).join(', '))}</b></small><small class="mut">${esc(x.note)}</small><small class="mut" style="margin-top:auto">${esc(x.label)} · ${inTxt(x.in)}</small>`:`<div class="wlist">${L.map(y=>`<div><span><b>${esc(y.when)}</b> <b style="color:${col(y.who[0])}">${esc(y.who.map(short).join(', '))}</b> <span class="mut">${esc(y.note)}</span></span><em class="mut">${inTxt(y.in)}</em></div>`).join('')}</div>`}`},mini:()=>miniSchedule()});
def('latest',{n:'Latest messages',sec:'home',sz:['M','L'],d:'M',r:s=>{const L=[...ACT.items].reverse().slice(0,s==='L'?8:3);return `${lbl('chat','Latest')}${L.length?`<div class="wlist">${L.map(msgLine).join('')}</div>`:'<div class="empty">Quiet so far today</div>'}`},mini:()=>vActivity(true)});
def('busiest',{n:'Busiest today',sec:'home',sz:['S'],r:()=>{const c=counts()[0];return `${lbl('bolt','Busiest today')}${c?`<div class="wbig">${av(c[0],44)}</div><b class="wname">${esc(nm(c[0]))}</b><small class="mut">${c[1]} messages</small>`:'<div class="empty">No messages yet</div>'}`},mini:()=>miniBusiest()});
def('msgs',{n:'Messages today',sec:'activity',sz:['S','M'],r:s=>{const h=hourly(),t=torNow();return `${lbl('activity','Messages today')}<div class="wn ${s==='S'?'':''}">${ACT.items.length}</div>${cols(s==='S'?h.slice(Math.max(0,t.h-11),t.h+1):h,{hl:s==='S'?Math.min(11,t.h):t.h})}`},mini:()=>vActivity(true)});
def('topics',{n:'Top topics',sec:'activity',sz:['M'],r:()=>{const T=topics().slice(0,8);return `${lbl('list','Top topics today')}${T.length?`<div class="wchips">${T.map(([t,n])=>`<span>${esc(t)} <em>${n}</em></span>`).join('')}</div>`:'<div class="empty">Nothing yet</div>'}`},mini:()=>vActivity(true)});
def('net',{n:'Today’s network',sec:'activity',sz:['L','M'],d:'L',r:s=>`${lbl('share','Who talked to whom')}<div class="wnet">${netSVG(ACT.items,s==='L'?520:520)||'<div class="empty">No messages yet</div>'}</div>`,mini:()=>miniNet()});
function appleOrgSummary(){
 const ds=DEPTS().slice(0,8);
 return `${lbl('org','Crew structure')}<div class="ios-org">
 <div class="ios-org-chief">${av('chief',24)}<strong>Chief</strong><small>${workspaceBots().length} bots · ${DEPTS().length} departments</small></div>
 <div class="ios-org-rail"></div>
 <div class="ios-org-depts">${ds.map(d=>`<div class="ios-org-dept" style="--dept:${esc(d.color)}"><i></i><span>${esc(d.name)}</span><b>${deptAll(d.id).length}</b></div>`).join('')}</div>
 </div>`;
}
def('attention',{n:'Needs attention',sec:'home',sz:['S'],r:()=>`${lbl('bell','Attention')}<div class="ios-attn-value">—</div><small>Monitoring not connected</small><small class="mut" style="margin-top:auto">Execution status unavailable</small>`,mini:()=>'<div class="card"><h2>Execution monitoring</h2><p>Actual task failures and successful runs cannot yet be verified. Connect an execution log to enable alerts.</p></div>'});
def('orgmini',{n:'Crew structure',sec:'org',sz:['L','M'],d:'L',r:s=>s==='L'?appleOrgSummary():`${lbl('org','Crew structure')}<div class="wn">${workspaceBots().length}</div><small>bots across ${DEPTS().length} departments</small>`,tap:()=>openApp('org')});
def('execs',{n:'Executives',sec:'org',sz:['M'],r:()=>`${lbl('crown','Executives')}<div class="wexec">${['chief',...HEADS()].filter(isBot).map(id=>`<span>${av(id,34)}<b>${esc(short(id))}</b></span>`).join('')}</div>`,mini:()=>miniExecs()});
def('unassigned',{n:'Unassigned',sec:'org',sz:['S'],r:()=>{const L=deptBots('unassigned');return `${lbl('flag','Unassigned')}<div class="wn">${L.length}</div>${L.length?`<small class="mut">${esc(L.map(b=>b.name).join(', '))}</small>`:'<small class="mut">Every bot has a department</small>'}`},mini:()=>miniUnassigned()});
def('deptsum',{n:'All departments',sec:'depts',sz:['M','L'],r:s=>`${lbl('grid','Departments')}<div class="wbars">${DEPTS().map(d=>{const n=deptAll(d.id).length;return `<div><span><i style="background:${d.color}"></i>${esc(d.name)}</span><em>${n}</em></div>`}).join('')}</div>`,tap:()=>openApp('depts')});
def('grpsum',{n:'All group chats',sec:'groups',sz:['M'],r:()=>`${lbl('chat','Group chats')}<div class="wlist">${GROUPS().slice(0,3).map(g=>`<div><span>${esc(g.name)}</span><em class="mut">${g.members.length}</em></div>`).join('')}</div>`,tap:()=>openApp('groups')});
function syncDyn(){Object.keys(W).filter(k=>W[k].dyn).forEach(k=>delete W[k]);if(!R)return;
 Object.values(BOT).filter(b=>b.id!=='jackson').forEach(b=>def('bot:'+b.id,{dyn:1,n:b.name,sec:'org',sz:['S','M'],r:s=>{const n=msgsOf(b.id).length,d=DEP[b.dept];return `${lbl('person',d&&b.dept!=='exec'?d.name:b.tier==='chief'?'Manager':'Executive',d?d.color:null)}<div class="wbot">${av(b.id,s==='S'?34:44)}<div><b class="wname">${esc(b.name)}</b><small class="mut">${esc(b.role)}</small></div></div>${s==='M'?`<small class="wabout">${esc(b.about)}</small>`:''}<small class="mut" style="margin-top:auto">${n?`${n} message${n>1?'s':''} today`:'No messages today'}</small>`},mini:()=>miniBot(b.id)}));
 DEPTS().forEach(d=>def('dept:'+d.id,{dyn:1,n:d.name,sec:'depts',sz:['S','M','L'],r:s=>{const L=deptAll(d.id),m=deptMsgs(d.id).length;return `${lbl('grid',s==='S'?'Department':'Department · '+L.length+' bots',d.color)}<b class="wdept" style="color:${d.color}">${esc(d.name)}</b>${s==='L'?`<div class="wlist">${L.map(b=>`<div><span>${av(b.id,22)}${esc(b.name)}</span><em class="mut">${esc(b.role)}</em></div>`).join('')}</div>`:`${avStack(L.map(b=>b.id),s==='S'?4:7,s==='S'?26:30)}`}<small class="mut" style="margin-top:auto">${d.head?'Head: '+esc(short(d.head))+' · ':''}${m} msgs today</small>`},mini:()=>miniDept(d.id)}));
 GROUPS().forEach(g=>def('grp:'+g.slug,{dyn:1,n:g.name,sec:'groups',sz:['S','M'],r:s=>{const d=DEP[g.dept];return `${lbl('chat','Group chat',d?d.color:null)}<b class="wdept">${esc(g.name)}</b>${avStack(g.members,s==='S'?4:8,s==='S'?26:30)}<small class="mut" style="margin-top:auto">${g.members.length} members</small>`},mini:()=>miniGroup(g.slug)}))}

/* ---------- mini apps + section apps ---------- */
const openFull=(k,name)=>`<button class="btn ghost block openfull" data-open="${k}">Open ${esc(name)} ›</button>`;
function miniBot(id){const b=BOT[id];if(!b)return '<div class="empty">This bot is no longer on the crew.</div>';const d=DEP[b.dept],kids=Object.values(BOT).filter(x=>x.reportsTo===id),sch=SCHED().filter(s=>s.who.includes(id)),grp=groupsOf(id),M=msgsOf(id),fl=flowsOf(id);
 return `<div class="card hero" style="--dc:${d?d.color:'var(--accent)'}">${av(id,64)}<div><div class="big">${esc(b.name)}</div><div class="muted">${esc(b.role)}${b.tier==='bot'&&d&&b.dept!=='unassigned'?' · '+esc(d.name):b.tier!=='bot'?' · Executives':' · Unassigned'}</div>${b.hidden?'<span class="flag">hidden</span>':''}</div></div>
 ${b.about?`<div class="card"><p style="margin:0">${esc(b.about)}</p></div>`:''}
 <div class="card"><h2>Reporting</h2>${b.reportsTo&&BOT[b.reportsTo]?botRow(b.reportsTo,'Reports to · '+BOT[b.reportsTo].role):`<div class="kv"><span>Reports to</span><b>${b.reportsTo?esc(nm(b.reportsTo)):'—'}</b></div>`}${kids.map(k=>botRow(k.id,(b.tier==='bot'?'Manages · ':'Leads · ')+k.role)).join('')}${(b.dotted||[]).map(k=>botRow(k,'Also works with')).join('')}</div>
 ${grp.length?`<div class="card"><h2>Group chats</h2>${grp.map(g=>`<button class="item" data-grp="${g.slug}">${avStack(g.members,4,24)}<div class="grow"><div class="t">${esc(g.name)}</div><div class="s">${g.members.length} members</div></div><span class="chev">›</span></button>`).join('')}</div>`:''}
 ${sch.length?`<div class="card"><h2>Schedule <small>Ontario time</small></h2>${sch.map(s=>`<div class="kv"><span>${esc(s.note)} <em class="rp">${esc(CrewSched.rep(s))}</em></span><b>${esc(s.when)}</b></div>`).join('')}</div>`:''}
 ${fl.length?`<div class="card"><h2>Data flow</h2>${fl.map(f=>`<div class="kv"><span>${f[0]===id?'→ '+esc(nm(f[1])):'← '+esc(nm(f[0]))}</span><b>${esc(f[2])}</b></div>`).join('')}</div>`:''}
 <div class="card"><h2>Today <small>${M.length} messages</small></h2>${M.length?[...M].reverse().map(i=>msgRow(i,ACT.items.indexOf(i))).join(''):'<div class="empty">No messages today</div>'}</div>`}
function miniDept(k){const d=DEP[k];if(!d)return '<div class="empty">This department no longer exists.</div>';const L=deptBots(k),g=GROUPS().filter(x=>x.dept===k),M=deptMsgs(k),ids=new Set(deptAll(k).map(b=>b.id)),sch=SCHED().filter(s=>s.who.some(w=>ids.has(w)));
 return `<div class="card hero" style="--dc:${d.color}"><span class="dbadge" style="background:${d.color}">${ic('grid',30)}</span><div><div class="big" style="color:${d.color}">${esc(d.name)}</div><div class="muted">${deptAll(k).length} bots · ${M.length} messages today</div></div></div>
 ${d.head&&BOT[d.head]?`<div class="card"><h2>Head</h2>${botRow(d.head,BOT[d.head].role+' · reports to '+nm(BOT[d.head].reportsTo))}</div>`:k==='unassigned'?'<div class="notice">These bots aren’t in a department yet. Add them to a department group chat in Grok Bot, or mention them in a head’s description, and they move here within about 2 minutes.</div>':''}
 <div class="card"><h2>Bots <small>${L.length}</small></h2>${L.map(b=>botRow(b.id)).join('')||'<div class="empty">No bots yet</div>'}</div>
 ${g.length?`<div class="card"><h2>Group chat</h2>${g.map(x=>`<button class="item" data-grp="${x.slug}">${avStack(x.members,4,24)}<div class="grow"><div class="t">${esc(x.name)}</div><div class="s">${x.members.length} members</div></div><span class="chev">›</span></button>`).join('')}</div>`:''}
 ${sch.length?`<div class="card"><h2>Schedule</h2>${sch.map(s=>`<div class="kv"><span>${esc(s.who.map(short).join(', '))} · ${esc(s.note)}</span><b>${esc(s.when)}</b></div>`).join('')}</div>`:''}
 <div class="card"><h2>Today</h2>${M.length?[...M].reverse().slice(0,30).map(i=>msgRow(i,ACT.items.indexOf(i))).join(''):'<div class="empty">No messages today</div>'}</div>${openFull('depts','Departments')}`}
function miniGroup(slug){const g=GROUPS().find(x=>x.slug===slug);if(!g)return '<div class="empty">This group chat no longer exists.</div>';const d=DEP[g.dept];
 return `<div class="card hero" style="--dc:${d?d.color:'var(--accent)'}"><span class="dbadge" style="background:${d?d.color:'var(--accent)'}">${ic('chat',30)}</span><div><div class="big">${esc(g.name)}</div><div class="muted">Group chat · ${g.members.length} members${d&&g.dept!=='exec'?' · '+esc(d.name):''}</div></div></div>
 <div class="card"><h2>Members</h2>${g.members.filter(isBot).map(id=>botRow(id)).join('')}</div>${openFull('groups','Group chats')}`}
function miniStatus(){const un=deptBots('unassigned');return `<div class="card"><div class="tiny">Crew</div><div class="big">${R.bots.length} bots</div><div class="tiny">${esc(syncTxt())} · roster rebuilt every 90 s from Grok Bot</div></div>
 <div class="card"><h2>Departments</h2>${DEPTS().map(d=>`<button class="item" data-dept="${d.id}"><span class="dbadge sm" style="background:${d.color}">${ic('grid',18)}</span><div class="grow"><div class="t">${esc(d.name)}</div><div class="s">${d.head?'Head: '+esc(nm(d.head))+' · ':''}${deptAll(d.id).length} bots</div></div><span class="chev">›</span></button>`).join('')}</div>
 ${un.length?`<div class="card"><h2>Unassigned</h2>${un.map(b=>botRow(b.id)).join('')}</div>`:''}
 <div class="card"><h2>Today</h2><div class="kv"><span>Messages</span><b>${ACT.items.length}</b></div><div class="kv"><span>Bots talking</span><b>${counts().length}</b></div><div class="kv"><span>Private (details hidden)</span><b>${ACT.items.filter(i=>i.topic==='private').length}</b></div></div>`}
function miniSchedule(){const L=workspaceSchedule(),nx=L[0];let lastG='';return `${nx?`<div class="card"><div class="tiny">Next up</div><div class="big">${esc(nx.when)} · ${esc(nx.who.map(short).join(', '))}</div><div class="tiny">${esc(nx.note)} · ${inTxt(nx.in)}</div></div>`:''}<div class="card"><h2>Crew schedule <small>next up first · Ontario time</small></h2>${L.map(s=>{const g=s.group!==lastG?`<div class="sgrp">${esc(s.group)}</div>`:'';lastG=s.group;return `${g}<div class="srow"><b>${s.label!==s.group?`<span class="dl">${esc(s.label)}</span>`:''}${esc(s.clock)}</b><div><div class="schips">${s.who.map(w=>`<button class="chip" data-bot="${esc(w)}" style="color:${col(w)}">${esc(short(w))}</button>`).join('')}</div><div class="tiny">${esc(s.note)} · ${esc(CrewSched.rep(s))}</div></div></div>`}).join('')}</div>`}
function miniBusiest(){const c=counts();return `<div class="card"><h2>Busiest today <small>messages sent or received</small></h2>${c.map(([id,n])=>`<button class="item" data-bot="${esc(id)}">${av(id,36)}<div class="grow"><div class="t">${esc(nm(id))}</div><div class="bar"><i style="width:${n/c[0][1]*100}%;background:${col(id)}"></i></div></div><b>${n}</b></button>`).join('')||'<div class="empty">No messages yet</div>'}</div>`}
function miniNet(){return `<div class="card"><h2>Who talked to whom <small>today</small></h2><div class="wnet big">${netSVG(workspaceActivity())||'<div class="empty">No messages yet</div>'}</div><p class="tiny" style="text-align:center">Tap a bot to see its day.</p></div>${openFull('activity','Activity')}`}
function miniExecs(){return `<div class="card"><h2>Executives <small>board meets Sun 18:00</small></h2>${['chief',...HEADS()].filter(isBot).map(id=>botRow(id,BOT[id].role+(DEP[BOT[id].dept]&&BOT[id].dept!=='exec'?'':''))).join('')}</div>${openFull('org','Org chart')}`}
function miniUnassigned(){const L=deptBots('unassigned');return `<div class="notice">Bots land here when the map can’t tell which department they belong to. Add them to a department’s group chat in Grok Bot (or name them in the head’s description) and they move within about 2 minutes.</div><div class="card"><h2>Unassigned <small>${L.length}</small></h2>${L.map(b=>botRow(b.id)).join('')||'<div class="empty">Every bot has a department</div>'}</div>`}
let ORGV=['browse','focus','map'].includes(localStorage.getItem(K.orgv))?localStorage.getItem(K.orgv):'browse',ACTV='feed';
let FOCUS_ID='chief';
/* Mobile-first bot directory and focused relationship explorer. */
function treeHTML(){
 let h='<div class="card cc-intro"><b>Bot directory</b><p>Expand a department to see its bots. Tap a bot for responsibilities and connections.</p></div>';
 h+='<div class="cc-leaders">'+botRow('jackson')+(BOT.chief&&inWorkspace('chief')?botRow('chief'):'')+'</div>';
 DEPTS().forEach(d=>{const people=deptAll(d.id);h+='<details class="cc-dept" style="--dc:'+esc(d.color)+'"><summary><span class="cc-dot"></span><b>'+esc(d.name)+'</b><small>'+people.length+' bots</small><span class="chev">⌄</span></summary><div class="cc-members">'+people.map(b=>botRow(b.id)).join('')+'</div></details>'});
 return h;
}
function focusedHTML(){
 const target=(BOT[FOCUS_ID]&&inWorkspace(FOCUS_ID)?BOT[FOCUS_ID]:workspaceBots()[0])||BOT.jackson;
 if(!target)return '<div class="empty">No bot selected</div>';
 const rel=Object.values(BOT).filter(b=>inWorkspace(b.id)&&b.reportsTo===target.id);
 const links=flowsOf(target.id);
 const related=[...new Set(links.filter(f=>inWorkspace(f[0])&&inWorkspace(f[1])).map(f=>f[0]===target.id?f[1]:f[0]))];
 const opts=workspaceBots().sort((a,b)=>a.name.localeCompare(b.name));
 return '<div class="card cc-focus"><label class="f" for="crew-focus">Focus on a bot</label><select id="crew-focus" data-focus-select>'+opts.map(b=>'<option value="'+esc(b.id)+'" '+(b.id===target.id?'selected':'')+'>'+esc(b.name)+'</option>').join('')+'</select>'
 +'<div class="cc-focuslead">'+av(target.id,54)+'<div><b>'+esc(target.name)+'</b><p>'+esc(target.role)+'</p></div></div>'
 +'<div class="cc-focusgrid"><div><small>Reports to</small><b>'+esc(target.reportsTo?nm(target.reportsTo):'—')+'</b></div><div><small>Direct reports</small><b>'+rel.length+'</b></div><div><small>Connected systems</small><b>'+related.length+'</b></div></div>'
 +'<h3>Direct reports</h3>'+(rel.map(b=>botRow(b.id)).join('')||'<p class="tiny">No direct reports</p>')
 +'<h3>Connections</h3>'+(links.map(f=>'<div class="cc-link"><span>'+esc(nm(f[0]))+'</span><span>→ '+esc(f[2])+' →</span><span>'+esc(nm(f[1]))+'</span></div>').join('')||'<p class="tiny">No recorded data flows</p>')
 +'</div>';
}
function vOrg(){
 return '<div class="seg">'+[['browse','Browse'],['focus','Focus'],['map','Full map']].map(([k,n])=>'<button class="'+(ORGV===k?'on':'')+'" data-orgv="'+k+'">'+n+'</button>').join('')+'</div>'
 +(ORGV==='browse'?treeHTML():ORGV==='focus'?focusedHTML():'<div class="card flat mapcard"><svg id="omap" xmlns="'+NS+'"></svg></div><p class="tiny" style="text-align:center">Full relationship map · pinch to zoom or scroll to explore. Use Focus for a clearer mobile view.</p>')
 +'<h2 class="sec">Departments & group chats</h2><details class="cc-dept"><summary><b>Group chats</b><small>'+GROUPS().length+' groups</small><span class="chev">⌄</span></summary><div class="cc-members">'+GROUPS().map(g=>'<button class="item card gitemc" data-grp="'+esc(g.slug)+'">'+avStack(g.members.filter(inWorkspace),5,26)+'<div class="grow"><div class="t">'+esc(g.name)+'</div><div class="s">'+g.members.length+' members</div></div><span class="chev">›</span></button>').join('')+'</div></details>';
}
function vActivity(feedOnly){
 const L=[...workspaceActivity()].reverse();
 const tabs=feedOnly?'':'<div class="seg">'+[['feed','Messages'],['schedule','Schedules'],['net','Network']].map(([k,n])=>'<button class="'+(ACTV===k?'on':'')+'" data-actv="'+k+'">'+n+'</button>').join('')+'</div>';
 if(!feedOnly&&ACTV==='schedule')return tabs+
 '<div class="notice"><b>Schedule estimates, not execution confirmations.</b> Times come from the saved roster. Actual run success will require a backend execution log.</div>'+miniSchedule();
 return tabs+(!feedOnly&&ACTV==='net'?'<div class="card"><div class="wnet big">'+(netSVG(ACT.items)||'<div class="empty">No messages yet</div>')+'</div></div>':'<div class="card"><h2>'+esc(ACT.date||'Today')+' <small>'+ACT.items.length+' messages · '+esc(syncTxt())+'</small></h2>'+(L.map(i=>msgRow(i,ACT.items.indexOf(i))).join('')||'<div class="empty">No bot-to-bot messages reported for this date. This does not verify whether automations ran.</div>')+'</div><p class="tiny" style="text-align:center">This feed omits private details. Message activity is not an execution monitor.</p>');
}
function vDepts(){return DEPTS().map(d=>`<button class="item card gitemc" data-dept="${d.id}" style="--dc:${d.color}"><span class="dbadge sm" style="background:${d.color}">${ic('grid',18)}</span><div class="grow"><div class="t">${esc(d.name)}</div><div class="s">${d.head?'Head: '+esc(nm(d.head))+' · ':''}${deptAll(d.id).length} bots · ${deptMsgs(d.id).length} msgs today</div>${avStack(deptAll(d.id).map(b=>b.id),8,24)}</div><span class="chev">›</span></button>`).join('')}
function vGroups(){return GROUPS().map(g=>{const d=DEP[g.dept];return `<button class="item card gitemc" data-grp="${g.slug}"><span class="dbadge sm" style="background:${d?d.color:'var(--accent)'}">${ic('chat',18)}</span><div class="grow"><div class="t">${esc(g.name)}</div><div class="s">${g.members.length} members</div>${avStack(g.members,8,24)}</div><span class="chev">›</span></button>`}).join('')||'<div class="empty">No group chats yet</div>'}
function vSettings(){return `<div class="notice"><b>Live crew data.</b> Built every 90 s from the bots, departments and group chats you set up in Grok Bot. Read-only: nothing here can change a bot. <a href="../" style="color:var(--accent);font-weight:650">Open classic map ›</a></div>
 <div class="card"><h2>Appearance</h2><div class="seg">${[['light','Light'],['dark','Dark'],['auto','Auto']].map(([k,n])=>`<button class="${TH.mode===k?'on':''}" data-mode="${k}">${n}</button>`).join('')}</div>
  <div class="cwgrid">${CW_ORDER.map(k=>{const c=CW[k],v=isDark()?c.Dk:c.L;return `<button class="cw ${TH.cw===k?'on':''}" data-cw="${k}" style="background:${v.bg};color:${v.fg};border-color:${TH.cw===k?v.a:v.line}"><span class="swc">${[v.a,v.a2,v.a3].map(x=>`<i style="background:${x}"></i>`).join('')}</span><b style="font-family:${c.fh}">${esc(c.n)}</b></button>`}).join('')}</div></div>
 <div class="card"><h2>Home screen</h2><button class="btn ghost block" style="margin-top:0" data-editws>Edit widgets</button><button class="btn ghost block" data-resetlayout>Reset widget layout</button></div>
 <div class="card"><h2>Data</h2><div class="kv"><span>Bots</span><b>${R.bots.length}</b></div><div class="kv"><span>Departments</span><b>${DEPTS().length}</b></div><div class="kv"><span>Group chats</span><b>${GROUPS().length}</b></div><div class="kv"><span>Activity</span><b>${esc(syncTxt())}</b></div><button class="btn ghost block" data-welcome>Show welcome again</button></div>
 <div class="verlbl">Crew Map widget-home preview · ${PREVIEW_VER}</div>`}

/* ---------- org map (same layout as the classic site) ---------- */
function drawMap(svg,onBot){svg.innerHTML='';const P={},W_=216,H=52,CWd=246;
 const cols=DEPTS(),n=Math.max(cols.length,1),width=Math.max(n*CWd,760),cx=width/2;
 const defs=mkE('defs',{},svg),gR=mkE('g',{},svg),gF=mkE('g',{},svg),gN=mkE('g',{},svg);
 const mark=(id,c)=>{const m=mkE('marker',{id,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'},defs);mkE('path',{d:'M0 0L10 5L0 10Z',style:`fill:${c}`},m)};mark('oar','var(--muted)');
 const rep=(d,arrow=true,cls='rep')=>mkE('path',{d,class:cls,'marker-end':arrow?'url(#oar)':null},gR);
 P.jackson={x:cx,y:40};if(BOT.chief)P.chief={x:cx,y:130};const rail=196,headY=278,botY0=360,step=68;let maxY=headY;
 cols.forEach((d,i)=>{const x=CWd*(i+.5)+(width-n*CWd)/2;const pill=mkE('g',{class:'dpill'},gN),tw=Math.min(W_,d.name.length*8+28);
  mkE('rect',{x:x-tw/2,y:222,width:tw,height:24,rx:12,style:`stroke:${d.color}`},pill);mkE('text',{x,y:238,'text-anchor':'middle',style:`fill:${d.color}`},pill).textContent=d.name;
  if(BOT.chief)rep(`M${cx} ${130+H/2}V${rail}H${x}V${d.head?headY-H/2-4:216}`);if(d.head)P[d.head]={x,y:headY};
  const kids=deptBots(d.id);kids.forEach((b,j)=>{P[b.id]={x,y:botY0+step*j};maxY=Math.max(maxY,P[b.id].y)});
  if(kids.length){const sx=x-W_/2+14;rep(`M${sx} ${d.head?headY+H/2:246}V${P[kids[kids.length-1].id].y}`,false);kids.forEach(b=>rep(`M${sx} ${P[b.id].y}H${x-W_/2}`,false))}});
 if(BOT.chief)rep(`M${cx} ${40+H/2}V${130-H/2-4}`);
 const appIds=Object.keys(APPS).filter(a=>FLOWS.some(f=>(f[0]===a||f[1]===a)&&(isBot(f[0])||isBot(f[1])))),ay=maxY+120;appIds.forEach((a,i)=>{P[a]={x:width*(i+1)/(appIds.length+1),y:ay,app:1}});
 const pos=id=>{const p=P[id];if(!p)return null;return p.app?{...p,w:APPS[id].length*8+34,h:30}:{...p,w:W_,h:H}};
 Object.values(BOT).forEach(b=>(b.dotted||[]).forEach(o=>{const p=pos(b.id),q=pos(o);if(!p||!q)return;const dir=q.x<p.x?-1:1,sx=p.x+dir*W_/2,qx=q.x-dir*W_/2,mx=(sx+qx)/2;mkE('path',{d:`M${sx} ${p.y}C${mx} ${p.y} ${mx} ${q.y+10} ${qx} ${q.y+10}`,class:'dotted'},gR)}));
 const edge=(p,q)=>{if(Math.abs(p.x-q.x)<40){const sx=p.x-p.w/2,qx=q.x-q.w/2,b=Math.min(sx,qx)-26-Math.abs(p.y-q.y)*.1;return `M${sx} ${p.y}C${b} ${p.y} ${b} ${q.y} ${qx} ${q.y}`}
  if(q.app||p.app){const a=p.app?q:p,o=p.app?p:q;return p.app?`M${o.x} ${o.y-o.h/2}C${o.x} ${o.y-80} ${a.x} ${a.y+90} ${a.x} ${a.y+a.h/2}`:`M${a.x} ${a.y+a.h/2}C${a.x} ${o.y-60} ${o.x} ${o.y-80} ${o.x} ${o.y-o.h/2}`}
  const dir=q.x>p.x?1:-1,sx=p.x+dir*p.w/2,qx=q.x-dir*q.w/2,mx=(sx+qx)/2;return `M${sx} ${p.y}C${mx} ${p.y} ${mx} ${q.y} ${qx} ${q.y}`};
 FLOWS.forEach(([a,b,l,c,both],i)=>{const p=pos(a),q=pos(b);if(!p||!q)return;c=c||col(isBot(a)?a:b);mark('of'+i,c);mkE('path',{d:edge(p,q),class:'flow',style:`stroke:${c}`,'marker-end':`url(#of${i})`,'marker-start':both?`url(#of${i})`:null},gF)});
 Object.keys(P).forEach(id=>{const p=pos(id);
  if(p.app){const g=mkE('g',{class:'app'},gN);mkE('rect',{x:p.x-p.w/2,y:p.y-p.h/2,width:p.w,height:p.h,rx:15},g);mkE('text',{x:p.x,y:p.y+4,'text-anchor':'middle'},g).textContent=(id==='runs'?'⛁ ':'▣ ')+APPS[id];return}
  const b=BOT[id],c=col(id),s=b.shape in SH?b.shape:'circle',so=STROKE_ONLY[s];const g=mkE('g',{class:'node'+(b.hidden?' hiddenbot':''),transform:`translate(${p.x} ${p.y})`,'data-mb':id},gN);
  mkE('rect',{class:'box',x:-W_/2,y:-H/2,width:W_,height:H,rx:16},g);mkE('circle',{cx:-W_/2+27,cy:0,r:17,style:`fill:${c};fill-opacity:.16`},g);
  mkE('path',{d:SH[s],transform:`translate(${-W_/2+27} 0)`,style:`fill:${so?'none':c};stroke:${c}`,'stroke-width':so?2:0,'stroke-linecap':'round'},g);
  mkE('text',{x:-W_/2+54,y:-3,class:'name'},g).textContent=b.name.length>19?b.name.slice(0,18)+'…':b.name;mkE('text',{x:-W_/2+54,y:14,class:'role'},g).textContent=b.role.length>27?b.role.slice(0,26)+'…':b.role;
  g.addEventListener('click',e=>{e.stopPropagation();onBot(id)})});
 svg.setAttribute('viewBox',`-70 8 ${width+140} ${ay+40}`);svg.style.width=Math.round((width+140)*.62)+'px'}
function postOV(el){const m=el.querySelector('#omap');if(m)drawMap(m,id=>{OV={kind:'mini',t:'bot:'+id};drawOV();el.querySelector('.ovb').scrollTop=0});
 el.querySelectorAll('.wnet svg [data-nb]').forEach(g=>{g.style.cursor='pointer';g.addEventListener('click',()=>{const id=g.dataset.nb;if(isBot(id)){OV={kind:'mini',t:'bot:'+id};drawOV();el.querySelector('.ovb').scrollTop=0}})})}
const openApp=k=>openOV({kind:'app',k},$(`.dock [data-app="${k}"] .aico`)?.getBoundingClientRect());

/* ---------- pages, dock, layout ---------- */
const PAGES=[['home','Home'],['org','Bots'],['activity','Activity']];
const APPV={org:['Org chart',vOrg,'org'],activity:['Activity',()=>vActivity(false),'activity'],depts:['Departments',vDepts,'grid'],groups:['Group chats',vGroups,'chat'],settings:['Settings',vSettings,'settings']};
const DOCK=['org','activity','settings'];
let uidN=0;const nid=()=>'w'+Date.now().toString(36)+(uidN++);
const DEF_LAYOUT=()=>({home:[['status','M'],['next','S'],['attention','S'],['orgmini','L']],org:[['orgmini','L'],['deptsum','M'],['unassigned','S']],activity:[['msgs','M'],['next','M'],['net','L']],depts:[],groups:[]});
const AUTO=[];
function autoList(k){const L=[];if(k==='depts'){DEPTS().forEach(d=>L.push({id:'a-dept:'+d.id,t:'dept:'+d.id,s:'S'}));if(fits([...L,{s:'M'}]))L.push({id:'a-deptsum',t:'deptsum',s:'M'})}
 else{GROUPS().forEach(g=>L.push({id:'a-grp:'+g.slug,t:'grp:'+g.slug,s:'S'}));if(fits([...L,{s:'M'}]))L.push({id:'a-grpsum',t:'grpsum',s:'M'})}
 while(L.length&&!fits(L))L.pop();return L}
function syncLayout(){LY.custom=LY.custom||{};AUTO.forEach(k=>{if(!LY.custom[k])LY[k]=autoList(k)});for(const k in LY)if(Array.isArray(LY[k]))LY[k]=LY[k].filter(w=>W[w.t])}

/* ---------- sheets ---------- */
function sheet(html,bind){const r=$('#sheet-root');r.innerHTML=`<div class="sheet-bg"><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div></div>`;const bg=r.firstChild;bg.addEventListener('click',e=>{if(e.target===bg)closeSheet()});if(bind)bind(bg.querySelector('.sheet'))}
function closeSheet(){$('#sheet-root').innerHTML=''}

const mkLayout=()=>{const L=DEF_LAYOUT(),o={};for(const k in L)o[k]=L[k].map(([t,s])=>({id:nid(),t,s}));return o};
let LY=load(K.layout,mkLayout);if(!LY||!LY.home||!LY.org)LY=mkLayout();
const saveLY=()=>localStorage.setItem(K.layout,JSON.stringify(LY));

const MAXR=4;
function rowsUsed(list){const g=[];const free=(r,c)=>!(g[r]&&g[r][c]);const set=(r,c)=>{(g[r]=g[r]||[])[c]=1};
 for(const w of list){const cw=w.s==='S'?1:2,rh=w.s==='L'?2:1;let placed=false;for(let r=0;r<20&&!placed;r++)for(let c=0;c<=2-cw&&!placed;c++){let ok=true;for(let i=0;i<rh;i++)for(let j=0;j<cw;j++)if(!free(r+i,c+j))ok=false;if(ok){for(let i=0;i<rh;i++)for(let j=0;j<cw;j++)set(r+i,c+j);placed=true}}}
 return g.length}
const fits=list=>rowsUsed(list)<=MAXR;


/* ---------- springboard ---------- */
let EDIT=false,OV=null;const SB={cur:0,n:PAGES.length,W:0};
const VW=()=>document.body.clientWidth,VH=()=>document.body.clientHeight;
const FR=()=>document.body.getBoundingClientRect();
const probe=(()=>{const d=document.createElement('div');d.style.cssText='position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;padding-top:max(env(safe-area-inset-top),20px);padding-bottom:env(safe-area-inset-bottom)';document.documentElement.appendChild(d);return d})();
function greeting(){const h=torNow().h,n='Jackson';const g=h<12?'Good morning':h<17?'Good afternoon':'Good evening';return n?`${g}, ${n}`:g}
function pageHTML([k,name],i){const list=LY[k]||[]; const sub=k==='home'?new Date().toLocaleDateString('en-CA',{weekday:'long',month:'long',day:'numeric'}):'Crew Map · '+syncTxt();
 const right=EDIT?`<button class="pillbtn" data-add>+ Add</button><button class="pillbtn on" data-done>Done</button>`:'';
 return `<section class="page" data-pg="${i}"><div class="pin2"><div class="top"><div class="tl"><div class="sub"><span>${esc(sub)}</span>${EDIT?'':'<button class="samplebadge" data-sample aria-label="About live data"><i class="live"></i>Feed</button>'}</div><h1>${esc(k==='home'?greeting():name)}</h1></div><div class="tr">${right}</div></div>
 <button class="cc-workspace-trigger" data-workspace-open>${esc(WORKSPACE_NAMES[WS_ACTIVE])} <span>⌄</span></button><div class="wgrid">${list.filter(w=>W[w.t]&&(!w.t.startsWith('bot:')||inWorkspace(w.t.slice(4)))).map(w=>`<div class="w ${w.s}" data-wid="${w.id}" data-t="${esc(w.t)}" role="button" aria-label="${esc(W[w.t].n)}">${EDIT?`<button class="wx" data-x aria-label="Remove">×</button>${W[w.t].sz.length>1?`<button class="wsz" data-sz aria-label="Resize">${w.s}</button>`:''}`:''}<div class="wi">${W[w.t].r(w.s)}</div></div>`).join('')||`<div class="emptypg">${EDIT?'Tap + Add to put widgets here':'Press and hold to add widgets'}</div>`}</div></div></section>`}
function render(){if(!R)return;syncDyn();syncLayout();const app=$('#app');
 app.innerHTML=`<div class="sb ${EDIT?'editing':''}" id="sb"><div class="track" id="track">${PAGES.map(pageHTML).join('')}</div></div>
 <div class="dockwrap"><div class="pdots">${PAGES.map((p,i)=>`<button data-pg="${i}" aria-label="${p[1]}" class="${i===SB.cur?'on':''}"><i></i></button>`).join('')}</div><nav class="dock" aria-label="Apps">${DOCK.map(k=>`<button data-app="${k}" aria-label="${APPV[k][0]}"><span class="aico">${ic(APPV[k][2],28)}</span><span>${APPV[k][0]}</span></button>`).join('')}</nav></div>`;
 metrics();go(SB.cur,false);bindSB()}
function metrics(){
 const sb=$('#sb'),dw=$('.dockwrap'),gr=$('.page .wgrid');
 if(!sb||!dw||!gr)return;
 const fr=FR(),dockTop=dw.getBoundingClientRect().top-fr.top,gridTop=gr.getBoundingClientRect().top-fr.top;
 const avail=Math.max(260,dockTop-gridTop-10),g=VW()<380?9:11;
 const u=Math.max(55,Math.floor((avail-g*(MAXR-1))/MAXR));
 sb.style.setProperty('--u',u+'px');
 sb.style.setProperty('--g',g+'px');
 sb.classList.toggle('compact',u<130);
 SB.W=VW();
}
function go(i,anim=true){SB.cur=Math.max(0,Math.min(SB.n-1,i));const t=$('#track');if(!t)return;t.style.transition=anim?'transform .38s cubic-bezier(.2,.9,.25,1)':'none';t.style.transform=`translateX(${-SB.cur*SB.W}px)`;$$('.pdots button').forEach((b,j)=>b.classList.toggle('on',j===SB.cur))}
function setEdit(on){if(EDIT&&!on){LY.custom=LY.custom||{};LY.custom[curKey()]=true;saveLY()}EDIT=on;render()}
const curKey=()=>PAGES[SB.cur][0];
function bindSB(){const sb=$('#sb'),track=$('#track');let st=null,lp=null;
 $$('.dock [data-app]').forEach(b=>b.onclick=()=>{if(EDIT)setEdit(false);openOV({kind:'app',k:b.dataset.app},b.querySelector('.aico').getBoundingClientRect())});
 $('.pdots [data-pg]').forEach(b=>b.onclick=()=>go(+b.dataset.pg));
 $('.cc-workspace-trigger').forEach(b=>b.onclick=workspacePicker);
 sb.querySelectorAll('[data-done]').forEach(b=>b.onclick=()=>setEdit(false));
 sb.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>gallery());
 sb.querySelectorAll('[data-sample]').forEach(b=>b.onclick=()=>ui.alert({title:'Live crew data',message:'The roster, departments and group chats are rebuilt every 90 seconds from the bots you set up in Grok Bot, and today’s bot-to-bot messages come from the crew log with private details removed. This display cannot currently control Grok bots.',action:'Got it'}));
 sb.querySelectorAll('[data-x]').forEach(b=>b.onclick=async e=>{e.stopPropagation();const w=b.closest('.w'),k=curKey(),item=LY[k].find(x=>x.id===w.dataset.wid);if(await ui.confirm({title:`Remove “${W[item.t].n}”?`,message:'You can add it back any time from + Add.',action:'Remove'})){LY[k]=LY[k].filter(x=>x!==item);saveLY();render()}});
 sb.querySelectorAll('[data-sz]').forEach(b=>b.onclick=e=>{e.stopPropagation();const w=b.closest('.w'),k=curKey(),item=LY[k].find(x=>x.id===w.dataset.wid),Z=W[item.t].sz,nx=Z[(Z.indexOf(item.s)+1)%Z.length],trial=LY[k].map(x=>x===item?{...x,s:nx}:x);
  if(!fits(trial))return toast('Not enough room on this page');item.s=nx;saveLY();render()});
 sb.addEventListener('pointerdown',e=>{if(OV||$('#sheet-root').children.length)return;if(e.target.closest('button'))return;st={x:e.clientX,y:e.clientY,pid:e.pointerId,w:e.target.closest('.w'),hist:[[e.clientX,performance.now()]],mode:null};
  if(!EDIT)lp=setTimeout(()=>{if(st&&!st.mode){st.mode='lp';navigator.vibrate?.(10);setEdit(true);st=null}},480)});
 sb.addEventListener('pointermove',e=>{if(!st||e.pointerId!==st.pid)return;const dx=e.clientX-st.x,dy=e.clientY-st.y;st.hist.push([e.clientX,performance.now()]);if(st.hist.length>6)st.hist.shift();
  if(!st.mode&&Math.hypot(dx,dy)>8){clearTimeout(lp);st.mode=EDIT&&st.w?'wdrag':Math.abs(dx)>Math.abs(dy)?'pager':'none';try{sb.setPointerCapture(st.pid)}catch(_){}if(st.mode==='wdrag')st.w.classList.add('drag')}
  if(st.mode==='pager'){let off=dx;if((SB.cur===0&&dx>0)||(SB.cur===SB.n-1&&dx<0))off=dx/(1+Math.abs(dx)/(SB.W*.35))*.6;track.style.transition='none';track.style.transform=`translateX(${-SB.cur*SB.W+off}px)`}
  else if(st.mode==='wdrag'){st.w.style.transform=`translate(${dx}px,${dy}px) scale(1.04)`;st.w.style.pointerEvents='none';const under=document.elementFromPoint(e.clientX,e.clientY);const tw=under&&under.closest('.w');$$('.w.drop').forEach(x=>x!==tw&&x.classList.remove('drop'));if(tw&&tw!==st.w)tw.classList.add('drop');st.target=tw&&tw!==st.w?tw:null}});
 const end=e=>{clearTimeout(lp);if(!st||e.pointerId!==st.pid){st=null;return}const s=st;st=null;const dx=e.clientX-s.x;
  if(s.mode==='pager'){const h=s.hist,v=h.length>1?(h[h.length-1][0]-h[0][0])/Math.max(1,h[h.length-1][1]-h[0][1]):0;let i=SB.cur;if(dx<-SB.W*.22||v<-.45)i++;else if(dx>SB.W*.22||v>.45)i--;go(i);return}
  if(s.mode==='wdrag'){const k=curKey();if(s.target){const L=LY[k],a=L.findIndex(x=>x.id===s.w.dataset.wid),b=L.findIndex(x=>x.id===s.target.dataset.wid);const [m]=L.splice(a,1);L.splice(b,0,m);if(!fits(L)){L.splice(L.indexOf(m),1);L.splice(a,0,m);toast('That would not fit')}saveLY()}render();return}
  if(s.mode)return;
  if(EDIT){if(!s.w)setEdit(false);return}
  if(s.w&&e.type==='pointerup'){const t=s.w.dataset.t;if(W[t].tap)return W[t].tap();openOV({kind:'mini',id:s.w.dataset.wid,t},s.w.getBoundingClientRect())}};
 sb.addEventListener('pointerup',end);sb.addEventListener('pointercancel',end);
 sb.addEventListener('contextmenu',e=>e.preventDefault())}
let wheelAcc=0,wheelT=0;
addEventListener('wheel',e=>{if(OV||$('#sheet-root').children.length)return;if(Math.abs(e.deltaX)<=Math.abs(e.deltaY))return;e.preventDefault();wheelAcc+=e.deltaX;const now=Date.now();if(now-wheelT<450)return;if(Math.abs(wheelAcc)>50){go(SB.cur+(wheelAcc>0?1:-1));wheelAcc=0;wheelT=now}},{passive:false});
addEventListener('keydown',e=>{if(document.querySelector('.uim'))return;if(e.key==='Escape'){if($('#sheet-root').children.length)closeSheet();else if(OV)closeOV();else if(EDIT)setEdit(false);return}if(OV||$('#sheet-root').children.length||/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName||''))return;if(e.key==='ArrowRight')go(SB.cur+1);if(e.key==='ArrowLeft')go(SB.cur-1)});
addEventListener('resize',()=>{metrics();go(SB.cur,false)});


/* ---------- gallery ---------- */
function gallery(){const k=curKey(),on=new Set(LY[k].map(w=>w.t));const keys=Object.keys(W).filter(t=>(true||W[t].sec===k)&&!W[t].hidden);
 const groups=true?PAGES.map(p=>[p[1],keys.filter(t=>W[t].sec===p[0])]).filter(g=>g[1].length):[[PAGES[SB.cur][1],keys]];
 sheet(`<h3>Add a widget</h3><p class="muted" style="margin-top:0">${true?'Any widget can live on this page.':`Widgets for ${esc(PAGES[SB.cur][1])}.`} Tap a size to add it.</p>${groups.map(([g,ts])=>`${groups.length>1?`<div class="gcat">${esc(g)}</div>`:''}${ts.map(t=>`<div class="gitem"><div class="gh"><b>${esc(W[t].n)}</b>${on.has(t)?'<span class="tiny">on this page</span>':''}</div><div class="gprev">${W[t].sz.map(s=>`<button class="gsz" data-t="${esc(t)}" data-s="${s}"><div class="w ${s}"><div class="wi">${W[t].r(s)}</div></div><span>${{S:'Small',M:'Medium',L:'Large'}[s]}</span></button>`).join('')}</div></div>`).join('')}`).join('')}`,el=>{
  el.querySelectorAll('.gsz').forEach(b=>b.onclick=()=>{const item={id:nid(),t:b.dataset.t,s:b.dataset.s},trial=[...LY[k],item];if(!fits(trial))return ui.alert({title:'This page is full',message:'Remove or shrink a widget on this page first, or add it to the Other page.'});LY[k]=trial;saveLY();closeSheet();render();toast(`Added ${W[item.t].n}`)})})}


/* ---------- overlay (apps + mini apps) ---------- */
const ovTitle=()=>OV.kind==='app'?APPV[OV.k][0]:(W[OV.t]||{n:''}).n;
function ovBody(){if(OV.kind==='app')return APPV[OV.k][1]();const w=W[OV.t];return w&&w.mini?w.mini():`<div class="card">${w?`<div class="wi">${w.r('M')}</div>`:''}</div>`}
function drawOV(){let el=$('#ov');const fresh=!el;if(fresh){el=document.createElement('div');el.id='ov';el.className='ov';document.body.appendChild(el)}const sc=el.querySelector('.ovb')?.scrollTop||0;
 el.innerHTML=`<div class="ovh"><button class="back" data-close aria-label="Back to Home">‹ Home</button><b>${esc(ovTitle())}</b><span class="hsp"></span></div><div class="ovb"><div class="pin">${ovBody()}</div></div><div class="homebar" role="button" aria-label="Swipe up to go Home"><i></i></div>`;
 el.querySelector('.ovb').scrollTop=sc;postOV(el);if(fresh)bindOV(el)}
function openOV(state,rect){OV=state;drawOV();const el=$('#ov'),fr=FR();document.body.classList.add('ovopen');if(!rect)rect={left:fr.left+VW()*.3,top:fr.top+VH()*.35,width:VW()*.4,height:VH()*.3};
 el.style.transition='none';el.style.transform=`translate(${rect.left-fr.left}px,${rect.top-fr.top}px) scale(${rect.width/VW()},${rect.height/VH()})`;el.style.borderRadius='48px';el.style.opacity='.5';el.getBoundingClientRect();
 el.style.transition='transform .42s cubic-bezier(.2,.9,.25,1),border-radius .42s,opacity .22s';el.style.transform='none';el.style.borderRadius='0';el.style.opacity='1'}
function closeOV(){const el=$('#ov');if(!el){OV=null;return}const was=OV;OV=null;render();const fr=FR();let src=was.kind==='mini'?$(`.sb [data-wid="${was.id}"]`):$(`.dock [data-app="${was.k}"] .aico`);let r=src&&src.getBoundingClientRect();
 if(!r||!r.width)r={left:fr.left+VW()*.35,top:fr.top+VH()*.4,width:VW()*.3,height:VH()*.2};
 el.style.transition='transform .36s cubic-bezier(.3,.8,.3,1),border-radius .36s,opacity .36s';el.style.transform=`translate(${r.left-fr.left}px,${r.top-fr.top}px) scale(${r.width/VW()},${r.height/VH()})`;el.style.borderRadius='60px';el.style.opacity='0';
 document.body.classList.remove('ovopen');setTimeout(()=>el.remove(),360)}
function bindOV(el){
 el.addEventListener('click',async e=>{const b=e.target.closest('[data-close],[data-open],[data-bot],[data-dept],[data-grp],[data-msg],[data-orgv],[data-actv],[data-cw],[data-mode],[data-editws],[data-resetlayout],[data-welcome]');if(!b)return;const d=b.dataset;const ovb=el.querySelector('.ovb');
  if('close' in d)return closeOV();
  if(d.open){OV={kind:'app',k:d.open};drawOV();ovb.scrollTop=0;return}
  if(d.bot){if(!isBot(d.bot))return;OV={kind:'mini',t:'bot:'+d.bot};drawOV();el.querySelector('.ovb').scrollTop=0;return}
  if(d.dept){OV={kind:'mini',t:'dept:'+d.dept};drawOV();el.querySelector('.ovb').scrollTop=0;return}
  if(d.grp){OV={kind:'mini',t:'grp:'+d.grp};drawOV();el.querySelector('.ovb').scrollTop=0;return}
  if(d.msg){const i=ACT.items[+d.msg];if(i)sheet(`<h3><span style="color:${col(i.from)}">${esc(nm(i.from))}</span> → <span style="color:${col(i.to)}">${esc(nm(i.to))}</span></h3><p class="muted" style="margin-top:0">${esc(i.time)} · ${esc(i.topic)}</p><div class="card"><p style="margin:0">${esc(i.summary)}</p></div><div class="row2">${isBot(i.from)?`<button class="btn ghost" data-sb="${esc(i.from)}">${esc(short(i.from))} ›</button>`:''}${isBot(i.to)?`<button class="btn ghost" data-sb="${esc(i.to)}">${esc(short(i.to))} ›</button>`:''}</div>`,s=>s.querySelectorAll('[data-sb]').forEach(x=>x.onclick=()=>{closeSheet();OV={kind:'mini',t:'bot:'+x.dataset.sb};drawOV();el.querySelector('.ovb').scrollTop=0}));return}
  if(d.orgv){ORGV=d.orgv;localStorage.setItem(K.orgv,ORGV);return drawOV()}
  if(d.actv){ACTV=d.actv;return drawOV()}
  if(d.cw){TH.cw=d.cw;saveTheme();drawOV();render();return}
  if(d.mode){TH.mode=d.mode;saveTheme();drawOV();render();return}
  if('editws' in d){closeOV();setTimeout(()=>setEdit(true),380);return}
  if('resetlayout' in d){if(await ui.confirm({title:'Reset widget layout?',message:'Every page goes back to the default widgets. Departments and Group chats follow Grok Bot again.',action:'Reset'})){LY=mkLayout();saveLY();render();toast('Layout reset')}return}
  if('welcome' in d){closeOV();setTimeout(welcome,380);return}});
 el.addEventListener('change',e=>{if(e.target.matches('[data-focus-select]')){FOCUS_ID=e.target.value;ORGV='focus';drawOV()}});
 // swipe up from the home bar closes; edge swipe right goes back
 let g=null;el.addEventListener('pointerdown',e=>{if(e.target.closest('button,a,input,select,label,textarea'))return;const fr=FR(),y=e.clientY-fr.top,x=e.clientX-fr.left,hb=!!e.target.closest('.homebar')||y>VH()-34,edge=x<20&&!hb;if(!hb&&!edge)return;e.preventDefault();getSelection()?.removeAllRanges();g={x:e.clientX,y:e.clientY,t:performance.now(),hb,pid:e.pointerId};try{el.setPointerCapture(e.pointerId)}catch(_){}el.style.transition='none';el.classList.add('dragging')});
 el.addEventListener('pointermove',e=>{if(!g||e.pointerId!==g.pid)return;if(g.hb){const dy=Math.min(0,e.clientY-g.y),s=Math.max(.55,1-Math.abs(dy)/VH()*.9);el.style.transform=`translateY(${dy*.6}px) scale(${s})`;el.style.transformOrigin='50% 100%';el.style.borderRadius=Math.min(44,Math.abs(dy)/3)+'px';g.d=dy}else{const dx=Math.max(0,e.clientX-g.x);el.style.transform=`translateX(${dx}px)`;g.d=dx}});
 const up=e=>{if(!g||e.pointerId!==g.pid)return;const s=g;g=null;el.classList.remove('dragging');const v=(s.d||0)/Math.max(1,performance.now()-s.t);
  if((s.hb&&((s.d||0)<-70||v<-.5))||(!s.hb&&(s.d||0)>90)){el.style.transformOrigin='0 0';closeOV();return}
  el.style.transition='transform .3s cubic-bezier(.2,.9,.25,1),border-radius .3s';el.style.transform='none';el.style.borderRadius='0';setTimeout(()=>{el.style.transformOrigin='0 0'},300)};
 el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up)}


/* ---------- welcome ---------- */
function welcome(){const w=document.createElement('div');w.className='onb';w.innerHTML=`<div class="obmain"><img class="applogo" src="../preview-widget/icon-512.png" alt="Crew Map"><h2>Your whole crew.<br>One home screen.</h2><p class="lede">A first look at the new Crew Map, built from widgets that follow the bots you set up in Grok Bot.</p>
 <ul class="obpts"><li><span>${ic('org',18)}</span>Jackson › Chief › department heads › their bots</li><li><span>${ic('swipe',18)}</span>Swipe between pages, swipe up to go home</li><li><span>${ic('hold',18)}</span>Press and hold to add, resize or move widgets</li><li><span>${ic('shield',18)}</span>${PRIVATE?'Private: only you can open it, and it never shows money or links':'Read-only and public-safe: no money, links or private details'}</li></ul></div>
 <div class="obfoot"><button class="btn block" data-go>Explore the preview</button><a class="btn ghost block" href="../" style="text-decoration:none">Open the classic map</a></div>`;document.body.appendChild(w);
 w.querySelector('[data-go]').onclick=()=>{localStorage.setItem(K.seen,'1');w.style.transition='opacity .3s,transform .3s';w.style.opacity='0';w.style.transform='scale(1.04)';setTimeout(()=>w.remove(),300)}}

/* ---------- boot ---------- */
(async function boot(){
 if(PRIVATE)await PrivateGate.open({title:'Crew Map',icon:'icon-180.png',ownerUid:(window.CREW_CFG||{}).OWNER_UID,probe:'crewMap/roster'});
 $('#app').innerHTML='<div class="splash"><img src="../preview-widget/icon-192.png" alt=""><span>Loading crew…</span></div>';
 await loadData();
 if(!R){$('#app').innerHTML='<div class="splash"><img src="../preview-widget/icon-192.png" alt=""><span>Can’t reach the crew data right now. Retrying…</span></div>';while(!R){await new Promise(r=>setTimeout(r,8000));await loadData()}}
 render();
 const qs=new URLSearchParams(location.search);
 if(!localStorage.getItem(K.seen)&&!/[?&]nowelcome\b/.test(location.search))welcome();
 if(qs.get('page'))go(Math.max(0,PAGES.findIndex(p=>p[0]===qs.get('page'))),false);
 if(qs.get('orgv'))ORGV=qs.get('orgv');if(qs.get('actv'))ACTV=qs.get('actv');
 if(qs.get('app')&&APPV[qs.get('app')])openOV({kind:'app',k:qs.get('app')});
 if(qs.get('w')){const t=qs.get('w');let hit=false;for(const k of PAGES.map(p=>p[0])){const it=(LY[k]||[]).find(x=>x.t===t);if(it){go(PAGES.findIndex(p=>p[0]===k),false);openOV({kind:'mini',id:it.id,t});hit=true;break}}if(!hit&&W[t])openOV({kind:'mini',t})}
 if(qs.get('edit'))setEdit(true);
 if(qs.get('gallery'))gallery();
 window.__crew={go,openOV,closeOV,setEdit,gallery,TH,saveTheme,render,welcome};
 const tick=async()=>{if(await loadData()){syncDyn();if(OV)drawOV();else if(!EDIT&&!$('#sheet-root').children.length)render()}else if(!OV&&!EDIT&&!$('#sheet-root').children.length){syncDyn();render()}};
 const shTick=()=>window.CrewSched&&CrewSched.loadShifts().then(x=>{if(x&&!EDIT&&!$('#sheet-root').children.length){if(OV)drawOV();else render()}});shTick();setInterval(shTick,30*60e3);
 setInterval(tick,60000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){tick();checkVer()}});
})();
// keep the preview fresh without manual cache clearing
async function checkVer(){try{const r=await fetch('version.json?t='+Date.now(),{cache:'no-store'});const j=await r.json();if(j.v&&j.v!==PREVIEW_VER&&!sessionStorage.getItem('crewmapw:rl:'+j.v)){sessionStorage.setItem('crewmapw:rl:'+j.v,'1');location.reload()}}catch(e){}}
checkVer();
})();
