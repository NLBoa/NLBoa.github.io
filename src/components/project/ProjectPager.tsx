import Link from "next/link";
import { projects } from "@/content/projects";

/** The projects on either side of this one, in the order of the content file. */
export default function ProjectPager({ slug }: { slug: string }) {
  const index = projects.findIndex((p) => p.slug === slug);
  const previous = projects[index - 1];
  const next = projects[index + 1];

  return (
    <nav className="pager" aria-label="More projects">
      {previous ? (
        <Link href={`/projects/${previous.slug}`} rel="prev">
          <span className="pager-label">Previous project</span>
          <span className="pager-title">{previous.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link href={`/projects/${next.slug}`} rel="next" className="pager-next">
          <span className="pager-label">Next project</span>
          <span className="pager-title">{next.title}</span>
        </Link>
      )}
    </nav>
  );
}
