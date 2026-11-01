import React from "react";
import { Composition } from "remotion";
import { VIDEO_SPEC } from "./brand.js";
import { QuickBurnComposition } from "./compositions/QuickBurn.js";

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
    </>
  );
};
