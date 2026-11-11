import Image from "next/image";
import { notFound } from "next/navigation";
import Page from "@/components/Page";
import { getProject, projects } from "@/content/projects";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

// Every project is prerendered through generateStaticParams, so the page
// reads its slug before rendering anything. That keeps an unknown slug a real
// 404 (under Suspense it would stream a 200), at the cost of opting this
// segment out of Next's instant-navigation validation.
export const instant = false;

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

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
        <Image key={image.src} className="project-image" src={image.src} alt={image.alt} width={image.width} height={image.height} />
      ))}
    </Page>
  );
}
