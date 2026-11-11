/**
 * The words in each project's miniature: the small working illustration at
 * the top of its page. A miniature is a schematic, never the real app, and
 * its caption says so.
 */

export const aegisOrbitMiniature = {
  /** Short name for screen readers. */
  label: "Schematic of a burn that avoids a close approach",
  /** Full description for screen readers and for the page without JavaScript. */
  description:
    "A spacecraft follows its orbit above the Earth while a piece of debris crosses that orbit ahead. Approving the burn bends the spacecraft's path so it passes clear. A translucent ghost keeps flying the original course into the pass that was avoided.",
  caption: "A schematic of the ghost replay I built, not the simulator itself.",
  legend: {
    craft: "Spacecraft",
    threat: "Debris",
    ghost: "Ghost",
  },
  status: {
    approach: "A close approach is predicted ahead.",
    decision: "The clock is stopped. Approve the burn, or stay on course.",
    burned: "Burn approved. The ghost flies the course not taken.",
    rejected: "Staying on course.",
    avoided: "The ghost flew into the pass. The spacecraft went clear of it.",
    stayed: "Without the burn, the spacecraft flies into the pass.",
  },
  actions: {
    approve: "Approve burn",
    reject: "Stay on course",
    replay: "Replay",
  },
};
