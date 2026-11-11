import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type Props = {
  children: ReactNode;
  back?: { label: string; href: string };
  /** Extra class for a page with its own layout. */
  className?: string;
  style?: CSSProperties;
};

/** An ordinary HTML page shown over the dimmed desk. */
export default function Page({ children, back, className, style }: Props) {
  return (
    <main className={className ? `page ${className}` : "page"} style={style}>
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
