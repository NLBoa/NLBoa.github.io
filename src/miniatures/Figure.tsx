import { useId, type ReactNode, type Ref } from "react";

type Props = {
  /** The drawing itself. */
  children: ReactNode;
  /** Short name of the drawing, for screen readers. */
  label: string;
  /** What the drawing shows, in full, for screen readers. */
  description: string;
  /** One line on what is happening now. Announced when it changes. */
  status: string;
  /** Buttons. Left out of the page until JavaScript is running. */
  actions?: ReactNode;
  /** Says that this is an illustration. */
  caption: string;
  legend?: ReactNode;
  ref?: Ref<HTMLElement>;
};

/** The frame every miniature sits in: stage, status and buttons, caption. */
export default function Figure({ children, label, description, status, actions, caption, legend, ref }: Props) {
  const descriptionId = useId();
  return (
    <figure className="miniature" ref={ref}>
      <div className="miniature-stage" role="img" aria-label={label} aria-describedby={descriptionId}>
        {children}
      </div>
      <p id={descriptionId} className="visually-hidden">
        {description}
      </p>
      <div className="miniature-bar">
        <p className="miniature-status" aria-live="polite">
          {status}
        </p>
        {actions && <div className="miniature-actions">{actions}</div>}
      </div>
      <figcaption>
        <span>{caption}</span>
        {legend}
      </figcaption>
    </figure>
  );
}
