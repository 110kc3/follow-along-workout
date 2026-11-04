import React from "react";
import { Composition } from "remotion";
import { VIDEO_SPEC } from "./brand.js";
import { QuickBurnComposition } from "./compositions/QuickBurn.js";
import { EMOMComposition } from "./compositions/EMOM.js";
import { MobilityResetComposition } from "./compositions/MobilityReset.js";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="QuickBurn"
        component={QuickBurnComposition}
        durationInFrames={VIDEO_SPEC.fps * 60}
        fps={VIDEO_SPEC.fps}
        width={VIDEO_SPEC.width}
        height={VIDEO_SPEC.height}
      />
      <Composition
        id="EMOM"
        component={EMOMComposition}
        durationInFrames={VIDEO_SPEC.fps * 60}
        fps={VIDEO_SPEC.fps}
        width={VIDEO_SPEC.width}
        height={VIDEO_SPEC.height}
      />
      <Composition
        id="MobilityReset"
        component={MobilityResetComposition}
        durationInFrames={VIDEO_SPEC.fps * 60}
        fps={VIDEO_SPEC.fps}
        width={VIDEO_SPEC.width}
        height={VIDEO_SPEC.height}
      />
    </>
  );
};
