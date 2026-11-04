import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveFixturePath, buildRenderPlan } from './render-cli.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('Timeline planning benchmarks across all 3 templates', () => {
  const fixtures = ['quick-burn.json', 'emom.json', 'mobility-reset.json'];

  for (const fixtureName of fixtures) {
    const fixturePath = resolveFixturePath(fixtureName, rootDir);
    const start = performance.now();
    const plan = buildRenderPlan(fixturePath);
    const elapsed = performance.now() - start;

    assert.ok(plan.durationInFrames >= 900, `Duration frames must be >= 900, got ${plan.durationInFrames}`);
    assert.ok(plan.totalSeconds > 0, `Total seconds must be > 0`);
    assert.ok(elapsed < 20, `Planning elapsed time must be fast (<20ms), took ${elapsed.toFixed(3)}ms`);
    assert.ok(['QuickBurn', 'EMOM', 'MobilityReset'].includes(plan.compositionId));
  }
});
