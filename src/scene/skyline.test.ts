import { describe, expect, it } from "vitest";
import { CITY_SIZE, SIGN_BAND, buildCity } from "./skyline";

describe("the city outside the window", () => {
  const city = buildCity();

  it("is the same city every time", () => {
    expect(buildCity()).toEqual(city);
    expect(buildCity(7)).not.toEqual(city);
  });

  it("covers the whole width with towers at both distances", () => {
    for (const row of [city.far, city.near]) {
      expect(row[0].x).toBeLessThanOrEqual(0);
      const last = row[row.length - 1];
      expect(last.x + last.width).toBeGreaterThanOrEqual(CITY_SIZE);
    }
  });

  it("never overlaps two near towers, and never leaves a gap much wider than a tower", () => {
    for (let i = 1; i < city.near.length; i++) {
      const gap = city.near[i].x - (city.near[i - 1].x + city.near[i - 1].width);
      expect(gap).toBeGreaterThanOrEqual(-0.11);
      expect(gap).toBeLessThan(125);
    }
  });

  it("has rooftops at many heights, so there is a skyline wherever the window looks", () => {
    const tops = city.near.map((tower) => tower.top);
    expect(tops.some((top) => top < 0.38 * CITY_SIZE)).toBe(true);
    expect(tops.some((top) => top > 0.5 * CITY_SIZE)).toBe(true);
    expect(tops.every((top) => top < 0.7 * CITY_SIZE)).toBe(true);
  });

  it("hangs every sign on a near tower's face, in the band most windows see", () => {
    expect(city.signs.length).toBeGreaterThanOrEqual(3);
    for (const sign of city.signs) {
      const tower = city.near.find((t) => sign.x >= t.x && sign.x + sign.width <= t.x + t.width);
      expect(tower).toBeDefined();
      expect(sign.y).toBeGreaterThanOrEqual(SIGN_BAND[0]);
      expect(sign.y + sign.height).toBeLessThanOrEqual(SIGN_BAND[1]);
    }
    expect(city.signs.filter((sign) => sign.flicker).length).toBeLessThanOrEqual(2);
  });

  it("puts each advert on a tower that carries no sign", () => {
    for (const board of city.boards) {
      const tower = city.near.find((t) => board.x >= t.x && board.x + board.width <= t.x + t.width);
      expect(tower).toBeDefined();
      expect(city.signs.some((sign) => sign.x >= tower!.x && sign.x <= tower!.x + tower!.width)).toBe(false);
    }
  });

  it("flies cars at both distances, in both directions, through the band a laptop sees", () => {
    expect(city.cars.some((car) => car.lane === "far")).toBe(true);
    expect(city.cars.some((car) => car.lane === "near")).toBe(true);
    expect(city.cars.some((car) => car.reverse)).toBe(true);
    for (const car of city.cars) {
      // A 16:10 window shows the city from 18.75 to 81.25.
      expect(car.top).toBeGreaterThan(19);
      expect(car.top).toBeLessThan(80);
      expect(car.offset).toBeLessThan(car.seconds);
    }
  });

  it("gives every tower a window pattern that exists", () => {
    for (const tower of [...city.far, ...city.near]) expect(city.tiles[tower.windows]).toBeDefined();
    for (const tile of city.tiles) expect(tile.cells.length).toBeGreaterThan(4);
  });
});
