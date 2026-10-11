"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo } from "react";
import { useReducedMotion } from "motion/react";

// The player draws on a <canvas> in the browser, so keep it out of server rendering
const DotLottieReact = dynamic(
  () => import("@lottiefiles/dotlottie-react").then((m) => m.DotLottieReact),
  { ssr: false },
);

/**
 * Plays a Lottie animation with LottieFiles' DotLottieReact.
 *
 * Give it one of:
 * - `data`: animation JSON as an object (see lib/lottie/animations.js, or import a .json file)
 * - `src`: a URL to a .lottie or .json file, such as one hosted on LottieFiles
 *
 * Other props:
 * - `staticFrame`: the frame shown to visitors who prefer reduced motion
 * - `label`: describes the animation for screen readers; leave out if it is decorative
 * - `className`: size the animation here, for example "h-40 w-40"
 */
export default function LottieAnimation({
  data,
  src,
  loop = true,
  staticFrame = 0,
  label,
  className,
}) {
  const reduce = useReducedMotion();

  // The player takes Lottie JSON as a string
  const json = useMemo(() => (data ? JSON.stringify(data) : undefined), [data]);

  // Visitors who prefer reduced motion get a single still frame instead of playback
  const onPlayer = useCallback(
    (player) => {
      if (!player || !reduce) return;
      const showStill = () => player.setFrame(staticFrame);
      if (player.isLoaded) showStill();
      else player.addEventListener("load", showStill);
    },
    [reduce, staticFrame],
  );

  return (
    <div
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <DotLottieReact
        data={json}
        src={json ? undefined : src}
        loop={loop && !reduce}
        autoplay={!reduce}
        dotLottieRefCallback={onPlayer}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}