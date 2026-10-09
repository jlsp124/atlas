import { useState } from 'react';
import { courses } from '../content/catalog';
import { API, request, track, useLearner } from '../client/store';
import { atlasVersion, supportEmail } from '../content/product';
import { deviceClass } from '../client/analytics';
export default function Help() {
  const state = useLearner();
  const [kind, setKind] = useState('wrong-information');
  const [course, setCourse] = useState('');
  const [text, setText] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const support = supportEmail;
  async function submit() {
    setBusy(true);
    try {
      await request('/requests', {
        kind,
        course: course || undefined,
        message: text,
        contact: contact || undefined,
        route: '/help/',
        version: atlasVersion,
        device: deviceClass(),
      });
      setText('');
      setMessage('Request received. Thank you for helping improve atlas.');
      track('request_submitted', course || undefined);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1>
        Need something<span className="title-dot">?</span>
      </h1>
      <p className="lede">
        An incorrect date, missing material, or something that could work
        better.
      </p>
      <div className="help-layout">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label>
            What do you need?
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="wrong-information">
                Report wrong information
              </option>
              <option value="bug">Report a bug</option>
              <option value="feature">Request a feature</option>
              <option value="missing-material">
                Add missing class material
              </option>
              <option value="assignment-help">
                I need help with an assignment
              </option>
              <option value="course-resource">Request a course/resource</option>
            </select>
          </label>
          <label>
            Course
            <select value={course} onChange={(e) => setCourse(e.target.value)}>
              <option value="">General</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tell me a little more
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              minLength={10}
              maxLength={3000}
              required
              placeholder="What could be better? On a learning page, the ? control includes your location automatically."
            />
          </label>
          <label>
            Reply email (optional)
            <input
              type="email"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              maxLength={254}
              autoComplete="email"
            />
          </label>
          <button
            className="primary"
            disabled={!API || busy || state.connection === 'offline'}
            type="submit"
          >
            {busy ? 'Sending…' : 'Send request →'}
          </button>
          <p role="status" aria-live="polite">
            {message}
            {message.startsWith('Request received') && (
              <>
                {' '}
                For anything else, <a href={`mailto:${support}`}>{support}</a>.
              </>
            )}
          </p>
          {(!API || state.connection === 'offline') && (
            <div className="service-note">
              <p>
                The request inbox is currently unavailable. Your draft stays in
                this tab.
              </p>
              <a
                href={`mailto:${support}?subject=atlas%20help&body=${encodeURIComponent(text)}`}
              >
                Email atlas support ↗
              </a>
            </div>
          )}
        </form>
        <details className="settings-section">
          <summary>Using atlas</summary>
          <p>
            I'm taking these classes too. Check important dates with your
            teacher and keep the original handouts for assigned questions.
          </p>
          <p>
            Japanese AI help is for independent study. Follow the course rules
            for submitted work.
          </p>
          <a href="../about/">About atlas</a>
          <p>
            <a href={`mailto:${support}`}>{support}</a>
          </p>
          <p className="small">
            <a href="../privacy/">Privacy</a> ·{' '}
            <a href="../sources/">Sources</a>
          </p>
        </details>
      </div>
    </>
  );
}
