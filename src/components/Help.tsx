import { useState } from 'react';
import { courses } from '../content/catalog';
import { API, request, track, useLearner } from '../client/store';
export default function Help() {
  const state = useLearner();
  const [kind, setKind] = useState('wrong-information');
  const [course, setCourse] = useState('');
  const [text, setText] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const support = import.meta.env.PUBLIC_SUPPORT_EMAIL || '';
  async function submit() {
    setBusy(true);
    try {
      await request('/requests', {
        kind,
        course: course || undefined,
        message: text,
        contact: contact || undefined,
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
      <p className="eyebrow">HELP & CORRECTIONS</p>
      <h1>
        Need something<span className="title-dot">?</span>
      </h1>
      <p className="lede">
        A missing connection, an incorrect date, or something that could work
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
            Tell us a little more
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              minLength={10}
              maxLength={3000}
              required
              placeholder="Include the page and what needs correcting. Please leave out grades, private contact information and assessed answers."
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
          </p>
          {(!API || state.connection === 'offline') && (
            <div className="service-note">
              <p>
                The request inbox is currently unavailable. Your draft stays in
                this tab.
              </p>
              {support && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(support) ? (
                <a href={`mailto:${support}?subject=atlas%20help`}>
                  Email atlas support ↗
                </a>
              ) : (
                <a
                  href="https://github.com/jlsp124/atlas/issues/new"
                  target="_blank"
                  rel="noreferrer"
                >
                  Report a non-private issue on GitHub ↗
                </a>
              )}
              <p className="small muted">
                Use the public issue link only for non-private information.
              </p>
            </div>
          )}
        </form>
        <aside>
          <h2>Built in class, for class.</h2>
          <p>
            atlas is student-made and unofficial. It is not affiliated with the
            school, district or teachers.
          </p>
          <p>
            Verify important deadlines with teacher sources. The site labels
            where dates came from and when they were checked.
          </p>
          <p>
            Assignments here are original learning companions. Use your original
            teacher materials for requirements and submissions.
          </p>
          <p>
            Japanese assistance stays on the learning side; the course prohibits
            AI and translators for submitted class work.
          </p>
          <p className="small muted">
            Attachments are not accepted. No unsafe upload service is enabled.
          </p>
        </aside>
      </div>
    </>
  );
}
