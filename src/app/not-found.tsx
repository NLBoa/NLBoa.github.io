import type { Metadata } from "next";
import Link from "next/link";
import Page from "@/components/Page";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <Page>
      <h1>Page not found</h1>
      <p className="lede">There is nothing at this address. It may have moved, or the link may be mistyped.</p>
      <ul className="links">
        <li>
          <Link href="/">Back to the desk</Link>
        </li>
        <li>
          <Link href="/projects">All projects</Link>
        </li>
      </ul>
    </Page>
  );
}
