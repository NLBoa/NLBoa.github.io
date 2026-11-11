import type { Metadata } from "next";
import { IBM_Plex_Mono, Schibsted_Grotesk } from "next/font/google";
import { Suspense } from "react";
import Header from "@/components/Header";
import RouteSync from "@/components/RouteSync";
import { about } from "@/content/about";
import SceneMount from "@/scene/SceneMount";
import "./globals.css";

const sans = Schibsted_Grotesk({ variable: "--font-sans", subsets: ["latin"] });
const mono = IBM_Plex_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: about.name,
  description: about.intro[0],
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
        <Suspense fallback={null}>
          <RouteSync />
        </Suspense>
      </body>
    </html>
  );
}
