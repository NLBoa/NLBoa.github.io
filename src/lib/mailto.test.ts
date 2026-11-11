import { describe, expect, it } from "vitest";
import { mailto } from "./mailto";

const subject = (name: string) => (name ? `A note from ${name}` : "A note from your site");
const parse = (href: string) => {
  const [address, query] = href.replace(/^mailto:/, "").split("?");
  const fields = Object.fromEntries(query.split("&").map((pair) => pair.split("=").map(decodeURIComponent)));
  return { address, ...fields } as { address: string; subject: string; body?: string };
};

describe("mailto", () => {
  it("addresses the draft and gives it a subject, even when nothing is written", () => {
    expect(parse(mailto("me@example.com", { name: "", note: "" }, subject))).toEqual({ address: "me@example.com", subject: "A note from your site" });
  });

  it("puts the note in the body, signed with the name", () => {
    const draft = parse(mailto("me@example.com", { name: " Ada ", note: "Hello.\nI liked Argus." }, subject));
    expect(draft.subject).toBe("A note from Ada");
    expect(draft.body).toBe("Hello.\r\nI liked Argus.\r\n\r\nAda");
  });

  it("encodes characters that would break the link", () => {
    const href = mailto("me@example.com", { name: "A&B", note: "50% done? yes = good #1" }, subject);
    expect(href).not.toMatch(/[ #]|&B|% /);
    expect(parse(href).body).toBe("50% done? yes = good #1\r\n\r\nA&B");
  });

  it("leaves the address as it is", () => {
    expect(mailto("Noah.leibovitz@outlook.com", { name: "", note: "hi" }, subject).startsWith("mailto:Noah.leibovitz@outlook.com?")).toBe(true);
  });
});
