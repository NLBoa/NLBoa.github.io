"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import type { ToolGroup } from "@/content/types";

export type ToolEntry = { name: string; projects: { slug: string; title: string; accent?: string }[] };
export type ToolboxGroup = { name: ToolGroup["name"]; tools: ToolEntry[] };

type Props = {
  groups: ToolboxGroup[];
  hint: string;
  /** The line above the projects; `{tool}` is replaced by the tool's name. */
  usedIn: string;
};

/**
 * The toolbox. A tool that one of the projects on this site is built with is
 * a button: pressing it lists those projects. The rest are plain names.
 */
export default function Toolbox({ groups, hint, usedIn }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const tool = groups.flatMap((g) => g.tools).find((t) => t.name === selected);

  return (
    <div className="toolbox">
      {groups.map((group) => (
        <div className="toolbox-group" key={group.name}>
          <h3>{group.name}</h3>
          <ul>
            {group.tools.map((entry) => (
              <li key={entry.name}>
                {entry.projects.length > 0 ? (
                  <button type="button" aria-pressed={selected === entry.name} onClick={() => setSelected(selected === entry.name ? null : entry.name)}>
                    {entry.name}
                    <span className="toolbox-count" aria-hidden="true">
                      {entry.projects.length}
                    </span>
                  </button>
                ) : (
                  <span className="toolbox-plain">{entry.name}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="toolbox-result" aria-live="polite">
        {tool ? (
          <>
            <p>{usedIn.replace("{tool}", tool.name)}</p>
            <ul>
              {tool.projects.map((project) => (
                <li key={project.slug}>
                  <Link href={`/projects/${project.slug}`} style={project.accent ? ({ "--accent": project.accent } as CSSProperties) : undefined}>
                    {project.title}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="toolbox-hint">{hint}</p>
        )}
      </div>
    </div>
  );
}
