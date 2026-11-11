import { contact } from "@/content/contact";
import { projects } from "@/content/projects";
import { deckKeys, type DeckKey } from "@/lib/deck";
import { MONITOR, MONITORS, PEN_CUP, STREAM_DECK, streamDeckBodyY, type Vec3 } from "./layout";

/**
 * Where the camera can be. `deck` is only used while flying to a pressed key;
 * `story` is the room beside an open project page (see band.ts).
 */
export type View = "home" | "projects" | "about" | "contact" | "deck" | "story";

export type Interactive = {
  id: string;
  label: string;
  href: string;
  external: boolean;
  /** The camera eases here when the object is activated. */
  view: View;
  /** World position the hover label hangs from. */
  anchor: Vec3;
};

export const DECK: (DeckKey | null)[] = deckKeys(projects, contact);

/** World position of a Stream Deck key's center. */
export function keyPosition(index: number): Vec3 {
  const [lx, ly, lz] = STREAM_DECK.keys[index].local;
  const c = Math.cos(STREAM_DECK.tilt);
  const s = Math.sin(STREAM_DECK.tilt);
  return [
    STREAM_DECK.position[0] + lx,
    streamDeckBodyY() + ly * c - lz * s,
    STREAM_DECK.position[2] + ly * s + lz * c,
  ];
}

const monitorTop = (index: number): Vec3 => [
  MONITORS[index].position[0],
  MONITORS[index].position[1] + MONITOR.body.height / 2 + 0.03,
  MONITORS[index].position[2],
];

/**
 * Everything on the desk that reacts, in Tab order: the two monitors, the
 * lit Stream Deck keys, then the pen cup. The keyboard and trackpad are
 * decoration and are not here.
 */
export const INTERACTIVES: Interactive[] = [
  { id: "monitor-left", label: "Projects", href: "/projects", external: false, view: "projects", anchor: monitorTop(0) },
  { id: "monitor-right", label: "About", href: "/about", external: false, view: "about", anchor: monitorTop(1) },
  ...DECK.flatMap((key, index): Interactive[] => {
    if (!key) return [];
    // Labels hang above the Stream Deck's top edge so they never cover a key.
    const [x] = keyPosition(index);
    const [, y, z] = keyPosition(0);
    return [{ id: `key-${index}`, label: key.label, href: key.href, external: key.external, view: "deck", anchor: [x, y + 0.024, z - 0.008] }];
  }),
  {
    id: "pen-cup",
    label: "Contact",
    href: "/contact",
    external: false,
    view: "contact",
    anchor: [PEN_CUP.position[0], PEN_CUP.height + 0.085, PEN_CUP.position[2]],
  },
];

export const byId = new Map(INTERACTIVES.map((item) => [item.id, item]));

/** Which view a URL belongs to. Direct loads use this, with no fly-in. */
export function viewForPath(path: string): View {
  if (path === "/projects" || path.startsWith("/projects/")) return "projects";
  if (path === "/about") return "about";
  if (path === "/contact") return "contact";
  return "home";
}
