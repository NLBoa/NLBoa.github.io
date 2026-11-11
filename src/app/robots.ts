import type { MetadataRoute } from "next";
import { siteUrl } from "@/content/site";
import { asset } from "@/lib/paths";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: new URL(asset("/sitemap.xml"), siteUrl).toString() };
}
