import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('prompt templates existence and contents', () => {
  const composerPath = path.resolve(rootDir, 'prompts', 'workout-composer.md');
  const captionPath = path.resolve(rootDir, 'prompts', 'caption-generator.md');

  assert.equal(fs.existsSync(composerPath), true, 'workout-composer.md should exist');
  assert.equal(fs.existsSync(captionPath), true, 'caption-generator.md should exist');

  const composerText = fs.readFileSync(composerPath, 'utf8');
  assert.match(composerText, /quick-burn/);
  assert.match(composerText, /emom/);
  assert.match(composerText, /mobility-reset/);
  assert.match(composerText, /Safety & Sequencing Rules/);
  assert.match(composerText, /Allowlisted Exercises/);

  const captionText = fs.readFileSync(captionPath, 'utf8');
  assert.match(captionText, /hashtags/);
  assert.match(captionText, /hook/);
  assert.match(captionText, /cta/);
});

test('composer prompt allowlist contains canonical exercises', () => {
  const exercisesRaw = JSON.parse(
    fs.readFileSync(path.resolve(rootDir, 'schema', 'exercises.json'), 'utf8')
  );
  const composerText = fs.readFileSync(path.resolve(rootDir, 'prompts', 'workout-composer.md'), 'utf8');

  // Verify that key exercises from the taxonomy are enumerated in the prompt
  const samples = ['Bodyweight Squat', 'Forearm Plank', 'Jumping Jacks', 'Bird Dog', 'Burpee (No Push-up)'];
  for (const name of samples) {
    assert.ok(composerText.includes(name), `Composer prompt should mention allowlisted exercise: ${name}`);
  }
});

test('composer few-shot JSON fixture validates against exercises allowlist', () => {
  const composerText = fs.readFileSync(path.resolve(rootDir, 'prompts', 'workout-composer.md'), 'utf8');
  const match = composerText.match(/```json([\s\S]*?)```/);
  assert.ok(match, 'Prompt must contain a JSON example block');

  const payload = JSON.parse(match[1].trim());
  assert.equal(payload.template, 'quick-burn');
  assert.ok(Array.isArray(payload.exercises));
  assert.ok(payload.exercises.length > 0);

  const exercisesTaxonomy = JSON.parse(
    fs.readFileSync(path.resolve(rootDir, 'schema', 'exercises.json'), 'utf8')
  );
  const allowedNames = new Set(exercisesTaxonomy.map((e) => e.name));

  for (const ex of payload.exercises) {
    assert.ok(allowedNames.has(ex.name), `Exercise "${ex.name}" in few-shot sample must be allowlisted`);
  }
});
