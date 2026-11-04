#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Resolves a fixture file path from various user inputs:
 * e.g. "fixtures/quick-burn.json", "render/fixtures/quick-burn.json", "quick-burn", "emom.json"
 */
export function resolveFixturePath(inputPath, baseDir = rootDir) {
  if (!inputPath) {
    throw new Error('No fixture path provided.');
  }

  const cleanInput = inputPath.replace(/^--fixtures=/, '').replace(/^fixtures\//, '');
  const candidates = [
    path.resolve(baseDir, inputPath),
    path.resolve(baseDir, 'render', inputPath),
    path.resolve(baseDir, 'render', 'fixtures', inputPath),
    path.resolve(baseDir, 'render', 'fixtures', cleanInput),
  ];

  if (!inputPath.endsWith('.json')) {
    candidates.push(
      path.resolve(baseDir, `${inputPath}.json`),
      path.resolve(baseDir, 'render', 'fixtures', `${inputPath}.json`),
      path.resolve(baseDir, 'render', 'fixtures', `${cleanInput}.json`)
    );
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  throw new Error(`Fixture not found: "${inputPath}". Looked in render/fixtures/`);
}

/**
 * Maps template name to Remotion Composition ID.
 */
export function templateToCompositionId(templateName) {
  const map = {
    'quick-burn': 'QuickBurn',
    'emom': 'EMOM',
    'mobility-reset': 'MobilityReset',
  };
  return map[templateName] || 'QuickBurn';
}

/**
 * Builds CLI render command arguments.
 */
export function buildRenderPlan(fixturePath, options = {}) {
  const raw = fs.readFileSync(fixturePath, 'utf8');
  const payload = JSON.parse(raw);

  const template = payload.template || 'quick-burn';
  const compositionId = options.composition || templateToCompositionId(template);
  const outDir = options.outDir || path.resolve(rootDir, 'out');
  const slug = payload.slug || path.basename(fixturePath, '.json');
  const outputPath = options.out || path.join(outDir, `${slug}.mp4`);
  const entryPoint = options.entry || path.resolve(rootDir, 'render', 'src', 'index.ts');

  const fps = 30;
  const totalSeconds = payload.total_duration_seconds || 60;
  const durationInFrames = totalSeconds * fps;

  return {
    fixturePath,
    slug,
    template,
    compositionId,
    entryPoint,
    outputPath,
    durationInFrames,
    totalSeconds,
    fps,
    props: payload,
  };
}

/**
 * Main CLI execution runner.
 */
export function runCli(argv = process.argv.slice(2)) {
  let fixtureArg = null;
  let isDryRun = false;
  let customOut = null;
  let customComp = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      isDryRun = true;
    } else if (arg === '--out' && i + 1 < argv.length) {
      customOut = argv[++i];
    } else if (arg === '--composition' && i + 1 < argv.length) {
      customComp = argv[++i];
    } else if (!arg.startsWith('--') && !fixtureArg) {
      fixtureArg = arg;
    }
  }

  if (!fixtureArg) {
    console.error('Usage: npm run render -- <fixture-file-or-name> [--out <path.mp4>] [--dry-run]');
    console.error('Examples:');
    console.error('  npm run render -- fixtures/quick-burn.json');
    console.error('  npm run render -- emom --dry-run');
    return { success: false, error: 'Missing fixture argument' };
  }

  try {
    const fixturePath = resolveFixturePath(fixtureArg);
    const plan = buildRenderPlan(fixturePath, {
      out: customOut,
      composition: customComp,
    });

    console.log(`[RenderCLI] Loaded fixture: ${plan.fixturePath}`);
    console.log(`[RenderCLI] Composition: ${plan.compositionId}`);
    console.log(`[RenderCLI] Duration: ${plan.totalSeconds}s (${plan.durationInFrames} frames @ ${plan.fps} fps)`);
    console.log(`[RenderCLI] Output target: ${plan.outputPath}`);

    if (isDryRun) {
      console.log(`[RenderCLI] --dry-run active. Skipping invocation.`);
      return { success: true, plan, dryRun: true };
    }

    fs.mkdirSync(path.dirname(plan.outputPath), { recursive: true });

    const remotionArgs = [
      'remotion',
      'render',
      plan.entryPoint,
      plan.compositionId,
      plan.outputPath,
      `--props=${JSON.stringify(plan.props)}`,
      '--concurrency=2',
    ];

    console.log(`[RenderCLI] Executing: npx ${remotionArgs.join(' ')}`);
    const proc = spawnSync('npx', remotionArgs, {
      cwd: path.resolve(rootDir, 'render'),
      stdio: 'inherit',
    });

    if (proc.status !== 0) {
      console.error(`[RenderCLI] Remotion render exited with status ${proc.status}`);
      return { success: false, error: `Process failed with exit code ${proc.status}` };
    }

    console.log(`[RenderCLI] Render complete: ${plan.outputPath}`);
    return { success: true, plan };
  } catch (err) {
    console.error(`[RenderCLI] Error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// Auto-run if invoked directly
const isDirectCall = process.argv[1] && (
  process.argv[1].endsWith('render-cli.mjs') ||
  process.argv[1].endsWith('render')
);
if (isDirectCall) {
  const result = runCli();
  if (!result.success) {
    process.exit(1);
  }
}
