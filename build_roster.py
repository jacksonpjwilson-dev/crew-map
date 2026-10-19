#!/usr/bin/env python3
"""Build the public roster.json for the crew map from the bots on this box.

Source of truth (read-only, never modified):
  /home/box/agent-data/agents/*/profile.json  name "Name (Role)", description, avatar, hidden/archived flags
  /home/box/agent-data/agents/*/group.json    group chats (room name in profile.json + memberIds)
  /home/box/shared/crew/README.md             "Nightly schedule" table
plus roster-overrides.json for what can't be inferred.

Departments and reporting lines are read from the descriptions ("Executive for X department. Reports to Chief...
Manages A (..), B (..), and C", "in the X department under Theo") and from department group-chat membership.
Descriptions themselves are NEVER published: output holds only names, short roles, departments, reporting lines,
group chats, the nightly schedule and curated one-line "about" text from the overrides file. Everything is scrubbed.
"""
import json, glob, os, re, sys, hashlib
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from sanitize import clean
AGENTS = os.environ.get('CREW_AGENTS', '/home/box/agent-data/agents')
README = os.environ.get('CREW_README', '/home/box/shared/crew/README.md')
OVR = os.path.join(HERE, 'roster-overrides.json')
PALETTE = ['#4A90E2', '#9B5DE5', '#1BA7A7', '#E040A0', '#3BA55C', '#FF9F1C', '#E63946', '#6366F1', '#E0A83A', '#2EC4D6']
SHAPES = ['circle', 'hexagon', 'square', 'diamond', 'triangle', 'star', 'gem', 'teardrop', 'bolt', 'heart', 'sparkle', 'book']
COLORS = ['yellow', 'blue', 'green', 'orange', 'cyan', 'violet', 'red', 'magenta', 'teal', 'lime', 'pink', 'gold', 'sky', 'indigo']
AV_SHAPE = {'hex': 'hexagon', 'squircle': 'square', 'cloud': 'cloud', 'gem': 'gem', 'square': 'square', 'leaf': 'leaf',
            'teardrop': 'teardrop', 'clover': 'clover', 'shield': 'shield', 'star': 'star', 'heart': 'heart', 'circle': 'circle'}
AV_COLOR = {'black': 'yellow', 'brown': 'gold', 'purple': 'violet', 'white': 'sky', 'gray': 'sky', 'grey': 'sky'}

def load(path, default=None):
    try:
        with open(path, encoding='utf-8') as f: return json.load(f)
    except Exception: return default

def norm(s): return re.sub(r'[^a-z0-9]+', ' ', str(s or '').lower()).strip()
def h(s): return int(hashlib.md5(s.encode()).hexdigest(), 16)

def split_name(raw):
    """'Theo (Head of Tech & Reliability)' -> ('Theo','Head of Tech & Reliability'); tolerant of odd text."""
    raw = ' '.join(str(raw or '').split())
    m = re.match(r'^(.*?)\s*\((.*)\)\s*$', raw)
    if m and m.group(1): return m.group(1).strip(), m.group(2).strip()
    return raw.strip(), ''

def sentence_after(text, word):
    """Text after `word` up to the first sentence end that is outside parentheses."""
    out = []
    for m in re.finditer(r'\b' + word + r'\b', text):
        depth, buf = 0, []
        for i, ch in enumerate(text[m.end():m.end() + 600]):
            if ch == '(': depth += 1
            elif ch == ')': depth = max(0, depth - 1)
            elif ch in '.;:\n' and depth == 0:
                nxt = text[m.end() + i + 1:m.end() + i + 2]
                if ch != '.' or nxt in ('', ' ', '\n'): break
            buf.append(ch)
        out.append(''.join(buf))
    return out

