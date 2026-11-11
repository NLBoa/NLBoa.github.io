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
