"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/**
 * One miniature per project, keyed by the project's slug. Each is loaded on
 * its own, so a project's page never downloads another project's miniature,
 * and each is drawn into the page's HTML so it shows without JavaScript.
 *
 * To add one: write `src/miniatures/<slug>/Miniature.tsx` and list it here.
 */
const miniatures: Record<string, ComponentType> = {
  "aegis-orbit": dynamic(() => import("./aegis-orbit/Miniature")),
};

export default function MiniatureSlot({ slug }: { slug: string }) {
  const Miniature = miniatures[slug];
  return Miniature ? <Miniature /> : null;
}
