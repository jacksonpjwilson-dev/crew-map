# Existing infrastructure inspection

Inspected 2026-11-11, starting from main `07d130d`. All nine remote branches were fetched and enumerated before implementation. No AGENTS.md was found in the workspace/repository. The promotional crew-map-launch repository was not used.

| Branch | Tip | Findings |
|---|---|---|
| main | 07d130d | Current web application, public/private modes, three preview frontends, sanitizer, publishers, Node smoke CI |
| data | bc1a78b | Orphan generated data: roster.json and activity.json only; publisher amends and force-pushes it |
| app-icon | 8bd646e | Earlier PWA artwork/manifest and orgchart.js generation |
| crew-vnext-preview-20261024 | 8bb4828 | Earlier differentiated widget/mobile navigation presentation; no native app |
| fix-org | 8ca7e99 | Earlier orgchart and WebKit styling fixes |
| roster-sync | c36cc1d | Generated bot-profile roster integration |
| v2 | b6bec9d | Earlier publishing/site implementation |
| v3 | 3bc05d3 | Earlier map-first orgchart implementation |
| widget-home | 4975cf9 | Web widget preview and schedule presentation; no WidgetKit target |

Source examined: index.html, app.js, crew-data.js, crew-sched.js, config.js, themes.js, style.css structure, jwauth.js, private-gate.js, roster-overrides.json, build_roster.py, build_activity.py, sanitize.py, publish-activity.sh, current data branch files, preview app structure/dependencies, and the existing CI workflow.

| Feature | Source/dependency | Native handling |
|---|---|---|
| Hierarchy, departments, names, roles, hidden state, colours | roster v2, generated from agent profiles/group membership and curated overrides | Codable model, dynamic directory, profiles, tree and map |
| Group chats and membership | roster.groups | Organization and profile listings |
| Reporting and dotted relationships | roster.bots[].reportsTo/dotted | Separate graph line styles and profile relationships |
| Static app connections/data flows | crew-data.js APPS/FLOWS | Explicitly static native metadata copied to StaticFlow.swift; not evidence of execution |
| Daily message network/feed | data/activity.json | Directed counts, searchable/filterable daily feed |
| Scheduled routines | roster.schedule, crew-sched.js | Calendar calculation using America/Toronto; strict future minute, weekly, clamped monthly days |
| Early briefing | public schedule/data/schedule.json; private crewMap/shifts | Public minimal shift decoding/caching; 45-minute offset for eligible early Chartright shifts; estimates marked |
| Appearance | themes.js + localStorage | Native system/light/dark, teal/violet/coral accents, SwiftData favourites; full web theme/layout parity pending |
| Authentication | config PRIVATE:false; Firebase logbook-e784a; JWAUTH + PrivateGate | No claim of native authentication; public read-only integration only |
| Web previews | preview-widget, crew-vnext, crew-apple-v3 | Preserved unchanged; native app is not a web view |
| CI | .github/workflows/ci.yml → node ci/smoke.mjs | Preserved, plus a separate native workflow |

## Generation and backend

`build_roster.py` reads `/home/box/agent-data/agents/*/{profile,group}.json` and `/home/box/shared/crew/README.md`, with environment overrides CREW_AGENTS/CREW_README. Raw profile descriptions are not published. The version-2 roster contains lead, departments, bots, groups, schedule; bots include stable ID, role, hierarchy, dotted links, hidden, shape, colour, public about, and run strings. Department head/group department can be null.

`build_activity.py` reads `/home/box/shared/crew/bus.jsonl`, selects an Ontario calendar day, normalizes sender IDs, suppresses private topics, and scrubs summaries. Output contains date, generated (HH:mm), and items with time/from/to/topic/summary. The inspected data feed contained no messages for its day. It has **no task ID, execution result, enabled state, error severity, quota, or heartbeat**.

`publish-activity.sh` serializes publication with flock. A watchdog-managed loop is documented as running every 90 seconds. The orphan data branch changes only when content changes, ignoring activity.generated during comparisons. Therefore generated time cannot be treated as a guaranteed heartbeat; roster has no source-generated timestamp. The native app records successful fetch time separately.

The publisher optionally invokes `/workspace/fullapp-shared/firestore-writer/fswrite.py crewmap` with throttling/pending flush. That writer, watchdog, production agent files, Firestore rules, service account, and APNs provider are **outside this checkout and were not available to inspect or verify**. The web private feed expects `{data: ...}` wrappers in crewMap/roster and crewMap/activity. No backend code or publishing behavior was modified.

## Public data review

Existing sanitization reduces exposure but is heuristic. Public roster names, organizational links, routine timings, and sanitized message topics can still reveal personal information. Native caches and widgets do not make those upstream public files private. Restrict sensitive operational messages at the writer/rules layer; validate owner-only Firestore access before moving native users to a private source. Do not flip the existing web configuration until that migration is tested. No new private messages, secrets, or raw agent profiles were published or added to fixtures.
