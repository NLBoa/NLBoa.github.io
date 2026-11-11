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

export const argusMiniature = {
  label: "Schematic of the Argus work queue",
  description:
    "A queue of five pieces of coursework, ranked by when each is due. Under it, tonight's work window is filled from the top of the queue. A post that moves an exam date re-ranks the queue, and finishing the first task takes it off.",
  caption: "A schematic with made-up coursework, not the real dashboard.",
  heading: "Queue",
  collected: "Collected from",
  sources: { canvas: "Canvas", gradescope: "Gradescope", piazza: "Piazza" },
  /** The made-up coursework, by task id. */
  tasks: {
    homework: { title: "Homework 3", course: "CMSC351" },
    "problem-set": { title: "Problem Set 6", course: "MATH240" },
    quiz: { title: "Quiz 2", course: "CMSC351" },
    essay: { title: "Essay draft", course: "ENGL393" },
    exam: { title: "Midterm 2", course: "MATH240" },
  } as Record<string, { title: string; course: string }>,
  due: (days: number) => (days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`),
  effort: (minutes: number) => (minutes % 60 === 0 ? `${minutes / 60} h` : minutes > 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`),
  window: "Tonight's work window",
  status: {
    synced: "Everything collected is ranked into one queue, soonest first.",
    moved: "A post on Piazza moved Midterm 2 to tomorrow. It climbs the queue.",
    finished: "Homework 3 is done, so it leaves the queue and the window is refilled.",
  },
  actions: {
    synced: "A post moves a deadline",
    moved: "Finish the first task",
    finished: "Start over",
  },
};

export const smartDisplayMiniature = {
  label: "Schematic of the home board's widget layout",
  description:
    "A home board with four widgets on a grid: a clock, Spotify, Lights and Grocery. In arrange mode each widget can be dragged to a new place and resized from its corner, and it only lands where it fits.",
  caption: "A schematic of the layout, not the real board. The widgets' contents are placeholders.",
  widgets: { clock: "Clock", spotify: "Spotify", lights: "Lights", grocery: "Grocery" } as Record<string, string>,
  light: (n: number) => `Light ${n}`,
  resize: (name: string) => `Resize ${name}`,
  /** Read out for a widget in arrange mode. */
  widgetHelp: (name: string) => `${name} widget. Arrow keys move it. Shift and an arrow key resize it.`,
  legend: { mine: "Widgets I built", other: "The rest of the board" },
  status: {
    idle: "Tap a light to switch it. Arrange the widgets to move and resize them.",
    arranging: "Drag a widget to move it. Drag its corner to resize it.",
    moved: (name: string) => `${name} moved.`,
    resized: (name: string, w: number, h: number) => `${name} is now ${w} by ${h}.`,
    blocked: "It does not fit there.",
  },
  actions: { arrange: "Arrange widgets", done: "Done", reset: "Reset" },
};

export const jupiterpMiniature = {
  label: "Schematic of the Course Planner syncing into the Schedule Generator",
  description:
    "Two panels. The Course Planner lists five sample courses, two of them planned. The Schedule Generator lists the same two courses and draws them on a week. Planning or dropping a course in the planner changes the generator at once.",
  caption: "A schematic with sample courses, not the real site. The blocks are not real meeting times.",
  planner: "Course Planner",
  plannerHint: "Choose the courses you plan to take",
  generator: "Schedule Generator",
  generatorHint: "Filled in from the plan",
  empty: "No courses planned",
  days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  courses: { c1: "CMSC131", c2: "MATH140", c3: "ENGL101", c4: "BMGT110", c5: "STAT100" } as Record<string, string>,
  status: {
    idle: "Plan or drop a course in the planner. The generator follows.",
    added: (course: string) => `${course} is planned, so the generator has it too.`,
    removed: (course: string) => `${course} is off the plan, so the generator dropped it.`,
  },
};

export const skibusMiniature = {
  label: "Schematic of check-in and boarding",
  description:
    "A list of ten riders beside a bus with ten seats. Each rider is still to come, checked in, or aboard. Checking a rider in marks their seat, and boarding fills it.",
  caption: "A schematic with made-up riders, not the real system's screens.",
  rider: (n: number) => `Rider ${String(n).padStart(2, "0")}`,
  states: { waiting: "Still to come", checked: "Checked in", aboard: "Aboard" },
  status: {
    start: "Nobody has arrived yet. Check riders in, then board them.",
    progress: (checked: number, aboard: number, waiting: number) =>
      `${checked} checked in, ${aboard} aboard, ${waiting} still to come.`,
    full: "Everyone is aboard. The bus can leave.",
  },
  actions: { checkIn: "Check in next", board: "Board next", reset: "Start over" },
};

export const shellMiniature = {
  label: "A replayed session in the shell",
  description:
    "A terminal that replays a session one feature at a time: builtin commands, quoting, a pipeline, output redirection, and a background job.",
  caption: "A replay of a session, not a working shell.",
  prompt: "$",
  /**
   * The session. Each group shows one feature from the README.
   * TODO(noah): check that each output matches what your shell prints.
   */
  script: [
    {
      id: "builtins",
      entries: [
        { command: "echo hello from my shell", output: ["hello from my shell"] },
        { command: "type echo", output: ["echo is a shell builtin"] },
      ],
    },
    {
      id: "quoting",
      entries: [{ command: `echo 'two  spaces' "and \\"quotes\\""`, output: [`two  spaces and "quotes"`] }],
    },
    {
      id: "pipeline",
      entries: [{ command: "echo hello | tr a-z A-Z", output: ["HELLO"] }],
    },
    {
      id: "redirection",
      entries: [
        { command: "echo first > notes.txt", output: [] },
        { command: "echo second >> notes.txt", output: [] },
        { command: "cat notes.txt", output: ["first", "second"] },
      ],
    },
    {
      id: "jobs",
      entries: [
        { command: "sleep 30 &", output: ["[1] 84470"] },
        { command: "jobs", output: ["[1]+  Running                 sleep 30 &"] },
      ],
    },
  ],
  status: {
    builtins: "Builtins: echo and type run inside the shell itself.",
    quoting: "Quoting: single quotes are literal, and a backslash escapes a double quote.",
    pipeline: "A pipeline: the output of echo becomes the input of tr.",
    redirection: "Redirection: > writes a file and >> appends to it.",
    jobs: "Background jobs: & returns the prompt at once, and jobs lists what is running.",
  } as Record<string, string>,
  actions: { next: "Run the next command", skip: "Skip the typing", restart: "Start over" },
};
