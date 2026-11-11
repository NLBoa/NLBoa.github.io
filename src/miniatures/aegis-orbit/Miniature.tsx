"use client";

import { useCallback, useRef, useState } from "react";
import { aegisOrbitMiniature as copy } from "@/content/miniatures";
import { useScene } from "@/scene/store";
import Figure from "../Figure";
import { useFrames, useHydrated, useOnScreen } from "../hooks";
import { EARTH, PASS, PATHS, VIEW, advance, atDecision, decide, initial, picture, settle, type Choice, type State } from "./model";

function statusOf(state: State): string {
  if (state.phase === "approach") return copy.status.approach;
  if (state.phase === "decision") return copy.status.decision;
  if (state.phase === "burned") return copy.status.burned;
  if (state.phase === "rejected") return copy.status.rejected;
  return state.choice === "burn" ? copy.status.avoided : copy.status.stayed;
}

/** A satellite seen from the side: a body and two solar panels. */
function Craft({ x, y, heading, ghost = false }: { x: number; y: number; heading: number; ghost?: boolean }) {
  return (
    <g className={ghost ? "mini-ghost" : "mini-craft"} transform={`translate(${x} ${y}) rotate(${heading})`}>
      <g className="mini-glyph">
        <rect x={-25} y={-5} width={16} height={10} rx={1.5} />
        <rect x={9} y={-5} width={16} height={10} rx={1.5} />
        <rect x={-8} y={-8} width={16} height={16} rx={3} />
      </g>
    </g>
  );
}

export default function AegisOrbitMiniature() {
  const figure = useRef<HTMLElement>(null);
  const hydrated = useHydrated();
  const onScreen = useOnScreen(figure);
  const reducedMotion = useScene((s) => s.reducedMotion);
  const [played, setPlayed] = useState<State>(initial);

  // With reduced motion nothing plays: the picture starts at the decision.
  const state = reducedMotion && played.phase === "approach" ? atDecision : played;
  const moving = state.phase === "approach" || state.phase === "burned" || state.phase === "rejected";

  const tick = useCallback((seconds: number) => setPlayed((s) => advance(s, seconds)), []);
  useFrames(hydrated && onScreen && !reducedMotion && moving, tick);

  const choose = (choice: Choice) => setPlayed(reducedMotion ? settle(choice) : decide(state, choice));
  const undecided = state.choice === null;

  const p = picture(state);

  return (
    <Figure
      ref={figure}
      label={copy.label}
      description={copy.description}
      status={statusOf(state)}
      caption={copy.caption}
      legend={
        <ul className="miniature-legend">
          <li className="key-craft">{copy.legend.craft}</li>
          <li className="key-threat">{copy.legend.threat}</li>
          <li className="key-ghost">{copy.legend.ghost}</li>
        </ul>
      }
      actions={
        hydrated &&
        (undecided ? (
          <>
            <button type="button" className="primary" onClick={() => choose("burn")}>
              {copy.actions.approve}
            </button>
            <button type="button" onClick={() => choose("stay")}>
              {copy.actions.reject}
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setPlayed(initial)}>
            {copy.actions.replay}
          </button>
        ))
      }
    >
      <svg viewBox={`0 ${VIEW.top} ${VIEW.width} ${VIEW.height}`} className="mini-aegis" data-phase={state.phase} data-choice={state.choice ?? "none"} aria-hidden="true">
        {/* The Earth's limb, with the faint glow of the air above it. */}
        <circle className="mini-air" cx={EARTH.cx} cy={EARTH.cy} r={EARTH.r + 14} />
        <circle className="mini-earth" cx={EARTH.cx} cy={EARTH.cy} r={EARTH.r} />

        {/* The debris's course. */}
        <path className="mini-threat-path" d={PATHS.debris} />

        {/* The spacecraft's course: one band, which bends at the burn. */}
        {p.bent ? (
          <>
            <path className="mini-band" d={PATHS.beforeBurn} />
            <path className="mini-band" d={PATHS.afterBurn} />
            <path className="mini-not-taken" d={PATHS.notTaken} />
          </>
        ) : (
          <path className="mini-band" d={PATHS.planned} />
        )}

        {/* Where the two courses meet. */}
        <g className="mini-pass" transform={`translate(${PASS.x} ${PASS.y})`}>
          <circle r={30} />
          <path d="M-7 0H7M0 -7V7" />
        </g>

        {p.clearance && <line className="mini-clearance" x1={PASS.x} y1={PASS.y} x2={p.clearance.x} y2={p.clearance.y} />}

        {p.flash > 0 && (
          <circle className="mini-flash" cx={PASS.x} cy={PASS.y} r={10 + (1 - p.flash) * 46} style={{ opacity: 0.25 + p.flash * 0.75 }} />
        )}

        {/* What is left where the spacecraft flew into the pass. */}
        {p.hit && (
          <g className="mini-hit" transform={`translate(${PASS.x} ${PASS.y})`}>
            <path className="mini-glyph" d="M-16 -4L-9 -2M-6 -15L-4 -8M9 -13L5 -7M17 2L10 2M10 14L6 8M-9 13L-5 7" />
          </g>
        )}

        {p.debris && (
          <g transform={`translate(${p.debris.x} ${p.debris.y})`}>
            <path className="mini-debris mini-glyph" d="M-9 -3L-2 -9L8 -5L10 4L1 9L-7 6Z" />
          </g>
        )}
        {p.ghost && <Craft {...p.ghost} ghost />}
        {p.craft && (
          <>
            {p.plume > 0 && (
              <circle className="mini-plume" cx={p.craft.x} cy={p.craft.y} r={12 + p.plume * 16} style={{ opacity: p.plume * 0.7 }} />
            )}
            <Craft {...p.craft} />
          </>
        )}
      </svg>
    </Figure>
  );
}
