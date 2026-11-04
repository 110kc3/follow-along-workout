/**
 * Brand kit definition for automated vertical workout videos (1080x1920).
 * Holds visual tokens, palette, typography, and layout safe areas for short-form video UI.
 */

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  timerActive: string;
  timerRest: string;
}

export interface VideoDimensions {
  width: number;
  height: number;
  fps: number;
}

export interface SafeArea {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export const VIDEO_SPEC: VideoDimensions = {
  width: 1080,
  height: 1920,
  fps: 30,
};

// Safe areas accounting for TikTok / Instagram Reels / YouTube Shorts UI overlays
export const SAFE_AREA: SafeArea = {
  top: 140, // Avoid channel name / search header
  bottom: 340, // Avoid bottom caption, audio marquee, and action icons
  left: 64,
  right: 140, // Avoid right-side like/comment/share rail
};

export const BRAND_COLORS: ColorPalette = {
  primary: '#FF4757', // High-energy coral red
  secondary: '#2ED573', // Fresh rest/recovery green
  accent: '#FFA502', // Warning / preparation amber
  background: '#0F111A', // Deep obsidian dark mode
  surface: '#1E2230', // Elevated card surface
  text: '#FFFFFF', // Crisp white foreground
  textMuted: '#A4B0BE', // Neutral muted labels
  timerActive: '#FF4757',
  timerRest: '#2ED573',
};

export const TYPOGRAPHY = {
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  titleSize: 64,
  hookSize: 48,
  timerSize: 128,
  cueSize: 36,
  captionSize: 28,
};

export const ANIMATION_TIMINGS = {
  cardFadeInFrames: 15,
  exerciseTransitionFrames: 10,
  countdownPulseInterval: 1.0, // seconds
};

// Aliases for composition convenience
export const COLORS = BRAND_COLORS;
export const SAFE_AREAS = SAFE_AREA;
