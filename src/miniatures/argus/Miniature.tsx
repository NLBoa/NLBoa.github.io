"use client";

import { useState, type CSSProperties } from "react";
import { argusMiniature as copy } from "@/content/miniatures";
import Figure from "../Figure";
import { useHydrated } from "../hooks";
import { SAMPLE, WINDOW_MINUTES, fillWindow, initial, next, queue, type Source } from "./model";

const SOURCES: Source[] = ["canvas", "gradescope", "piazza"];

export default function ArgusMiniature() {
  const hydrated = useHydrated();
  const [state, setState] = useState(initial);

  const ranked = queue(state);
  const slices = fillWindow(ranked);
  const active = new Set(ranked.map((t) => t.source));

  return (
    <Figure
      label={copy.label}
      description={copy.description}
      status={copy.status[state.step]}
      caption={copy.caption}
      actions={
        hydrated && (
          <button type="button" className={state.step === "finished" ? undefined : "primary"} onClick={() => setState(next)}>
            {copy.actions[state.step]}
          </button>
        )
      }
    >
      <div className="mini-argus" data-step={state.step} aria-hidden="true">
        <div className="mini-argus-top">
          <p className="mini-argus-heading">{copy.heading}</p>
          <ul className="mini-argus-sources">
            <li className="mini-argus-collected">{copy.collected}</li>
            {SOURCES.map((source) => (
              <li key={source} data-source={source} data-active={active.has(source)}>
                {copy.sources[source]}
              </li>
            ))}
          </ul>
        </div>

        {/* Every task stays in the page; its place in the queue decides where it is drawn. */}
        <ol className="mini-argus-queue" style={{ "--rows": SAMPLE.length } as CSSProperties}>
          {state.tasks.map((task) => {
            const place = ranked.findIndex((t) => t.id === task.id);
            const done = place < 0;
            return (
              <li key={task.id} data-done={done} data-source={task.source} data-tonight={slices.some((slice) => slice.id === task.id)} style={{ "--place": done ? 0 : place } as CSSProperties}>
                <span className="mini-argus-rank">{done ? "" : place + 1}</span>
                <span className="mini-argus-title">
                  {copy.tasks[task.id].title}
                  <small>{copy.tasks[task.id].course}</small>
                </span>
                <span className="mini-argus-source">{copy.sources[task.source]}</span>
                <span className="mini-argus-effort">{copy.effort(task.minutes)}</span>
                <span className="mini-argus-due">{copy.due(task.due)}</span>
              </li>
            );
          })}
        </ol>

        <div className="mini-argus-window">
          <p>{copy.window}</p>
          <div className="mini-argus-bar">
            {slices.map((slice) => (
              <span key={slice.id} style={{ flexGrow: slice.minutes / WINDOW_MINUTES }}>
                {copy.tasks[slice.id].title}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Figure>
  );
}
