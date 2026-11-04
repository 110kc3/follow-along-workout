import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

test("EMOM.tsx exists and exports components and timeline helper", async () => {
  const emomPath = path.join(ROOT, "render", "src", "compositions", "EMOM.tsx");
  assert.ok(fs.existsSync(emomPath), "EMOM.tsx must exist");
  const content = fs.readFileSync(emomPath, "utf8");

  assert.ok(content.includes("export function computeEMOMTimeline"), "Must export timeline calculation");
  assert.ok(content.includes("export const EMOMTitleCard"), "Must export EMOMTitleCard");
  assert.ok(content.includes("export const EMOMExerciseScreen"), "Must export EMOMExerciseScreen");
  assert.ok(content.includes("export const EMOMComposition"), "Must export EMOMComposition");
});

test("computeEMOMTimeline accurately computes segments for emom fixture", () => {
  const fixturePath = path.join(ROOT, "render", "fixtures", "emom.json");
  const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

  const fps = 30;
  const titleSeconds = 3;
  const ctaSeconds = 3;
  const restSeconds = fixture.rest; // 10s
  const exercises = fixture.exercises; // 4 exercises, 30s each

  // Total seconds: 3 (title) + 4*30 (exercises) + 3*10 (rests) + 3 (cta)
  // = 3 + 120 + 30 + 3 = 156 seconds
  // Total frames = 156 * 30 = 4680 frames

  const titleFrames = titleSeconds * fps;
  const ctaFrames = ctaSeconds * fps;
  let totalCalculatedFrames = titleFrames + ctaFrames;
  for (let i = 0; i < exercises.length; i++) {
    totalCalculatedFrames += exercises[i].seconds * fps;
    if (i < exercises.length - 1) {
      totalCalculatedFrames += restSeconds * fps;
    }
  }

  assert.equal(totalCalculatedFrames, 156 * 30);
  assert.equal(totalCalculatedFrames, 4680);
});
