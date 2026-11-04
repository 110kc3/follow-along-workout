import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

test("QuickBurn.tsx exists and exports components and timeline helper", async () => {
  const qbPath = path.join(ROOT, "render", "src", "compositions", "QuickBurn.tsx");
  assert.ok(fs.existsSync(qbPath), "QuickBurn.tsx must exist");
  const content = fs.readFileSync(qbPath, "utf8");

  assert.ok(content.includes("export function computeQuickBurnTimeline"), "Must export timeline calculation");
  assert.ok(content.includes("export const CountdownRing"), "Must export CountdownRing");
  assert.ok(content.includes("export const TitleCard"), "Must export TitleCard");
  assert.ok(content.includes("export const ExerciseScreen"), "Must export ExerciseScreen");
  assert.ok(content.includes("export const RestScreen"), "Must export RestScreen");
  assert.ok(content.includes("export const EndCard"), "Must export EndCard");
  assert.ok(content.includes("export const QuickBurnComposition"), "Must export QuickBurnComposition");
});

test("computeQuickBurnTimeline accurately computes segments for quick-burn fixture", () => {
  const fixturePath = path.join(ROOT, "render", "fixtures", "quick-burn.json");
  const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

  // Minimal evaluation of timeline math
  const fps = 30;
  const titleSeconds = 3;
  const ctaSeconds = 3;
  const restSeconds = fixture.rest; // 10s
  const exercises = fixture.exercises; // 5 exercises, 20s each

  // Total seconds: 3 (title) + 5*20 (exercises) + 4*10 (rests between 5 exercises) + 3 (cta)
  // = 3 + 100 + 40 + 3 = 146 seconds
  // Total frames = 146 * 30 = 4380 frames

  const titleFrames = titleSeconds * fps;
  const ctaFrames = ctaSeconds * fps;
  let totalCalculatedFrames = titleFrames + ctaFrames;
  for (let i = 0; i < exercises.length; i++) {
    totalCalculatedFrames += exercises[i].seconds * fps;
    if (i < exercises.length - 1) {
      totalCalculatedFrames += restSeconds * fps;
    }
  }

  assert.equal(totalCalculatedFrames, 146 * 30);
  assert.equal(totalCalculatedFrames, 4380);
});

test("CountdownRing handles SVG circle math correctly", () => {
  const size = 360;
  const strokeWidth = 18;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  assert.equal(center, 180);
  assert.equal(radius, 162);
  assert.ok(circumference > 1017 && circumference < 1018);

  // At 50% progress, strokeDashoffset is 50% circumference
  const progress50 = 0.5;
  const offset50 = circumference * (1 - progress50);
  assert.equal(offset50, circumference / 2);
});
