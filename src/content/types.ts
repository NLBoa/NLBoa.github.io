/**
 * Content types. All site copy lives in src/content/, never in components.
 * `null` means "not known yet": the page leaves that part out, and the gap is
 * tracked by a `TODO(noah)` comment next to it.
 */

export type Link = { label: string; href: string };

export type ProjectImage = { src: string; alt: string; width: number; height: number; caption?: string };

/** One step of "How it works". The steps are a real sequence. */
export type StoryStep = { title: string; text: string };

/** One piece of the project that I built. */
export type StoryPart = { title: string; text: string; image?: ProjectImage };

/**
 * A project told as a story instead of a list. A project with a story gets
 * the larger page layout; one without renders the short facts page.
 */
export type ProjectStory = {
  /** What the project is, one paragraph per entry. */
  about: string[];
  /** A caveat that belongs with the description. */
  note?: string;
  how: StoryStep[];
  parts: StoryPart[];
  /** Who else worked on it and who did what. */
  team: string | null;
};

/** The one-color icons a Stream Deck key can show. */
export type KeyIcon =
  | "eye"
  | "bulb"
  | "planet"
  | "orbit"
  | "person"
  | "envelope"
  | "document"
  | "branch"
  | "briefcase";

export type Project = {
  slug: string;
  title: string;
  /** One line. */
  summary: string;
  role: string | null;
  dates: string | null;
  stack: string[];
  /** What I built, one point per entry. */
  built: string[];
  links: Link[];
  /** Up to three. */
  images: ProjectImage[];
  /** Featured projects get a Stream Deck key, in the order listed. */
  featured: boolean;
  /** Icon on that key. Without one the key shows the title's first letter. */
  icon?: KeyIcon;
  /** The project's own color, used only on its page. */
  accent?: string;
  story?: ProjectStory;
};

export type Experience = {
  company: string;
  title: string | null;
  dates: string | null;
  points: string[];
  note?: string;
};

export type About = {
  name: string;
  intro: string[];
  education: {
    school: string;
    classOf: number;
    studies: string[];
    honors: string[];
  };
  experience: Experience[];
  /** The "Outside of code" section, #outside-code. */
  outsideOfCode: string[] | null;
};

export type Contact = {
  email: string | null;
  github: string | null;
  linkedin: string | null;
  /** Path under public/, for example "/resume.pdf". */
  resume: string | null;
};

/** Shown wherever a date is still missing; each use has a TODO(noah) beside it. */
export const DATES_PLACEHOLDER = "Dates to be added";
