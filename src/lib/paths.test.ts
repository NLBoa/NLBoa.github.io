import { describe, expect, it } from "vitest";
import { normalizePath, sitePath } from "./paths";

describe("normalizePath", () => {
  it("drops a trailing slash but keeps the home page", () => {
    expect(normalizePath("/about/")).toBe("/about");
    expect(normalizePath("/about")).toBe("/about");
    expect(normalizePath("/")).toBe("/");
  });
});

describe("sitePath", () => {
  it("is the address itself when the site has no base path", () => {
    expect(sitePath("/", "")).toBe("/");
    expect(sitePath("/projects/argus/", "")).toBe("/projects/argus");
  });

  it("takes the base path off", () => {
    expect(sitePath("/portfolio/", "/portfolio")).toBe("/");
    expect(sitePath("/portfolio", "/portfolio")).toBe("/");
    expect(sitePath("/portfolio/about/", "/portfolio")).toBe("/about");
  });

  it("leaves an address that only looks like the base path", () => {
    expect(sitePath("/portfolio-old/about", "/portfolio")).toBe("/portfolio-old/about");
  });
});
