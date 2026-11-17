import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Page from "@/components/Page";
import TiltSheet from "@/components/resume/TiltSheet";
import { about } from "@/content/about";
import { resume } from "@/content/resume";
import { asset } from "@/lib/paths";
import { fileSize, linkLabel, monthLabel } from "@/lib/resume";

export const metadata: Metadata = {
  title: "Résumé",
  description: `${about.name}'s résumé, to read here or download as a PDF.`,
};

// The Stream Deck's key light: its Résumé key opens this page.
const ACCENT = "#cfe0ff";

/**
 * The résumé as a sheet of paper on the desk, centered in the window. It tips
 * toward the pointer like a card, with a shine that follows (see TiltSheet). Each page of the PDF is shown
 * as a picture, so it looks the same on every device (a phone will not show a
 * PDF inside a page), with the PDF's own links laid over it and its text
 * underneath for screen readers. The PDF itself is one press away.
 *
 * The pictures and the text come from the PDF: see scripts/resume.mjs.
 */
export default function Resume() {
  const pdf = asset(resume.file);
  const count = resume.pages.length;

  return (
    <Page className="project resume" style={{ "--accent": ACCENT } as CSSProperties}>
      <div className="resume-layout">
        <header className="resume-head">
          <h1>Résumé</h1>
          <p className="resume-meta">
            {count === 1 ? "One page" : `${count} pages`}, updated {monthLabel(resume.updated)}.
          </p>
          <div className="resume-actions">
            <a className="resume-download" href={pdf} download={resume.fileName}>
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path d="M8 2v8.5M4.25 7.25 8 11l3.75-3.75M2.5 13.5h11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Download PDF
              <span className="resume-size">{fileSize(resume.bytes)}</span>
            </a>
            <a className="resume-open" href={pdf} target="_blank" rel="noopener noreferrer">
              Open the PDF in a new tab
            </a>
          </div>
        </header>

        <div className="resume-sheets">
          {resume.pages.map((page) => (
            <TiltSheet key={page.image} style={{ aspectRatio: `${page.width} / ${page.height}` }}>
              {/* Pressing the sheet opens the PDF, where a phone can zoom. It is a shortcut for the
                  pointer only: the link above does the same for keyboards and screen readers, and
                  the text below stands in for the picture. */}
              <a className="resume-zoom" href={pdf} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true">
                {/* Lazy, so that the home page does not fetch it ahead of time just because a link
                    to this page is on screen. Here it is in view, so it loads at once. */}
                {/* eslint-disable-next-line @next/next/no-img-element -- a static export has no image server */}
                <img src={asset(page.image)} width={page.width} height={page.height} alt="" loading="lazy" decoding="async" />
              </a>
              {page.links.map((link) => (
                <a
                  key={`${link.href}-${link.left}-${link.top}`}
                  className="resume-link"
                  href={link.href}
                  {...(link.href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                  aria-label={linkLabel(link.href)}
                  title={linkLabel(link.href)}
                  style={{ left: `${link.left * 100}%`, top: `${link.top * 100}%`, width: `${link.width * 100}%`, height: `${link.height * 100}%` }}
                />
              ))}
            </TiltSheet>
          ))}
        </div>
      </div>

      {/* The same words as the picture, for screen readers and search engines. */}
      <section className="visually-hidden" aria-label="The résumé as text">
        {resume.pages.map((page) => (
          <div key={page.image}>
            {page.lines.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        ))}
      </section>
    </Page>
  );
}
