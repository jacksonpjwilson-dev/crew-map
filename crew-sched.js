/* Crew schedule timing, shared by the live map and the widget-home preview.
   Every item gets its NEXT occurrence in Ontario time (America/Toronto) and the list is sorted from now:
   "HH:MM" = every night/day, "Sun HH:MM" = weekly, "1st HH:MM" = monthly.
   kind 'briefing' = Sunny's delivery: 08:00, or 45 min before an early Chartright shift, read from Cal's
   public schedule (only the shift start time is used; nothing from it is shown). */
(function(){
const TZ='America/Toronto',WD=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],MO=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const SHIFT_URL='https://jacksonpjwilson-dev.github.io/schedule/data/schedule.json';
const pad=n=>String(n).padStart(2,'0'),hm=m=>pad(Math.floor(m/60))+':'+pad(m%60);
const torNow=(dt=new Date())=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(dt);
 const g=t=>+(p.find(x=>x.type===t)||{}).value;return {y:g('year'),mo:g('month'),d:g('day'),min:(g('hour')%24)*60+g('minute')}};
const dayNo=(y,mo,d)=>Math.floor(Date.UTC(y,mo-1,d)/864e5);
const fromDay=n=>{const x=new Date(n*864e5);return {y:x.getUTCFullYear(),mo:x.getUTCMonth()+1,d:x.getUTCDate(),wd:x.getUTCDay()}};
const dateTxt=day=>{const x=fromDay(day);return `${WD[x.wd]} ${MO[x.mo-1]} ${x.d}`};
let SH=null,shAt=0; // {early:{dayNo:startMin}, last:dayNo}
async function loadShifts(){if(SH&&Date.now()-shAt<30*60e3)return SH;
 const priv=window.CREW_CFG&&(CREW_CFG.PRIVATE||/[?&]private=1\b/.test(location.search));
 if(priv){try{const d=await JWAUTH.getDoc('crewMap/shifts');if(d&&d.early){SH={early:d.early,last:d.last};shAt=Date.now()}}catch(e){}return SH} // private: only early-shift start times, written by the box
 try{const r=await fetch(SHIFT_URL+'?t='+Math.floor(Date.now()/6e5),{cache:'no-store'});if(!r.ok)throw 0;const j=await r.json(),early={};let last=-1;
  (j.events||[]).forEach(e=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(e.date||''),t=/^(\d{1,2}):(\d{2})$/.exec(e.start||'');if(!m||!t)return;
   const dn=dayNo(+m[1],+m[2],+m[3]),st=+t[1]*60+ +t[2];last=Math.max(last,dn);
   if(e.type==='chartright'&&st>0&&!/cont/i.test(e.label||'')&&st-45<480)early[dn]=Math.min(early[dn]??1e9,st)});
  if(last>=0){SH={early,last};shAt=Date.now()}}catch(e){}
 return SH}
function parseWhen(t){let m;t=String(t||'').trim();
 if(m=t.match(/^(\d{1,2}):(\d{2})$/))return {k:'daily',min:+m[1]*60+ +m[2]};
 if(m=t.match(/^(sun|mon|tue|wed|thu|fri|sat)[a-z]*\.?\s+(\d{1,2}):(\d{2})$/i))return {k:'weekly',wd:WD.findIndex(w=>w.toLowerCase()===m[1].toLowerCase()),min:+m[2]*60+ +m[3]};
 if(m=t.match(/^(\d{1,2})(?:st|nd|rd|th)\s+(\d{1,2}):(\d{2})$/i))return {k:'monthly',dom:+m[1],min:+m[2]*60+ +m[3]};
 return null}
const NIGHT=300; // 00:00–04:59 belongs to the night before ("Tonight 00:05")
function next(s,now){now=now||torNow();const w=parseWhen(s.time);if(!w)return null;const today=dayNo(now.y,now.mo,now.d);let day=null,min=w.min,exact=true;
 if(s.kind==='briefing'){for(let i=0;i<10&&day==null;i++){const dd=today+i,known=!!SH&&dd<=SH.last,m=known&&SH.early[dd]!=null?Math.max(0,SH.early[dd]-45):w.min;
   if(i>0||m>now.min){day=dd;min=m;exact=known}}}
 else if(w.k==='daily')day=w.min>now.min?today:today+1;
 else if(w.k==='weekly'){let o=(w.wd-fromDay(today).wd+7)%7;if(o===0&&w.min<=now.min)o=7;day=today+o}
 else for(let i=0;i<3&&day==null;i++){let y=now.y,mo=now.mo+i;while(mo>12){mo-=12;y++}const dd=dayNo(y,mo,Math.min(w.dom,new Date(Date.UTC(y,mo,0)).getUTCDate()));if(dd>today||(dd===today&&w.min>now.min))day=dd}
 if(day==null)return null;
 const diff=day-today,inMin=(day-today)*1440+min-now.min,night=min<NIGHT,rep=s.kind==='briefing'||w.k==='daily';let label,group;
 if(rep&&night){const ld=(day-1)-(now.min<NIGHT?today-1:today);label=ld<=0?'Tonight':ld===1?'Tomorrow night':dateTxt(day);group=ld<=0?'Tonight':ld===1?'Tomorrow':'This week'}
 else{label=diff===0?(min>=1080?'Tonight':'Today'):diff===1?'Tomorrow':dateTxt(day);if(!rep&&diff>1)label=dateTxt(day);
  group=diff===0?(min>=1080?'Tonight':'Today'):diff===1?'Tomorrow':diff<=7?'This week':'Later'}
 if(!rep&&diff<=1)label+=' · '+dateTxt(day).slice(0,3);
 const clock=hm(min)+(s.kind==='briefing'&&!exact?'*':'');
 const note=s.kind==='briefing'&&!exact?(s.note||'')+' (earlier on early-shift days)':s.note;
 return {...s,note,day,min,diff,in:inMin,label,group,clock,when:label+' '+clock,exact,repeat:w.k,date:dateTxt(day)}}
function list(sched,now){return (sched||[]).map(s=>next(s,now)).filter(Boolean).sort((a,b)=>a.in-b.in)}
const inTxt=m=>m<60?`in ${m} min`:m<1440?`in ${Math.floor(m/60)}h${m%60?' '+m%60+'m':''}`:`in ${Math.round(m/1440)} day${Math.round(m/1440)===1?'':'s'}`;
const rep=x=>x.kind==='briefing'?'daily':x.repeat==='daily'?'nightly':x.repeat;
window.CrewSched={loadShifts,next,list,inTxt,rep,torNow,hm,dateTxt};
})();
