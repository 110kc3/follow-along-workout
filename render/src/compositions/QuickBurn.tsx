import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, TYPOGRAPHY, SAFE_AREAS } from "../brand.js";

export interface QuickBurnProps {
  title?: string;
  exercises?: Array<{
    name: string;
    durationSeconds: number;
  }>;
}

export const QuickBurnComposition: React.FC<QuickBurnProps> = ({
  title = "QUICK BURN WORKOUT",
  exercises = [],
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bgDark,
        color: COLORS.textLight,
        fontFamily: TYPOGRAPHY.fontPrimary,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: SAFE_AREAS.top,
        paddingBottom: SAFE_AREAS.bottom,
        paddingLeft: SAFE_AREAS.left,
        paddingRight: SAFE_AREAS.right,
      }}
    >
      <h1
        style={{
          fontSize: 72,
          fontWeight: 900,
          color: COLORS.accentOrange,
          textTransform: "uppercase",
          letterSpacing: 2,
          marginBottom: 32,
        }}
      >
        {title}
      </h1>
      <p style={{ fontSize: 36, color: COLORS.textMuted }}>
        Frame {frame} · {Math.floor(frame / fps)}s
      </p>
    </AbsoluteFill>
  );
};
