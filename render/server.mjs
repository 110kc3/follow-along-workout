#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { templateToCompositionId } from '../scripts/render-cli.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const DEFAULT_PORT = parseInt(process.env.PORT || '3800', 10);

/**
 * Calculate total duration in seconds from exercises and rest.
 */
export function calculateDuration(payload) {
  if (payload.total_duration_seconds) {
    return payload.total_duration_seconds;
  }
  const exercises = payload.exercises || payload.segments || [];
  const rest = typeof payload.rest === 'number' ? payload.rest : 0;
  const total = exercises.reduce((acc, ex) => acc + (ex.seconds || 30) + rest, 0);
  return total > 0 ? total : 60;
}

/**
 * Validate required workout payload shape.
 */
export function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }
  const required = ['title', 'template'];
  for (const field of required) {
    if (payload[field] === undefined || payload[field] === null) {
      return { valid: false, error: `Missing required field: "${field}"` };
    }
  }
  const items = payload.exercises || payload.segments;
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, error: 'Payload must contain a non-empty "exercises" or "segments" array' };
  }
  return { valid: true };
}

/**
 * Creates and starts the HTTP render server.
 */
export function createServer(options = {}) {
  const outDir = options.outDir || path.resolve(rootDir, 'out');
  fs.mkdirSync(outDir, { recursive: true });

  const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const isDryRunParam = parsedUrl.searchParams.get('dryRun') === 'true';

    // Helper to send JSON responses
    const sendJson = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data, null, 2));
    };

    if (req.method === 'GET' && (pathname === '/health' || pathname === '/')) {
      return sendJson(200, {
        ok: true,
        service: 'follow-along-render',
        version: '0.1.0',
        uptimeSeconds: process.uptime(),
      });
    }

    if (req.method === 'POST' && pathname === '/render') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
        if (body.length > 5 * 1024 * 1024) {
          // 5MB guard
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Payload too large' }));
          req.destroy();
        }
      });

      req.on('end', async () => {
        let payload;
        try {
          payload = JSON.parse(body);
        } catch (err) {
          return sendJson(400, { ok: false, error: 'Invalid JSON body' });
        }

        // Support wrapping in { payload: ... }
        const actualPayload = payload.payload || payload;
        const validation = validatePayload(actualPayload);
        if (!validation.valid) {
          return sendJson(422, { ok: false, error: validation.error });
        }

        const template = actualPayload.template || 'quick-burn';
        const compositionId = templateToCompositionId(template);
        const slug = actualPayload.slug || actualPayload.id || `workout-${Date.now()}`;
        const fps = 30;
        const totalSeconds = calculateDuration(actualPayload);
        const durationInFrames = totalSeconds * fps;
        const outputPath = path.join(outDir, `${slug}.mp4`);
        const dryRun = isDryRunParam || payload.dryRun === true;

        if (dryRun) {
          return sendJson(200, {
            ok: true,
            dryRun: true,
            slug,
            template,
            compositionId,
            outputPath,
            totalSeconds,
            durationInFrames,
            fps,
          });
        }

        // Render execution using remotion CLI or npx
        const tempFixture = path.join(outDir, `temp-${slug}.json`);
        fs.writeFileSync(tempFixture, JSON.stringify(actualPayload, null, 2), 'utf8');

        const remotionBin = path.resolve(rootDir, 'render', 'node_modules', '.bin', 'remotion');
        const entryPoint = path.resolve(rootDir, 'render', 'src', 'index.ts');

        const cmd = fs.existsSync(remotionBin) ? remotionBin : 'npx';
        const args = fs.existsSync(remotionBin)
          ? ['render', entryPoint, compositionId, outputPath, `--props=${tempFixture}`, '--gl=angle']
          : ['remotion', 'render', entryPoint, compositionId, outputPath, `--props=${tempFixture}`, '--gl=angle'];

        const child = spawn(cmd, args, {
          cwd: rootDir,
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        let stderr = '';
        child.stderr?.on('data', (d) => {
          stderr += d.toString();
        });

        child.on('close', (code) => {
          // Cleanup temp file
          try {
            if (fs.existsSync(tempFixture)) fs.unlinkSync(tempFixture);
          } catch (_) {}

          if (code === 0) {
            return sendJson(200, {
              ok: true,
              slug,
              template,
              compositionId,
              outputPath,
              totalSeconds,
              durationInFrames,
              rendered: true,
            });
          } else {
            return sendJson(500, {
              ok: false,
              error: `Render failed with exit code ${code}`,
              details: stderr.slice(-1000),
            });
          }
        });
      });
      return;
    }

    sendJson(404, { ok: false, error: `Route not found: ${req.method} ${pathname}` });
  });

  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const port = DEFAULT_PORT;
  const server = createServer();
  server.listen(port, '0.0.0.0', () => {
    console.log(`[FollowAlongRender] Server listening on http://0.0.0.0:${port}`);
  });

  const shutdown = () => {
    console.log('[FollowAlongRender] Shutting down...');
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
