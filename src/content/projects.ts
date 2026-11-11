import { DATES_PLACEHOLDER, type Project } from "./types";

/**
 * Sources: the starter facts in the build prompt, and the "Featured work"
 * section of the GitHub profile README (github.com/NLBoa), which decides
 * `featured`. Each `story` is a draft from that project's own README, read
 * 2026-11-10. Nothing here is invented; gaps are TODO(noah).
 * TODO(noah): read each story draft and correct anything that is off.
 */
export const projects: Project[] = [
  {
    slug: "argus",
    title: "Argus",
    summary: "Always-on course hub that runs on a Raspberry Pi 4B.",
    // TODO(noah): role (solo project?)
    role: null,
    // TODO(noah): dates
    dates: DATES_PLACEHOLDER,
    stack: ["Python", "SQLite", "Raspberry Pi", "MCP", "Tailscale"],
    built: [
      "Pulls deadlines, announcements and course materials from Canvas, Gradescope, Piazza and umd.io.",
      "Estimates the effort, ranks the work into a queue for my work windows, and reminds me by text.",
      "Deadline alerts are deterministic and never depend on AI.",
      "A read-only MCP server lets my AI planner read the collected deadlines to plan my week.",
      "The dashboard is reachable from anywhere over Tailscale.",
    ],
    links: [{ label: "GitHub", href: "https://github.com/NLBoa/Argus" }],
    // From the repository's visual tests, which run on made-up demo data.
    // TODO(noah): confirm these two screenshots may be used here.
    images: [
      {
        src: "/projects/argus/today.webp",
        alt: "The Argus dashboard's Today page: a task being worked on, one past due, and the work due today, tomorrow and later in the week, each with a course, an estimate and a risk label.",
        caption: "The Today page, shown with demo data.",
        width: 1280,
        height: 1388,
      },
    ],
    featured: true,
    icon: "eye",
    // Raspberry: it runs on a Raspberry Pi.
    accent: "#e8759a",
    // Drafted from the README and CLAUDE.md of github.com/NLBoa/Argus.
    story: {
      about: [
        "Argus is a personal course hub for one student that never switches off. It runs on a Raspberry Pi 4B and pulls deadlines, announcements and course materials from Canvas, Gradescope, Piazza and umd.io.",
        "It estimates how long each piece of work should take, ranks the work into a queue for the hours I have set aside, and reminds me by text. Each deadline also becomes a task in FlowSavvy, my calendar planner, which fits the work into free time and moves it when something changes.",
      ],
      note: "Deadline alerts are deterministic and never depend on AI.",
      // TODO(noah): confirm the order and wording of these steps.
      how: [
        { title: "Collect", text: "Every minute, one collector per source fetches what is new." },
        { title: "Read posts", text: "Dates announced in posts are applied, or held for me to confirm." },
        { title: "Estimate", text: "Each item gets an estimate of the effort, which I can override." },
        { title: "Plan", text: "The work is ranked into a queue and split across my work windows." },
        { title: "Remind", text: "Rules decide what to send and when. It goes by SMS, or ntfy as a fallback." },
        { title: "Schedule", text: "My AI planner reads the deadlines and schedules the work in FlowSavvy." },
      ],
      partsTitle: "What I built",
      parts: [
        {
          title: "From deadline to calendar",
          // TODO(noah): confirm this description of the FlowSavvy hand-off.
          text: "Each morning my AI planner reads what Argus has collected through a read-only MCP server and turns every deadline into a task in FlowSavvy, with its due date and Argus's estimate. FlowSavvy fits the work into my free time. When an assignment is posted or a date moves, the task changes and the week is fitted again. The connector returns deadlines and links only: never grades, scores or submissions.",
        },
        {
          title: "The queue",
          text: "Argus works out the time left on each item, the load and the risk, and ranks everything into one queue. Each work window gets its own share of that queue, and the Workload page shows where the work due outgrows the time I have.",
          image: {
            src: "/projects/argus/workload.webp",
            alt: "The Argus Workload page: a chart of work due against work-window time over the next 14 days, with the stretch where the work outgrows the time shaded, above a list of the tasks that need attention.",
            caption: "The Workload page, shown with demo data.",
            width: 1280,
            height: 1449,
          },
        },
        {
          title: "Alerts that never depend on AI",
          text: "What to send, and when, is decided by plain rules. Each reminder is sent once, and a moved due date arms its reminders again. I can answer a text, too: replying DONE marks a task finished.",
        },
        {
          title: "A dashboard on my own devices",
          text: "The dashboard is served over Tailscale, so I can open it from anywhere, and only from devices on my own network.",
        },
      ],
      team: null,
    },
  },
  {
    slug: "smart-display",
    // Same project as "Pi home hub" in the build prompt (confirmed by Noah).
    title: "Smart Display",
    summary: "Touchscreen home board for our apartment, running full screen on a Raspberry Pi.",
    // TODO(noah): role wording (built with two roommates)
    role: null,
    // TODO(noah): dates
    dates: DATES_PLACEHOLDER,
    stack: ["Python", "JavaScript", "Raspberry Pi", "Zigbee/MQTT", "Spotify API"],
    built: [
      "Zigbee lighting: pairing, schedules, motion-sensor control and low-battery alerts.",
      "The Spotify widget.",
      "The Sports page with live scores, line-ups and a game-day countdown.",
      "The barcode-scan grocery list.",
      "The layout that lets you move and resize widgets.",
      "A standard-library Python server and plain HTML/CSS/JS, with no build step.",
    ],
    links: [
      { label: "GitHub", href: "https://github.com/Sheel2007/OMEGA-WB" },
      { label: "Zigbee setup", href: "https://github.com/NLBoa/zigbee_ceiling" },
    ],
    // TODO(noah): up to three images (the repository has no screenshots)
    images: [],
    featured: true,
    icon: "bulb",
    // The board's wallpaper follows the real sky; this is its daytime blue.
    accent: "#7cc4f5",
    // Drafted from the READMEs of github.com/Sheel2007/OMEGA-WB and github.com/NLBoa/zigbee_ceiling.
    story: {
      about: [
        "A shared board for our apartment that runs full screen on a Raspberry Pi and looks like a tablet's home screen: a big clock, widgets, and every app a swipe away. I built it with two roommates.",
        "Everything runs on what ships with Raspberry Pi OS: a small Python server that uses only the standard library, and plain HTML, CSS and JavaScript. There is nothing to install and no build step.",
      ],
      howTitle: "How a tap reaches a ceiling light",
      // TODO(noah): confirm this chain for the board (it follows the zigbee_ceiling README).
      how: [
        { title: "Tap", text: "Someone taps a light on the board's Lights widget." },
        { title: "Broker", text: "The request becomes a message to Mosquitto, the MQTT broker." },
        { title: "Bridge", text: "Zigbee2MQTT turns the MQTT message into a Zigbee one." },
        { title: "Radio", text: "A USB dongle, the Zigbee coordinator, sends it over the air." },
        { title: "Switch", text: "The ceiling switch flips and reports its new state back." },
      ],
      parts: [
        {
          title: "Zigbee lighting",
          text: "Pairing, schedules, motion-sensor control and low-battery alerts. Tap a light to switch it, or set times for lights to go on and off by themselves.",
        },
        {
          title: "Movable, resizable widgets",
          text: "The home screen has pages you swipe between, and you can arrange and resize the widgets yourself.",
        },
        {
          title: "Spotify widget",
          text: "Shows what is playing on the household account: the cover in a circle with the song's name under it. It starts as a slim one-column widget beside the clock, and grows to show the artist, the album and how far through the song it is.",
        },
        {
          title: "Sports page",
          text: "Live scores, the line-ups drawn on a pitch, and on a game day a strip under the clock that counts down to kickoff and then shows the score through the match.",
        },
        {
          title: "Barcode grocery list",
          text: "Scan a product's barcode or QR code with your phone, or search for it, and it goes on the list with its price, how many, and who is asking.",
        },
      ],
      // TODO(noah): name your roommates and what each built, if you want them credited.
      team: "Built with two roommates. The parts above are the ones I built.",
    },
  },
  {
    slug: "jupiterp",
    title: "Jupiterp",
    // "Used each semester": Noah's own account (2026-11-11). TODO(noah): a figure from the maintainers would make this stronger; none is published.
    summary: "Open-source course scheduler that University of Maryland students use each semester to plan their classes, live at jupiterp.com.",
    role: "Open-source contributor",
    // The pull request was merged on 2026-10-31 (from GitHub). TODO(noah): confirm this wording.
    dates: "Merged October 2026",
    stack: ["Svelte", "TypeScript", "Open source"],
    built: [
      "My merged contribution syncs the Course Planner into the Schedule Generator.",
      "The courses a student has planned fill in the generator automatically and stay in step as the plan changes, so nobody re-enters them.",
    ],
    links: [
      { label: "Pull request", href: "https://github.com/atcupps/Jupiterp/pull/975" },
      { label: "Live site", href: "https://jupiterp.com" },
    ],
    // TODO(noah): up to three images (a screenshot of the planner and generator would fit)
    images: [],
    featured: true,
    icon: "planet",
    // Jupiter's orange.
    accent: "#f2a154",
    // Drafted from the pull request (github.com/atcupps/Jupiterp/pull/975) and the profile README.
    story: {
      about: [
        // Noah's own account of its reach. TODO(noah): replace with a figure if the maintainers have one.
        "Every semester, when it is time to pick classes, a large share of Maryland's students do it in Jupiterp.",
        "It is an open-source site for planning a schedule: students search for courses, compare sections alongside professor reviews from PlanetTerp, and see their week laid out. It is live at jupiterp.com.",
      ],
      howTitle: "How the sync works",
      how: [
        { title: "Plan", text: "A student adds courses in the Course Planner." },
        { title: "Fill", text: "The planned courses appear in the Schedule Generator by themselves." },
        { title: "Follow", text: "When the plan changes, the generator's list changes with it, replacing courses added or removed there by hand." },
      ],
      partsTitle: "My contribution",
      parts: [
        {
          title: "Planner to generator sync",
          text: "Jupiterp has a Course Planner, where a student lists the courses they plan to take, and a Schedule Generator. My pull request takes the courses from the planner and fills them into the generator, so students do not have to add them twice. It changed six files, passed the project's checks, lint and tests, and was merged.",
        },
        {
          title: "Who it reaches",
          text: "Because so many Maryland students build their schedules in Jupiterp each semester, a change to it reaches all of them. Mine removes a step every one of them used to repeat.",
        },
      ],
      team: null,
    },
  },
  {
    slug: "aegis-orbit",
    // Description follows the GitHub README (confirmed by Noah).
    title: "Aegis Orbit",
    summary: "Hackathon team project: a satellite collision-avoidance simulator.",
    // TODO(noah): role wording
    role: null,
    dates: "Technica 2026",
    stack: ["React", "TypeScript", "CesiumJS", "FastAPI", "XGBoost"],
    built: [
      "The catalog-explorer home page: live globe, search and filters, loading states.",
      "The sandbox flight-deck HUD.",
      "The \"ghost\" replays that show the collision a burn avoided.",
    ],
    links: [
      { label: "GitHub", href: "https://github.com/KingXaney/Aegis-Orbit-" },
      { label: "Live demo", href: "https://aegis-orbit-liart.vercel.app" },
    ],
    // From the project's README. TODO(noah): confirm these two screenshots may be used here.
    images: [
      {
        src: "/projects/aegis-orbit/mission-agent.webp",
        alt: "The mission simulator: a globe with the spacecraft's path, a panel with the agent's recommendation, and a close-up of the spacecraft.",
        caption: "The mission simulator during a critical close approach, with the agent's recommendation.",
        width: 1600,
        height: 900,
      },
    ],
    featured: true,
    icon: "orbit",
    // The teal the simulator uses for the spacecraft's planned path.
    accent: "#45d0bf",
    // Drafted from the README (github.com/KingXaney/Aegis-Orbit-), read 2026-11-10.
    // TODO(noah): read this draft and correct anything that is off.
    story: {
      about: [
        "Aegis Orbit is an interactive simulator for keeping a satellite clear of debris. It predicts close approaches, plans avoidance burns and explains its recommendation, and a person approves or rejects each simulated maneuver on a 3D globe.",
        "Underneath, a Python physics engine propagates real and synthetic orbits, screens them for close approaches, and re-checks every candidate burn for new risks before it is offered.",
      ],
      note: "A research and simulation prototype. Positions are estimates from public orbital data or synthetic states, and no spacecraft is commanded.",
      // TODO(noah): confirm the order and wording of these steps.
      how: [
        { title: "Track", text: "Public orbital data is loaded and every orbit is computed forward." },
        { title: "Rank", text: "An XGBoost model scores every catalog object in milliseconds." },
        { title: "Screen", text: "Physics checks the flagged objects for close approaches." },
        { title: "Plan", text: "Candidate burns are searched, then each is re-checked for new risks." },
        { title: "Explain", text: "An agent explains the threat and the options from logged tool results." },
        { title: "Approve", text: "A person approves the simulated burn, and a ghost flies the course not taken." },
      ],
      parts: [
        {
          title: "Catalog explorer",
          text: "The home page. Every tracked object is drawn on a live globe and propagated in the browser, with search, filters by type, orbit class and operator, a details card on click, and loading states.",
          image: {
            src: "/projects/aegis-orbit/home.webp",
            alt: "The catalog explorer: a globe surrounded by thousands of tracked objects, one satellite's orbit drawn across it, and a list of that satellite's upcoming close approaches.",
            width: 1600,
            height: 900,
          },
        },
        {
          title: "Sandbox flight-deck HUD",
          // TODO(noah): say which parts of the sandbox screen were yours.
          text: "The heads-up display for the live sandbox, where the clock never stops, you drop space junk onto the orbit, and an autopilot plans and flies the dodge burns.",
        },
        {
          title: "Ghost replays",
          text: "Every approved burn leaves a translucent ghost of the spacecraft flying the course it did not take. The clock slows before the pass the burn avoided, and a warning shows what would have happened.",
        },
      ],
      // TODO(noah): teammates, team size and who built what (GitHub lists three contributors).
      // TODO(noah): any result or prize at Technica.
      // TODO(noah): should the README's figures (18,598-object catalog, ROC-AUC 0.966) appear? They describe the team's model.
      team: null,
    },
  },
  {
    slug: "shell",
    title: "Shell",
    summary: "A shell written in Java, with builtins, quoting, pipelines, redirection and background jobs.",
    // TODO(noah): role, dates
    role: null,
    dates: DATES_PLACEHOLDER,
    stack: ["Java"],
    built: [],
    links: [{ label: "GitHub", href: "https://github.com/NLBoa/Java-Shell" }],
    images: [],
    featured: false,
    // The green of a terminal prompt.
    accent: "#8fdc8a",
    // Drafted from the README of github.com/NLBoa/Java-Shell.
    story: {
      about: [
        "A POSIX-style shell written from scratch in Java, as part of the CodeCrafters \"Build Your Own Shell\" challenge.",
        "It reads commands at a prompt, parses them, and runs them either as builtins or as external programs, with pipelines, redirection and background jobs.",
      ],
      how: [
        { title: "Read", text: "The prompt reads a line." },
        { title: "Split", text: "The tokenizer splits it, honoring single quotes, double quotes and backslashes." },
        { title: "Find", text: "Each command is a builtin, or a program looked up on PATH." },
        { title: "Run", text: "Programs start through ProcessBuilder, with pipes and redirections connecting their streams." },
        { title: "Report", text: "Before the next prompt, background jobs that have finished are reported once." },
      ],
      partsTitle: "What I built",
      parts: [
        { title: "Builtins", text: "echo, type, jobs and exit run inside the shell itself." },
        {
          title: "Quoting and escaping",
          text: "Single quotes are fully literal. Inside double quotes a backslash escapes only a double quote, a backslash, a dollar sign, a backtick or a newline. Outside quotes it escapes the next character.",
        },
        {
          title: "Pipelines",
          text: "A pipe feeds one command's output to the next, with builtins or external programs on either side.",
        },
        {
          title: "Redirection",
          text: "Standard output can be written to a file or appended to it, and so can errors. Only the stream you redirect is affected.",
        },
        {
          title: "Background jobs",
          text: "A trailing & runs a command in the background. Job numbers start at 1 and are reused, and a finished job is reported exactly once.",
        },
      ],
      team: null,
    },
  },
  {
    slug: "mid",
    title: "MID",
    summary: "A style-discovery web app in Next.js and TypeScript. Early stage.",
    // TODO(noah): role, dates, what I built, links
    role: null,
    dates: DATES_PLACEHOLDER,
    stack: ["Next.js", "TypeScript"],
    built: [],
    links: [],
    images: [],
    featured: false,
    accent: "#b9a2f7",
    // The repository (github.com/NLBoa/mid-makeitdistinct) holds only the scaffold so far, so there is
    // no miniature: there is nothing built to draw. TODO(noah): what MID does, and whether to link the repository.
    story: {
      about: [
        "MID is at an early stage. The repository, its checks and its docs are set up, and the first feature is still to come.",
      ],
      how: [],
      parts: [],
      team: null,
    },
  },
];

