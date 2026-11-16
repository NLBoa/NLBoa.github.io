import { describe, expect, it } from "vitest";
import { resume } from "@/content/resume";
import { fileSize, linkLabel, monthLabel } from "./resume";

describe("résumé page helpers", () => {
  it("names the month a date falls in", () => {
    expect(monthLabel("2026-11-16")).toBe("November 2026");
    expect(monthLabel("2027-01-01")).toBe("January 2027");
  });

  it("gives a file's size the way a download link shows it", () => {
    expect(fileSize(161880)).toBe("158 KB");
    expect(fileSize(900)).toBe("1 KB");
    expect(fileSize(2.4 * 1024 * 1024)).toBe("2.4 MB");
  });

  it("says in words where a link on the page leads", () => {
    expect(linkLabel("mailto:someone@example.com")).toBe("Email someone@example.com");
    expect(linkLabel("http://www.linkedin.com/in/someone/")).toBe("linkedin.com/in/someone");
    expect(linkLabel("https://github.com/someone")).toBe("github.com/someone");
  });
});

describe("the résumé's data (written by npm run assets:resume)", () => {
  it("has a PDF and at least one page", () => {
    expect(resume.file).toMatch(/^\/resume\/.+\.pdf$/);
    expect(resume.bytes).toBeGreaterThan(0);
    expect(resume.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(resume.pages.length).toBeGreaterThan(0);
  });

  it("keeps every link inside its page", () => {
    for (const page of resume.pages) {
      expect(page.lines.length).toBeGreaterThan(0);
      for (const link of page.links) {
        expect(link.href).toMatch(/^(https?:|mailto:)/);
        expect(link.left).toBeGreaterThanOrEqual(0);
        expect(link.top).toBeGreaterThanOrEqual(0);
        expect(link.left + link.width).toBeLessThanOrEqual(1);
        expect(link.top + link.height).toBeLessThanOrEqual(1);
      }
    }
  });
});
