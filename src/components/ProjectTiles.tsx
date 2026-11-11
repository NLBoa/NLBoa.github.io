import Link from "next/link";
import type { CSSProperties } from "react";
import type { Project } from "@/content/types";
import Cover from "@/covers/Cover";

/**
 * The projects as large buttons: the grid the left monitor shows, at full
 * size. Each tile carries the project's cover, in the project's own color.
 */
type More = { slug: string; title: string; summary: string; href: string; where: string };

export default function ProjectTiles({ projects, more }: { projects: Project[]; more?: More }) {
  return (
    <ul className="tiles">
      {projects.map((project) => (
        <li key={project.slug}>
          <Link href={`/projects/${project.slug}`} className="tile" style={project.accent ? ({ "--accent": project.accent } as CSSProperties) : undefined}>
            <span className="tile-art">
              <Cover slug={project.slug} />
            </span>
            <span className="tile-text">
              <span className="tile-title">{project.title}</span>
              <span className="tile-summary">{project.summary}</span>
              {project.stack.length > 0 && <span className="tile-stack">{project.stack.join(", ")}</span>}
            </span>
          </Link>
        </li>
      ))}
      {/* The last tile leads off the site, to the rest of the work. */}
      {more && (
        <li>
          <a href={more.href} className="tile tile-more" target="_blank" rel="noopener noreferrer">
            <span className="tile-art">
              <Cover slug={more.slug} />
            </span>
            <span className="tile-text">
              <span className="tile-title">{more.title}</span>
              <span className="tile-summary">{more.summary}</span>
              <span className="tile-stack">{more.where}</span>
            </span>
          </a>
        </li>
      )}
    </ul>
  );
}
