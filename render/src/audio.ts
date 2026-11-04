import path from "node:path";
import fs from "node:fs";

export interface AudioTrackMetadata {
  id: string;
  title: string;
  genre: string;
  source: string;
  bpm: number;
  durationSeconds: number;
  filename: string;
  compatibleTemplates: string[];
  recommendedVolume: number;
}

export interface AudioManifest {
  description: string;
  tracks: AudioTrackMetadata[];
}

export const DEFAULT_TRACK_ID = "yt_audio_upbeat_funk_01";

/**
 * Loads the audio manifest from render/assets/audio-manifest.json.
 */
export function loadAudioManifest(assetsDir?: string): AudioManifest {
  const dir = assetsDir || path.resolve(process.cwd(), "render/assets");
  const manifestPath = path.join(dir, "audio-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Audio manifest not found at: ${manifestPath}`);
  }
  const content = fs.readFileSync(manifestPath, "utf-8");
  return JSON.parse(content) as AudioManifest;
}

/**
 * Resolves an audio track by its music_id, falling back to a template-compatible
 * or default track if unknown.
 */
export function resolveAudioTrack(
  musicId?: string,
  template?: string,
  assetsDir?: string
): { track: AudioTrackMetadata; assetPath: string; isFallback: boolean } {
  const manifest = loadAudioManifest(assetsDir);
  const dir = assetsDir || path.resolve(process.cwd(), "render/assets");

  if (musicId) {
    const matched = manifest.tracks.find((t) => t.id === musicId);
    if (matched) {
      return {
        track: matched,
        assetPath: path.join(dir, matched.filename),
        isFallback: false,
      };
    }
  }

  // Fallback by template compatibility
  if (template) {
    const compatible = manifest.tracks.find((t) => t.compatibleTemplates.includes(template));
    if (compatible) {
      return {
        track: compatible,
        assetPath: path.join(dir, compatible.filename),
        isFallback: true,
      };
    }
  }

  // Ultimate fallback to default track
  const defaultTrack = manifest.tracks.find((t) => t.id === DEFAULT_TRACK_ID) || manifest.tracks[0];
  return {
    track: defaultTrack,
    assetPath: path.join(dir, defaultTrack.filename),
    isFallback: true,
  };
}
