// Static config only. The roster (bots, departments, reporting lines, group chats, schedule) is NOT here:
// it is generated every 90 s from the bots in Grok Bot (build_roster.py -> roster.json on the data branch).
const C={yellow:'#F5C518',blue:'#4A90E2',green:'#3BA55C',orange:'#FF9F1C',cyan:'#2EC4D6',violet:'#9B5DE5',red:'#E63946',magenta:'#E040A0',teal:'#1BA7A7',lime:'#84CC16',pink:'#FF8FA3',gold:'#E0A83A',sky:'#38BDF8',white:'#9CA3AF',coral:'#e06a3a',indigo:'#6366F1'};
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
const STROKE_ONLY={spiral:1,leaf:1};
// Apps and data files the bots read/write (not derivable from profiles, so kept here).
const APPS={logbook:'Logbook',stack:'Stack',briefing:'Briefing site',pantry:'Pantry',runs:'runs.jsonl'};
const FLOWS=[ // from,to,label,[colour],[both ways]
['cal','sunny','schedule'],['remi','sunny','to-do'],['indie','sunny','mail'],['penny','sunny','balances'],['scout','sunny','top jobs'],
['sunny','briefing','publishes'],['penny','stack','money'],
['runs','quinn','all bots log','#1BA7A7'],['quinn','felix','fixes','#1BA7A7'],
['atlas','penny','reads'],['atlas','cal','reads'],['atlas','remi','reads'],['atlas','logbook','reads'],
['sally','logbook','reads'],['sally','pantry','reads'],['ace','scout','study ↔ jobs',null,true],
['felix','logbook','maintains'],['felix','stack','maintains'],['felix','briefing','maintains'],['felix','pantry','maintains'],
['toby','runs','usage']];
