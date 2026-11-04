import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND_COLORS, SAFE_AREAS, TYPOGRAPHY } from "../brand.js";
import { CountdownRing, EndCard } from "./QuickBurn.js";

export interface EMOMExercise {
  name: string;
  seconds: number;
  reps?: number;
  cue?: string;
}

export interface EMOMProps {
  id?: string;
  title?: string;
  hook?: string;
  exercises?: EMOMExercise[];
  rest?: number;
  caption?: string;
  hashtags?: string[];
  cta?: string;
  music_id?: string;
  titleCardSeconds?: number;
  ctaCardSeconds?: number;
}

export interface EMOMTimelineSegment {
  type: "title" | "exercise" | "rest" | "cta";
  startFrame: number;
  durationInFrames: number;
  exerciseIndex?: number;
  exercise?: EMOMExercise;
  nextExerciseName?: string;
  totalExercises?: number;
}

export function computeEMOMTimeline(
  props: EMOMProps,
  fps: number = 30
): { segments: EMOMTimelineSegment[]; totalFrames: number } {
  const titleFrames = (props.titleCardSeconds ?? 3) * fps;
  const ctaFrames = (props.ctaCardSeconds ?? 3) * fps;
  const restSeconds = props.rest ?? 0;
  const exercises = props.exercises || [];

  const segments: EMOMTimelineSegment[] = [];
  let currentFrame = 0;

  // 1. Title Card
  segments.push({
    type: "title",
    startFrame: currentFrame,
    durationInFrames: titleFrames,
  });
  currentFrame += titleFrames;

  // 2. Per-Round Screens (+ optional Rest screens)
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

    // Rest screen between rounds
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

export const EMOMTitleCard: React.FC<{ title: string; hook: string }> = ({ title, hook }) => {
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
          color: BRAND_COLORS.secondary,
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: 3,
          textTransform: "uppercase",
          marginBottom: 40,
        }}
      >
        ⏱️ EMOM PROTOCOL
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

export const EMOMExerciseScreen: React.FC<{
  exercise: EMOMExercise;
  exerciseIndex: number;
  totalExercises: number;
  nextExerciseName?: string;
  durationInFrames: number;
}> = ({ exercise, exerciseIndex, totalExercises, nextExerciseName, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentSeconds = Math.max(
    0,
    Math.ceil((durationInFrames - frame) / fps)
  );
  const progress = Math.min(1, Math.max(0, frame / durationInFrames));

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
        paddingBottom: SAFE_AREAS.bottom + 40,
        paddingLeft: SAFE_AREAS.left,
        paddingRight: SAFE_AREAS.right,
        textAlign: "center",
      }}
    >
      {/* Top Header: Round info & target reps */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: BRAND_COLORS.secondary,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          ROUND {exerciseIndex + 1} OF {totalExercises}
        </div>
        {exercise.reps != null && (
          <div
            style={{
              display: "inline-block",
              padding: "8px 24px",
              borderRadius: 8,
              backgroundColor: BRAND_COLORS.surface,
              color: BRAND_COLORS.accent,
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: 2,
            }}
          >
            TARGET: {exercise.reps} REPS
          </div>
        )}
      </div>

      {/* Center: Countdown Ring and Exercise Name */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          maxWidth: 900,
        }}
      >
        <CountdownRing
          remainingSeconds={currentSeconds}
          progress={progress}
          color={BRAND_COLORS.secondary}
          size={380}
          strokeWidth={20}
        />
        <h2
          style={{
            fontSize: TYPOGRAPHY.exerciseNameSize,
            fontWeight: 900,
            color: BRAND_COLORS.text,
            textTransform: "uppercase",
            lineHeight: 1.1,
            marginTop: 48,
            marginBottom: 20,
          }}
        >
          {exercise.name}
        </h2>
        {exercise.cue && (
          <p
            style={{
              fontSize: TYPOGRAPHY.cueSize,
              fontWeight: 600,
              color: BRAND_COLORS.textMuted,
              maxWidth: 750,
              lineHeight: 1.3,
            }}
          >
            💡 {exercise.cue}
          </p>
        )}
      </div>

      {/* Bottom: Next Round Preview */}
      <div
        style={{
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {nextExerciseName ? (
          <span
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: BRAND_COLORS.textMuted,
              letterSpacing: 1,
            }}
          >
            NEXT ROUND: <strong style={{ color: BRAND_COLORS.text }}>{nextExerciseName}</strong>
          </span>
        ) : (
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: BRAND_COLORS.secondary,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            FINAL ROUND — FINISH STRONG!
          </span>
        )}
      </div>
    </AbsoluteFill>
  );
};

export const EMOMComposition: React.FC<EMOMProps> = (props) => {
  const { fps } = useVideoConfig();
  const { segments } = computeEMOMTimeline(props, fps);

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
              <EMOMTitleCard
                title={props.title || "EMOM Routine"}
                hook={props.hook || "Work every minute on the minute."}
              />
            </Sequence>
          );
        }

        if (seg.type === "exercise" && seg.exercise) {
          return (
            <Sequence
              key={`ex-${idx}`}
              from={seg.startFrame}
              durationInFrames={seg.durationInFrames}
            >
              <EMOMExerciseScreen
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
                    fontSize: 32,
                    fontWeight: 900,
                    color: BRAND_COLORS.secondary,
                    letterSpacing: 4,
                    textTransform: "uppercase",
                    marginBottom: 24,
                  }}
                >
                  REST & RECOVER
                </div>
                <h3
                  style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: BRAND_COLORS.text,
                    lineHeight: 1.2,
                  }}
                >
                  Up Next: <span style={{ color: BRAND_COLORS.accent }}>{seg.nextExerciseName}</span>
                </h3>
              </AbsoluteFill>
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
                cta={props.cta || "Drop your completed score in the comments!"}
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
