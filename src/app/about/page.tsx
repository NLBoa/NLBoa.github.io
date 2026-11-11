import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Page from "@/components/Page";
import ProfileCard from "@/components/about/ProfileCard";
import Toolbox, { type ToolboxGroup } from "@/components/about/Toolbox";
import { about } from "@/content/about";
import { contact } from "@/content/contact";
import { projects } from "@/content/projects";
import { asset } from "@/lib/paths";
import { projectsUsing, toolName } from "@/lib/toolbox";
import "./about.css";

export const metadata: Metadata = {
  title: "About",
  description: about.intro[0],
};

// Maryland red, as on the GitHub profile card.
const ACCENT = "#ff6b78";

/** The right monitor's screen, at full size: the profile card, then the detail. */
export default function About() {
  const { education, experience, outsideOfCode } = about;

  // Which projects on this site are built with each tool: worked out here, so it is in the page's HTML.
  const groups: ToolboxGroup[] = about.toolbox.map((group) => ({
    name: group.name,
    tools: group.tools.map((tool) => ({
      name: toolName(tool),
      projects: projectsUsing(tool, projects).map(({ slug, title, accent }) => ({ slug, title, accent })),
    })),
  }));

  return (
    <Page className="project about" style={{ "--accent": ACCENT } as CSSProperties}>
      <header className="about-head">
        <h1>{about.name}</h1>
        <div>
          {about.intro.map((paragraph) => (
            <p className="lede" key={paragraph}>
              {paragraph}
            </p>
          ))}
          <ul className="links project-links">
            {contact.github && (
              <li>
                <a href={contact.github} target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </li>
            )}
            {contact.linkedin && (
              <li>
                <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">
                  LinkedIn
                </a>
              </li>
            )}
            {contact.email && (
              <li>
                <a href={`mailto:${contact.email}`}>Email</a>
              </li>
            )}
            {contact.resume && (
              <li>
                <a href={asset(contact.resume)} target="_blank" rel="noopener noreferrer">
                  Résumé
                </a>
              </li>
            )}
          </ul>
        </div>
      </header>

      <ProfileCard />

      <section className="story">
        <h2>Experience</h2>
        <div className="story-body">
          {experience.map((job) => (
            <article className="part" key={job.company}>
              <h3>{job.company}</h3>
              <ul className="part-meta">
                {[job.title, job.note, job.dates].filter(Boolean).map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
              <p>{job.summary}</p>
              {job.links && job.links.length > 0 && (
                <ul className="links part-links">
                  {job.links.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} target="_blank" rel="noopener noreferrer">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="story">
        <h2>Education</h2>
        <div className="story-body">
          <article className="part">
            <h3>{education.school}</h3>
            <ul className="part-meta">
              <li>Class of {education.classOf}</li>
              {education.honors.map((honor) => (
                <li key={honor}>{honor}</li>
              ))}
            </ul>
            <p>{education.studies.join(" and ")}.</p>
          </article>
        </div>
      </section>

      <section className="story">
        <h2>Toolbox</h2>
        <div className="story-body">
          <Toolbox groups={groups} hint="Pick a numbered tool to see the projects built with it." usedIn="Projects built with {tool}" />
        </div>
      </section>

      {outsideOfCode && (
        <section className="story" id="outside-code">
          <h2>Outside of code</h2>
          <div className="story-body">
            {outsideOfCode.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      )}
    </Page>
  );
}
