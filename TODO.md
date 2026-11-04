# TODO — follow-along-workout

Milestones and decisions: [PLAN.md](PLAN.md). Work top-down; each item is
independently completable.

## M0 — Scaffold + schema
- [x] Write `schema/workout.schema.json` (full per-video payload; fields listed in PLAN.md M0)
- [x] Write `schema/exercises.json` — ~40 allowlisted bodyweight/mobility exercises with safety tags (impact level, floor/standing, beginner-ok)
- [x] Write 3 fixture payloads in `render/fixtures/` (quick-burn, emom, mobility-reset)
- [x] Add `npm run validate` checking fixtures against schema

## M1 — Remotion renderer PoC (go/no-go)
- [x] Scaffold Remotion project in `render/`: created `package.json`, `tsconfig.json`, `Root.tsx`, `index.ts`, and `compositions/QuickBurn.tsx` referencing brand design tokens; verified with `scripts/remotion.test.mjs`.
- [x] Brand kit stub `render/src/brand.ts` (placeholder colors/font until branding decided; includes 1080x1920 video specs, safe areas, and unit tests)
- [x] Composition: Quick Burn template (title card → per-exercise screens with countdown ring → CTA end card) in `render/src/compositions/QuickBurn.tsx`; verified with `scripts/quickburn.test.mjs`.
- [x] Compositions: EMOM + Mobility Reset (reuse Quick Burn components in `render/src/compositions/EMOM.tsx` and `render/src/compositions/MobilityReset.tsx`, registered in `Root.tsx`, verified with `scripts/emom.test.mjs` and `scripts/mobility.test.mjs`)
- [ ] `npm run render -- fixtures/<name>.json` CLI wrapper
- [ ] Render all 3 on the Pi; record render times in STATUS.md → **go/no-go on Pi rendering**
- [ ] Pick 2–3 tracks from YouTube Audio Library, drop into `render/assets/`

## M2 — Script generation
- [ ] Answer PLAN.md open questions 1 (language) — blocks prompt writing
- [ ] Prompt templates in `prompts/` (workout composer, caption+hashtags) with safety rules
- [ ] Create Google Sheet with schema columns + status lifecycle (idea/scripted/rendered/approved/posted/failed)
- [ ] n8n workflow: cron → LiteLLM → schema-validate → append sheet rows
- [ ] Export workflow JSON to `n8n/`

## M3 — Render service + approval
- [ ] `render/server.mjs` HTTP POST /render + systemd unit
- [ ] n8n: scripted row → render → Telegram preview with Approve/Reject → update status
- [ ] Create Telegram bot, store token in n8n credentials

## M4 — YouTube upload
- [ ] Google Cloud project + YouTube Data API v3 + OAuth consent (needs channel decision — PLAN.md question 3)
- [ ] n8n: approved + date reached → upload Short → write URL/status back to sheet

## M5 — 7-day live run
- [ ] Generate week, run the loop daily; manual IG/TikTok uploads
- [ ] Write up outcomes/breakages in STATUS.md

## M6 — Metrics (post-M5)
- [ ] Daily analytics pull → metrics tab in sheet
- [ ] Weekly LLM performance summary
