import Page from "@/components/Page";
import { contact } from "@/content/contact";

export default function Contact() {
  const handle = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  return (
    <Page>
      <h1>Contact</h1>
      <dl className="facts">
        {contact.email && (
          <>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </dd>
          </>
        )}
        {contact.github && (
          <>
            <dt>GitHub</dt>
            <dd>
              <a href={contact.github} target="_blank" rel="noopener noreferrer">
                {handle(contact.github)}
              </a>
            </dd>
          </>
        )}
        {contact.linkedin && (
          <>
            <dt>LinkedIn</dt>
            <dd>
              <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">
                {handle(contact.linkedin)}
              </a>
            </dd>
          </>
        )}
        {contact.resume && (
          <>
            <dt>Résumé</dt>
            <dd>
              <a href={contact.resume}>Download the PDF</a>
            </dd>
          </>
        )}
      </dl>
    </Page>
  );
}
