import Link from "next/link";
import type { ReactNode } from "react";
import { about } from "@/content/about";
import { contact } from "@/content/contact";
import { portraitFront } from "@/content/portrait-front";
import { featuredProjects } from "@/content/projects";
import Portrait from "./Portrait";

const handle = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

function Row({ label, children, tone }: { label: ReactNode; children: ReactNode; tone?: "good" }) {
  return (
    <div className="card-row">
      <dt>{label}</dt>
      <span className="card-dots" aria-hidden="true" />
      <dd data-tone={tone}>{children}</dd>
    </div>
  );
}

/**
 * The profile card, as on the GitHub profile: the ASCII portrait on the left
 * and the facts on the right, set like the output of a terminal command.
 * The right monitor on the desk shows the same card.
 */
export default function ProfileCard() {
  const { education, experience } = about;
  const current = experience[0];

  return (
    <figure className="card">
      <Portrait front={portraitFront} label={`A portrait of ${about.name}, drawn in text characters`} pause="Pause" play="Play" />

      <div className="card-info">
        <p className="card-title">
          <span>{about.handle}</span>
        </p>
        <dl className="card-facts">
          <Row label="School">{education.school}</Row>
          <Row label="Degree">{education.studies.join(", ")}</Row>
          <Row label="Class">{education.classOf}</Row>
          <Row label="Honors">{education.honors.join(", ")}</Row>
          {current?.title && (
            <Row label="Role">
              {current.title}, {current.company}
            </Row>
          )}
        </dl>

        <p className="card-section">
          <span>Building</span>
        </p>
        <dl>
          {featuredProjects.map((project) => (
            <Row key={project.slug} label={<Link href={`/projects/${project.slug}`}>{project.title}</Link>}>
              {project.summary}
            </Row>
          ))}
        </dl>

        <p className="card-section">
          <span>Contact</span>
        </p>
        <dl className="card-facts">
          {contact.email && (
            <Row label="Email">
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </Row>
          )}
          {contact.github && (
            <Row label="GitHub">
              <a href={contact.github} target="_blank" rel="noopener noreferrer">
                {handle(contact.github)}
              </a>
            </Row>
          )}
          {contact.linkedin && (
            <Row label="LinkedIn">
              <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">
                {handle(contact.linkedin)}
              </a>
            </Row>
          )}
          {about.status && (
            <Row label="Status" tone="good">
              {about.status}
            </Row>
          )}
        </dl>

        <p className="card-prompt" aria-hidden="true">
          ~ $ <i />
        </p>
      </div>
    </figure>
  );
}
