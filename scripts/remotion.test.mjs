import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

test('render/package.json exists and defines remotion dependencies', () => {
  const pkgPath = path.join(ROOT, 'render', 'package.json');
  assert.ok(fs.existsSync(pkgPath), 'render/package.json must exist');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  assert.ok(pkg.dependencies.remotion, 'Must declare remotion dependency');
  assert.ok(pkg.dependencies.react, 'Must declare react dependency');
});

test('render/tsconfig.json exists and configures React JSX', () => {
  const tsconfigPath = path.join(ROOT, 'render', 'tsconfig.json');
  assert.ok(fs.existsSync(tsconfigPath), 'render/tsconfig.json must exist');
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  assert.equal(tsconfig.compilerOptions.jsx, 'react-jsx');
  assert.equal(tsconfig.compilerOptions.target, 'ES2022');
});

test('render/src entrypoint and Root composition exist', () => {
  const indexPath = path.join(ROOT, 'render', 'src', 'index.ts');
  const rootPath = path.join(ROOT, 'render', 'src', 'Root.tsx');
  const quickBurnPath = path.join(ROOT, 'render', 'src', 'compositions', 'QuickBurn.tsx');

  assert.ok(fs.existsSync(indexPath), 'render/src/index.ts must exist');
  assert.ok(fs.existsSync(rootPath), 'render/src/Root.tsx must exist');
  assert.ok(fs.existsSync(quickBurnPath), 'render/src/compositions/QuickBurn.tsx must exist');

  const rootContent = fs.readFileSync(rootPath, 'utf8');
  assert.ok(rootContent.includes('id="QuickBurn"'), 'Root must register QuickBurn composition');
  assert.ok(rootContent.includes('VIDEO_SPEC.width'), 'Root must use VIDEO_SPEC width');
  assert.ok(rootContent.includes('VIDEO_SPEC.height'), 'Root must use VIDEO_SPEC height');
});