def top_level_items(s):
    """Split 'A (x, y), B (z), and C' on commas / 'and' that are outside parentheses."""
    items, depth, buf = [], 0, ''
    for ch in s:
        if ch == '(': depth += 1
        elif ch == ')': depth = max(0, depth - 1)
        if ch == ',' and depth == 0: items.append(buf); buf = ''
        else: buf += ch
    items.append(buf)
    res = []
    for it in items:
        res += re.split(r'\s+(?:and|&)\s+(?![^()]*\))', ' ' + it.strip())
    return [re.sub(r'^\s*(?:and|&)\s+', '', x).strip() for x in res if x.strip()]

def build():
    ov = load(OVR, {}) or {}
    exclude = set(map(str.lower, ov.get('exclude', [])))
    alias = {k.lower(): v for k, v in ov.get('ids', {}).items()}
    uidmap = ov.get('uids') or {}   # agent folder id -> stable bot id, so renames keep styles/overrides
    bots, groups, raw_desc = {}, [], {}
    uid2id = {}
    for d in sorted(glob.glob(os.path.join(AGENTS, '*', ''))):
        uid = os.path.basename(os.path.dirname(d))
        p = load(os.path.join(d, 'profile.json'))
        if not isinstance(p, dict): continue
        if p.get('deleted'): continue
        g = load(os.path.join(d, 'group.json'))
        if isinstance(g, dict) and isinstance(g.get('memberIds'), list):
            groups.append({'uid': uid, 'name': ' '.join(str(p.get('name') or 'Group chat').split()), 'members': [str(x) for x in g['memberIds']]})
            continue
        name, role = split_name(p.get('name'))
        if not name: continue
        role = role or str(p.get('title') or '').strip()
        bid = uidmap.get(uid) or alias.get(name.lower()) or re.sub(r'[^a-z0-9]', '', (name.lower().split() or [''])[0]) or 'bot'
        if bid in exclude: continue
        base, n = bid, 2
        while bid in bots: bid = f'{base}{n}'; n += 1
        bots[bid] = {'id': bid, 'name': name, 'role': role, 'hidden': bool(p.get('hidden') or p.get('archived')),
                     'avatar': (str(p.get('avatarShape') or ''), str(p.get('avatarColor') or ''))}
        raw_desc[bid] = ' '.join(str(p.get('description') or '').split())
        uid2id[uid] = bid

    # name lookup: full name, first name, "Name (Role)"
    look = {}
    for b in bots.values():
        for k in {norm(b['name']), norm(b['name']).split(' ')[0] if b['name'] else '', norm(b['id']), norm(f"{b['name']} {b['role']}")}:
            if k: look.setdefault(k, b['id'])
        last = norm(b['name']).split(' ')[-1]; look.setdefault(last, b['id'])   # "Felix" -> Fix it Felix
    def find(txt):
        t = norm(re.split(r'\(', txt or '')[0])
        if not t: return None
        if t in look: return look[t]
        w = t.split(' ')
        for n in range(min(4, len(w)), 0, -1):
            if ' '.join(w[:n]) in look: return look[' '.join(w[:n])]
        return None

    # --- departments from executives' descriptions / "Head of X" roles
    depts = {}   # key -> {name, head}
    def dkey(name):
        n = norm(re.sub(r"^(jackson s|the user s|his|the)\s+", '', norm(name)))
        return n.split(' ')[0] if n else None
    head_of = {}
    for bid, desc in raw_desc.items():
        m = re.search(r"\bExecutive for (?:Jackson's |the user's |his |the )?(.{2,60}?) department", desc, re.I)
        nm = m.group(1) if m else None
        if not nm:
            r = re.match(r'(?i)head of (.+)', bots[bid]['role'])
            nm = r.group(1) if r else None
        if nm:
            k = dkey(nm)
            if k and k not in depts:
                depts[k] = {'id': k, 'name': nm.strip(), 'head': bid}; head_of[bid] = k
    # group chats named like a department lend it their (usually fuller) name and membership
    for g in groups:
        k = dkey(g['name'])
        if k in depts and len(g['name']) > len(depts[k]['name']): depts[k]['name'] = g['name']
    for k, v in (ov.get('deptShort') or {}).items():
        if k in depts: depts[k]['name'] = v

    # --- votes for each bot's department
    votes, reports, also = {}, {}, {}
    def vote(bid, k, w):
        if bid and k: votes.setdefault(bid, {}); votes[bid][k] = votes[bid].get(k, 0) + w
    for bid, desc in raw_desc.items():
        for s in sentence_after(desc, 'Reports to'):
            r = find(s.strip())
            if r and r != bid: reports.setdefault(bid, r)
        m = re.search(r"\bin the (.{2,60}?) department(?: under ([A-Z][\w' -]{1,30}))?", desc)
        if m:
            k = dkey(m.group(1)); vote(bid, k if k in depts else None, 3)
            if m.group(2):
                r = find(m.group(2))
                if r and r != bid: reports.setdefault(bid, r)
        if bid in head_of:
            for s in sentence_after(desc, 'Manages'):
                for it in top_level_items(s):
                    t = find(it)
                    if t and t != bid and t not in head_of: vote(t, head_of[bid], 2); also.setdefault(t, set()).add(bid)
    gchats = []
    for g in groups:
        mem = [uid2id[u] for u in g['members'] if u in uid2id]
        k = dkey(g['name']); dk = k if k in depts else None
        if norm(g['name']).startswith('executive'): dk = 'exec'
        if dk and dk != 'exec':
            for b in mem:
                if b not in head_of and b != 'chief': vote(b, dk, 1)
        gchats.append({'name': clean(g['name'], 40), 'dept': dk, 'members': mem})

    # --- assign
    dov = {k.lower(): v for k, v in (ov.get('dept') or {}).items()}
    rov = {k.lower(): v for k, v in (ov.get('reportsTo') or {}).items()}
    dtov = {k.lower(): v for k, v in (ov.get('dotted') or {}).items()}
    chief = 'chief' if 'chief' in bots else None
    out = []
    for bid, b in bots.items():
        tier, dept = 'bot', None
        if bid in head_of: tier, dept = 'head', head_of[bid]
        elif bid == chief: tier = 'chief'
        elif bid in dov: dept = dov[bid] if dov[bid] in depts else None
        elif votes.get(bid):
            dept = sorted(votes[bid].items(), key=lambda kv: (-kv[1], kv[0]))[0][0]
        if b['hidden'] and tier == 'bot': dept = None
        boss = rov.get(bid) or reports.get(bid)
        if tier == 'bot' and dept: boss = depts[dept]['head'] if not boss or boss not in bots or boss == chief else boss
        if tier == 'head' and not boss: boss = chief
        if tier == 'bot' and not dept: boss = boss if boss in bots else None
        if tier == 'chief': boss = boss or 'jackson'
        dotted = sorted(x for x in also.get(bid, ()) if dept is None or depts.get(dept, {}).get('head') != x)
        if bid in dtov: dotted = sorted(dtov[bid])
        b.update({'tier': tier, 'dept': dept or ('exec' if tier in ('chief', 'head') else 'unassigned'), 'reportsTo': boss, 'dotted': dotted})
        out.append(b)

    # --- style, about, schedule
    style = ov.get('style') or {}; about = ov.get('about') or {}
    names = ov.get('names') or {}; roles = ov.get('roles') or {}
    sched = parse_schedule(find)
    # scheduleEdits: {"HH:MM": [{who, note}]} replaces the README rows at that exact time with clearer public wording
    # (only while the README still has a row at that time, so a moved routine never shows a stale label).
    edits = ov.get('scheduleEdits') or {}
    if edits:
        fixed = []
        for s in sched:
            rep = edits.get(s['time'])
            if isinstance(rep, list) and rep:
                if any(x is s for x in fixed): continue
                if s['time'] in [f['time'] for f in fixed]: continue
                for e in rep:
                    who = [w for w in e.get('who', []) if w in bots]
                    if who: fixed.append({'time': s['time'], 'who': who, 'note': clean(e.get('note'), 50)})
            else: fixed.append(s)
        sched = fixed
    runs = {}
    for s in sched:
        for w in s['who']: runs.setdefault(w, []).append(s['time'])
    bots_out = []
    for b in out:
        bid = b['id']
        if bid in style: shape, color = style[bid]
        else:
            sh, co = b['avatar']
            shape = AV_SHAPE.get(sh) or SHAPES[h(bid) % len(SHAPES)]
            color = AV_COLOR.get(co, co) if (AV_COLOR.get(co, co) in COLORS) else COLORS[h(bid + 'c') % len(COLORS)]
        dname = depts[b['dept']]['name'] if b['dept'] in depts else None
        boss = b['reportsTo']; bossname = 'Jackson' if boss == 'jackson' else (bots[boss]['name'] if boss in bots else None)
        ab = about.get(bid) or ' '.join(x for x in [f"{b['role'] or 'Crew member'}.", f"{dname} department." if dname else '', f"Reports to {bossname}." if bossname else ''] if x)
        bots_out.append({'id': bid, 'name': clean(names.get(bid, b['name']), 30), 'role': clean(roles.get(bid, b['role']), 40),
                         'tier': b['tier'], 'dept': b['dept'], 'reportsTo': boss, 'dotted': b['dotted'],
                         'hidden': b['hidden'], 'shape': shape, 'color': color, 'about': clean(ab, 160), 'runs': runs.get(bid, [])})
    order = [k for k in (ov.get('deptOrder') or []) if k in depts] + sorted(k for k in depts if k not in (ov.get('deptOrder') or []))
    cols = ov.get('deptColors') or {}
    dept_out = [{'id': k, 'name': clean(depts[k]['name'], 40), 'head': depts[k]['head'],
                 'color': cols.get(k) or PALETTE[h(k) % len(PALETTE)]} for k in order]
    if any(b['dept'] == 'unassigned' for b in bots_out):
        dept_out.append({'id': 'unassigned', 'name': 'Unassigned', 'head': None, 'color': '#8A8F98'})
    for e in ov.get('events') or []:
        ev = {'time': clean(e.get('time'), 12), 'who': [w for w in e.get('who', []) if w in bots], 'note': clean(e.get('note'), 60)}
        if e.get('kind') in ('briefing',): ev['kind'] = e['kind']
        if e.get('detail'): ev['detail'] = clean(e.get('detail'), 60)
        sched.append(ev)
    bots_out.sort(key=lambda b: ({'chief': 0, 'head': 1, 'bot': 2}[b['tier']], b['id']))
    return {'version': 2, 'lead': {'id': 'jackson', 'name': 'Jackson', 'role': 'Head Honcho', 'about': clean(about.get('jackson', ''), 160)},
            'departments': dept_out, 'bots': bots_out, 'groups': gchats, 'schedule': sched}

def parse_schedule(find):
    """'Nightly schedule' markdown table in the crew README -> [{time, who:[ids], note}]."""
    try: txt = open(README, encoding='utf-8').read()
    except Exception: return []
    m = re.search(r'(?im)^#+\s*nightly schedule\s*$(.*?)(?=^#|\Z)', txt, re.S)
    rows = []
    for ln in (m.group(1) if m else '').splitlines():
        c = [x.strip() for x in ln.strip().strip('|').split('|')]
        if len(c) < 2 or not re.match(r'^\d{1,2}:\d{2}$', c[0]): continue
        who = [w for w in (find(x) for x in re.split(r'[/,&]| and ', c[1])) if w]
        note = re.split(r'[;(]', c[2] if len(c) > 2 else '')[0].strip()
        if who: rows.append({'time': c[0], 'who': list(dict.fromkeys(who)), 'note': clean(note, 50)})
    return rows

if __name__ == '__main__':
    r = build()
    if len(r['bots']) < 5: sys.exit('roster too small; refusing')
    print(json.dumps(r, indent=1, ensure_ascii=False))
