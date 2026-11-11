import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { siteUrl } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/projects", ...projects.map((p) => `/projects/${p.slug}`), "/about", "/contact", "/credits"];
  return paths.map((path) => ({ url: new URL(path, siteUrl).toString() }));
}
