import { about } from "./about";
import { contact } from "./contact";

/** Until a résumé PDF exists, "Résumé" leads to the contact page. */
export const resumeHref = contact.resume ?? "/contact";

/** The header's links, in order. */
export const navLinks = [
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Résumé", href: resumeHref },
];

/**
 * The site's public origin (no path), for share links and the sitemap. The
 * GitHub Pages workflow sets NEXT_PUBLIC_SITE_URL; set it yourself for a
 * custom domain.
 */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const siteName = about.name;
export const siteDescription = about.intro[0];
