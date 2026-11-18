import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import Page from "@/components/Page";
import CopyButton from "@/components/contact/CopyButton";
import LocalTime from "@/components/contact/LocalTime";
import { contact } from "@/content/contact";
import { RESUME_PATH } from "@/content/resume";

export const metadata: Metadata = {
  title: "Contact",
  description: "Email, GitHub and LinkedIn for Noah Leibovitz.",
};

// The warm light of the desk lamp.
const ACCENT = "#e9b872";

const handle = (url: string) =>
  url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

/** The pen cup opens this page: the places to reach me, each a whole row to press. */
export default function Contact() {
  return (
    <Page
      className="project contact"
      style={{ "--accent": ACCENT } as CSSProperties}
    >
      <div className="contact-body">
        <header className="contact-head">
          <h1>Contact</h1>
          <div>
            <p className="lede">Find me in any of these places.</p>
            {contact.status && (
              <p className="contact-status">{contact.status}</p>
            )}
          </div>
        </header>

        <section className="reach" aria-label="Find me">
          <ul>
            {contact.email && (
              <li>
                <a href={`mailto:${contact.email}`}>
                  <span>Email</span>
                  <strong>{contact.email}</strong>
                </a>
                <CopyButton
                  text={contact.email}
                  label="Copy"
                  done="Copied"
                  failed="Copy it by hand"
                />
              </li>
            )}
            {contact.github && (
              <li>
                <a
                  href={contact.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>GitHub</span>
                  <strong>{handle(contact.github)}</strong>
                </a>
              </li>
            )}
            {contact.linkedin && (
              <li>
                <a
                  href={contact.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>LinkedIn</span>
                  <strong>{handle(contact.linkedin)}</strong>
                </a>
              </li>
            )}
            <li>
              <Link href={RESUME_PATH}>
                <span>Résumé</span>
                <strong>Read or download it</strong>
              </Link>
            </li>
          </ul>
          {contact.timeZone && (
            <LocalTime
              timeZone={contact.timeZone.id}
              sentence={`It is {time} for me (${contact.timeZone.name}).`}
            />
          )}
        </section>
      </div>
    </Page>
  );
}
