"use client";

import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  const timer = setInterval(onChange, 15000);
  return () => clearInterval(timer);
};

/**
 * The time where Noah is, so a visitor knows when to expect an answer. It
 * needs the visitor's clock, so it appears only once JavaScript is running.
 * `sentence` has `{time}` where the time goes.
 */
export default function LocalTime({ timeZone, sentence }: { timeZone: string; sentence: string }) {
  const time = useSyncExternalStore(
    subscribe,
    () => new Date().toLocaleTimeString("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).toLowerCase(),
    () => "",
  );
  if (!time) return null;
  return <p className="local-time">{sentence.replace("{time}", time)}</p>;
}
