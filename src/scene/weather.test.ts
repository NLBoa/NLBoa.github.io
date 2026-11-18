import { describe, expect, it } from "vitest";
import { REST_AFTER_MS, restDelay } from "./weather";

describe("restDelay", () => {
  it("never rests the weather on the desk", () => {
    expect(restDelay(null, "/")).toBeNull();
    expect(restDelay("/projects", "/")).toBeNull();
  });

  it("waits for the page to arrive when it is opened from the desk", () => {
    expect(restDelay("/", "/projects")).toBe(REST_AFTER_MS);
    expect(restDelay("/", "/projects/argus")).toBe(REST_AFTER_MS);
  });

  it("rests at once on a page loaded directly or reached from another page", () => {
    expect(restDelay(null, "/about")).toBe(0);
    expect(restDelay("/projects", "/projects/argus")).toBe(0);
    expect(restDelay("/projects/argus", "/projects")).toBe(0);
  });

  it("waits longer than the page's own fade-in (0.4 s)", () => {
    expect(REST_AFTER_MS).toBeGreaterThan(400);
  });
});
