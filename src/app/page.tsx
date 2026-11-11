import { about } from "@/content/about";
import { projects } from "@/content/projects";

/**
 * The home page's HTML is the Projects index. With WebGL the desk scene sits
 * on top of it; without WebGL this is what the visitor sees.
 */
export default function Home() {
  return (
    <main className="page">
      <h1>{about.name}</h1>
      <p>{about.intro[0]}</p>
      <h2>Projects</h2>
      <ul className="project-list">
        {projects.map((project) => (
          <li key={project.slug}>
            <strong>{project.title}</strong>
            <span>{project.summary}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
