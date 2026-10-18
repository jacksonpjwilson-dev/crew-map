#!/usr/bin/env python3
"""Build public roster.json from bot profiles. Publishes only id, short name and short role title (from "Name (Role)");
descriptions are never read into the output. Group rooms (names without a "(Role)") are skipped."""
import json,glob,re,sys
AGENTS='/home/box/agent-data/agents/*/profile.json'
REMOVED={'vinny','nick'}            # retired bots whose profiles may linger on the box
ALIAS={'fix it felix':'felix'}
NAMES={'felix':'Fix it Felix'}
def roster():
    bots={}
    for f in sorted(glob.glob(AGENTS)):
        try: p=json.load(open(f))
        except Exception: continue
        if p.get('deleted') or p.get('hidden') or p.get('archived'): continue
        m=re.fullmatch(r'\s*([^()]{1,30}?)\s*\(([^()]{1,40})\)\s*',p.get('name') or '')
        if not m: continue
        name,role=m.group(1),m.group(2)
        bid=ALIAS.get(name.lower(),re.sub(r'[^a-z0-9]','',name.lower().split()[0]))
        if not bid or bid in REMOVED: continue
        bots[bid]={'id':bid,'name':NAMES.get(bid,name),'role':role}
    return {'bots':sorted(bots.values(),key=lambda b:b['id'])}
if __name__=='__main__':
    r=roster()
    if len(r['bots'])<5: sys.exit('roster too small; refusing')
    print(json.dumps(r,indent=1,ensure_ascii=False))
