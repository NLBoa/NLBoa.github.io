import ProjectList from "@/components/ProjectList";
import { about } from "@/content/about";
import { projects } from "@/content/projects";

/**
 * Home. With WebGL the desk is the page and this index stays hidden; without
 * it (or before the script runs) this Projects index is what the visitor sees.
 */
export default function Home() {
  return (
    <main className="home">
      <div className="home-index">
        <h1>{about.name}</h1>
        <p className="lede">{about.intro[0]}</p>
        <h2>Projects</h2>
        <ProjectList projects={projects} />
      </div>
    </main>
  );
}
