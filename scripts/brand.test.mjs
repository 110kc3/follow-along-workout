import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const brandPath = join(__dirname, '../render/src/brand.ts');

test('brand.ts exists and defines video specs', () => {
  const content = readFileSync(brandPath, 'utf-8');
  assert.ok(content.includes('VIDEO_SPEC'));
  assert.ok(content.includes('width: 1080'));
  assert.ok(content.includes('height: 1920'));
  assert.ok(content.includes('fps: 30'));
});

test('brand.ts defines safe areas for Shorts/Reels/TikTok overlays', () => {
  const content = readFileSync(brandPath, 'utf-8');
  assert.ok(content.includes('SAFE_AREA'));
  assert.ok(content.includes('top: 140'));
  assert.ok(content.includes('bottom: 340'));
});

test('brand.ts defines color palette tokens', () => {
  const content = readFileSync(brandPath, 'utf-8');
  assert.ok(content.includes('BRAND_COLORS'));
  assert.ok(content.includes('primary:'));
  assert.ok(content.includes('background:'));
  assert.ok(content.includes('timerActive:'));
});
