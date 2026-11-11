"use client";

import { useState, useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

/** Copies a piece of text and says so. It appears only once JavaScript is running. */
export default function CopyButton({ text, label, done, failed }: { text: string; label: string; done: string; failed: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  const hydrated = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  if (!hydrated) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("done");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2500);
  };

  return (
    <button type="button" className="copy" onClick={copy} data-state={state}>
      <span aria-live="polite">{state === "done" ? done : state === "failed" ? failed : label}</span>
    </button>
  );
}
