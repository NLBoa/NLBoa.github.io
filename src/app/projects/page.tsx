import Page from "@/components/Page";
import ProjectList from "@/components/ProjectList";
import { projects } from "@/content/projects";

export default function Projects() {
  return (
    <Page>
      <h1>Projects</h1>
      <ProjectList projects={projects} />
    </Page>
  );
}
