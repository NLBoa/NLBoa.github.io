import { create } from "zustand";
import { asset } from "@/lib/paths";
import { byId, viewForPath, type View } from "./interactive";

/** How long the camera takes to reach a clicked object. */
export const FLIGHT_MS = 700;
/**
 * How long before the flight ends the scene starts making way for the page: the screens go
 * dark and the scrim comes up. The picture on a monitor and the page that replaces it are
 * alike but never line up, so they must not be on screen together.
 */
export const OPEN_LEAD_MS = 200;
/**
 * How long before the flight ends the page itself is asked for. A page takes a few frames to
 * arrive and then fades in, so asked for only at the end it leaves the dark screen empty for
 * a moment. By now the screen has all but dimmed (Monitors.tsx), and the camera's last few
 * pixels of travel finish behind the scrim.
 */
export const PAGE_LEAD_MS = 80;
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
  /** The last stretch of a flight: the clicked object's page is about to open (see OPEN_LEAD_MS). */
  opening: boolean;
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
  opening: false,
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
      // The page is here, or the visitor went elsewhere: either way nothing is about to open.
      opening: false,
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
      if (get().flight === flight) set({ opening: true });
    }, FLIGHT_MS - OPEN_LEAD_MS);
    setTimeout(() => {
      set({ pressed: null });
      // The visitor may have gone somewhere else meanwhile (a header link, Back): then this
      // flight is over and its page must not open on top of where they went.
      if (get().flight === flight) get().navigate(item.href);
    }, FLIGHT_MS - PAGE_LEAD_MS);
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
