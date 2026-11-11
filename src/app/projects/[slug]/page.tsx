import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Page from "@/components/Page";
import ProjectStory from "@/components/project/ProjectStory";
import { getProject, projects } from "@/content/projects";
import { asset } from "@/lib/paths";
import "./room.css";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Page not found" };
  return {
    title: project.title,
    description: project.summary,
    openGraph: { title: project.title, description: project.summary },
  };
}

// Only the projects in the content file exist; any other slug is the host's 404 page.
export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  // A project with a story gets the larger layout; the rest keep the short facts page.
  if (project.story) return <ProjectStory project={project} story={project.story} />;

  return (
    <Page back={{ label: "All projects", href: "/projects" }}>
      <h1>{project.title}</h1>
      <p className="lede">{project.summary}</p>

      <dl className="facts">
        {project.role && (
          <>
            <dt>Role</dt>
            <dd>{project.role}</dd>
          </>
        )}
        {project.dates && (
          <>
            <dt>Dates</dt>
            <dd>{project.dates}</dd>
          </>
        )}
        {project.stack.length > 0 && (
          <>
            <dt>Stack</dt>
            <dd>{project.stack.join(", ")}</dd>
          </>
        )}
      </dl>

      {project.built.length > 0 && (
        <section>
          <h2>What I built</h2>
          <ul className="points">
            {project.built.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      )}

      {project.links.length > 0 && (
        <section>
          <h2>Links</h2>
          <ul className="links">
            {project.links.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {project.images.slice(0, 3).map((image) => (
        <Image key={image.src} className="project-image" src={asset(image.src)} alt={image.alt} width={image.width} height={image.height} />
      ))}
    </Page>
  );
}
