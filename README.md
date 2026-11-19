# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/salikamarlisa3-cell/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/salikamarlisa3-cell/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Leonida Legend** is a complete trophy guide and platinum tracker for Grand Theft Auto VI on PlayStation 5, built as a single static web app with no build step and no network calls. It carries all 55 official trophies — 1 platinum, 2 gold, 6 silver, 46 bronze, 1,350 PSN points — with the official name, description and grade on every card, and an audit strip that re-verifies those counts from the data each time the page loads. Every trophy has its own guide written for this tracker, citing its sources on the card (the official PlayStation list as mirrored by Exophase and PSNProfiles, plus PowerPyx's trophy roadmap where it documents more); where the official description is all that is publicly known, the guide says so instead of inventing steps. The one potentially missable trophy — the Chapter 1 meditation behind Positive Mental Attitude — is flagged with its reasoning. The tracker itself offers search, family filters (story, missable, collectibles, activities, online), grade and earned-state filters, roadmap/grade sorting, count-progress inputs for counted trophies, spoiler protection that masks unearned story trophies, and progress that persists in localStorage with JSON export/import and reset. A four-stage platinum roadmap (story first run → strands & side activities → collectibles & world completion → cleanup & the platinum) ties it together, with per-stage earned counts that update as you play.

## Run it

```sh
node serve.ts
```

then open http://localhost:8080 (or serve `app/` with any static file server).

---
<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
