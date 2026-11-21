import Link from "next/link";
import type { CSSProperties } from "react";
import type { Project } from "@/content/types";
import Cover from "@/covers/Cover";

type More = { slug: string; title: string; href: string };

/**
 * The home page on an upright screen (a phone): every project as a button
 * under the desk, which is a banner there. Smaller than the Projects page's
 * tiles: the cover and the title only, so all of them fit on one screen.
 * It is plain HTML, so it is there before the desk has loaded.
 */
export default function HomeTiles({ projects, more }: { projects: Project[]; more?: More }) {
  return (
    <nav className="home-tiles" aria-label="Projects">
      <ul>
        {projects.map((project) => (
          <li key={project.slug}>
            <Link href={`/projects/${project.slug}`} className="home-tile" style={project.accent ? ({ "--accent": project.accent } as CSSProperties) : undefined}>
              <span className="home-tile-art">
                <Cover slug={project.slug} />
              </span>
              <span className="home-tile-title">{project.title}</span>
            </Link>
          </li>
        ))}
        {/* The last tile leads off the site, to the rest of the work. */}
        {more && (
          <li>
            <a href={more.href} className="home-tile" target="_blank" rel="noopener noreferrer">
              <span className="home-tile-art">
                <Cover slug={more.slug} />
              </span>
              <span className="home-tile-title">{more.title}</span>
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
}
