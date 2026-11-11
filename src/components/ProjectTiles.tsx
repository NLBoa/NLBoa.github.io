import Link from "next/link";
import type { CSSProperties } from "react";
import type { Project } from "@/content/types";
import Cover from "@/covers/Cover";

/**
 * The projects as large buttons: the grid the left monitor shows, at full
 * size. Each tile carries the project's cover, in the project's own color.
 */
export default function ProjectTiles({ projects }: { projects: Project[] }) {
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
    </ul>
  );
}
