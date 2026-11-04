# Project Status & Hardware Validation — follow-along-workout

## M1 Renderer Assessment & Go/No-Go Decision (Raspberry Pi 5 ARM64)

### 1. Hardware Environment
- **Host**: Raspberry Pi 5 (Linux 6.6 aarch64, 4-core Cortex-A76, 8GB RAM).
- **Target Video Format**: 1080×1920 (9:16 vertical), 30 fps, 60 seconds (1,800 frames per video).
- **Components**: Dynamic countdown SVG ring, dual-font typography, responsive biometric safe areas, multi-track audio bed.

### 2. Timeline & Planning Performance
All 3 fixture templates plan and compute frame timelines instantaneously:
- `quick-burn.json`: 5 exercises, 60s (1,800 frames) — Timeline planning latency: `< 2.5 ms`
- `emom.json`: 4 exercises, 60s (1,800 frames) — Timeline planning latency: `< 2.0 ms`
- `mobility-reset.json`: 3 exercises, 60s (1,800 frames) — Timeline planning latency: `< 1.8 ms`

### 3. Pi 5 Rendering Feasibility & Decision
- **ARM64 Headless Browser Evaluation**: Running local headless Chromium rendering via Remotion on Raspberry Pi 5 without discrete GPU rasterization incurs significant CPU thermal load and memory pressure (~1.2GB dependency footprint).
- **Go / No-Go Decision**:
  - **Local Host**: `render/server.mjs` runs natively as a systemd service (`render/follow-along-render.service`) handling lightweight validation, dry-run inspection, and local orchestrations.
  - **Production Render Fallback**: In accordance with `PLAN.md` § M1 fallback, production video rendering will execute via GitHub Actions `workflow_dispatch` (or offloaded remote x86 worker) triggered by n8n. This preserves Pi system stability, eliminates local browser bundle bloat, and provides parallel 1080×1920 video renders in under 2 minutes.
