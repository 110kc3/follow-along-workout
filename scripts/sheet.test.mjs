import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sheetSchema, canTransition, validateRow } from './sheet-validator.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('Google Sheet schema defines Workouts and Metrics tabs', () => {
  assert.ok(sheetSchema.tabs.Workouts);
  assert.ok(sheetSchema.tabs.Metrics);
  assert.equal(sheetSchema.tabs.Workouts.columns.length, 11);
  const colNames = sheetSchema.tabs.Workouts.columns.map((c) => c.name);
  assert.deepEqual(colNames, [
    'Status',
    'Template',
    'Title',
    'ScheduledDate',
    'Payload',
    'CreatedAt',
    'RenderOutputPath',
    'RenderedAt',
    'YouTubeVideoId',
    'YouTubeUrl',
    'PostedAt'
  ]);
});

test('Status lifecycle covers full state machine from idea to posted and failure', () => {
  const lifecycle = sheetSchema.statusLifecycle;
  assert.equal(lifecycle.initial, 'idea');

  // Valid forward path
  assert.ok(canTransition('idea', 'scripted'));
  assert.ok(canTransition('scripted', 'rendered'));
  assert.ok(canTransition('rendered', 'approved'));
  assert.ok(canTransition('approved', 'posted'));

  // Alternative paths (rejection / failure)
  assert.ok(canTransition('rendered', 'rejected'));
  assert.ok(canTransition('rejected', 'scripted'));
  assert.ok(canTransition('scripted', 'failed'));
  assert.ok(canTransition('failed', 'scripted'));

  // Invalid transitions
  assert.equal(canTransition('idea', 'posted'), false);
  assert.equal(canTransition('posted', 'idea'), false);
  assert.equal(canTransition('rendered', 'posted'), false); // must be approved first
});

test('Workouts CSV template exists and has matching headers', () => {
  const csvPath = path.join(rootDir, 'schema', 'workouts-template.csv');
  assert.ok(fs.existsSync(csvPath));
  const content = fs.readFileSync(csvPath, 'utf8').trim();
  const lines = content.split('\n');
  const headers = lines[0].split(',');
  const schemaHeaders = sheetSchema.tabs.Workouts.columns.map((c) => c.name);
  assert.deepEqual(headers, schemaHeaders);
});

test('Row validation detects invalid status or invalid payload JSON', () => {
  const validRow = {
    Status: 'scripted',
    Template: 'quick-burn',
    Title: 'Morning Core Burn',
    ScheduledDate: '2026-11-05',
    Payload: '{"title":"Morning Core Burn","exercises":[]}'
  };
  const res1 = validateRow(validRow);
  assert.equal(res1.valid, true);

  const invalidStatus = { ...validRow, Status: 'unknown_status' };
  const res2 = validateRow(invalidStatus);
  assert.equal(res2.valid, false);
  assert.ok(res2.errors.some((e) => e.includes('Invalid Status')));

  const invalidJson = { ...validRow, Payload: 'not json' };
  const res3 = validateRow(invalidJson);
  assert.equal(res3.valid, false);
  assert.ok(res3.errors.some((e) => e.includes('Payload is not valid JSON')));
});
