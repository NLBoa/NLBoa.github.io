import { describe, expect, it } from "vitest";
import { about } from "@/content/about";
import { projects } from "@/content/projects";
import type { Project } from "@/content/types";
import { projectsUsing, toolName } from "./toolbox";

const project = (slug: string, stack: string[]) => ({ slug, stack }) as Project;
const sample = [project("a", ["Python", "SQLite"]), project("b", ["Zigbee/MQTT", "Python"]), project("c", ["Next.js"])];
const slugs = (list: Project[]) => list.map((p) => p.slug);

describe("projectsUsing", () => {
  it("finds the projects whose stack names the tool", () => {
    expect(slugs(projectsUsing("Python", sample))).toEqual(["a", "b"]);
    expect(slugs(projectsUsing("Next.js", sample))).toEqual(["c"]);
  });

  it("ignores case, and matches whole names only", () => {
    expect(slugs(projectsUsing("python", sample))).toEqual(["a", "b"]);
    expect(slugs(projectsUsing("Java", [project("x", ["JavaScript"])]))).toEqual([]);
  });

  it("treats a slash in a stack entry as two names", () => {
    expect(slugs(projectsUsing("MQTT", sample))).toEqual(["b"]);
    expect(slugs(projectsUsing("Zigbee", sample))).toEqual(["b"]);
  });

  it("uses a tool's other names", () => {
    expect(slugs(projectsUsing({ name: "SQL", match: ["SQL", "SQLite"] }, sample))).toEqual(["a"]);
  });
});

describe("the toolbox on the About page", () => {
  const tools = about.toolbox.flatMap((group) => group.tools);

  it("names every tool once", () => {
    const all = tools.map(toolName);
    expect(new Set(all).size).toBe(all.length);
  });

  it("links several tools to real projects", () => {
    const linked = tools.filter((tool) => projectsUsing(tool, projects).length > 0).map(toolName);
    expect(linked).toEqual(expect.arrayContaining(["Python", "TypeScript", "Java", "React", "Raspberry Pi", "SQL", "MQTT"]));
  });
});
