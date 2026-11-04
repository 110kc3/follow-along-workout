import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, validatePayload } from '../render/server.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function makeRequest(port, method, pathStr, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port,
      path: pathStr,
      method,
      headers: {},
    };

    let postData = null;
    if (body !== null) {
      postData = typeof body === 'string' ? body : JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

test('validatePayload checks', () => {
  assert.equal(validatePayload(null).valid, false);
  assert.equal(validatePayload({}).valid, false);
  assert.equal(validatePayload({ title: 'T', template: 'quick-burn' }).valid, false);
  assert.equal(
    validatePayload({
      title: 'T',
      template: 'quick-burn',
      total_duration_seconds: 60,
      segments: [],
    }).valid,
    false
  );
  assert.equal(
    validatePayload({
      title: 'T',
      template: 'quick-burn',
      total_duration_seconds: 60,
      segments: [{ type: 'work', duration_seconds: 30, exercise_name: 'Jumping Jacks' }],
    }).valid,
    true
  );
});

test('render/server.mjs HTTP endpoints', async () => {
  const testOutDir = path.resolve(rootDir, 'out', 'test-server');
  fs.mkdirSync(testOutDir, { recursive: true });

  const server = createServer({ outDir: testOutDir });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  try {
    // 1. Health check
    const health = await makeRequest(port, 'GET', '/health');
    assert.equal(health.status, 200);
    assert.equal(health.body.ok, true);
    assert.equal(health.body.service, 'follow-along-render');

    // 2. Bad JSON
    const badJson = await makeRequest(port, 'POST', '/render', '{"not valid json');
    assert.equal(badJson.status, 400);
    assert.equal(badJson.body.ok, false);

    // 3. Unprocessable Entity
    const invalidPayload = await makeRequest(port, 'POST', '/render', { title: 'Missing segments' });
    assert.equal(invalidPayload.status, 422);
    assert.equal(invalidPayload.body.ok, false);

    // 4. Dry run with QuickBurn fixture
    const fixtureQuickBurn = JSON.parse(
      fs.readFileSync(path.resolve(rootDir, 'render', 'fixtures', 'quick-burn.json'), 'utf8')
    );
    const dryRunRes = await makeRequest(port, 'POST', '/render', {
      ...fixtureQuickBurn,
      dryRun: true,
    });
    assert.equal(dryRunRes.status, 200);
    assert.equal(dryRunRes.body.ok, true);
    assert.equal(dryRunRes.body.dryRun, true);
    assert.equal(dryRunRes.body.compositionId, 'QuickBurn');
    assert.equal(dryRunRes.body.durationInFrames, dryRunRes.body.totalSeconds * 30);

    // 5. Dry run with EMOM fixture
    const fixtureEmom = JSON.parse(
      fs.readFileSync(path.resolve(rootDir, 'render', 'fixtures', 'emom.json'), 'utf8')
    );
    const dryRunEmom = await makeRequest(port, 'POST', '/render?dryRun=true', fixtureEmom);
    assert.equal(dryRunEmom.status, 200);
    assert.equal(dryRunEmom.body.ok, true);
    assert.equal(dryRunEmom.body.dryRun, true);
    assert.equal(dryRunEmom.body.compositionId, 'EMOM');

    // 6. Unknown route
    const notFound = await makeRequest(port, 'GET', '/unknown-route');
    assert.equal(notFound.status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    try {
      fs.rmSync(testOutDir, { recursive: true, force: true });
    } catch (_) {}
  }
});
