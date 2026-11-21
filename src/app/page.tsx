import HomeTiles from "@/components/HomeTiles";
import ProjectList from "@/components/ProjectList";
import { about } from "@/content/about";
import { contact } from "@/content/contact";
import { moreProjects, projects } from "@/content/projects";

/**
 * Home. With WebGL the desk is the page and this index stays hidden; without
 * it (or before the script runs) this Projects index is what the visitor sees.
 * On an upright screen the desk is a banner and the tiles sit under it
 * (home.css).
 */
export default function Home() {
  return (
    <main className="home">
      {/* Shown only if the desk takes a moment to arrive. */}
      <p className="home-loading" role="status">
        Setting up the desk
      </p>
      <div className="home-index">
        <h1>{about.name}</h1>
        <p className="lede">{about.intro[0]}</p>
        <h2>Projects</h2>
        <ProjectList projects={projects} />
      </div>
      <HomeTiles projects={projects} more={contact.github ? { ...moreProjects, href: contact.github } : undefined} />
    </main>
  );
}
