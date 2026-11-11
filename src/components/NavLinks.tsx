"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  links: { label: string; href: string }[];
  /** Pass `null` to render without reading the URL (the prerender fallback). */
  current?: string | null;
};

function Links({ links, current }: { links: Props["links"]; current: string | null }) {
  // Two links can share a destination (Résumé leads to Contact until a PDF
  // exists); only the first is marked as the current page.
  const active = links.find((link) => current === link.href || current?.startsWith(`${link.href}/`));
  return (
    <ul className="site-nav">
      {links.map((link) => (
        <li key={link.label}>
          {link.href.startsWith("/") && !link.href.endsWith(".pdf") ? (
            <Link href={link.href} aria-current={link === active ? "page" : undefined}>
              {link.label}
            </Link>
          ) : (
            <a href={link.href}>{link.label}</a>
          )}
        </li>
      ))}
    </ul>
  );
}

function WithPath({ links }: { links: Props["links"] }) {
  return <Links links={links} current={usePathname()} />;
}

export default function NavLinks({ links, current }: Props) {
  return current === null ? <Links links={links} current={null} /> : <WithPath links={links} />;
}
