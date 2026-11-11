import Link from "next/link";
import { Suspense } from "react";
import { about } from "@/content/about";
import { navLinks } from "@/content/site";
import NavLinks from "./NavLinks";

/** Fixed over everything: nobody needs the 3D scene to get around. */
export default function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="site-name">
        {about.name}
      </Link>
      <nav aria-label="Site">
        <Suspense fallback={<NavLinks links={navLinks} current={null} />}>
          <NavLinks links={navLinks} />
        </Suspense>
      </nav>
    </header>
  );
}
