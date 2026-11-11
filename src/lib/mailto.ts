export type Draft = {
  /** Who the note is from. May be empty. */
  name: string;
  /** The note itself. May be empty. */
  note: string;
};

/** Mail apps expect CRLF line breaks in a mailto body. */
const encode = (text: string) => encodeURIComponent(text.replace(/\r?\n/g, "\r\n"));

/**
 * A mailto link that opens a draft in the visitor's own mail app, with the
 * note as its body. Nothing is sent by the site itself.
 */
export function mailto(to: string, { name, note }: Draft, subjectFor: (name: string) => string): string {
  const from = name.trim();
  const body = note.trim();
  const parts = [`subject=${encode(subjectFor(from))}`];
  if (body || from) parts.push(`body=${encode([body, from].filter(Boolean).join("\n\n"))}`);
  return `mailto:${to}?${parts.join("&")}`;
}
