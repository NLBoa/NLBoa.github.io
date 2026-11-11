/**
 * The Shell miniature as pure functions: a scripted terminal session that is
 * typed out one group of commands at a time. A replay, not a working shell.
 */

export type Entry = { command: string; output: string[] };
/** One group of commands that shows one feature. */
export type Group = { id: string; entries: Entry[] };
export type Script = Group[];

/** `group` is the one on screen last; `typed` counts the characters of its commands typed so far. */
export type State = { group: number; typed: number };

/** Characters typed per second. */
const SPEED = 34;

export const length = (group: Group): number => group.entries.reduce((sum, e) => sum + e.command.length, 0);

/** The session with its first group already typed. */
export const start = (script: Script): State => ({ group: 0, typed: length(script[0]) });

export const isTyping = (state: State, script: Script): boolean => state.typed < length(script[state.group]);

export const isLast = (state: State, script: Script): boolean => state.group === script.length - 1;

/** Types on for `seconds`. */
export function advance(state: State, seconds: number, script: Script): State {
  if (!isTyping(state, script)) return state;
  return { ...state, typed: Math.min(length(script[state.group]), state.typed + seconds * SPEED) };
}

/**
 * The button: finishes the group being typed, else begins the next group,
 * else starts the session again. With `instant` nothing is typed out.
 */
export function run(state: State, script: Script, instant = false): State {
  if (isTyping(state, script)) return { ...state, typed: length(script[state.group]) };
  if (isLast(state, script)) return instant ? start(script) : { group: 0, typed: 0 };
  const group = state.group + 1;
  return { group, typed: instant ? length(script[group]) : 0 };
}

export type Line = { kind: "command" | "output"; text: string; group: string; typing?: boolean };

/** Everything on the screen: finished groups in full, the current one as far as it is typed. */
export function lines(state: State, script: Script): Line[] {
  const out: Line[] = [];
  script.slice(0, state.group + 1).forEach((group, index) => {
    let left = index < state.group ? Infinity : Math.floor(state.typed);
    for (const entry of group.entries) {
      const done = left >= entry.command.length;
      out.push({ kind: "command", text: done ? entry.command : entry.command.slice(0, left), group: group.id, typing: !done });
      if (!done) break;
      for (const text of entry.output) out.push({ kind: "output", text, group: group.id });
      left -= entry.command.length;
    }
  });
  return out;
}
