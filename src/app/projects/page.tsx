import type { Metadata } from "next";
import Page from "@/components/Page";
import ProjectList from "@/components/ProjectList";
import { projects } from "@/content/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "Software projects by Noah Leibovitz.",
};

export default function Projects() {
  return (
    <Page>
      <h1>Projects</h1>
      <ProjectList projects={projects} />
    </Page>
  );
}
