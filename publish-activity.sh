#!/usr/bin/env bash
# Builds sanitized activity.json + roster.json (bots, departments, reporting lines, group chats, schedule,
# derived from the Grok Bot profiles on this box by build_roster.py) and force-pushes them as the single commit
# on the orphan 'data' branch, only when something changed. main/Pages are never touched.
# Run every 90 s by the loop that /workspace/ops/watchdog.sh keeps alive. Usage: publish-activity.sh [--dry-run]
set -euo pipefail
exec 9>/tmp/crew-map-publish.lock; flock -n 9 || exit 0   # never overlap runs
DIR=$(cd "$(dirname "$0")" && pwd); WORK=/tmp/crew-map-data; REPO=https://github.com/jacksonpjwilson-dev/crew-map.git
NEW=$(python3 "$DIR/build_activity.py")
ROSTER=$(python3 "$DIR/build_roster.py" || { echo "$(date +%H:%M) roster build failed; keeping last roster" >&2; true; })
if [ "${1:-}" = "--dry-run" ]; then echo "$NEW"; echo "$ROSTER"; exit 0; fi
if [ ! -d "$WORK/.git" ]; then
  git clone -q --branch data --single-branch "$REPO" "$WORK" 2>/dev/null || { rm -rf "$WORK"; mkdir -p "$WORK"; git -C "$WORK" init -q -b data; git -C "$WORK" remote add origin "$REPO"; }
fi
cd "$WORK"
git config user.name jacksonpjwilson-dev; git config user.email jacksonpjwilson-dev@users.noreply.github.com
strip(){ python3 -c 'import json,sys;d=json.load(sys.stdin);d.pop("generated",None);print(json.dumps(d,sort_keys=True))'; }
same_act=0; same_ros=1
[ -f activity.json ] && [ "$(strip < activity.json)" = "$(echo "$NEW" | strip)" ] && same_act=1
if [ -n "$ROSTER" ]; then { [ -f roster.json ] && [ "$(cat roster.json)" = "$ROSTER" ]; } || same_ros=0; fi
[ $same_act = 1 ] && [ $same_ros = 1 ] && exit 0
echo "$NEW" > activity.json; git add activity.json
if [ -n "$ROSTER" ]; then echo "$ROSTER" > roster.json; git add roster.json; fi
if git rev-parse -q --verify HEAD >/dev/null; then git commit -q --amend -m "activity data (auto)"; else git commit -q -m "activity data (auto)"; fi
gh auth setup-git >/dev/null 2>&1 || true
git push -q -f origin data && echo "pushed $(date +%H:%M)"
