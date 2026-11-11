"use client";

import { useState, type CSSProperties } from "react";
import { argusMiniature as copy } from "@/content/miniatures";
import Figure from "../Figure";
import { useHydrated } from "../hooks";
import { DAYS, MOVED, POSTED, SLOTS, byDeadline, initial, next, schedule, type Step } from "./model";

/** The deadline that is new or changed in each step, and how the list marks it. */
const FLAG: Partial<Record<Step, { id: string; kind: "added" | "changed" }>> = {
  posted: { id: POSTED.id, kind: "added" },
  moved: { id: MOVED.id, kind: "changed" },
};

export default function ArgusMiniature() {
  const hydrated = useHydrated();
  const [state, setState] = useState(initial);

  const { blocks } = schedule(state);
  const flag = FLAG[state.step];
  const grid = { "--days": DAYS, "--slots": SLOTS } as CSSProperties;

  return (
    <Figure
      label={copy.label}
      description={copy.description}
      status={copy.status[state.step]}
      caption={copy.caption}
      legend={
        <ul className="miniature-legend">
          <li className="key-accent">{copy.legend.work}</li>
          <li className="key-plain">{copy.legend.calendar}</li>
        </ul>
      }
      actions={
        hydrated && (
          <button type="button" className={state.step === "busy" ? undefined : "primary"} onClick={() => setState(next)}>
            {copy.actions[state.step]}
          </button>
        )
      }
    >
      <div className="mini-plan" data-step={state.step} style={grid} aria-hidden="true">
        <section className="mini-plan-panel">
          <h3>{copy.argus}</h3>
          <p>{copy.collected}</p>
          <ul className="mini-plan-deadlines">
            {byDeadline(state.tasks).map((task) => (
              <li key={task.id} data-task={task.id} data-flag={flag?.id === task.id ? flag.kind : undefined}>
                <span className="mini-plan-title">{copy.tasks[task.id]}</span>
                {flag?.id === task.id && <span className="mini-plan-flag">{copy.flags[flag.kind]}</span>}
                <span className="mini-plan-due">{copy.due(task.due)}</span>
                <span className="mini-plan-hours">{copy.hours(task.hours)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* The hand-off: the planner reads the deadlines and schedules the work. */}
        <div className="mini-arrow" key={state.step} />

        <section className="mini-plan-panel">
          <h3>{copy.planner}</h3>
          <p>{copy.fitted}</p>
          <div className="mini-plan-days">
            {copy.days.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="mini-plan-week">
            {state.busy.map((b) => (
              <span key={b.id} className="mini-plan-block mini-plan-busy" data-kind={b.kind} style={{ "--day": b.day, "--start": b.start, "--length": b.length } as CSSProperties}>
                <i>{copy.busy[b.kind]}</i>
              </span>
            ))}
            {/* Each task keeps its element, so it glides when it is fitted somewhere new. */}
            {blocks.map((b) => (
              <span key={b.id} className="mini-plan-block mini-plan-task" data-task={b.id} style={{ "--day": b.day, "--start": b.start, "--length": b.length } as CSSProperties}>
                <i>
                  <span className="mini-plan-full">{copy.tasks[b.id]}</span>
                  <span className="mini-plan-short">{copy.short[b.id]}</span>
                </i>
              </span>
            ))}
          </div>
        </section>
      </div>
    </Figure>
  );
}
