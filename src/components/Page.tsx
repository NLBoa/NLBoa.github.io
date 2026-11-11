import Link from "next/link";
import type { ReactNode } from "react";

/** An ordinary HTML page shown over the dimmed desk. */
export default function Page({ children, back }: { children: ReactNode; back?: { label: string; href: string } }) {
  return (
    <main className="page">
      <div className="page-bar">
        {back ? <Link href={back.href}>{back.label}</Link> : <span />}
        <Link href="/" className="page-close">
          Close <kbd>Esc</kbd>
        </Link>
      </div>
      {children}
    </main>
  );
}
