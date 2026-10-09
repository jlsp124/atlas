import { url, useLearner } from '../client/store';
import { Coordinates, Icon } from './Icons';
import { openFeedback } from '../client/feedback';
export default function NotFound() {
  const state = useLearner();
  return (
    <div className="missing-page">
      <Coordinates />
      <p className="meta">404 · Page not found</p>
      <h1>This page isn’t here.</h1>
      <p>
        The link may be old, or the page may have moved. Your courses and saved
        work are still available.
      </p>
      <div className="button-row">
        <a className="primary" href={url('courses/')}>
          <Icon name="back" size={16} />
          Open your courses
        </a>
        <button
          className="secondary"
          disabled={!state.ready}
          onClick={() => window.dispatchEvent(new Event('atlas:search'))}
        >
          <Icon name="search" size={16} />
          Search atlas
        </button>
      </div>
      <p className="small muted">
        Followed a broken link?{' '}
        <button
          className="text-button"
          disabled={!state.ready}
          onClick={() => openFeedback('bug')}
        >
          Tell atlas
        </button>
        .
      </p>
    </div>
  );
}
