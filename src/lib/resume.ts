/** "2026-11-16" -> "November 2026" */
export function monthLabel(isoDate: string): string {
  const [year, month] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(Date.UTC(year, month - 1, 1));
}

/** A file's size as a download link shows it: "158 KB", "2.4 MB". */
export function fileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Where a link on the résumé leads, in words, for the link laid over the picture. */
export function linkLabel(href: string): string {
  if (href.startsWith("mailto:")) return `Email ${href.slice("mailto:".length)}`;
  return href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}
