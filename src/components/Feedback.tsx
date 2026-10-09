import { useState } from 'react';
import { API, request, track, url, useLearner } from '../client/store';
import {
  feedbackMessage,
  type FeedbackContext,
  type FeedbackKind,
} from '../client/feedback';
import { atlasVersion, supportEmail } from '../content/product';
import { deviceClass } from '../client/analytics';
import { publicRoute, routeMetadata } from '../core/product-analytics';
import { base } from '../client/store';
import { Icon } from './Icons';

const intents: {
  kind: FeedbackKind;
  label: string;
  icon: 'help' | 'pencil' | 'flag';
}[] = [
  { kind: 'bug', label: 'Something’s wrong', icon: 'flag' },
  { kind: 'feature', label: 'Suggest something', icon: 'pencil' },
  { kind: 'assignment-help', label: 'I’m confused', icon: 'help' },
];

function readDraft(key: string) {
  try {
    const draft = JSON.parse(sessionStorage.getItem(key) || 'null');
    return typeof draft?.text === 'string' ? draft.text.slice(0, 2000) : '';
  } catch {
    return '';
  }
}

export default function Feedback({
  context,
  initialKind = 'bug',
}: {
  context: FeedbackContext;
  initialKind?: FeedbackKind;
}) {
  const state = useLearner();
  const key = `atlas:feedback:${state.user?.id ?? 'guest'}:${context.page}`;
  const [kind, setKind] = useState<FeedbackKind>(initialKind);
  const [text, setText] = useState(() => readDraft(key));
  const [contact, setContact] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const unavailable = !API || state.connection === 'offline';
  function draft(value: string) {
    setText(value);
    try {
      sessionStorage.setItem(key, JSON.stringify({ text: value }));
    } catch {
      /* The mounted form still preserves the draft. */
    }
  }
  async function submit() {
    setBusy(true);
    setError('');
    try {
      await request('/requests', {
        kind,
        course: context.course,
        message: feedbackMessage(context, text),
        contact: contact || undefined,
        route: publicRoute(window.location.pathname, base),
        material: routeMetadata(publicRoute(window.location.pathname, base))
          .material,
        question: context.question,
        version: atlasVersion,
        device: deviceClass(),
      });
      draft('');
      setSent(true);
      track('request_submitted', context.course);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const mail = `mailto:${supportEmail}?subject=${encodeURIComponent('atlas beta feedback')}&body=${encodeURIComponent(feedbackMessage(context, text))}`;
  return (
    <div className="feedback-content">
      <div className="feedback-context">
        <span className="meta">
          {sent
            ? 'Included with your feedback'
            : 'You’re here · included automatically'}
        </span>
        <p>
          {context.trail.map((part, i) => (
            <span key={i}>
              {i > 0 && <Icon name="arrow" size={12} />}
              {part}
            </span>
          ))}
        </p>
      </div>
      {sent ? (
        <div className="feedback-confirmation" role="status">
          <Icon name="check" size={22} />
          <h3>Feedback received.</h3>
          <p>Thanks for telling me. If you left an email, I can reply there.</p>
          <p className="small">
            For anything else,{' '}
            <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
          </p>
          <button className="quiet" onClick={() => setSent(false)}>
            Send something else
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div
            className="feedback-intents"
            role="group"
            aria-label="Feedback type"
          >
            {intents.map((intent) => (
              <button
                key={intent.kind}
                type="button"
                className="quiet"
                aria-pressed={kind === intent.kind}
                onClick={() => setKind(intent.kind)}
              >
                <Icon name={intent.icon} size={15} />
                {intent.label}
              </button>
            ))}
          </div>
          <label>
            {kind === 'feature'
              ? 'What would make this better?'
              : kind === 'assignment-help'
                ? 'Where did it stop making sense?'
                : 'What happened?'}
            <textarea
              autoFocus
              value={text}
              onChange={(e) => draft(e.target.value)}
              rows={3}
              minLength={4}
              maxLength={2000}
              required
              placeholder="A sentence is enough. The page and question are already included."
            />
          </label>
          <details className="feedback-reply">
            <summary>Want a reply?</summary>
            <label>
              Reply email (optional)
              <input
                type="email"
                autoComplete="email"
                maxLength={254}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </label>
          </details>
          <div className="feedback-submit">
            <span className="small muted">
              Only this context and what you submit.
            </span>
            <button
              type="submit"
              className="primary"
              disabled={unavailable || busy}
            >
              {busy && <span className="inline-spinner" aria-hidden="true" />}
              {busy ? 'Sending…' : 'Send feedback'}
              {!busy && <Icon name="arrow" size={15} />}
            </button>
          </div>
          {error && (
            <p className="feedback-error" role="alert">
              {error} Your draft is still here.{' '}
              <a href={mail}>Email atlas instead</a>.
            </p>
          )}
          {unavailable && (
            <p className="feedback-offline" role="status">
              The feedback inbox is offline. Your draft stays in this tab.{' '}
              <a href={mail}>Email atlas instead</a>.
            </p>
          )}
        </form>
      )}
      <nav className="feedback-links" aria-label="atlas help">
        <a href={url('help/')}>
          <Icon name="help" size={14} />
          Help
        </a>
        <a href={url('about/')}>About atlas beta</a>
        <a href={url('privacy/')}>Privacy</a>
        <a href={url('sources/')}>Sources</a>
      </nav>
    </div>
  );
}
