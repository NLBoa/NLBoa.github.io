import Link from "next/link";
import type { Project } from "@/content/types";

export default function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <ul className="project-list">
      {projects.map((project) => (
        <li key={project.slug}>
          <Link href={`/projects/${project.slug}`}>
            <span className="project-title">{project.title}</span>
            <span className="project-summary">{project.summary}</span>
            {project.stack.length > 0 && <span className="project-stack">{project.stack.join(", ")}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
