/**
 * Content types. All site copy lives in src/content/, never in components.
 * `null` means "not known yet": the page leaves that part out, and the gap is
 * tracked by a `TODO(noah)` comment next to it.
 */

export type Link = { label: string; href: string };

export type ProjectImage = { src: string; alt: string };

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
