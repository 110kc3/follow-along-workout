import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND_COLORS, COLORS, SAFE_AREAS, TYPOGRAPHY } from "../brand.js";

export interface QuickBurnExercise {
  name: string;
  seconds: number;
  cue?: string;
}

export interface QuickBurnProps {
  id?: string;
  title?: string;
  hook?: string;
  exercises?: QuickBurnExercise[];
  rest?: number;
  caption?: string;
  hashtags?: string[];
  cta?: string;
  music_id?: string;
  titleCardSeconds?: number;
  ctaCardSeconds?: number;
}

export interface TimelineSegment {
  type: "title" | "exercise" | "rest" | "cta";
  startFrame: number;
  durationInFrames: number;
  exerciseIndex?: number;
  exercise?: QuickBurnExercise;
  nextExerciseName?: string;
  totalExercises?: number;
}

export function computeQuickBurnTimeline(
  props: QuickBurnProps,
  fps: number = 30
): { segments: TimelineSegment[]; totalFrames: number } {
  const titleFrames = (props.titleCardSeconds ?? 3) * fps;
  const ctaFrames = (props.ctaCardSeconds ?? 3) * fps;
  const restSeconds = props.rest ?? 0;
  const exercises = props.exercises || [];

  const segments: TimelineSegment[] = [];
  let currentFrame = 0;

  // 1. Title Card
  segments.push({
    type: "title",
    startFrame: currentFrame,
    durationInFrames: titleFrames,
  });
  currentFrame += titleFrames;

  // 2. Per-Exercise Screens (+ optional Rest screens)
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    const exFrames = ex.seconds * fps;
    const nextEx = exercises[i + 1];

    segments.push({
      type: "exercise",
      startFrame: currentFrame,
      durationInFrames: exFrames,
      exerciseIndex: i,
      exercise: ex,
      nextExerciseName: nextEx?.name,
      totalExercises: exercises.length,
    });
    currentFrame += exFrames;

    // Rest screen between exercises (not after the final exercise)
    if (i < exercises.length - 1 && restSeconds > 0) {
      const restFrames = restSeconds * fps;
      segments.push({
        type: "rest",
        startFrame: currentFrame,
        durationInFrames: restFrames,
        exerciseIndex: i,
        nextExerciseName: nextEx?.name,
        totalExercises: exercises.length,
      });
      currentFrame += restFrames;
    }
  }

  // 3. CTA End Card
  segments.push({
    type: "cta",
    startFrame: currentFrame,
    durationInFrames: ctaFrames,
  });
  currentFrame += ctaFrames;

  return { segments, totalFrames: currentFrame };
}

export const CountdownRing: React.FC<{
  remainingSeconds: number;
  progress: number; // 0 to 1
  color: string;
  size?: number;
  strokeWidth?: number;
}> = ({ remainingSeconds, progress, color, size = 360, strokeWidth = 18 }) => {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track background */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={BRAND_COLORS.surface}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated countdown indicator */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          style={{ transition: "stroke-dashoffset 0.1s linear" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: TYPOGRAPHY.timerSize,
            fontWeight: 900,
            color: BRAND_COLORS.text,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {remainingSeconds}
        </span>
        <span
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: BRAND_COLORS.textMuted,
            letterSpacing: 2,
            marginTop: 4,
          }}
        >
          SEC
        </span>
      </div>
    </div>
  );
};

