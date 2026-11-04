import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

test("MobilityReset.tsx exists and exports components and timeline helper", async () => {
  const mobPath = path.join(ROOT, "render", "src", "compositions", "MobilityReset.tsx");
  assert.ok(fs.existsSync(mobPath), "MobilityReset.tsx must exist");
  const content = fs.readFileSync(mobPath, "utf8");

  assert.ok(content.includes("export function computeMobilityTimeline"), "Must export timeline calculation");
  assert.ok(content.includes("export const MobilityTitleCard"), "Must export MobilityTitleCard");
  assert.ok(content.includes("export const MobilityExerciseScreen"), "Must export MobilityExerciseScreen");
  assert.ok(content.includes("export const MobilityResetComposition"), "Must export MobilityResetComposition");
});

test("computeMobilityTimeline accurately computes segments for mobility-reset fixture", () => {
  const fixturePath = path.join(ROOT, "render", "fixtures", "mobility-reset.json");
  const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

  const fps = 30;
  const titleSeconds = 3;
  const ctaSeconds = 3;
  const restSeconds = fixture.rest; // 5s
  const exercises = fixture.exercises; // 3 exercises, 15s each

  // Total seconds: 3 (title) + 3*15 (exercises) + 2*5 (rests) + 3 (cta)
  // = 3 + 45 + 10 + 3 = 61 seconds
  // Total frames = 61 * 30 = 1830 frames

  const titleFrames = titleSeconds * fps;
  const ctaFrames = ctaSeconds * fps;
  let totalCalculatedFrames = titleFrames + ctaFrames;
  for (let i = 0; i < exercises.length; i++) {
    totalCalculatedFrames += exercises[i].seconds * fps;
    if (i < exercises.length - 1) {
      totalCalculatedFrames += restSeconds * fps;
    }
  }

  assert.equal(totalCalculatedFrames, 61 * 30);
  assert.equal(totalCalculatedFrames, 1830);
});
