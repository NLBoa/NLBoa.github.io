import { describe, expect, it } from "vitest";
import type { Contact, Project } from "@/content/types";
import { DECK_KEY_COUNT, deckKeys } from "./deck";

const project = (slug: string, featured: boolean, extra: Partial<Project> = {}): Project => ({
  slug,
  title: slug.toUpperCase(),
  summary: "",
  role: null,
  dates: null,
  stack: [],
  built: [],
  links: [],
  images: [],
  featured,
  ...extra,
});

const contact: Contact = { email: "a@b.c", github: "https://github.com/x", linkedin: "https://linkedin.com/in/x", resume: null };

describe("deckKeys", () => {
  it("always returns 15 keys", () => {
    expect(deckKeys([], contact)).toHaveLength(DECK_KEY_COUNT);
    expect(deckKeys(Array.from({ length: 30 }, (_, i) => project(`p${i}`, true)), contact)).toHaveLength(DECK_KEY_COUNT);
  });

  it("orders featured projects first, then About, Contact, Résumé, GitHub, LinkedIn", () => {
    const keys = deckKeys([project("a", true), project("b", false), project("c", true)], contact);
    expect(keys.slice(0, 7).map((k) => k?.label)).toEqual(["A", "C", "About", "Contact", "Résumé", "GitHub", "LinkedIn"]);
    expect(keys.slice(7).every((k) => k === null)).toBe(true);
  });

  it("links projects to their pages and marks outside links", () => {
    const keys = deckKeys([project("argus", true)], contact);
    expect(keys[0]).toMatchObject({ href: "/projects/argus", external: false });
    expect(keys[4]).toMatchObject({ label: "GitHub", external: true });
  });

  it("points Résumé at the contact page until a PDF exists", () => {
    expect(deckKeys([], contact)[2]).toMatchObject({ label: "Résumé", href: "/contact" });
    expect(deckKeys([], { ...contact, resume: "/resume.pdf" })[2]).toMatchObject({ href: "/resume.pdf" });
  });

  it("leaves out GitHub and LinkedIn keys when there is no link", () => {
    const keys = deckKeys([], { ...contact, github: null, linkedin: null });
    expect(keys.filter(Boolean).map((k) => k?.label)).toEqual(["About", "Contact", "Résumé"]);
  });

  it("never drops the fixed keys, however many projects are featured", () => {
    const keys = deckKeys(Array.from({ length: 30 }, (_, i) => project(`p${i}`, true)), contact);
    expect(keys.filter((k) => k?.href.startsWith("/projects/"))).toHaveLength(10);
    expect(keys[14]?.label).toBe("LinkedIn");
  });

  it("uses the project's icon, or its first letter", () => {
    const keys = deckKeys([project("argus", true, { icon: "eye" }), project("shell", true)], contact);
    expect(keys[0]?.icon).toBe("eye");
    expect(keys[1]?.icon).toEqual({ letter: "S" });
  });
});
