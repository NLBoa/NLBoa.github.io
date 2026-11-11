import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Page from "@/components/Page";
import CopyButton from "@/components/contact/CopyButton";
import LocalTime from "@/components/contact/LocalTime";
import Note from "@/components/contact/Note";
import { about } from "@/content/about";
import { contact } from "@/content/contact";
import { asset } from "@/lib/paths";
import "./contact.css";

export const metadata: Metadata = {
  title: "Contact",
  description: "Email, GitHub and LinkedIn for Noah Leibovitz.",
};

// The warm light of the desk lamp.
const ACCENT = "#e9b872";

const handle = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

/** The pen cup opens this page: a sheet of note paper, and where else to find me. */
export default function Contact() {
  const firstName = about.name.split(" ")[0];

  return (
    <Page className="project contact" style={{ "--accent": ACCENT } as CSSProperties}>
      <header className="contact-head">
        <h1>Contact</h1>
        <div>
          <p className="lede">Write me a note, or find me in any of these places.</p>
          {contact.status && <p className="contact-status">{contact.status}</p>}
        </div>
      </header>

      <div className="contact-desk">
        {contact.email && (
          <Note
            email={contact.email}
            recipient={firstName}
            copy={{
              to: "To",
              from: "From",
              fromHint: "your name",
              note: "Your note",
              noteHint: "Write your note here.",
              send: "Open it in your mail app",
              promise: "This page sends nothing. The button opens a draft in your own mail app.",
              subjectNamed: "A note from {name}",
              subjectPlain: "A note from your site",
            }}
          />
        )}

        <section className="reach" aria-labelledby="reach-title">
          <h2 id="reach-title">Find me</h2>
          <ul>
            {contact.email && (
              <li>
                <a href={`mailto:${contact.email}`}>
                  <span>Email</span>
                  <strong>{contact.email}</strong>
                </a>
                <CopyButton text={contact.email} label="Copy" done="Copied" failed="Copy it by hand" />
              </li>
            )}
            {contact.github && (
              <li>
                <a href={contact.github} target="_blank" rel="noopener noreferrer">
                  <span>GitHub</span>
                  <strong>{handle(contact.github)}</strong>
                </a>
              </li>
            )}
            {contact.linkedin && (
              <li>
                <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">
                  <span>LinkedIn</span>
                  <strong>{handle(contact.linkedin)}</strong>
                </a>
              </li>
            )}
            {contact.resume && (
              <li>
                <a href={asset(contact.resume)} target="_blank" rel="noopener noreferrer">
                  <span>Résumé</span>
                  <strong>Open the PDF</strong>
                </a>
              </li>
            )}
          </ul>
          {contact.timeZone && <LocalTime timeZone={contact.timeZone.id} sentence={`It is {time} for me (${contact.timeZone.name}).`} />}
        </section>
      </div>
    </Page>
  );
}
