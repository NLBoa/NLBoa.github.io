import type { Contact, KeyIcon, Project } from "@/content/types";

export const DECK_KEY_COUNT = 15;

export type DeckKey = {
  label: string;
  href: string;
  /** Opens in a new tab instead of a page on this site. */
  external: boolean;
  /** An icon, or a single letter to show instead. */
  icon: KeyIcon | { letter: string };
};

/**
 * The Stream Deck's 15 keys, generated from the content files in this order:
 * featured projects, then About, Contact, Résumé, GitHub, LinkedIn.
 * Unused keys are `null` and stay dark.
 */
export function deckKeys(projects: Project[], contact: Contact): (DeckKey | null)[] {
  const fixed: DeckKey[] = [
    { label: "About", href: "/about", external: false, icon: "person" },
    { label: "Contact", href: "/contact", external: false, icon: "envelope" },
    // Until a PDF exists the Résumé key opens the contact page.
    { label: "Résumé", href: contact.resume ?? "/contact", external: false, icon: "document" },
  ];
  if (contact.github) fixed.push({ label: "GitHub", href: contact.github, external: true, icon: "branch" });
  if (contact.linkedin) fixed.push({ label: "LinkedIn", href: contact.linkedin, external: true, icon: "briefcase" });

  const featured: DeckKey[] = projects
    .filter((project) => project.featured)
    .slice(0, DECK_KEY_COUNT - fixed.length)
    .map((project) => ({
      label: project.title,
      href: `/projects/${project.slug}`,
      external: false,
      icon: project.icon ?? { letter: project.title.charAt(0).toUpperCase() },
    }));

  const keys: (DeckKey | null)[] = [...featured, ...fixed];
  while (keys.length < DECK_KEY_COUNT) keys.push(null);
  return keys;
}
