import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT_DIR = resolve(import.meta.dirname, '..');
const N8N_DIR = join(ROOT_DIR, 'n8n');

test('n8n exported workflows exist and are valid JSON', () => {
  const generatorPath = join(N8N_DIR, 'workout-generator-workflow.json');
  const renderPath = join(N8N_DIR, 'render-approval-workflow.json');

  assert.ok(existsSync(generatorPath), 'workout-generator-workflow.json must exist');
  assert.ok(existsSync(renderPath), 'render-approval-workflow.json must exist');

  const generator = JSON.parse(readFileSync(generatorPath, 'utf8'));
  const render = JSON.parse(readFileSync(renderPath, 'utf8'));

  assert.ok(generator.name && Array.isArray(generator.nodes));
  assert.ok(render.name && Array.isArray(render.nodes));
});

test('workout-generator-workflow contains required pipeline nodes', () => {
  const content = JSON.parse(readFileSync(join(N8N_DIR, 'workout-generator-workflow.json'), 'utf8'));
  const nodeNames = content.nodes.map((n) => n.name);
  const nodeTypes = content.nodes.map((n) => n.type);

  assert.ok(nodeTypes.includes('n8n-nodes-base.scheduleTrigger'), 'Must have a schedule trigger');
  assert.ok(nodeTypes.includes('n8n-nodes-base.httpRequest'), 'Must have an HTTP request to LiteLLM');
  assert.ok(nodeTypes.includes('n8n-nodes-base.code'), 'Must have a code validation node');
  assert.ok(nodeTypes.includes('n8n-nodes-base.googleSheets'), 'Must have a Google Sheets append node');

  // Verify LiteLLM node targets completions API
  const llmNode = content.nodes.find((n) => n.id === 'http-litellm-generate');
  assert.ok(llmNode, 'Must contain http-litellm-generate node');
  assert.match(llmNode.parameters.url, /\/chat\/completions/);

  // Verify node connections are intact and resolve to valid nodes
  const connectionSources = Object.keys(content.connections);
  for (const src of connectionSources) {
    assert.ok(nodeNames.includes(src), `Connection source ${src} must be a known node name`);
    const targets = content.connections[src].main.flat().map((t) => t.node);
    for (const tgt of targets) {
      assert.ok(nodeNames.includes(tgt), `Connection target ${tgt} must be a known node name`);
    }
  }
});

test('render-approval-workflow contains required render and approval nodes', () => {
  const content = JSON.parse(readFileSync(join(N8N_DIR, 'render-approval-workflow.json'), 'utf8'));
  const nodeNames = content.nodes.map((n) => n.name);
  const nodeTypes = content.nodes.map((n) => n.type);

  assert.ok(nodeTypes.includes('n8n-nodes-base.scheduleTrigger'), 'Must have a polling schedule trigger');
  assert.ok(nodeTypes.includes('n8n-nodes-base.googleSheets'), 'Must have Google Sheets nodes');
  assert.ok(nodeTypes.includes('n8n-nodes-base.httpRequest'), 'Must have HTTP request to /render');
  assert.ok(nodeTypes.includes('n8n-nodes-base.telegram'), 'Must have Telegram node');

  // Verify Render service call
  const renderNode = content.nodes.find((n) => n.id === 'http-render-service');
  assert.ok(renderNode, 'Must contain http-render-service node');
  assert.match(renderNode.parameters.url, /\/render/);

  // Verify Telegram preview contains inline approval buttons
  const tgNode = content.nodes.find((n) => n.id === 'telegram-send-preview');
  assert.ok(tgNode, 'Must contain telegram-send-preview node');
  assert.equal(tgNode.parameters.replyMarkup, 'inlineKeyboard');

  // Verify connections
  const connectionSources = Object.keys(content.connections);
  for (const src of connectionSources) {
    assert.ok(nodeNames.includes(src), `Connection source ${src} must be a known node name`);
    const targets = content.connections[src].main.flat().map((t) => t.node);
    for (const tgt of targets) {
      assert.ok(nodeNames.includes(tgt), `Connection target ${tgt} must be a known node name`);
    }
  }
});
