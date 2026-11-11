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
 * The site's public address, for share links and the sitemap. Set
 * NEXT_PUBLIC_SITE_URL for a custom domain; on Vercel the production URL is
 * picked up by itself.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const siteName = about.name;
export const siteDescription = about.intro[0];
