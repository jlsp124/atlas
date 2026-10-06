import { concepts, coverageItems, questions } from '../content/catalog';
import { topicTitle } from '../content/workspaces';
import { coverage } from '../core/learning';
import { url, useLearner } from '../client/store';
import Sheet from './Sheet';
import { useState } from 'react';
export default function Coverage({
  course,
  unit,
  ids,
}: {
  course: string;
  unit?: string;
  ids?: string[];
}) {
  const state = useLearner(),
    [open, setOpen] = useState(false);
  const report = coverage(
    coverageItems.filter(
      (i) =>
        i.course === course &&
        (!unit || i.unit === unit) &&
        (!ids || ids.includes(i.concept)),
    ),
    state.events,
    questions,
  );
  return (
    <>
      <button className="coverage-action" onClick={() => setOpen(true)}>
        Still to check: {report.unseen.length}
        <span aria-hidden="true">↗</span>
      </button>
      <Sheet open={open} title="Still to check" onClose={() => setOpen(false)}>
        <p>You haven’t been tested on these yet.</p>
        <div className="coverage-list">
          {report.unseen.map((i) => (
            <a href={url(`learn/${i.concept}/`)} key={i.id}>
              {i.title}
              <small>{topicTitle(i.concept)}</small>
            </a>
          ))}
        </div>
        {!report.unseen.length && (
          <p>
            You’ve tried all the checks I’ve added here. Keep practising
            anything that still feels shaky.
          </p>
        )}
        {report.weak.length > 0 && (
          <>
            <h3>Worth another look</h3>
            {[...new Set(report.weak.map((i) => i.concept))].map((id) => (
              <p key={id}>
                <a href={url(`learn/${id}/`)}>
                  {concepts.find((c) => c.id === id)?.title}
                </a>
              </p>
            ))}
          </>
        )}
      </Sheet>
    </>
  );
}
