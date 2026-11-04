import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSETS_DIR = path.join(ROOT, "render/assets");
const MANIFEST_PATH = path.join(ASSETS_DIR, "audio-manifest.json");

test("render/assets exists and contains audio-manifest.json", () => {
  assert.ok(fs.existsSync(ASSETS_DIR), "render/assets must exist");
  assert.ok(fs.existsSync(MANIFEST_PATH), "audio-manifest.json must exist");
});

test("audio-manifest.json is valid and covers all fixture music_ids", () => {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
  assert.ok(Array.isArray(manifest.tracks), "tracks must be an array");
  assert.ok(manifest.tracks.length >= 3, "must have at least 3 curated tracks");

  const expectedIds = [
    "yt_audio_upbeat_funk_01",
    "yt_audio_trap_energy_02",
    "yt_audio_chill_ambient_03",
  ];

  for (const expectedId of expectedIds) {
    const track = manifest.tracks.find((t) => t.id === expectedId);
    assert.ok(track, `Manifest must include track ${expectedId}`);
    assert.ok(track.filename.endsWith(".mp3"), `Track ${expectedId} filename must end with .mp3`);
    assert.ok(track.durationSeconds >= 30, `Track ${expectedId} duration must be >= 30s`);
    assert.ok(track.recommendedVolume > 0 && track.recommendedVolume <= 1.0, `Volume must be valid`);

    // Verify physical MP3 file exists on disk and is non-empty
    const audioFilePath = path.join(ASSETS_DIR, track.filename);
    assert.ok(fs.existsSync(audioFilePath), `Audio file ${track.filename} must exist`);
    const stat = fs.statSync(audioFilePath);
    assert.ok(stat.size > 100_000, `Audio file ${track.filename} must be substantial (>100KB), got ${stat.size} bytes`);
  }
});

test("audio resolver handles direct match, template fallback, and default fallback", async () => {
  const { loadAudioManifest, resolveAudioTrack, DEFAULT_TRACK_ID } = await import(
    path.join(ROOT, "render/src/audio.ts")
  );

  const manifest = loadAudioManifest(ASSETS_DIR);
  assert.equal(manifest.tracks.length, 3);

  // Direct match
  const matched = resolveAudioTrack("yt_audio_trap_energy_02", undefined, ASSETS_DIR);
  assert.equal(matched.track.id, "yt_audio_trap_energy_02");
  assert.equal(matched.isFallback, false);
  assert.ok(fs.existsSync(matched.assetPath));

  // Template fallback for unknown id
  const templateFallback = resolveAudioTrack("unknown_id", "mobility-reset", ASSETS_DIR);
  assert.equal(templateFallback.track.id, "yt_audio_chill_ambient_03");
  assert.equal(templateFallback.isFallback, true);

  // Ultimate fallback
  const defaultFallback = resolveAudioTrack(undefined, undefined, ASSETS_DIR);
  assert.equal(defaultFallback.track.id, DEFAULT_TRACK_ID);
  assert.equal(defaultFallback.isFallback, true);
});
