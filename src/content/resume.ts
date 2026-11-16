import data from "./resume-data.json";

/**
 * The résumé. Everything here is written by `npm run assets:resume` from the
 * PDF: do not edit resume-data.json by hand. To publish a new résumé, run
 *
 *   npm run assets:resume -- "/path/to/Resume.pdf"
 */
export type ResumeLink = {
  href: string;
  /** Where the link sits on its page, as fractions of the page's width and height. */
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ResumePage = {
  /** The page as a picture, under public/. */
  image: string;
  width: number;
  height: number;
  links: ResumeLink[];
  /** The page's text, line by line. */
  lines: string[];
};

export type Resume = {
  /** The PDF, under public/. */
  file: string;
  /** The name a download gets. */
  fileName: string;
  bytes: number;
  /** The day the PDF was last saved, as YYYY-MM-DD. */
  updated: string;
  pages: ResumePage[];
};

export const resume: Resume = data;

/** The résumé's page on this site. */
export const RESUME_PATH = "/resume";
