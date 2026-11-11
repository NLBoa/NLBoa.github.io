"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PORTRAIT } from "@/content/portrait-front";
import { frameAt } from "@/lib/portrait";
import { useFrames, useHydrated, useOnScreen } from "@/miniatures/hooks";
import { useScene } from "@/scene/store";

type Props = {
  /** The portrait facing forward. It is what the page's HTML holds. */
  front: string[];
  label: string;
  pause: string;
  play: string;
};

/**
 * The ASCII portrait from the GitHub profile card. It starts as a still, and
 * once it is on screen the head turns slowly from side to side. The other
 * frames are loaded only then. Nothing moves under reduced motion.
 */
export default function Portrait({ front, label, pause, play }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const elapsed = useRef(0);
  const hydrated = useHydrated();
  const onScreen = useOnScreen(box);
  const reducedMotion = useScene((s) => s.reducedMotion);
  const [frames, setFrames] = useState<string[][] | null>(null);
  const [paused, setPaused] = useState(false);
  const [frame, setFrame] = useState<number>(PORTRAIT.front);

  const wanted = hydrated && onScreen && !reducedMotion;
  useEffect(() => {
    if (!wanted || frames) return;
    let live = true;
    import("@/content/portrait-frames.json").then((data) => {
      if (live) setFrames(data.default.frames);
    });
    return () => {
      live = false;
    };
  }, [wanted, frames]);

  const tick = useCallback((seconds: number) => {
    elapsed.current += seconds;
    setFrame(frameAt(elapsed.current, PORTRAIT.count, PORTRAIT.front));
  }, []);
  useFrames(wanted && !paused && frames !== null, tick);

  const lines = frames?.[frame] ?? front;

  return (
    <div className="card-face" ref={box}>
      <pre role="img" aria-label={label} data-frame={frames ? frame : PORTRAIT.front}>
        {lines.join("\n")}
      </pre>
      {wanted && frames && (
        <button type="button" className="card-pause" aria-pressed={paused} onClick={() => setPaused(!paused)}>
          {paused ? play : pause}
        </button>
      )}
    </div>
  );
}
