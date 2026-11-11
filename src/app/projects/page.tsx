import type { Metadata } from "next";
import Page from "@/components/Page";
import ProjectTiles from "@/components/ProjectTiles";
import { projects } from "@/content/projects";
import "./projects.css";

export const metadata: Metadata = {
  title: "Projects",
  description: "Software projects by Noah Leibovitz.",
};

/** The left monitor's screen, at full size: every project as a button. */
export default function Projects() {
  return (
    <Page className="screen">
      <header className="screen-bar">
        <h1>Projects</h1>
        <p>{projects.length} projects</p>
      </header>
      <ProjectTiles projects={projects} />
    </Page>
  );
}
