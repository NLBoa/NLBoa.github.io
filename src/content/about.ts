import type { About } from "./types";

export const about: About = {
  name: "Noah Leibovitz",
  intro: [
    "Computer science (AI specialization) and business double major at the University of Maryland, class of 2029.",
  ],
  education: {
    school: "University of Maryland",
    classOf: 2029,
    studies: ["Computer science (AI specialization)", "Business"],
    // TODO(noah): confirm "Presidential Scholar" (build prompt) vs
    // "President's Scholar" (GitHub README).
    honors: ["Presidential Scholar", "Kappa Theta Pi"],
  },
  experience: [
    {
      company: "Gulf Coast Estate Care",
      title: "Software engineering intern",
      // TODO(noah): dates
      dates: null,
      points: ["Azure billing automation.", "A LoRaWAN sensor dashboard."],
      // The company is pre-launch: show no usage numbers.
    },
    {
      company: "Seven Simple Machines (7SM)",
      // TODO(noah): title, dates
      title: null,
      dates: null,
      points: ["A Figma prototype for the Dynamis platform, presented to the CEO."],
      note: "Fintech",
    },
  ],
  // TODO(noah): I'll write this section myself.
  outsideOfCode: null,
};
