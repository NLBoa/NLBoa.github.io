import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SceneMount from "@/scene/SceneMount";
import { about } from "@/content/about";
import "./globals.css";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: about.name,
  description: about.intro[0],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        {children}
        {/* Mounted once here so the canvas persists across routes. */}
        <SceneMount />
      </body>
    </html>
  );
}
