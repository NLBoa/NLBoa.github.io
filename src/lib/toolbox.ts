import type { Project, Tool } from "@/content/types";

export const toolName = (tool: Tool): string => (typeof tool === "string" ? tool : tool.name);

const names = (tool: Tool): string[] => (typeof tool === "string" ? [tool] : tool.match).map((n) => n.toLowerCase());

/** The names in a project's stack. "Zigbee/MQTT" counts as both Zigbee and MQTT. */
const stackNames = (project: Project): string[] =>
  project.stack.flatMap((entry) => [entry, ...entry.split("/")]).map((n) => n.trim().toLowerCase());

/** The projects whose stack names this tool, in the order of the projects list. */
export function projectsUsing(tool: Tool, projects: Project[]): Project[] {
  const wanted = names(tool);
  return projects.filter((project) => stackNames(project).some((n) => wanted.includes(n)));
}
