#!/usr/bin/env bash
# Builds sanitized activity.json and force-pushes it as the single commit on the orphan 'data' branch,
# only when the items changed. main/Pages are never touched. Usage: publish-activity.sh [--dry-run]
set -euo pipefail
DIR=$(cd "$(dirname "$0")" && pwd); WORK=/tmp/crew-map-data; REPO=https://github.com/jacksonpjwilson-dev/crew-map.git
NEW=$(python3 "$DIR/build_activity.py")
ROSTER=$(python3 "$DIR/build_roster.py" 2>/dev/null || true)
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
