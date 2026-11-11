import { DATES_PLACEHOLDER, type About } from "./types";

/**
 * Sources: the starter facts in the build prompt, and the GitHub profile
 * (github.com/NLBoa): its card (profile.toml) and its README. Nothing here
 * is invented; gaps are TODO(noah).
 */
export const about: About = {
  name: "Noah Leibovitz",
  // The prompt name on the GitHub profile card.
  handle: "noah@leibovitz",
  intro: [
    "Computer science (AI specialization) and business double major at the University of Maryland, class of 2029.",
  ],
  // From the profile card ("open to SWE internships"). TODO(noah): confirm, and say which term.
  status: "Open to software engineering internships",
  education: {
    school: "University of Maryland",
    classOf: 2029,
    studies: ["Computer science (AI specialization)", "Business"],
    honors: ["Presidential Scholar", "Kappa Theta Pi"],
  },
  experience: [
    {
      company: "Gulf Coast Estate Care",
      title: "Software engineering intern",
      // TODO(noah): dates
      dates: DATES_PLACEHOLDER,
      // The company is pre-launch: show no usage numbers.
      // The scheduling engine is described as in the profile README. TODO(noah): confirm this wording.
      summary:
        "I build the C# scheduling engine, which tracks each employee's capacity across three license tiers and books recurring contracts all-or-nothing. I also worked on Azure billing automation and a LoRaWAN sensor dashboard.",
      points: ["Azure billing automation.", "A LoRaWAN sensor dashboard."],
      links: [{ label: "Scheduling engine demo", href: "https://github.com/NLBoa/GulfCoastEstatesSchedulingDemo" }],
    },
    {
      company: "Seven Simple Machines (7SM)",
      // TODO(noah): title, dates
      title: null,
      dates: DATES_PLACEHOLDER,
      // TODO(noah): confirm this wording.
      summary: "I designed a Figma prototype of a dashboard for the Dynamis platform and presented it to the CEO.",
      points: ["A Figma prototype for the Dynamis platform, presented to the CEO."],
      note: "Fintech",
    },
  ],
  // The profile README's toolbox, plus what the projects on this site are built with.
  // A tool that a project's stack names links to that project.
  toolbox: [
    {
      name: "Languages",
      tools: ["Python", "TypeScript", "JavaScript", "Java", "C#", { name: "SQL", match: ["SQL", "SQLite", "PostgreSQL"] }, "HTML/CSS"],
    },
    {
      name: "Web and backend",
      tools: ["React", "Next.js", "Svelte", "FastAPI", "Node.js", { name: ".NET / Razor Pages", match: ["Razor Pages", ".NET"] }],
    },
    { name: "Hardware", tools: ["Raspberry Pi", "Zigbee", "MQTT"] },
    { name: "Data and ML", tools: ["pandas", "NumPy", "Matplotlib", "XGBoost"] },
    { name: "Tools", tools: ["Git", "Docker", "Azure", "Google Cloud", "Tailscale", "MCP", "JUnit"] },
  ],
  // From the profile card's "Hobbies". TODO(noah): you planned to write this section yourself; replace these lines when you do.
  outsideOfCode: ["Outdoors: skiing, scuba diving, running and traveling.", "Indoors: ping pong, and sleeping."],
};