export const TitleCard: React.FC<{ title: string; hook: string }> = ({ title, hook }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND_COLORS.background,
        color: BRAND_COLORS.text,
        fontFamily: TYPOGRAPHY.fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: SAFE_AREAS.top,
        paddingBottom: SAFE_AREAS.bottom,
        paddingLeft: SAFE_AREAS.left,
        paddingRight: SAFE_AREAS.right,
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "inline-block",
          padding: "12px 28px",
          borderRadius: 999,
          backgroundColor: BRAND_COLORS.surface,
          color: BRAND_COLORS.accent,
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: 3,
          textTransform: "uppercase",
          marginBottom: 40,
        }}
      >
        ⚡ QUICK BURN
      </div>
      <h1
        style={{
          fontSize: TYPOGRAPHY.titleSize,
          fontWeight: 900,
          color: BRAND_COLORS.text,
          lineHeight: 1.15,
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 32,
          maxWidth: 900,
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontSize: TYPOGRAPHY.hookSize,
          fontWeight: 600,
          color: BRAND_COLORS.textMuted,
          lineHeight: 1.3,
          maxWidth: 820,
        }}
      >
        {hook}
      </p>
    </AbsoluteFill>
  );
};

export const ExerciseScreen: React.FC<{
  exercise: QuickBurnExercise;
  exerciseIndex: number;
  totalExercises: number;
  nextExerciseName?: string;
  durationInFrames: number;
}> = ({ exercise, exerciseIndex, totalExercises, nextExerciseName, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const remainingFrames = Math.max(0, durationInFrames - frame);
  const remainingSeconds = Math.ceil(remainingFrames / fps);
  const progress = remainingFrames / durationInFrames;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND_COLORS.background,
        color: BRAND_COLORS.text,
        fontFamily: TYPOGRAPHY.fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: SAFE_AREAS.top + 20,
        paddingBottom: SAFE_AREAS.bottom + 20,
        paddingLeft: SAFE_AREAS.left,
        paddingRight: SAFE_AREAS.right,
        textAlign: "center",
      }}
    >
      {/* Header with Exercise counter */}
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: BRAND_COLORS.accent,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        EXERCISE {exerciseIndex + 1} OF {totalExercises}
      </div>

      {/* Main Center Area: Name, Countdown, and Coaching Cue */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 36,
        }}
      >
        <h2
          style={{
            fontSize: TYPOGRAPHY.titleSize,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: BRAND_COLORS.text,
            margin: 0,
            maxWidth: 920,
          }}
        >
          {exercise.name}
        </h2>

        <CountdownRing
          remainingSeconds={remainingSeconds}
          progress={progress}
          color={BRAND_COLORS.timerActive}
        />

        {exercise.cue && (
          <div
            style={{
              padding: "16px 36px",
              backgroundColor: BRAND_COLORS.surface,
              borderRadius: 16,
              fontSize: TYPOGRAPHY.cueSize,
              fontWeight: 600,
              color: BRAND_COLORS.text,
              maxWidth: 860,
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            }}
          >
            💡 {exercise.cue}
          </div>
        )}
      </div>

      {/* Footer showing Next Exercise */}
      <div style={{ height: 60, display: "flex", alignItems: "center" }}>
        {nextExerciseName ? (
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: BRAND_COLORS.textMuted,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            NEXT: <strong style={{ color: BRAND_COLORS.text }}>{nextExerciseName}</strong>
          </span>
        ) : (
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: BRAND_COLORS.secondary,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            FINAL EXERCISE — FINISH STRONG!
          </span>
        )}
      </div>
    </AbsoluteFill>
  );
};

export const RestScreen: React.FC<{
  nextExerciseName?: string;
  durationInFrames: number;
}> = ({ nextExerciseName, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const remainingFrames = Math.max(0, durationInFrames - frame);
  const remainingSeconds = Math.ceil(remainingFrames / fps);
  const progress = remainingFrames / durationInFrames;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND_COLORS.background,
        color: BRAND_COLORS.text,
        fontFamily: TYPOGRAPHY.fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: SAFE_AREAS.top + 20,
        paddingBottom: SAFE_AREAS.bottom + 20,
        paddingLeft: SAFE_AREAS.left,
        paddingRight: SAFE_AREAS.right,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: BRAND_COLORS.timerRest,
          letterSpacing: 3,
          textTransform: "uppercase",
        }}
      >
        RECOVERY BREAK
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 36,
        }}
      >
        <h2
          style={{
            fontSize: TYPOGRAPHY.titleSize,
            fontWeight: 900,
            textTransform: "uppercase",
            color: BRAND_COLORS.timerRest,
            margin: 0,
          }}
        >
          REST
        </h2>

        <CountdownRing
          remainingSeconds={remainingSeconds}
          progress={progress}
          color={BRAND_COLORS.timerRest}
        />

        {nextExerciseName && (
          <p
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: BRAND_COLORS.textMuted,
            }}
          >
            Get ready for{" "}
            <strong style={{ color: BRAND_COLORS.text }}>{nextExerciseName}</strong>
          </p>
        )}
      </div>

      <div style={{ height: 60 }} />
    </AbsoluteFill>
  );
};

