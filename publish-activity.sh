#!/usr/bin/env bash
# Builds sanitized activity.json and force-pushes it as the single commit on the orphan 'data' branch,
# only when the items changed. main/Pages are never touched. Usage: publish-activity.sh [--dry-run]
set -euo pipefail
DIR=$(cd "$(dirname "$0")" && pwd); WORK=/tmp/crew-map-data; REPO=https://github.com/jacksonpjwilson-dev/crew-map.git
NEW=$(python3 "$DIR/build_activity.py")
if [ "${1:-}" = "--dry-run" ]; then echo "$NEW"; exit 0; fi
if [ ! -d "$WORK/.git" ]; then
  git clone -q --branch data --single-branch "$REPO" "$WORK" 2>/dev/null || { rm -rf "$WORK"; mkdir -p "$WORK"; git -C "$WORK" init -q -b data; git -C "$WORK" remote add origin "$REPO"; }
fi
cd "$WORK"
git config user.name jacksonpjwilson-dev; git config user.email jacksonpjwilson-dev@users.noreply.github.com
strip(){ python3 -c 'import json,sys;d=json.load(sys.stdin);d.pop("generated",None);print(json.dumps(d,sort_keys=True))'; }
if [ -f activity.json ] && [ "$(strip < activity.json)" = "$(echo "$NEW" | strip)" ]; then exit 0; fi
echo "$NEW" > activity.json; git add activity.json
if git rev-parse -q --verify HEAD >/dev/null; then git commit -q --amend -m "activity data (auto)"; else git commit -q -m "activity data (auto)"; fi
gh auth setup-git >/dev/null 2>&1 || true
git push -q -f origin data && echo "pushed $(date +%H:%M)"
