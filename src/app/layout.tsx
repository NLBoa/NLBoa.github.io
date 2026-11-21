import type { Metadata } from "next";
import { IBM_Plex_Mono, Schibsted_Grotesk } from "next/font/google";
import { Suspense } from "react";
import ClickAway from "@/components/ClickAway";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import RouteSync from "@/components/RouteSync";
import { siteDescription, siteName, siteUrl } from "@/content/site";
import SceneMount from "@/scene/SceneMount";
import "./globals.css";
import "./miniatures.css";
// Every page's own stylesheet is loaded here, in the one stylesheet the site ships. Imported from
// its page instead, each became a separate file that the browser preloaded whenever a link to
// that page was on screen, and then warned in the console that it was "preloaded but not used".
// Their rules are all scoped to their own page.
import "./home.css";
import "./about/about.css";
import "./contact/contact.css";
import "./projects/projects.css";
import "./projects/[slug]/room.css";
import "./resume/resume.css";

const sans = Schibsted_Grotesk({ variable: "--font-sans", subsets: ["latin"] });
const mono = IBM_Plex_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteName, template: `%s | ${siteName}` },
  description: siteDescription,
  // Each page's canonical address is its own path on the site.
  alternates: { canonical: "./" },
  openGraph: { type: "website", siteName, title: siteName, description: siteDescription },
  twitter: { card: "summary_large_image" },
};

// Runs before first paint: if the browser can do WebGL the home page keeps
// its HTML index hidden while the desk loads. <SceneMount> takes the mark
// away again if the scene cannot actually start.
const markWebGL = "if(window.WebGL2RenderingContext)document.documentElement.dataset.webgl='1'";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: markWebGL }} />
      </head>
      <body>
        <Header />
        {/* Mounted once here so the canvas persists across routes. */}
        <SceneMount />
        <div className="scrim" aria-hidden="true" />
        {children}
        <Footer />
        <Suspense fallback={null}>
          <RouteSync />
        </Suspense>
        {/* A click away from an open page closes it. */}
        <ClickAway />
      </body>
    </html>
  );
}
