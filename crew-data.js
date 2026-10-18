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
sally:['Sally','Shopping & Gifts','star','lime',X[1],402,'fin','Weekly Costco list from Logbook pantry, plus gift deadlines (took over from Nick).'],
scout:['Scout','Pilot Jobs','teardrop','cyan',X[2],330,'car','Finds pilot job prospects.'],
ace:['Ace','Aviation Study','triangle','sky',X[2],402,'car','Aviation study; works with Scout.'],
margot:['Margot','French','book','pink',X[2],474,'car','French learning.'],
adam:['Adam','Economics & Politics','diamond','gold',X[2],546,'car','Economics and politics digests.'],
felix:['Fix it Felix','Developer','house','magenta',X[3],330,'tech','Builds and fixes apps (Logbook, Stack, Briefing site).'],
quinn:['Quinn','Quality Control','circle','teal',X[3],402,'tech','Reads runs.jsonl, flags broken things to Felix.'],
atlas:['Atlas','Optimization','bolt','indigo',X[3],474,'tech','Reads Penny, Cal, Remi and the Logbook to optimize.'],
romeo:['Romeo','Guelph Visits','clover','violet',X[4],330,'life','Plans Guelph visits around free time.'],
gram:['Gram','Games','sparkle','green',X[4],402,'life','Party games.'],
stella:['Stella','Stylist','heart','pink',X[4],474,'life','Personal stylist.']};
const D={ops:['Operations',0,'#4A90E2'],fin:['Finance & Household',1,'#9B5DE5'],car:['Career & Learning',2,'#1BA7A7'],tech:['Tech & Reliability',3,'#E040A0'],life:['Personal & Fun',4,'#3BA55C']};
const APPS={logbook:['Logbook',300,680],stack:['Stack',460,680],briefing:['Briefing site',620,680],runs:['runs.jsonl',850,620]};
const FLOWS=[ // from,to,label,color
['cal','sunny','schedule'],['remi','sunny','to-do'],['indie','sunny','mail'],['penny','sunny','balances'],['scout','sunny','top jobs'],
['sunny','briefing','publishes'],['penny','stack','money'],
['runs','quinn','all bots log',C.teal],['quinn','felix','fixes',C.teal],
['atlas','penny','reads'],['atlas','cal','reads'],['atlas','remi','reads'],['atlas','logbook','reads'],
['sally','logbook','reads'],['ace','scout','study ↔ jobs',null,true],['felix','logbook','maintains'],['felix','stack','maintains'],['felix','briefing','maintains']];

// Live roster (roster.json from the data branch): drops removed bots, picks up renames, adds new bots with defaults.
const DEPT_OF={}; // optional overrides for new bots: id:'ops'|'fin'|'car'|'tech'|'life'
function relayout(){for(const k in D){let i=0;for(const id in B)if(B[id][6]===k){B[id][4]=X[D[k][1]];B[id][5]=330+72*i++}}}
function applyRoster(r){
 if(!r||!Array.isArray(r.bots)||r.bots.length<5)return false; // sanity guard: ignore broken/empty rosters
 const live={};r.bots.forEach(b=>{if(b&&b.id&&b.name)live[String(b.id).toLowerCase()]=b});
 for(const id in B)if(id!=='jackson'&&!live[id])delete B[id];
 for(const id in live){const b=live[id],role=String(b.role||'').slice(0,40),name=String(b.name).slice(0,30);
  if(B[id]){B[id][0]=name;if(role)B[id][1]=role}
  else B[id]=[name,role||'Bot','circle','white',0,0,DEPT_OF[id]||'life',role||'New crew member.']}
 for(let i=FLOWS.length-1;i>=0;i--){const f=FLOWS[i];if(!(B[f[0]]||APPS[f[0]])||!(B[f[1]]||APPS[f[1]]))FLOWS.splice(i,1)}
 relayout();return true}
relayout();
