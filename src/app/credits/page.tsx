import type { Metadata } from "next";
import Page from "@/components/Page";
import { credits } from "@/content/credits";

export const metadata: Metadata = {
  title: "Credits",
  description: "The models, textures and typefaces used on this site, with their creators and licenses.",
};

export default function Credits() {
  return (
    <Page>
      <h1>Credits</h1>
      <p className="lede">The models, textures and typefaces on this site that other people made.</p>
      {credits.map((credit) => (
        <article className="entry credit" key={credit.title}>
          <h3>
            <a href={credit.sourceUrl} target="_blank" rel="noopener noreferrer">
              {credit.title}
            </a>
          </h3>
          <p className="entry-meta">
            by {credit.creator}, licensed under{" "}
            <a href={credit.license.url} target="_blank" rel="noopener noreferrer license">
              {credit.license.name}
            </a>
          </p>
          <dl className="facts">
            <dt>Used for</dt>
            <dd>{credit.usedFor}</dd>
            <dt>Changes</dt>
            <dd>{credit.changes}</dd>
          </dl>
        </article>
      ))}
    </Page>
  );
}
