import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { viewForPath } from "./interactive";
import { FLIGHT_MS, OPEN_LEAD_MS, PAGE_LEAD_MS, selectActive, selectView, useScene } from "./store";

const initial = useScene.getState();

/** A router stand-in: records every address and moves the store's path there, as <RouteSync> does. */
function router() {
  const visits: string[] = [];
  useScene.setState({
    navigate: (href) => {
      visits.push(href);
      useScene.getState().setPath(href);
    },
  });
  return visits;
}

beforeEach(() => {
  vi.useFakeTimers();
  useScene.setState({ ...initial, path: "/", synced: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("clicking an object on the desk", () => {
  it("flies there first, then opens the page", () => {
    const visits = router();
    useScene.getState().activate("monitor-left");
    expect(selectView(useScene.getState())).toBe("projects");
    expect(visits).toEqual([]);
    vi.advanceTimersByTime(FLIGHT_MS);
    expect(visits).toEqual(["/projects"]);
    // The camera stays on the monitor while its page is open.
    expect(selectView(useScene.getState())).toBe("projects");
  });

  it("opens the page at once under reduced motion", () => {
    const visits = router();
    useScene.setState({ reducedMotion: true });
    useScene.getState().activate("monitor-right");
    expect(visits).toEqual(["/about"]);
  });

  it("ignores a second click while the camera is on its way", () => {
    const visits = router();
    useScene.getState().activate("key-0");
    // A Stream Deck key springs back long before the flight ends.
    vi.advanceTimersByTime(300);
    expect(useScene.getState().pressed).toBeNull();
    useScene.getState().activate("key-0");
    useScene.getState().activate("monitor-right");
    vi.advanceTimersByTime(FLIGHT_MS * 2);
    expect(visits).toEqual(["/projects/argus"]);
  });

  it("does not drag the visitor back if they went somewhere else during the flight", () => {
    const visits = router();
    useScene.getState().activate("monitor-left");
    vi.advanceTimersByTime(200);
    // A header link, say.
    useScene.getState().setPath("/contact");
    vi.advanceTimersByTime(FLIGHT_MS);
    expect(visits).toEqual([]);
    expect(useScene.getState().path).toBe("/contact");
    expect(useScene.getState().pressed).toBeNull();
  });

  it("works again after coming back to the desk", () => {
    const visits = router();
    useScene.getState().activate("monitor-left");
    vi.advanceTimersByTime(FLIGHT_MS);
    useScene.getState().setPath("/");
    useScene.getState().activate("monitor-right");
    vi.advanceTimersByTime(FLIGHT_MS);
    expect(visits).toEqual(["/projects", "/about"]);
  });
});

describe("making way for the page", () => {
  it("starts before the camera arrives, and before the page is asked for", () => {
    const visits = router();
    useScene.getState().activate("monitor-left");
    vi.advanceTimersByTime(FLIGHT_MS - OPEN_LEAD_MS - 1);
    expect(useScene.getState().opening).toBe(false);
    vi.advanceTimersByTime(1);
    expect(useScene.getState().opening).toBe(true);
    expect(visits).toEqual([]);
    expect(OPEN_LEAD_MS).toBeGreaterThan(PAGE_LEAD_MS);
  });

  it("is over once the page is open", () => {
    const visits = router();
    useScene.getState().activate("monitor-left");
    vi.advanceTimersByTime(FLIGHT_MS - PAGE_LEAD_MS);
    expect(visits).toEqual(["/projects"]);
    expect(useScene.getState().opening).toBe(false);
    // The camera keeps the view it flew to.
    expect(selectView(useScene.getState())).toBe(viewForPath("/projects"));
  });

  it("never starts if the visitor went somewhere else during the flight", () => {
    router();
    useScene.getState().activate("monitor-left");
    vi.advanceTimersByTime(100);
    useScene.getState().setPath("/contact");
    vi.advanceTimersByTime(FLIGHT_MS);
    expect(useScene.getState().opening).toBe(false);
  });

  it("does not happen under reduced motion", () => {
    router();
    useScene.setState({ reducedMotion: true });
    useScene.getState().activate("monitor-left");
    vi.advanceTimersByTime(FLIGHT_MS);
    expect(useScene.getState().opening).toBe(false);
  });
});

describe("the object that is outlined and labeled", () => {
  it("is the hovered one, else the focused one", () => {
    useScene.setState({ focused: "pen-cup" });
    expect(selectActive(useScene.getState())).toBe("pen-cup");
    useScene.setState({ hovered: "monitor-left" });
    expect(selectActive(useScene.getState())).toBe("monitor-left");
  });

  it("is nothing while the camera flies to a clicked object", () => {
    router();
    useScene.setState({ hovered: "monitor-left" });
    useScene.getState().activate("monitor-left");
    // The pointer wanders over something else on the way.
    useScene.getState().setHovered("pen-cup");
    expect(selectActive(useScene.getState())).toBeNull();
  });

  it("is nothing while a page is open", () => {
    useScene.setState({ path: "/about", focused: "monitor-right" });
    expect(selectActive(useScene.getState())).toBeNull();
  });
});

describe("the camera's view for an address", () => {
  it("is the object that opens that page", () => {
    expect(viewForPath("/")).toBe("home");
    expect(viewForPath("/projects")).toBe("projects");
    expect(viewForPath("/projects/argus")).toBe("projects");
    expect(viewForPath("/about")).toBe("about");
    expect(viewForPath("/contact")).toBe("contact");
    // The Résumé key is on the Stream Deck.
    expect(viewForPath("/resume")).toBe("deck");
  });
});
