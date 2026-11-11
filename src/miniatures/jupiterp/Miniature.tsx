"use client";

import { useState, type CSSProperties } from "react";
import { jupiterpMiniature as copy } from "@/content/miniatures";
import Figure from "../Figure";
import { useHydrated } from "../hooks";
import { CATALOG, DAYS, PERIODS, blocks, generatorCourses, initial, toggle } from "./model";

const ids = Object.keys(CATALOG);

export default function JupiterpMiniature() {
  const hydrated = useHydrated();
  const [plan, setPlan] = useState(initial);
  const [last, setLast] = useState<{ id: string; added: boolean } | null>(null);

  const change = (id: string) => {
    setLast({ id, added: !plan.includes(id) });
    setPlan(toggle(plan, id));
  };

  const status = !last ? copy.status.idle : last.added ? copy.status.added(copy.courses[last.id]) : copy.status.removed(copy.courses[last.id]);
  const listed = generatorCourses(plan);

  return (
    <Figure interactive label={copy.label} description={copy.description} status={status} caption={copy.caption}>
      <div className="mini-jup" style={{ "--days": DAYS, "--periods": PERIODS } as CSSProperties}>
        <section className="mini-jup-panel">
          <h3>{copy.planner}</h3>
          <p>{copy.plannerHint}</p>
          <ul className="mini-jup-catalog">
            {ids.map((id) => (
              <li key={id}>
                <button type="button" data-course={id} aria-pressed={plan.includes(id)} disabled={!hydrated} onClick={() => change(id)}>
                  {copy.courses[id]}
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* The link between the two: the part the pull request added. */}
        <div className="mini-arrow" aria-hidden="true" key={plan.join()} />

        <section className="mini-jup-panel" aria-live="off">
          <h3>{copy.generator}</h3>
          <p>{copy.generatorHint}</p>
          <ul className="mini-jup-listed">
            {listed.length === 0 && <li className="mini-jup-empty">{copy.empty}</li>}
            {listed.map((id) => (
              <li key={id} data-course={id}>
                {copy.courses[id]}
              </li>
            ))}
          </ul>
          <div className="mini-jup-week" aria-hidden="true">
            {copy.days.map((day, i) => (
              <span key={day} className="mini-jup-day" style={{ "--day": i } as CSSProperties}>
                {day}
              </span>
            ))}
            {Array.from({ length: DAYS * PERIODS }, (_, n) => (
              <b key={n} style={{ "--day": n % DAYS, "--period": Math.floor(n / DAYS) } as CSSProperties} />
            ))}
            {blocks(plan).map((block) => (
              <i key={`${block.id}-${block.day}`} data-course={block.id} style={{ "--day": block.day, "--period": block.period } as CSSProperties} />
            ))}
          </div>
        </section>
      </div>
    </Figure>
  );
}
