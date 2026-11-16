import type { Contact } from "./types";

/** Email and GitHub are the ones on the GitHub profile README; LinkedIn is the address on the résumé (Noah, 2026-11-16). */
export const contact: Contact = {
  email: "noah.leibovitz@outlook.com",
  github: "https://github.com/NLBoa",
  linkedin: "https://www.linkedin.com/in/noah-leibovitz/",
  // From the GitHub profile card ("open to SWE internships"). TODO(noah): confirm, and say which term.
  status: "Open to software engineering internships",
  // The University of Maryland is on US Eastern time. TODO(noah): confirm you are happy to show your local time.
  timeZone: { id: "America/New_York", name: "US Eastern time" },
};
