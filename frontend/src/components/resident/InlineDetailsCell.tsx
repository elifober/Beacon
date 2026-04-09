import { useState } from "react";

type Props = {
  text: string | null | undefined;
  /** e.g. "Show or hide full session narrative" */
  ariaLabel: string;
};

export function InlineDetailsCell({ text, ariaLabel }: Props) {
  const [expanded, setExpanded] = useState(false);
  const body = text?.trim() ?? "";

  if (!body) {
    return <span className="text-muted">{"\u2014"}</span>;
  }

  if (!expanded) {
    return (
      <div className="resident-inline-disclosure resident-inline-disclosure--collapsed text-center align-middle">
        <button
          type="button"
          className="resident-inline-disclosure__trigger btn btn-link p-0"
          onClick={() => setExpanded(true)}
          aria-expanded={false}
          aria-label={ariaLabel}
        >
          Details
        </button>
      </div>
    );
  }

  return (
    <div className="resident-inline-disclosure resident-inline-disclosure--expanded position-relative text-start">
      <button
        type="button"
        className="resident-inline-disclosure__close btn btn-sm"
        onClick={() => setExpanded(false)}
        aria-label="Close details"
      >
        ×
      </button>
      <div className="resident-inline-disclosure__body">{body}</div>
    </div>
  );
}