/**
 * Off the site for now, at Noah's request (2026-11-11). Nothing links to these
 * and no page is built for them. To bring one back, move its entry into
 * `projects` above. SKIBUS's miniature is still in src/miniatures/skibus.
 */
export const parkedProjects: Project[] = [
  {
    slug: "skibus",
    title: "SKIBUS",
    summary: "Check-in and boarding system in C#, Razor Pages and SQL that ran for four years with real users.",
    role: "Led a 5-person student team over 4 seasons",
    // TODO(noah): dates
    dates: DATES_PLACEHOLDER,
    stack: ["C#", "Razor Pages", "SQL"],
    built: [
      "Cut student check-in time roughly 10x across 180+ person-trips.",
      "Led a 5-person student team over 4 seasons.",
    ],
    links: [],
    // TODO(noah): up to three images
    images: [],
    featured: false,
    // School-bus yellow.
    accent: "#f0cf4f",
    // Only what the profile README says. The SKIBUS repositories are private, so nothing is taken from them.
    // TODO(noah): what it replaced, how check-in and boarding worked, who used it, and screenshots.
    story: {
      about: [
        "SKIBUS is a check-in and boarding system written in C#, Razor Pages and SQL. It ran for four seasons with real users.",
      ],
      how: [],
      parts: [
        {
          title: "Faster check-in",
          text: "Student check-in time fell roughly 10x across 180+ person-trips.",
        },
        {
          title: "Leading the team",
          text: "I led a 5-person student team over 4 seasons.",
        },
      ],
      team: null,
    },
  },
];

export const featuredProjects = projects.filter((p) => p.featured);

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