export const EndCard: React.FC<{
  cta: string;
  hashtags?: string[];
}> = ({ cta, hashtags = [] }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND_COLORS.background,
        color: BRAND_COLORS.text,
        fontFamily: TYPOGRAPHY.fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: SAFE_AREAS.top,
        paddingBottom: SAFE_AREAS.bottom,
        paddingLeft: SAFE_AREAS.left,
        paddingRight: SAFE_AREAS.right,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 80,
          marginBottom: 24,
        }}
      >
        🏆
      </div>
      <h1
        style={{
          fontSize: TYPOGRAPHY.titleSize,
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          color: BRAND_COLORS.text,
          marginBottom: 32,
        }}
      >
        WORKOUT COMPLETE!
      </h1>
      <p
        style={{
          fontSize: TYPOGRAPHY.hookSize,
          fontWeight: 700,
          color: BRAND_COLORS.accent,
          lineHeight: 1.35,
          maxWidth: 820,
          marginBottom: 40,
        }}
      >
        {cta}
      </p>
      {hashtags.length > 0 && (
        <p
          style={{
            fontSize: 28,
            color: BRAND_COLORS.textMuted,
            fontWeight: 600,
          }}
        >
          {hashtags.slice(0, 4).join(" ")}
        </p>
      )}
    </AbsoluteFill>
  );
};

export const QuickBurnComposition: React.FC<QuickBurnProps> = (props) => {
  const { fps } = useVideoConfig();
  const { segments } = computeQuickBurnTimeline(props, fps);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND_COLORS.background }}>
      {segments.map((seg, idx) => {
        if (seg.type === "title") {
          return (
            <Sequence
              key={`title-${idx}`}
              from={seg.startFrame}
              durationInFrames={seg.durationInFrames}
            >
              <TitleCard
                title={props.title || "QUICK BURN WORKOUT"}
                hook={props.hook || "Get ready to move!"}
              />
            </Sequence>
          );
        }

        if (seg.type === "exercise" && seg.exercise) {
          return (
            <Sequence
              key={`exercise-${idx}`}
              from={seg.startFrame}
              durationInFrames={seg.durationInFrames}
            >
              <ExerciseScreen
                exercise={seg.exercise}
                exerciseIndex={seg.exerciseIndex ?? 0}
                totalExercises={seg.totalExercises ?? 1}
                nextExerciseName={seg.nextExerciseName}
                durationInFrames={seg.durationInFrames}
              />
            </Sequence>
          );
        }

        if (seg.type === "rest") {
          return (
            <Sequence
              key={`rest-${idx}`}
              from={seg.startFrame}
              durationInFrames={seg.durationInFrames}
            >
              <RestScreen
                nextExerciseName={seg.nextExerciseName}
                durationInFrames={seg.durationInFrames}
              />
            </Sequence>
          );
        }

        if (seg.type === "cta") {
          return (
            <Sequence
              key={`cta-${idx}`}
              from={seg.startFrame}
              durationInFrames={seg.durationInFrames}
            >
              <EndCard
                cta={props.cta || "Subscribe for daily routines!"}
                hashtags={props.hashtags}
              />
            </Sequence>
          );
        }

        return null;
      })}
    </AbsoluteFill>
  );
};
