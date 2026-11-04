import test from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  resolveFixturePath,
  templateToCompositionId,
  buildRenderPlan,
  runCli,
} from './render-cli.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('resolveFixturePath resolves various valid formats', () => {
  const p1 = resolveFixturePath('fixtures/quick-burn.json');
  assert.ok(p1.endsWith('quick-burn.json'));

  const p2 = resolveFixturePath('render/fixtures/emom.json');
  assert.ok(p2.endsWith('emom.json'));

  const p3 = resolveFixturePath('mobility-reset');
  assert.ok(p3.endsWith('mobility-reset.json'));
});

test('resolveFixturePath throws on missing fixture', () => {
  assert.throws(() => {
    resolveFixturePath('nonexistent-workout-12345');
  }, /Fixture not found/);
});

test('templateToCompositionId maps templates accurately', () => {
  assert.strictEqual(templateToCompositionId('quick-burn'), 'QuickBurn');
  assert.strictEqual(templateToCompositionId('emom'), 'EMOM');
  assert.strictEqual(templateToCompositionId('mobility-reset'), 'MobilityReset');
  assert.strictEqual(templateToCompositionId('unknown'), 'QuickBurn');
});

test('buildRenderPlan constructs expected render parameters', () => {
  const fixture = path.join(rootDir, 'render', 'fixtures', 'quick-burn.json');
  const plan = buildRenderPlan(fixture, { out: '/tmp/test-out.mp4' });

  assert.strictEqual(plan.template, 'quick-burn');
  assert.strictEqual(plan.compositionId, 'QuickBurn');
  assert.strictEqual(plan.outputPath, '/tmp/test-out.mp4');
  assert.strictEqual(plan.fps, 30);
  assert.strictEqual(plan.durationInFrames, 1800); // 60s * 30fps
  assert.strictEqual(plan.props.title, '5-Minute Daily Core Ignition');
});

test('runCli --dry-run parses arguments and plans render without spawning', () => {
  const result = runCli(['fixtures/emom.json', '--dry-run', '--out', '/tmp/emom-out.mp4']);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.dryRun, true);
  assert.strictEqual(result.plan.compositionId, 'EMOM');
  assert.strictEqual(result.plan.outputPath, '/tmp/emom-out.mp4');
});

test('runCli missing argument returns failure', () => {
  const result = runCli([]);
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error, 'Missing fixture argument');
});
