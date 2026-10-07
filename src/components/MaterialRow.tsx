import type { Assignment } from '../core/schema';
import { materialProgress, resumeCheckpoint } from '../core/materials';
import { url, useLearner } from '../client/store';
import { Icon } from './Icons';
export default function MaterialRow({
  material: a,
  featured = false,
}: {
  material: Assignment;
  featured?: boolean;
}) {
  const state = useLearner(),
    progress = materialProgress(a, state.events);
  const resume = resumeCheckpoint(a, state.events);
  return (
    <a
      className={`v3-material-row ${featured ? 'featured-material' : ''}`}
      href={url(
        `work/${a.id}/${featured && resume ? `?focus=1#${resume}` : ''}`,
      )}
      data-material={a.id}
    >
      <span
        className={`material-status-symbol ${progress.done ? 'is-complete' : ''}`}
        aria-hidden="true"
      >
        {progress.done ? (
          <Icon name="check" size={16} />
        ) : (
          <Icon name="book" size={18} />
        )}
      </span>
      <span className="material-copy">
        <strong>
          {a.id === 'kinematics-review' ? 'Kinematics Review' : a.title}
        </strong>
        <small>
          {a.kind?.replaceAll('-', ' ')}
          {a.questionReferences?.length ? ` · ${a.questionReferences[0]}` : ''}
        </small>
      </span>
      <span className="material-status">
        <span>{progress.status}</span>
        {progress.total > 0 && (
          <small>
            {progress.completed} / {progress.total}
          </small>
        )}
      </span>
      <Icon name="arrow" size={18} />
    </a>
  );
}
