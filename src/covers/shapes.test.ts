import { describe, expect, it } from "vitest";
import { projects } from "@/content/projects";
import { COVER, covers } from "./shapes";

describe("covers", () => {
  it("exist for every project on the site", () => {
    for (const project of projects) expect(covers[project.slug], project.slug).toBeDefined();
  });

  it("are made of real paths with a fill or a stroke", () => {
    for (const [slug, shapes] of Object.entries(covers)) {
      expect(shapes.length, slug).toBeGreaterThan(2);
      for (const shape of shapes) {
        expect(shape.d, slug).toMatch(/^M[-\d.]/);
        expect(shape.d, slug).not.toMatch(/NaN|undefined/);
        expect(Boolean(shape.fill) || Boolean(shape.stroke), slug).toBe(true);
      }
    }
  });

  it("use the project's own color", () => {
    for (const [slug, shapes] of Object.entries(covers)) {
      expect(shapes.some((s) => s.fill === "accent" || s.stroke === "accent"), slug).toBe(true);
    }
  });

  it("start inside the drawing", () => {
    for (const [slug, shapes] of Object.entries(covers)) {
      for (const shape of shapes) {
        const [, x, y] = shape.d.match(/^M(-?[\d.]+) (-?[\d.]+)/)!;
        expect(Number(x), slug).toBeGreaterThanOrEqual(-60);
        expect(Number(x), slug).toBeLessThanOrEqual(COVER.width + 10);
        expect(Number(y), slug).toBeLessThanOrEqual(COVER.height + 160);
      }
    }
  });
});
