#!/usr/bin/env python3
"""Build sanitized activity.json (today's bot-to-bot messages, Ontario time) from crew bus.jsonl."""
import json,re,sys,datetime as dt
from zoneinfo import ZoneInfo
TZ=ZoneInfo('America/Toronto'); BUS='/home/box/shared/crew/bus.jsonl'
BOTS={'chief','cal','remi','sunny','indie','penny','sally','scout','ace','margot','adam','felix','quinn','atlas','romeo','gram','stella','otto','fiona','clara','theo','piper','toby','all'}
try:
    import os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); import build_roster
    _r={b['id'] for b in build_roster.build()['bots']}
    if len(_r)>=5: BOTS=_r|{'all'}
except Exception: pass
ALIAS={'fix it felix':'felix','felix':'felix','basil':'sally','nick':'sally','everyone':'all','crew':'all'}
from sanitize import scrub, PRIVATE   # shared with build_roster.py
def bot(n):
    n=(n or '').strip().lower(); n=ALIAS.get(n,n.split(' (')[0]); n=ALIAS.get(n,n); return n if n in BOTS else None
def summary(m,limit=180):
    m=scrub(' '.join(m.split())); s=re.split(r'(?<=[.!?])\s',m)[0]
    if len(s)<60 and len(m)>len(s): s=m
    return s if len(s)<=limit else s[:limit].rsplit(' ',1)[0]+'…'
def main(day=None):
    now=dt.datetime.now(TZ); day=day or now.date().isoformat(); out=[]; flags=[]
    for ln in open(BUS):
        try: r=json.loads(ln)
        except Exception: continue
        t=dt.datetime.fromisoformat(r['ts']).astimezone(TZ)
        if t.date().isoformat()!=day: continue
        f,to=bot(r.get('from')),bot(r.get('to'))
        if not f or f=='all' or not to: continue   # drops Jackson and unknown senders
        topic=(r.get('topic') or '').replace('-',' ').strip()
        priv=bool(PRIVATE.search(topic+' '+str(r.get('message',''))))   # topic AND message
        summ='Private topic – details kept off the public page.' if priv else summary(r.get('message',''))
        out.append({'time':t.strftime('%H:%M'),'from':f,'to':to,'topic':'private' if priv else scrub(topic),'summary':summ})
    out.sort(key=lambda i:i['time'])
    return {'date':day,'generated':now.strftime('%H:%M'),'items':out}
if __name__=='__main__':
    print(json.dumps(main(sys.argv[1] if len(sys.argv)>1 else None),indent=1,ensure_ascii=False))
