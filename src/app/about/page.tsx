import Page from "@/components/Page";
import { about } from "@/content/about";

export default function About() {
  const { education, experience, outsideOfCode } = about;
  return (
    <Page>
      <h1>{about.name}</h1>
      {about.intro.map((paragraph) => (
        <p className="lede" key={paragraph}>
          {paragraph}
        </p>
      ))}

      <section>
        <h2>Experience</h2>
        {experience.map((job) => (
          <article className="entry" key={job.company}>
            <h3>{job.company}</h3>
            <p className="entry-meta">{[job.title, job.note, job.dates].filter(Boolean).join(", ")}</p>
            <ul className="points">
              {job.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section>
        <h2>Education</h2>
        <article className="entry">
          <h3>{education.school}</h3>
          <p className="entry-meta">Class of {education.classOf}</p>
          <ul className="points">
            <li>{education.studies.join(" and ")}</li>
            {education.honors.map((honor) => (
              <li key={honor}>{honor}</li>
            ))}
          </ul>
        </article>
      </section>

      {outsideOfCode && (
        <section id="outside-code">
          <h2>Outside of code</h2>
          {outsideOfCode.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      )}
    </Page>
  );
}
