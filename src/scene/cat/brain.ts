/**
 * What the cat decides to do.
 *
 * As built it mostly rested, did something of its own accord every so often, and answered the
 * visitor: a look when they arrived, a purr when stroked, its next trick when clicked. Noah then
 * asked for less, twice (2026-11-21): first "keep the cat only in loaf mode", then, asked whether
 * it should still purr and stare, "Only breathing". So its repertoire is empty: it decides
 * nothing, and all of this stands ready for the day he wants some of it back.
 *
 * Time and chance are handed in, so this can be tested.
 */

import type { EmoteName } from "./motion";

type Stance = "sit" | "loaf" | "side";

/**
 * The cat lies in the loaf and breathes (and blinks): no emotes, no watching the pointer, no ear
 * or tail flicks, nothing in answer to a stroke or a click.
 */
export const ONLY_BREATHING = true;

/**
 * What the cat will do of its own accord or when asked. Everything is still built and tested:
 * "loaf", "purr" and "stare" keep it in the loaf; "clean" sits it up and "roll" lays it on its
 * side. Put names back here (and set ONLY_BREATHING to false) to bring them back.
 */
export const REPERTOIRE: readonly EmoteName[] = ONLY_BREATHING ? [] : ["loaf", "purr", "stare"];

/** What a click asks for, in turn, of the things it will do. */
export const TRICK_ORDER: readonly EmoteName[] = ["stare", "clean", "roll", "loaf"];

/** Seconds of quiet between things it does unasked. */
const GAP = { min: 11, max: 24 };
/** It greets a visitor this long after it appears. */
const GREET_AFTER = 2.4;
/** The pointer must rest on it this long to count as a stroke. */
const STROKE_AFTER = 0.3;
/** A pointer that moves again after this long is someone coming back: worth a look. */
const AWAY_AFTER = 30;

export class CatBrain {
  private nextAt = GREET_AFTER;
  private greeted = false;
  private last: EmoteName | null = null;
  private trick = 0;
  private wasResting = true;
  private overSince: number | null = null;
  private movedAt = 0;
  private sideSince: number | null = null;
  private poked = false;

  constructor(
    private readonly random: () => number = Math.random,
    private readonly repertoire: readonly EmoteName[] = REPERTOIRE,
  ) {}

  private can(emote: EmoteName): boolean {
    return this.repertoire.includes(emote);
  }

  private gap() {
    return GAP.min + this.random() * (GAP.max - GAP.min);
  }

  private started(emote: EmoteName): EmoteName {
    this.last = emote;
    this.wasResting = false;
    return emote;
  }

  /** The pointer moved. Returns "stare" if that is someone coming back after a long quiet. */
  moved(now: number, resting: boolean): EmoteName | null {
    const away = now - this.movedAt;
    this.movedAt = now;
    if (this.can("stare") && this.greeted && resting && away > AWAY_AFTER) return this.started("stare");
    return null;
  }

  /** The pointer is on the cat, or has left it. */
  over(now: number, on: boolean) {
    if (!on) {
      this.overSince = null;
      this.poked = false;
    } else if (this.overSince === null && !this.poked) this.overSince = now;
  }

  /** True while the pointer has rested on the cat long enough to be a stroke (and it purrs at all). */
  stroked(now: number): boolean {
    return this.can("purr") && this.overSince !== null && now - this.overSince >= STROKE_AFTER;
  }

  /**
   * A click on the cat: its next trick, or null if it has none. The pointer is still on it
   * afterwards, and that is not a stroke: it must leave and come back before it counts as one again.
   */
  poke(): EmoteName | null {
    const tricks = TRICK_ORDER.filter((emote) => this.can(emote));
    if (tricks.length === 0) return null;
    this.poked = true;
    this.overSince = null;
    const emote = tricks[this.trick % tricks.length];
    this.trick++;
    return this.started(emote);
  }

  /**
   * Called every frame. Returns an emote to begin now, or null to carry on.
   * `doing` is what the motion reports; `resting` is true when nothing is playing or queued.
   */
  think(now: number, resting: boolean, stance: Stance, doing: string): EmoteName | null {
    if (this.repertoire.length === 0) return null;
    // Being stroked comes before anything it had in mind.
    if (this.stroked(now) && doing !== "purr" && doing !== "clean" && doing !== "roll") return this.started("purr");

    if (stance === "side") this.sideSince ??= now;
    else this.sideSince = null;

    if (!resting) {
      this.wasResting = false;
      return null;
    }
    if (!this.wasResting) {
      // Something just ended: a quiet spell before the next.
      this.wasResting = true;
      this.nextAt = now + this.gap();
    }
    if (now < this.nextAt) return null;

    if (!this.greeted) {
      this.greeted = true;
      if (this.can("stare")) return this.started("stare");
    }
    // It does not lie on its side for ever.
    if (this.sideSince !== null && now - this.sideSince > 14 && this.can("loaf")) return this.started("loaf");

    const choices: [EmoteName, number][] = [
      ["clean", 3],
      ["roll", stance === "side" ? 0 : 2],
      // Already loafing, this is only a small shuffle to get comfortable again.
      ["loaf", stance === "loaf" ? 2 : 4],
      ["stare", 3],
      ["purr", 2],
    ];
    let open = choices.filter(([name, weight]) => weight > 0 && this.can(name));
    // Not the same thing twice running, unless it is the only thing it does.
    if (open.length > 1) open = open.filter(([name]) => name !== this.last);
    if (open.length === 0) return null;
    let pick = this.random() * open.reduce((sum, [, weight]) => sum + weight, 0);
    for (const [name, weight] of open) {
      pick -= weight;
      if (pick <= 0) return this.started(name);
    }
    return this.started(open[open.length - 1][0]);
  }
}
