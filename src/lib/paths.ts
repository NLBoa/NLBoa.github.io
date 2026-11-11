/**
 * Prefixes a path to a file in public/ with the site's base path.
 *
 * Next adds the base path to its own links and scripts, but not to addresses
 * we write ourselves (models, textures, images, a résumé PDF). Use this for
 * those. Outside links are returned unchanged.
 */
export function asset(path: string): string {
  if (!path.startsWith("/")) return path;
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}

/**
 * The site path of a browser address: the base path taken off, and any
 * trailing slash with it. "/portfolio/about/" under the base "/portfolio"
 * is "/about".
 */
export function sitePath(pathname: string, base = process.env.NEXT_PUBLIC_BASE_PATH ?? ""): string {
  const inside = base && (pathname === base || pathname.startsWith(`${base}/`)) ? pathname.slice(base.length) : pathname;
  return normalizePath(inside || "/");
}

/** "/about/" and "/about" are the same page; the home page stays "/". */
export function normalizePath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}
