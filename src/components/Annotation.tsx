import { useRef, useState } from 'react';
import { url } from '../client/store';
export default function Annotation({
  term,
  definition,
  concept,
}: {
  term: string;
  definition: string;
  concept?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="annotation"
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true);
          dialog.current?.showModal();
        }}
      >
        {term}
      </button>
      <dialog
        ref={dialog}
        className="annotation-dialog sheet"
        aria-label={term}
        onCancel={() => setOpen(false)}
      >
        <div className="dialog-top">
          <strong>{term}</strong>
          <button
            className="quiet"
            aria-label="Close explanation"
            onClick={() => {
              dialog.current?.close();
              setOpen(false);
            }}
          >
            ×
          </button>
        </div>
        {open && (
          <>
            <p>{definition}</p>
            {concept && (
              <a href={url(`concepts/${concept}/`)}>Open this prerequisite →</a>
            )}
          </>
        )}
      </dialog>
    </>
  );
}
