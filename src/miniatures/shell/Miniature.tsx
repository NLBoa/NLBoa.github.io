"use client";

import { useCallback, useRef, useState, type CSSProperties } from "react";
import { shellMiniature as copy } from "@/content/miniatures";
import { useScene } from "@/scene/store";
import Figure from "../Figure";
import { useFrames, useHydrated, useOnScreen } from "../hooks";
import { advance, isLast, isTyping, lines, run, start, type Script } from "./model";

const script: Script = copy.script;
/** Room for the whole session, so the page does not move as lines appear. */
const ROWS = script.reduce((sum, group) => sum + group.entries.reduce((n, e) => n + 1 + e.output.length, 0), 0) + 1;

export default function ShellMiniature() {
  const figure = useRef<HTMLElement>(null);
  const hydrated = useHydrated();
  const onScreen = useOnScreen(figure);
  const reducedMotion = useScene((s) => s.reducedMotion);
  const [state, setState] = useState(() => start(script));

  const typing = isTyping(state, script);
  const tick = useCallback((seconds: number) => setState((s) => advance(s, seconds, script)), []);
  useFrames(hydrated && onScreen && typing, tick);

  const shown = lines(state, script);
  const waiting = !typing;

  return (
    <Figure
      ref={figure}
      label={copy.label}
      description={copy.description}
      status={copy.status[script[state.group].id]}
      caption={copy.caption}
      actions={
        hydrated && (
          <button type="button" className={typing || isLast(state, script) ? undefined : "primary"} onClick={() => setState(run(state, script, reducedMotion))}>
            {typing ? copy.actions.skip : isLast(state, script) ? copy.actions.restart : copy.actions.next}
          </button>
        )
      }
    >
      <div className="mini-term" data-group={script[state.group].id} data-typing={typing} style={{ "--rows": ROWS } as CSSProperties} aria-hidden="true">
        {shown.map((line, i) => (
          <p key={i} data-kind={line.kind} data-current={line.group === script[state.group].id}>
            {line.kind === "command" && <span className="mini-term-prompt">{copy.prompt} </span>}
            {line.text}
            {line.typing && <span className="mini-term-cursor" />}
          </p>
        ))}
        {waiting && (
          <p data-kind="command" data-current="true">
            <span className="mini-term-prompt">{copy.prompt} </span>
            <span className="mini-term-cursor" />
          </p>
        )}
      </div>
    </Figure>
  );
}
