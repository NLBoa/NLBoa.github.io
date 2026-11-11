import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import Page from "@/components/Page";
import type {
  Project,
  ProjectImage,
  ProjectStory as Story,
} from "@/content/types";
import { asset } from "@/lib/paths";
import MiniatureSlot from "@/miniatures/MiniatureSlot";
import ProjectPager from "./ProjectPager";

function Shot({ image }: { image: ProjectImage }) {
  return (
    <figure className="shot">
      <Image
        src={asset(image.src)}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes="(max-width: 64rem) 100vw, 47rem"
      />
      {image.caption && <figcaption>{image.caption}</figcaption>}
    </figure>
  );
}

/** A heading in the left column with its content beside it. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="story">
      <h2>{title}</h2>
      <div className="story-body">{children}</div>
    </section>
  );
}

/**
 * A project told as a story: what it is, how it works, the parts I built.
 * It opens with the project's miniature and uses the project's own color.
 */
export default function ProjectStory({
  project,
  story,
}: {
  project: Project;
  story: Story;
}) {
  const facts = [project.role, project.dates].filter(Boolean);
  const style = project.accent
    ? ({ "--accent": project.accent } as CSSProperties)
    : undefined;

  return (
    <Page
      back={{ label: "All projects", href: "/projects" }}
      className="project"
      style={style}
    >
      <header className="project-head">
        <h1>{project.title}</h1>
        <div className="project-intro">
          <p className="lede">{project.summary}</p>
          {facts.length > 0 && (
            <ul className="project-facts">
              {facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          )}
          {project.links.length > 0 && (
            <ul className="links project-links">
              {project.links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      <MiniatureSlot slug={project.slug} />

      <Section title="What it is">
        {story.about.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {story.note && <p className="story-note">{story.note}</p>}
      </Section>

      {story.how.length > 0 && (
        <section className="story story-wide">
          <h2>How it works</h2>
          <ol className="flow">
            {story.how.map((step) => (
              <li key={step.title}>
                <span className="flow-title">{step.title}</span>
                <span className="flow-text">{step.text}</span>
              </li>
            ))}
          </ol>
          {project.images.slice(0, 3).map((image) => (
            <Shot key={image.src} image={image} />
          ))}
        </section>
      )}

      {story.parts.length > 0 && (
        <Section title="My part">
          {story.parts.map((part) => (
            <article className="part" key={part.title}>
              <h3>{part.title}</h3>
              <p>{part.text}</p>
              {part.image && <Shot image={part.image} />}
            </article>
          ))}
        </Section>
      )}

      {story.team && (
        <Section title="The team">
          <p>{story.team}</p>
        </Section>
      )}

      {project.stack.length > 0 && (
        <Section title="Built with">
          <p className="project-stack">{project.stack.join(", ")}</p>
        </Section>
      )}

      <ProjectPager slug={project.slug} />
    </Page>
  );
}
