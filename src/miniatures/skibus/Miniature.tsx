"use client";

import { useState } from "react";
import { skibusMiniature as copy } from "@/content/miniatures";
import Figure from "../Figure";
import { useHydrated } from "../hooks";
import { advance, boardNext, checkInNext, counts, everyoneAboard, initial } from "./model";

// The bus from above: a door and driver's seat at the front, then seats in pairs across an aisle.
const SEAT = { width: 54, height: 44, stepX: 76, stepY: 88, left: 150, top: 29 };
const seatAt = (index: number) => ({
  x: SEAT.left + Math.floor(index / 2) * SEAT.stepX,
  y: SEAT.top + (index % 2) * SEAT.stepY,
});

export default function SkibusMiniature() {
  const hydrated = useHydrated();
  const [roster, setRoster] = useState(initial);
  const total = counts(roster);

  const status =
    total.waiting === roster.length
      ? copy.status.start
      : everyoneAboard(roster)
        ? copy.status.full
        : copy.status.progress(total.checked, total.aboard, total.waiting);

  return (
    <Figure
      interactive
      label={copy.label}
      description={copy.description}
      status={status}
      caption={copy.caption}
      legend={
        <ul className="miniature-legend">
          <li className="key-outline">{copy.states.checked}</li>
          <li className="key-accent">{copy.states.aboard}</li>
        </ul>
      }
      actions={
        hydrated &&
        (everyoneAboard(roster) ? (
          <button type="button" onClick={() => setRoster(initial)}>
            {copy.actions.reset}
          </button>
        ) : (
          <>
            <button type="button" className="primary" disabled={total.waiting === 0} onClick={() => setRoster(checkInNext)}>
              {copy.actions.checkIn}
            </button>
            <button type="button" disabled={total.checked === 0} onClick={() => setRoster(boardNext)}>
              {copy.actions.board}
            </button>
          </>
        ))
      }
    >
      <div className="mini-bus">
        <ol className="mini-bus-roster">
          {roster.map((state, i) => (
            <li key={i}>
              <button type="button" data-state={state} disabled={!hydrated || state === "aboard"} onClick={() => setRoster(advance(roster, i))}>
                <span>{copy.rider(i + 1)}</span>
                <small>{copy.states[state]}</small>
              </button>
            </li>
          ))}
        </ol>

        <svg className="mini-bus-plan" viewBox="0 0 560 190" aria-hidden="true">
          <rect className="mini-bus-body" x={6} y={6} width={548} height={178} rx={30} />
          <path className="mini-bus-detail" d="M6 60H26M6 130H26M70 6V46M70 184V144" />
          <rect className="mini-bus-driver" x={84} y={116} width={40} height={40} rx={8} />
          {roster.map((state, i) => {
            const seat = seatAt(i);
            return <rect key={i} className="mini-bus-seat" data-state={state} x={seat.x} y={seat.y} width={SEAT.width} height={SEAT.height} rx={9} />;
          })}
        </svg>
      </div>
    </Figure>
  );
}
