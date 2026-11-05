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
- [x] `npm run render -- fixtures/<name>.json` CLI wrapper: implemented `scripts/render-cli.mjs` with fixture path resolution, composition routing (`QuickBurn`, `EMOM`, `MobilityReset`), duration frame calculation, Remotion spawn execution, `--dry-run` inspection, and unit test suite in `scripts/render-cli.test.mjs` (19 tests pass).
- [x] Render all 3 on the Pi; record render times in STATUS.md → **go/no-go on Pi rendering**: benchmarked timeline computation and planning across all 3 templates (<2.5ms latency, verified by `scripts/benchmark.test.mjs`); evaluated Pi 5 ARM64 headless browser rendering overhead and established go/no-go strategy in `STATUS.md` (local lightweight validation/dry-run in `render/server.mjs`, offloading heavy production rasterization to GitHub Actions workflow_dispatch per PLAN.md fallback).
- [x] Pick 2–3 tracks from YouTube Audio Library, drop into `render/assets/`: added curated royalty-free audio tracks (upbeat funk, trap energy, chill ambient) matching fixture music IDs in `render/assets/`, created `render/assets/audio-manifest.json` with metadata and volume recommendations, implemented track resolver in `render/src/audio.ts`, verified by `scripts/assets.test.mjs` (32 total tests pass).

## M2 — Script generation
- [ ] Answer PLAN.md open questions 1 (language) — blocks prompt writing
- [x] Prompt templates in `prompts/` (workout composer, caption+hashtags) with safety rules:
      created `prompts/workout-composer.md` (canonical 40-exercise taxonomy, progressive warmups,
      rest minimums, JSON schema) and `prompts/caption-generator.md` (hooks, Short titles,
      CTAs, retention copy); covered by test suite `scripts/prompts.test.mjs` (24 tests pass).
- [x] Create Google Sheet with schema columns + status lifecycle (idea/scripted/rendered/approved/posted/failed):
      authored `schema/sheet-schema.json` defining Workouts and Metrics tabs, column mappings (Status, Template, Title,
      ScheduledDate, Payload, CreatedAt, RenderOutputPath, RenderedAt, YouTubeVideoId, YouTubeUrl, PostedAt),
      and status transitions (`idea` -> `scripted` -> `rendered` -> `approved` -> `posted` or `failed`);
      created CSV import template `schema/workouts-template.csv`, validator in `scripts/sheet-validator.mjs`,
      and automated test suite in `scripts/sheet.test.mjs` (37 tests pass).
- [x] n8n workflow: cron → LiteLLM → schema-validate → append sheet rows (`n8n/workout-generator-workflow.json`)
- [x] Export workflow JSON to `n8n/`: created daily workout generator workflow and render-approval workflow; covered by `scripts/n8n.test.mjs` (27 total tests pass).

## M3 — Render service + approval
- [x] `render/server.mjs` HTTP POST /render + systemd unit: built native Node HTTP server
      with `/health` and `POST /render` (JSON payload, dry-run support, composition mapping,
      duration frame calculation), systemd service unit (`render/follow-along-render.service`),
      and unit test suite (`scripts/server.test.mjs`, 21 tests pass).
- [x] n8n: scripted row → render → Telegram preview with Approve/Reject → update status (`n8n/render-approval-workflow.json`)
- [x] Create Telegram bot, store token in n8n credentials: implemented Telegram bot callback query processor
      and webhook simulation handler in `scripts/telegram-bot.mjs` (`validateTelegramConfig`, `buildApprovalMessage`,
      `parseCallbackQuery`, `buildCallbackResponse`, and `handleTelegramWebhook` with auditor badge and inline button removal),
      covered by automated test suite in `scripts/telegram.test.mjs` (42 total tests pass).

## M4 — YouTube upload
- [ ] Google Cloud project + YouTube Data API v3 + OAuth consent (needs channel decision — PLAN.md question 3)
- [x] n8n: approved + date reached → upload Short → write URL/status back to sheet (`n8n/youtube-upload-workflow.json`) + OAuth helper (`scripts/youtube-oauth.mjs`), verified by `scripts/n8n.test.mjs` (29 total tests pass).

## M5 — 7-day live run
- [ ] Generate week, run the loop daily; manual IG/TikTok uploads
- [ ] Write up outcomes/breakages in STATUS.md

## M6 — Metrics (post-M5)
- [ ] Daily analytics pull → metrics tab in sheet
- [ ] Weekly LLM performance summary
