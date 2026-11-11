"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { mailto } from "@/lib/mailto";

export type NoteCopy = {
  to: string;
  from: string;
  fromHint: string;
  note: string;
  noteHint: string;
  send: string;
  promise: string;
  /** Subject of the draft; `{name}` is replaced by the sender's name. */
  subjectNamed: string;
  subjectPlain: string;
};

const subscribeNever = () => () => {};

/**
 * A sheet of note paper. What is written on it becomes a draft in the
 * visitor's own mail app: the button is an ordinary mailto link, so the page
 * itself sends nothing and it works without JavaScript too.
 */
export default function Note({ email, recipient, copy }: { email: string; recipient: string; copy: NoteCopy }) {
  const nameId = useId();
  const noteId = useId();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const hydrated = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  const href = mailto(email, { name, note }, (from) => (from ? copy.subjectNamed.replace("{name}", from) : copy.subjectPlain));

  return (
    <form className="note" onSubmit={(event) => event.preventDefault()}>
      <p className="note-line">
        <span>{copy.to}</span>
        <strong>{recipient}</strong>
      </p>
      <p className="note-line">
        <label htmlFor={nameId}>{copy.from}</label>
        <input id={nameId} name="name" autoComplete="name" placeholder={copy.fromHint} value={name} onChange={(event) => setName(event.target.value)} />
      </p>
      <label htmlFor={noteId} className="visually-hidden">
        {copy.note}
      </label>
      <textarea id={noteId} name="note" rows={7} placeholder={copy.noteHint} value={note} onChange={(event) => setNote(event.target.value)} />
      <div className="note-foot">
        <a className="note-send" href={href} data-ready={hydrated}>
          {copy.send}
        </a>
        <p>{copy.promise}</p>
      </div>
    </form>
  );
}
