import { useState } from 'react';
import { courses } from '../content/catalog';
import {
  API,
  deleteAccount,
  emit,
  exportProgress,
  importProgress,
  replayOnboarding,
  setAnalytics,
  signIn,
  signOut,
  synchronize,
  url,
  useLearner,
} from '../client/store';
export default function Account() {
  const state = useLearner();
  const [register, setRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bring, setBring] = useState(true);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [deletion, setDeletion] = useState(false);
  async function authenticate() {
    setBusy(true);
    setMessage('');
    try {
      await signIn(username, password, register, !state.user && bring);
      setPassword('');
      setMessage('Signed in. Progress is synced.');
    } catch (e) {
      setMessage(String((e as Error).message));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <p className="eyebrow">YOUR WORKSPACE</p>
      <h1>
        Make atlas yours<span className="title-dot">.</span>
      </h1>
      <div className="settings-grid">
        <section>
          <h2>Your courses</h2>
          <div className="course-picks">
            {courses.map((c) => (
              <label className="course-pick" key={c.id}>
                <input
                  type="checkbox"
                  disabled={!state.ready}
                  checked={state.selected.includes(c.id)}
                  onChange={(e) =>
                    emit('courses_selected', {
                      courses: e.target.checked
                        ? [...state.selected, c.id]
                        : state.selected.filter((x) => x !== c.id),
                    })
                  }
                />
                <span>
                  <strong>{c.title}</strong>
                  <small>{c.description}</small>
                </span>
              </label>
            ))}
          </div>
          <section className="settings-section">
            <h2>Reading & appearance</h2>
            <label>
              Theme
              <select
                disabled={!state.ready}
                value={state.theme}
                onChange={(e) =>
                  emit('theme_changed', {
                    theme: e.target.value as 'system' | 'light' | 'dark',
                  })
                }
              >
                <option value="system">Follow system</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
          </section>
          <section className="settings-section">
            <h2>Your local data</h2>
            <p>
              {state.events.length} learning events on this browser. An exported
              file lets you keep a backup.
            </p>
            <div className="button-row">
              <button className="secondary" onClick={exportProgress}>
                Export progress
              </button>
              <label className="file-label">
                Import progress
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f)
                      void importProgress(f)
                        .then(() => setMessage('Progress imported.'))
                        .catch((err) => setMessage(err.message));
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            <button
              className="quiet"
              onClick={() => {
                replayOnboarding();
                window.location.href = url();
              }}
            >
              Replay introduction
            </button>
            <p className="small muted">
              Shared computer? Sign out when you finish. Signed-in progress and
              guest progress use separate local stores.
            </p>
          </section>
          <section className="settings-section">
            <h2>Privacy</h2>
            <label className="check-line">
              <input
                type="checkbox"
                checked={state.analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
              />
              Share minimal aggregate usage to help improve atlas
            </label>
            <p className="small muted">
              Optional. No typed answers, search text, passwords, or private
              homework are sent to analytics.
            </p>
            <a href={url('privacy/')}>Read the privacy details ↗</a>
          </section>
        </section>
        <aside className="account-panel">
          <h2>
            {state.user
              ? `Hi, ${state.user.username}.`
              : 'A little more portable.'}
          </h2>
          <p>
            Accounts keep your course choices and learning evidence across
            devices. Guest mode works without one.
          </p>
          {state.user && state.connection !== 'sign-in' ? (
            <>
              <p className="badge">
                {state.connection === 'offline'
                  ? 'Sync offline · events queued'
                  : 'Signed in'}
              </p>
              <div className="button-row">
                <button
                  className="primary"
                  onClick={() => {
                    void synchronize().then(() =>
                      setMessage(
                        'Sync checked. Queued events are kept if service is offline.',
                      ),
                    );
                  }}
                >
                  Sync now
                </button>
                <button
                  className="quiet"
                  onClick={() => {
                    void signOut()
                      .then(() =>
                        setMessage(
                          'Signed out. Your guest workspace is restored.',
                        ),
                      )
                      .catch((e) => setMessage(e.message));
                  }}
                >
                  Sign out
                </button>
              </div>
              {state.user.role === 'admin' && (
                <a className="subtle-link" href={url('admin/')}>
                  Open admin →
                </a>
              )}
              <button
                className="quiet danger"
                onClick={() => setDeletion((d) => !d)}
              >
                Delete account
              </button>
              {deletion && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void deleteAccount(password)
                      .then(() => {
                        setPassword('');
                        setDeletion(false);
                        setMessage('Account and server learning data deleted.');
                      })
                      .catch((e) => setMessage(e.message));
                  }}
                >
                  <p>
                    This permanently deletes this account, server events,
                    sessions and account-linked requests. Your separate guest
                    store remains.
                  </p>
                  <label>
                    Confirm with your password
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </label>
                  <button className="secondary danger" type="submit">
                    Permanently delete my account
                  </button>
                </form>
              )}
            </>
          ) : API ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void authenticate();
              }}
            >
              {state.connection === 'sign-in' && (
                <p className="scope-note">
                  Your session expired. Sign in again to sync the events saved
                  on this device.
                </p>
              )}
              <div className="auth-tabs">
                <button
                  type="button"
                  disabled={!state.ready}
                  className={!register ? 'active' : ''}
                  onClick={() => setRegister(false)}
                >
                  Sign in
                </button>
                {!state.user && (
                  <button
                    type="button"
                    disabled={!state.ready}
                    className={register ? 'active' : ''}
                    onClick={() => setRegister(true)}
                  >
                    Create account
                  </button>
                )}
              </div>
              <label>
                Username
                <input
                  value={username}
                  disabled={!state.ready}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  minLength={3}
                  maxLength={32}
                  pattern="[A-Za-z0-9_]+"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  disabled={!state.ready}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={register ? 'new-password' : 'current-password'}
                  required
                  minLength={12}
                  maxLength={128}
                />
              </label>
              <p className="small muted">
                At least 12 characters. Use a unique password.
              </p>
              {!state.user && (
                <label className="check-line">
                  <input
                    type="checkbox"
                    checked={bring}
                    onChange={(e) => setBring(e.target.checked)}
                  />
                  Bring this device’s guest learning events into my account
                </label>
              )}
              <button className="primary" type="submit" disabled={busy}>
                {busy ? 'Connecting…' : register ? 'Create account' : 'Sign in'}
              </button>
              <p className="small muted">
                Password recovery is not available yet. Keep your password
                somewhere safe.
              </p>
            </form>
          ) : (
            <p className="service-note">
              Account sync has not been connected for this release. All guest
              learning features are available.
            </p>
          )}
          <p role="status" aria-live="polite">
            {message}
          </p>
        </aside>
      </div>
    </>
  );
}
