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
    // TODO(noah): up to three images
    images: [],
    featured: true,
    icon: "orbit",
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
