import type { Project } from "./types";

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
    dates: null,
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
  },
  {
    slug: "smart-display",
    // TODO(noah): confirm this is the same project as "Pi home hub" in the
    // build prompt (Raspberry Pi 4B home device controlling Zigbee light
    // switches). The prompt says the barcode scanner is planned; the GitHub
    // README lists it as built.
    title: "Smart Display",
    summary: "Touchscreen home board for our apartment, running full screen on a Raspberry Pi.",
    // TODO(noah): role wording (built with two roommates)
    role: null,
    // TODO(noah): dates
    dates: null,
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
  },
  {
    slug: "jupiterp",
    // TODO(noah): Jupiterp is featured on GitHub but was not in the build
    // prompt's list. Confirm it belongs here, and whether it is related to
    // TerpScheduler below.
    title: "Jupiterp",
    summary: "Open-source course scheduler for University of Maryland students, live at jupiterp.com.",
    role: "Open-source contributor",
    // TODO(noah): dates
    dates: null,
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
  },
  {
    slug: "aegis-orbit",
    // TODO(noah): confirm the description. The build prompt says "a web
    // visualization of Earth with satellites and debris in orbit"; this entry
    // follows the fuller GitHub README. Confirm the event (Technica 2026).
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
    // TODO(noah): up to three images
    images: [],
    featured: true,
  },
  {
    slug: "skibus",
    title: "SKIBUS",
    summary: "A check-in system in C#, Razor Pages and SQL that ran for four years with real users.",
    // TODO(noah): exact title for the leadership role
    role: "Leadership role",
    // TODO(noah): dates
    dates: null,
    stack: ["C#", "Razor Pages", "SQL"],
    // TODO(noah): what I built. The GitHub README has numbers (roughly 10x
    // faster check-in, 180+ person-trips, a 5-person team, 4 seasons). Say
    // whether to use them.
    built: [],
    links: [],
    images: [],
    featured: false,
  },
  {
    slug: "terpscheduler",
    title: "TerpScheduler",
    summary: "A UMD course-scheduling app with a campus map that shows walking routes between buildings.",
    // TODO(noah): role, dates, stack, what I built, links
    role: null,
    dates: null,
    stack: [],
    built: [],
    links: [],
    images: [],
    featured: false,
  },
  {
    slug: "campuseats",
    // TODO(noah): what it does, stack. Also confirm the event: the GitHub
    // README lists the Bitcamp project as "UMD event feed"
    // (BitcampCloudforceProj), not CampusEats.
    title: "CampusEats",
    summary: "A team project from the Bitcamp 2026 hackathon.",
    role: null,
    dates: "Bitcamp 2026",
    stack: [],
    built: [],
    links: [],
    images: [],
    featured: false,
  },
  {
    slug: "shell",
    title: "Shell",
    summary: "A shell written in Java, with builtins, quoting, pipelines, redirection and background jobs.",
    // TODO(noah): role, dates
    role: null,
    dates: null,
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
    dates: null,
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
