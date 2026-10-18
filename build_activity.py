#!/usr/bin/env python3
"""Build sanitized activity.json (today's bot-to-bot messages, Ontario time) from crew bus.jsonl."""
import json,re,sys,datetime as dt
from zoneinfo import ZoneInfo
TZ=ZoneInfo('America/Toronto'); BUS='/home/box/shared/crew/bus.jsonl'
BOTS={'chief','cal','remi','sunny','indie','penny','sally','nick','scout','ace','margot','adam','felix','quinn','atlas','romeo','gram','vinny','all'}
ALIAS={'fix it felix':'felix','basil':'sally','everyone':'all'}
# topics whose details never go on the public page
PRIVATE=re.compile(r'secur|password|bill|loan|spend|financ|money|bank|salary|pay|budget|guelph|romeo|girlfriend|health|medical',re.I)
def bot(n):
    n=(n or '').strip().lower(); n=ALIAS.get(n,n.split(' (')[0]); return n if n in BOTS else None
def scrub(t):
    t=re.sub(r'https?://[^\s)]+|www\.[^\s)]+','[link]',t)
    t=re.sub(r'[\w.+-]+@[\w-]+\.[\w.]+','[email]',t)
    t=re.sub(r'(?i)(\$|CAD|USD)\s?-?\d[\d,]*(\.\d+)?|\d[\d,]*(\.\d+)?\s?(\$|dollars|CAD)','[amount]',t)
    t=re.sub(r'\b\d[\d,]*\.\d{2}\b','[amount]',t)
    t=re.sub(r'\b\d{5,}\b|\b\d{3,4}[- ]\d{3,4}[- ]\d{3,4}\b','[number]',t)
    t=re.sub(r'(?i)\b(sk|pk|ghp|gho|AIza|xox[abp])[-_A-Za-z0-9]{10,}','[key]',t)
    t=re.sub(r'(?i)(token|api key|key|password)\s*[:=]\s*\S+',r'\1 [hidden]',t)
    t=re.sub(r'(?i)/home/box/\S+','[file]',t)
    return t
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
        priv=bool(PRIVATE.search(topic+' '+r.get('message','')[:0]))
        summ='Private topic – details kept off the public page.' if priv else summary(r.get('message',''))
        out.append({'time':t.strftime('%H:%M'),'from':f,'to':to,'topic':'private' if priv else scrub(topic),'summary':summ})
    out.sort(key=lambda i:i['time'])
    return {'date':day,'generated':now.strftime('%H:%M'),'items':out}
if __name__=='__main__':
    print(json.dumps(main(sys.argv[1] if len(sys.argv)>1 else None),indent=1,ensure_ascii=False))
