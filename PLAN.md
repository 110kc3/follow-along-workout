# PLAN — follow-along-workout

Automated short-form daily workout brand: one 20–45 s vertical video per day,
generated from templates, human-approved, auto-posted to YouTube Shorts
(Instagram/TikTok manual at first). Raw brainstorm this is distilled from:
[docs/brainstorm.md](docs/brainstorm.md).

## Decisions (defaults — say so if you want different)

| # | Area | Decision | Why |
|---|------|----------|-----|
| 1 | Orchestration | **n8n already running on this Pi** (`docker/n8n`) | zero new infra |
| 2 | LLM access | **LiteLLM gateway already running on this Pi** | one place to swap models/providers, existing keys |
| 3 | Content DB | **Google Sheets** | native n8n nodes, Kamil's Google account already connected, easy manual editing |
| 4 | Renderer | **Remotion** project in `render/`, exposed as a small HTTP render service on the Pi host (systemd), n8n POSTs JSON → gets mp4 path | code-based templates, versioned in this repo; n8n runs in Docker so a host-side service is the clean boundary |
| 5 | Visual style (MVP) | **Text + countdown timer over branded animated background** — no exercise footage, no presenter | nothing to film, no stock-clip licensing, pure template rendering |
| 6 | Music | YouTube Audio Library (free, safe) | no copyright risk |
| 7 | Approval | **Telegram bot via n8n** (approve/reject buttons) | standard n8n pattern, phone-friendly |
| 8 | Publishing (MVP) | **YouTube Shorts only** via YouTube Data API; IG/TikTok = manual upload of the same file | YT quota (1600 units/upload, 10k/day default) easily covers 1/day; Meta/TikTok APIs are gated |
| 9 | Templates | Exactly **3** at launch: Quick Burn (5×20 s), EMOM (4×30 s/10 s), Mobility Reset (3×15 s) | constrained = automatable |

## Order of work — renderer first

The original brainstorm builds n8n workflows first. Inverted here: **the Remotion
renderer on a Pi 5 is the biggest technical risk** (ARM64 headless Chrome,
~900–1350 frames per video), so it's milestone 1 and a go/no-go gate.

## Milestones

### M0 — Scaffold + schema *(≈0.5 day)*
- Repo structure below; `schema/workout.schema.json` defining one video's full
  payload (title, hook, template id, exercises[] {name, seconds}, rest, caption,
  hashtags, CTA, music id, status).
- 3 hand-written fixture payloads in `render/fixtures/` (one per template).
- **Done when:** schema validates all 3 fixtures (`npm run validate`).

### M1 — Remotion renderer PoC ⚠️ go/no-go *(≈2–3 days)*
- Remotion project in `render/` with the 3 template compositions; brand kit
  (colors, font, logo) in `render/src/brand.ts`.
- `npm run render -- fixtures/quick-burn.json` → 1080×1920 mp4 in `out/`.
- Measure render time on the Pi 5.
- **Done when:** all 3 fixtures render to watchable mp4s on the Pi.
- **Fallback if Pi is too slow (>~30 min/video):** render via GitHub Actions
  (repo is on GitHub, `gh` authenticated) or on the Windows PC; n8n triggers
  either just as easily.

### M2 — Script generation *(≈1 day)*
- Prompt templates in `prompts/` (workout generator, caption/hashtags) with the
  safety rules: beginner-safe combinations, no medical claims, exercise names
  from a fixed allowlist in `schema/exercises.json`.
- n8n workflow: cron → LiteLLM → validate against schema → append row to
  Google Sheet, status `scripted`.
- **Done when:** 7 days of valid payloads generated in one run, all pass schema.

### M3 — Render service + approval loop *(≈1–2 days)*
- `render/server.mjs`: HTTP `POST /render` (JSON payload) → renders → returns
  file path; systemd unit on the Pi host.
- n8n workflow: sheet row `scripted` → POST render → Telegram message with
  preview video + Approve/Reject buttons → status `approved`/`rejected`.
- **Done when:** one tap in Telegram flips a row to `approved` with mp4 stored
  in `out/` (synced/backed up).

### M4 — YouTube upload *(≈1 day + API setup)*
- Google Cloud project, YouTube Data API v3, OAuth for the channel.
- n8n workflow: `approved` + scheduled date → upload as Short (title, desc,
  hashtags) → store video URL back in sheet, status `posted`.
- **Done when:** a video posts to the channel unattended.

### M5 — 7-day live run *(1 week, mostly passive)*
- Generate a week, approve daily via Telegram, YT auto-posts; manually upload
  the same mp4s to IG/TikTok.
- **Done when:** 7 consecutive days posted; write up what broke in `STATUS.md`.

### M6 — Metrics loop *(after M5)*
- Daily n8n workflow: YouTube Analytics → append metrics tab in the sheet;
  weekly LLM summary of best hooks/categories.
- IG/TikTok APIs, variant testing: **out of scope until M5 proves the loop.**

## Target repo structure

```
follow-along-workout/
├── PLAN.md  TODO.md  STATUS.md  README.md
├── docs/brainstorm.md          # original raw plan
├── schema/
│   ├── workout.schema.json
│   └── exercises.json          # allowlisted exercise names + safety tags
├── prompts/                    # LLM prompt templates (versioned!)
├── render/                     # Remotion project + render server
│   ├── src/                    # 3 template compositions + brand kit
│   ├── fixtures/               # sample payloads
│   └── server.mjs
├── n8n/                        # exported workflow JSONs (version-controlled)
└── scripts/                    # one-off helpers (YT OAuth bootstrap, etc.)
```

## Open questions (blocking M2, not M0/M1)

1. **Language/market:** Polish or English content? (English = bigger pool,
   Polish = less competition; affects prompts, brand name, music choice)
2. **Brand identity:** channel name, handle, colors/logo — needed before M4.
3. **Existing accounts:** is there a YouTube channel + Google Cloud project to
   use, or create fresh?

## Known risks

- **Pi 5 render speed / ARM headless Chrome** — gated at M1 with a named fallback.
- **Node 18 on the Pi is aging** — Remotion 4 wants Node ≥18; consider nvm →
  Node 20 LTS during M1 if anything misbehaves.
- **YouTube API quota** — default 10k units/day; 1 upload = 1600 units. Fine
  for 1/day, no quota request needed.
- **Content safety** — mitigated by the fixed exercise allowlist + schema
  validation; LLM composes from known-safe parts, never invents exercises.
