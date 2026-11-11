"use client";

import Link from "next/link";
import { useEffect, type MouseEvent } from "react";
import { featuredProjects } from "@/content/projects";
import { INTERACTIVES, byId } from "./interactive";
import { selectActive, useScene } from "./store";

/** The small text label beside the hovered or focused object. The scene positions it. */
export function SceneLabel() {
  const active = useScene(selectActive);
  const onDesk = useScene((s) => s.path === "/" && !s.flight);
  const hovering = useScene((s) => s.hovered !== null && s.path === "/");
  const item = active ? byId.get(active) : undefined;

  useEffect(() => {
    document.body.style.cursor = hovering ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovering]);

  return (
    <div id="scene-label" className="scene-label" data-visible={Boolean(item && onDesk)} aria-hidden="true">
      {item?.label}
    </div>
  );
}

/**
 * A real link for every object on the desk, in Tab order, so the scene works
 * from the keyboard and with a screen reader. Focusing one outlines and
 * labels its object; Enter activates it like a click.
 */
export function Hotspots() {
  const setFocused = useScene((s) => s.setFocused);
  const activate = useScene((s) => s.activate);

  const fly = (id: string) => (event: MouseEvent) => {
    // Leave modified clicks (new tab, new window) to the browser.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    activate(id);
  };

  return (
    <nav className="hotspots" aria-label="On the desk">
      {INTERACTIVES.map((item) =>
        item.external || item.href.endsWith(".pdf") ? (
          <a
            key={item.id}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            onFocus={() => setFocused(item.id)}
            onBlur={() => setFocused(null)}
          >
            {item.label} (opens in a new tab)
          </a>
        ) : (
          <Link
            key={item.id}
            href={item.href}
            onFocus={() => setFocused(item.id)}
            onBlur={() => setFocused(null)}
            onClick={fly(item.id)}
          >
            {item.label}
          </Link>
        ),
      )}
    </nav>
  );
}

/**
 * Phones only: the featured projects as plain links in the space under the
 * desk, because the Stream Deck's keys are too small to tap there.
 */
export function Dock() {
  const ready = useScene((s) => s.ready);
  return (
    <nav className="dock" aria-label="Featured projects" data-ready={ready}>
      <ul>
        {featuredProjects.map((project) => (
          <li key={project.slug}>
            <Link href={`/projects/${project.slug}`}>
              <span className="project-title">{project.title}</span>
              <span className="project-summary">{project.summary}</span>
            </Link>
          </li>
        ))}
        <li className="dock-more">
          <Link href="/projects">All projects</Link>
          <Link href="/credits">Credits</Link>
        </li>
      </ul>
    </nav>
  );
}
