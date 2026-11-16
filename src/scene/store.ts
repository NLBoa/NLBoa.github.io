import { create } from "zustand";
import { asset } from "@/lib/paths";
import { byId, viewForPath, type View } from "./interactive";

/** How long the camera takes to reach an object before its page opens. */
export const FLIGHT_MS = 700;
/** How long a Stream Deck key stays down. */
const KEY_PRESS_MS = 180;

type SceneState = {
  /** Current URL path, kept in step by <RouteSync>. */
  path: string;
  /** False until the first real path is known, so the camera never starts in the wrong place. */
  synced: boolean;
  /** Set while (and after) flying to a clicked object, until the URL moves on. */
  flight: { view: View; href: string } | null;
  hovered: string | null;
  focused: string | null;
  /** A Stream Deck key that is being pressed. */
  pressed: string | null;
  /** Everything has loaded and the first frame is drawn. */
  ready: boolean;
  /** 0..1 strength of the first-load pulse on every interactive object. */
  pulse: number;
  reducedMotion: boolean;
  /** The camera has come to rest on the room beside an open project page (set by <CameraRig>). */
  beside: boolean;
  /** Provided by <RouteSync>, so the 3D layer can change routes. */
  navigate: (href: string) => void;

  setPath: (path: string) => void;
  setHovered: (id: string | null) => void;
  setFocused: (id: string | null) => void;
  activate: (id: string) => void;
};

export const useScene = create<SceneState>((set, get) => ({
  path: "/",
  synced: false,
  flight: null,
  hovered: null,
  focused: null,
  pressed: null,
  ready: false,
  pulse: 0,
  reducedMotion: false,
  beside: false,
  navigate: () => {},

  setPath: (path) =>
    set((state) => ({
      path,
      // The flight's view holds while its own page is open, then lets go.
      flight: state.flight && state.flight.href === path ? state.flight : null,
      hovered: null,
    })),

  setHovered: (hovered) => set({ hovered }),
  setFocused: (focused) => set({ focused }),

  activate: (id) => {
    const item = byId.get(id);
    const state = get();
    // One thing at a time: nothing else can be pressed until this click's page has opened.
    if (!item || state.pressed || (state.flight && state.path !== state.flight.href)) return;

    const isKey = id.startsWith("key-");
    const release = () => set({ pressed: null });

    if (item.external) {
      window.open(asset(item.href), "_blank", "noopener,noreferrer");
      if (isKey) {
        set({ pressed: id });
        setTimeout(release, KEY_PRESS_MS);
      }
      return;
    }

    if (state.reducedMotion) {
      // Cut straight to the page: no flight.
      state.navigate(item.href);
      return;
    }

    const flight = { view: item.view, href: item.href };
    set({ flight, pressed: id, hovered: null });
    if (isKey) setTimeout(release, KEY_PRESS_MS);
    setTimeout(() => {
      set({ pressed: null });
      // The visitor may have gone somewhere else meanwhile (a header link, Back): then this
      // flight is over and its page must not open on top of where they went.
      if (get().flight === flight) get().navigate(item.href);
    }, FLIGHT_MS);
  },
}));

/** Where the camera should be right now. */
export const selectView = (state: SceneState): View => state.flight?.view ?? viewForPath(state.path);

/**
 * The object to outline and label: hover wins over keyboard focus. Only on the
 * desk, and not while the camera is flying to something that was just clicked.
 */
export const selectActive = (state: SceneState): string | null =>
  state.path === "/" && !state.flight ? (state.hovered ?? state.focused) : null;
