/**
 * What the cat decides to do. It mostly rests; every so often it does something of its own
 * accord; and it answers the visitor: it looks up when they arrive, purrs when stroked, and
 * does its next trick when clicked.
 *
 * Time and chance are handed in, so this can be tested.
 */

import type { EmoteName } from "./motion";

type Stance = "sit" | "loaf" | "side";

/** What a click asks for, in turn. */
export const TRICKS: EmoteName[] = ["stare", "clean", "roll", "loaf"];

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

  constructor(private readonly random: () => number = Math.random) {}

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
    if (this.greeted && resting && away > AWAY_AFTER) return this.started("stare");
    return null;
  }

  /** The pointer is on the cat, or has left it. */
  over(now: number, on: boolean) {
    if (!on) {
      this.overSince = null;
      this.poked = false;
    } else if (this.overSince === null && !this.poked) this.overSince = now;
  }

  /** True while the pointer has rested on the cat long enough to be a stroke. */
  stroked(now: number): boolean {
    return this.overSince !== null && now - this.overSince >= STROKE_AFTER;
  }

  /**
   * A click on the cat: its next trick. The pointer is still on it afterwards, and that is not
   * a stroke: it must leave and come back before it counts as one again.
   */
  poke(): EmoteName {
    this.poked = true;
    this.overSince = null;
    const emote = TRICKS[this.trick % TRICKS.length];
    this.trick++;
    return this.started(emote);
  }

  /**
   * Called every frame. Returns an emote to begin now, or null to carry on.
   * `doing` is what the motion reports; `resting` is true when nothing is playing or queued.
   */
  think(now: number, resting: boolean, stance: Stance, doing: string): EmoteName | null {
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
      return this.started("stare");
    }
    // It does not lie on its side for ever.
    if (this.sideSince !== null && now - this.sideSince > 14) return this.started("loaf");

    const choices: [EmoteName, number][] = [
      ["clean", 3],
      ["roll", stance === "side" ? 0 : 2],
      ["loaf", stance === "loaf" ? 0 : 4],
      ["stare", 2],
      ["purr", 1],
    ];
    const open = choices.filter(([name, weight]) => weight > 0 && name !== this.last);
    let pick = this.random() * open.reduce((sum, [, weight]) => sum + weight, 0);
    for (const [name, weight] of open) {
      pick -= weight;
      if (pick <= 0) return this.started(name);
    }
    return this.started(open[open.length - 1][0]);
  }
}
