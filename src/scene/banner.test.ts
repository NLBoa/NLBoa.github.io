import { describe, expect, it } from "vitest";
import { bannerClear } from "./banner";

describe("bannerClear", () => {
  it("keeps the header's 3rem and the fade's 1rem, as fractions of the banner, on an upright window", () => {
    expect(bannerClear(390, 660, 332)).toEqual({ top: 48 / 332, bottom: 16 / 332 });
    expect(bannerClear(768, 1024, 653)).toEqual({ top: 48 / 653, bottom: 16 / 653 });
  });

  it("follows the visitor's text size", () => {
    expect(bannerClear(390, 660, 400, 20)).toEqual({ top: 60 / 400, bottom: 20 / 400 });
  });

  it("is nothing on a wide window, where the desk fills the window", () => {
    expect(bannerClear(1440, 900, 900)).toEqual({ top: 0, bottom: 0 });
    expect(bannerClear(844, 390, 390)).toEqual({ top: 0, bottom: 0 });
  });

  it("counts a square window as upright, like the stylesheet", () => {
    expect(bannerClear(600, 600, 300).top).toBeGreaterThan(0);
  });

  it("leaves most of a very short banner to the desk, and survives no banner at all", () => {
    expect(bannerClear(320, 400, 60)).toEqual({ top: 0.3, bottom: 0.1 });
    expect(bannerClear(390, 660, 0)).toEqual({ top: 0, bottom: 0 });
  });
});
