import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function loadJson(relPath) {
  const fullPath = path.join(rootDir, relPath);
  try {
    const raw = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`❌ Failed reading JSON from ${relPath}: ${err.message}`);
    process.exit(1);
  }
}

console.log('--- Validating follow-along-workout schemas and fixtures ---');

// 1. Validate exercises list
const exercises = loadJson('schema/exercises.json');
if (!Array.isArray(exercises) || exercises.length === 0) {
  console.error('❌ exercises.json must be a non-empty array');
  process.exit(1);
}
console.log(`✓ Loaded ${exercises.length} allowlisted exercises from schema/exercises.json`);

const exerciseNames = new Set(exercises.map(e => e.name));
for (const ex of exercises) {
  if (!ex.id || !ex.name || !ex.category || !ex.impact_level || !ex.position) {
    console.error(`❌ Exercise missing required fields: ${JSON.stringify(ex)}`);
    process.exit(1);
  }
}

// 2. Validate workout schema
const schema = loadJson('schema/workout.schema.json');
if (!schema.$schema || !schema.properties || !schema.required) {
  console.error('❌ workout.schema.json is not a valid schema definition');
  process.exit(1);
}
console.log('✓ Validated schema/workout.schema.json');

// 3. Validate fixtures
const fixturesDir = path.join(rootDir, 'render', 'fixtures');
const fixtureFiles = fs.readdirSync(fixturesDir).filter(f => f.endsWith('.json'));

if (fixtureFiles.length === 0) {
  console.error('❌ No fixtures found in render/fixtures');
  process.exit(1);
}

const validTemplates = new Set(['quick-burn', 'emom', 'mobility-reset']);
const validStatuses = new Set(['idea', 'scripted', 'rendered', 'approved', 'posted', 'failed']);

for (const file of fixtureFiles) {
  const relPath = path.join('render', 'fixtures', file);
  const data = loadJson(relPath);

  // Check required fields
  for (const field of schema.required) {
    if (data[field] === undefined) {
      console.error(`❌ Fixture ${file} is missing required field "${field}"`);
      process.exit(1);
    }
  }

  // Validate template
  if (!validTemplates.has(data.template)) {
    console.error(`❌ Fixture ${file} has invalid template: ${data.template}`);
    process.exit(1);
  }

  // Validate status
  if (!validStatuses.has(data.status)) {
    console.error(`❌ Fixture ${file} has invalid status: ${data.status}`);
    process.exit(1);
  }

  // Validate exercises
  if (!Array.isArray(data.exercises) || data.exercises.length === 0) {
    console.error(`❌ Fixture ${file} has no exercises`);
    process.exit(1);
  }

  for (const ex of data.exercises) {
    if (!ex.name || typeof ex.seconds !== 'number' || ex.seconds <= 0) {
      console.error(`❌ Fixture ${file} invalid exercise spec: ${JSON.stringify(ex)}`);
      process.exit(1);
    }
    if (!exerciseNames.has(ex.name)) {
      console.warn(`⚠️ Warning: Exercise "${ex.name}" in ${file} not found in exercises.json allowlist`);
    }
  }

  // Validate hashtags
  if (!Array.isArray(data.hashtags) || data.hashtags.length === 0) {
    console.error(`❌ Fixture ${file} must have hashtags array`);
    process.exit(1);
  }
  for (const tag of data.hashtags) {
    if (!tag.startsWith('#')) {
      console.error(`❌ Fixture ${file} invalid hashtag format: ${tag}`);
      process.exit(1);
    }
  }

  console.log(`✓ Fixture ${file} passed schema validation (${data.exercises.length} exercises, template: ${data.template})`);
}

console.log('✅ All schemas and fixtures successfully validated!');
