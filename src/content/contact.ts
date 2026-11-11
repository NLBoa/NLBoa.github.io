import type { Contact } from "./types";

/** Email, GitHub and LinkedIn are the ones on the GitHub profile README. */
export const contact: Contact = {
  email: "Noah.leibovitz@outlook.com",
  github: "https://github.com/NLBoa",
  linkedin: "https://www.linkedin.com/in/noah-leibovitz-879751294/",
  // TODO(noah): résumé PDF (put it in public/ and set the path here)
  resume: null,
  // From the GitHub profile card ("open to SWE internships"). TODO(noah): confirm, and say which term.
  status: "Open to software engineering internships",
  // The University of Maryland is on US Eastern time. TODO(noah): confirm you are happy to show your local time.
  timeZone: { id: "America/New_York", name: "US Eastern time" },
};
