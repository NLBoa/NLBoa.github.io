import { DATES_PLACEHOLDER, type Project } from "./types";

/**
 * Sources: the starter facts in the build prompt, and the "Featured work"
 * section of the GitHub profile README (github.com/NLBoa), which decides
 * `featured`. Nothing here is invented; gaps are TODO(noah).
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
    // TODO(noah): up to three images
    images: [],
    featured: true,
    icon: "eye",
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
    // TODO(noah): up to three images
    images: [],
    featured: true,
    icon: "bulb",
  },
  {
    slug: "jupiterp",
    title: "Jupiterp",
    summary: "Open-source course scheduler for University of Maryland students, live at jupiterp.com.",
    role: "Open-source contributor",
    // TODO(noah): dates
    dates: DATES_PLACEHOLDER,
    stack: ["Svelte", "TypeScript", "Open source"],
    built: [
      "My merged contribution syncs the Course Planner into the Schedule Generator.",
      "The courses a student has planned fill in the generator automatically and stay in step as the plan changes, so nobody re-enters them.",
    ],
    links: [
      { label: "Pull request", href: "https://github.com/atcupps/Jupiterp/pull/975" },
      { label: "Live site", href: "https://jupiterp.com" },
    ],
    // TODO(noah): up to three images
    images: [],
    featured: true,
    icon: "planet",
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
  },
];

export const featuredProjects = projects.filter((p) => p.featured);

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
